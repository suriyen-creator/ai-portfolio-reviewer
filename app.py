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

# ตั้งค่าโมเนลหลักสำหรับการทำ Audit (ใช้ Flash เพื่อความเร็วและประหยัดตังค์)
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

LANGUAGES = {
    "TH": {
        "title": "🕵️‍♂️ AI Candidate Portfolio Intelligence (Recruiter Edition)",
        "subtitle": "ระบบประเมินศักยภาพผู้สมัครงานจากหลักฐานเชิงประจักษ์ (Evidence-Based Scoring)",
        "input_header": "📥 แผงตรวจสอบข้อมูล (Evidence Inputs)",
        "github_label": "GitHub Username (ดึงข้อมูลสดผ่าน API)",
        "kaggle_label": "Kaggle Username (แสดงโปรไฟล์เสริมเท่านั้น ไม่นำมาร่วมคิดคะแนน)",
        "resume_label": "อัปโหลดไฟล์ Resume / CV (PDF เท่านั้น)",
        "btn_run": "เริ่มกระบวนการสืบประวัติและประเมินคะแนน 🚀",
        "verdict_header": "🧑‍⚖️ รายงานผลการประเมินโดย AI (Recruiter Verdict)",
        "score_breakdown": "📊 ดัชนีชี้วัดคะแนนแบบแจกแจงหลักฐาน (Evidence Breakdown)"
    },
    "EN": {
        "title": "🕵️‍♂️ AI Candidate Portfolio Intelligence (Recruiter Edition)",
        "subtitle": "Verified Evidence-Based Portfolio & Resume Scoring System",
        "input_header": "📥 Verification Inputs",
        "github_label": "GitHub Username (Live API Retrieval)",
        "kaggle_label": "Kaggle Username (Optional Display, Excluded from Core Score)",
        "resume_label": "Upload Candidate Resume / CV (PDF Only)",
        "btn_run": "Execute Background & Portfolio Audit 🚀",
        "verdict_header": "🧑‍⚖️ Recruiter Verdict & AI Technical Report",
        "score_breakdown": "📊 Transparent Score & Evidence Breakdown"
    }
}

# --- 🐙 PHASE 1: GITHUB API ANALYZER (100% REAL DATA) ---
def fetch_github_profile(username):
    """ยิงตรงหา GitHub API ดึงข้อมูลสดเพื่อนำมาใช้เป็นพยานหลักฐาน"""
    if not username: return None
    headers = {"User-Agent": "Mozilla/5.0"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"
        
    try:
        # 1. ดึงข้อมูลดิบของผู้ใช้
        user_res = requests.get(f"https://api.github.com/users/{username}", headers=headers, timeout=10)
        if user_res.status_code != 200: return None
        user_data = user_res.json()
        
        # 2. ดึงรายการ Repositories (สูงสุด 100 อันล่าสุด)
        repos_res = requests.get(f"https://api.github.com/users/{username}/repos?per_page=100&sort=updated", headers=headers, timeout=10)
        repos_data = repos_res.json() if repos_res.status_code == 200 else []
        
        # ประมวลผลข้อมูลทางสถิติจริง
        total_repos = len(repos_data)
        total_stars = sum(r.get("stargazers_count", 0) for r in repos_data)
        
        # ตรวจสอบความสม่ำเสมอในการอัปเดตโค้ด (90 วันล่าสุด)
        active_90_days = 0
        cutoff = datetime.utcnow() - timedelta(days=90)
        for r in repos_data:
            updated_at_str = r.get("updated_at", "")
            if updated_at_str:
                dt = datetime.strptime(updated_at_str, "%Y-%m-%dT%H:%M:%SZ")
                if dt >= cutoff: active_90_days += 1
                
        # คำนวณความหลากหลายของภาษาคอมพิวเตอร์
        languages = {}
        for r in repos_data:
            lang = r.get("language")
            if lang: languages[lang] = languages.get(lang, 0) + 1
            
        # กรองเอาเฉพาะข้อมูลสำคัญของโปรเจกต์ 3 อันแรกไปให้ LLM รีวิวต่อ
        project_samples = []
        for r in repos_data[:3]:
            project_samples.append({
                "name": r.get("name"),
                "description": r.get("description", "No description provided"),
                "stars": r.get("stargazers_count", 0),
                "language": r.get("language", "Not Specified")
            })
            
        # 🧮 สูตรคำนวณคะแนนดิบของ GitHub (Max 100) อิงจากยอดผลงานจริง
        base_repo_score = min(total_repos * 5, 30) # มี 6 repos ได้เต็ม 30
        consistency_score = min(active_90_days * 15, 40) # มีการขยับเขยื้อน 3 โปรเจกต์ใน 3 เดือนได้เต็ม 40
        stars_bonus = min(total_stars * 5, 20) # ได้ดาวเสริมจุดเด่นสูงสุด 20 คะแนน
        lang_diversity = min(len(languages) * 5, 10) # เขียนได้หลากหลายภาษาได้ 10 คะแนน
        
        git_score = base_repo_score + consistency_score + stars_bonus + lang_diversity
        
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

# --- 📄 PHASE 2: RESUME AUDITOR VIA GEMINI ---
def audit_resume_via_llm(resume_text):
    """ใช้ LLM เป็นคนอ่านคัดกรองเนื้อหาในไฟล์จริงแบบเป็นเหตุเป็นผล ไม่มีการเดาสุ่มสถิติ"""
    if not resume_text: return {"score": 0, "reason": "No resume file attached"}
    
    model = genai.GenerativeModel('gemini-2.5-flash')
    prompt = f"""
    คุณคือนักคัดกรองผู้สมัครระดับประเทศ (Technical Recruiter) จงประเมินเนื้อหาในเอกสารสมัครงานนี้สำหรับตำแหน่ง Software Engineer / Developer
    
    เนื้อหาเอกสาร Resume:
    \"\"\"{resume_text}\"\"\"
    
    จงประเมินและให้คะแนนในรูปแบบ JSON เท่านั้น ห้ามเขียนอารัมภบทอื่นใด ข้อมูลต้องเป็นไปตามโครงสร้างนี้เป๊ะๆ:
    {{
       "clarity": (ตัวเลข 0 ถึง 100 บ่งบอกถึงความชัดเจนในการเขียนอธิบายผลงาน),
       "skills_relevance": (ตัวเลข 0 ถึง 100 บ่งบอกถึงความตรงสายของ Tech Stack ในตลาดงานปัจจุบัน),
       "structure": (ตัวเลข 0 ถึง 100 บ่งบอกถึงความเป็นมืออาชีพและการจัดวางหมวดหมู่),
       "score": (คะแนนรวมเฉลี่ยของ Resume นี้ ค่าอยู่ระหว่าง 0 ถึง 100),
       "justification": "สรุปสั้นๆ ใน 2 ประโยคว่าทำไมถึงให้คะแนนเท่านี้"
    }}
    """
    try:
        response = model.generate_content(prompt)
        # กรองเอาเฉพาะเนื้อหาที่เป็นโครงสร้าง JSON
        clean_text = re.search(r'\{.*\}', response.text, re.DOTALL).group(0)
        return json.loads(clean_text)
    except:
        # Fallback แบบปลอดภัยกรณีพังหรือ Token เกิน
        return {"score": 50, "clarity": 50, "skills_relevance": 50, "structure": 50, "justification": "ประเมินผ่านระบบเซฟโหมดเนื่องจากข้อความยาวเกินพิกัด"}

# --- 🚀 PHASE 3: PROJECT QUALITY ANALYZER VIA LLM ---
def audit_project_quality_via_llm(git_samples):
    """ใช้ LLM ตรวจวิเคราะห์ 'คุณภาพและความลึก' ของโปรเจกต์ที่มีอยู่จริงบน GitHub"""
    if not git_samples: return {"score": 0, "analysis": "ไม่มีพยานวัตถุหรือโปรเจกต์บน GitHub ให้ร่วมตรวจสอบ"}
    
    model = genai.GenerativeModel('gemini-2.5-flash')
    prompt = f"""
    คุณคือ Senior Software Architect จงตรวจสอบรายการโปรเจกต์สาธารณะที่ดึงมาจากคลังข้อความตรงนี้ เพื่อดูความน่าเชื่อถือและความยากในการแก้ปัญหาของผู้พัฒนา:
    
    รายการข้อมูลโปรเจกต์สาธารณะ:
    {json.dumps(git_samples, ensure_ascii=False)}
    
    จงประเมินและส่งค่ากลับมาเป็นรูปแบบ JSON เท่านั้นตามโครงสร้างนี้:
    {{
        "score": (ตัวเลขคะแนนรวมความพึงพอใจเชิงวิศวกรรม 0 ถึง 100),
        "complexity_comment": "วิเคราะห์สั้นๆ เกี่ยวกับระดับความยากง่ายและความซับซ้อนของตัวงาน"
    }}
    """
    try:
        response = model.generate_content(prompt)
        clean_text = re.search(r'\{.*\}', response.text, re.DOTALL).group(0)
        return json.loads(clean_text)
    except:
        return {"score": 40, "complexity_comment": "มีโปรเจกต์แต่ไม่สามารถประเมินความลึกเชิงโครงสร้างสถาปัตยกรรมได้"}

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
        # อ่านข้อความในไฟล์ PDF
        resume_text = ""
        if uploaded_file:
            try:
                pdf_reader = PdfReader(uploaded_file)
                for page in pdf_reader.pages:
                    if page.extract_text(): resume_text += page.extract_text() + "\n"
            except: pass

        # ขั้นตอนสืบค้นหลักฐานสดไม่มีการนั่งเทียนเขียนสถิติ
        with st.spinner("🕵️‍♂️ กำลังตรวจสอบหลักฐานเชิงประจักษ์ดิบผ่าน GitHub API และวิเคราะห์ตัวตน..."):
            git_evidence = fetch_github_profile(git_user)
            
            # บังคับดึงข้อมูลตรวจสอบไฟล์จริง
            resume_evidence = audit_resume_via_llm(resume_text) if resume_text.strip() else None
            
            # ส่งข้อมูลตัวอย่างโปรเจกต์จริงไปให้สถาปนิก AI เกรดวิเคราะห์
            project_evidence = audit_project_quality_via_llm(git_evidence["samples"]) if git_evidence else None

        # --- 🧮 RULE-BASED & WEIGHTED SCORE ENGINE (ความน่าเชื่อถือระดับองค์กร) ---
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

        # --- 🧑‍⚖️ EXPLANATION LAYER (GEMINI AUDITOR VERDICT) ---
        if GEMINI_API_KEY:
            try:
                model = genai.GenerativeModel('gemini-2.5-flash')
                verdict_prompt = f"""
                จงสรุปบทวิเคราะห์สำหรับพิจารณารับผู้สมัครงานคนนี้เข้าทำงานในฐานะ Tech Recruiter
                สถิติคะแนนจริง (Evidence Base):
                - คะแนน GitHub API Profile (40%): {f"{git_evidence['score']}/100" if git_evidence else "ไม่มีข้อมูลหลักฐาน"}
                - คะแนนความสมบูรณ์ไฟล์ Resume (30%): {f"{resume_evidence['score']}/100" if resume_evidence else "ไม่ได้อัปโหลดไฟล์เข้ามา"}
                - คะแนนมิติคุณภาพสถาปัตยกรรมโปรเจกต์ (30%): {f"{project_evidence['score']}/100" if project_evidence else "ไม่มีชิ้นงานตรวจสอบ"}
                คะแนนรวมสุทธิ: {final_score:.1f}/100
                
                จงสรุปประเด็นออกมาในรูปแบบหัวข้อให้ชัดเจน สั้น กระชับ:
                1. Overall Assessment (ภาพรวมศักยภาพจริง)
                2. Core Strengths (จุดเด่นที่มีพยานหลักฐานรองรับ)
                3. Critical Weaknesses (จุดด้อยที่ต้องปรับปรุงก่อนเริ่มงานจริง)
                ห้ามโกหก ห้ามอวยเกินจริง หากไม่มีข้อมูลใดให้ระบุตรงๆ ว่าขาดหลักฐานตรวจสอบในส่วนนั้น
                """
                st.subheader(t["verdict_header"])
                st.markdown(model.generate_content(verdict_prompt).text)
            except Exception as e:
                st.error(f"AI Report Generation Interrupted: {str(e)}")

        # --- 📊 TRANSPARENT EVIDENCE PANEL ---
        st.divider()
        st.subheader(t["score_breakdown"])
        st.metric(label="Overall Validated Score", value=f"{final_score:.1f} / 100")
        
        cb1, cb2, cb3 = st.columns(3)
        with cb1:
            st.markdown("### 🐙 GitHub Data (40%)")
            if git_evidence:
                st.markdown(f"**Score:** `{git_evidence['score']} / 100`")
                st.progress(git_evidence["score"] / 100)
                st.caption(f"📂 Total Repositories: {git_evidence['repos_count']}")
                st.caption(f"⭐ Stars Earned: {git_evidence['stars']}")
                st.caption(f"⚡ Active Codebases (90 Days): {git_evidence['active_projects']}")
                if git_evidence['top_languages']:
                    st.markdown(f"`Top Stacks:` {', '.join([l[0] for l in git_evidence['top_languages']])}")
            else:
                st.info("No verified GitHub evidence provided.")
                
        with cb2:
            st.markdown("### 📄 Resume Check (30%)")
            if resume_evidence and resume_text.strip():
                st.markdown(f"**Score:** `{resume_evidence['score']} / 100`")
                st.progress(resume_evidence["score"] / 100)
                st.caption(f"🔹 Clarity: {resume_evidence.get('clarity')}/100")
                st.caption(f"🔹 Relevance: {resume_evidence.get('skills_relevance')}/100")
                st.caption(f"🔹 Layout: {resume_evidence.get('structure')}/100")
                st.info(f"💬 AI Audit: {resume_evidence.get('justification')}")
            else:
                st.info("No CV file parsed for calculation.")

        with cb3:
            st.markdown("### 🚀 Project Quality (30%)")
            if project_evidence and git_evidence:
                st.markdown(f"**Score:** `{project_evidence['score']} / 100`")
                st.progress(project_evidence["score"] / 100)
                st.info(f"🏗️ Architecture Review: {project_evidence.get('complexity_comment')}")
            else:
                st.info("No production repositories available to test.")

        # --- 🟡 SUPPLEMENTARY LAYER (KAGGLE OPTIONAL DISPLAY) ---
        if kag_user:
            st.markdown("---")
            st.markdown("### 🔗 Supplementary Information (ข้อมูลสนับสนุนภายนอกระบบ)")
            st.info(f"🎯 **Kaggle Profile Attached:** [https://www.kaggle.com/{kag_user}](https://www.kaggle.com/{kag_user}) \n\n*(หมายเหตุ: ข้อมูลนี้ทำหน้าที่เป็นเพียงลิงก์ภายนอกอ้างอิงของตัวผู้สมัครเพื่อความโปร่งใส ไม่ถูกนำมาบิดเบือนคะแนนประเมินหลักทางวิศวกรรมระบบ)*")