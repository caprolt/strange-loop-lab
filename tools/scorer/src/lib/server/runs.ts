import { readdir } from "node:fs/promises";
import path from "node:path";
import type { RunFileSummary, RunResult } from "@/types/scoring";
import { repoRelativePath, runsDir } from "./config";
import { readJsonl } from "./jsonl";
import { resolveRunFile } from "./path";
import { validateRunRecord } from "./validation";

export async function listRunFiles(): Promise<RunFileSummary[]> {
  const entries = await readdir(runsDir, { withFileTypes: true }).catch(() => []);
  const summaries: RunFileSummary[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".jsonl")) {
      continue;
    }
    const filePath = resolveRunFile(entry.name);
    const parsed = await readJsonl<RunResult>(filePath);
    const experimentIds = new Set<string>();
    for (const record of parsed.records) {
      if (record.experiment_id) {
        experimentIds.add(record.experiment_id);
      }
    }

    summaries.push({
      file: entry.name,
      path: repoRelativePath(filePath),
      line_count: parsed.totalLines,
      experiment_ids: Array.from(experimentIds).sort(),
      parse_errors: parsed.errors
    });
  }

  summaries.sort((a, b) => a.file.localeCompare(b.file));
  return summaries;
}

export async function loadRunFile(fileName: string): Promise<{ results: RunResult[]; errors: string[] }> {
  const filePath = resolveRunFile(fileName);
  const parsed = await readJsonl<RunResult>(filePath);
  const errors = [...parsed.errors];

  parsed.records.forEach((record, index) => {
    errors.push(...validateRunRecord(record, `Record ${index + 1}`));
  });

  const results = parsed.records.sort((a, b) => {
    return (
      a.experiment_id.localeCompare(b.experiment_id) ||
      a.case_id.localeCompare(b.case_id) ||
      a.model.localeCompare(b.model) ||
      a.run_id.localeCompare(b.run_id)
    );
  });

  return { results, errors };
}

export function scoreFileNameForRun(runFile: string): string {
  const parsed = path.parse(runFile);
  return `${parsed.name}.scores.jsonl`;
}
