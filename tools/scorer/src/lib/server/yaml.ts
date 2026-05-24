import { readFile } from "node:fs/promises";
import yaml from "js-yaml";

export async function loadYaml<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return yaml.load(raw) as T;
}
