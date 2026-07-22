/* UI 초기화 - 목차, 다크모드, 진행률 바 */
function initTableOfContents() {
  const tocLinks = document.querySelectorAll('.toc a, .table-of-contents a');
  const progressFill = document.querySelector('.toc-progress-fill');
  if (tocLinks.length === 0) return;
  const options = { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: '-80px 0px -66% 0px' };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        tocLinks.forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`.table-of-contents a[href="#${id}"]`);
        if (activeLink) activeLink.classList.add('active');
        if (progressFill) {
          const scrollTop = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const scrollPercent = (scrollTop / docHeight) * 100;
          progressFill.style.width = scrollPercent + '%';
        }
      }
    });
  }, options);
  document.querySelectorAll('h2, h3').forEach(heading => {
    if (!heading.id) heading.id = 'section-' + Math.random().toString(36).substr(2, 9);
    observer.observe(heading);
  });
}
function initDarkModeToggle() {
  const toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);
  toggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  });
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    if (!localStorage.getItem('theme')) applyTheme('dark');
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
function updateCompatibilityBar(containerId, score, maxScore = 100) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const barFill = container.querySelector('.compatibility-bar-fill');
  const scoreDisplay = container.querySelector('.compatibility-score');
  if (barFill && scoreDisplay) {
    const percentage = (score / maxScore) * 100;
    barFill.style.width = percentage + '%';
    scoreDisplay.textContent = Math.round(percentage) + '%';
    barFill.classList.remove('excellent', 'good', 'warning', 'poor');
    if (percentage >= 80) barFill.classList.add('excellent');
    else if (percentage >= 60) barFill.classList.add('good');
    else if (percentage >= 40) barFill.classList.add('warning');
    else barFill.classList.add('poor');
  }
}
const filterIcons = {'전체':'⚙️','부팅':'🔌','전원':'⚡','장치':'📱','성능':'💨','메모리':'🧠','저장소':'💾','그래픽':'🎮','네트워크':'🌐','오류코드':'⚠️','드라이버':'🔧','게임':'🎯'};
function initFilterButtons() {
  const filterButtons = document.querySelectorAll('.filter-btn-icon');
  filterButtons.forEach(btn => {
    const text = btn.textContent.trim();
    for (const [keyword, icon] of Object.entries(filterIcons)) {
      if (text.includes(keyword)) {
        btn.innerHTML = `<span>${icon}</span> ${text}`;
        break;
      }
    }
    btn.addEventListener('click', () => {
      const parent = btn.parentElement;
      const siblings = parent.querySelectorAll('.filter-btn-icon');
      siblings.forEach(sibling => sibling.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}
document.addEventListener('DOMContentLoaded', () => {
  initTableOfContents();
  initDarkModeToggle();
  initFilterButtons();
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
window.DesignSystem = { updateCompatibilityBar, applyTheme, initTableOfContents, initDarkModeToggle, initFilterButtons };
