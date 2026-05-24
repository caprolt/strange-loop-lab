import { parseScale, SCORE_STATUSES } from "@/lib/shared";
import type { ExperimentCase, Rubric, RunResult, ScoreRecord, ScoreStatus } from "@/types/scoring";

export function validateCases(cases: ExperimentCase[], expectedExperimentId?: string): string[] {
  const errors: string[] = [];
  if (!Array.isArray(cases)) {
    return ["cases is not an array"];
  }

  const ids = new Set<string>();
  cases.forEach((caseItem, idx) => {
    const prefix = `cases[${idx}]`;
    if (!caseItem.id) {
      errors.push(`${prefix}: id is required`);
    } else {
      if (ids.has(caseItem.id)) {
        errors.push(`${prefix}: duplicate id '${caseItem.id}'`);
      }
      ids.add(caseItem.id);
    }

    if (!caseItem.user_prompt || !caseItem.user_prompt.trim()) {
      errors.push(`${prefix}: user_prompt is required`);
    }
  });

  if (expectedExperimentId && !expectedExperimentId.trim()) {
    errors.push("experiment_id is missing");
  }

  return errors;
}

export function validateRubric(rubric: Rubric): string[] {
  const errors: string[] = [];
  if (!rubric?.rubric_id) {
    errors.push("rubric_id is required");
  }
  if (!rubric?.criteria || typeof rubric.criteria !== "object") {
    return [...errors, "criteria must be an object"];
  }

  for (const [criterionKey, criterion] of Object.entries(rubric.criteria)) {
    if (!criterion.scale) {
      errors.push(`criteria.${criterionKey}.scale is required`);
      continue;
    }
    const values = parseScale(criterion.scale);
    if (values.length === 0) {
      errors.push(`criteria.${criterionKey}.scale could not be parsed: ${criterion.scale}`);
    }
  }
  return errors;
}

export function validateRunRecord(record: RunResult, indexLabel: string): string[] {
  const errors: string[] = [];
  if (!record.run_id) errors.push(`${indexLabel}: run_id is required`);
  if (!record.experiment_id) errors.push(`${indexLabel}: experiment_id is required`);
  if (!record.case_id) errors.push(`${indexLabel}: case_id is required`);
  if (!record.model) errors.push(`${indexLabel}: model is required`);
  if (!record.output && !record.error) {
    errors.push(`${indexLabel}: output or error is required`);
  }
  return errors;
}

export function normalizeStatus(status: string | undefined): ScoreStatus {
  const normalized = (status ?? "scored") as ScoreStatus;
  if (SCORE_STATUSES.includes(normalized)) {
    return normalized;
  }
  return "scored";
}

export function validateScoreRecordInput(args: {
  score: Partial<ScoreRecord>;
  rubric: Rubric;
  caseIds: Set<string>;
  runIds: Set<string>;
}): string[] {
  const { score, rubric, caseIds, runIds } = args;
  const errors: string[] = [];

  if (!score.run_id) errors.push("run_id is required");
  if (!score.experiment_id) errors.push("experiment_id is required");
  if (!score.case_id) errors.push("case_id is required");
  if (!score.model) errors.push("model is required");
  if (!score.scorer || !score.scorer.trim()) errors.push("scorer is required");
  if (!score.rubric_id) errors.push("rubric_id is required");
  if (!score.timestamp_utc) errors.push("timestamp_utc is required");
  if (!score.score_id) errors.push("score_id is required");
  if (!score.scores || typeof score.scores !== "object") errors.push("scores is required");

  if (score.run_id && !runIds.has(score.run_id)) {
    errors.push(`run_id '${score.run_id}' does not exist in run file`);
  }
  if (score.case_id && !caseIds.has(score.case_id)) {
    errors.push(`case_id '${score.case_id}' does not exist in selected experiment`);
  }
  if (score.rubric_id && score.rubric_id !== rubric.rubric_id) {
    errors.push(`rubric_id '${score.rubric_id}' does not match loaded rubric '${rubric.rubric_id}'`);
  }

  const status = normalizeStatus(score.status);
  const criteriaKeys = Object.keys(rubric.criteria);
  const scoreMap = score.scores ?? {};

  for (const key of Object.keys(scoreMap)) {
    if (!rubric.criteria[key]) {
      errors.push(`scores.${key} is not a rubric criterion`);
      continue;
    }
    const value = scoreMap[key];
    if (!Number.isInteger(value)) {
      errors.push(`scores.${key} must be an integer`);
      continue;
    }
    const allowed = parseScale(rubric.criteria[key].scale);
    if (!allowed.includes(value)) {
      errors.push(`scores.${key}=${value} is outside allowed scale ${rubric.criteria[key].scale}`);
    }
  }

  if (status !== "skipped" && status !== "needs_review" && status !== "invalid_run") {
    for (const criterionKey of criteriaKeys) {
      if (!(criterionKey in scoreMap)) {
        errors.push(`scores.${criterionKey} is required when status='${status}'`);
      }
    }
  }

  return errors;
}
