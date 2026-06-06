# 🎯 AI Portfolio Intelligence System (V7.9.5 Ultimate Precision Core)

An enterprise-grade portfolio intelligence and recruitment screening system built with **Streamlit** and powered by **Google Gemini 2.5 Flash**. The application seamlessly synthesizes offline candidate resumes with live data from their open-source presence (**GitHub**) and competitive data science tracks (**Kaggle**) to deliver weighted scores, interactive metrics dashboards, and AI-powered HR verdicts.

---

## 🚀 Key Features

* **📄 Automated Resume Audit & AI Insights:** Parses uploaded PDF portfolios using keyword density calculations and feeds text vectors into Gemini for a full structural review.
* **🐙 Deep GitHub Profiling:** Leverages the GitHub API to crawl repositories, evaluate documentation quality (descriptions & topics), track stars, isolate the primary language stack, and assess code freshness over a 90-day rolling window.
* **📊 Advanced Kaggle Scraper (V7.9.5 Precision Engine):** Features a specialized regex target object extractor that directly maps Kaggle's internal UI script arrays to pull competition history, dataset deployments, notebook publish tallies, and medal tiers (Gold/Silver/Bronze) with bulletproof fallbacks.
* **🛡️ Resilient Fail-Safe Architecture:** Engineered with high-fault tolerance. If the Google Gemini API triggers a `429 ResourceExhausted` quota limit error, the application gracefully circumvents a system crash, keeping the core statistical dashboards and data breakdowns operational.
* **💾 Localized Quota Safeguards:** Implements a state-retaining JSON-based throttle (`quota_db.json`) that manages maximum daily usage limits to prevent API cost overruns.
* **🌐 Seamless Bilingual Localization:** Full internationalization support with a toggleable English (EN) and Thai (TH) interface.

---

## 🛠️ System Architecture & Scoring Blueprint

The application grades candidate profiles out of `100` total points based on an explicit weighted matrix:
* **Resume & Portfolio Structure (40%):** Assesses professional formatting, text volume, and critical operational keyword hits.
* **GitHub Repository Health (40%):** Evaluates production-readiness, collaborative footprint, and continuous integration activity.
* **Kaggle Competitive Footprint (20%):** Calculates data engineering milestones based on global user tier standing and competition participation.

### 🏆 Candidate Tier Ranking:
* **0 - 39:** `🟤 Beginner` — Needs immediate project accumulation.
* **40 - 59:** `🔵 Explorer` — Possesses raw technical skills but lacks portfolio depth.
* **60 - 74:** `🟢 Builder` — Production-ready, validated open-source codebase.
* **75 - 89:** `🟠 Advanced` — Distinct domain specialization with high-impact project outcomes.
* **90 - 100:** `👑 Elite` — Top-tier technical capabilities, industry-driving leadership potential.

---

## 📦 Prerequisites & Installation

Ensure you have Python 3.8+ installed on your host system.

1. **Clone the repository:**
```bash
   git clone [https://github.com/yourusername/ai-portfolio-intelligence.git](https://github.com/yourusername/ai-portfolio-intelligence.git)
   cd ai-portfolio-intelligence

```

2. **Install the required dependencies:**

```bash
   pip install streamlit google-generativeai requests PyPDF2

```

---

## 🔑 Configuration & Secrets Management

The system relies on Streamlit's internal secrets manager to securely expose environmental API keys.

Create a `.streamlit` folder inside your project root and add a `secrets.toml` file:

```bash
mkdir .streamlit
touch .streamlit/secrets.toml

```

Open `.streamlit/secrets.toml` and supply your **Google AI Studio API Key**:

```toml
# .streamlit/secrets.toml
GEMINI_API_KEY = "AIzaSyYourActualGeminiAPIKeyHere..."

```

---

## 🎮 Running the Application

Execute the script via the Streamlit CLI to spin up the local web application container:

```bash
streamlit run app.py

```

The terminal will return local and network URLs (typically `http://localhost:8501`). Open this address in your web browser to test your workflows.

---

## 🛡️ Troubleshooting & Rate Limits

### 1. `google.api_core.exceptions.ResourceExhausted: 429`

* **Cause:** You have hit the daily threshold on the Gemini API Free Tier (capped at 20 requests per day per project/model).
* **Fix:** Wait for the server reset window (00:00 UTC / 07:00 AM ICT) or generate a new token via another Google account in [Google AI Studio](https://aistudio.google.com/) and swap it into your `secrets.toml`.

### 2. Streamlit Quota Lockout

* **Cause:** The app's localized guard rail `quota_db.json` has logged 10 successful evaluations for the calendar day.
* **Fix:** For development testing, safely delete the `quota_db.json` file inside the root workspace folder, or manually alter the `"count"` object value back to `0` to instantly reset the system tracker.

---

## 📝 License

This project is open-source software licensed under the MIT License.

```

```
