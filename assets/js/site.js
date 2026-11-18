/* The Lackey Law Firm — site script (replaces jQuery + Elementor runtime).
   Mobile menu, nav dropdowns, tabs, sticky-header shadow, reveal-on-scroll,
   lazy JotForm embed and deferred chat widget. No dependencies. */
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

  // Auto-scrolling strip (awards): items are cloned once so the loop is
  // seamless; it pauses on hover, focus and touch, and stays a normal
  // swipeable scroller for visitors who prefer reduced motion.
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.scroller[data-autoscroll]').forEach(function (track) {
      var originals = Array.prototype.slice.call(track.children);
      originals.forEach(function (el) {
        var c = el.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        c.querySelectorAll('a, button').forEach(function (f) { f.tabIndex = -1; });
        track.appendChild(c);
      });
      track.classList.add('is-auto');
      var n = originals.length;
      // Measure the loop length once (and again when the strip resizes),
      // not on every animation frame, to avoid forced layout.
      var half = 0;
      var measure = function () { half = track.children[n].offsetLeft - track.children[0].offsetLeft; };
      measure();
      if ('ResizeObserver' in window) new ResizeObserver(measure).observe(track);
      else window.addEventListener('resize', measure);
      var pos = track.scrollLeft, paused = false, resumeT, last = null, speed = 40; // px per second
      var pause = function () { paused = true; clearTimeout(resumeT); };
      var resume = function (delay) {
        clearTimeout(resumeT);
        resumeT = setTimeout(function () { pos = track.scrollLeft; last = null; paused = false; }, delay || 0);
      };
      track.addEventListener('mouseenter', pause);
      track.addEventListener('mouseleave', function () { resume(); });
      track.addEventListener('focusin', pause);
      track.addEventListener('focusout', function () { resume(); });
      track.addEventListener('touchstart', pause, { passive: true });
      track.addEventListener('touchend', function () { resume(2500); }, { passive: true });
      track.addEventListener('wheel', function () { pause(); resume(2500); }, { passive: true });
      var step = function (t) {
        if (!paused && !document.hidden) {
          if (last !== null && half > 0) {
            pos += speed * Math.min(t - last, 100) / 1000;
            if (pos >= half) pos -= half;
            track.scrollLeft = pos;
          }
          last = t;
        } else {
          last = null;
          if (half > 0 && track.scrollLeft >= half) track.scrollLeft -= half;
        }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  // JotForm contact form: built only when it nears the screen. The form brings
  // reCAPTCHA and ~2 MB of third-party script, so loading it up front was the
  // main cause of slow load and blocked main thread on the home page.
  var loadScript = function (src, onload) {
    var sc = document.createElement('script');
    sc.src = src; sc.async = true;
    if (onload) sc.onload = onload;
    document.head.appendChild(sc);
  };
  var forms = document.querySelectorAll('[data-jotform]');
  var buildForm = function (box) {
    if (box.dataset.loaded) return;
    box.dataset.loaded = '1';
    var id = box.getAttribute('data-jotform');
    var f = document.createElement('iframe');
    f.id = 'JotFormIFrame-' + id;
    f.title = 'Contact form';
    f.src = 'https://form.jotform.com/' + id;
    f.allow = 'geolocation; microphone; camera; fullscreen';
    f.setAttribute('allowtransparency', 'true');
    box.appendChild(f);
    loadScript('https://cdn.jotfor.ms/s/umd/latest/for-form-embed-handler.js', function () {
      if (window.jotformEmbedHandler) window.jotformEmbedHandler("iframe[id='" + f.id + "']", 'https://form.jotform.com/');
    });
  };
  if (forms.length) {
    if ('IntersectionObserver' in window) {
      var fio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { fio.unobserve(en.target); buildForm(en.target); } });
      }, { rootMargin: '400px 0px' });
      forms.forEach(function (box) { fio.observe(box); });
    } else {
      forms.forEach(buildForm);
    }
  }

  // Collect.chat widget: loaded on the visitor's first scroll, tap, click or
  // key press instead of during page load.
  var chatEvents = ['scroll', 'pointerdown', 'keydown', 'touchstart'];
  var loadChat = function () {
    chatEvents.forEach(function (ev) { window.removeEventListener(ev, loadChat, { passive: true }); });
    if (window.CollectId) return;
    window.CollectId = '5db1efdece96ee05323484e9';
    loadScript('https://collectcdn.com/launcher.js');
  };
  chatEvents.forEach(function (ev) { window.addEventListener(ev, loadChat, { passive: true }); });

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
