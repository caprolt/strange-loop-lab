export type ScoreStatus = "unscored" | "scored" | "skipped" | "needs_review" | "invalid_run";

export interface ExperimentSummary {
  id: string;
  title: string;
  path: string;
}

export interface ExperimentCase {
  id: string;
  title?: string;
  tags?: string[];
  system_prompt?: string;
  user_prompt: string;
  expected_behavior?: string;
  failure_modes?: string[];
}

export interface LoadedExperiment {
  experiment: {
    id: string;
    title: string;
    description?: string;
    markdown?: string;
  };
  cases: ExperimentCase[];
  rubric: Rubric;
  errors: string[];
}

export interface RubricCriterion {
  scale: string;
  description?: string;
  anchors?: Record<number, string> | Record<string, string>;
}

export interface Rubric {
  rubric_id: string;
  criteria: Record<string, RubricCriterion>;
}

export interface RunResult {
  run_id: string;
  experiment_id: string;
  case_id: string;
  provider?: string;
  model: string;
  settings?: Record<string, unknown>;
  system_prompt?: string;
  user_prompt?: string;
  output?: string;
  error?: string | null;
  timestamp_utc?: string;
  usage?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface RunFileSummary {
  file: string;
  path: string;
  source: "outputs_runs" | "experiment_results";
  line_count: number;
  experiment_ids: string[];
  parse_errors: string[];
}

export interface ScoreRecord {
  score_id: string;
  run_id: string;
  experiment_id: string;
  case_id: string;
  provider?: string;
  model: string;
  scorer: string;
  rubric_id: string;
  scores: Record<string, number>;
  notes?: string;
  flags?: string[];
  status?: ScoreStatus;
  timestamp_utc: string;
}

export interface ScoreFileResponse {
  score_file: string;
  scores: ScoreRecord[];
  latest_by_run_id: Record<string, ScoreRecord>;
  errors: string[];
}
