# 🕵️‍♂️ Evidence-Based Portfolio Auditor (HR Edition)

**Enterprise-Grade AI Candidate Evaluation System** ระบบวิเคราะห์และประเมินพอร์ตฟอลิโอผู้สมัครงานสาย Tech ด้วย AI โดยประเมินจาก **"หลักฐานเชิงประจักษ์ (Real Evidence) 100%"** ปราศจากการสุ่มเดาหรือการใช้ Heuristic Score ที่ไม่สามารถตรวจสอบได้

---

## 🌟 ทำไมต้องใช้ระบบนี้? (Why this project?)
ในยุคที่ AI ถูกนำมาใช้ประเมินผู้สมัครงาน ระบบส่วนใหญ่มักจะ "เดา" หรือ "สร้างตัวเลขขึ้นมาลอยๆ" (Hallucination) จากข้อมูลที่ไม่ครบถ้วน 
โปรเจกต์นี้ถูกออกแบบมาเพื่อแก้ปัญหานั้นโดยเฉพาะ ด้วยสถาปัตยกรรม **Traceable Scoring System** ที่ทุกคะแนนและทุกคำวิจารณ์ ต้องสามารถตรวจสอบย้อนกลับไปยัง **"หลักฐานต้นทาง"** ได้เสมอ 

## 🔥 ฟีเจอร์หลัก (Key Features)

* 🐙 **GitHub API Integration (40% Weight):** ดึงข้อมูลจริงผ่าน API เพื่อวิเคราะห์ความสม่ำเสมอ (Active 90 Days), จำนวน Repository, ยอด Stars และ Tech Stack หลัก
* 📄 **Smart Resume Parsing (30% Weight):** อ่านไฟล์ PDF เพื่อประเมินความชัดเจนในการเขียน, การจัดโครงสร้าง และตรวจหาจุดอ่อนของประวัติ
* 🧠 **Deep Skills Inference:** วิเคราะห์และสกัดทักษะ (Skills) ออกมาเป็นระดับ (Advanced 🟢, Intermediate 🟡, Basic ⚪) อัตโนมัติ
* 🚀 **Project Evidence Viewer (30% Weight):** ระบบ Checklist ตรวจจับความสมบูรณ์ของโปรเจกต์ เช่น การมี README, การเรียกใช้ API, การทำ CI/CD และพยานหลักฐานการทำ Deployment
* 📌 **HR Recommendation Engine:** แนะนำ Next Steps สำหรับ Recruiter ว่าควรทำอย่างไรต่อไปกับผู้สมัครรายนี้
* ⚖️ **System Confidence Score:** มีดัชนีบอกระดับความน่าเชื่อถือของการประเมิน (High/Medium/Low) ขึ้นอยู่กับจำนวนหลักฐานที่ผู้สมัครให้มา

---

## 🛠️ Tech Stack

* **Frontend & Framework:** [Streamlit](https://streamlit.io/)
* **AI / LLM Engine:** [Google Gemini 2.5 Flash](https://ai.google.dev/) (เพื่อความรวดเร็วและแม่นยำในการทำ Data Extraction)
* **External APIs:** GitHub REST API
* **PDF Processing:** PyPDF2

---

## ⚙️ การติดตั้งและใช้งาน (Installation & Setup)

**1. Clone the repository**
```bash
git clone [https://github.com/your-username/evidence-based-portfolio-auditor.git](https://github.com/your-username/evidence-based-portfolio-auditor.git)
cd evidence-based-portfolio-auditor

```

**2. ติดตั้ง Dependencies**

```bash
pip install -r requirements.txt

```

*(ไฟล์ `requirements.txt` ประกอบด้วย: `streamlit`, `google-generativeai`, `requests`, `PyPDF2`)*

**3. ตั้งค่า API Keys (Secrets)**
สร้างโฟลเดอร์ `.streamlit` และไฟล์ `secrets.toml` ใน Root directory ของโปรเจกต์:

```bash
mkdir .streamlit
touch .streamlit/secrets.toml

```

ใส่ API Keys ของคุณลงในไฟล์ `secrets.toml`:

```toml
# .streamlit/secrets.toml
GEMINI_API_KEY = "AIzaSy_ของคุณ..."
GITHUB_TOKEN = "ghp_ของคุณ..."

```

> **Note:** `GITHUB_TOKEN` จำเป็นมากเพื่อป้องกันการติด Rate Limit ของ GitHub API และเพื่อให้สามารถสืบค้นข้อมูลได้ลึกขึ้น

**4. รันแอปพลิเคชัน**

```bash
streamlit run app.py

```

---

## 💡 โครงสร้างระบบการให้คะแนน (Scoring Architecture)

ระบบใช้แนวทาง **Rule-Based + Weighted AI Extraction**:

1. **GitHub Evidence (40%):** คำนวณจากกฎตายตัว (Rule-based) ผ่านข้อมูลดิบ (Repos, Commits, Stars)
2. **Resume Evidence (30%):** ใช้ LLM สกัดข้อมูลเชิงคุณภาพออกมาเป็นคะแนนความสมบูรณ์
3. **Project Quality (30%):** ใช้ LLM ครอสเช็คข้อมูลระหว่าง Resume และ GitHub Metadata เพื่อหาหลักฐานทางสถาปัตยกรรมซอฟต์แวร์

---

## 🛡️ สถาปัตยกรรมที่เน้นความเสถียร (Production-Ready)

* **Zero-Scraping:** ไม่มีการทำ Web Scraping (เช่น Playwright/Selenium) ทำให้ระบบไม่มีวันพังจากการเปลี่ยนโครงสร้างเว็บหรือติด Cloudflare
* **No Synthetic Data:** ตัดระบบที่คลุมเครือ (เช่น Kaggle Heuristics) ออกทั้งหมด เพื่อให้ได้มาตรฐาน **Recruiter-Grade** อย่างแท้จริง

---