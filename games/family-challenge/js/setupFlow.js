(function () {
  const order = ['teams', 'settings', 'categories'];
  let playing = false;
  let unlocked = 0;
  function show(step, replace = false) {
    if (playing) step = 'play';
    else if (!order.includes(step) || order.indexOf(step) > unlocked) step = order[unlocked];
    document.querySelectorAll('[data-setup-panel]').forEach(panel => {
      panel.hidden = panel.dataset.setupPanel !== step;
    });
    document.querySelectorAll('#setupSteps [data-step]').forEach(button => {
      button.disabled = order.indexOf(button.dataset.step) > unlocked;
      if (button.dataset.step === step) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    document.getElementById('setupSteps').hidden = playing;
    document.body.classList.toggle('is-playing', playing);
    if (location.hash !== '#' + step) history[replace ? 'replaceState' : 'pushState'](null, '', '#' + step);
    document.querySelector(`[data-setup-panel="${step}"] h2`)?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  document.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => {
    const target = order.indexOf(button.dataset.step);
    unlocked = Math.max(unlocked, target);
    show(button.dataset.step);
  }));
  window.addEventListener('popstate', () => show(location.hash.slice(1), true));
  window.addEventListener('hashchange', () => show(location.hash.slice(1), true));
  window.SetupFlow = Object.freeze({
    begin() { playing = true; show('play'); },
    reset() { playing = false; unlocked = 0; show('teams', true); }
  });
  show('teams', true);
})();
