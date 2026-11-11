import json
from unittest.mock import Mock, patch

import pytest
import requests

from evidence import (normalize_username,
                      kaggle_score, weighted_score, fetch_github_profile,
                      validate_analysis, extract_resume_text)


def competition(rank=1, teams=100, completed=True, final=True):
    return {'rank': rank, 'teams': teams, 'completed': completed, 'final': final}


@pytest.mark.parametrize('value,expected', [('giba','giba'), ('https://www.kaggle.com/giba/competitions','giba'), ('kaggle.com/giba','giba'), ('','')])
def test_kaggle_username(value, expected):
    assert normalize_username(value, 'kaggle') == expected


@pytest.mark.parametrize('value', ['https://evil.test/giba', 'https://kaggle.com.evil.test/giba', '../foo', 'https://kaggle.com/competitions/titanic', 'https://user@kaggle.com/giba', 'https://kaggle.com:444/giba'])
def test_reject_non_profile_urls(value):
    with pytest.raises(ValueError):
        normalize_username(value, 'kaggle')


def test_rank_formula_best_three_and_missing():
    assert kaggle_score([competition()]) == 100
    assert kaggle_score([competition(100)]) == 0
    assert kaggle_score([competition(2, 1), competition(completed=False), competition(final=False)]) is None
    assert kaggle_score([competition(1, 11), competition(2, 11), competition(3, 11), competition(11, 11)]) == 90


@pytest.mark.parametrize('track,expected', [('Software', 67.5), ('Data/ML', 47.5)])
def test_track_weights(track, expected):
    result = weighted_score({'github':100,'resume':50,'projects':60,'kaggle':0}, track)
    assert result['score'] == expected
    assert result['complete'] is True


def test_missing_score_and_real_zero():
    result = weighted_score({'github':0,'resume':100,'projects':None,'kaggle':None}, 'Software')
    assert result['score'] == pytest.approx(100 * 25 / 65)
    assert result['weights']['github'] == pytest.approx(40 / 65)
    assert not result['complete']
    assert weighted_score({}, 'Software')['score'] is None


def test_github_checks_real_files_and_keeps_partial_repo_failure():
    responses = [Mock(status_code=200, json=lambda: {'public_repos':1}),
                 Mock(status_code=200, json=lambda: [{'name':'demo','updated_at':'2025-01-01T00:00:00Z','language':'Python','stargazers_count':2,'homepage':'https://demo.example','default_branch':'main'}]),
                 Mock(status_code=200, json=lambda: {'content':'IyBEZW1v','encoding':'base64','html_url':'https://github.com/person/demo/blob/main/README.md'}),
                 Mock(status_code=403)]
    with patch('evidence.requests.get', side_effect=responses):
        result = fetch_github_profile('person')
    assert result['status'] == 'partial'
    assert result['samples'][0]['readme'] is True
    assert result['samples'][0]['cicd'] is None
    assert result['samples'][0]['api_usage'] is None
    assert result['score'] is not None


def test_bad_github_repo_response_does_not_score_zero():
    with patch('evidence.requests.get', side_effect=[Mock(status_code=200,json=lambda:{}),Mock(status_code=429)]):
        result = fetch_github_profile('person')
    assert result['status'] == 'rate_limited'
    assert result['score'] is None


def test_llm_validation_rejects_invalid_types_and_unfounded_sources():
    valid={'score':60,'project_count':1,'clarity_level':'Medium','weaknesses':[]}
    assert validate_analysis(json.dumps(valid), 'resume')['score'] == 60
    for score in [True, '60', 101, float('nan')]:
        with pytest.raises(ValueError):
            validate_analysis(json.dumps({**valid,'score':score}), 'resume')
    with pytest.raises(ValueError):
        validate_analysis('{"project_score":80,"inferred_skills":[],"recommendations":[{"text":"good","sources":["fake"]}]}', 'deep', {'github:demo'})


def test_malformed_pdf_is_reported():
    with pytest.raises(ValueError):
        extract_resume_text(b'not a pdf')
