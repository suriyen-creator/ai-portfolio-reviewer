# 🎯 AI Portfolio Intelligence System

An enterprise-grade candidate portfolio auditing and Open-Source Intelligence (OSINT) system. This application automatically aggregates, scraps, and analyzes an applicant's professional presence across **Resumes (PDF)**, **GitHub**, and **Kaggle** using Advanced Web Scraping and Generative AI to provide deep recruitment insights and actionable growth roadmaps.

---

## ✨ Key Features

* **📄 Smarter Resume Auditing:** Extracts and evaluates core technical competencies, keyword density, and overall portfolio depth directly from uploaded PDF files.
* **🐙 Deep GitHub Metrics:** Connects to the GitHub API to calculate active code contributions (90-day window), repository documentation quality (descriptions & topics), star counts, and automatically visualizes the candidate's primary language stack.
* **📊 Bulletproof Kaggle Scraping:** Powered by **Playwright headless browser automation** to seamlessly bypass Cloudflare defenses and extract real-time tier ranks, competitions, datasets, notebooks, and medal breakdowns directly from Next.js state data.
* **🧑‍💼 GenAI-Powered Verdict:** Integrates with Google's **Gemini 2.5 Flash** engine to generate structured, human-like summaries highlighting strengths, weaknesses, and a technical hiring verdict.
* **🗺️ Dynamic Portfolio Roadmap:** Automatically calculates gamified milestones and prints precise checklists telling the candidate exactly how many repositories or competitions they need to complete to reach the next tier.

---

## 🛠️ Tech Stack

* **Frontend/UI:** [Streamlit](https://streamlit.io/)
* **AI Engine:** [Google Generative AI (Gemini API)](https://ai.google.dev/)
* **Browser Automation & Scraping:** [Playwright](https://playwright.dev/python/)
* **Data Extraction:** PyPDF2, Requests, Regex, JSON
* **Language:** Python 3.9+

---

## 🚀 Local Setup & Installation

Follow these steps to get the project running smoothly on your local machine:

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME

```

### 2. Install Python Dependencies

Install the required packages listed in the `requirements.txt`:

```bash
pip install -r requirements.txt

```

### 3. Install Playwright Web Drivers

Playwright requires its own standalone browser binaries to perform the headless web-scraping. Run the following commands to install the Chromium driver:

```bash
pip install playwright
playwright install chromium

```

### 4. Configure Your API Secrets

Create a local Streamlit secrets file at `.streamlit/secrets.toml` in your project's root folder and add your Gemini API Key:

```toml
# .streamlit/secrets.toml
GEMINI_API_KEY = "YOUR_ACTUAL_GEMINI_API_KEY_HERE"

```

### 5. Launch the Application

```bash
streamlit run app.py

```

---

## ☁️ Deployment on Streamlit Community Cloud

When deploying this application to **Streamlit Cloud**, the environment needs extra OS-level configuration to support headless browser rendering. This repository is already pre-configured to handle cloud deployments seamlessly:

1. **`requirements.txt`**: Automatically installs the python libraries.
2. **`packages.txt`**: Tells the Streamlit Linux container to pre-install `chromium` at the OS level.
3. **Auto-Installer Function**: The `initialize_playwright_env()` block inside `app.py` automatically initializes the playwright environment on build.

### ⚙️ Setting Cloud Environment Variables:

During setup on the Streamlit Cloud dashboard, click on **Advanced Settings** and paste your API Key into the **Secrets** text area:

```toml
GEMINI_API_KEY = "AIzaSy..."

```

---

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for more information.

---

> **Note:** This tool is intended for recruitment screening and portfolio building assistance. Ensure compliance with data privacy guidelines when parsing third-party profiles.
