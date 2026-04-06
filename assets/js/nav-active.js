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

  const btn = document.getElementById('nav-menu-btn');
  const drawer = document.getElementById('nav-drawer');
  const overlay = document.getElementById('nav-drawer-overlay');
  if (btn && drawer && overlay) {
    const closeDrawer = () => {
      drawer.classList.remove('show');
      overlay.classList.remove('show');
      document.body.style.overflow = '';
    };
    btn.addEventListener('click', () => {
      const open = !drawer.classList.contains('show');
      drawer.classList.toggle('show', open);
      overlay.classList.toggle('show', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    overlay.addEventListener('click', closeDrawer);
    drawer.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeDrawer));
  }
})();