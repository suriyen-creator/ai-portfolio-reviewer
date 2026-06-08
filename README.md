# 🕵️‍♂️ Evidence-Based Portfolio Auditor (HR Edition)

An enterprise-grade, AI-powered evaluation system designed for Technical Recruiters and HR professionals. This tool shifts away from synthetic heuristic scores and relies **100% on verifiable evidence**, analyzing live GitHub data and candidate resumes to generate transparent, recruiter-trusted evaluations.

## 🚀 Why This Tool Exists

Recruiters don't trust black-box "AI scores." They need traceability, evidence, and logical breakdowns. This system evaluates software engineering candidates by cross-referencing their **PDF Resumes** with their **Real-time GitHub Repositories** using the Gemini LLM. Every score is backed by a specific piece of evidence, eliminating AI hallucination and guesswork.

## ✨ Key Features

* **🐙 Live GitHub Evidence Gathering:** Fetches real-time metrics via the GitHub API (active repositories, 90-day commit consistency, stars, and language diversity).
* **📄 Intelligent Resume Parsing:** Extracts raw text from PDF resumes and audits them for clarity, project counts, and structural weaknesses.
* **🧠 Skills Inference Engine:** Cross-references resume claims with GitHub repositories to automatically deduce technical skills and categorize them by proficiency (🟢 Advanced, 🟡 Intermediate, ⚪ Basic).
* **🚀 Project Evidence Viewer:** Drills down into specific projects to verify technical depth. Automatically detects the presence of `README.md`, API integrations, deployment links, and CI/CD pipelines.
* **📌 HR Recommendation Engine:** Provides actionable "Next Steps" for the recruiter or constructive feedback for the candidate based solely on missing evidence.
* **🛡️ System Confidence Score:** Displays a trust metric (High/Medium/Low) based on the volume of verifiable data provided.

## 🛠️ Tech Stack

* **Frontend & Framework:** [Streamlit](https://streamlit.io/)
* **AI / LLM Engine:** [Google Gemini 2.5 Flash](https://ai.google.dev/) (`google-generativeai`)
* **Data Retrieval:** REST APIs (`requests`), GitHub API
* **PDF Processing:** `PyPDF2`

## ⚙️ Installation & Setup

**1. Clone the repository**
```bash
git clone [https://github.com/yourusername/portfolio-auditor.git](https://github.com/yourusername/portfolio-auditor.git)
cd portfolio-auditor

```

**2. Install dependencies**

```bash
pip install -r requirements.txt

```

*(Ensure your `requirements.txt` includes: `streamlit`, `google-generativeai`, `requests`, `PyPDF2`)*

**3. Configure Environment Secrets**
Create a `.streamlit/secrets.toml` file in the root directory to store your API keys securely.

```toml
# .streamlit/secrets.toml
GEMINI_API_KEY = "AIzaSyYourGeminiKeyHere..."
GITHUB_TOKEN = "ghp_YourGitHubPersonalAccessTokenHere..."

```

> **Note:** A GitHub Personal Access Token (PAT) is highly recommended to prevent API rate-limiting when analyzing multiple candidates.

**4. Run the Application**

```bash
streamlit run app.py

```

## 🎯 How to Use (Recruiter Workflow)

1. **Input Data:** Enter the candidate's GitHub username (without the `@`) and upload their latest Resume/CV (PDF format).
2. **Execute Audit:** Click *“Extract Evidence & Analyze 🚀”*.
3. **Review the Verdict:**
* Check the **Overall Validated Score** and the **System Confidence**.
* Scan the **Skills Extracted** to see if their tech stack matches your job description.
* Open the **Project Evidence Viewer** to see if they actually deploy their code and write documentation.
* Read the **HR Next Step Recommendations** for final decision-making.



## ⚖️ Scoring Architecture

The overall score is a weighted average of three verifiable pillars:

* **40% GitHub Evidence:** Repository volume, recency of commits, and code metrics.
* **30% Resume Evidence:** Clarity, project quantification, and skill relevance.
* **30% Deep Project Quality:** Documentation, deployment proofs, and architectural complexity inferred by AI.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://www.google.com/search?q=https://github.com/yourusername/portfolio-auditor/issues).

## 📝 License

This project is [MIT](https://choosealicense.com/licenses/mit/) licensed.

```

```