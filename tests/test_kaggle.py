from copy import deepcopy
import json
from pathlib import Path
from unittest.mock import Mock, patch

import pytest
import requests

from evidence import parse_kaggle_documents, fetch_kaggle_profile, kaggle_score

FIXTURE = json.loads((Path(__file__).parent / 'fixtures/kaggle-search.json').read_text())
PROFILE = {'userId':5309, 'userName':'abhishek', 'totalCompetitions':229}


def response(body, code=200):
    return Mock(status_code=code,json=lambda:body)


def test_observed_public_response_parses_team_result():
    rows = parse_kaggle_documents(FIXTURE, 5309)
    assert len(rows) == 1
    assert rows[0]['rank'] == 2 and rows[0]['teams'] == 2221
    assert rows[0]['medal'] == 'gold'
    assert rows[0]['date'] == '2015-10-19T23:59:00Z'
    assert rows[0]['url'] == 'https://www.kaggle.com/competitions/springleaf-marketing-response'
    assert kaggle_score(rows) == pytest.approx(100 * 2219 / 2220)


@pytest.mark.parametrize('field,value', [('participantUserId',999),('ownerUserHasJoined',False)])
def test_other_users_or_hosted_only_results_are_rejected(field,value):
    data=deepcopy(FIXTURE)
    data['documents'][0]['competitionDocument'][field]=value
    assert parse_kaggle_documents(data,5309) == []


def test_missing_rank_and_future_deadline_are_displayed_but_not_scored():
    data=deepcopy(FIXTURE)
    doc=data['documents'][0]['competitionDocument']
    doc.pop('teamRank')
    rows=parse_kaggle_documents(data,5309)
    assert len(rows) == 1 and rows[0]['rank'] is None
    assert kaggle_score(rows) is None
    doc['teamRank']=2
    doc['deadline']='2099-01-01T00:00:00Z'
    assert kaggle_score(parse_kaggle_documents(data,5309)) is None


def test_successful_fetch_uses_verified_profile_id_and_public_participant_filter():
    payloads=[]
    def post(url, **kwargs):
        payloads.append((url,kwargs['json']))
        return response(PROFILE if url.endswith('/GetProfile') else FIXTURE)
    with patch('evidence.requests.post',side_effect=post):
        data=fetch_kaggle_profile('abhishek')
    assert data['status'] == 'ok'
    assert data['score'] is not None
    search=payloads[1][1]
    assert search['filters']['ownerUserId']==5309
    assert search['filters']['privacy']=='PUBLIC'
    assert search['filters']['competitionFilters']['role']=='SEARCH_COMPETITIONS_ROLE_PARTICIPANT_ONLY'


def test_paginated_results_keep_first_page_if_next_page_fails():
    page=deepcopy(FIXTURE)
    page['nextPageToken']='next'
    page['totalDocuments']=2
    with patch('evidence.requests.post',side_effect=[response(PROFILE),response(page),requests.Timeout()]):
        data=fetch_kaggle_profile('abhishek')
    assert data['status']=='partial'
    assert len(data['competitions'])==1
    assert 'kaggle_partial' in data['limitations']


def test_explicit_empty_is_different_from_invalid_response():
    for body,status in [({'documents':[],'totalDocuments':0},'empty'), ({},'unavailable'), ({'documents':'changed'},'unavailable')]:
        with patch('evidence.requests.post',side_effect=[response(PROFILE),response(body)]):
            assert fetch_kaggle_profile('abhishek')['status']==status


@pytest.mark.parametrize('code,status', [(404,'not_found'),(403,'blocked'),(429,'rate_limited'),(500,'unavailable'),(302,'unavailable')])
def test_http_failures(code,status):
    with patch('evidence.requests.post',return_value=response({},code)):
        assert fetch_kaggle_profile('abhishek')['status']==status


def test_profile_identity_mismatch_is_never_used():
    with patch('evidence.requests.post',return_value=response(PROFILE)):
        assert fetch_kaggle_profile('anotherperson')['status']=='unavailable'


def test_invalid_documents_never_become_empty_history():
    with patch('evidence.requests.post',side_effect=[response(PROFILE),response({'documents':[{'title':'changed'}],'totalDocuments':1})]):
        data=fetch_kaggle_profile('abhishek')
    assert data['status']=='unavailable'
    assert data['score'] is None


def test_page_token_does_not_also_skip_results():
    first=deepcopy(FIXTURE)
    first['totalDocuments']=2
    first['nextPageToken']='page-two'
    second=deepcopy(FIXTURE)
    second['documents'][0]['slug']='second-result'
    second['totalDocuments']=2
    payloads=[]
    responses=iter([response(PROFILE), response(first), response(second)])
    def post(url, **kwargs):
        payloads.append(deepcopy(kwargs['json']))
        return next(responses)
    with patch('evidence.requests.post',side_effect=post):
        data=fetch_kaggle_profile('abhishek')
    assert payloads[2]['pageToken']=='page-two'
    assert payloads[2]['skip']==0
    assert data['status']=='ok'
    assert len(data['competitions'])==2


def test_proto_default_empty_only_when_profile_has_no_competitions():
    empty_profile={'userName':'abhishek','userId':5309}
    with patch('evidence.requests.post',side_effect=[response(empty_profile),response({})]):
        data=fetch_kaggle_profile('abhishek')
    assert data['status']=='empty'
    assert data['score'] is None
