// Write a reel's subtitles as .srt (for editing / re-styling in CapCut).
// Usage: npx tsx scripts/export-srt.ts <edit module> <export name> <out.srt>
//   e.g. npx tsx scripts/export-srt.ts src/edits/eye-exam-vs-vision-test.ts eyeExamVsVisionTest out/eye-exam.srt
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [mod, name, out] = process.argv.slice(2);
const t = (ms: number) => {
  const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60, r = Math.round(ms % 1000);
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(h)}:${p(m)}:${p(s)},${p(r, 3)}`;
};
import(resolve(mod)).then((m) => {
  const caps: { text: string; startMs: number; endMs: number }[] = m[name].captions;
  const srt = caps.map((c, i) => `${i + 1}\n${t(c.startMs)} --> ${t(c.endMs)}\n${c.text}\n`).join("\n");
  writeFileSync(out, "﻿" + srt);
  console.log(`${caps.length} lines → ${out}`);
});
