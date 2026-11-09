(function () {
  'use strict';
  var DATA = window.WA_DATA;
  var Q = DATA.questions, QUIZZES = DATA.quizzes;
  var PASS_RATIO = 0.8; // official pass mark: 24 out of 30
  var LABELS = ['الف', 'ب', 'ج', 'د'];
  var LATIN = ['A', 'B', 'C', 'D'];
  var app = document.getElementById('app');
  var player = new Audio();
  window.__waPlayer = player;
  var playingBtn = null;
  var state = null;

  function fa(n) { return String(n).replace(/\d/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[d]; }); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function el(id) { return document.getElementById(id); }
  function scorable(q) { return Array.isArray(q.a) && q.a.length > 0; }

  // ---- audio ----
  function stopAudio() {
    player.pause();
    if (playingBtn) { playingBtn.classList.remove('playing'); playingBtn.textContent = playingBtn.dataset.label; }
    playingBtn = null;
  }
  function playClip(src, btn) {
    if (playingBtn === btn && !player.paused) { stopAudio(); return; }
    stopAudio();
    player.src = src;
    playingBtn = btn;
    btn.classList.add('playing');
    btn.textContent = '⏸ توقف';
    player.play().catch(function () { stopAudio(); });
  }
  player.addEventListener('ended', stopAudio);
  var blobCache = {};
  function audioSrc(kind, id) {
    var key = kind + '_' + id, A = window.WA_AUDIO;
    if (A && A[key]) {
      if (!blobCache[key]) {
        try {
          var bin = atob(A[key]), arr = new Uint8Array(bin.length);
          for (var j = 0; j < bin.length; j++) arr[j] = bin.charCodeAt(j);
          blobCache[key] = URL.createObjectURL(new Blob([arr], { type: 'audio/mpeg' }));
        } catch (e) { blobCache[key] = 'data:audio/mpeg;base64,' + A[key]; }
      }
      return blobCache[key];
    }
    return 'audio/' + key + '.mp3';
  }
  window.__waAudioSrc = audioSrc;

  // ---- English toggle ----
  var enBtn = el('enToggle');
  function setEn(on) {
    document.body.classList.toggle('show-en', on);
    enBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    try { localStorage.setItem('wa_show_en', on ? '1' : '0'); } catch (e) {}
  }
  enBtn.addEventListener('click', function () { setEn(!document.body.classList.contains('show-en')); });
  try { setEn(localStorage.getItem('wa_show_en') === '1'); } catch (e) {}

  function getBest(n) { try { return localStorage.getItem('wa_best_' + n); } catch (e) { return null; } }
  function setBest(n, s, t) {
    try {
      var old = getBest(n); var oldS = old ? parseInt(old.split('/')[0], 10) : -1;
      if (s > oldS) localStorage.setItem('wa_best_' + n, s + '/' + t);
    } catch (e) {}
  }

  // ---- selector page ----
  function renderHome() {
    stopAudio(); state = null;
    if (window.WA_SINGLE) { renderSingleStart(window.WA_SINGLE); return; }
    var h = '<section class="intro"><h1>آزمون‌های تمرینی قوانین ترافیک (موتر)</h1>' +
      '<p>این‌ها ۱۱ آزمون تمرینی رسمی ادارهٔ ترانسپورت استرالیای غربی (Transport WA) برای امتحان تیوری لایسنس موتر است که به دری ترجمه شده. ' +
      'یک آزمون را انتخاب کنید. هر سوال یکی‌یکی نشان داده می‌شود. دکمهٔ «🔊 شنیدن سوال» را بزنید تا سوال و گزینه‌ها به دری خوانده شود. ' +
      'جواب را انتخاب کنید، بعد دکمهٔ «سوال بعدی» را بزنید. برای کامیاب شدن باید حداقل ۸۰٪ جواب‌ها درست باشد (۲۴ از ۳۰).</p>' +
      '<span class="en en-q">Choose a quiz. Each question is shown one at a time with Dari audio. Pass mark: 80% (24 out of 30).</span></section><div class="grid">';
    QUIZZES.forEach(function (z) {
      var best = getBest(z.n);
      h += '<a class="qcard" href="#quiz/' + z.n + '"><b>آزمون ' + fa(z.n) + '</b>' +
        '<span class="meta">' + fa(z.ids.length) + ' سوال</span>' +
        '<span class="en en-q">Quiz ' + z.n + ' · ' + z.ids.length + ' questions</span>' +
        (best ? '<span class="best">بهترین نتیجه: ' + fa(best.split('/')[0]) + ' از ' + fa(best.split('/')[1]) + '</span>' : '') +
        '</a>';
    });
    h += '</div>';
    app.innerHTML = h;
    window.scrollTo(0, 0);
  }

  function renderSingleStart(n) {
    var z = QUIZZES.filter(function (x) { return x.n === n; })[0];
    var best = getBest(n);
    app.innerHTML = '<section class="intro"><h1>آزمون ' + fa(n) + ' — قوانین ترافیک موتر (WA)</h1>' +
      '<p>' + fa(z.ids.length) + ' سوال. هر سوال یکی‌یکی نشان داده می‌شود. دکمهٔ «🔊 شنیدن سوال» را بزنید تا سوال و گزینه‌ها به دری خوانده شود. ' +
      'جواب را انتخاب کنید، بعد «سوال بعدی» را بزنید. برای کامیابی حداقل ۸۰٪ (۲۴ از ۳۰) لازم است.</p>' +
      '<span class="en en-q">Quiz ' + n + ' · ' + z.ids.length + ' questions · Dari audio for every question · pass mark 80% (24/30)</span>' +
      (best ? '<p class="pass">بهترین نتیجه: ' + fa(best.split('/')[0]) + ' از ' + fa(best.split('/')[1]) + '</p>' : '') +
      '<div class="actions"><a class="btn green" href="#quiz/' + n + '" style="text-decoration:none">شروع آزمون ' + fa(n) + '</a>' +
      '<a class="btn alt" href="index.html" style="text-decoration:none">آزمون‌های دیگر</a></div>' +
      '<p class="note">«آزمون‌های دیگر» فقط وقتی کار می‌کند که همه فایل‌ها در یک فولدر باشند. هر فایل quiz-01.html تا quiz-11.html به تنهایی هم کار می‌کند.</p></section>';
    window.scrollTo(0, 0);
  }

  // ---- quiz ----
  function startQuiz(n) {
    var z = QUIZZES.filter(function (x) { return x.n === n; })[0];
    if (!z) { location.hash = ''; return; }
    state = { quiz: z, i: 0, answers: [] };
    renderQuestion();
  }

  function renderQuestion() {
    stopAudio();
    var z = state.quiz, i = state.i, id = z.ids[i], q = Q[id];
    var total = z.ids.length;
    var h = '<div class="panel">' +
      '<div class="bar"><span>آزمون ' + fa(z.n) + ' — سوال ' + fa(i + 1) + ' از ' + fa(total) + '</span>' +
      '<a href="#" class="small-btn" style="border:1px solid #cfd8e3">بازگشت به لست آزمون‌ها</a></div>' +
      '<div class="progress"><span style="width:' + ((i) / total * 100) + '%"></span></div>' +
      '<div class="qhead"><p class="qtext">' + esc(q.q) + '</p>' +
      '<button class="play" id="playQ" type="button" data-label="🔊 شنیدن سوال">🔊 شنیدن سوال</button></div>' +
      '<span class="en en-q">' + esc(q.eq) + '</span>';
    if (q.img) h += '<img class="qimg" src="' + esc(q.img) + '" alt="تصویر سوال">';
    if (q.multi) h += '<p class="note">چند جواب درست می‌تواند داشته باشد. همه جواب‌های درست را انتخاب کنید، بعد «ثبت جواب» را بزنید.</p>';
    h += '<ul class="opts">';
    q.o.forEach(function (o, k) {
      h += '<li><button type="button" class="opt" data-k="' + k + '"><span class="lab">' + LABELS[k] + '</span>' +
        '<span class="txt">' + esc(o) + '<span class="en en-opt">' + LATIN[k] + '. ' + esc(q.eo[k]) + '</span></span></button></li>';
    });
    h += '</ul>';
    if (q.multi) h += '<div class="actions"><button class="btn" id="submitMulti" type="button" disabled>ثبت جواب</button></div>';
    h += '<div id="feedback"></div><div class="actions" id="nextWrap"></div></div>';
    app.innerHTML = h;
    window.scrollTo(0, 0);

    var playBtn = el('playQ');
    playBtn.addEventListener('click', function () { playClip(audioSrc('q', id), playBtn); });

    var opts = app.querySelectorAll('.opt');
    if (q.multi) {
      var chosen = {};
      Array.prototype.forEach.call(opts, function (b) {
        b.addEventListener('click', function () {
          var k = +b.dataset.k; chosen[k] = !chosen[k];
          b.classList.toggle('sel', chosen[k]);
          el('submitMulti').disabled = !Object.keys(chosen).some(function (x) { return chosen[x]; });
        });
      });
      el('submitMulti').addEventListener('click', function () {
        var sel = Object.keys(chosen).filter(function (x) { return chosen[x]; }).map(Number);
        el('submitMulti').disabled = true;
        answer(sel);
      });
    } else {
      Array.prototype.forEach.call(opts, function (b) {
        b.addEventListener('click', function () { answer([+b.dataset.k]); });
      });
    }
  }

  function sameSet(a, b) { if (a.length !== b.length) return false; var s = a.slice().sort().join(','); return s === b.slice().sort().join(','); }

  function answer(sel) {
    var z = state.quiz, id = z.ids[state.i], q = Q[id];
    var opts = app.querySelectorAll('.opt');
    Array.prototype.forEach.call(opts, function (b) { b.disabled = true; b.classList.remove('sel'); });
    var fb = el('feedback'), ok = null;
    if (scorable(q)) {
      ok = sameSet(sel, q.a);
      q.a.forEach(function (k) { opts[k].classList.add('correct'); });
      sel.forEach(function (k) { if (q.a.indexOf(k) < 0) opts[k].classList.add('wrong'); });
      var right = q.a.map(function (k) { return LABELS[k]; }).join('، ');
      fb.innerHTML = ok
        ? '<div class="fb ok">✔ درست است! <span class="en en-q">Correct!</span></div>'
        : '<div class="fb no">✘ نادرست. جواب درست: ' + right + ' <span class="en en-q">Incorrect. Correct answer: ' + q.a.map(function (k) { return LATIN[k]; }).join(', ') + '</span></div>';
    } else {
      sel.forEach(function (k) { opts[k].classList.add('sel'); });
      fb.innerHTML = '<div class="fb unk">جواب درست این سوال از یک منبع معتبر تأیید نشده، بنابراین در نمره حساب نمی‌شود. <span class="en en-q">Correct answer not verified; not scored.</span></div>';
    }
    state.answers[state.i] = { id: id, sel: sel, ok: ok };
    var last = state.i === z.ids.length - 1;
    var nw = el('nextWrap');
    nw.innerHTML = '<button class="play" id="playA" type="button" data-label="🔊 شنیدن جواب درست">🔊 شنیدن جواب درست</button>' +
      '<button class="btn green" id="nextBtn" type="button">' + (last ? 'دیدن نتیجه' : 'سوال بعدی ←') + '</button>';
    var pa = el('playA');
    pa.addEventListener('click', function () { playClip(audioSrc('a', id), pa); });
    el('nextBtn').addEventListener('click', function () {
      if (last) renderScore(); else { state.i++; renderQuestion(); }
    });
    el('nextBtn').focus();
  }

  function renderScore() {
    stopAudio();
    var z = state.quiz;
    var scored = state.answers.filter(function (a) { return a && a.ok !== null; });
    var right = scored.filter(function (a) { return a.ok; }).length;
    var total = scored.length;
    var need = Math.ceil(total * PASS_RATIO);
    var pass = right >= need;
    setBest(z.n, right, total);
    var h = '<div class="panel score" id="scoreScreen"><h1>نتیجهٔ آزمون ' + fa(z.n) + '</h1>' +
      '<div class="big ' + (pass ? 'pass' : 'fail') + '">' + fa(right) + ' از ' + fa(total) + '</div>' +
      '<p class="' + (pass ? 'pass' : 'fail') + '" style="font-size:24px;font-weight:700">' +
      (pass ? '🎉 کامیاب شدید!' : 'ناکام — دوباره کوشش کنید') + '</p>' +
      '<p>برای کامیابی حداقل ' + fa(need) + ' جواب درست از ' + fa(total) + ' لازم است (۸۰٪).</p>' +
      '<span class="en en-q" style="text-align:center">' + right + ' / ' + total + ' — ' + (pass ? 'PASS' : 'FAIL') + ' (pass mark ' + need + ')</span>';
    if (total < z.ids.length) h += '<p class="note">' + fa(z.ids.length - total) + ' سوال بدون جواب تأییدشده در نمره حساب نشد.</p>';
    h += '<div class="actions" style="justify-content:center"><button class="btn" id="retryBtn" type="button">دوباره امتحان کنید</button>' +
      '<a class="btn alt" href="#" id="backBtn" style="text-decoration:none">بازگشت به آزمون‌ها</a></div>';
    var wrong = state.answers.filter(function (a) { return a && a.ok === false; });
    if (wrong.length) {
      h += '<div class="review"><h2 style="font-size:20px">سوال‌هایی که اشتباه جواب دادید:</h2><ol>';
      wrong.forEach(function (a) {
        var q = Q[a.id];
        h += '<li>' + esc(q.q) + '<br><b class="pass">جواب درست: ' + q.a.map(function (k) { return LABELS[k] + ') ' + esc(q.o[k]); }).join(' / ') + '</b></li>';
      });
      h += '</ol></div>';
    }
    h += '</div>';
    app.innerHTML = h;
    window.scrollTo(0, 0);
    el('retryBtn').addEventListener('click', function () { startQuiz(z.n); });
  }

  function route() {
    var m = location.hash.match(/^#quiz\/(\d+)/);
    if (m) startQuiz(parseInt(m[1], 10)); else renderHome();
  }
  window.addEventListener('hashchange', route);
  route();
})();
