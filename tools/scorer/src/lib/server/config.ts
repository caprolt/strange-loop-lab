import path from "node:path";

const explicitRoot = process.env.STRANGE_LOOP_REPO_ROOT;

export const repoRoot = explicitRoot ? path.resolve(explicitRoot) : path.resolve(process.cwd(), "..", "..");
export const experimentsDir = path.resolve(repoRoot, "experiments");
export const runsDir = path.resolve(repoRoot, "outputs", "runs");
export const scoresDir = path.resolve(repoRoot, "outputs", "scores");

export function repoRelativePath(absolutePath: string): string {
  return path.relative(repoRoot, absolutePath).split(path.sep).join("/");
}
