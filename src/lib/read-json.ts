import fs from "node:fs/promises";

export async function readJson<T>(path: string): Promise<T> {
  const raw = await fs.readFile(path, "utf-8");
  return JSON.parse(raw) as T;
}
