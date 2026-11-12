// 저장장치 건강 판정(ssd-health-check.html)으로 연결할 이벤트 페이지(한국어 파일명).
// 디스크·컨트롤러·파일 시스템 오류 기록 페이지다. 새 저장장치 이벤트 페이지를 만들면 여기에 추가한다.
// 영문 페이지는 같은 목록의 파일명을 en/event-<slug>.html로 바꿔 쓴다.
export const STORAGE_HEALTH_FILES = new Set([
  "event-disk-7.html", "event-disk-9.html", "event-disk-11.html", "event-disk-51.html", "event-disk-52.html", "event-disk-98.html",
  "event-disk-153.html", "event-disk-154.html", "event-disk-157.html",
  "event-ntfs-50.html", "event-ntfs-55.html", "event-ntfs-57.html", "event-ntfs-137.html", "event-ntfs-140.html",
  "event-stornvme-11.html", "event-stornvme-129.html", "event-storahci-129.html",
]);
