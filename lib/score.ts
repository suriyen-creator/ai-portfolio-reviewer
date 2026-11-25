import type { AreaKey, Report, Track } from './types';

// Mirrors evidence.WEIGHTS / weighted_score in api/_core/evidence.py.
export const WEIGHTS: Record<Track, Record<AreaKey, number>> = {
  Software: { github: 0.4, resume: 0.25, projects: 0.25, kaggle: 0.1 },
  'Data/ML': { github: 0.2, resume: 0.25, projects: 0.25, kaggle: 0.3 },
};
export const AREAS: AreaKey[] = ['github', 'resume', 'projects', 'kaggle'];

export const validScore = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100;

export function areaScores(report: Report): Record<AreaKey, number | null> {
  return {
    github: report.github.score ?? null,
    resume: report.resume.score ?? null,
    projects: report.deep.project_score ?? null,
    kaggle: report.kaggle.score ?? null,
  };
}

export function weightedScore(scores: Record<AreaKey, number | null>, track: Track) {
  const present = AREAS.filter((k) => validScore(scores[k]));
  const total = present.reduce((sum, k) => sum + WEIGHTS[track][k], 0);
  const weights = Object.fromEntries(present.map((k) => [k, WEIGHTS[track][k] / total])) as Partial<Record<AreaKey, number>>;
  const score = present.length ? present.reduce((sum, k) => sum + (scores[k] as number) * weights[k]!, 0) : null;
  return { score, weights, complete: present.length === 4 };
}

export function summarize(report: Report) {
  const scores = areaScores(report);
  return { scores, ...weightedScore(scores, report.track) };
}

export function grade(score: number | null) {
  if (score === null) return { tone: 'muted' as const };
  if (score >= 75) return { tone: 'good' as const };
  if (score >= 50) return { tone: 'mid' as const };
  return { tone: 'low' as const };
}
