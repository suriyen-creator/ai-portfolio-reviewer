# Portfolio Review

A Streamlit app for reviewing GitHub projects, PDF resumes and public Kaggle competition results. Supports Thai and English, with separate scoring weights for Software and Data/ML candidates.

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
streamlit run app.py
```

Configure `.streamlit/secrets.toml` (or environment variables):

```toml
GEMINI_API_KEY = "your-gemini-api-key"
GITHUB_TOKEN = "your-github-token"
```

Both keys are optional for starting the app. Gemini is required for resume scoring, project quality estimates and written feedback. A GitHub token raises the API rate limit. Without Gemini, public evidence and available factual scores still display. Do not commit credentials.

## Use

1. Enter a GitHub username/profile URL, a Kaggle username/profile URL, or upload a resume. Any source is optional; provide at least one.
2. Choose **Software** or **Data/ML** and select Thai or English.
3. Click **Review portfolio** and inspect the evidence links, source statuses and applied weights.

PDF limits: 10 MB, 30 pages, 60,000 extracted characters. Scanned PDFs without extractable text require a text-based copy. PDF text and inspected project evidence are sent to Gemini when configured. Resume/review data remain in Streamlit session state, not an application database; public API responses are cached in memory for one hour, with at most 128 entries per source.

## Evidence and limits

- GitHub statistics cover at most 100 recently updated public repositories, including forks. The app inspects README files and `.github/workflows` for at most five repositories. An existing workflow does not prove it passes, a homepage does not prove deployment, and a repository language does not establish proficiency.
- “Updated in 90 days” uses repository update timestamps, **not commit counts**. The GitHub score preserves the existing heuristic: `min(repos × 5, 40) + min(updated_repos × 15, 40) + min(stars × 5, 20)`.
- Resume completeness and project quality scores are AI estimates. Written feedback references supplied source IDs; resume statements remain self-reported. Project quality is unscored without readable README content.
- Kaggle retrieval uses public information only, without candidate credentials or paid services. The app uses the same unauthenticated JSON profile/search requests observed on Kaggle’s public competition page (verified 2026-11-12), with participant-only, completed, public and profile-visible filters. It checks the returned participant identity and follows pagination up to 1,000 results. Access restrictions, rate limits and website changes can prevent or limit retrieval. Hidden/private results are outside coverage. A failed request never means the candidate lacks competition experience.
- Placements are **team results**, not evidence of each member’s contribution. Missing rank/date/medal fields are not invented. Undocumented website interfaces can change.
- The app reports evidence availability instead of an uncalibrated numerical “confidence”. Scores are a portfolio review aid, not a hiring verdict or verified measure of ability.

## Scoring

| Track | GitHub | Resume | Project quality | Kaggle |
|---|---:|---:|---:|---:|
| Software | 40% | 25% | 25% | 10% |
| Data/ML | 20% | 25% | 25% | 30% |

Kaggle: for explicitly verified final results from completed competitions, compute `100 × (teams − rank) / (teams − 1)` and average the best three, or all eligible results if fewer than three. At least two teams and a valid rank are required. Medals do not add points. This is an **app-specific formula**, not [official Kaggle points](https://www.kaggle.com/progression/competitions).

If a component cannot be scored, its value is absent, **not zero**. Remaining weights are normalized and displayed alongside the configured weights. An actual zero remains included. If nothing can be scored, no overall score is displayed. Incomplete reports should not be directly compared with complete reports.

## Tests

```bash
pip install -r requirements-dev.txt
python -m pytest -q
```

Unit tests cover parsers, scores, external service failures, PDF failures, LLM response validation and Streamlit session interactions. Tests mock external services and do not need credentials. Browser checks additionally need `playwright install chromium`.
