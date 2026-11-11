import json
from unittest.mock import patch
from pathlib import Path

APP = str(Path(__file__).resolve().parents[1] / 'app.py')

from streamlit.testing.v1 import AppTest


def test_initial_screen_and_empty_submit():
    app = AppTest.from_file(APP).run()
    assert not app.exception
    assert any('Kaggle' in field.label for field in app.text_input)
    app.button[0].click().run()
    assert app.warning
    assert not app.exception


def test_results_survive_language_change_without_repeating_fetch():
    github = {'status':'ok','score':50,'source_url':'https://github.com/person','fetched_at':'2026-11-12T00:00:00+00:00', 'limitations':[], 'samples':[], 'repos_count':2,'stars':0,'active_projects':1,'top_languages':[('Python',2)]}
    with patch('evidence.fetch_github_profile', return_value=github) as fetch:
        app = AppTest.from_file(APP).run()
        app.text_input[0].set_value('person')
        app.button[0].click().run()
        assert not app.exception
        assert app.session_state['report']['github']['score'] == 50
        calls = fetch.call_count
        app.selectbox(key='language').select('EN').run()
        assert app.selectbox(key='language').value == 'EN'
        assert app.text_input[0].value == 'person'
        assert not app.exception
        assert app.session_state['report']['github']['score'] == 50
        assert fetch.call_count == calls
        assert any('50.0' in m.value for m in app.metric)


def test_llm_malformed_output_becomes_visible_status():
    from analysis import analyze
    with patch('analysis.generate_json', return_value='{"score": "oops"}'):
        result = analyze('resume text', {'samples':[]}, {'competitions':[]}, 'TH', 'Software', 'fake')
    assert result['resume']['status'] == 'invalid_response'
    assert result['deep']['status'] == 'invalid_response'


def test_llm_is_not_called_for_no_evidence():
    from analysis import analyze
    with patch('analysis.generate_json') as generate:
        analyze('', {'samples':[]}, {'competitions':[]}, 'TH', 'Software', 'fake')
    generate.assert_not_called()


def test_language_retains_candidate_and_selected_track():
    app = AppTest.from_file(APP).run()
    app.text_input[0].set_value('person')
    app.text_input[1].set_value('candidate')
    app.selectbox[0].select('Data/ML')
    app.selectbox(key='language').select('EN').run()
    assert app.text_input[0].value == 'person'
    assert app.text_input[1].value == 'candidate'
    assert app.selectbox(key='review_track').value == 'Data/ML'
