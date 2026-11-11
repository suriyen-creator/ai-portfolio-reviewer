# Portfolio review implementation

Approved intent: simplify the existing Streamlit UI, use natural TH/EN feedback, inspect GitHub files, and add public Kaggle evidence with Software/Data-ML scoring.

Weights: Software 40/25/25/10; Data/ML 20/25/25/30 for GitHub/resume/projects/Kaggle. Missing values are excluded and remaining weights normalized; real zero is included. Kaggle uses the mean of the best three verified final team rank percentiles.

Kaggle verification: observed Kaggle's public profile page using `users.ProfileService/GetProfile` and `search.SearchContentService/ListSearchContent` without authentication. Search filters: participant only, complete, public, visible on profile; maps competitionDocument.teamRank/teamCount/deadline/participantUserId and document medal. The captured minimal fixture removes irrelevant public personal data. The website API is undocumented; access errors and schema changes remain explicit unavailable/partial states.

Ruling: Use the observed public website JSON interface instead of parsing visible HTML. This removes a browser runtime dependency and supports pagination. Cost: Kaggle may change this undocumented interface, requiring a parser update.

Ruling: Keep changes in the supplied workspace, without a worktree or commit, so the user can inspect them here and the read-only .git directory is respected.

Verification: unit tests for parsing, scores, API failures, LLM validation and PDF failures; Streamlit AppTest for interactions and session persistence; browser screenshots for desktop/mobile where the environment supports Chromium.

Final verification (2026-11-12):
- `python -m pytest -q`: 47 passed. Existing PyPDF2 deprecation warning remains; no PDF library migration was requested.
- `git diff --check` and Python compile checks passed.
- Live public Kaggle retrieval: abhishek returned 229 completed competition results across pages; alexisbcook returned an explicit empty state.
- Chromium: initial/empty-input/live-Kaggle flows passed at 1440×1000 and 390×844. Desktop TH→EN preserved the candidate and displayed score. AppTest additionally verifies selected track and draft inputs persist across language changes.
- Independent final review found source-list validation, widget identity, resume-only skill attribution and README-link defects. Regression tests reproduced all four; fixes pass the full suite.
- Live Gemini generation was not exercised with a real API key. Mocked success, invalid JSON/schema, service errors and zero scores are covered.

Implementation detail: standard Streamlit inputs inside a bordered container replace the batching form so language changes retain candidate drafts; evidence requests still run only on the review button.
