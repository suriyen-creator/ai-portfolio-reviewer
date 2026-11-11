import json
from unittest.mock import Mock, patch

import pytest
import requests

from evidence import fetch_github_profile, validate_analysis
from analysis import analyze


def test_github_timeout_keeps_successful_project_readme():
    responses = [Mock(status_code=200,json=lambda:{}),Mock(status_code=200,json=lambda:[{'name':'test'}]),
                 Mock(status_code=200,json=lambda:{'content':'aGk=', 'encoding':'base64'}), requests.Timeout()]
    with patch('evidence.requests.get',side_effect=responses):
        data = fetch_github_profile('person')
    assert data['status'] == 'partial'
    assert data['samples'][0]['readme_text'] == 'hi'
    assert data['samples'][0]['cicd'] is None


def test_service_error_keeps_factual_github_score():
    with patch('analysis.generate_json', side_effect=RuntimeError('do not expose credentials')):
        data=analyze('',{'score':55,'samples':[{'source_id':'github:demo','readme_text':'demo'}]}, {'competitions':[]}, 'EN','Software','fake')
    assert data['deep']['status'] == 'ai_unavailable'
    assert 'credentials' not in str(data)


def test_no_readme_means_no_ai_project_score():
    payload = {'project_score':90,'project_sources':['github:demo'],'inferred_skills':[], 'recommendations':[]}
    with patch('analysis.generate_json',return_value=json.dumps(payload)):
        data=analyze('',{'samples':[{'source_id':'github:demo','readme_text':''}]}, {'competitions':[]}, 'EN','Software','fake')
    assert data['deep']['project_score'] is None


def test_api_output_skill_basis_is_validated():
    payload = {'project_score':None,'inferred_skills':[{'skill':'Python','basis':'expert','sources':['resume']}], 'recommendations':[]}
    with pytest.raises(ValueError):
        validate_analysis(json.dumps(payload),'deep',{'resume'})


def test_null_project_score_still_validates_source_list():
    payload = {'project_score':None,'project_sources':42,'inferred_skills':[],'recommendations':[]}
    with pytest.raises(ValueError):
        validate_analysis(json.dumps(payload),'deep',{'github:demo'})


def test_resume_only_skill_remains_claimed():
    payload = {'project_score':None,'inferred_skills':[{'skill':'Python','basis':'observed','sources':['resume']}],'recommendations':[]}
    data = validate_analysis(json.dumps(payload),'deep',{'resume'})
    assert data['inferred_skills'][0]['basis']=='claimed'


def test_readme_link_uses_actual_github_file_url():
    url='https://github.com/person/test/blob/main/.github/README.rst'
    responses=[Mock(status_code=200,json=lambda:{}),Mock(status_code=200,json=lambda:[{'name':'test'}]),
               Mock(status_code=200,json=lambda:{'content':'aGk=','encoding':'base64','html_url':url}),Mock(status_code=404)]
    with patch('evidence.requests.get',side_effect=responses):
        data=fetch_github_profile('person')
    assert data['samples'][0]['readme_url']==url


def test_successful_review_preserves_zero_and_sanitizes_prose():
    resume={'score':0,'project_count':0,'clarity_level':'Low','weaknesses':['Missing project details']}
    deep={'project_score':0,'project_sources':['github:demo'],
          'inferred_skills':[{'skill':'Python','basis':'observed','sources':['resume']}],
          'recommendations':[{'text':'Review demo README 🧠','sources':['github:demo']}]}
    with patch('analysis.generate_json',side_effect=[json.dumps(resume),json.dumps(deep)]):
        data=analyze('Python',{'samples':[{'source_id':'github:demo','readme_text':'# Demo'}]}, {'competitions':[]}, 'EN','Software','fake')
    assert data['resume']['status']=='ok'
    assert data['resume']['score']==0
    assert data['deep']['project_score']==0
    assert data['deep']['inferred_skills'][0]['basis']=='claimed'
    assert data['deep']['recommendations'][0]['text']=='Review demo README'
