import os

import streamlit as st

import evidence
from analysis import analyze

st.set_page_config(page_title='Portfolio Review', layout='wide')


def secret(name):
    try:
        return st.secrets.get(name, os.environ.get(name, ''))
    except st.errors.StreamlitSecretNotFoundError:
        return os.environ.get(name, '')


@st.cache_data(ttl=3600, show_spinner=False, max_entries=128)
def github_data(username, token):
    return evidence.fetch_github_profile(username, token)


@st.cache_data(ttl=3600, show_spinner=False, max_entries=128)
def kaggle_data(username):
    return evidence.fetch_kaggle_profile(username)


lang = st.sidebar.selectbox('Language / ภาษา', ['TH', 'EN'], key='language')


def tr(th, en):
    return th if lang == 'TH' else en


STATUS = {
    'ok': ('ตรวจข้อมูลได้', 'Available'),
    'partial': ('ตรวจข้อมูลได้บางส่วน', 'Partial evidence'),
    'not_provided': ('ไม่ได้ระบุข้อมูล', 'Not provided'),
    'empty': ('ไม่พบประวัติที่แสดงบนโปรไฟล์', 'No results displayed on the public profile'),
    'not_found': ('ไม่พบโปรไฟล์ที่ URL นี้ โปรดตรวจลิงก์', 'Profile not found at this URL; check the link'),
    'blocked': ('เว็บไซต์ไม่อนุญาตให้เข้าถึง ลองเปิดลิงก์ต้นทาง', 'Access denied; check the source page'),
    'rate_limited': ('ถึงขีดจำกัดการเรียกข้อมูล กรุณาลองใหม่ภายหลัง', 'Rate limit reached; try again later'),
    'unavailable': ('ยังอ่านข้อมูลไม่ได้ ลองตรวจที่แหล่งข้อมูลโดยตรง', 'Unable to read evidence; check the source directly'),
    'ai_unconfigured': ('ยังไม่ได้ตั้งค่า GEMINI_API_KEY จึงยังไม่มีคำรีวิวจาก AI', 'Set GEMINI_API_KEY to enable the written review'),
    'ai_unavailable': ('บริการรีวิวไม่พร้อมใช้งาน ลองวิเคราะห์ใหม่ภายหลัง', 'Review service unavailable; try again later'),
    'invalid_response': ('บริการรีวิวส่งข้อมูลไม่ครบ จึงยังไม่นำมาคิดคะแนน', 'Review response was invalid and excluded from scoring'),
    'pdf_unreadable': ('อ่าน PDF ไม่ได้ กรุณาตรวจไฟล์หรือส่งไฟล์ที่ไม่เข้ารหัส', 'Cannot read this PDF; check the file or use an unencrypted copy'),
    'pdf_no_text': ('PDF ไม่มีข้อความที่อ่านได้ กรุณาใช้ไฟล์ที่เลือกข้อความได้', 'No extractable text; use a text-based PDF'),
    'pdf_too_large': ('ไฟล์ PDF ต้องไม่เกิน 10 MB', 'PDF must be at most 10 MB'),
    'pdf_too_many_pages': ('PDF ต้องไม่เกิน 30 หน้า', 'PDF must be at most 30 pages'),
    'pdf_too_much_text': ('ข้อความใน PDF ยาวเกิน 60,000 ตัวอักษร', 'PDF text exceeds 60,000 characters'),
}
LIMITS = {
    'public_profile_only': ('ประวัติที่ซ่อนหรือไม่เปิดเผยจะไม่รวมในรายงาน', 'Hidden or private history is not included.'),
    'kaggle_website_api': ('ดึงจากข้อมูลสาธารณะของเว็บไซต์ Kaggle ซึ่งอาจเปลี่ยนรูปแบบหรือจำกัดการเข้าถึงได้ แสดงเฉพาะประวัติที่เปิดเผยของการแข่งขันที่จบแล้ว', 'Read from Kaggle’s public website interface, which may change or restrict access. Only visible results from completed competitions are included.'),
    'kaggle_partial': ('ประวัติการแข่งขันอ่านได้ไม่ครบ คะแนนใช้เฉพาะผลที่ดึงได้', 'Competition history is incomplete; scores use only the retrieved results.'),
    'github_sampled': ('สถิติใช้ repo ที่อัปเดตล่าสุดสูงสุด 100 รายการ', 'Statistics cover at most the 100 most recently updated public repositories.'),
    'github_files_unavailable': ('ไฟล์บางส่วนอ่านไม่ได้ สถานะนั้นจึงยังยืนยันไม่ได้', 'Some repository files were inaccessible; their status remains unverified.'),
}
LABELS = {'github':'GitHub', 'resume':'Resume', 'projects':tr('โปรเจกต์', 'Projects'), 'kaggle':'Kaggle'}


def status_text(code):
    return tr(*STATUS.get(code, STATUS['unavailable']))


def source_footer(data):
    if data.get('source_url'):
        st.link_button(tr('เปิดแหล่งข้อมูล', 'Open source'), data['source_url'])
    if data.get('fetched_at'):
        st.caption(tr('ตรวจเมื่อ ', 'Checked at ') + data['fetched_at'])
    for code in data.get('limitations', []):
        if code in LIMITS:
            st.caption(tr(*LIMITS[code]))


def check_text(value):
    return tr('พบไฟล์', 'File found') if value is True else tr('ไม่พบไฟล์', 'File not found') if value is False else tr('ยังยืนยันไม่ได้', 'Unverified')


st.sidebar.caption(tr('ข้อมูลสาธารณะเก็บใน cache 1 ชั่วโมง Resume และคำรีวิวเก็บเฉพาะ session นี้',
                      'Public evidence is cached for one hour. Resume text and written reviews stay in this session.'))
st.title('Portfolio Review')
st.write(tr('ดูผลงานและประสบการณ์จาก GitHub, Resume และ Kaggle พร้อมหลักฐานที่ตรวจต่อได้',
            'Review GitHub, resume and Kaggle work, with sources you can inspect.'))

with st.container(border=True):
    left, right = st.columns(2)
    with left:
        git_user = st.text_input(tr('GitHub username หรือลิงก์โปรไฟล์', 'GitHub username or profile URL'), key='github_username')
        kaggle_user = st.text_input(tr('Kaggle username หรือลิงก์โปรไฟล์', 'Kaggle username or profile URL'), key='kaggle_username')
    with right:
        track = st.selectbox(tr('สายงานที่ประเมิน', 'Review track'), ['Software', 'Data/ML'], key='review_track')
        uploaded = st.file_uploader(tr('Resume / CV (PDF สูงสุด 10 MB, 30 หน้า)', 'Resume / CV (PDF, up to 10 MB and 30 pages)'), type=['pdf'], max_upload_size=10, key='resume_upload')
    st.caption(tr('เลือกกรอกแหล่งข้อมูลที่มี ข้อความใน Resume และหลักฐานโปรเจกต์จะส่งให้ Gemini เพื่อเขียนรีวิว',
                  'Provide the sources you have. Resume text and project evidence are sent to Gemini for the written review.'))
    run = st.button(tr('วิเคราะห์ผลงาน', 'Review portfolio'), type='primary')

if run:
    if not git_user.strip() and not kaggle_user.strip() and uploaded is None:
        st.warning(tr('กรุณาระบุ GitHub, Kaggle หรืออัปโหลด Resume อย่างน้อยหนึ่งอย่าง',
                      'Provide a GitHub profile, Kaggle profile or resume to begin.'))
    else:
        try:
            normalized_git = evidence.normalize_username(git_user, 'github')
            normalized_kaggle = evidence.normalize_username(kaggle_user, 'kaggle')
        except ValueError:
            st.warning(tr('กรุณาใช้ username หรือลิงก์โปรไฟล์ HTTPS ของ GitHub/Kaggle เท่านั้น',
                          'Use a username or an HTTPS GitHub/Kaggle profile URL.'))
        else:
            with st.spinner(tr('กำลังอ่านหลักฐานและสรุปผล', 'Reading evidence and preparing the review')):
                resume_text, resume_error = '', None
                if uploaded:
                    try:
                        resume_text = evidence.extract_resume_text(uploaded.getvalue())
                    except ValueError as exc:
                        resume_error = str(exc)
                github = github_data(normalized_git, secret('GITHUB_TOKEN')) if normalized_git else evidence.result('not_provided', samples=[])
                kaggle = kaggle_data(normalized_kaggle) if normalized_kaggle else evidence.result('not_provided', competitions=[])
                ai = analyze(resume_text, github, kaggle, lang, track, secret('GEMINI_API_KEY'))
                if resume_error:
                    ai['resume'] = evidence.result(resume_error)
                st.session_state['report'] = {'github':github, 'kaggle':kaggle, **ai, 'track':track, 'language':lang}

report = st.session_state.get('report')
if report:
    st.divider()
    st.header(tr('สรุปผลประเมิน', 'Review summary'))
    st.caption(tr('สายงาน: ', 'Track: ') + report['track'])
    scores = {'github':report['github'].get('score'), 'resume':report['resume'].get('score'),
              'projects':report['deep'].get('project_score'), 'kaggle':report['kaggle'].get('score')}
    summary = evidence.weighted_score(scores, report['track'])
    if summary['score'] is None:
        st.info(tr('ยังไม่มีข้อมูลเพียงพอสำหรับคำนวณคะแนน ตรวจสถานะของแต่ละแหล่งด้านล่าง',
                   'There is not enough evidence to calculate a score. Check each source below.'))
    else:
        st.metric(tr('คะแนนประเมิน', 'Estimated score'), f"{summary['score']:.1f} / 100")
    if not summary['complete'] or any(report[key]['status'] == 'partial' for key in ('github', 'kaggle')):
        st.warning(tr('ประเมินไม่ครบทุกด้าน คะแนนคำนวณจากข้อมูลที่มีและปรับน้ำหนักใหม่ ไม่ควรเทียบตรงกับรายงานที่มีข้อมูลครบ',
                      'Incomplete assessment. Weights are normalized over available scores; comparison with fully evidenced reports is limited.'))
    st.caption(tr('คะแนนเป็นเกณฑ์ของแอปและการประมาณจาก AI ไม่ใช่ข้อยืนยันความสามารถหรือคำตัดสินจ้างงาน',
                  'Scores combine app heuristics and AI estimates, and do not establish ability or a hiring decision.'))
    rows = []
    for key, configured in evidence.WEIGHTS[report['track']].items():
        rows.append({tr('ด้าน', 'Area'): LABELS[key], tr('คะแนน', 'Score'): f"{scores[key]:.1f}" if evidence.valid_score(scores[key]) else '—',
                     tr('น้ำหนักตั้งต้น', 'Base weight'): f'{configured:.0%}',
                     tr('น้ำหนักที่ใช้จริง', 'Applied weight'): f"{summary['weights'].get(key, 0):.1%}"})
    st.dataframe(rows, hide_index=True, width='stretch')

    st.subheader(tr('สถานะข้อมูล', 'Evidence availability'))
    for key in ['github', 'resume', 'kaggle']:
        st.write(f"{LABELS[key]}: {status_text(report[key]['status'])}")
    st.write(tr('คำรีวิว: ', 'Written review: ') + status_text(report['deep']['status']))
    st.caption(tr('การนับแหล่งข้อมูลไม่ใช่การวัดความแม่นยำ รายงานนี้จึงไม่แสดงค่าความมั่นใจเป็นเปอร์เซ็นต์',
                  'Source availability does not measure accuracy; no numerical confidence is assigned.'))

    git_tab, kaggle_tab, resume_tab = st.tabs(['GitHub', 'Kaggle', 'Resume'])
    with git_tab:
        git = report['github']
        st.write(status_text(git['status']))
        if git.get('score') is not None:
            st.write(tr('Repo ที่อ่านได้: ', 'Repositories sampled: ') + str(git['repos_count']))
            st.write(tr('Repo ที่อัปเดตใน 90 วัน: ', 'Repositories updated in 90 days: ') + str(git['active_projects']))
            st.caption(tr('วันที่อัปเดต repo ไม่ใช่จำนวน commit หรือหลักฐานความสม่ำเสมอในการเขียนโค้ด',
                          'Repository update dates are not commit counts or evidence of coding consistency.'))
            st.write(tr('ภาษาใน repo: ', 'Repository languages: ') + ', '.join(name for name, _ in git['top_languages']))
            for project in git.get('samples', []):
                with st.expander(project['name'] + (tr(' · fork', ' · fork') if project['fork'] else '')):
                    st.link_button(tr('เปิด repository', 'Open repository'), project['source_url'])
                    st.write('README: ' + check_text(project['readme']))
                    if project['readme']:
                        st.link_button('README', project['readme_url'])
                    st.write('CI workflow: ' + check_text(project['cicd']))
                    if project['cicd']:
                        st.link_button(tr('เปิด workflows', 'Open workflows'), project['workflow_url'])
                    st.caption(tr('พบ workflow ไม่ได้ยืนยันว่ารันทดสอบผ่าน', 'A workflow file does not establish that its checks pass.'))
                    st.write(tr('Deployment: ตั้งค่า homepage ไว้ แต่ยังไม่ได้ตรวจว่าเปิดใช้งานได้', 'Deployment: homepage configured, availability unverified') if project['deployment'] else tr('Deployment: ยังยืนยันไม่ได้', 'Deployment: unverified'))
                    st.write(tr('การใช้ API: ยังยืนยันไม่ได้จากข้อมูลที่อ่าน', 'API usage: unverified from inspected evidence'))
        source_footer(git)
    with kaggle_tab:
        kaggle = report['kaggle']
        st.write(status_text(kaggle['status']))
        st.caption(tr('ข้อมูลด้านล่างเป็นผลของทีม ไม่ได้ยืนยันสัดส่วนงานที่ผู้สมัครทำ',
                      'Placements are team results and do not establish the candidate’s individual contribution.'))
        history = []
        for row in kaggle.get('competitions', []):
            history.append({tr('การแข่งขัน', 'Competition'):row['title'],
                            tr('อันดับทีม', 'Team rank'):f"{row['rank'] or '—'} / {row['teams'] or '—'}",
                            tr('วันปิดการแข่งขัน', 'Deadline'):row['date'] or '—',
                            tr('เหรียญ', 'Medal'):row['medal'] or '—',
                            tr('ใช้คิดคะแนน', 'Scored'):tr('ใช่', 'Yes') if evidence.kaggle_score([row]) is not None else tr('ยังยืนยันไม่ได้', 'Unverified'),
                            tr('แหล่งข้อมูล', 'Source'):row['url']})
        if history:
            st.dataframe(history, hide_index=True, width='stretch', height=420,
                         column_config={tr('แหล่งข้อมูล', 'Source'):st.column_config.LinkColumn(tr('แหล่งข้อมูล', 'Source'))})
        st.caption(tr('สูตร Kaggle: เฉลี่ย 3 ผลที่ดีที่สุดของ 100 × (จำนวนทีม − อันดับ) ÷ (จำนวนทีม − 1) หรือใช้ทั้งหมดหากมีน้อยกว่า 3 ผล เหรียญไม่บวกซ้ำ สูตรนี้ไม่ใช่คะแนนทางการ Kaggle',
                      'Kaggle score: mean of the best three results using 100 × (teams − rank) ÷ (teams − 1), or all eligible results if fewer than three. Medals add no extra points. This is not the official Kaggle points formula.'))
        source_footer(kaggle)
        if kaggle['status'] not in ('not_provided', 'ok', 'partial', 'empty'):
            st.caption(tr(*LIMITS['kaggle_website_api']))
    with resume_tab:
        resume = report['resume']
        st.write(status_text(resume['status']))
        if resume['status'] == 'ok':
            st.write(tr('จำนวนโปรเจกต์ที่ระบุ: ', 'Explicit project count: ') + str(resume['project_count']))
            clarity = {'High':tr('ชัดเจน', 'High'), 'Medium':tr('ปานกลาง', 'Medium'), 'Low':tr('ควรปรับปรุง', 'Low')}
            st.write(tr('ความชัดเจน: ', 'Clarity: ') + clarity[resume['clarity_level']])
            for weakness in resume['weaknesses']:
                st.write(weakness)
            st.caption(tr('เนื้อหา Resume เป็นข้อมูลที่ผู้สมัครระบุเอง คะแนนความครบถ้วนประเมินโดย AI',
                          'Resume content is self-reported. Completeness is estimated by AI.'))

    if report['deep']['status'] == 'ok':
        st.subheader(tr('ทักษะและสิ่งที่ควรตรวจต่อ', 'Skills and follow-up checks'))
        if report['language'] != lang:
            st.caption(tr('คำรีวิวนี้สร้างในภาษา EN กดวิเคราะห์ผลงานอีกครั้งเพื่อสร้างเป็นภาษาไทย',
                          'This review was generated in Thai. Run the review again for English feedback.'))
        source_map = {sample['source_id']:sample['source_url'] for sample in report['github'].get('samples', [])}
        source_map.update({'kaggle:' + row['url'].rstrip('/').rsplit('/',1)[-1]: row['url'] for row in report['kaggle'].get('competitions', [])})
        for skill in report['deep'].get('inferred_skills', []):
            basis = tr('พบในหลักฐาน', 'Observed in evidence') if skill['basis'] == 'observed' else tr('ผู้สมัครระบุ', 'Self-reported')
            st.write(f"{skill['skill']} · {basis}")
            st.caption(tr('อ้างอิง: ', 'Sources: ') + ', '.join(skill['sources']))
        for index, rec in enumerate(report['deep'].get('recommendations', []), 1):
            st.write(f"{index}. {rec['text']}")
            st.caption(tr('อ้างอิง: ', 'Sources: ') + ', '.join(rec['sources']))
        for source_id, url in source_map.items():
            st.link_button(source_id, url)
        if report['deep'].get('project_sources'):
            st.caption(tr('คะแนนโปรเจกต์ประเมินโดย AI จาก: ', 'Project score estimated by AI from: ') + ', '.join(report['deep']['project_sources']))
else:
    st.info(tr('เริ่มจากโปรไฟล์หรือ Resume อย่างน้อยหนึ่งแหล่ง ผลจะแสดงพร้อมลิงก์หลักฐานและสิ่งที่ยังตรวจไม่ได้',
               'Start with a profile or resume. Results include source links and any gaps in the available evidence.'))
