(function () {
  let saved;
  try { saved = localStorage.getItem('beit-sido-theme'); } catch {}
  const preferred = window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  document.documentElement.dataset.theme = ['light', 'dark'].includes(saved) ? saved : preferred;
  function render() {
    const light = document.documentElement.dataset.theme === 'light';
    document.querySelectorAll('.theme-toggle').forEach(button => {
      button.textContent = light ? '☾ الوضع الليلي' : '☀ الوضع النهاري';
      button.setAttribute('aria-pressed', String(light));
    });
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', light ? '#f5f3ed' : '#101c27');
  }
  document.addEventListener('DOMContentLoaded', () => {
    render();
    document.querySelectorAll('.theme-toggle').forEach(button => button.addEventListener('click', () => {
      const theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
      document.documentElement.dataset.theme = theme;
      try { localStorage.setItem('beit-sido-theme', theme); } catch {}
      render();
    }));
  });
})();
