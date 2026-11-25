"""Optional Upstash Redis (REST) storage for evidence caching and shared reports.

Every function is a no-op when UPSTASH_REDIS_REST_URL / _TOKEN are not configured,
so the app keeps working locally and on Vercel without a database.
"""
import json
import os
import re
import secrets

import requests

REPORT_TTL = 30 * 24 * 3600
CACHE_TTL = 3600
REPORT_ID = re.compile(r'[A-Za-z0-9_-]{8,16}')
MAX_REPORT_BYTES = 400_000


def _config():
    url = os.environ.get('UPSTASH_REDIS_REST_URL') or os.environ.get('KV_REST_API_URL', '')
    token = os.environ.get('UPSTASH_REDIS_REST_TOKEN') or os.environ.get('KV_REST_API_TOKEN', '')
    return (url.rstrip('/'), token) if url and token else (None, None)


def enabled():
    return _config()[0] is not None


def _command(*args):
    url, token = _config()
    if not url:
        return None
    response = requests.post(url, json=list(args), headers={'Authorization': f'Bearer {token}'}, timeout=5)
    response.raise_for_status()
    return response.json().get('result')


def cache_get(key):
    try:
        raw = _command('GET', 'cache:' + key)
        return json.loads(raw) if raw else None
    except (requests.RequestException, ValueError):
        return None


def cache_set(key, value):
    try:
        _command('SET', 'cache:' + key, json.dumps(value, ensure_ascii=False), 'EX', CACHE_TTL)
    except (requests.RequestException, ValueError):
        pass


def save_report(report):
    if not enabled():
        raise RuntimeError('storage_unconfigured')
    body = json.dumps(report, ensure_ascii=False)
    if len(body.encode()) > MAX_REPORT_BYTES:
        raise ValueError('report_too_large')
    report_id = secrets.token_urlsafe(8)
    _command('SET', 'report:' + report_id, body, 'EX', REPORT_TTL, 'NX')
    return report_id


def load_report(report_id):
    if not REPORT_ID.fullmatch(report_id or ''):
        return None
    raw = _command('GET', 'report:' + report_id)
    return json.loads(raw) if raw else None
