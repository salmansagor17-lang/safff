(function () {
  let saved;
  try { saved = localStorage.getItem('beit-sido-theme'); } catch {}
  document.documentElement.dataset.theme = ['light', 'dark'].includes(saved) ? saved : 'dark';

  function render() {
    const light = document.documentElement.dataset.theme === 'light';
    document.querySelectorAll('.theme-toggle').forEach(button => {
      const compact = button.dataset.compact === 'true';
      button.textContent = compact ? (light ? '☾' : '☀') : (light ? '☾ الوضع الليلي' : '☀ الوضع النهاري');
      button.title = light ? 'الوضع الليلي' : 'الوضع النهاري';
      button.setAttribute('aria-pressed', String(light));
    });
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', light ? '#F8FAFC' : '#0F172A');
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
