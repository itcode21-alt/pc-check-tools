import fs from "node:fs";

// 생성 스크립트가 페이지 전체나 본문 영역을 다시 쓰면 손으로 넣은 캡처(<a class="guide-image-link">)가
// 사라진다(3e3a82d86에서 error-code-0x80072f8f의 캡처 2장이 이렇게 빠졌다).
// 이미 캡처가 들어 있는 페이지는 기본적으로 건드리지 않고, --force를 줄 때만 덮어쓴다.
export const force = process.argv.includes("--force");

export const hasGuideImage = (html) => html.includes("guide-image-link");

// 파일이 있고 캡처가 들어 있으면 true. 호출한 쪽은 true면 쓰기를 건너뛴다.
export const shouldKeepFile = (file) => {
  if (force || !fs.existsSync(file)) return false;
  return hasGuideImage(fs.readFileSync(file, "utf8"));
};
