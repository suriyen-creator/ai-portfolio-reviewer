"""Public evidence retrieval and scoring, independent of Streamlit and the LLM."""
import base64
from collections import Counter
from datetime import datetime, timedelta, timezone
from io import BytesIO
import json
import math
import re
from urllib.parse import urlsplit

import requests
from PyPDF2 import PdfReader

WEIGHTS = {
    'Software': {'github': .40, 'resume': .25, 'projects': .25, 'kaggle': .10},
    'Data/ML': {'github': .20, 'resume': .25, 'projects': .25, 'kaggle': .30},
}


def normalize_username(value, platform):
    value = value.strip()
    if not value:
        return ''
    host = 'kaggle.com' if platform == 'kaggle' else 'github.com'
    if value.startswith((host + '/', 'www.' + host + '/')):
        value = 'https://' + value
    if '://' in value:
        parsed = urlsplit(value)
        parts = parsed.path.strip('/').split('/')
        allowed_tail = ['competitions'] if platform == 'kaggle' else []
        if (parsed.scheme != 'https' or parsed.netloc not in (host, 'www.' + host)
                or len(parts) > 2 or (len(parts) == 2 and parts[1:] != allowed_tail)):
            raise ValueError('invalid_username')
        value = parts[0]
    pattern = r'[A-Za-z0-9_][A-Za-z0-9_-]{0,49}' if platform == 'kaggle' else r'[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?'
    reserved = {'competitions', 'datasets', 'code', 'models', 'rankings', 'settings', 'organizations', 'login'}
    if not re.fullmatch(pattern, value) or value.lower() in reserved:
        raise ValueError('invalid_username')
    return value


def result(status, url='', **data):
    return {'status': status, 'source_url': url, 'fetched_at': datetime.now(timezone.utc).isoformat(timespec='seconds'),
            'score': None, 'limitations': [], **data}


def http_status(code):
    return {404: 'not_found', 403: 'blocked', 429: 'rate_limited'}.get(code, 'unavailable')


def valid_score(value):
    return type(value) in (int, float) and math.isfinite(value) and 0 <= value <= 100


def kaggle_score(competitions):
    values = []
    seen = set()
    for row in competitions:
        rank, teams = row.get('rank'), row.get('teams')
        identity = row.get('url')
        if identity and identity in seen:
            continue
        if (row.get('completed') is True and row.get('final') is True
                and type(rank) is int and type(teams) is int and teams >= 2 and 1 <= rank <= teams):
            values.append(100 * (teams - rank) / (teams - 1))
            if identity:
                seen.add(identity)
    best = sorted(values, reverse=True)[:3]
    return sum(best) / len(best) if best else None


def weighted_score(scores, track):
    weights = {key: weight for key, weight in WEIGHTS[track].items() if valid_score(scores.get(key))}
    total = sum(weights.values())
    actual = {key: weight / total for key, weight in weights.items()} if total else {}
    return {'score': sum(scores[key] * weight for key, weight in actual.items()) if actual else None,
            'weights': actual, 'complete': len(actual) == 4}


def parse_kaggle_documents(payload, user_id):
    """Parse completed participant results from the public profile search response.

    Field mapping verified against Kaggle's own profile page on 2026-11-12.
    This website API is undocumented and must fail closed if its shape changes.
    """
    documents = payload.get('documents') if isinstance(payload, dict) else None
    if not isinstance(documents, list):
        raise ValueError('invalid_kaggle_response')
    rows = []
    for document in documents:
        if not isinstance(document, dict) or document.get('documentType') != 'COMPETITION' or document.get('isPrivate') is not False:
            continue
        data = document.get('competitionDocument')
        slug = document.get('slug')
        if (not isinstance(data, dict) or data.get('participantUserId') != user_id
                or data.get('ownerUserHasJoined') is not True or not isinstance(slug, str)
                or not re.fullmatch(r'[A-Za-z0-9_-]+', slug) or not isinstance(document.get('title'), str)):
            continue
        rank, teams = data.get('teamRank'), data.get('teamCount')
        if type(rank) is not int or rank < 1:
            rank = None
        if type(teams) is not int or teams < 1:
            teams = None
        deadline = data.get('deadline')
        try:
            completed = datetime.fromisoformat(deadline.replace('Z', '+00:00')) < datetime.now(timezone.utc)
        except (AttributeError, ValueError, TypeError):
            completed = False
            deadline = None
        medal = document.get('medal')
        rows.append({'title':document['title'], 'url':'https://www.kaggle.com/competitions/' + slug,
                     'rank':rank, 'teams':teams, 'medal':medal.lower() if medal in ('GOLD', 'SILVER', 'BRONZE') else None,
                     'date':deadline, 'completed':completed, 'final':completed, 'result_type':'team'})
    return rows


def fetch_kaggle_profile(value):
    username = normalize_username(value, 'kaggle')
    if not username:
        return result('not_provided', competitions=[])
    url = f'https://www.kaggle.com/{username}/competitions'
    rows, limitations = [], ['public_profile_only', 'kaggle_website_api']

    def read(method, payload):
        response = requests.post('https://www.kaggle.com/api/i/' + method, json=payload, timeout=15,
                                 allow_redirects=False, headers={'User-Agent':'PortfolioReviewer/1.0', 'Accept':'application/json'})
        if response.status_code != 200:
            return None, http_status(response.status_code)
        data = response.json()
        if not isinstance(data, dict):
            raise ValueError('invalid_kaggle_response')
        return data, None

    try:
        profile, error = read('users.ProfileService/GetProfile', {'userName':username})
        if error:
            return result(error, url, competitions=[], limitations=limitations)
        user_id = profile.get('userId')
        if type(user_id) is not int or user_id < 1 or str(profile.get('userName', '')).lower() != username.lower():
            return result('unavailable', url, competitions=[], limitations=limitations)
        payload = {'pageToken':'', 'pageSize':100, 'skip':0,
                   'competitionsOrderBy':'SEARCH_COMPETITIONS_ORDER_BY_TEAM_RANK',
                   'filters':{'query':'', 'documentTypes':['COMPETITION'], 'listType':'LIST_TYPE_USER_PROFILE',
                              'privacy':'PUBLIC', 'ownerType':'OWNER_TYPE_OWNS', 'tagIds':[], 'competitionIds':[],
                              'sharedViaGroups':[], 'ownerUserId':user_id,
                              'competitionFilters':{'role':'SEARCH_COMPETITIONS_ROLE_PARTICIPANT_ONLY',
                                                    'status':'SEARCH_COMPETITIONS_STATUS_COMPLETE',
                                                    'profileVisibility':'SEARCH_COMPETITIONS_PROFILE_VISIBILITY_VISIBLE'}}}
        seen_tokens = set()
        for _ in range(10):
            page, error = read('search.SearchContentService/ListSearchContent', payload)
            if error:
                if not rows:
                    return result(error, url, competitions=[], limitations=limitations)
                limitations.append('kaggle_partial')
                break
            # Protobuf omits default fields for a profile with no competition history.
            if page == {} and not profile.get('totalCompetitions') and not rows:
                return result('empty', url, competitions=[], limitations=limitations)
            parsed = parse_kaggle_documents(page, user_id)
            if len(parsed) != len(page['documents']):
                limitations.append('kaggle_partial')
            rows.extend(parsed)
            token = page.get('nextPageToken', '')
            if not isinstance(token, str):
                raise ValueError('invalid_kaggle_response')
            total = page.get('totalDocuments')
            if type(total) is not int or total < 0:
                raise ValueError('invalid_kaggle_response')
            if not rows and total == 0 and not page['documents'] and not token:
                return result('empty', url, competitions=[], limitations=limitations)
            if not token:
                if len(rows) < total:
                    limitations.append('kaggle_partial')
                break
            if token in seen_tokens or not page['documents']:
                limitations.append('kaggle_partial')
                break
            seen_tokens.add(token)
            payload['pageToken'] = token
        else:
            limitations.append('kaggle_partial')
    except (requests.RequestException, ValueError, TypeError, KeyError):
        if not rows:
            return result('unavailable', url, competitions=[], limitations=limitations)
        limitations.append('kaggle_partial')
    unique = {row['url']:row for row in rows}
    rows = list(unique.values())
    status = 'unavailable' if not rows else 'partial' if 'kaggle_partial' in limitations else 'ok'
    return result(status, url,
                  competitions=rows, score=kaggle_score(rows), limitations=sorted(set(limitations)))


def fetch_github_profile(value, token=''):
    username = normalize_username(value, 'github')
    if not username:
        return result('not_provided', samples=[])
    url = f'https://github.com/{username}'
    headers = {'User-Agent': 'PortfolioReviewer/1.0', 'Accept': 'application/vnd.github+json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'

    def get(path):
        return requests.get('https://api.github.com' + path, headers=headers, timeout=10, allow_redirects=False)

    try:
        profile = get(f'/users/{username}')
        if profile.status_code != 200:
            return result(http_status(profile.status_code), url, samples=[])
        profile_data = profile.json()
        response = get(f'/users/{username}/repos?per_page=100&sort=updated')
        if response.status_code != 200:
            return result(http_status(response.status_code), url, samples=[])
        repos = response.json()
        if not isinstance(profile_data, dict) or not isinstance(repos, list) or any(not isinstance(r, dict) for r in repos):
            return result('unavailable', url, samples=[])
        cutoff = datetime.now(timezone.utc) - timedelta(days=90)
        active = sum(datetime.fromisoformat(r['updated_at'].replace('Z', '+00:00')) >= cutoff for r in repos if r.get('updated_at'))
        stars = sum(r.get('stargazers_count', 0) for r in repos)
        languages = Counter(r['language'] for r in repos if r.get('language'))
        samples, limitations = [], []
        if profile_data.get('public_repos', len(repos)) > len(repos):
            limitations.append('github_sampled')
        for repo in repos[:5]:
            name = repo.get('name', '')
            if not re.fullmatch(r'[A-Za-z0-9_.-]+', name):
                continue
            repo_url = f'https://github.com/{username}/{name}'
            sample = {'name': name, 'source_id': f'github:{name}', 'source_url': repo_url,
                      'language': repo.get('language'), 'description': repo.get('description'),
                      'readme': None, 'readme_text': '', 'readme_url': repo_url + '/blob/HEAD/README.md',
                      'cicd': None, 'workflow_url': repo_url + '/tree/HEAD/.github/workflows',
                      'deployment': 'configured' if repo.get('homepage') else None,
                      'api_usage': None, 'fork': bool(repo.get('fork'))}
            for kind, path in [('readme', '/readme'), ('cicd', '/contents/.github/workflows')]:
                try:
                    file_response = get(f'/repos/{username}/{name}{path}')
                    if file_response.status_code == 404:
                        sample[kind] = False
                    elif file_response.status_code == 200:
                        body = file_response.json()
                        if kind == 'readme' and isinstance(body, dict) and body.get('encoding') == 'base64':
                            sample['readme_text'] = base64.b64decode(body.get('content', '')).decode('utf-8', errors='replace')[:12000]
                            readme_url = body.get('html_url', '')
                            if (isinstance(readme_url, str) and urlsplit(readme_url).scheme == 'https'
                                    and urlsplit(readme_url).netloc == 'github.com'
                                    and urlsplit(readme_url).path.startswith(f'/{username}/{name}/blob/')):
                                sample['readme_url'] = readme_url
                            sample[kind] = True
                        elif kind == 'cicd' and isinstance(body, list):
                            sample[kind] = any(isinstance(f, dict) and f.get('type') == 'file' and str(f.get('name', '')).endswith(('.yml', '.yaml')) for f in body)
                        else:
                            limitations.append('github_files_unavailable')
                    else:
                        limitations.append('github_files_unavailable')
                except (requests.RequestException, ValueError):
                    limitations.append('github_files_unavailable')
            samples.append(sample)
        score = min(len(repos) * 5, 40) + min(active * 15, 40) + min(stars * 5, 20)
        return result('partial' if limitations else 'ok', url, score=score, repos_count=len(repos), stars=stars,
                      active_projects=active, top_languages=languages.most_common(3), samples=samples,
                      limitations=sorted(set(limitations)))
    except (requests.RequestException, ValueError, TypeError, KeyError):
        return result('unavailable', url, samples=[])


def extract_resume_text(data):
    if len(data) > 10_000_000:
        raise ValueError('pdf_too_large')
    try:
        reader = PdfReader(BytesIO(data))
        if len(reader.pages) > 30:
            raise ValueError('pdf_too_many_pages')
        text = '\n'.join(page.extract_text() or '' for page in reader.pages).strip()
        if not text:
            raise ValueError('pdf_no_text')
        if len(text) > 60000:
            raise ValueError('pdf_too_much_text')
        return text
    except Exception as exc:
        if isinstance(exc, ValueError) and str(exc).startswith('pdf_'):
            raise
        raise ValueError('pdf_unreadable') from exc


def _strings(value, maximum=6):
    return isinstance(value, list) and len(value) <= maximum and all(isinstance(v, str) and len(v) <= 1200 for v in value)


def validate_analysis(raw, kind, source_ids=None):
    raw = raw.strip()
    if raw.startswith('```'):
        raw = re.sub(r'^```(?:json)?\s*|\s*```$', '', raw)
    data = json.loads(raw)
    if not isinstance(data, dict):
        raise ValueError('invalid_analysis')
    if kind == 'resume':
        if (not valid_score(data.get('score')) or type(data.get('project_count')) is not int
                or data['project_count'] < 0 or data.get('clarity_level') not in ('High', 'Medium', 'Low')
                or not _strings(data.get('weaknesses'))):
            raise ValueError('invalid_analysis')
        return data
    sources = set(source_ids or [])
    if data.get('project_score') is not None and not valid_score(data['project_score']):
        raise ValueError('invalid_analysis')
    skills, recs = data.get('inferred_skills'), data.get('recommendations')
    if not isinstance(skills, list) or len(skills) > 20 or not isinstance(recs, list) or len(recs) > 6:
        raise ValueError('invalid_analysis')
    for item in skills + recs:
        if not isinstance(item, dict) or not _strings(item.get('sources'), 10) or not item['sources'] or not set(item['sources']) <= sources:
            raise ValueError('invalid_sources')
    for skill in skills:
        if not isinstance(skill.get('skill'), str) or len(skill['skill']) > 100 or skill.get('basis') not in ('observed', 'claimed'):
            raise ValueError('invalid_skill')
        if set(skill['sources']) == {'resume'}:
            skill['basis'] = 'claimed'
    project_sources = data.get('project_sources', [])
    if not _strings(project_sources, 5) or not set(project_sources) <= {s for s in sources if s.startswith('github:')}:
        raise ValueError('invalid_project_sources')
    data['project_sources'] = project_sources
    for rec in recs:
        if not isinstance(rec.get('text'), str) or not 1 <= len(rec['text']) <= 1200:
            raise ValueError('invalid_recommendation')
    if data.get('project_score') is not None and not project_sources:
        raise ValueError('invalid_project_sources')
    return data
