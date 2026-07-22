/* ========================================== */
/* 디자인 시스템 개선 기능 */
/* 1. 좌측 목차 자동 활성화 */
/* 2. 다크 모드 토글 */
/* 3. 진행률 바 시각화 */
/* ========================================== */

// 1. 좌측 목차 자동 활성화 (Intersection Observer 사용)
function initTableOfContents() {
  const tocLinks = document.querySelectorAll('.table-of-contents a');
  const progressFill = document.querySelector('.toc-progress-fill');

  if (tocLinks.length === 0) return;

  const options = {
    threshold: [0, 0.25, 0.5, 0.75, 1],
    rootMargin: '-80px 0px -66% 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // 현재 섹션 찾기
        const id = entry.target.getAttribute('id');

        // 모든 링크에서 active 제거
        tocLinks.forEach(link => link.classList.remove('active'));

        // 현재 섹션에 해당하는 링크 활성화
        const activeLink = document.querySelector(`.table-of-contents a[href="#${id}"]`);
        if (activeLink) {
          activeLink.classList.add('active');
        }

        // 진행률 바 업데이트
        if (progressFill) {
          const scrollTop = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const scrollPercent = (scrollTop / docHeight) * 100;
          progressFill.style.width = scrollPercent + '%';
        }
      }
    });
  }, options);

  // 모든 섹션 감시
  document.querySelectorAll('h2, h3').forEach(heading => {
    if (!heading.id) {
      heading.id = 'section-' + Math.random().toString(36).substr(2, 9);
    }
    observer.observe(heading);
  });
}

// 2. 다크 모드 토글
function initDarkModeToggle() {
  const toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;

  // 저장된 테마 불러오기
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);

  // 토글 클릭
  toggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  });

  // 시스템 다크 모드 감지
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    if (!localStorage.getItem('theme')) {
      applyTheme('dark');
    }
  }
}

function applyTheme(theme) {
  const html = document.documentElement;

  if (theme === 'dark') {
    html.setAttribute('data-theme', 'dark');
    document.body.style.colorScheme = 'dark';
  } else {
    html.removeAttribute('data-theme');
    document.body.style.colorScheme = 'light';
  }
}

// 3. 호환성 진행률 바 업데이트
function updateCompatibilityBar(containerId, score, maxScore = 100) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const barFill = container.querySelector('.compatibility-bar-fill');
  const scoreDisplay = container.querySelector('.compatibility-score');

  if (barFill && scoreDisplay) {
    const percentage = (score / maxScore) * 100;
    barFill.style.width = percentage + '%';
    scoreDisplay.textContent = Math.round(percentage) + '%';

    // 점수에 따라 색상 변경
    barFill.classList.remove('excellent', 'good', 'warning', 'poor');
    if (percentage >= 80) {
      barFill.classList.add('excellent');
    } else if (percentage >= 60) {
      barFill.classList.add('good');
    } else if (percentage >= 40) {
      barFill.classList.add('warning');
    } else {
      barFill.classList.add('poor');
    }
  }
}

// 4. 필터 버튼 아이콘 매핑
const filterIcons = {
  '전체': '⚙️',
  '부팅': '🔌',
  '전원': '⚡',
  '장치': '📱',
  '성능': '💨',
  '메모리': '🧠',
  '저장소': '💾',
  '그래픽': '🎮',
  '네트워크': '🌐',
  '오류코드': '⚠️',
  '드라이버': '🔧',
  '게임': '🎯'
};

function initFilterButtons() {
  const filterButtons = document.querySelectorAll('.filter-btn-icon');

  filterButtons.forEach(btn => {
    // 버튼 텍스트에서 카테고리 찾기
    const text = btn.textContent.trim();

    // 매칭되는 아이콘 찾기
    for (const [keyword, icon] of Object.entries(filterIcons)) {
      if (text.includes(keyword)) {
        btn.innerHTML = `<span>${icon}</span> ${text}`;
        break;
      }
    }

    // 클릭 이벤트
    btn.addEventListener('click', () => {
      // 같은 그룹의 버튼들 처리
      const parent = btn.parentElement;
      const siblings = parent.querySelectorAll('.filter-btn-icon');

      siblings.forEach(sibling => {
        sibling.classList.remove('active');
      });

      btn.classList.add('active');
    });
  });
}

// 5. 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  initTableOfContents();
  initDarkModeToggle();
  initFilterButtons();

  // 진행률 바 업데이트
  window.addEventListener('scroll', () => {
    const progressFill = document.querySelector('.toc-progress-fill');
    if (progressFill) {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      progressFill.style.width = scrollPercent + '%';
    }
  });
});

// 6. 외부에서 호출 가능한 함수들
window.DesignSystem = {
  updateCompatibilityBar,
  applyTheme,
  initTableOfContents,
  initDarkModeToggle,
  initFilterButtons
};
