// WALD OFF : carrousel 3D, explosions, fumée et Polo qui roule au scroll
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Particules (fumée + explosions) ---------- */
  var cv = document.getElementById('fx'), cx = cv.getContext('2d'), P = [], dpr = 1;
  function size() { dpr = Math.min(window.devicePixelRatio || 1, 2); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  size(); addEventListener('resize', size);
  function rnd(a, b) { return a + Math.random() * (b - a); }

  function smoke(x, y, n, opt) {
    opt = opt || {};
    for (var i = 0; i < n; i++) P.push({ t: 'smoke', x: x + rnd(-4, 4), y: y + rnd(-3, 3), vx: (opt.vx || 0) + rnd(-.6, .6), vy: (opt.vy || -1) + rnd(-.5, .3),
      r: rnd(4, 9) * (opt.s || 1), g: rnd(.25, .5) * (opt.s || 1), life: 0, max: rnd(50, 90), c: opt.c || 120 });
  }
  function boom(x, y, power) {
    power = power || 1;
    P.push({ t: 'flash', x: x, y: y, r: 10, life: 0, max: 14, p: power });
    var cols = ['#ffd60a', '#ff8a00', '#ff3b5c', '#fff3b0', '#3de0ff'];
    for (var i = 0; i < 46 * power; i++) {
      var a = rnd(0, Math.PI * 2), sp = rnd(2, 9) * power;
      P.push({ t: 'spark', x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.5, life: 0, max: rnd(28, 55), c: cols[i % cols.length], r: rnd(1.5, 3.5) });
    }
    smoke(x, y, 16 * power, { s: 1.6 * power, vy: -.6, c: 70 });
  }
  window.wfBoom = boom;

  function tick() {
    cx.clearRect(0, 0, innerWidth, innerHeight);
    for (var i = P.length - 1; i >= 0; i--) {
      var p = P[i]; p.life++;
      var k = p.life / p.max;
      if (k >= 1) { P.splice(i, 1); continue; }
      if (p.t === 'smoke') {
        p.x += p.vx; p.y += p.vy; p.vx *= .98; p.r += p.g;
        cx.globalCompositeOperation = 'source-over';
        cx.fillStyle = 'rgba(' + p.c + ',' + p.c + ',' + (p.c + 15) + ',' + (0.45 * (1 - k)) + ')';
        cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.283); cx.fill();
      } else if (p.t === 'spark') {
        p.x += p.vx; p.y += p.vy; p.vy += .22; p.vx *= .97;
        cx.globalCompositeOperation = 'lighter';
        cx.globalAlpha = 1 - k; cx.fillStyle = p.c;
        cx.beginPath(); cx.arc(p.x, p.y, p.r * (1 - k * .5), 0, 6.283); cx.fill(); cx.globalAlpha = 1;
      } else if (p.t === 'flash') {
        var R = 20 + k * 140 * p.p;
        var g = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, R);
        g.addColorStop(0, 'rgba(255,245,200,' + (1 - k) + ')'); g.addColorStop(.4, 'rgba(255,140,0,' + (.7 * (1 - k)) + ')'); g.addColorStop(1, 'rgba(255,59,92,0)');
        cx.globalCompositeOperation = 'lighter'; cx.fillStyle = g;
        cx.beginPath(); cx.arc(p.x, p.y, R, 0, 6.283); cx.fill();
      }
    }
    cx.globalCompositeOperation = 'source-over';
    drive();
    requestAnimationFrame(tick);
  }

  /* ---------- Carrousel 3D en boucle ---------- */
  var ring = document.getElementById('ring'), stage = document.getElementById('stage');
  var cards = [].slice.call(ring.querySelectorAll('.card')), dots = [].slice.call(document.querySelectorAll('#dots i'));
  var N = cards.length, idx = 0, lastUser = 0;
  function R() { return cards[0].offsetWidth * 0.72; }
  function layout() {
    var r = R();
    cards.forEach(function (c, i) { c.style.transform = 'rotateY(' + (i * 360 / N) + 'deg) translateZ(' + r + 'px)'; });
    ring.style.transform = 'translateZ(' + (-r) + 'px) rotateY(' + (-idx * 360 / N) + 'deg)';
    var f = ((idx % N) + N) % N;
    cards.forEach(function (c, i) { c.classList.toggle('front', i === f); c.tabIndex = i === f ? 0 : -1; });
    dots.forEach(function (d, i) { d.classList.toggle('on', i === f); });
  }
  function go(step, user) {
    idx += step; if (user) lastUser = Date.now();
    layout();
    if (!reduce) {
      var b = stage.getBoundingClientRect();
      boom(b.left + b.width / 2, b.top + b.height / 2, .9);
      smoke(b.left + b.width * .2, b.bottom - 20, 6, { s: 1.4 }); smoke(b.left + b.width * .8, b.bottom - 20, 6, { s: 1.4 });
      stage.classList.remove('shake'); void stage.offsetWidth; stage.classList.add('shake');
    }
  }
  document.getElementById('next').addEventListener('click', function () { go(1, true); });
  document.getElementById('prev').addEventListener('click', function () { go(-1, true); });
  cards.forEach(function (c, i) {
    c.addEventListener('click', function (e) {
      var f = ((idx % N) + N) % N;
      if (i !== f) { e.preventDefault(); var d = (i - f + N) % N; go(d === 1 ? 1 : -1, true); }
      else if (!reduce) { var b = c.getBoundingClientRect(); boom(b.left + b.width / 2, b.top + 60, 1.2); }
    });
  });
  var sx = null;
  stage.addEventListener('pointerdown', function (e) { sx = e.clientX; });
  stage.addEventListener('pointerup', function (e) { if (sx === null) return; var dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1, true); });
  addEventListener('resize', layout);
  layout();
  if (!reduce) setInterval(function () { if (Date.now() - lastUser > 7000 && !document.hidden) go(1, false); }, 3800);

  /* Explosion sur les autres boutons */
  [].slice.call(document.querySelectorAll('.link, .cta')).forEach(function (a) {
    a.addEventListener('click', function () { if (reduce) return; var b = a.getBoundingClientRect(); boom(b.left + 40, b.top + b.height / 2, .8); });
  });

  /* ---------- La Polo qui roule au scroll ---------- */
  var polo = document.getElementById('polo'), w1 = document.getElementById('w1'), w2 = document.getElementById('w2'), lane = document.getElementById('lane');
  var curX = 8, rot = 0, lastY = scrollY, vel = 0, idleT = 0, arrived = false;
  function drive() {
    var max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    var prog = Math.min(1, Math.max(0, scrollY / max));
    var cw = polo.getBoundingClientRect().width;
    var target = 8 + prog * (innerWidth - cw - 16);
    var dx = (target - curX) * (reduce ? 1 : .12);
    curX += dx;
    var dy = scrollY - lastY; lastY = scrollY;
    vel = vel * .85 + Math.abs(dy) * .15;
    rot += dx * 2.2;
    var bounce = vel > 1 ? Math.sin(Date.now() / 45) * Math.min(2.5, vel / 6) : 0;
    var tilt = Math.max(-6, Math.min(6, -dx * .5));
    polo.style.transform = 'translate(' + curX + 'px,' + bounce + 'px) rotate(' + tilt + 'deg)';
    w1.style.transform = w2.style.transform = 'rotate(' + rot + 'deg)';
    lane.style.backgroundPosition = (-scrollY * .8) + 'px 0';
    if (reduce) return;
    var b = polo.getBoundingClientRect(), s = b.width / 220;
    var px = b.left + 161 * s, py = b.top + 4 * s;
    if (Math.abs(dx) > .6) {
      smoke(px, py, Math.min(4, 1 + Math.abs(dx) / 3 | 0), { vx: -Math.sign(dx) * 1.2, vy: -1.4, s: .7 });
      if (Math.abs(dx) > 9 && Math.random() < .5) P.push({ t: 'spark', x: px, y: py, vx: rnd(-1, 1) - Math.sign(dx) * 2, vy: rnd(-4, -2), life: 0, max: 18, c: Math.random() < .5 ? '#ff8a00' : '#ffd60a', r: rnd(2, 4) });
      idleT = 0;
    } else if (++idleT % 70 === 0) smoke(px, py, 2, { vy: -1.1, s: .7 });
    if (prog > .985 && !arrived) { arrived = true; boom(b.left + b.width / 2, b.top + 10, 1.4); }
    if (prog < .9) arrived = false;
  }

  /* Intro : petite explosion derrière le titre */
  if (!reduce) setTimeout(function () { var h = document.querySelector('.photo h1'); if (h) { var b = h.getBoundingClientRect(); boom(b.left + b.width / 2, b.top + b.height / 2, 1.1); } }, 450);
  requestAnimationFrame(tick);
})();
