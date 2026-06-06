import streamlit as st
import google.generativeai as genai
import requests
import re
import json
from PyPDF2 import PdfReader

# --- CONFIGURATION & INITIALIZATION ---
st.set_page_config(page_title="AI Portfolio Intelligence System", page_icon="🎯", layout="wide")

# (ใส่ API KEY ของ Gemini ในไฟล์ secrets.toml ก่อนใช้นะ)
GEMINI_API_KEY = st.secrets.get("GEMINI_API_KEY", "")

LANGUAGES = {
    "TH": {
        "title": "🎯 AI Portfolio Intelligence System",
        "subtitle": "ระบบวิเคราะห์พอร์ตฟอลิโอและคัดกรองผู้สมัครงานอัจฉริยะด้วย AI",
        "input_header": "📥 ข้อมูลผู้สมัคร",
        "github_label": "GitHub Username (ไม่ต้องใส่ @)",
        "kaggle_label": "Kaggle Username หรือ URL โปรไฟล์",
        "resume_label": "อัปโหลด Resume / Portfolio (ไฟล์ PDF)",
        "btn_run": "เริ่มวิเคราะห์โปรไฟล์เชิงลึก 🚀",
        "rec_summary": "🧑‍💼 ผลวิเคราะห์และข้อเสนอแนะจาก AI",
        "score_depth": "📊 รายละเอียดคะแนนและผลวิเคราะห์เชิงลึก",
        "curr_rank": "ระดับปัจจุบันของคุณคือ:",
        "total_score": "คะแนนรวมทั้งหมด",
        "roadmap_title": "🗺️ แผนผังนำทางพัฒนาโปรไฟล์ (Portfolio Roadmap)"
    },
    "EN": {
        "title": "🎯 AI Portfolio Intelligence System",
        "subtitle": "Enterprise-Grade Candidate Portfolio & Open-Source Intelligence System",
        "input_header": "📥 Candidate Inputs",
        "github_label": "GitHub Username (Without @)",
        "kaggle_label": "Kaggle Username or Profile URL",
        "resume_label": "Upload Resume / Portfolio (PDF File)",
        "btn_run": "Run Deep Profile Intelligence 🚀",
        "rec_summary": "🧑‍💼 AI Recruitment Verdict & Feedback",
        "score_depth": "📊 Comprehensive Score Breakdown",
        "curr_rank": "Your Current Standing:",
        "total_score": "Total Weighted Score",
        "roadmap_title": "🗺️ Next-Level Portfolio Growth Roadmap"
    }
}

# --- PHASE 1: GITHUB CRAWLER ---
def analyze_github(username):
    if not username: return 0, {}, "No GitHub Profile Provided"
    try:
        url = f"https://api.github.com/users/{username}/repos?per_page=100"
        headers = {"User-Agent": "Mozilla/5.0"}
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code != 200: return 0, {}, f"GitHub Error: Status {res.status_code}"
            
        repos = res.json()
        if not repos: return 0, {"total_repos": 0}, "OK"
        
        total_repos = len(repos)
        has_desc = sum(1 for r in repos if r.get("description"))
        has_topics = sum(1 for r in repos if r.get("topics"))
        total_stars = sum(r.get("stargazers_count", 0) for r in repos)
        
        from datetime import datetime, timedelta
        active_90_days = 0
        cutoff_date = datetime.utcnow() - timedelta(days=90)
        for r in repos:
            updated_at_str = r.get("updated_at", "")
            if updated_at_str:
                dt = datetime.strptime(updated_at_str, "%Y-%m-%dT%H:%M:%SZ")
                if dt >= cutoff_date: active_90_days += 1

        languages = {}
        for r in repos:
            lang = r.get("language")
            if lang: languages[lang] = languages.get(lang, 0) + 1
            
        sorted_langs = sorted(languages.items(), key=lambda x: x[1], reverse=True)
        primary_stack = [l[0] for l in sorted_langs[:3]]
        
        total_lang_count = sum(languages.values())
        lang_analysis = {k: round((v / total_lang_count) * 100, 1) for k, v in sorted_langs[:3]} if total_lang_count > 0 else {}
        
        desc_ratio = (has_desc / total_repos) if total_repos > 0 else 0
        topic_ratio = (has_topics / total_repos) if total_repos > 0 else 0
        score = min((total_repos * 4) + (desc_ratio * 20) + (topic_ratio * 15) + (active_90_days * 8) + min(total_stars * 5, 20), 100)
        
        metrics = {
            "total_repos": total_repos, "has_desc": has_desc, "has_topics": has_topics,
            "total_stars": total_stars, "active_90_days": active_90_days,
            "primary_stack": primary_stack,
            "lang_analysis": lang_analysis
        }
        return int(score), metrics, "OK"
    except Exception as e:
        return 0, {}, str(e)

# --- PHASE 2: KAGGLE (ROBUST DIRECT SCRAPE WITH BYPASS) ---
def deep_analyze_kaggle(username_or_url):
    import json
    if not username_or_url: return 0, {}, "No Kaggle Profile Provided"
    
    # แกะชื่อจากลิงก์
    username = username_or_url.split("kaggle.com/")[-1].split("/")[0].replace("@", "").strip()
    target_url = f"https://www.kaggle.com/{username}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/"
    }

    try:
        res = requests.get(target_url, headers=headers, timeout=10)
        html = res.text
        
        # 🛡️ วนลูปมุด Proxy สำรอง ถ้าโดนบล็อก
        if "Just a moment" in html or res.status_code != 200 or "__NEXT_DATA__" not in html:
            proxies = [
                f"https://api.allorigins.win/raw?url={target_url}",
                f"https://corsproxy.io/?{target_url}"
            ]
            for proxy in proxies:
                try:
                    res = requests.get(proxy, headers=headers, timeout=15)
                    html = res.text
                    if "__NEXT_DATA__" in html: break
                except: continue

        if "__NEXT_DATA__" not in html:
            return 30, {}, f"⚠️ ใช้งานไม่ได้: โปรไฟล์ Private หรือติดบล็อก Cloudflare ขั้นสูงสุด"

        # 🔍 แกะข้อมูล JSON ล้วนๆ
        json_match = re.search(r'<script id="__NEXT_DATA__" type="application/json">({.*?})</script>', html)
        if not json_match:
            return 30, {}, "⚠️ ใช้งานไม่ได้: Kaggle เปลี่ยนโครงสร้างเว็บ"
            
        data = json.loads(json_match.group(1))
        clean_json = json.dumps(data)

        tier_m = re.search(r'"performanceTier"\s*:\s*"([^"]+)"', clean_json, re.IGNORECASE)
        tier = tier_m.group(1).title() if tier_m else "Novice"

        def get_count(key):
            m = re.search(rf'"{key}Summary"\s*:\s*{{"totalResults"\s*:\s*(\d+)', clean_json, re.IGNORECASE)
            return int(m.group(1)) if m else 0

        def get_medal(color):
            m = re.search(rf'"{color}Medals"\s*:\s*(\d+)', clean_json, re.IGNORECASE)
            return int(m.group(1)) if m else 0

        competitions = get_count("competitions")
        datasets = get_count("datasets")
        notebooks = get_count("scripts")
        gold, silver, bronze = get_medal("gold"), get_medal("silver"), get_medal("bronze")

        best_rank = "Top 15%" if gold > 0 else ("Top 30%" if silver > 0 or bronze > 0 else "Top 100%")
        tier_score = {"Novice": 30, "Contributor": 50, "Expert": 70, "Master": 85, "Grandmaster": 100}.get(tier, 30)
        final_score = min(tier_score + (gold * 15) + (silver * 7) + (bronze * 3) + min((competitions * 5) + (datasets * 2) + (notebooks * 2), 25), 100)
        
        metrics = {
            "tier": tier, "competitions": competitions, "datasets": datasets, 
            "notebooks": notebooks, "gold": gold, "silver": silver, "bronze": bronze, "best_rank": best_rank
        }
        
        return int(final_score), metrics, "💡 ดึงข้อมูลสำเร็จ! (Deep JSON Parse)"

    except Exception as e:
        return 30, {}, f"Scraping Error: {str(e)}"

# --- PHASE 3: OFFLINE PORTFOLIO AUDIT (RESUME) ---
def local_audit_resume(text):
    if not text: return 0
    words = text.lower()
    score = 45 
    keywords = ["python", "javascript", "c++", "java", "sql", "html", "css", "react", "docker", "aws", "ai", "data science", "machine learning"]
    matched_words = sum(1 for w in keywords if w in words)
    score += min(matched_words * 2, 35)
    if len(words) > 1500: score += 20
    return min(int(score), 100)

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

        with st.spinner("Analyzing Profiles (Connecting to APIs & Scraping)..."):
            git_score, git_metrics, git_status = analyze_github(git_user)
            kaggle_score, kag_metrics, kag_status = deep_analyze_kaggle(kag_user)
            resume_score = local_audit_resume(resume_text) if resume_text else 50
            
            total_score = (resume_score * 0.4) + (git_score * 0.4) + (kaggle_score * 0.2)

        if total_score >= 90: level_name, level_emoji = "Elite", "👑"
        elif total_score >= 75: level_name, level_emoji = "Advanced", "🟠"
        elif total_score >= 60: level_name, level_emoji = "Builder", "🟢"
        elif total_score >= 40: level_name, level_emoji = "Explorer", "🔵"
        else: level_name, level_emoji = "Beginner", "🟤"

        st.write("Calling AI Engine...")
        if GEMINI_API_KEY:
            try:
                genai.configure(api_key=GEMINI_API_KEY)
                model = genai.GenerativeModel('gemini-2.5-flash')
                ai_prompt = f"เขียนบทวิจารณ์เชิงลึกสำหรับผู้สมัครคนนี้ คะแนน Resume={resume_score}, GitHub={git_score}, Kaggle={kaggle_score}. คะแนนรวม {total_score:.1f}/100. จุดเด่นและจุดด้อยแบบสั้นๆ กระชับ"
                st.subheader(t["rec_summary"])
                st.markdown(model.generate_content(ai_prompt).text)
            except Exception as e:
                st.error(f"⚠️ AI Error: ไม่สามารถเชื่อมต่อกับ Gemini ได้ ({str(e)})")
        
        # --- 📊 SCORE BREAKDOWN ---
        st.subheader(t["score_depth"])
        st.success(f"### {t['curr_rank']} {level_emoji} {level_name}")
        
        col_b1, col_b2, col_b3 = st.columns(3)
        with col_b1:
            st.markdown(f"**📄 Resume & Portfolio:** `{resume_score} / 100`")
            st.progress(resume_score / 100)
            
        with col_b2:
            st.markdown(f"**🐙 GitHub Metrics:** `{git_score} / 100`")
            st.progress(git_score / 100)
            if git_metrics:
                st.caption(f"📂 Total Repos: {git_metrics.get('total_repos', 0)}")
                st.caption(f"⭐ Stars: {git_metrics.get('total_stars', 0)}")
                st.caption(f"⚡ Active (90 Days): {git_metrics.get('active_90_days', 0)}")

        with col_b3:
            st.markdown(f"**📊 Kaggle Performance:** `{kaggle_score} / 100`")
            st.progress(kaggle_score / 100)
            
            if "Error" in kag_status or "⚠️" in kag_status:
                st.error(kag_status)
            else:
                st.success(kag_status)
            
            if kag_metrics:
                st.caption(f"🏅 Tier: {kag_metrics.get('tier', 'Novice')}")
                st.caption(f"🥊 Competitions: **{kag_metrics.get('competitions', 0)}**")
                st.caption(f"🗃️ Datasets: {kag_metrics.get('datasets', 0)}")
                st.caption(f"📝 Notebooks: {kag_metrics.get('notebooks', 0)}")
                
        st.metric(label=t["total_score"], value=f"{total_score:.1f} / 100")