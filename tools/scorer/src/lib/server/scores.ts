import { randomBytes } from "node:crypto";
import type { ScoreRecord } from "@/types/scoring";
import { toIsoNow } from "@/lib/shared";
import { appendJsonl, readJsonl } from "./jsonl";
import { resolveScoreFile } from "./path";
import { scoreFileNameForRun } from "./runs";

function randomSuffix(): string {
  return randomBytes(3).toString("hex");
}

function toDateValue(input: string | undefined): number {
  if (!input) return 0;
  const value = Date.parse(input);
  return Number.isFinite(value) ? value : 0;
}

export function makeScoreId(nowIso: string): string {
  return `score_${nowIso.replace(/[:.]/g, "-")}_${randomSuffix()}`;
}

export function getScoreFileForRun(runFile: string): { scoreFile: string; absolutePath: string } {
  const scoreFile = scoreFileNameForRun(runFile);
  const absolutePath = resolveScoreFile(scoreFile);
  return { scoreFile, absolutePath };
}

export async function loadScoresForRun(runFile: string): Promise<{
  scoreFile: string;
  scores: ScoreRecord[];
  latestByRunId: Record<string, ScoreRecord>;
  errors: string[];
}> {
  const { scoreFile, absolutePath } = getScoreFileForRun(runFile);
  const parsed = await readJsonl<ScoreRecord>(absolutePath);
  const latestByRunId: Record<string, ScoreRecord> = {};

  parsed.records.forEach((record) => {
    const current = latestByRunId[record.run_id];
    if (!current) {
      latestByRunId[record.run_id] = record;
      return;
    }
    const currentTs = toDateValue(current.timestamp_utc);
    const incomingTs = toDateValue(record.timestamp_utc);
    if (incomingTs >= currentTs) {
      latestByRunId[record.run_id] = record;
    }
  });

  return {
    scoreFile,
    scores: parsed.records,
    latestByRunId,
    errors: parsed.errors
  };
}

export async function appendScoreForRun(runFile: string, score: Omit<ScoreRecord, "score_id" | "timestamp_utc">): Promise<ScoreRecord> {
  const { absolutePath } = getScoreFileForRun(runFile);
  const timestamp = toIsoNow();
  const record: ScoreRecord = {
    ...score,
    timestamp_utc: timestamp,
    score_id: makeScoreId(timestamp)
  };
  await appendJsonl(absolutePath, record);
  return record;
}
