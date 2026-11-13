/* ==========================================================================
   data.js — the numbers behind the three dashboards
   --------------------------------------------------------------------------
   Everything here is SYNTHETIC. None of it is real patient, payroll or
   market data. It is generated from the documented assumptions below by a
   seeded pseudo-random number generator, so the same numbers appear on
   every load and in every browser, and anyone reading this file can see
   exactly how they were made.

   Why generate rather than paste a table? Because the assumptions are the
   interesting part. A recruiter can read the parameters and see the shape
   of the domain knowledge; a table of 1,100 salaries would say nothing.

   Loaded as a plain script, not fetched, so the page also works when the
   file is opened straight from disk with file://.
   ========================================================================== */

window.DATA = (function () {
  'use strict';

  /* --- deterministic randomness -----------------------------------------
     mulberry32: 32-bit state, one multiply-shift round. Small enough to
     read, good enough for plausible-looking business data. Seeded per
     dataset so adding a dataset never shifts the numbers in another. */
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Box-Muller, so noise is normal rather than flat. Flat noise is the
     tell-tale sign of made-up data: real measurements cluster. */
  function normal(r) {
    var u = 1 - r(), v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function round(x, dp) { var f = Math.pow(10, dp || 0); return Math.round(x * f) / f; }
  function clamp(x, lo, hi) { return x < lo ? lo : x > hi ? hi : x; }

  var MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* --- 1. hospital operations -------------------------------------------
     Twenty-four complete months, Sep 2024 to Aug 2026, across seven
     service lines. Assumptions, all of them mine rather than any
     employer's:
       · volume rises through winter in the respiratory-driven lines
         (emergency, general medicine) and is flat or slightly down in
         elective ones (orthopaedics, maternity)
       · length of stay tracks case mix, so it barely moves month to month
       · 30-day readmission falls over the two years in cardiology and
         general medicine, standing in for a care-transitions programme;
         the other lines drift only slightly
       · occupancy and door-to-provider minutes amplify the seasonal
         swing, because a full unit queues
       · noise is normal, 3.5% on volume and about 0.6 points on rates */
  var ops = (function () {
    var r = rng(9040824);
    var N = 24, START_Y = 2024, START_M = 8;          // 8 = September
    var months = [];
    for (var i = 0; i < N; i++) {
      var m = (START_M + i) % 12;
      var y = START_Y + Math.floor((START_M + i) / 12);
      months.push({
        key: y + '-' + (m < 9 ? '0' : '') + (m + 1),
        label: MONTH_NAMES[m] + ' ' + String(y).slice(2),
        month: m, year: y
      });
    }

    var departments = [
      /* vol = encounters/month, los = days, readmit = %, occ = %, wait = min
         winter = seasonal amplitude, grow = monthly trend, fix = points of
         readmission removed across the whole window */
      { id: 'ed', name: 'Emergency', vol: 4180, los: 0.4, readmit: 14.8, occ: 88, wait: 38, winter: 0.16, grow: 0.0042, fix: 0.5 },
      { id: 'card', name: 'Cardiology', vol: 980, los: 5.1, readmit: 17.4, occ: 84, wait: 22, winter: 0.09, grow: 0.0026, fix: 3.1 },
      { id: 'ortho', name: 'Orthopaedics', vol: 860, los: 3.4, readmit: 6.2, occ: 79, wait: 19, winter: -0.05, grow: 0.0031, fix: 0.6 },
      { id: 'onc', name: 'Oncology', vol: 640, los: 6.3, readmit: 12.1, occ: 81, wait: 17, winter: 0.01, grow: 0.0018, fix: 0.9 },
      { id: 'mat', name: 'Maternity', vol: 720, los: 2.2, readmit: 3.4, occ: 74, wait: 14, winter: -0.02, grow: -0.0009, fix: 0.2 },
      { id: 'bh', name: 'Behavioural health', vol: 510, los: 7.8, readmit: 19.6, occ: 92, wait: 44, winter: 0.05, grow: 0.0055, fix: 1.4 },
      { id: 'gen', name: 'General medicine', vol: 2600, los: 4.2, readmit: 15.3, occ: 86, wait: 26, winter: 0.13, grow: 0.0022, fix: 2.4 }
    ];

    var rows = [];
    departments.forEach(function (d) {
      for (var i = 0; i < N; i++) {
        var season = d.winter * Math.cos((months[i].month / 12) * 2 * Math.PI);
        var ramp = i / (N - 1);
        rows.push({
          d: d.id, i: i,
          enc: Math.round(d.vol * (1 + season) * (1 + d.grow * i) * (1 + 0.035 * normal(r))),
          los: round(clamp(d.los * (1 - 0.05 * ramp) * (1 + 0.045 * normal(r)), 0.2, 20), 2),
          readmit: round(clamp(d.readmit - d.fix * ramp + 0.62 * normal(r), 0.8, 40), 2),
          occ: round(clamp(d.occ * (1 + 0.55 * season) + 2.1 * normal(r), 52, 99), 1),
          wait: Math.round(clamp(d.wait * (1 + 1.35 * season) * (1 + 0.09 * normal(r)), 5, 180))
        });
      }
    });

    return {
      months: months, departments: departments, rows: rows,
      targets: { readmit: 13.5, wait: 30, occ: 85 }
    };
  })();


  /* --- 2. data-job salaries ----------------------------------------------
     About 5,400 synthetic postings, 2021 to 2026. Assumptions:
       · pay is a product of title base, seniority, region, employer size,
         a compounding but decelerating wage trend, and lognormal noise —
         lognormal because salary distributions have a long right tail and
         a hard floor, which a normal distribution gets wrong
       · the fully-remote premium peaks in 2022 and turns negative by 2025,
         while hybrid quietly overtakes it
       · analytics engineering barely exists in 2021 and is a fifth of
         postings by 2026, at the expense of plain analyst roles
       · seniority mix depends on the title: managers are never entry
         level, analysts rarely reach lead

     The sample is deliberately large. At a hundred rows a year every
     filtered median is noise, and a dashboard that reports noise teaches
     the reader the wrong lesson. */
  var jobs = (function () {
    var r = rng(20261155);
    var YEARS = [2021, 2022, 2023, 2024, 2025, 2026];
    var COUNT = [562, 755, 928, 1036, 1121, 988];
    var TREND = [1.000, 1.075, 1.115, 1.135, 1.175, 1.215];
    var REMOTE_PREMIUM = { 0: [0, 0, 0, 0, 0, 0],
                           50: [-0.015, 0.000, 0.015, 0.028, 0.038, 0.048],
                           100: [0.085, 0.105, 0.060, 0.005, -0.030, -0.048] };
    var REMOTE_MIX = [[0.30, 0.28, 0.42], [0.24, 0.31, 0.45], [0.26, 0.36, 0.38],
                      [0.30, 0.42, 0.28], [0.32, 0.46, 0.22], [0.33, 0.48, 0.19]];

    var titles = [
      /* s0/s1 = share of postings in 2021 and in 2026, interpolated between
         boost   = extra annual wage growth specific to the title
         lw      = seniority mix, entry / mid / senior / lead */
      { id: 'da', name: 'Data Analyst', base: 84000, sd: 0.17, boost: 0.008, s0: 0.30, s1: 0.20, lw: [0.34, 0.40, 0.22, 0.04] },
      { id: 'bi', name: 'BI Analyst', base: 92000, sd: 0.16, boost: 0.010, s0: 0.16, s1: 0.12, lw: [0.26, 0.42, 0.27, 0.05] },
      { id: 'bid', name: 'BI Developer', base: 104000, sd: 0.18, boost: 0.012, s0: 0.13, s1: 0.10, lw: [0.14, 0.40, 0.36, 0.10] },
      { id: 'ae', name: 'Analytics Engineer', base: 122000, sd: 0.19, boost: 0.028, s0: 0.04, s1: 0.17, lw: [0.10, 0.38, 0.40, 0.12] },
      { id: 'de', name: 'Data Engineer', base: 130000, sd: 0.21, boost: 0.018, s0: 0.16, s1: 0.20, lw: [0.13, 0.36, 0.39, 0.12] },
      { id: 'ds', name: 'Data Scientist', base: 136000, sd: 0.22, boost: 0.006, s0: 0.15, s1: 0.13, lw: [0.16, 0.35, 0.37, 0.12] },
      { id: 'am', name: 'Analytics Manager', base: 154000, sd: 0.20, boost: 0.014, s0: 0.06, s1: 0.08, lw: [0.00, 0.06, 0.52, 0.42] }
    ];
    var levels = [
      { id: 'EN', name: 'Entry', mult: 0.72 }, { id: 'MI', name: 'Mid', mult: 0.95 },
      { id: 'SE', name: 'Senior', mult: 1.22 }, { id: 'LD', name: 'Lead', mult: 1.48 }
    ];
    var regions = [
      { id: 'us', name: 'United States', mult: 1.00, w: 0.52 },
      { id: 'eu', name: 'Europe', mult: 0.72, w: 0.22 },
      { id: 'in', name: 'India', mult: 0.34, w: 0.16 },
      { id: 'ot', name: 'Rest of world', mult: 0.61, w: 0.10 }
    ];
    var sizes = [
      { id: 'S', name: 'Under 200 staff', mult: 0.90, w: 0.24 },
      { id: 'M', name: '200 to 5,000', mult: 1.00, w: 0.45 },
      { id: 'L', name: 'Over 5,000', mult: 1.11, w: 0.31 }
    ];

    /* One draw per decision, in a fixed order, so the sequence is stable. */
    function byWeight(u, list, weights) {
      var acc = 0;
      for (var i = 0; i < list.length; i++) {
        acc += weights ? weights[i] : list[i].w;
        if (u <= acc) return list[i];
      }
      return list[list.length - 1];
    }

    var records = [];
    YEARS.forEach(function (year, yi) {
      var shares = titles.map(function (t) { return t.s0 + (t.s1 - t.s0) * (yi / 5); });
      for (var n = 0; n < COUNT[yi]; n++) {
        var t = byWeight(r(), titles, shares);
        var lv = byWeight(r(), levels, t.lw);
        var rg = byWeight(r(), regions);
        var sz = byWeight(r(), sizes);
        var wk = byWeight(r(), [{ id: 0 }, { id: 50 }, { id: 100 }], REMOTE_MIX[yi]).id;
        var pay = t.base * lv.mult * rg.mult * sz.mult * TREND[yi]
                * (1 + t.boost * yi) * (1 + REMOTE_PREMIUM[wk][yi])
                * Math.exp(t.sd * normal(r));
        records.push({
          y: year, t: t.id, l: lv.id, g: rg.id, z: sz.id, w: wk,
          pay: Math.round(clamp(pay, 24000, 460000) / 500) * 500
        });
      }
    });

    return {
      records: records, titles: titles, levels: levels,
      regions: regions, sizes: sizes, years: YEARS
    };


  })();


  /* --- 3. forecast backtest ----------------------------------------------
     180 daily closes to 4 Sep 2026 for three coins, plus what a model
     said they would be, at one, three and seven days ahead. Assumptions:

       · daily log returns follow an AR(1) with phi = 0.24, so there is a
         little genuine short-run momentum in the series. This matters:
         if the price were a pure random walk, no forecaster could beat
         the last price and the whole panel would be theatre
       · the three coins share a market factor at 72% correlation, which
         is roughly how majors actually move together, so switching coins
         shows related structure rather than three unrelated walks
       · one scripted 26-day slide from day 68 gives the window a turn
       · the forecaster is the conditional mean of that AR(1): carry a
         damped fraction of the last h-day move forward, plus drift. No
         noise is added to it — the error you see is the part of the
         process that is genuinely unpredictable, which is why it only
         just beats a naive last-price forecast
       · the band is a 90% interval built from the true h-day return
         variance of an AR(1), inflated for the autocorrelation

     This demonstrates backtesting mechanics on invented numbers. It is
     not a market prediction and it is not advice. */
  var crypto = (function () {
    var r = rng(4090526);
    var N = 180, HORIZONS = [1, 3, 7], PHI = 0.24, RHO = 0.72;
    var END = Date.UTC(2026, 8, 4);                   // 4 Sep 2026
    var dates = [], labels = [];
    for (var i = 0; i < N; i++) {
      var d = new Date(END - (N - 1 - i) * 86400000);
      dates.push(d.toISOString().slice(0, 10));
      labels.push(d.getUTCDate() + ' ' + MONTH_NAMES[d.getUTCMonth()]);
    }

    /* variance of an h-day sum of AR(1) returns, in units of one-day
       variance: h plus the autocovariance terms */
    function hVar(h) {
      var s = h;
      for (var k = 1; k < h; k++) s += 2 * (h - k) * Math.pow(PHI, k);
      return s;
    }
    /* the damping the conditional mean applies to the last h-day move */
    function carry(h) {
      var num = 0;
      for (var k = 1; k <= h; k++) num += Math.pow(PHI, k);
      return num / h;
    }

    var market = [];
    for (var t = 0; t < N; t++) market.push(normal(r));

    var specs = [
      { id: 'btc', name: 'Bitcoin', ticker: 'BTC', start: 68400, drift: 0.00090, vol: 0.026, dp: 0 },
      { id: 'eth', name: 'Ethereum', ticker: 'ETH', start: 3480, drift: 0.00110, vol: 0.032, dp: 0 },
      { id: 'sol', name: 'Solana', ticker: 'SOL', start: 168, drift: 0.00130, vol: 0.036, dp: 2 }
    ];

    var coins = {};
    specs.forEach(function (s) {
      var innov = s.vol * Math.sqrt(1 - PHI * PHI);   // keeps total vol on target
      var actual = [s.start], ret = 0;
      for (var t = 1; t < N; t++) {
        var z = Math.sqrt(RHO) * market[t] + Math.sqrt(1 - RHO) * normal(r);
        var shock = t >= 68 && t < 94 ? -0.0045 : 0;
        ret = PHI * ret + innov * z;
        actual.push(actual[t - 1] * Math.exp(s.drift + shock + ret));
      }
      actual = actual.map(function (v) { return round(v, s.dp + 2); });

      var f = {};
      HORIZONS.forEach(function (h) {
        var k = carry(h) * h;                          // applied to the h-day move
        var sd = s.vol * Math.sqrt(hVar(h));
        var p = [], lo = [], hi = [];
        for (var t = 0; t < N; t++) {
          if (t < 2 * h) { p.push(null); lo.push(null); hi.push(null); continue; }
          var mom = Math.log(actual[t - h] / actual[t - 2 * h]) - s.drift * h;
          var mid = actual[t - h] * Math.exp(s.drift * h + k * mom / h);
          p.push(round(mid, s.dp + 2));
          lo.push(round(mid * Math.exp(-1.645 * sd), s.dp + 2));
          hi.push(round(mid * Math.exp(1.645 * sd), s.dp + 2));
        }
        f[h] = { p: p, lo: lo, hi: hi, sd: round(sd, 4) };
      });
      coins[s.id] = { spec: s, actual: actual, f: f };
    });

    return { dates: dates, labels: labels, specs: specs, coins: coins, horizons: HORIZONS };
  })();



  return { ops: ops, jobs: jobs, crypto: crypto, synthetic: true };
})();
