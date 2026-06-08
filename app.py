import streamlit as st
import google.generativeai as genai
import requests
import json
import re
from PyPDF2 import PdfReader
from datetime import datetime, timedelta

# --- CONFIGURATION & INITIALIZATION ---
st.set_page_config(page_title="Evidence-Based Portfolio Auditor", page_icon="🕵️‍♂️", layout="wide")

GEMINI_API_KEY = st.secrets.get("GEMINI_API_KEY", "")
GITHUB_TOKEN = st.secrets.get("GITHUB_TOKEN", "")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

LANGUAGES = {
    "TH": {
        "title": "🕵️‍♂️ Evidence-Based Portfolio Auditor (HR Edition)",
        "subtitle": "ระบบประเมินผู้สมัครงานจากหลักฐานเชิงประจักษ์ 100%",
        "input_header": "📥 แผงตรวจสอบข้อมูล (Evidence Inputs)",
        "github_label": "GitHub Username (ดึงข้อมูลสดผ่าน API)",
        "resume_label": "อัปโหลดไฟล์ Resume / CV (PDF)",
        "btn_run": "Extract Evidence & Analyze 🚀"
    },
    "EN": {
        "title": "🕵️‍♂️ Evidence-Based Portfolio Auditor (HR Edition)",
        "subtitle": "100% Verified Candidate Scoring System",
        "input_header": "📥 Verification Inputs",
        "github_label": "GitHub Username (Live API)",
        "resume_label": "Upload Candidate Resume (PDF)",
        "btn_run": "Extract Evidence & Analyze 🚀"
    }
}

# --- 🐙 PHASE 1: GITHUB API ANALYZER (EVIDENCE GATHERING) ---
def fetch_github_profile(username):
    if not username: return None
    headers = {"User-Agent": "Mozilla/5.0"}
    if GITHUB_TOKEN: headers["Authorization"] = f"token {GITHUB_TOKEN}"
        
    try:
        user_res = requests.get(f"https://api.github.com/users/{username}", headers=headers, timeout=10)
        if user_res.status_code != 200: return None
        
        repos_res = requests.get(f"https://api.github.com/users/{username}/repos?per_page=100&sort=updated", headers=headers, timeout=10)
        repos_data = repos_res.json() if repos_res.status_code == 200 else []
        
        total_repos = len(repos_data)
        total_stars = sum(r.get("stargazers_count", 0) for r in repos_data)
        
        active_90_days = 0
        cutoff = datetime.utcnow() - timedelta(days=90)
        
        languages = {}
        project_samples = []
        
        for r in repos_data:
            if r.get("updated_at"):
                if datetime.strptime(r.get("updated_at"), "%Y-%m-%dT%H:%M:%SZ") >= cutoff:
                    active_90_days += 1
            
            lang = r.get("language")
            if lang: languages[lang] = languages.get(lang, 0) + 1
                
        # ดึงข้อมูล Topics มาด้วยเพื่อให้ AI ใช้เป็นหลักฐานหา CI/CD, API
        for r in repos_data[:5]:
            project_samples.append({
                "name": r.get("name"),
                "has_description": bool(r.get("description")),
                "has_homepage_deployed": bool(r.get("homepage")),
                "stars": r.get("stargazers_count", 0),
                "language": r.get("language", "None"),
                "topics": r.get("topics", [])
            })
            
        git_score = min((total_repos * 5), 40) + min((active_90_days * 15), 40) + min((total_stars * 5), 20)
        
        return {
            "score": int(min(git_score, 100)),
            "repos_count": total_repos,
            "stars": total_stars,
            "active_projects": active_90_days,
            "top_languages": sorted(languages.items(), key=lambda x: x[1], reverse=True)[:3],
            "samples": project_samples
        }
    except:
        return None

# --- 📄 PHASE 2: RESUME EVIDENCE PARSER ---
def audit_resume_via_llm(resume_text):
    if not resume_text: return None
    
    model = genai.GenerativeModel('gemini-2.5-flash')
    prompt = f"""
    คุณคือ Resume Data Extractor ตรวจสอบเอกสารนี้เพื่อดึงข้อมูลเชิงประจักษ์
    
    เนื้อหา Resume:
    \"\"\"{resume_text}\"\"\"
    
    ส่งผลลัพธ์เป็น JSON เท่านั้น:
    {{
       "score": (คะแนนความสมบูรณ์ 0-100 จากรูปแบบและเนื้อหา),
       "project_count": (จำนวนโปรเจกต์ที่ระบุไว้ชัดเจน),
       "clarity_level": "High/Medium/Low",
       "weaknesses": ["ข้อด้อย 1", "ข้อด้อย 2"]
    }}
    """
    try:
        response = model.generate_content(prompt)
        clean_text = re.search(r'\{[\s\S]*\}', response.text).group(0)
        return json.loads(clean_text)
    except:
        return None

# --- 🚀 PHASE 3: PROJECT EVIDENCE & SKILLS INFERENCE (THE CORE) ---
def analyze_deep_evidence_via_llm(resume_text, git_evidence):
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    git_data_str = json.dumps(git_evidence["samples"] if git_evidence else [], ensure_ascii=False)
    
    prompt = f"""
    คุณคือ Senior Technical Recruiter จงประมวลผลข้อมูล "Resume" และ "GitHub Metadata" ต่อไปนี้ เพื่อสกัดทักษะ (Skills), เช็คลิสต์หลักฐานโปรเจกต์ (Project Evidence) และคำแนะนำ (Recommendations)
    
    [ข้อมูล Resume]
    {resume_text if resume_text else "No Resume Provided"}
    
    [ข้อมูล GitHub Projects]
    {git_data_str}
    
    จงประเมินและคืนค่าเป็น JSON เท่านั้น ห้ามมโนทักษะที่ไม่ปรากฏในหลักฐาน:
    {{
        "project_score": (0-100 คะแนนคุณภาพการทำโปรเจกต์จากข้อมูล GitHub),
        "inferred_skills": [
            {{"skill": "ชื่อทักษะ (เช่น Python, Docker)", "level": "Advanced / Intermediate / Basic"}}
        ],
        "project_evidence": [
            {{"project_name": "ชื่อโปรเจกต์", "readme": true/false, "deployment": true/false, "api_usage": true/false, "cicd": true/false}}
        ],
        "recommendations": [
            "คำแนะนำเชิงปฏิบัติการ 1 (เช่น ควรเพิ่ม CI/CD ในโปรเจกต์)",
            "คำแนะนำเชิงปฏิบัติการ 2"
        ]
    }}
    """
    try:
        response = model.generate_content(prompt)
        clean_text = re.search(r'\{[\s\S]*\}', response.text).group(0)
        return json.loads(clean_text)
    except:
        return None

# --- USER INTERFACE RENDERING ---
st.sidebar.title("Configuration ⚙️")
lang = st.sidebar.selectbox("Language / เลือกภาษา", ["TH", "EN"])
t = LANGUAGES[lang]

st.title(t["title"])
st.subheader(t["subtitle"])
st.divider()

col1, col2 = st.columns([1, 2])

with col1:
    st.header(t["input_header"])
    git_user = st.text_input(t["github_label"], value="")
    uploaded_file = st.file_uploader(t["resume_label"], type=["pdf"])
    trigger_analysis = st.button(t["btn_run"], use_container_width=True, type="primary")

with col2:
    if trigger_analysis:
        resume_text = ""
        if uploaded_file:
            try:
                pdf_reader = PdfReader(uploaded_file)
                for page in pdf_reader.pages:
                    if page.extract_text(): resume_text += page.extract_text() + "\n"
            except: pass

        with st.spinner("🕵️‍♂️ Extracting Evidence, Inferring Skills & Tracing Data..."):
            git_evidence = fetch_github_profile(git_user)
            resume_evidence = audit_resume_via_llm(resume_text) if resume_text.strip() else None
            
            deep_analysis = analyze_deep_evidence_via_llm(resume_text, git_evidence)

        # --- 🧮 SYSTEM CONFIDENCE SCORE ---
        evidence_count = sum([1 for x in [git_evidence, resume_evidence] if x is not None])
        if evidence_count == 2: conf_score, conf_text = 0.95, "High (Full Evidence)"
        elif evidence_count == 1: conf_score, conf_text = 0.60, "Medium (Partial Evidence)"
        else: conf_score, conf_text = 0.0, "Low (No Valid Evidence)"

        # --- 🧮 CORE SCORING ENGINE ---
        total_weighted = 0.0
        total_weight_used = 0.0
        
        if git_evidence:
            total_weighted += (git_evidence["score"] * 0.4)
            total_weight_used += 0.4
        if resume_evidence:
            total_weighted += (resume_evidence["score"] * 0.3)
            total_weight_used += 0.3
        if deep_analysis and deep_analysis.get("project_score"):
            total_weighted += (deep_analysis["project_score"] * 0.3)
            total_weight_used += 0.3
            
        final_score = (total_weighted / total_weight_used) if total_weight_used > 0 else 0.0

        st.success("### ✅ Evaluation Engine Completed")
        st.info(f"**🤖 System Confidence:** {conf_score:.2f} ({conf_text})\n\n*Based on: {', '.join([x for x, y in zip(['GitHub API', 'Resume Text'], [git_evidence, resume_evidence]) if y]) or 'None'}*")
        
        st.metric(label="Overall Validated Score", value=f"{final_score:.1f} / 100")
        st.divider()

        # --- 📊 ROW 1: STANDARD EVIDENCE BREAKDOWN ---
        col_git, col_res = st.columns(2)
        with col_git:
            st.markdown("### 🐙 GitHub Evidence (40%)")
            if git_evidence:
                st.markdown(f"**Score:** `{git_evidence['score']} / 100`")
                st.markdown(f"- **Repos Count:** {git_evidence['repos_count']}")
                st.markdown(f"- **Commits/Active:** {git_evidence['active_projects']} repos in 90 days")
                st.markdown(f"- **Languages:** {', '.join([l[0] for l in git_evidence['top_languages']])}")
            else:
                st.error("❌ No verified GitHub evidence.")
                
        with col_res:
            st.markdown("### 📄 Resume Evidence (30%)")
            if resume_evidence:
                st.markdown(f"**Score:** `{resume_evidence['score']} / 100`")
                st.markdown(f"- **Project Count:** {resume_evidence.get('project_count')}")
                st.markdown(f"- **Clarity Level:** {resume_evidence.get('clarity_level')}")
                if resume_evidence.get('weaknesses'):
                    st.markdown("**Weaknesses Detected:**")
                    for w in resume_evidence.get('weaknesses', []):
                        st.markdown(f"  - {w}")
            else:
                st.error("❌ No CV parsed.")

        st.divider()

        # --- 🔥 ROW 2: DEEP INFERENCE (THE GAME CHANGER) ---
        if deep_analysis:
            col_skills, col_proj = st.columns(2)
            
            with col_skills:
                st.markdown("### 🧠 Skills Extracted")
                skills = deep_analysis.get("inferred_skills", [])
                if skills:
                    for s in skills:
                        level_color = "🟢" if s['level'].lower() == 'advanced' else "🟡" if s['level'].lower() == 'intermediate' else "⚪"
                        st.markdown(f"{level_color} **{s['skill']}** ({s['level']})")
                else:
                    st.info("No explicit tech skills detected.")
                    
            with col_proj:
                st.markdown("### 🚀 Project Evidence Viewer")
                st.markdown(f"**Quality Score:** `{deep_analysis.get('project_score', 0)} / 100`")
                projects = deep_analysis.get("project_evidence", [])
                
                if projects:
                    for p in projects[:3]: # โชว์แค่ 3 ตัวท็อปไม่ให้รก
                        with st.expander(f"📁 {p.get('project_name', 'Unknown')}", expanded=True):
                            st.markdown(f"{'✔' if p.get('readme') else '❌'} README present")
                            st.markdown(f"{'✔' if p.get('api_usage') else '❌'} API/Library usage detected")
                            st.markdown(f"{'✔' if p.get('deployment') else '❌'} Deployment evidence")
                            st.markdown(f"{'✔' if p.get('cicd') else '❌'} CI/CD presence")
                else:
                    st.info("No projects mapped for evidence.")

            st.divider()

            # --- 📌 RECOMMENDATION ENGINE ---
            st.markdown("### 📌 HR Next Step Recommendations")
            recs = deep_analysis.get("recommendations", [])
            if recs:
                for idx, r in enumerate(recs, 1):
                    st.markdown(f"**{idx}.** {r}")
            else:
                st.markdown("ไม่มีข้อเสนอแนะเพิ่มเติม ผู้สมัครมีข้อมูลพื้นฐานครบถ้วน")