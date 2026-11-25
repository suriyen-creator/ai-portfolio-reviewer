import json
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from api.index import app, _strip_private
import store

client = TestClient(app)
GITHUB = {'status':'ok','score':50,'samples':[{'source_id':'github:demo','name':'demo','readme_text':'secret readme'}]}
ROADMAP = {'phases':[{'window':w,'goals':[{'text':'Add tests to demo','sources':['github:demo']}]} for w in ('30','60','90')],
           'project_ideas':[{'title':'CLI tool','why':'Shows packaging','skills':['Python']}]}


@pytest.fixture(autouse=True)
def no_env(monkeypatch):
    for name in ('GEMINI_API_KEY','GITHUB_TOKEN','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','KV_REST_API_URL','KV_REST_API_TOKEN'):
        monkeypatch.delenv(name, raising=False)


def test_health_reports_configuration():
    assert client.get('/api/health').json() == {'ai': False, 'share': False}


def test_github_rejects_bad_username():
    assert client.post('/api/github', json={'username':'https://evil.com/x'}).status_code == 422


def test_github_empty_is_not_provided():
    assert client.post('/api/github', json={'username':' '}).json()['status'] == 'not_provided'


def test_github_uses_fetch_and_cache_miss_without_redis():
    with patch('evidence.fetch_github_profile', return_value=GITHUB) as fetch:
        data = client.post('/api/github', json={'username':'https://github.com/demo'}).json()
    fetch.assert_called_once_with('demo', '')
    assert data['score'] == 50


def test_kaggle_route():
    with patch('evidence.fetch_kaggle_profile', return_value={'status':'empty','competitions':[]}) as fetch:
        assert client.post('/api/kaggle', json={'username':'person'}).json()['status'] == 'empty'
    fetch.assert_called_once_with('person')


def test_resume_bad_pdf_reports_status():
    data = client.post('/api/resume', files={'file':('cv.pdf', b'nope', 'application/pdf')}).json()
    assert data['resume']['status'] == 'pdf_unreadable' and data['resume_text'] == ''


def test_resume_too_large():
    data = client.post('/api/resume', files={'file':('cv.pdf', b'0' * 4_000_001, 'application/pdf')}).json()
    assert data['resume']['status'] == 'pdf_too_large'


def test_review_without_key_is_unconfigured():
    data = client.post('/api/review', json={'github':GITHUB}).json()
    assert data['status'] == 'ai_unconfigured'


def test_review_rejects_unknown_track():
    assert client.post('/api/review', json={'track':'Sales'}).status_code == 422


def test_roadmap_ok_and_sources_validated(monkeypatch):
    monkeypatch.setenv('GEMINI_API_KEY', 'fake')
    report = {'github':GITHUB, 'resume':{'status':'not_provided'}, 'deep':{'status':'not_provided'}, 'kaggle':{}}
    with patch('analysis.generate_json', return_value=json.dumps(ROADMAP)) as generate:
        data = client.post('/api/roadmap', json={'report':report}).json()
    assert data['status'] == 'ok' and len(data['phases']) == 3
    assert 'secret readme' not in generate.call_args[0][0]
    bad = {**ROADMAP, 'phases':[{'window':w,'goals':[{'text':'x','sources':['made-up']}]} for w in ('30','60','90')]}
    with patch('analysis.generate_json', return_value=json.dumps(bad)):
        assert client.post('/api/roadmap', json={'report':report}).json()['status'] == 'invalid_response'


def test_roadmap_requires_three_ordered_phases(monkeypatch):
    monkeypatch.setenv('GEMINI_API_KEY', 'fake')
    report = {'github':GITHUB}
    with patch('analysis.generate_json', return_value=json.dumps({**ROADMAP, 'phases':ROADMAP['phases'][:2]})):
        assert client.post('/api/roadmap', json={'report':report}).json()['status'] == 'invalid_response'


def test_roadmap_without_findings():
    assert client.post('/api/roadmap', json={'report':{}}).json()['status'] == 'ai_unconfigured'


def test_reports_need_storage():
    assert client.post('/api/reports', json={'report':{'a':1}}).status_code == 503
    assert client.get('/api/reports/abcdefgh').status_code == 503


def test_shared_report_drops_private_text():
    clean = _strip_private({'resume_text':'raw cv', 'github':GITHUB})
    assert 'raw cv' not in json.dumps(clean) and 'secret readme' not in json.dumps(clean)


def test_report_roundtrip_with_fake_redis(monkeypatch):
    monkeypatch.setenv('UPSTASH_REDIS_REST_URL', 'https://redis.example')
    monkeypatch.setenv('UPSTASH_REDIS_REST_TOKEN', 't')
    db = {}

    def command(*args):
        if args[0] == 'SET':
            db[args[1]] = args[2]
            return 'OK'
        return db.get(args[1])
    with patch('store._command', side_effect=command):
        report_id = client.post('/api/reports', json={'report':{'track':'Software','resume_text':'raw'}}).json()['id']
        data = client.get('/api/reports/' + report_id).json()
        assert data['track'] == 'Software' and 'resume_text' not in data
        assert client.get('/api/reports/doesnotexist').status_code == 404
        assert client.get('/api/reports/bad!id').status_code == 404


def test_report_id_validation():
    assert store.load_report('../etc') is None
