/* Live3C — nav active auto highlight */
(() => {
  const path = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav-link[href]').forEach((a) => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    if (!href || href.startsWith('#') || href.includes('#')) return;
    const same = href === path;
    a.classList.toggle('active', same);
    if (same) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
})();