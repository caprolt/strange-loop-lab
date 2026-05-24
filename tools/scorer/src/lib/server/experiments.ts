import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { ExperimentCase, ExperimentSummary, LoadedExperiment, Rubric } from "@/types/scoring";
import { experimentsDir, repoRelativePath } from "./config";
import { resolveExperimentDir } from "./path";
import { validateCases, validateRubric } from "./validation";
import { loadYaml } from "./yaml";

interface CasesFile {
  experiment_id?: string;
  title?: string;
  description?: string;
  cases?: ExperimentCase[];
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

function headingTitle(markdown: string): string | undefined {
  const line = markdown
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith("#"));
  if (!line) return undefined;
  return line.replace(/^#+\s*/, "").trim();
}

export async function loadExperiments(): Promise<ExperimentSummary[]> {
  const entries = await readdir(experimentsDir, { withFileTypes: true });
  const experiments: ExperimentSummary[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const id = entry.name;
    const expDir = resolveExperimentDir(id);
    const casesPath = path.join(expDir, "cases.yaml");
    const rubricPath = path.join(expDir, "rubric.yaml");
    if (!(await pathExists(casesPath)) || !(await pathExists(rubricPath))) continue;

    let title = id;
    try {
      const cases = await loadYaml<CasesFile>(casesPath);
      title = cases.title ?? cases.experiment_id ?? id;
    } catch {
      // Keep fallback title.
    }
    experiments.push({
      id,
      title,
      path: repoRelativePath(expDir)
    });
  }

  experiments.sort((a, b) => a.id.localeCompare(b.id));
  return experiments;
}

export async function loadExperiment(experimentId: string): Promise<LoadedExperiment> {
  const expDir = resolveExperimentDir(experimentId);
  const casesPath = path.join(expDir, "cases.yaml");
  const rubricPath = path.join(expDir, "rubric.yaml");
  const markdownPath = path.join(expDir, "experiment.md");

  const casesFile = await loadYaml<CasesFile>(casesPath);
  const rubric = await loadYaml<Rubric>(rubricPath);
  const markdown = await readFile(markdownPath, "utf8").catch(() => "");

  const title = casesFile.title ?? headingTitle(markdown) ?? experimentId;
  const description = casesFile.description;
  const cases = Array.isArray(casesFile.cases) ? casesFile.cases : [];
  const errors = [
    ...validateCases(cases, casesFile.experiment_id),
    ...validateRubric(rubric)
  ];

  return {
    experiment: {
      id: experimentId,
      title,
      description,
      markdown
    },
    cases,
    rubric,
    errors
  };
}
