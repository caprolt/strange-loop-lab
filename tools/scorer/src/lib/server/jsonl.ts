import { mkdir, readFile, stat, appendFile } from "node:fs/promises";
import path from "node:path";

export interface JsonlReadResult<T> {
  records: T[];
  errors: string[];
  totalLines: number;
}

export async function readJsonl<T>(filePath: string): Promise<JsonlReadResult<T>> {
  try {
    await stat(filePath);
  } catch {
    return { records: [], errors: [], totalLines: 0 };
  }

  const raw = await readFile(filePath, "utf8");
  const lines = raw.split(/\r?\n/);
  const records: T[] = [];
  const errors: string[] = [];
  let totalLines = 0;

  for (let idx = 0; idx < lines.length; idx += 1) {
    const line = lines[idx].trim();
    if (!line) {
      continue;
    }
    totalLines += 1;
    try {
      records.push(JSON.parse(line) as T);
    } catch (error) {
      errors.push(`Line ${idx + 1}: ${(error as Error).message}`);
    }
  }

  return { records, errors, totalLines };
}

export async function appendJsonl(filePath: string, record: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const line = `${JSON.stringify(record)}\n`;
  await appendFile(filePath, line, "utf8");
}
