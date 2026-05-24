import type { ScoreStatus } from "@/types/scoring";

export const SCORE_STATUSES: ScoreStatus[] = ["unscored", "scored", "skipped", "needs_review", "invalid_run"];

export const SCOREABLE_STATUSES: ScoreStatus[] = ["scored", "skipped", "needs_review", "invalid_run"];

export const DEFAULT_FLAGS = [
  "needs_second_review",
  "possible_hallucination",
  "rubric_unclear",
  "case_unclear",
  "model_error",
  "unsafe_output",
  "interesting_example",
  "publication_candidate"
] as const;

export function parseScale(scale: string): number[] {
  const match = /^(\d+)\s*-\s*(\d+)$/.exec(scale.trim());
  if (!match) {
    return [];
  }
  const min = Number(match[1]);
  const max = Number(match[2]);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) {
    return [];
  }
  return Array.from({ length: max - min + 1 }, (_, idx) => min + idx);
}

export function toIsoNow(): string {
  return new Date().toISOString();
}
