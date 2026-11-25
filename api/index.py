"""FastAPI entry point. On Vercel every /api/* request is routed here (see vercel.json)."""
import os
import sys
from pathlib import Path
from typing import Any, Literal

sys.path.insert(0, str(Path(__file__).resolve().parent / '_core'))

from fastapi import FastAPI, File, Form, HTTPException, UploadFile  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402

import analysis  # noqa: E402
import evidence  # noqa: E402
import store  # noqa: E402

app = FastAPI(title='Portfolio Review API', docs_url='/api/docs', openapi_url='/api/openapi.json')

Lang = Literal['TH', 'EN']
Track = Literal['Software', 'Data/ML']
MAX_PDF_BYTES = 4_000_000


class UsernameIn(BaseModel):
    username: str = Field(max_length=200)


class ReviewIn(BaseModel):
    github: dict[str, Any] = {}
    kaggle: dict[str, Any] = {}
    resume_text: str = Field('', max_length=60000)
    lang: Lang = 'TH'
    track: Track = 'Software'


class RoadmapIn(BaseModel):
    report: dict[str, Any]
    lang: Lang = 'TH'
    track: Track = 'Software'


class ReportIn(BaseModel):
    report: dict[str, Any]


def _username(value, platform):
    try:
        return evidence.normalize_username(value, platform)
    except ValueError:
        raise HTTPException(422, 'invalid_username')


def _cached(key, fetch):
    hit = store.cache_get(key)
    if hit is not None:
        return hit
    data = fetch()
    if data.get('status') in ('ok', 'partial', 'empty', 'not_found'):
        store.cache_set(key, data)
    return data


@app.get('/api/health')
def health():
    return {'ai': bool(os.environ.get('GEMINI_API_KEY')), 'share': store.enabled()}


@app.post('/api/github')
def github(body: UsernameIn):
    name = _username(body.username, 'github')
    if not name:
        return evidence.result('not_provided', samples=[])
    return _cached('github:' + name.lower(),
                   lambda: evidence.fetch_github_profile(name, os.environ.get('GITHUB_TOKEN', '')))


@app.post('/api/kaggle')
def kaggle(body: UsernameIn):
    name = _username(body.username, 'kaggle')
    if not name:
        return evidence.result('not_provided', competitions=[])
    return _cached('kaggle:' + name.lower(), lambda: evidence.fetch_kaggle_profile(name))


@app.post('/api/resume')
async def resume(file: UploadFile = File(...), lang: Lang = Form('TH'), track: Track = Form('Software')):
    data = await file.read(MAX_PDF_BYTES + 1)
    try:
        text = evidence.extract_resume_text(data)
    except ValueError as exc:
        return {'resume': evidence.result(str(exc)), 'resume_text': ''}
    review = analysis.review_resume(text, lang, track, os.environ.get('GEMINI_API_KEY', ''))
    return {'resume': review, 'resume_text': text}


@app.post('/api/review')
def review(body: ReviewIn):
    return analysis.review_deep(body.resume_text, body.github, body.kaggle, body.lang, body.track,
                                os.environ.get('GEMINI_API_KEY', ''))


@app.post('/api/roadmap')
def roadmap(body: RoadmapIn):
    return analysis.roadmap(body.report, body.lang, body.track, os.environ.get('GEMINI_API_KEY', ''))


def _strip_private(report):
    clean = dict(report)
    clean.pop('resume_text', None)
    github = dict(clean.get('github') or {})
    github['samples'] = [{k: v for k, v in s.items() if k != 'readme_text'} for s in github.get('samples', []) if isinstance(s, dict)]
    clean['github'] = github
    return clean


@app.post('/api/reports')
def create_report(body: ReportIn):
    try:
        report_id = store.save_report(_strip_private(body.report))
    except RuntimeError:
        raise HTTPException(503, 'storage_unconfigured')
    except ValueError:
        raise HTTPException(413, 'report_too_large')
    except Exception:
        raise HTTPException(502, 'storage_unavailable')
    return {'id': report_id}


@app.get('/api/reports/{report_id}')
def get_report(report_id: str):
    if not store.enabled():
        raise HTTPException(503, 'storage_unconfigured')
    try:
        report = store.load_report(report_id)
    except Exception:
        raise HTTPException(502, 'storage_unavailable')
    if report is None:
        raise HTTPException(404, 'not_found')
    return report
