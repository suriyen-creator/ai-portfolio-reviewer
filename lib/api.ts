import type { DeepData, GithubData, KaggleData, Lang, Report, ResumeData, RoadmapData, Track } from './types';

export class ApiError extends Error {
  constructor(public code: string, public httpStatus: number) { super(code); }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch('/api/' + path, init);
  if (!response.ok) {
    let code = 'unavailable';
    try { code = (await response.json()).detail ?? code; } catch { /* non-JSON error page */ }
    throw new ApiError(typeof code === 'string' ? code : 'invalid_input', response.status);
  }
  return response.json() as Promise<T>;
}

const post = <T>(path: string, body: unknown) =>
  call<T>(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

const stub = (status: string) => ({ status, score: null, limitations: [] });
const failed = (error: unknown) => stub(error instanceof ApiError && error.code === 'invalid_username' ? 'invalid_username' : 'unavailable');

export const getHealth = () => call<{ ai: boolean; share: boolean }>('health');

export interface ReviewInput { github: string; kaggle: string; file: File | null; track: Track; lang: Lang; label?: string }
export type Step = 'github' | 'kaggle' | 'resume' | 'review';
export type StepState = 'idle' | 'running' | 'done' | 'skipped';

export async function runReview(input: ReviewInput, onStep: (step: Step, state: StepState) => void): Promise<Report> {
  const track = (step: Step, enabled: boolean, task: () => Promise<any>, fallback: any) => {
    if (!enabled) { onStep(step, 'skipped'); return Promise.resolve(fallback); }
    onStep(step, 'running');
    return task().catch(failed).finally(() => onStep(step, 'done'));
  };

  const [github, kaggle, resumeOut] = await Promise.all([
    track('github', !!input.github.trim(), () => post<GithubData>('github', { username: input.github }),
      { ...stub('not_provided'), samples: [] }) as Promise<GithubData>,
    track('kaggle', !!input.kaggle.trim(), () => post<KaggleData>('kaggle', { username: input.kaggle }),
      { ...stub('not_provided'), competitions: [] }) as Promise<KaggleData>,
    track('resume', !!input.file, () => {
      const form = new FormData();
      form.append('file', input.file!);
      form.append('lang', input.lang);
      form.append('track', input.track);
      return call<{ resume: ResumeData; resume_text: string }>('resume', { method: 'POST', body: form });
    }, { resume: stub('not_provided'), resume_text: '' }).then((r: any) => r.resume ? r : { resume: r, resume_text: '' }),
  ]);
  github.samples ??= [];
  kaggle.competitions ??= [];

  const hasEvidence = resumeOut.resume_text || github.samples.length || kaggle.competitions.length;
  const deep = await track('review', !!hasEvidence, () => post<DeepData>('review', {
    github, kaggle, resume_text: resumeOut.resume_text, lang: input.lang, track: input.track,
  }), stub('not_provided')) as DeepData;

  return {
    github, kaggle, resume: resumeOut.resume, deep, track: input.track, language: input.lang,
    label: input.label, created_at: new Date().toISOString(), resume_text: resumeOut.resume_text,
  };
}

export const fetchRoadmap = (report: Report, lang: Lang) =>
  post<RoadmapData>('roadmap', { report: { ...report, resume_text: undefined }, lang, track: report.track })
    .catch(() => stub('ai_unavailable') as RoadmapData);

export const shareReport = (report: Report) => {
  const { resume_text: _omit, ...rest } = report;
  return post<{ id: string }>('reports', { report: rest });
};

export const loadReport = (id: string) => call<Report>('reports/' + encodeURIComponent(id));

export const idleSteps: Record<Step, StepState> = { github: 'idle', kaggle: 'idle', resume: 'idle', review: 'idle' };
