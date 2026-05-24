import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import type { RunFileSummary, RunResult } from "@/types/scoring";
import { experimentsDir, repoRelativePath, runsDir } from "./config";
import { readJsonl } from "./jsonl";
import { assertAllowedPath, resolveRunFile } from "./path";
import { validateRunRecord } from "./validation";

interface RunCandidate {
  file: string;
  source: "outputs_runs" | "experiment_results";
  absolutePath: string;
}

function sanitizeKey(input: string): string {
  return input.replace(/[^A-Za-z0-9._-]/g, "_");
}

function uniqueKey(seed: string, used: Set<string>): string {
  let key = sanitizeKey(seed);
  let counter = 2;
  while (used.has(key)) {
    key = `${sanitizeKey(seed)}_${counter}`;
    counter += 1;
  }
  used.add(key);
  return key;
}

async function existsFile(filePath: string): Promise<boolean> {
  try {
    const fileStat = await stat(filePath);
    return fileStat.isFile();
  } catch {
    return false;
  }
}

async function discoverRunCandidates(): Promise<RunCandidate[]> {
  const used = new Set<string>();
  const candidates: RunCandidate[] = [];

  const entries = await readdir(runsDir, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".jsonl")) {
      continue;
    }
    const filePath = resolveRunFile(entry.name);
    candidates.push({
      file: uniqueKey(`outputs__${entry.name}`, used),
      source: "outputs_runs",
      absolutePath: filePath
    });
  }

  const experimentEntries = await readdir(experimentsDir, { withFileTypes: true }).catch(() => []);
  for (const entry of experimentEntries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const resultsPath = path.join(experimentsDir, entry.name, "results", "results.jsonl");
    assertAllowedPath(resultsPath);
    if (!(await existsFile(resultsPath))) {
      continue;
    }
    candidates.push({
      file: uniqueKey(`experiment__${entry.name}__results.jsonl`, used),
      source: "experiment_results",
      absolutePath: resultsPath
    });
  }

  return candidates;
}

async function buildRunIndex(): Promise<Map<string, RunCandidate>> {
  const candidates = await discoverRunCandidates();
  const map = new Map<string, RunCandidate>();
  candidates.forEach((candidate) => {
    map.set(candidate.file, candidate);
  });
  return map;
}

export async function listRunFiles(): Promise<RunFileSummary[]> {
  const candidates = await discoverRunCandidates();
  const summaries: RunFileSummary[] = [];

  for (const candidate of candidates) {
    const parsed = await readJsonl<RunResult>(candidate.absolutePath);
    const experimentIds = new Set<string>();
    for (const record of parsed.records) {
      if (record.experiment_id) {
        experimentIds.add(record.experiment_id);
      }
    }

    summaries.push({
      file: candidate.file,
      path: repoRelativePath(candidate.absolutePath),
      source: candidate.source,
      line_count: parsed.totalLines,
      experiment_ids: Array.from(experimentIds).sort(),
      parse_errors: parsed.errors
    });
  }

  summaries.sort((a, b) => a.file.localeCompare(b.file));
  return summaries;
}

export async function loadRunFile(fileName: string): Promise<{ results: RunResult[]; errors: string[] }> {
  const index = await buildRunIndex();
  const candidate = index.get(fileName);
  if (!candidate) {
    throw new Error(`Unknown run file key '${fileName}'. Refresh available runs and try again.`);
  }
  const filePath = candidate.absolutePath;
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
