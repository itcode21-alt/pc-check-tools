// sitemap.xml의 모든 URL을 IndexNow(빙·네이버 등 참여 검색엔진)에 제출합니다.
// 사용법: node scripts/indexnow-submit.mjs
// 콘텐츠를 대량으로 바꾼 뒤 한 번씩 실행하면, 다음 정기 크롤링을 기다리지 않고
// 검색엔진에 변경 사실을 바로 알릴 수 있습니다.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const KEY = "c67a6c91247eda08c29cf0f0498f3e2d";
const HOST = "itsvc.co.kr";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const sitemap = readFileSync(join(root, "sitemap.xml"), "utf-8");
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);

if (urls.length === 0) {
  console.log("sitemap.xml에서 URL을 찾지 못했습니다.");
  process.exit(1);
}

console.log(`${urls.length}개 URL을 IndexNow에 제출합니다...`);

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls
  })
});

console.log(`응답 상태: ${res.status} ${res.statusText}`);
const text = await res.text();
if (text) console.log(text);
if (res.status === 200 || res.status === 202) {
  console.log("✓ 제출 성공");
} else {
  console.log("✗ 제출 실패 — 상태 코드를 확인하세요.");
  process.exit(1);
}
