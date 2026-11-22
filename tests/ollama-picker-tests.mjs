// Ollama 모델 추천 검증: node tests/ollama-picker-tests.mjs
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const P = createRequire(import.meta.url)("../ollama-picker.js");
const { recommend, MODELS, GPUS, OVERHEAD } = P;
const ids = (list) => list.map((m) => m.id);

// 데이터 점검: 중복 id 없음, 크기 양수, 기능 표시는 허용된 값만
const seen = new Set();
for (const m of MODELS) {
  assert.ok(!seen.has(m.id), "중복 모델 " + m.id); seen.add(m.id);
  assert.ok(m.sizeGB > 0, m.id + " 크기");
  for (const c of m.caps) assert.ok(["tools", "thinking", "vision", "code", "embedding"].includes(c), m.id + " 기능 " + c);
}
// 임베딩 모델은 대화용이 아니다
assert.equal(MODELS.find((m) => m.id === "nomic-embed-text").chat, false);
assert.equal(MODELS.find((m) => m.id === "qwen3:8b").chat, true);

// GPU 표: NVIDIA 공식 비교표의 VRAM(대표값)
const vram = (n) => GPUS.find((g) => g.name === n).vramGB;
assert.equal(vram("RTX 5090"), 32); assert.equal(vram("RTX 4090"), 24); assert.equal(vram("RTX 4060"), 8);
assert.equal(vram("RTX 3060 (12GB판)"), 12); assert.equal(vram("RTX 3060 (8GB판)"), 8); assert.equal(vram("RTX 5070"), 12);

// 8GB VRAM: 5.2GB(×1.2=6.24) 모델은 여유, 6.6GB(×1.2=7.92)도 여유, 7.7GB는 겨우, 9.0GB는 VRAM 밖
let r = recommend({ vramGB: 8, ramGB: 32 });
assert.ok(ids(r.groups.comfortable).includes("qwen3:8b"));
assert.ok(ids(r.groups.comfortable).includes("gemma4:e4b")); // 6.6 × 1.2 = 7.92 ≤ 8
assert.ok(ids(r.groups.tight).includes("gemma4:12b"));       // 7.7 ≤ 8 < 9.24
assert.ok(ids(r.groups.tight).includes("llama3.2-vision:11b")); // 7.8 ≤ 8 < 9.36
assert.ok(!ids(r.groups.comfortable).concat(ids(r.groups.tight)).includes("qwen3:14b"));
// 14B(9.3GB)는 VRAM 밖이지만 RAM 32GB면 9.3×1.2=11.16 ≤ 16 이라 CPU 후보
assert.ok(ids(r.groups.cpu).includes("qwen3:14b"));
// 4개 묶음이 모든 모델을 겹치지 않게 나눈다
assert.equal(Object.values(r.groups).reduce((s, g) => s + g.length, 0), MODELS.length);
// 경계값: 10GB 모델이 정확히 12GB VRAM이면 여유(10×1.2=12)
assert.equal(P.fitOf({ sizeGB: 10 }, 12, 16), "comfortable");
assert.equal(P.fitOf({ sizeGB: 10 }, 11.9, 16), "tight");
assert.equal(P.fitOf({ sizeGB: 10 }, 9.9, 16), "none");
// 같은 규칙 상수
assert.equal(OVERHEAD, 1.2);

// 12GB: 14B급(9.0~9.3, ×1.2=10.8~11.16)은 여유, phi4 9.1도 여유, gpt-oss 14GB는 밖
r = recommend({ vramGB: 12, ramGB: 32 });
for (const id of ["qwen3:14b", "deepseek-r1:14b", "qwen2.5:14b", "phi4:14b", "gemma3:12b"]) assert.ok(ids(r.groups.comfortable).includes(id), id);
assert.ok(!ids(r.groups.comfortable).includes("gpt-oss:20b"));
assert.ok(ids(r.groups.none).includes("gpt-oss:20b")); // 14×1.2=16.8 > 32×0.5=16
assert.ok(ids(recommend({ vramGB: 12, ramGB: 64 }).groups.cpu).includes("gpt-oss:20b")); // 16.8 ≤ 32

// 24GB: 32B(20GB, ×1.2=24)는 정확히 24라 여유로 분류, 35B(22~23GB)는 겨우
r = recommend({ vramGB: 24, ramGB: 64 });
assert.ok(ids(r.groups.comfortable).includes("qwen3:32b"));
assert.ok(ids(r.groups.tight).includes("qwen3.6:35b"));
assert.ok(!ids(r.groups.comfortable).includes("qwen3.6:35b"));
// 큰 모델부터 정렬
assert.ok(r.groups.comfortable[0].sizeGB >= r.groups.comfortable[r.groups.comfortable.length - 1].sizeGB);

// 6GB: 4B급은 여유, 8B(5.2×1.2=6.24)는 겨우
r = recommend({ vramGB: 6, ramGB: 16 });
assert.ok(ids(r.groups.comfortable).includes("qwen3:4b"));
assert.ok(ids(r.groups.tight).includes("qwen3:8b"));

// GPU 없음: VRAM 묶음이 비고 RAM 16GB면 파일 크기 ×1.2 ≤ 8GB 인 것만(약 6.6GB 이하)
r = recommend({ vramGB: 0, ramGB: 16 });
assert.equal(r.usesGpu, false);
assert.equal(r.groups.comfortable.length + r.groups.tight.length, 0);
assert.ok(ids(r.groups.cpu).includes("qwen3:8b"));      // 6.24 ≤ 8
assert.ok(!ids(r.groups.cpu).includes("qwen3:14b"));    // 11.16 > 8
assert.equal(r.best.id, ids(r.groups.cpu).filter((id) => MODELS.find((m) => m.id === id).chat)[0]);
// RAM 8GB는 16GB 미만 경고
assert.equal(recommend({ vramGB: 0, ramGB: 8 }).ramWarn, true);
assert.equal(recommend({ vramGB: 8, ramGB: 16 }).ramWarn, false);

// 작업별 추천: 이미지 입력 모델은 vision 기능이 있는 것만, 코드는 code만
r = recommend({ vramGB: 16, ramGB: 32 });
const task = (name) => r.tasks.find((t) => t.task === name);
for (const m of task("vision").models) assert.ok(m.caps.includes("vision"), m.id);
for (const m of task("code").models) assert.ok(m.caps.includes("code"), m.id);
for (const m of task("embedding").models) assert.ok(m.caps.includes("embedding"), m.id);
assert.ok(task("chat").models.length <= 3);
// 대화 목록에는 임베딩 모델이 들어가지 않는다
for (const m of task("chat").models) assert.ok(!m.caps.includes("embedding"), m.id);

// 매우 작은 VRAM(4GB)에서 코드 특화 모델은 여유 없음 → 비어 있고, 겨우 들어가는 후보 안내는 없을 수 있다
r = recommend({ vramGB: 4, ramGB: 16 });
assert.equal(r.tasks.find((t) => t.task === "code").models.length, 0);

// 입력 방어: 음수·문자열
r = recommend({ vramGB: -3, ramGB: "abc" });
assert.equal(r.vramGB, 0); assert.equal(r.ramGB, 0);
assert.equal(r.groups.cpu.length, 0);

// 명령 문자열
r = recommend({ vramGB: 16, ramGB: 32 });
assert.equal(r.groups.comfortable.find((m) => m.id === "qwen3:14b").command, "ollama run qwen3:14b");
console.log("ollama-picker: all assertions passed");
