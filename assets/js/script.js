/* ============================================================
   Sakthi Swarup — portfolio behaviour
   ------------------------------------------------------------
   Five small, independent features. Each one is guarded: if its
   markup is missing the feature bows out and the others still
   run. Nothing here is required to read the page — the layout,
   the timeline and every project are in the HTML and CSS.

   1. theme      light/dark, remembered, defaults to the OS
   2. menu       the narrow-screen nav panel
   3. filters    projects by area, announced to screen readers
   4. scrollspy  marks the section you are reading in the nav
   5. to top     shows the corner button once you have scrolled
   ============================================================ */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var NARROW = window.matchMedia('(max-width: 48rem)');

  /* --- 1. theme ------------------------------------------------
     The <head> script has already put the right class on <html>,
     so all this does is keep the button in sync and write the
     choice down. aria-pressed carries the state; the label stays
     "Dark" so the name and the state never contradict.         */

  function initTheme() {
    var button = document.getElementById('theme-toggle');
    if (!button) return;

    var root = document.documentElement;
    var stored = null;
    try { stored = localStorage.getItem('theme'); } catch (e) {}

    function sync() {
      button.setAttribute('aria-pressed', root.classList.contains('dark') ? 'true' : 'false');
    }

    button.addEventListener('click', function () {
      var dark = root.classList.toggle('dark');
      try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) {}
      sync();
    });

    // Follow the OS until the visitor has expressed a preference.
    if (!stored) {
      var os = window.matchMedia('(prefers-color-scheme: dark)');
      var followOS = function (event) { root.classList.toggle('dark', event.matches); sync(); };
      if (os.addEventListener) os.addEventListener('change', followOS);
      else if (os.addListener) os.addListener(followOS);
    }

    sync();
  }

  /* --- 2. menu -------------------------------------------------
     Only exists below 48rem, where the CSS shows .nav-toggle and
     hides .nav until it gets .is-open.                          */

  function initMenu() {
    var button = document.getElementById('nav-toggle');
    var nav = document.getElementById('nav');
    if (!button || !nav) return;

    function close() {
      nav.classList.remove('is-open');
      button.setAttribute('aria-expanded', 'false');
    }

    button.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // Tapping a section link should get you there, not leave a panel open.
    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) close();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        close();
        button.focus();
      }
    });

    var onWidthChange = function (event) { if (!event.matches) close(); };
    if (NARROW.addEventListener) NARROW.addEventListener('change', onWidthChange);
    else if (NARROW.addListener) NARROW.addListener(onWidthChange);
  }

  /* --- 3. filters ----------------------------------------------
     Hiding uses the hidden attribute rather than an inline style,
     so the projects stay out of the accessibility tree too. The
     count is written into a live region, because a filter that
     changes the page silently is no use to a screen reader.     */

  function initFilters() {
    var buttons = [].slice.call(document.querySelectorAll('.filter[data-filter]'));
    var projects = [].slice.call(document.querySelectorAll('.project[data-category]'));
    var status = document.querySelector('.filter-status');
    if (!buttons.length || !projects.length) return;

    var total = projects.length;

    function labelOf(button) {
      var text = '';
      for (var i = 0; i < button.childNodes.length; i++) {
        if (button.childNodes[i].nodeType === 3) text += button.childNodes[i].textContent;
      }
      return text.trim();
    }

    function apply(active) {
      var shown = 0;

      projects.forEach(function (project) {
        var match = active === 'all' || project.getAttribute('data-category') === active;
        project.hidden = !match;
        if (match) shown++;
      });

      buttons.forEach(function (button) {
        var on = button.getAttribute('data-filter') === active;
        button.setAttribute('aria-pressed', on ? 'true' : 'false');
        button.classList.toggle('is-active', on);
      });

      if (!status) return;
      if (active === 'all') {
        status.textContent = 'Showing all ' + total + ' projects.';
        return;
      }

      var chosen = buttons.filter(function (b) {
        return b.getAttribute('data-filter') === active;
      })[0];

      status.textContent = 'Showing ' + shown + ' of ' + total +
        (chosen ? ' — ' + labelOf(chosen).toLowerCase() : '') + '.';
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        apply(button.getAttribute('data-filter'));
      });
    });
  }

  /* --- 4. scrollspy --------------------------------------------
     Measured against a line just below the sticky masthead, so a
     section counts as "current" once its heading clears the bar.
     Read once per animation frame, never on every scroll event.  */

  function initScrollspy() {
    var links = [].slice.call(document.querySelectorAll('.nav a[href^="#"]'));
    if (!links.length) return;

    var targets = links
      .map(function (link) {
        return { link: link, section: document.getElementById(link.hash.slice(1)) };
      })
      .filter(function (pair) { return pair.section; });
    if (!targets.length) return;

    var masthead = document.querySelector('.masthead');
    var queued = false;
    var currentLink = null;

    function measure() {
      queued = false;
      var offset = (masthead ? masthead.offsetHeight : 0) + 24;
      var line = window.scrollY + offset;
      var atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 2;
      var found = null;

      targets.forEach(function (pair) {
        var top = pair.section.getBoundingClientRect().top + window.scrollY;
        if (top <= line) found = pair.link;
      });

      if (atBottom) found = targets[targets.length - 1].link;

      if (found === currentLink) return;
      if (currentLink) currentLink.removeAttribute('aria-current');
      if (found) found.setAttribute('aria-current', 'true');
      currentLink = found;
    }

    function request() {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(measure);
    }

    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    measure();
  }

  /* --- 5. to top -----------------------------------------------
     Appears after roughly one screen of scrolling, so it is never
     in the way of the hero.                                      */

  function initBackToTop() {
    var button = document.getElementById('back-to-top');
    if (!button) return;

    var queued = false;

    function measure() {
      queued = false;
      button.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.6);
    }

    window.addEventListener('scroll', function () {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(measure);
    }, { passive: true });

    button.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    });

    measure();
  }

  initTheme();
  initMenu();
  initFilters();
  initScrollspy();
  initBackToTop();
})();
