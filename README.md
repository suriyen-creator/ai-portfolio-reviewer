# Portfolio Review

A web app for reviewing GitHub projects, PDF resumes and public Kaggle competition results. Supports Thai and English, light/dark themes, and separate scoring weights for Software and Data/ML candidates.

- **Review**: evidence-linked scores, repository checks, Kaggle history and AI feedback.
- **30/60/90-day plan**: Gemini turns the report's gaps into a development roadmap and project ideas. Only processed findings are sent, never the raw resume text.
- **Share link**: save a report snapshot and get a `/r/<id>` link (30-day expiry; raw resume text and README contents are stripped). Needs Upstash Redis.
- **Compare**: review two profiles with the same track, with a radar chart, per-area scores and shared/unique skills.

## Architecture

| Part | Location | Runs as |
|---|---|---|
| Frontend | `app/`, `components/`, `lib/` (Next.js + Tailwind) | Vercel (Next.js) |
| API | `api/index.py` (FastAPI) | Vercel Python function, `maxDuration` 60 s |
| Evidence, scoring, LLM | `api/_core/evidence.py`, `analysis.py` | imported by the API |
| Cache and shared reports | `api/_core/store.py` | Upstash Redis REST (optional) |

The browser runs GitHub, Kaggle and resume steps in parallel, then the AI review, so no single function call has to cover the whole pipeline. The overall score is computed client-side by `lib/score.ts`, which mirrors `evidence.weighted_score`.

## Run locally

```bash
python -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
npm install
npm run dev          # FastAPI on :8000 + Next.js on :3000 (/api is proxied)
```

Environment variables (all optional; put them in `.env` for the API or in Vercel project settings):

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Resume scoring, project estimates, written review, roadmap |
| `GITHUB_TOKEN` | Raises the GitHub API rate limit |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | One-hour evidence cache and share links (`KV_REST_API_URL`/`KV_REST_API_TOKEN` also work) |

Without Gemini, public evidence and factual scores still display. Without Redis, caching is skipped and the share button is hidden. Do not commit credentials.

## Deploy to Vercel

1. Import the repository in Vercel; the framework is detected as Next.js and `vercel.json` routes `/api/*` to `api/index.py`.
2. Add the environment variables above. For share links, add **Upstash for Redis** from the Vercel Marketplace; it injects the REST variables.
3. Deploy. Interactive API docs are served at `/api/docs`.

## Use

1. Enter a GitHub username/profile URL, a Kaggle username/profile URL, or upload a resume. Any source is optional; provide at least one.
2. Choose **Software** or **Data/ML** and select Thai or English in the header.
3. Click **Review portfolio**, inspect the evidence links, then optionally generate a plan, share, or print to PDF.

PDF limits: 4 MB (Vercel request body limit), 30 pages, 60,000 extracted characters. Scanned PDFs without extractable text require a text-based copy. PDF text and inspected project evidence are sent to Gemini when configured. Resume text stays in the browser tab between steps and is not stored by the server.

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
.venv/bin/pip install -r requirements-dev.txt
.venv/bin/python -m pytest -q
npm run build
```

Unit tests cover parsers, scores, external service failures, PDF failures, LLM response validation (including the roadmap schema), every API route and the share store. Tests mock external services and do not need credentials.
