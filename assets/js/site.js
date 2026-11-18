/* The Lackey Law Firm — site script (replaces jQuery + Elementor runtime).
   Mobile menu, nav dropdowns, tabs, sticky-header shadow, reveal-on-scroll. No dependencies. */
(function () {
  var doc = document.documentElement;
  doc.classList.add('js');

  // Mobile menu
  var toggle = document.querySelector('.nav-toggle');
  var nav = toggle && document.getElementById(toggle.getAttribute('aria-controls'));
  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', function () { setOpen(toggle.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  }

  // Dropdown menus in the main navigation (hover opens them on desktop; this
  // makes them work by click, tap and keyboard too)
  var triggers = document.querySelectorAll('.nav__trigger');
  var closeMenus = function (except) {
    triggers.forEach(function (t) { if (t !== except) t.setAttribute('aria-expanded', 'false'); });
  };
  triggers.forEach(function (t) {
    t.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = t.getAttribute('aria-expanded') !== 'true';
      closeMenus(t);
      t.setAttribute('aria-expanded', String(open));
    });
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.nav__item')) closeMenus(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenus(); });

  // Tabs: panels stack without JS; with JS only the selected one shows
  document.querySelectorAll('.tabs').forEach(function (box) {
    var tabs = box.querySelectorAll('[role="tab"]');
    var select = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab, panel = document.getElementById(t.getAttribute('aria-controls'));
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) select(tabs[(i + d + tabs.length) % tabs.length], true);
      });
    });
    var first = box.querySelector('[role="tab"][aria-selected="true"]') || tabs[0];
    if (first) select(first);
  });

  // Header shadow once the page has scrolled
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Reveal on scroll (skipped when the visitor prefers reduced motion)
  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }
})();
