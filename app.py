import streamlit as tf
import google.generativeai as genai
import requests
import re
from PyPDF2 import PdfReader

# --- CONFIGURATION & INITIALIZATION ---
tf.set_page_config(page_title="AI Portfolio Intelligence System", page_icon="🎯", layout="wide")
GEMINI_API_KEY = tf.secrets.get("GEMINI_API_KEY", "")

# 🟢 เอา Roadmap Title กลับมาแล้วใน Dictionary
LANGUAGES = {
    "TH": {
        "title": "🎯 AI Portfolio Intelligence System (V7.9.10)",
        "subtitle": "ระบบวิเคราะห์พอร์ตฟอลิโอและคัดกรองผู้สมัครงานอัจฉริยะด้วย AI",
        "input_header": "📥 ข้อมูลผู้สมัคร",
        "github_label": "GitHub Username (ไม่ต้องใส่ @)",
        "kaggle_label": "Kaggle Username (ไม่ต้องใส่ @)",
        "resume_label": "อัปโหลด Resume / Portfolio (ไฟล์ PDF)",
        "btn_run": "เริ่มวิเคราะห์โปรไฟล์เชิงลึก 🚀",
        "rec_summary": "🧑‍💼 ผลวิเคราะห์และข้อเสนอแนะจาก AI",
        "score_depth": "📊 รายละเอียดคะแนนและผลวิเคราะห์เชิงลึก (Score Breakdown)",
        "curr_rank": "ระดับปัจจุบันของคุณคือ:",
        "total_score": "คะแนนรวมทั้งหมด (Total Weighted Score)",
        "roadmap_title": "🗺️ แผนผังนำทางพัฒนาโปรไฟล์ (Portfolio Roadmap)"
    },
    "EN": {
        "title": "🎯 AI Portfolio Intelligence System (V7.9.10)",
        "subtitle": "Enterprise-Grade Candidate Portfolio & Open-Source Intelligence System",
        "input_header": "📥 Candidate Inputs",
        "github_label": "GitHub Username (Without @)",
        "kaggle_label": "Kaggle Username (Without @)",
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
        
        # 🟢 คืนชีพ Language Breakdown
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

# --- PHASE 2: KAGGLE (V7.9.10 - AGGRESSIVE PROXY BYPASS) ---
def deep_analyze_kaggle(username):
    if not username: return 0, {}, "No Kaggle Profile Provided"
    try:
        url_main = f"https://www.kaggle.com/{username}"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        
        # 1. ยิงตรงไปก่อน
        res_main = requests.get(url_main, headers=headers, timeout=10)
        html = res_main.text
        
        # เช็กว่าโดนหน้า Verify you are human หลอกให้ค่า 200 OK หรือเปล่า
        is_blocked = (res_main.status_code != 200) or ("cloudflare" in html.lower()) or ("just a moment" in html.lower()) or ("challenge" in html.lower())
        
        if is_blocked:
            html = ""
            status_msg = "Blocked! Bypassing via Proxy 1..."
            try:
                proxy_url = f"https://api.allorigins.win/get?url={url_main}"
                html = requests.get(proxy_url, timeout=10).json().get("contents", "")
            except: pass
            
            if not html or "just a moment" in html.lower() or "cloudflare" in html.lower():
                status_msg = "Blocked! Bypassing via Proxy 2..."
                try:
                    proxy_url2 = f"https://api.codetabs.com/v1/proxy?quest={url_main}"
                    html = requests.get(proxy_url2, timeout=10).text
                except: pass
        else:
            status_msg = "OK (Direct Scrape)"

        if not html or "just a moment" in html.lower() or "cloudflare" in html.lower():
            return 30, {}, "Failed: Aggressive Cloudflare Block (ลองใหม่ทีหลัง)"

        tier_match = re.search(r'"performanceTier"\s*:\s*"([^"]+)"', html, re.IGNORECASE) or re.search(r'"tier"\s*:\s*"([^"]+)"', html, re.IGNORECASE)
        tier = tier_match.group(1) if tier_match else "Novice"
        
        def get_targeted_count(target_name, html_content):
            for pattern in [rf'"{target_name}s?Count"\s*:\s*(\d+)', rf'"text"\s*:\s*"{target_name}s?"\s*,\s*"count"\s*:\s*(\d+)']:
                m = re.search(pattern, html_content, re.IGNORECASE)
                if m: return int(m.group(1))
            return 0

        competitions = get_targeted_count("competition", html)
        datasets = get_targeted_count("dataset", html)
        notebooks = get_targeted_count("code", html) or get_targeted_count("script", html)
        
        gold = 0; silver = 0; bronze = 0
        for m_type in ["gold", "silver", "bronze"]:
            m_match = re.search(rf'"{m_type}Medals?"\s*:\s*(\d+)', html, re.IGNORECASE)
            if m_match:
                if m_type == "gold": gold = int(m_match.group(1))
                elif m_type == "silver": silver = int(m_match.group(1))
                elif m_type == "bronze": bronze = int(m_match.group(1))

        best_rank = "Top 15%" if gold > 0 else ("Top 30%" if silver > 0 or bronze > 0 else "Top 100%")
        tier_score = {"Novice": 30, "Contributor": 50, "Expert": 70, "Master": 85, "Grandmaster": 100}.get(tier.capitalize(), 30)
        
        final_score = min(tier_score + (gold * 15) + (silver * 7) + (bronze * 3) + min((competitions * 5) + (datasets * 2) + (notebooks * 2), 25), 100)
        
        metrics = {"tier": tier, "competitions": competitions, "datasets": datasets, "notebooks": notebooks, "gold": gold, "silver": silver, "bronze": bronze, "best_rank": best_rank}
        return int(final_score), metrics, status_msg
    except Exception as e: 
        return 30, {}, str(e)

# --- PHASE 3: OFFLINE PORTFOLIO AUDIT (RESUME) ---
def local_audit_resume(text):
    if not text: return 0
    words = text.lower()
    score = 45 
    keywords = ["python", "javascript", "c++", "java", "sql", "html", "css", "react", "docker", "aws", "ai", "data science"]
    matched_words = sum(1 for w in keywords if w in words)
    score += min(matched_words * 2, 35)
    if len(words) > 1500: score += 20
    return min(int(score), 100)

# --- USER INTERFACE RENDERING ---
tf.sidebar.title("Configuration ⚙️")
lang = tf.sidebar.selectbox("Language / เลือกภาษา", ["TH", "EN"])
t = LANGUAGES[lang]

tf.title(t["title"])
tf.subheader(t["subtitle"])
tf.divider()

col1, col2 = tf.columns([1, 2])

with col1:
    tf.header(t["input_header"])
    git_user = tf.text_input(t["github_label"], value="")
    kag_user = tf.text_input(t["kaggle_label"], value="")
    uploaded_file = tf.file_uploader(t["resume_label"], type=["pdf"])
    trigger_analysis = tf.button(t["btn_run"], use_container_width=True, type="primary")

with col2:
    if trigger_analysis:
        resume_text = ""
        if uploaded_file:
            try:
                pdf_reader = PdfReader(uploaded_file)
                for page in pdf_reader.pages:
                    if page.extract_text(): resume_text += page.extract_text() + "\n"
            except:
                pass

        with tf.spinner("Scraping Profiles & Bypassing Security..."):
            git_score, git_metrics, git_status = analyze_github(git_user)
            kaggle_score, kag_metrics, kag_status = deep_analyze_kaggle(kag_user)
            resume_score = local_audit_resume(resume_text) if resume_text else 50
            
            total_score = (resume_score * 0.4) + (git_score * 0.4) + (kaggle_score * 0.2)

        if total_score >= 90: level_name, level_emoji = "Elite", "👑"
        elif total_score >= 75: level_name, level_emoji = "Advanced", "🟠"
        elif total_score >= 60: level_name, level_emoji = "Builder", "🟢"
        elif total_score >= 40: level_name, level_emoji = "Explorer", "🔵"
        else: level_name, level_emoji = "Beginner", "🟤"

        tf.write("Calling AI Engine...")
        
        display_ai_result = ""
        ai_error_triggered = False

        if GEMINI_API_KEY:
            try:
                genai.configure(api_key=GEMINI_API_KEY)
                model = genai.GenerativeModel('gemini-2.5-flash')
                ai_prompt = f"เขียนบทวิจารณ์เชิงลึกสำหรับผู้สมัครคนนี้ คะแนนรวม {total_score:.1f}. จุดเด่นและจุดด้อยแบบสั้นๆ"
                display_ai_result = model.generate_content(ai_prompt).text
                tf.subheader(t["rec_summary"])
                tf.markdown(display_ai_result)
            except Exception as e:
                ai_error_triggered = True
                tf.error("⚠️ โควตา AI (Gemini API) ของคุณเต็มแล้ว! แสดงผลเฉพาะข้อมูลดิบด้านล่าง")
        
        # --- 📊 SCORE BREAKDOWN ---
        tf.subheader(t["score_depth"])
        tf.success(f"### {t['curr_rank']} {level_emoji} {level_name}")
        
        col_b1, col_b2, col_b3 = tf.columns(3)
        with col_b1:
            tf.markdown(f"**📄 Resume & Portfolio:** `{resume_score} / 100`")
            tf.progress(resume_score / 100)
            
        with col_b2:
            tf.markdown(f"**🐙 GitHub Metrics:** `{git_score} / 100`")
            tf.progress(git_score / 100)
            if git_metrics:
                tf.caption(f"📂 Repos: {git_metrics['total_repos']} | ⭐ Stars: {git_metrics['total_stars']}")
                # 🟢 คืนชีพ UI ของ Language Breakdown
                if git_metrics.get("primary_stack"):
                    tf.markdown(f"`Primary Stack:` {', '.join(git_metrics['primary_stack'])}")
                if git_metrics.get("lang_analysis"):
                    lang_str = " | ".join([f"{k}: {v}%" for k, v in git_metrics["lang_analysis"].items()])
                    tf.caption(f"**Language Breakdown:**\n{lang_str}")

        with col_b3:
            tf.markdown(f"**📊 Kaggle Performance:** `{kaggle_score} / 100`")
            tf.progress(kaggle_score / 100)
            if "Failed" in kag_status:
                tf.error(f"⚠️ {kag_status}")
            else:
                tf.caption(f"💡 {kag_status}")
            
            if kag_metrics:
                tf.caption(f"🏅 Tier: {kag_metrics['tier'].capitalize()} | 📉 Best Rank: {kag_metrics['best_rank']}")
                tf.caption(f"🥊 Competitions: **{kag_metrics['competitions']}** | 🗃️ Datasets: {kag_metrics['datasets']} | 📝 Notebooks: {kag_metrics['notebooks']}")
                tf.caption(f"Medals: 🥇 {kag_metrics['gold']} | 🥈 {kag_metrics['silver']} | 🥉 {kag_metrics['bronze']}")
                
        tf.metric(label=t["total_score"], value=f"{total_score:.1f} / 100")
        
        # 🟢 คืนชีพ PORTFOLIO ROADMAP เต็มสูบ!
        tf.divider()
        tf.subheader(t["roadmap_title"])
        tf.markdown("เช็คลิสต์สิ่งที่คุณต้องทำเพิ่มเติม เพื่อดันคะแนนขยับสู่เป้าหมายถัดไป:")
        col_r1, col_r2 = tf.columns(2)
        with col_r1:
            tf.info("🎯 **Target Milestone: Score 70 (Builder Goal)**")
            diff = 70 - total_score
            if diff > 0: 
                repo_goal = int((diff * 0.5) / 1.2) + 1
                kag_goal = int((diff * 0.5) / 0.4) + 1
                if lang == "TH":
                    tf.markdown(f"* 🐙 ดันโปรเจกต์ใหม่ขึ้น GitHub เพิ่มอีก **+{repo_goal} Repositories**\n* 📊 เข้าร่วมส่งงานประกวดใน Kaggle เพิ่มอีก **+{kag_goal} Competitions / Notebooks**")
                else:
                    tf.markdown(f"* 🐙 Add **+{repo_goal} Repositories** to GitHub\n* 📊 Join **+{kag_goal} Competitions / Notebooks** on Kaggle")
            else: 
                tf.markdown("✅ ผ่านเกณฑ์หลักไมล์นี้เรียบร้อยแล้ว!" if lang=="TH" else "✅ Already Passed!")
        with col_r2:
            tf.info("🚀 **Target Milestone: Score 80 (Advanced Goal)**")
            diff = 80 - total_score
            if diff > 0: 
                repo_goal = int((diff * 0.5) / 1.2) + 1
                kag_goal = int((diff * 0.5) / 0.4) + 1
                if lang == "TH":
                    tf.markdown(f"* 🐙 ดันโปรเจกต์ใหม่ขึ้น GitHub เพิ่มอีก **+{repo_goal} Repositories**\n* 📊 เข้าร่วมส่งงานประกวดใน Kaggle เพิ่มอีก **+{kag_goal} Competitions / Notebooks**")
                else:
                    tf.markdown(f"* 🐙 Add **+{repo_goal} Repositories** to GitHub\n* 📊 Join **+{kag_goal} Competitions / Notebooks** on Kaggle")
            else: 
                tf.markdown("✅ ผ่านเกณฑ์หลักไมล์นี้เรียบร้อยแล้ว!" if lang=="TH" else "✅ Already Passed!")