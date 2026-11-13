/* ==========================================================================
   dashboards.js — three interactive panels, drawn by hand in SVG
   --------------------------------------------------------------------------
   No charting library. Not out of stubbornness: a library would be about
   60 KB to draw eleven charts that need eleven specific things, and the
   interesting part of a portfolio piece is the part you wrote.

   The file is in two halves. The top half is arithmetic — scales, tick
   choices, path strings, medians, histograms — and touches no DOM at all,
   so it can be required into Node and unit-tested. It is exported as
   window.CHART_MATH for exactly that reason. The bottom half turns those
   numbers into elements.

   Everything reads window.DATA, which is synthetic. See data.js.
   ========================================================================== */

(function () {
  'use strict';

  /* ======================================================================
     PART ONE — arithmetic. No document, no window beyond the export.
     ====================================================================== */

  /* --- summary statistics ----------------------------------------------- */

  function extent(values) {
    var lo = Infinity, hi = -Infinity;
    for (var i = 0; i < values.length; i++) {
      var v = values[i];
      if (v === null || v === undefined || v !== v) continue;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    return lo === Infinity ? [0, 1] : [lo, hi];
  }

  function mean(values) {
    if (!values.length) return 0;
    var s = 0;
    for (var i = 0; i < values.length; i++) s += values[i];
    return s / values.length;
  }

  /* Linear-interpolated quantile on an already-sorted array — the same
     definition Excel's PERCENTILE and numpy's default use, so a reader
     who checks the numbers in a spreadsheet gets the same answer. */
  function quantile(sorted, p) {
    var n = sorted.length;
    if (!n) return 0;
    if (n === 1) return sorted[0];
    var h = (n - 1) * p;
    var lo = Math.floor(h);
    var hi = Math.min(lo + 1, n - 1);
    return sorted[lo] + (h - lo) * (sorted[hi] - sorted[lo]);
  }

  function median(values) {
    return quantile(values.slice().sort(function (a, b) { return a - b; }), 0.5);
  }

  function rmse(errors) {
    if (!errors.length) return 0;
    var s = 0;
    for (var i = 0; i < errors.length; i++) s += errors[i] * errors[i];
    return Math.sqrt(s / errors.length);
  }

  /* --- axes -------------------------------------------------------------
     A tick step is only allowed to be 1, 2, 2.5, 5 or 10 times a power of
     ten. Those are the intervals people can add up in their head; 3s and
     7s make a reader do arithmetic to answer "how much is that". */

  var STEPS = [1, 2, 2.5, 5, 10];

  function niceStep(span, count) {
    if (!(span > 0)) return 1;
    var raw = span / Math.max(1, count);
    var mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    for (var i = 0; i < STEPS.length; i++) {
      if (raw <= STEPS[i] * mag * 1.0000001) return STEPS[i] * mag;
    }
    return 10 * mag;
  }

  /* zero: pull the axis down to zero even if the data does not reach it.
     True for bar charts, where a clipped baseline exaggerates difference,
     and false for price series, where insisting on zero throws away all
     the resolution the reader came for. */
  function nice(lo, hi, count, zero) {
    if (zero) { lo = Math.min(0, lo); hi = Math.max(0, hi); }
    if (lo === hi) { lo -= 0.5; hi += 0.5; }
    var step = niceStep(hi - lo, count || 5);
    var a = Math.floor(lo / step) * step;
    var b = Math.ceil(hi / step) * step;
    var ticks = [];
    // Count the steps rather than accumulating, so float drift cannot
    // turn 0.30000000000000004 into a tick label.
    var n = Math.round((b - a) / step);
    for (var i = 0; i <= n; i++) ticks.push(Math.round((a + i * step) / step) * step);
    return { lo: a, hi: b, step: step, ticks: ticks };
  }

  function scale(d0, d1, r0, r1) {
    var span = d1 - d0;
    if (span === 0) return function () { return (r0 + r1) / 2; };
    return function (v) { return r0 + ((v - d0) / span) * (r1 - r0); };
  }

  /* Evenly spaced slots for categories. pad is the share of each slot
     left as gutter, so 0.3 means bars occupy 70% of their slot. */
  function slots(n, r0, r1, pad) {
    var step = n > 0 ? (r1 - r0) / n : 0;
    var width = step * (1 - (pad === undefined ? 0.3 : pad));
    return {
      step: step,
      width: Math.max(1, width),
      at: function (i) { return r0 + step * i + (step - width) / 2; },
      mid: function (i) { return r0 + step * (i + 0.5); }
    };
  }

  /* --- path strings -----------------------------------------------------
     Straight segments, no smoothing. A spline through monthly points
     invents readings between the months that were never measured, and on
     a chart about hospital performance that is not a small lie. */

  function r2(v) { return Math.round(v * 100) / 100; }

  /* Points are [x, y] or null. Nulls break the line into a new subpath
     instead of drawing through the gap — the forecast series starts late
     and a line joining nothing to something would imply data. */
  function path(points) {
    var out = '', pen = false;
    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      if (!p) { pen = false; continue; }
      out += (pen ? 'L' : 'M') + r2(p[0]) + ' ' + r2(p[1]);
      pen = true;
    }
    return out;
  }

  /* One closed shape per contiguous run: forward along the top, back
     along the bottom. */
  function area(top, bottom) {
    var out = '', run = [];
    function flush() {
      if (run.length < 2) { run = []; return; }
      var i;
      for (i = 0; i < run.length; i++) {
        out += (i ? 'L' : 'M') + r2(top[run[i]][0]) + ' ' + r2(top[run[i]][1]);
      }
      for (i = run.length - 1; i >= 0; i--) {
        out += 'L' + r2(bottom[run[i]][0]) + ' ' + r2(bottom[run[i]][1]);
      }
      out += 'Z';
      run = [];
    }
    for (var i = 0; i < top.length; i++) {
      if (top[i] && bottom[i]) run.push(i); else flush();
    }
    flush();
    return out;
  }

  /* Which point is the cursor nearest, for a series on even x spacing. */
  function nearest(n, x, r0, r1) {
    if (n < 2) return 0;
    var t = (x - r0) / (r1 - r0);
    return Math.max(0, Math.min(n - 1, Math.round(t * (n - 1))));
  }

  /* --- distribution ----------------------------------------------------- */

  function histogram(values, targetBins) {
    if (!values.length) return { bins: [], max: 0, lo: 0, hi: 1, step: 1 };
    var e = extent(values);
    var n = nice(e[0], e[1], targetBins || 12, false);
    var count = Math.max(1, Math.round((n.hi - n.lo) / n.step));
    var bins = [], i;
    for (i = 0; i < count; i++) {
      bins.push({ x0: n.lo + i * n.step, x1: n.lo + (i + 1) * n.step, n: 0 });
    }
    for (i = 0; i < values.length; i++) {
      var k = Math.floor((values[i] - n.lo) / n.step);
      bins[k < 0 ? 0 : k >= count ? count - 1 : k].n++;
    }
    var max = 0;
    for (i = 0; i < count; i++) if (bins[i].n > max) max = bins[i].n;
    return { bins: bins, max: max, lo: n.lo, hi: n.hi, step: n.step };
  }

  /* --- number formatting ------------------------------------------------
     Grouping is done with a regex rather than toLocaleString, so the same
     figure appears in a screenshot, a screen reader and a European
     browser. A dashboard that says 148.000 in one place and 148,000 in
     another has lost the reader's trust over nothing.

     Negatives use a real minus sign, U+2212, which lines up with digits
     in a tabular font where a hyphen does not. */

  var MINUS = '−';

  function group(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function num(v, dp) {
    var s = Math.abs(v).toFixed(dp || 0).split('.');
    return (v < 0 ? MINUS : '') + group(s[0]) + (s[1] ? '.' + s[1] : '');
  }
  function money(v) { return '$' + num(Math.round(v)); }
  function moneyShort(v) {
    var a = Math.abs(v);
    if (a >= 1000000) return '$' + num(v / 1000000, a >= 10000000 ? 0 : 1) + 'm';
    if (a >= 1000) return '$' + num(v / 1000, 0) + 'k';
    return '$' + num(v);
  }
  function pct(v, dp) { return num(v, dp === undefined ? 1 : dp) + '%'; }
  function signed(v, dp, unit) {
    var body = num(Math.abs(v), dp === undefined ? 1 : dp);
    return (v > 0 ? '+' : v < 0 ? MINUS : '') + body + (unit || '');
  }

  var MATH = {
    extent: extent, mean: mean, median: median, quantile: quantile, rmse: rmse,
    niceStep: niceStep, nice: nice, scale: scale, slots: slots,
    path: path, area: area, nearest: nearest, histogram: histogram,
    num: num, money: money, moneyShort: moneyShort, pct: pct,
    signed: signed, group: group, MINUS: MINUS
  };
  if (typeof window !== 'undefined') window.CHART_MATH = MATH;
  if (typeof module !== 'undefined' && module.exports) module.exports = MATH;

  /* ======================================================================
     PART TWO — elements. Everything below this line touches the document.
     ====================================================================== */

  if (typeof document === 'undefined' || !window.DATA) return;

  var DATA = window.DATA;
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  function el(name, attrs) {
    var node = document.createElementNS(NS, name);
    if (attrs) for (var k in attrs) if (attrs.hasOwnProperty(k)) {
      node.setAttribute(k, attrs[k]);
    }
    return node;
  }
  function label(node, s) { node.textContent = s; return node; }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return [].slice.call((ctx || document).querySelectorAll(sel)); }

  /* --- a plot -----------------------------------------------------------
     One <svg> per plot, rebuilt from scratch on every render. Rebuilding
     is not the obvious choice, but a chart here has at most a few hundred
     nodes and a filter change can alter every one of them, so a diff
     would cost more code than it saves frames.

     One user unit is one CSS pixel: the viewBox width is measured from
     the container, and only the width is fluid. The tempting alternative,
     a fixed viewBox scaled by CSS, shrinks the axis labels along with the
     chart, and a 10px label becomes 5px on a phone. */

  function Plot(host, cfg) {
    var self = {
      host: host, cfg: cfg, svg: null, tip: null, w: 0,
      state: null, hover: null
    };

    self.render = function () {
      var w = Math.max(220, Math.round(host.clientWidth));
      var h = cfg.height;
      var pad = cfg.pad;
      if (self.svg) host.removeChild(self.svg);

      var svg = el('svg', {
        viewBox: '0 0 ' + w + ' ' + h,
        role: 'img',
        preserveAspectRatio: 'xMidYMid meet'
      });
      self.svg = svg;
      self.w = w;

      var ctx = {
        svg: svg, w: w, h: h,
        L: pad.l, R: w - pad.r, T: pad.t, B: h - pad.b,
        plot: self,
        add: function (node) { svg.appendChild(node); return node; },
        aria: function (s) { svg.setAttribute('aria-label', s); }
      };
      ctx.iw = ctx.R - ctx.L;
      ctx.ih = ctx.B - ctx.T;

      host.appendChild(svg);
      cfg.draw(ctx, self.state);
      return self;
    };

    self.update = function (state) { self.state = state; return self.render(); };
    return self;
  }

  /* --- axes -------------------------------------------------------------
     Y labels sit outside the plot area, gridlines inside and underneath
     everything else. The x axis thins its own labels: it works out how
     many will fit at 46px apart and keeps every nth one, so the same code
     labels 24 months on a desktop and 6 on a phone without a breakpoint. */

  function gridY(ctx, sy, ticks, fmt) {
    ticks.forEach(function (t) {
      var y = Math.round(sy(t)) + 0.5;
      ctx.add(el('line', { class: 'gridline', x1: ctx.L, x2: ctx.R, y1: y, y2: y }));
      ctx.add(label(el('text', {
        class: 'tick', x: ctx.L - 9, y: y + 3.5, 'text-anchor': 'end'
      }), fmt(t)));
    });
  }

  function everyNth(count, width, minGap) {
    var fits = Math.max(1, Math.floor(width / (minGap || 46)));
    return Math.max(1, Math.ceil(count / fits));
  }

  function axisX(ctx, labels, at, minGap) {
    var step = everyNth(labels.length, ctx.iw, minGap);
    labels.forEach(function (s, i) {
      if (i % step || !s) return;
      ctx.add(label(el('text', {
        class: 'tick', x: Math.round(at(i)), y: ctx.B + 17, 'text-anchor': 'middle'
      }), s));
    });
    ctx.add(el('line', {
      class: 'axis-line',
      x1: ctx.L, x2: ctx.R,
      y1: Math.round(ctx.B) + 0.5, y2: Math.round(ctx.B) + 0.5
    }));
  }

  /* --- tooltip ----------------------------------------------------------
     A div rather than SVG text, so it can wrap, sit above the clipping
     edges and use the page's own type. Positioned against .plot, which
     the stylesheet makes the containing block, offset by the canvas box
     inside it — offsetLeft belongs to HTML elements, not SVG ones, so the
     measurement is taken from the wrapper. One svg unit is one pixel, so
     no scaling is needed on the way out.

     The markup it is handed is assembled below from numbers and from the
     fixed label strings in data.js. Nothing here comes from a visitor. */

  function Tip(plotEl) {
    var node = document.createElement('div');
    node.className = 'tip';
    node.setAttribute('aria-hidden', 'true');
    plotEl.appendChild(node);
    return {
      show: function (host, x, y, html) {
        node.innerHTML = html;
        node.style.left = (host.offsetLeft + x) + 'px';
        node.style.top = (host.offsetTop + y) + 'px';
        node.classList.add('is-on');
      },
      hide: function () { node.classList.remove('is-on'); }
    };
  }

  /* --- KPI count-up -----------------------------------------------------
     Counts from whatever the figure said a moment ago, not from zero, so
     changing a filter reads as the number moving rather than the panel
     resetting. Under reduced motion it just writes the value. */

  function countUp(node, to, fmt) {
    var from = typeof node.__v === 'number' ? node.__v : 0;
    node.__v = to;
    if (reduce.matches || from === to) { node.textContent = fmt(to); return; }
    var t0 = 0;
    var token = (node.__t = (node.__t || 0) + 1);
    function frame(ts) {
      if (node.__t !== token) return;           // a newer count-up took over
      if (!t0) t0 = ts;
      var k = Math.min(1, (ts - t0) / 620);
      var eased = 1 - Math.pow(1 - k, 3);
      node.textContent = fmt(from + (to - from) * eased);
      if (k < 1) window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }

  function delta(node, value, dp, unit, goodIsDown, tail) {
    node.textContent = value === 0 ? 'no change'
      : signed(value, dp, unit) + (tail || '');
    var good = goodIsDown ? value < 0 : value > 0;
    node.classList.toggle('is-good', value !== 0 && good);
    node.classList.toggle('is-bad', value !== 0 && !good);
  }

  /* --- segmented controls -----------------------------------------------
     Same contract as the project filters already on the page: buttons
     carry the state in aria-pressed and the look in .is-active, so the
     two never disagree. One delegated listener per group. */

  function seg(root, initial, onPick) {
    var buttons = $$('button[data-v]', root);

    function set(v, quiet) {
      buttons.forEach(function (b) {
        var on = b.getAttribute('data-v') === String(v);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.classList.toggle('is-active', on);
      });
      if (!quiet) onPick(String(v));
    }

    root.addEventListener('click', function (event) {
      var b = event.target.closest ? event.target.closest('button[data-v]') : null;
      if (b && root.contains(b)) set(b.getAttribute('data-v'));
    });

    set(initial, true);
    return {
      set: set,
      textOf: function (v) {
        for (var i = 0; i < buttons.length; i++) {
          if (buttons[i].getAttribute('data-v') === String(v)) {
            return buttons[i].textContent.trim();
          }
        }
        return String(v);
      }
    };
  }

  /* --- drawing once, and only once --------------------------------------
     The trace and rise animations are attached to .plot-anim in the
     stylesheet. This adds .is-drawn when the plot first scrolls into
     view, then takes both classes off once the animation has run, which
     means a later re-render — a filter change, a window resize — inserts
     its elements into a container that no animation rule matches any
     more. Touching a control settles the plot immediately: if you have
     started asking questions you should not have to wait for a flourish. */

  var pending = [];

  function settle(node) {
    if (!node.classList.contains('plot-anim')) return;
    node.classList.remove('plot-anim', 'is-drawn');
  }

  function settleAll(root) { $$('.plot', root).forEach(settle); }

  function watchDraw(node) {
    node.classList.add('plot-anim');
    pending.push(node);
  }

  function startWatching() {
    if (!window.IntersectionObserver) {
      pending.forEach(settle);
      pending = [];
      return;
    }
    var io = new window.IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var node = entry.target;
        io.unobserve(node);
        node.classList.add('is-drawn');
        window.setTimeout(function () { settle(node); }, 1500);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    pending.forEach(function (node) { io.observe(node); });
    pending = [];
  }

  /* --- width changes ----------------------------------------------------
     Plots re-render on resize because their pixel geometry is measured,
     not scaled. The 10px deadband stops a mobile browser's collapsing
     address bar from triggering a redraw on every scroll frame. */

  var plots = [];
  var lastWidth = 0;
  var queued = false;

  function onResize() {
    queued = false;
    var w = document.documentElement.clientWidth;
    if (Math.abs(w - lastWidth) < 10) return;
    lastWidth = w;
    plots.forEach(function (p) { p.render(); });
  }

  window.addEventListener('resize', function () {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(onResize);
  });

  function track(p) { plots.push(p); return p; }

  /* --- the reading cursor -----------------------------------------------
     One transparent rectangle catches the pointer for the whole plot
     area, so there is no hunting for a 3px dot. The same index is driven
     by the arrow keys with the svg focused, Shift for a bigger jump, Home
     and End for the ends, Escape to let go — which makes the chart
     readable without a mouse, and is the reason the svg is focusable at
     all. Everything the cursor draws goes into its own layer so it can be
     wiped without disturbing the series underneath. */

  function setLen(node) {
    if (!node) return;
    try {
      node.style.setProperty('--len', Math.ceil(node.getTotalLength()) + 1);
    } catch (e) { /* no geometry engine, e.g. under test */ }
  }

  /* A filter can cut a series down to isolated points, and a band needs two
     of them before it has a shape. Rather than leave <path d=""> in the
     tree — an element that draws nothing and still has to be parsed — skip
     it, and let the dots carry the years that survived on their own. */
  function addPath(ctx, cls, d) {
    if (!d) return null;
    return ctx.add(el('path', { class: cls, d: d }));
  }

  function cursor(ctx, n, handlers) {
    var svg = ctx.svg;
    var layer = ctx.add(el('g', { class: 'cursor-layer' }));
    ctx.add(el('rect', {
      class: 'hit', x: ctx.L, y: ctx.T,
      width: Math.max(0, ctx.iw), height: Math.max(0, ctx.ih)
    }));
    svg.setAttribute('class', 'plot-surface');
    svg.setAttribute('tabindex', '0');

    var idx = -1;

    function wipe() { while (layer.firstChild) layer.removeChild(layer.firstChild); }

    function move(i) {
      if (!(i >= 0) || i >= n) return;
      idx = i;
      wipe();
      handlers.draw(ctx, layer, i);
    }

    function leave() { idx = -1; wipe(); if (handlers.leave) handlers.leave(); }

    svg.addEventListener('pointermove', function (event) {
      var box = svg.getBoundingClientRect();
      if (!box.width) return;
      move(handlers.index((event.clientX - box.left) * (ctx.w / box.width)));
    });
    svg.addEventListener('pointerleave', leave);
    svg.addEventListener('blur', leave);

    svg.addEventListener('keydown', function (event) {
      var jump = event.shiftKey ? Math.max(2, Math.round(n / 8)) : 1;
      var at = idx < 0 ? n - 1 : idx;
      if (event.key === 'ArrowRight' || event.key === 'ArrowUp') move(Math.min(n - 1, at + jump));
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') move(Math.max(0, at - jump));
      else if (event.key === 'Home') move(0);
      else if (event.key === 'End') move(n - 1);
      else if (event.key === 'Escape') leave();
      else return;
      event.preventDefault();
    });

    return { move: move, leave: leave };
  }

  /* ======================================================================
     PANEL ONE — hospital operations
     ----------------------------------------------------------------------
     Twenty-four months, seven service lines, five metrics. The two charts
     are wired to each other: clicking a bar on the right selects that
     service line on the left, which is the question anyone actually asks
     of a comparison chart — "what happened in that one?"

     Aggregation is the part worth reading. A readmission rate for the
     whole hospital is not the average of seven rates, it is the average
     weighted by how many patients each line saw, or a small line with a
     bad month outvotes the emergency department. Occupancy is the
     exception: weighting it by encounters would be meaningless, since it
     is a property of beds, so it is a plain mean and the chart says so.
     ====================================================================== */

  var OPS = DATA.ops;

  var OPS_METRICS = {
    readmit: {
      name: '30-day readmission', short: 'Readmission', agg: 'wavg',
      fmt: function (v) { return pct(v, 1); }, axis: function (v) { return num(v, 0) + '%'; },
      unit: ' pts', dp: 1, target: OPS.targets.readmit, better: 'down'
    },
    wait: {
      name: 'Door-to-provider time', short: 'Wait', agg: 'wavg',
      fmt: function (v) { return num(v, 0) + ' min'; }, axis: function (v) { return num(v, 0); },
      unit: ' min', dp: 0, target: OPS.targets.wait, better: 'down'
    },
    los: {
      name: 'Average length of stay', short: 'Stay', agg: 'wavg',
      fmt: function (v) { return num(v, 2) + ' days'; }, axis: function (v) { return num(v, 1); },
      unit: ' days', dp: 2, target: null, better: 'down'
    },
    occ: {
      name: 'Bed occupancy', short: 'Occupancy', agg: 'mean',
      fmt: function (v) { return pct(v, 1); }, axis: function (v) { return num(v, 0) + '%'; },
      unit: ' pts', dp: 1, target: OPS.targets.occ, better: 'target'
    },
    enc: {
      name: 'Encounters per month', short: 'Volume', agg: 'sum',
      fmt: function (v) { return num(v, 0); }, axis: function (v) { return num(Math.round(v / 100) / 10, 1) + 'k'; },
      unit: '', dp: 0, target: null, better: 'up'
    }
  };

  var OPS_SHORT = {
    ed: 'Emergency', card: 'Cardiology', ortho: 'Orthopaedics', onc: 'Oncology',
    mat: 'Maternity', bh: 'Behav. health', gen: 'Gen. medicine'
  };

  /* rows indexed by department, then by month, so a series is a lookup
     rather than a scan through 168 records for every redraw */
  var OPS_BY = (function () {
    var by = {};
    OPS.departments.forEach(function (d) { by[d.id] = []; });
    OPS.rows.forEach(function (row) { by[row.d][row.i] = row; });
    return by;
  })();

  /* One month of one metric, for one line or for the hospital. */
  function opsValue(deptId, key, i) {
    var m = OPS_METRICS[key];
    if (deptId !== 'all') return OPS_BY[deptId][i][key];

    var total = 0, weight = 0, n = 0;
    OPS.departments.forEach(function (d) {
      var row = OPS_BY[d.id][i];
      if (m.agg === 'sum') { total += row[key]; return; }
      if (m.agg === 'mean') { total += row[key]; n++; return; }
      total += row[key] * row.enc;
      weight += row.enc;
    });
    if (m.agg === 'sum') return total;
    if (m.agg === 'mean') return total / n;
    return total / weight;
  }

  function opsSeries(deptId, key, from) {
    var out = [];
    for (var i = from; i < OPS.months.length; i++) out.push(opsValue(deptId, key, i));
    return out;
  }

  /* Window mean per line, for the comparison chart. Encounters are shown
     as a monthly average rather than a total, so a six-month window and a
     twenty-four-month one are on the same scale. */
  function opsByDept(key, from) {
    return OPS.departments.map(function (d) {
      var s = 0, n = 0;
      for (var i = from; i < OPS.months.length; i++) { s += OPS_BY[d.id][i][key]; n++; }
      return { id: d.id, name: d.name, short: OPS_SHORT[d.id], v: s / n };
    });
  }

  /* Positive means the line got better, whichever direction better is.
     Occupancy improves by moving toward its target from either side. */
  function opsImprovement(deptId, key, from) {
    var m = OPS_METRICS[key];
    var s = opsSeries(deptId, key, from);
    var a = s[0], b = s[s.length - 1];
    if (m.better === 'target') return Math.abs(a - m.target) - Math.abs(b - m.target);
    return m.better === 'down' ? a - b : b - a;
  }

  function opsStats(st) {
    var m = OPS_METRICS[st.metric];
    var from = OPS.months.length - st.months;
    var series = opsSeries(st.dept, st.metric, from);
    var enc = 0, i;
    for (i = from; i < OPS.months.length; i++) enc += opsValue(st.dept, 'enc', i);

    var ranked = OPS.departments.map(function (d) {
      return { id: d.id, name: d.name, gain: opsImprovement(d.id, st.metric, from) };
    }).sort(function (a, b) { return b.gain - a.gain; });

    var off = null;
    if (m.target !== null) {
      off = opsByDept(st.metric, from).filter(function (row) {
        if (m.better === 'down') return row.v > m.target;
        if (m.better === 'up') return row.v < m.target;
        return Math.abs(row.v - m.target) > 5;
      }).sort(function (a, b) {
        return Math.abs(b.v - m.target) - Math.abs(a.v - m.target);
      });
    }

    return {
      m: m, from: from, series: series, months: OPS.months.slice(from),
      first: series[0], latest: series[series.length - 1],
      change: series[series.length - 1] - series[0],
      avg: mean(series), enc: enc, ranked: ranked, off: off
    };
  }

  function initOps() {
    var panel = $('[data-panel="ops"]');
    if (!panel) return;

    var st = { metric: 'readmit', dept: 'all', months: 24 };
    var trendHost = $('[data-plot="trend"]', panel);
    var deptHost = $('[data-plot="dept"]', panel);
    var readout = $('[data-readout]', panel);
    var say = $('[data-cursor]', panel);
    var range = $('#ops-window', panel);
    var rangeOut = $('#ops-window-out', panel);
    var note = $('[data-note="trend"]', panel);
    var heading = $('[data-title="trend"]', panel);
    if (!trendHost || !deptHost) return;

    var trendTip = Tip(trendHost.parentNode);
    var deptTip = Tip(deptHost.parentNode);
    var deptSeg = null;
    var refocus = null;      // the bar to hand focus back to after a redraw

    function deptName(id) {
      if (id === 'all') return 'all seven service lines';
      for (var i = 0; i < OPS.departments.length; i++) {
        if (OPS.departments[i].id === id) return OPS.departments[i].name.toLowerCase();
      }
      return id;
    }

    /* --- the trend ------------------------------------------------------ */
    var trend = track(Plot(trendHost, {
      height: 300,
      pad: { l: 56, r: 18, t: 14, b: 32 },
      draw: function (ctx) {
        var s = opsStats(st), m = s.m;
        var values = s.series.slice();
        if (m.target !== null) values.push(m.target);
        var span = extent(values);
        var ax = nice(span[0], span[1], 5, st.metric === 'enc');
        var sy = scale(ax.lo, ax.hi, ctx.B, ctx.T);
        var sx = scale(0, s.series.length - 1, ctx.L, ctx.R);

        gridY(ctx, sy, ax.ticks, m.axis);
        axisX(ctx, s.months.map(function (mo) { return mo.label; }),
          function (i) { return sx(i); }, 50);

        if (m.target !== null) {
          var ty = Math.round(sy(m.target)) + 0.5;
          ctx.add(el('line', { class: 'target-line', x1: ctx.L, x2: ctx.R, y1: ty, y2: ty }));
          ctx.add(label(el('text', {
            class: 'tick', x: ctx.R, y: ty - 6, 'text-anchor': 'end'
          }), 'target ' + m.fmt(m.target)));
        }

        var pts = s.series.map(function (v, i) { return [sx(i), sy(v)]; });
        setLen(addPath(ctx, 'series-line', path(pts)));

        if (pts.length <= 14) {
          pts.forEach(function (p) {
            ctx.add(el('circle', { class: 'dot', cx: r2(p[0]), cy: r2(p[1]), r: 3 }));
          });
        }

        ctx.aria(m.name + ' for ' + deptName(st.dept) + ', ' + s.months[0].label +
          ' to ' + s.months[s.months.length - 1].label + ', ' + m.fmt(s.first) +
          ' to ' + m.fmt(s.latest) + '. Use the arrow keys to read each month.');

        cursor(ctx, s.series.length, {
          index: function (x) { return nearest(s.series.length, x, ctx.L, ctx.R); },
          draw: function (c, layer, i) {
            var x = r2(sx(i)), y = r2(sy(s.series[i]));
            layer.appendChild(el('line', { class: 'crosshair', x1: x, x2: x, y1: c.T, y2: c.B }));
            layer.appendChild(el('circle', { class: 'marker', cx: x, cy: y, r: 4.5 }));
            trendTip.show(trendHost, sx(i), sy(s.series[i]),
              '<b>' + m.fmt(s.series[i]) + '</b><br><span>' + s.months[i].label + '</span>');
            if (say) say.textContent = s.months[i].label + ': ' + m.fmt(s.series[i]);
          },
          leave: function () { trendTip.hide(); }
        });
      }
    }));

    /* --- the comparison ------------------------------------------------
       Horizontal, because seven service lines have names and names read
       along a line, not rotated under one. No x gridlines: each bar
       carries its own figure, and the comparison the reader makes is
       length against length. */
    var dept = track(Plot(deptHost, {
      height: 292,
      pad: { l: 98, r: 52, t: 8, b: 8 },
      draw: function (ctx) {
        var m = OPS_METRICS[st.metric];
        var from = OPS.months.length - st.months;
        var rows = opsByDept(st.metric, from).sort(function (a, b) { return b.v - a.v; });

        ctx.L = ctx.w < 400 ? 78 : 98;
        ctx.R = ctx.w - (ctx.w < 400 ? 44 : 54);
        ctx.iw = ctx.R - ctx.L;

        var top = nice(0, extent(rows.map(function (row) { return row.v; }))[1], 4, true).hi;
        var sx = scale(0, top, ctx.L, ctx.R);
        var band = slots(rows.length, ctx.T, ctx.B, 0.34);

        rows.forEach(function (row, i) {
          var y = band.at(i);
          var mid = y + band.width / 2;
          var w = Math.max(1.5, sx(row.v) - ctx.L);
          var on = row.id === st.dept;
          var g = ctx.add(el('g', { class: 'bar-row' }));

          var bar = el('rect', {
            class: 'bar is-h' + (on ? ' is-selected' : ''),
            x: ctx.L, y: r2(y), width: r2(w), height: r2(band.width)
          });
          bar.style.setProperty('--i', i);
          g.appendChild(bar);

          g.appendChild(label(el('text', {
            class: 'tick', x: ctx.L - 9, y: r2(mid + 3.5), 'text-anchor': 'end'
          }), row.short));
          g.appendChild(label(el('text', {
            class: 'tick', x: r2(ctx.L + w + 8), y: r2(mid + 3.5)
          }), m.fmt(row.v)));

          var hit = el('rect', {
            class: 'bar-hit', x: 0, y: r2(y - band.step * 0.17),
            width: ctx.w, height: r2(band.step),
            tabindex: '0', role: 'button',
            'aria-pressed': on ? 'true' : 'false',
            'aria-label': row.name + ', ' + m.fmt(row.v) +
              (on ? '. Selected — clear the filter.' : '. Show this service line.')
          });
          /* Activating a bar re-renders the plot, which destroys the node
             that had focus. Without this a keyboard user is dropped back to
             the top of the document by their own click, and the selection
             they just made cannot be undone from the keyboard. */
          var takeFocus = row.id === refocus;
          function pick() {
            refocus = row.id;
            if (deptSeg) deptSeg.set(on ? 'all' : row.id);
          }
          hit.addEventListener('click', pick);
          hit.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
              event.preventDefault();
              pick();
            }
          });
          hit.addEventListener('pointerenter', function () {
            deptTip.show(deptHost, ctx.L + w, y,
              '<b>' + m.fmt(row.v) + '</b><br><span>' + row.name + '</span>');
          });
          hit.addEventListener('pointerleave', function () { deptTip.hide(); });
          g.appendChild(hit);
          if (takeFocus) { refocus = null; hit.focus(); }
        });

        ctx.aria(m.name + ' by service line, ' + st.months +
          '-month average. Highest ' + rows[0].name + ' at ' + m.fmt(rows[0].v) +
          ', lowest ' + rows[rows.length - 1].name + ' at ' +
          m.fmt(rows[rows.length - 1].v) + '.');
      }
    }));

    /* --- figures and the sentence --------------------------------------
       The read-out is the part I would keep if I had to throw the rest
       away. A chart shows you a shape; a sentence tells you what the
       shape means, and it is also the only version of the panel a screen
       reader can get in one go, which is why it is a live region. */

    function kpiNodes(n) {
      return {
        t: $('[data-kt="' + n + '"]', panel),
        v: $('[data-kv="' + n + '"]', panel),
        d: $('[data-kd="' + n + '"]', panel)
      };
    }
    var K = [kpiNodes(1), kpiNodes(2), kpiNodes(3), kpiNodes(4)];

    function aggNote() {
      if (st.dept !== 'all') return deptName(st.dept).replace(/^./, function (c) {
        return c.toUpperCase();
      });
      if (st.metric === 'enc') return 'Total across lines';
      if (st.metric === 'occ') return 'Unweighted mean across lines';
      return 'Encounter-weighted across lines';
    }

    function paint() {
      var s = opsStats(st), m = s.m;
      var from = s.from;
      var byDept = opsByDept(st.metric, from).map(function (row) { return row.v; });
      var spread = extent(byDept)[1] - extent(byDept)[0];

      if (heading) heading.textContent = m.name;
      if (note) note.textContent = aggNote();

      K[0].t.textContent = m.short + ', latest month';
      countUp(K[0].v, s.latest, m.fmt);
      delta(K[0].d, s.change, m.dp, m.unit,
        m.better === 'down' || (m.better === 'target' && s.latest > m.target),
        ' over the window');

      K[1].t.textContent = st.months + '-month average';
      countUp(K[1].v, s.avg, m.fmt);
      K[1].d.textContent = m.fmt(extent(s.series)[0]) + ' to ' + m.fmt(extent(s.series)[1]);
      K[1].d.classList.remove('is-good', 'is-bad');

      K[2].t.textContent = 'Encounters in window';
      countUp(K[2].v, s.enc, function (v) { return num(Math.round(v)); });
      K[2].d.textContent = num(Math.round(s.enc / st.months)) + ' a month';
      K[2].d.classList.remove('is-good', 'is-bad');

      K[3].t.textContent = 'Spread across lines';
      countUp(K[3].v, spread, m.fmt);
      K[3].d.textContent = 'highest less lowest';
      K[3].d.classList.remove('is-good', 'is-bad');

      if (!readout) return;
      var moved = m.better === 'target'
        ? (s.latest > s.first ? 'rose' : 'fell')
        : (s.change < 0 ? 'fell' : s.change > 0 ? 'rose' : 'held');
      var out = 'Over the last <b>' + st.months + ' months</b>, ' +
        m.name.toLowerCase() + ' for ' + deptName(st.dept) + ' ' + moved +
        (s.change === 0 ? ' steady' : ' by <b>' + num(Math.abs(s.change), m.dp) +
          (m.unit || '') + '</b>') + ' to <b>' + m.fmt(s.latest) + '</b>';

      if (m.target !== null) {
        var missing = s.off.length;
        out += ', against a target of ' + m.fmt(m.target) + '. ' +
          (missing === 0
            ? 'Every service line is inside it.'
            : '<b>' + missing + ' of ' + OPS.departments.length + '</b> lines are outside it, ' +
              s.off[0].name.toLowerCase() + ' furthest at <b>' + m.fmt(s.off[0].v) + '</b>.');
      } else {
        out += '. ';
      }

      var top = s.ranked[0];
      if (top && top.gain > 0) {
        out += ' ' + top.name + ' improved most over the window, by <b>' +
          num(top.gain, m.dp) + (m.unit || '') + '</b>.';
      }
      readout.innerHTML = out;
    }

    function redraw() {
      trend.render();
      dept.render();
      paint();
    }

    seg($('[data-seg="metric"]', panel), st.metric, function (v) {
      st.metric = v;
      settleAll(panel);
      redraw();
    });

    deptSeg = seg($('[data-seg="dept"]', panel), st.dept, function (v) {
      st.dept = v;
      settleAll(panel);
      redraw();
    });

    if (range) {
      st.months = parseInt(range.value, 10) || 24;
      if (rangeOut) rangeOut.textContent = st.months + ' months';
      range.addEventListener('input', function () {
        var v = parseInt(range.value, 10);
        st.months = Math.max(4, Math.min(OPS.months.length, v || OPS.months.length));
        if (rangeOut) rangeOut.textContent = st.months + ' months';
        settleAll(panel);
        redraw();
      });
    }

    $$('.plot', panel).forEach(watchDraw);
    redraw();
  }

  /* ======================================================================
     PANEL TWO — the data job market
     ----------------------------------------------------------------------
     5,390 synthetic postings, six years, four filters. The point of the
     panel is the thing every salary chart on the internet gets wrong: a
     median computed from eleven rows is not a median, it is a rumour. So
     the sample size travels with every figure, any cell thinner than
     MIN_N is dropped rather than drawn, and the read-out says so out loud
     when a filter combination has cut the ground away.

     The middle half is shown as a band behind the median line because
     the spread is the useful number when you are deciding what to ask
     for. A single line implies a precision that pay bands do not have.
     ====================================================================== */

  var JOBS = DATA.jobs;
  var MIN_N = 12;

  /* `ignore` lets the read-out ask "what would this look like without the
     work-mode filter", which is how the remote premium is computed
     without making the visitor clear a control to see it. */
  function jobsFilter(st, ignore) {
    var out = [];
    for (var i = 0; i < JOBS.records.length; i++) {
      var r = JOBS.records[i];
      if (st.region !== 'all' && r.g !== st.region) continue;
      if (st.level !== 'all' && r.l !== st.level) continue;
      if (st.size !== 'all' && r.z !== st.size) continue;
      if (ignore !== 'mode' && st.mode !== 'all' && String(r.w) !== st.mode) continue;
      out.push(r);
    }
    return out;
  }

  function sortedPay(rows) {
    var pays = new Array(rows.length);
    for (var i = 0; i < rows.length; i++) pays[i] = rows[i].pay;
    return pays.sort(function (a, b) { return a - b; });
  }

  function jobsByYear(rows) {
    var buckets = {};
    JOBS.years.forEach(function (y) { buckets[y] = []; });
    rows.forEach(function (r) { buckets[r.y].push(r.pay); });
    return JOBS.years.map(function (y) {
      var s = buckets[y].sort(function (a, b) { return a - b; });
      var thin = s.length < MIN_N;
      return {
        y: y, n: s.length, thin: thin,
        p25: thin ? null : quantile(s, 0.25),
        p50: thin ? null : quantile(s, 0.5),
        p75: thin ? null : quantile(s, 0.75)
      };
    });
  }

  function jobsByTitle(rows) {
    var buckets = {};
    JOBS.titles.forEach(function (t) { buckets[t.id] = []; });
    rows.forEach(function (r) { buckets[r.t].push(r.pay); });
    return JOBS.titles.map(function (t) {
      var s = buckets[t.id].sort(function (a, b) { return a - b; });
      return { id: t.id, name: t.name, n: s.length, p50: s.length ? quantile(s, 0.5) : 0 };
    }).filter(function (row) {
      return row.n >= MIN_N;
    }).sort(function (a, b) { return b.p50 - a.p50; });
  }

  function initJobs() {
    var panel = $('[data-panel="jobs"]');
    if (!panel) return;

    var st = { region: 'all', level: 'all', mode: 'all', size: 'all' };
    var trendHost = $('[data-plot="years"]', panel);
    var histHost = $('[data-plot="spread"]', panel);
    var titleHost = $('[data-plot="titles"]', panel);
    var readout = $('[data-readout]', panel);
    var say = $('[data-cursor]', panel);
    if (!trendHost || !histHost || !titleHost) return;

    var trendTip = Tip(trendHost.parentNode);
    var histTip = Tip(histHost.parentNode);
    var titleTip = Tip(titleHost.parentNode);

    /* --- median and middle half by year -------------------------------- */
    var years = track(Plot(trendHost, {
      height: 296,
      pad: { l: 56, r: 18, t: 14, b: 32 },
      draw: function (ctx) {
        var rows = jobsByYear(jobsFilter(st));
        var all = [];
        rows.forEach(function (r) {
          if (r.p25 !== null) { all.push(r.p25); all.push(r.p75); }
        });
        if (!all.length) {
          ctx.add(label(el('text', {
            class: 'tick', x: ctx.w / 2, y: ctx.h / 2, 'text-anchor': 'middle'
          }), 'No year has ' + MIN_N + ' postings under this filter'));
          ctx.aria('No data: the filter leaves too few postings to chart.');
          return;
        }

        var span = extent(all);
        var ax = nice(span[0], span[1], 5, false);
        var sy = scale(ax.lo, ax.hi, ctx.B, ctx.T);
        var sx = scale(0, rows.length - 1, ctx.L, ctx.R);

        gridY(ctx, sy, ax.ticks, moneyShort);
        axisX(ctx, rows.map(function (r) { return String(r.y); }),
          function (i) { return sx(i); }, 40);

        var hi = rows.map(function (r, i) { return r.p75 === null ? null : [sx(i), sy(r.p75)]; });
        var lo = rows.map(function (r, i) { return r.p25 === null ? null : [sx(i), sy(r.p25)]; });
        var mid = rows.map(function (r, i) { return r.p50 === null ? null : [sx(i), sy(r.p50)]; });

        addPath(ctx, 'series-band', area(hi, lo));
        setLen(addPath(ctx, 'series-line', path(mid)));
        mid.forEach(function (p) {
          if (p) ctx.add(el('circle', { class: 'dot', cx: r2(p[0]), cy: r2(p[1]), r: 3.5 }));
        });

        var firstOk = null, lastOk = null;
        rows.forEach(function (r) { if (r.p50 !== null) { if (!firstOk) firstOk = r; lastOk = r; } });
        ctx.aria('Median pay by year with the middle half shaded, ' +
          (firstOk ? firstOk.y + ' at ' + money(firstOk.p50) + ' rising to ' +
            lastOk.y + ' at ' + money(lastOk.p50) : 'no years with enough postings') + '.');

        cursor(ctx, rows.length, {
          index: function (x) { return nearest(rows.length, x, ctx.L, ctx.R); },
          draw: function (c, layer, i) {
            var row = rows[i];
            var x = r2(sx(i));
            layer.appendChild(el('line', { class: 'crosshair', x1: x, x2: x, y1: c.T, y2: c.B }));
            if (row.p50 === null) {
              trendTip.show(trendHost, sx(i), c.T + 20,
                '<b>' + row.y + '</b><br><span>' + row.n + ' postings, too few</span>');
              if (say) say.textContent = row.y + ': ' + row.n + ' postings, too few to report.';
              return;
            }
            layer.appendChild(el('circle', {
              class: 'marker', cx: x, cy: r2(sy(row.p50)), r: 4.5
            }));
            trendTip.show(trendHost, sx(i), sy(row.p75),
              '<b>' + money(row.p50) + '</b><br><span>' + row.y + ' &middot; middle half ' +
              moneyShort(row.p25) + '&ndash;' + moneyShort(row.p75) +
              '<br>' + num(row.n) + ' postings</span>');
            if (say) {
              say.textContent = row.y + ': median ' + money(row.p50) + ', middle half ' +
                money(row.p25) + ' to ' + money(row.p75) + ', ' + row.n + ' postings.';
            }
          },
          leave: function () { trendTip.hide(); }
        });
      }
    }));

    /* --- where the mass sits ------------------------------------------- */
    var spread = track(Plot(histHost, {
      height: 296,
      pad: { l: 46, r: 16, t: 14, b: 32 },
      draw: function (ctx) {
        var pays = sortedPay(jobsFilter(st));
        if (pays.length < MIN_N) {
          ctx.add(label(el('text', {
            class: 'tick', x: ctx.w / 2, y: ctx.h / 2, 'text-anchor': 'middle'
          }), num(pays.length) + ' postings — too few to shape a distribution'));
          ctx.aria('Not enough postings under this filter to draw a distribution.');
          return;
        }

        var h = histogram(pays, ctx.w < 420 ? 8 : 13);
        var ax = nice(0, h.max, 4, true);
        var sy = scale(ax.lo, ax.hi, ctx.B, ctx.T);
        var band = slots(h.bins.length, ctx.L, ctx.R, 0.16);
        var sx = scale(h.lo, h.hi, ctx.L, ctx.R);

        gridY(ctx, sy, ax.ticks, function (v) { return num(v); });
        axisX(ctx, h.bins.map(function (b) { return moneyShort((b.x0 + b.x1) / 2); }),
          function (i) { return band.mid(i); }, 50);

        h.bins.forEach(function (b, i) {
          var top = sy(b.n);
          var g = ctx.add(el('g', { class: 'bar-row' }));
          var rect = el('rect', {
            class: 'bar', x: r2(band.at(i)), y: r2(top),
            width: r2(band.width), height: r2(Math.max(0, ctx.B - top))
          });
          rect.style.setProperty('--i', i);
          g.appendChild(rect);
          var hit = el('rect', {
            class: 'bar-hit', x: r2(ctx.L + band.step * i), y: ctx.T,
            width: r2(band.step), height: r2(ctx.ih)
          });
          hit.addEventListener('pointerenter', function () {
            histTip.show(histHost, band.mid(i), top,
              '<b>' + num(b.n) + ' postings</b><br><span>' + moneyShort(b.x0) +
              ' to ' + moneyShort(b.x1) + '</span>');
          });
          hit.addEventListener('pointerleave', function () { histTip.hide(); });
          g.appendChild(hit);
        });

        var med = quantile(pays, 0.5);
        var mx = Math.round(sx(med)) + 0.5;
        ctx.add(el('line', { class: 'target-line', x1: mx, x2: mx, y1: ctx.T, y2: ctx.B }));
        ctx.add(label(el('text', {
          class: 'tick', x: mx, y: ctx.T - 3, 'text-anchor': 'middle'
        }), 'median ' + moneyShort(med)));

        ctx.aria('Distribution of ' + num(pays.length) + ' salaries, median ' + money(med) +
          ', from ' + money(pays[0]) + ' to ' + money(pays[pays.length - 1]) + '.');
      }
    }));

    /* --- what the job titles pay --------------------------------------
       Any title with fewer than MIN_N postings in the current filter is
       left out rather than drawn short. Under "entry level" the manager
       row disappears, which is not a bug in the chart — it is the data
       saying nobody hires an entry-level analytics manager. */
    var titles = track(Plot(titleHost, {
      height: 268,
      pad: { l: 134, r: 68, t: 10, b: 10 },
      draw: function (ctx) {
        var rows = jobsByTitle(jobsFilter(st));
        ctx.L = ctx.w < 480 ? 100 : 134;
        ctx.R = ctx.w - (ctx.w < 480 ? 52 : 68);
        ctx.iw = ctx.R - ctx.L;

        if (!rows.length) {
          ctx.add(label(el('text', {
            class: 'tick', x: ctx.w / 2, y: ctx.h / 2, 'text-anchor': 'middle'
          }), 'No title has ' + MIN_N + ' postings under this filter'));
          ctx.aria('No job title has enough postings under this filter.');
          return;
        }

        var top = nice(0, extent(rows.map(function (r) { return r.p50; }))[1], 4, true).hi;
        var sx = scale(0, top, ctx.L, ctx.R);
        var band = slots(rows.length, ctx.T, ctx.B, 0.36);

        rows.forEach(function (row, i) {
          var y = band.at(i);
          var mid = y + band.width / 2;
          var w = Math.max(1.5, sx(row.p50) - ctx.L);
          var g = ctx.add(el('g', { class: 'bar-row' }));

          var rect = el('rect', {
            class: 'bar is-h', x: ctx.L, y: r2(y), width: r2(w), height: r2(band.width)
          });
          rect.style.setProperty('--i', i);
          g.appendChild(rect);

          g.appendChild(label(el('text', {
            class: 'tick', x: ctx.L - 9, y: r2(mid + 3.5), 'text-anchor': 'end'
          }), row.name));
          g.appendChild(label(el('text', {
            class: 'tick', x: r2(ctx.L + w + 8), y: r2(mid + 3.5)
          }), moneyShort(row.p50)));

          var hit = el('rect', {
            class: 'bar-hit', x: 0, y: r2(y - band.step * 0.18),
            width: ctx.w, height: r2(band.step)
          });
          hit.addEventListener('pointerenter', function () {
            titleTip.show(titleHost, ctx.L + w, y,
              '<b>' + money(row.p50) + '</b><br><span>' + row.name + ' &middot; ' +
              num(row.n) + ' postings</span>');
          });
          hit.addEventListener('pointerleave', function () { titleTip.hide(); });
          g.appendChild(hit);
        });

        ctx.aria('Median pay by job title. ' + rows.map(function (r) {
          return r.name + ' ' + money(r.p50);
        }).join(', ') + '.');
      }
    }));

    /* --- figures and the sentence -------------------------------------- */
    var MODE_NAMES = { '0': 'onsite', '50': 'hybrid', '100': 'fully remote' };
    var MARKET = quantile(sortedPay(JOBS.records), 0.5);

    function nameFrom(list, id) {
      for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i].name;
      return id;
    }

    function filterPhrase() {
      var bits = [];
      if (st.region !== 'all') bits.push(nameFrom(JOBS.regions, st.region));
      if (st.level !== 'all') bits.push(nameFrom(JOBS.levels, st.level).toLowerCase() + ' level');
      if (st.mode !== 'all') bits.push(MODE_NAMES[st.mode]);
      if (st.size !== 'all') {
        var size = nameFrom(JOBS.sizes, st.size).toLowerCase();
        bits.push(/staff/.test(size) ? size : size + ' staff');
      }
      return bits.length ? bits.join(', ') : 'every posting in the set';
    }

    /* Median pay for one work mode in one year, or null if the cell is
       too thin to quote — the honest answer to a question the sample
       cannot support. */
    function modeMedian(rows, year, mode) {
      var pays = [];
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].y === year && rows[i].w === mode) pays.push(rows[i].pay);
      }
      if (pays.length < MIN_N) return null;
      return quantile(pays.sort(function (a, b) { return a - b; }), 0.5);
    }

    function remoteGap(year) {
      var rows = jobsFilter(st, 'mode');
      var remote = modeMedian(rows, year, 100);
      var onsite = modeMedian(rows, year, 0);
      if (remote === null || onsite === null) return null;
      return (remote / onsite - 1) * 100;
    }

    function kpiNodes(n) {
      return {
        t: $('[data-kt="' + n + '"]', panel),
        v: $('[data-kv="' + n + '"]', panel),
        d: $('[data-kd="' + n + '"]', panel)
      };
    }
    var K = [kpiNodes(1), kpiNodes(2), kpiNodes(3), kpiNodes(4)];

    function plain(node, textValue) {
      node.textContent = textValue;
      node.classList.remove('is-good', 'is-bad');
    }

    function paint() {
      var rows = jobsFilter(st);
      var pays = sortedPay(rows);
      var n = pays.length;
      var thin = n < MIN_N;
      var med = thin ? 0 : quantile(pays, 0.5);
      var p25 = thin ? 0 : quantile(pays, 0.25);
      var p75 = thin ? 0 : quantile(pays, 0.75);
      var byYear = jobsByYear(rows);
      var last = byYear[byYear.length - 1];
      var first = byYear[0];

      K[0].t.textContent = 'Median pay';
      countUp(K[0].v, med, function (v) { return thin ? '—' : money(v); });
      if (thin) plain(K[0].d, 'too few postings');
      else delta(K[0].d, (med / MARKET - 1) * 100, 1, '%', false, ' against the whole set');

      K[1].t.textContent = 'Middle half';
      countUp(K[1].v, p75 - p25, function (v) { return thin ? '—' : moneyShort(v); });
      plain(K[1].d, thin ? '—' : moneyShort(p25) + ' to ' + moneyShort(p75));

      K[2].t.textContent = 'Postings in view';
      countUp(K[2].v, n, function (v) { return num(Math.round(v)); });
      plain(K[2].d, num(Math.round((n / JOBS.records.length) * 100)) + '% of ' +
        num(JOBS.records.length));

      K[3].t.textContent = last.y + ' median';
      countUp(K[3].v, last.p50 === null ? 0 : last.p50,
        function (v) { return last.p50 === null ? '—' : money(v); });
      if (last.p50 === null || first.p50 === null) plain(K[3].d, 'not enough by year');
      else delta(K[3].d, (last.p50 / first.p50 - 1) * 100, 1, '%', false, ' since ' + first.y);

      if (!readout) return;
      if (thin) {
        readout.innerHTML = 'Only <b>' + n + '</b> postings match ' + filterPhrase() +
          ' — fewer than the ' + MIN_N + ' this panel will quote a median from. ' +
          'Widen a filter and the charts come back.';
        return;
      }

      var out = 'Across <b>' + num(n) + ' postings</b> matching ' + filterPhrase() +
        ', the median is <b>' + money(med) + '</b>, ' +
        (Math.abs(med / MARKET - 1) < 0.015
          ? 'level with the set as a whole'
          : '<b>' + pct(Math.abs(med / MARKET - 1) * 100, 0) + '</b> ' +
            (med > MARKET ? 'above' : 'below') + ' the set as a whole') +
        ', and the middle half runs <b>' + moneyShort(p25) + '</b> to <b>' +
        moneyShort(p75) + '</b>.';

      var ranked = jobsByTitle(rows);
      if (ranked.length) {
        out += ' ' + ranked[0].name + ' pays most at <b>' + money(ranked[0].p50) + '</b>';
        if (ranked.length > 1) {
          out += ', ' + moneyShort(ranked[0].p50 - ranked[ranked.length - 1].p50) +
            ' clear of ' + ranked[ranked.length - 1].name.toLowerCase();
        }
        out += '.';
      }

      var early = remoteGap(2022), late = remoteGap(JOBS.years[JOBS.years.length - 1]);
      if (early !== null && late !== null) {
        out += ' Fully-remote postings paid <b>' + signed(early, 1, '%') +
          '</b> against onsite in 2022 and <b>' + signed(late, 1, '%') + '</b> in ' +
          JOBS.years[JOBS.years.length - 1] + '.';
      }
      readout.innerHTML = out;
    }

    function redraw() {
      years.render();
      spread.render();
      titles.render();
      paint();
    }

    ['region', 'level', 'mode', 'size'].forEach(function (key) {
      var group = $('[data-seg="' + key + '"]', panel);
      if (!group) return;
      seg(group, st[key], function (v) {
        st[key] = v;
        settleAll(panel);
        redraw();
      });
    });

    $$('.plot', panel).forEach(watchDraw);
    redraw();
  }

  /* ======================================================================
     PANEL THREE — forecast against outturn
     ----------------------------------------------------------------------
     A backtest, not a prediction. Three things make it one rather than a
     chart of two lines that happen to agree:

       · the comparison is against a naive forecast. "Tomorrow will look
         like today" is free, and on a near-random walk it is very hard to
         beat, so any model that cannot beat it has earned nothing. The
         panel puts that number next to its own and does not hide the
         margin, which is thin on purpose
       · the interval is scored. A 90% band that contains 74% of the
         outturns is a broken band, so coverage is a headline figure and
         is compared against the nominal 90 rather than left as decoration
       · the residuals get their own strip, with sign shown by which side
         of zero the bar sits on rather than by colour, because the shape
         of the errors is the whole question: scattered means noise,
         clustered means the model is missing something the market did

     Direction is reported separately from size for the same reason a
     trader would ask both: being right about which way and wrong about
     how far is a different failure from the reverse.
     ====================================================================== */

  var CRY = DATA.crypto;

  /* One row per day inside the window that has a forecast at this horizon.
     Everything downstream — every figure, every chart, the sentence — is
     computed from this one array, so they cannot disagree. */
  function cryRows(coinId, h, days) {
    var coin = CRY.coins[coinId];
    var f = coin.f[h];
    var n = coin.actual.length;
    var from = Math.max(2 * h, n - days);
    var out = [];
    for (var t = from; t < n; t++) {
      if (f.p[t] === null) continue;
      var base = coin.actual[t - h];             // the last price known at forecast time
      out.push({
        t: t, date: CRY.dates[t], label: CRY.labels[t],
        actual: coin.actual[t], p: f.p[t], lo: f.lo[t], hi: f.hi[t],
        base: base,
        err: f.p[t] - coin.actual[t],
        naiveErr: base - coin.actual[t],
        inside: coin.actual[t] >= f.lo[t] && coin.actual[t] <= f.hi[t],
        moveP: f.p[t] - base,
        moveA: coin.actual[t] - base
      });
    }
    return out;
  }

  /* Mean absolute error, root mean square error, both as a share of the
     average price so the three coins are comparable, plus how often the
     sign of the predicted move was right and how often the outturn landed
     in the band. */
  function cryScore(rows) {
    var n = rows.length;
    if (!n) return null;
    var abs = 0, sq = 0, nabs = 0, nsq = 0, price = 0, right = 0, called = 0, inside = 0;
    var worst = rows[0];
    rows.forEach(function (r) {
      abs += Math.abs(r.err);
      sq += r.err * r.err;
      nabs += Math.abs(r.naiveErr);
      nsq += r.naiveErr * r.naiveErr;
      price += r.actual;
      if (r.moveA !== 0 && r.moveP !== 0) {
        called++;
        if ((r.moveA > 0) === (r.moveP > 0)) right++;
      }
      if (r.inside) inside++;
      if (Math.abs(r.err) > Math.abs(worst.err)) worst = r;
    });
    var mean = price / n;
    return {
      n: n, mean: mean,
      mae: abs / n, rmse: Math.sqrt(sq / n),
      naiveMae: nabs / n, naiveRmse: Math.sqrt(nsq / n),
      maePct: (abs / n) / mean * 100,
      rmsePct: Math.sqrt(sq / n) / mean * 100,
      naiveMaePct: (nabs / n) / mean * 100,
      edge: nabs === 0 ? 0 : (1 - (abs / n) / (nabs / n)) * 100,
      hit: called ? (right / called) * 100 : 50,
      called: called,
      coverage: (inside / n) * 100,
      worst: worst
    };
  }

  function initForecast() {
    var panel = $('[data-panel="crypto"]');
    if (!panel) return;

    var st = { coin: 'btc', h: 3, days: 120 };
    var mainHost = $('[data-plot="forecast"]', panel);
    var residHost = $('[data-plot="resid"]', panel);
    var horizHost = $('[data-plot="horizons"]', panel);
    var readout = $('[data-readout]', panel);
    var say = $('[data-cursor]', panel);
    var range = $('#cry-window', panel);
    var rangeOut = $('#cry-window-out', panel);
    var heading = $('[data-title="forecast"]', panel);
    if (!mainHost || !residHost || !horizHost) return;

    var mainTip = Tip(mainHost.parentNode);
    var residTip = Tip(residHost.parentNode);
    var horizTip = Tip(horizHost.parentNode);

    function coin() { return CRY.coins[st.coin]; }
    function price(v) {
      var dp = coin().spec.dp;
      return '$' + num(v, dp);
    }
    function priceAxis(v) {
      var a = Math.abs(v);
      if (a >= 1000) return '$' + num(v / 1000, a >= 10000 ? 0 : 1) + 'k';
      return '$' + num(v, coin().spec.dp ? 0 : 0);
    }
    function rows() { return cryRows(st.coin, st.h, st.days); }
    function horizonWord() { return st.h === 1 ? 'one day' : st.h + ' days'; }

    /* Stagger the rise over a fixed budget rather than per bar: a
       170-day window would otherwise take four seconds to draw. */
    function stagger(bar, i, count) {
      bar.style.setProperty('--i', Math.round((i / Math.max(1, count - 1)) * 24));
    }

    /* --- outturn against forecast --------------------------------------
       The outturn is the dark line and the forecast the coloured one,
       deliberately: the eye should land on what happened first and read
       the claim against it, not the other way round. */
    var main = track(Plot(mainHost, {
      height: 324,
      pad: { l: 62, r: 18, t: 16, b: 32 },
      draw: function (ctx) {
        var rs = rows();
        var all = [];
        rs.forEach(function (r) { all.push(r.actual); all.push(r.lo); all.push(r.hi); });
        var span = extent(all);
        var ax = nice(span[0], span[1], 5, false);
        var sy = scale(ax.lo, ax.hi, ctx.B, ctx.T);
        var sx = scale(0, rs.length - 1, ctx.L, ctx.R);

        gridY(ctx, sy, ax.ticks, priceAxis);
        axisX(ctx, rs.map(function (r) { return r.label; }),
          function (i) { return sx(i); }, 58);

        addPath(ctx, 'series-band',
          area(rs.map(function (r, i) { return [sx(i), sy(r.hi)]; }),
               rs.map(function (r, i) { return [sx(i), sy(r.lo)]; })));
        setLen(addPath(ctx, 'series-line is-truth',
          path(rs.map(function (r, i) { return [sx(i), sy(r.actual)]; }))));
        setLen(addPath(ctx, 'series-line',
          path(rs.map(function (r, i) { return [sx(i), sy(r.p)]; }))));

        var sc = cryScore(rs);
        ctx.aria(coin().spec.name + ', ' + horizonWord() + ' ahead, ' + rs.length +
          ' days to ' + rs[rs.length - 1].label + '. Forecast missed by ' +
          pct(sc.maePct, 1) + ' of the price on average and the 90% band held ' +
          pct(sc.coverage, 0) + ' of the outturns. Use the arrow keys to read a day.');

        cursor(ctx, rs.length, {
          index: function (x) { return nearest(rs.length, x, ctx.L, ctx.R); },
          draw: function (c, layer, i) {
            var r = rs[i];
            var x = r2(sx(i));
            layer.appendChild(el('line', { class: 'crosshair', x1: x, x2: x, y1: c.T, y2: c.B }));
            layer.appendChild(el('circle', {
              class: 'dot', cx: x, cy: r2(sy(r.p)), r: 4
            }));
            layer.appendChild(el('circle', {
              class: 'marker', cx: x, cy: r2(sy(r.actual)), r: 4.5
            }));
            mainTip.show(mainHost, sx(i), sy(Math.max(r.actual, r.p)),
              '<b>' + price(r.actual) + '</b> outturn<br><b>' + price(r.p) +
              '</b> forecast<br><span>' + r.label + ' · ' + signed(r.err / r.actual * 100, 1, '%') +
              (r.inside ? ' · in band' : ' · outside band') + '</span>');
            if (say) {
              say.textContent = r.label + ': outturn ' + price(r.actual) + ', forecast ' +
                price(r.p) + ', ' + (r.inside ? 'inside' : 'outside') + ' the band.';
            }
          },
          leave: function () { mainTip.hide(); }
        });
      }
    }));

    /* --- the residuals --------------------------------------------------
       Error as a share of the price, so a $900 miss on Bitcoin and a $9
       one on Solana are on the same scale. Sign is carried by which side
       of the zero line the bar sits on, not by colour: red-and-green
       would put the whole reading in the one channel a colour-blind
       reader cannot use, and position is unambiguous for everyone. */
    var resid = track(Plot(residHost, {
      height: 208,
      pad: { l: 62, r: 18, t: 16, b: 26 },
      draw: function (ctx) {
        var rs = rows();
        var pcts = rs.map(function (r) { return r.err / r.actual * 100; });
        var m = Math.max(0.5, extent(pcts.map(Math.abs))[1]);
        var ax = nice(-m, m, 4, true);
        var sy = scale(ax.lo, ax.hi, ctx.B, ctx.T);
        var band = slots(rs.length, ctx.L, ctx.R, rs.length > 90 ? 0.1 : 0.28);
        var zero = Math.round(sy(0)) + 0.5;

        gridY(ctx, sy, ax.ticks, function (v) { return signed(v, 1, '%'); });
        axisX(ctx, rs.map(function (r) { return r.label; }),
          function (i) { return band.mid(i); }, 58);
        ctx.add(el('line', { class: 'zero-line', x1: ctx.L, x2: ctx.R, y1: zero, y2: zero }));

        function geom(i) {
          var v = pcts[i];
          var y = v >= 0 ? sy(v) : sy(0);
          return {
            v: v, x: band.at(i), w: Math.max(0.8, band.width),
            y: y, h: Math.max(0.8, Math.abs(sy(v) - sy(0)))
          };
        }

        rs.forEach(function (r, i) {
          var g = geom(i);
          var bar = ctx.add(el('rect', {
            class: 'bar' + (g.v < 0 ? ' is-neg' : ''),
            x: r2(g.x), y: r2(g.y), width: r2(g.w), height: r2(g.h)
          }));
          stagger(bar, i, rs.length);
        });

        var over = rs.filter(function (r) { return !r.inside; }).length;
        ctx.aria('Forecast error as a share of the price, ' + rs.length + ' days. ' +
          (over === 0 ? 'Every outturn fell inside the 90% band.'
                      : over + ' of them fell outside the 90% band.'));

        cursor(ctx, rs.length, {
          index: function (x) { return nearest(rs.length, x, band.mid(0), band.mid(rs.length - 1)); },
          draw: function (c, layer, i) {
            var g = geom(i);
            layer.appendChild(el('rect', {
              class: 'bar is-selected' + (g.v < 0 ? ' is-neg' : ''),
              x: r2(g.x), y: r2(g.y), width: r2(Math.max(1.6, g.w)), height: r2(g.h)
            }));
            residTip.show(residHost, band.mid(i), Math.min(g.y, zero),
              '<b>' + signed(g.v, 1, '%') + '</b><br><span>' + rs[i].label + ' · ' +
              (g.v > 0 ? 'forecast too high' : g.v < 0 ? 'forecast too low' : 'exact') +
              '</span>');
          },
          leave: function () { residTip.hide(); }
        });
      }
    }));

    /* --- against the free forecast -------------------------------------
       Every horizon, the model against "no change from the last close".
       The naive bar is the one that matters: a forecast that cannot beat
       a flat line has told you nothing, and the honest thing to show is
       how narrow the margin actually is. */
    var horizons = track(Plot(horizHost, {
      height: 216,
      pad: { l: 74, r: 60, t: 12, b: 10 },
      draw: function (ctx) {
        ctx.L = ctx.w < 400 ? 60 : 74;
        ctx.R = ctx.w - (ctx.w < 400 ? 50 : 60);
        ctx.iw = ctx.R - ctx.L;

        var scores = CRY.horizons.map(function (h) {
          return { h: h, s: cryScore(cryRows(st.coin, h, st.days)) };
        });
        var top = nice(0, extent(scores.reduce(function (acc, row) {
          return acc.concat([row.s.maePct, row.s.naiveMaePct]);
        }, []))[1], 4, true).hi;
        var sx = scale(0, top, ctx.L, ctx.R);
        var band = slots(scores.length, ctx.T, ctx.B, 0.3);

        scores.forEach(function (row, i) {
          var y = band.at(i);
          var half = band.width / 2;
          var on = row.h === st.h;

          [{ v: row.s.maePct, cls: on ? 'bar is-h is-selected' : 'bar is-h', y: y,
             what: 'model' },
           { v: row.s.naiveMaePct, cls: 'bar is-h is-2', y: y + half + 1,
             what: 'naive last close' }].forEach(function (b, j) {
            var w = Math.max(1.5, sx(b.v) - ctx.L);
            var g = ctx.add(el('g', { class: 'bar-row' }));
            var bar = el('rect', {
              class: b.cls, x: ctx.L, y: r2(b.y),
              width: r2(w), height: r2(Math.max(2, half - 1))
            });
            bar.style.setProperty('--i', i * 2 + j);
            g.appendChild(bar);
            g.appendChild(label(el('text', {
              class: 'tick', x: r2(ctx.L + w + 7), y: r2(b.y + half / 2 + 3)
            }), pct(b.v, 2)));
            var hit = el('rect', {
              class: 'bar-hit', x: 0, y: r2(b.y), width: ctx.w, height: r2(Math.max(2, half)),
              'aria-hidden': 'true'
            });
            hit.addEventListener('pointerenter', function () {
              horizTip.show(horizHost, ctx.L + w, b.y,
                '<b>' + pct(b.v, 2) + '</b> of price<br><span>' + b.what + ', ' +
                (row.h === 1 ? 'one day' : row.h + ' days') + ' ahead</span>');
            });
            hit.addEventListener('pointerleave', function () { horizTip.hide(); });
            g.appendChild(hit);
          });

          ctx.add(label(el('text', {
            class: 'tick', x: ctx.L - 9, y: r2(y + band.width / 2 + 3.5), 'text-anchor': 'end'
          }), row.h === 1 ? '1 day' : row.h + ' days'));
        });

        ctx.aria('Mean absolute error as a share of price, model against a naive last-close ' +
          'forecast, at one, three and seven days ahead. ' +
          scores.map(function (row) {
            return row.h + ' days: model ' + pct(row.s.maePct, 2) + ', naive ' +
              pct(row.s.naiveMaePct, 2);
          }).join('. ') + '.');
      }
    }));

    /* --- figures and the sentence -------------------------------------- */
    function kpiNodes(n) {
      return {
        t: $('[data-kt="' + n + '"]', panel),
        v: $('[data-kv="' + n + '"]', panel),
        d: $('[data-kd="' + n + '"]', panel)
      };
    }
    var K = [kpiNodes(1), kpiNodes(2), kpiNodes(3), kpiNodes(4)];

    function paint() {
      var rs = rows();
      var sc = cryScore(rs);
      var name = coin().spec.name;
      if (heading) heading.textContent = name + ', ' + horizonWord() + ' ahead';

      K[0].t.textContent = 'Mean absolute error';
      countUp(K[0].v, sc.mae, price);
      delta(K[0].d, -sc.edge, 1, '%', true, ' against a naive forecast');

      K[1].t.textContent = 'Error as share of price';
      countUp(K[1].v, sc.maePct, function (v) { return pct(v, 2); });
      K[1].d.textContent = 'RMSE ' + pct(sc.rmsePct, 2);
      K[1].d.classList.remove('is-good', 'is-bad');

      K[2].t.textContent = 'Direction called right';
      countUp(K[2].v, sc.hit, function (v) { return pct(v, 0); });
      delta(K[2].d, sc.hit - 50, 1, ' pts', false, ' against a coin toss');

      K[3].t.textContent = 'Inside the 90% band';
      countUp(K[3].v, sc.coverage, function (v) { return pct(v, 0); });
      delta(K[3].d, sc.coverage - 90, 1, ' pts', false, ' against the nominal 90');

      if (!readout) return;
      var beat = sc.edge > 0;
      var out = 'Over the last <b>' + sc.n + ' days</b>, the ' + horizonWord() +
        '-ahead forecast for ' + name + ' missed by <b>' + price(sc.mae) +
        '</b> on average, <b>' + pct(sc.maePct, 2) + '</b> of the price. A naive ' +
        '“no change from the last close” forecast missed by <b>' + price(sc.naiveMae) +
        '</b>, so the model is <b>' + pct(Math.abs(sc.edge), 1) + '</b> ' +
        (beat ? 'better' : 'worse') + ' than free' +
        (beat && sc.edge < 12 ? ' — a thin edge, which is what an honest backtest on ' +
          'a near-random walk looks like' : '') + '.';

      out += ' It called the direction right on <b>' + pct(sc.hit, 0) + '</b> of the ' +
        sc.called + ' days that moved.';

      out += ' The 90% band held <b>' + pct(sc.coverage, 0) + '</b> of the outturns' +
        (Math.abs(sc.coverage - 90) <= 4 ? ', which is the interval behaving as advertised'
          : sc.coverage > 90 ? ', wider than it needs to be' : ', so the band is too narrow') +
        '.';

      out += ' The worst day was <b>' + sc.worst.label + '</b>: it said ' +
        price(sc.worst.p) + ' and the price came in at <b>' + price(sc.worst.actual) + '</b>.';
      readout.innerHTML = out;
    }

    function redraw() {
      main.render();
      resid.render();
      horizons.render();
      paint();
    }

    seg($('[data-seg="coin"]', panel), st.coin, function (v) {
      st.coin = v;
      settleAll(panel);
      redraw();
    });

    seg($('[data-seg="horizon"]', panel), st.h, function (v) {
      st.h = parseInt(v, 10) || 1;
      settleAll(panel);
      redraw();
    });

    if (range) {
      st.days = parseInt(range.value, 10) || st.days;
      if (rangeOut) rangeOut.textContent = st.days + ' days';
      range.addEventListener('input', function () {
        var v = parseInt(range.value, 10);
        st.days = Math.max(30, Math.min(CRY.dates.length, v || CRY.dates.length));
        if (rangeOut) rangeOut.textContent = st.days + ' days';
        settleAll(panel);
        redraw();
      });
    }

    $$('.plot', panel).forEach(watchDraw);
    redraw();
  }

  /* --- boot -------------------------------------------------------------
     Each panel bows out on its own if its markup is absent, the same
     contract the rest of the page's behaviour follows. */

  lastWidth = document.documentElement.clientWidth;
  initOps();
  initJobs();
  initForecast();
  startWatching();

})();
