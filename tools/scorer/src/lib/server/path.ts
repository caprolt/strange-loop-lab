import path from "node:path";
import { experimentsDir, repoRoot, runsDir, scoresDir } from "./config";

const allowedRoots = [experimentsDir, runsDir, scoresDir];

function isInside(base: string, target: string): boolean {
  const rel = path.relative(base, target);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

export function assertAllowedPath(target: string): void {
  const resolved = path.resolve(target);
  if (!allowedRoots.some((base) => isInside(base, resolved))) {
    throw new Error(`Path is outside allowed directories: ${resolved}`);
  }
}

export function safeBasename(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Filename is required.");
  }
  if (trimmed !== path.basename(trimmed)) {
    throw new Error("Path traversal is not allowed.");
  }
  if (!/^[A-Za-z0-9._-]+$/.test(trimmed)) {
    throw new Error("Filename contains invalid characters.");
  }
  return trimmed;
}

export function resolveRunFile(fileName: string): string {
  const safe = safeBasename(fileName);
  const resolved = path.resolve(runsDir, safe);
  assertAllowedPath(resolved);
  return resolved;
}

export function resolveScoreFile(fileName: string): string {
  const safe = safeBasename(fileName);
  const resolved = path.resolve(scoresDir, safe);
  assertAllowedPath(resolved);
  return resolved;
}

export function resolveExperimentDir(experimentId: string): string {
  const safe = safeBasename(experimentId);
  const resolved = path.resolve(experimentsDir, safe);
  assertAllowedPath(resolved);
  return resolved;
}

export function resolveRepoPath(...segments: string[]): string {
  const resolved = path.resolve(repoRoot, ...segments);
  return resolved;
}
