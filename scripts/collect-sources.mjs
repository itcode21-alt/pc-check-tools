import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const type = process.argv.find((value) => value.startsWith("--type="))?.split("=")[1] || "game-errors";
const output = join(root, "data", "inbox", type);
const games = (await readFile(join(root, "games-data.js"), "utf8")).match(/url:\s*["'](https?:[^"']+)["']/g) || [];
const gameSources = [...new Set(games.map((value) => value.replace(/^url:\s*["']|["']$/g, "")))];
const sourcesByType = {
  "game-errors": gameSources,
  "windows-updates": ["https://learn.microsoft.com/en-us/windows/release-health/"],
  "pc-errors": []
};
const sources = sourcesByType[type] || [];
await mkdir(output, { recursive: true });
const existing = new Set(await readdir(output));
const collected = [];

for (const url of sources) {
  try {
    const response = await fetch(url, { headers: { "user-agent": "ITSVC-local-collector/1.0" } });
    if (!response.ok) continue;
    const text = await response.text();
    const hash = createHash("sha256").update(text).digest("hex");
    const filename = `${hash}.json`;
    if (!existing.has(filename)) {
      await writeFile(join(output, filename), `${JSON.stringify({ collectedAt: new Date().toISOString(), url, hash, text: text.slice(0, 200000) }, null, 2)}\n`);
      collected.push({ url, hash });
    }
  } catch (error) { collected.push({ url, error: error.message }); }
}
console.log(JSON.stringify({ type, sources: sources.length, newItems: collected.filter((item) => item.hash).length, results: collected }, null, 2));
