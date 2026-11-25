export type Lang = 'TH' | 'EN';
export type Track = 'Software' | 'Data/ML';
export type AreaKey = 'github' | 'resume' | 'projects' | 'kaggle';

export interface Base {
  status: string;
  source_url?: string;
  fetched_at?: string;
  score: number | null;
  limitations: string[];
}

export interface RepoSample {
  name: string;
  source_id: string;
  source_url: string;
  language: string | null;
  description: string | null;
  readme: boolean | null;
  readme_url: string;
  readme_text?: string;
  cicd: boolean | null;
  workflow_url: string;
  deployment: string | null;
  fork: boolean;
}

export interface GithubData extends Base {
  repos_count?: number;
  stars?: number;
  active_projects?: number;
  top_languages?: [string, number][];
  samples: RepoSample[];
}

export interface Competition {
  title: string;
  url: string;
  rank: number | null;
  teams: number | null;
  medal: 'gold' | 'silver' | 'bronze' | null;
  date: string | null;
  completed: boolean;
  final: boolean;
}

export interface KaggleData extends Base {
  competitions: Competition[];
}

export interface ResumeData extends Base {
  project_count?: number;
  clarity_level?: 'High' | 'Medium' | 'Low';
  weaknesses?: string[];
}

export interface Sourced { sources: string[] }
export interface Skill extends Sourced { skill: string; basis: 'observed' | 'claimed' }
export interface Recommendation extends Sourced { text: string }

export interface DeepData extends Base {
  project_score?: number | null;
  project_sources?: string[];
  inferred_skills?: Skill[];
  recommendations?: Recommendation[];
}

export interface RoadmapData extends Base {
  phases?: { window: '30' | '60' | '90'; goals: (Sourced & { text: string })[] }[];
  project_ideas?: { title: string; why: string; skills: string[] }[];
}

export interface Report {
  github: GithubData;
  kaggle: KaggleData;
  resume: ResumeData;
  deep: DeepData;
  roadmap?: RoadmapData;
  track: Track;
  language: Lang;
  label?: string;
  created_at: string;
  resume_text?: string;
}
