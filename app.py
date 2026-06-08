import streamlit as st
import google.generativeai as genai
import requests
import json
import re
from PyPDF2 import PdfReader
from datetime import datetime, timedelta

# --- CONFIGURATION & INITIALIZATION ---
st.set_page_config(page_title="Recruiter-Grade AI Portfolio Auditor", page_icon="🕵️‍♂️", layout="wide")

GEMINI_API_KEY = st.secrets.get("GEMINI_API_KEY", "")
GITHUB_TOKEN = st.secrets.get("GITHUB_TOKEN", "")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

LANGUAGES = {
    "TH": {
        "title": "🕵️‍♂️ Evidence-Based Portfolio Auditor (Recruiter Edition)",
        "subtitle": "ระบบประเมินผู้สมัครงานจากหลักฐานเชิงประจักษ์ (Traceable Scoring System)",
        "input_header": "📥 แผงตรวจสอบข้อมูล (Evidence Inputs)",
        "github_label": "GitHub Username (ดึงข้อมูลสดผ่าน API)",
        "kaggle_label": "Kaggle Username (ใช้อ้างอิงเท่านั้น)",
        "resume_label": "อัปโหลดไฟล์ Resume / CV (PDF)",
        "btn_run": "ตรวจสอบและแยกแยะหลักฐาน 🚀"
    },
    "EN": {
        "title": "🕵️‍♂️ Evidence-Based Portfolio Auditor (Recruiter Edition)",
        "subtitle": "Traceable & Verified Candidate Scoring System",
        "input_header": "📥 Verification Inputs",
        "github_label": "GitHub Username (Live API)",
        "kaggle_label": "Kaggle Username (Reference Only)",
        "resume_label": "Upload Candidate Resume (PDF)",
        "btn_run": "Extract Evidence & Audit 🚀"
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
                
        for r in repos_data[:5]:
            project_samples.append({
                "name": r.get("name"),
                "has_description": bool(r.get("description")),
                "has_homepage_deployed": bool(r.get("homepage")),
                "stars": r.get("stargazers_count", 0),
                "language": r.get("language", "None")
            })
            
        git_score = min((total_repos * 5), 30) + min((active_90_days * 15), 40) + min((total_stars * 5), 20) + min((len(languages) * 5), 10)
        
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
    คุณคือ Data Extractor ตรวจสอบเอกสาร Resume นี้เพื่อดึง "หลักฐานเชิงประจักษ์" ห้ามมโนข้อมูลเด็ดขาด
    
    เนื้อหา Resume:
    \"\"\"{resume_text}\"\"\"
    
    ส่งผลลัพธ์เป็น JSON เท่านั้น (ห้ามมีข้อความอื่น):
    {{
       "score": (คะแนนความสมบูรณ์ 0-100 จากหลักฐานที่พบ),
       "parsed_skills": ["Skill 1", "Skill 2"],
       "project_count": (จำนวนโปรเจกต์ที่ระบุไว้ชัดเจน),
       "clarity_level": "High/Medium/Low",
       "weaknesses": ["ข้อด้อย 1 (เช่น ไม่พบ CI/CD)", "ข้อด้อย 2 (เช่น ไม่มีประสบการณ์ฝึกงาน)"]
    }}
    """
    try:
        response = model.generate_content(prompt)
        clean_text = re.search(r'\{[\s\S]*\}', response.text).group(0)
        return json.loads(clean_text)
    except:
        return None

# --- 🚀 PHASE 3: PROJECT QUALITY TRACEABILITY ---
def audit_project_quality_via_llm(git_samples):
    if not git_samples: return None
    
    model = genai.GenerativeModel('gemini-2.5-flash')
    prompt = f"""
    คุณคือ Technical Auditor ตรวจสอบคุณภาพโปรเจกต์จาก Metadata ของ GitHub นี้:
    {json.dumps(git_samples, ensure_ascii=False)}
    
    ส่งผลลัพธ์เป็น JSON เท่านั้น ตีแผ่ตามหลักฐานที่เห็น (ห้ามมโน):
    {{
        "score": (คะแนน 0-100 ประเมินจากจำนวนโปรเจกต์ที่มีคำอธิบายและการ Deploy),
        "readme_presence": "มี Description X/Y โปรเจกต์",
        "deployment_evidence": "พบการ Deploy หรือไม่",
        "strengths": ["จุดแข็งเชิงประจักษ์ 1"],
        "weaknesses": ["จุดอ่อนเชิงประจักษ์ 1"]
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
    kag_user = st.text_input(t["kaggle_label"], value="")
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

        with st.spinner("🕵️‍♂️ Extracting Evidence and Tracing Data..."):
            git_evidence = fetch_github_profile(git_user)
            resume_evidence = audit_resume_via_llm(resume_text) if resume_text.strip() else None
            project_evidence = audit_project_quality_via_llm(git_evidence["samples"]) if git_evidence else None

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
        if project_evidence:
            total_weighted += (project_evidence["score"] * 0.3)
            total_weight_used += 0.3
            
        final_score = (total_weighted / total_weight_used) if total_weight_used > 0 else 0.0

        st.success("### ✅ Evaluation Engine Completed")
        
        # แสดงความน่าเชื่อถือของระบบ (Recruiter Trust Feature)
        st.info(f"**🤖 System Confidence:** {conf_score:.2f} ({conf_text})\n\n*Based on: {', '.join([x for x, y in zip(['GitHub API', 'Resume Text'], [git_evidence, resume_evidence]) if y]) or 'None'}*")
        
        st.metric(label="Overall Validated Score", value=f"{final_score:.1f} / 100")
        st.divider()

        # --- 📊 TRANSPARENT EVIDENCE PANEL ---
        st.subheader("📊 Evidence Breakdown (Traceable Data)")
        
        cb1, cb2, cb3 = st.columns(3)
        with cb1:
            st.markdown("### 🐙 GitHub Data (40%)")
            if git_evidence:
                st.markdown(f"**Score:** `{git_evidence['score']} / 100`")
                st.markdown("**Evidence:**")
                st.markdown(f"- **Repos Count:** {git_evidence['repos_count']}")
                st.markdown(f"- **Commits/Active:** {git_evidence['active_projects']} repos in 90 days")
                st.markdown(f"- **Languages:** {', '.join([l[0] for l in git_evidence['top_languages']])}")
            else:
                st.error("No verified GitHub evidence provided.")
                
        with cb2:
            st.markdown("### 📄 Resume Check (30%)")
            if resume_evidence:
                st.markdown(f"**Score:** `{resume_evidence['score']} / 100`")
                st.markdown("**Evidence:**")
                st.markdown(f"- **Parsed Skills:** {', '.join(resume_evidence.get('parsed_skills', [])[:5])}")
                st.markdown(f"- **Project Count:** {resume_evidence.get('project_count')}")
                st.markdown(f"- **Clarity Level:** {resume_evidence.get('clarity_level')}")
                
                st.markdown("**Weakness Detected:**")
                for w in resume_evidence.get('weaknesses', []):
                    st.markdown(f"- {w}")
            else:
                st.error("No CV parsed / No File Uploaded.")

        with cb3:
            st.markdown("### 🚀 Project Quality (30%)")
            if project_evidence:
                st.markdown(f"**Score:** `{project_evidence['score']} / 100`")
                st.markdown("**Evidence:**")
                st.markdown(f"- **Documentation:** {project_evidence.get('readme_presence')}")
                st.markdown(f"- **Deployments:** {project_evidence.get('deployment_evidence')}")
                
                st.markdown("**Strength Detected:**")
                for s in project_evidence.get('strengths', []):
                    st.markdown(f"- {s}")
            else:
                st.error("No production repositories available to test.")

        # --- 🟡 KAGGLE: EXPLICIT ROLE DEFINITION ---
        st.markdown("---")
        st.markdown("### 📊 Kaggle Profile (Reference Only)")
        st.caption("**Role:** Display-only external credential. Not included in scoring model to prevent unverified heuristic bias.")
        if kag_user:
            st.info(f"🔗 **Verified Profile Link:** [https://www.kaggle.com/{kag_user}](https://www.kaggle.com/{kag_user})")
        else:
            st.write("- No URL Provided")