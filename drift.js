// WALD OFF : la Polo en 3D débarque en drift quand on descend sur les photos, avec le cri « POLO ! »
(function () {
  if (!window.THREE) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  var T = THREE, vw = innerWidth, vh = innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);

  /* --- calques : fumée (2D) sous la voiture (3D) --- */
  var sm = document.createElement('canvas'), gl = document.createElement('canvas');
  [sm, gl].forEach(function (c, i) { c.setAttribute('aria-hidden', 'true'); c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:' + (31 + i) + ';display:none'; document.body.appendChild(c); });
  var sx = sm.getContext('2d'), P = [];
  var r = new T.WebGLRenderer({ canvas: gl, alpha: true, antialias: true }); r.setClearColor(0, 0);
  var sc = new T.Scene(), cam = new T.OrthographicCamera(0, 1, 0, -1, -3000, 3000); cam.position.z = 1000;
  function size() {
    vw = innerWidth; vh = innerHeight; r.setPixelRatio(dpr); r.setSize(vw, vh, false);
    cam.left = 0; cam.right = vw; cam.top = 0; cam.bottom = -vh; cam.updateProjectionMatrix();
    sm.width = vw * dpr; sm.height = vh * dpr; sx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size(); addEventListener('resize', size);
  sc.add(new T.AmbientLight(0xffffff, .65)); var dl = new T.DirectionalLight(0xffffff, .9); dl.position.set(-300, 400, 800); sc.add(dl);
  var pl = new T.PointLight(0x3de0ff, .6, 900); pl.position.set(0, 0, 300); sc.add(pl);

  /* --- la Polo : cabriolet bleu marine, sièges bleus, pot chromé qui sort du capot + boîte de conserve --- */
  function M(c, o) { o = o || {}; return new T.MeshStandardMaterial({ color: c, metalness: o.m || .25, roughness: o.r == null ? .6 : o.r }); }
  function box(w, h, d, m, x, y, z) { var b = new T.Mesh(new T.BoxGeometry(w, h, d), m); b.position.set(x || 0, y || 0, z || 0); return b; }
  var car = new T.Group(), body = new T.Group(); car.add(body);
  var navy = M(0x1f2a5c, { m: .45, r: .35 }), mud = M(0x6b5236, { r: .9 }), seat = M(0x2d4fd8, { r: .7 }), dark = M(0x141c40), chrome = M(0xd8dde6, { m: 1, r: .15 });
  body.add(box(250, 112, 34, navy)); body.add(box(254, 116, 12, mud, 0, 0, -16));
  body.add(box(70, 104, 10, navy, 80, 0, 22)); body.add(box(60, 104, 8, navy, -95, 0, 21)); body.add(box(110, 96, 6, dark, -10, 0, 18));
  body.add(box(26, 38, 30, seat, 10, 24, 30)); body.add(box(26, 38, 30, seat, 10, -24, 30)); body.add(box(22, 84, 22, seat, -42, 0, 28));
  var ws = box(6, 104, 34, new T.MeshStandardMaterial({ color: 0xa0d2ff, transparent: true, opacity: .35, roughness: .1 }), 46, 0, 38); ws.rotation.y = -.5; body.add(ws);
  var pipe = new T.Mesh(new T.CylinderGeometry(5, 5, 70, 12), chrome); pipe.rotation.x = Math.PI / 2; pipe.position.set(78, 30, 60); body.add(pipe);
  var can = new T.Mesh(new T.CylinderGeometry(9, 9, 22, 14), M(0xaab0bb, { m: .9, r: .3 })); can.rotation.x = Math.PI / 2; can.position.set(78, 30, 102); body.add(can);
  body.add(box(6, 22, 10, M(0xfff4c2, { r: .2 }), 127, 34, 4)); body.add(box(6, 22, 10, M(0xfff4c2, { r: .2 }), 127, -34, 4));
  body.add(box(5, 18, 8, M(0xff3b5c, { r: .3 }), -127, 36, 4)); body.add(box(5, 18, 8, M(0xff3b5c, { r: .3 }), -127, -36, 4));
  var wheels = [];
  [[78, 60], [78, -60], [-80, 60], [-80, -60]].forEach(function (w) {
    var g = new T.Group(); g.add(new T.Mesh(new T.CylinderGeometry(24, 24, 18, 18), M(0x0d0d12, { r: .9 }))); g.add(new T.Mesh(new T.CylinderGeometry(13, 13, 19, 12), M(0x8a8f99, { m: .8, r: .3 })));
    g.position.set(w[0], w[1], -14); body.add(g); wheels.push(g);
  });
  body.rotation.x = -.55; sc.add(car);

  /* --- fumée des pneus --- */
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function puff(x, y, vx, vy, s) { P.push({ x: x, y: y, vx: vx + rnd(-.5, .5), vy: vy + rnd(-.5, .3), r: rnd(6, 12) * s, g: rnd(.4, .8) * s, life: 0, max: rnd(40, 70) }); }
  function drawSmoke() {
    sx.clearRect(0, 0, vw, vh);
    for (var i = P.length - 1; i >= 0; i--) { var p = P[i], k = ++p.life / p.max; if (k >= 1) { P.splice(i, 1); continue; }
      p.x += p.vx; p.y += p.vy; p.vx *= .97; p.r += p.g; sx.fillStyle = 'rgba(215,215,230,' + (.45 * (1 - k)) + ')'; sx.beginPath(); sx.arc(p.x, p.y, p.r, 0, 6.283); sx.fill(); }
  }

  /* --- le cri « POLO ! » (le navigateur ne laisse jouer le son qu'après un premier toucher/clic sur la page) --- */
  var cri = new Audio('live/sons/polo.mp3'); cri.preload = 'auto'; cri.volume = .8; var unlocked = false;
  function unlock() { if (unlocked) return; unlocked = true; cri.play().then(function () { cri.pause(); cri.currentTime = 0; }).catch(function () { unlocked = false; }); }
  addEventListener('pointerdown', unlock, { passive: true }); addEventListener('keydown', unlock);

  /* --- le drift --- */
  var busy = false;
  function drift() {
    if (busy) return; busy = true; sm.style.display = gl.style.display = 'block';
    try { cri.currentTime = 0; cri.play().catch(function () {}); } catch (e) {}
    var s = Math.max(.55, Math.min(1.3, vw / 700)); car.scale.set(s, s, s);
    var cx = vw / 2, cy = vh * .45, rx = vw * .3, ry = Math.min(vh * .2, rx * .7), t0 = performance.now(), dur = 3800;
    function pos(k) {
      if (k < .15) { var a = k / .15; return [-200 * s + (cx - rx + 200 * s) * a, vh * .8 + (cy - vh * .8) * a]; }
      if (k < .85) { var th = Math.PI + (k - .15) / .7 * 2 * Math.PI; return [cx + rx * Math.cos(th), cy + ry * Math.sin(th)]; }
      var b = (k - .85) / .15; return [cx - rx + (vw + 260 * s - cx + rx) * b, cy + (vh * .25 - cy) * b];
    }
    if (window.wfBoom) wfBoom(40, vh * .8, 1.1);
    (function step(now) {
      var k = Math.min(1, (now - t0) / dur), p = pos(k), q = pos(Math.min(1, k + .01));
      var head = Math.atan2(q[1] - p[1], q[0] - p[0]), toC = Math.atan2(cy - p[1], cx - p[0]);
      var dr = (k > .15 && k < .85) ? .65 : .65 * (k <= .15 ? k / .15 : 1 - (k - .85) / .15);
      var ang = head + (Math.sin(toC - head) > 0 ? 1 : -1) * dr;
      car.position.set(p[0], -p[1], 0); car.rotation.z = -ang; body.rotation.y = Math.sin(now / 70) * .03;
      wheels.forEach(function (w) { w.rotation.y += .5; });
      var fx = Math.cos(ang), fy = Math.sin(ang), back = 90 * s, sd = 55 * s;
      if (Math.random() < .6) { puff(p[0] - fx * back - fy * sd, p[1] - fy * back + fx * sd, -fx * 1.5, -fy * 1.5 - .3, s); puff(p[0] - fx * back + fy * sd, p[1] - fy * back - fx * sd, -fx * 1.5, -fy * 1.5 - .3, s); }
      r.render(sc, cam); drawSmoke();
      if (k < 1 || P.length) requestAnimationFrame(step);
      else { busy = false; r.clear(); sx.clearRect(0, 0, vw, vh); sm.style.display = gl.style.display = 'none'; }
      if (k >= 1 && !step.done) { step.done = true; r.clear(); if (window.wfBoom) wfBoom(vw - 40, vh * .25, 1.2); }
    })(t0);
  }
  window.wfDrift = drift;

  /* --- déclencheur : quand les photos des voitures arrivent à l'écran (une fois), et au clic sur la Polo du bas --- */
  var target = document.querySelector('.gallery'), fired = false;
  if (target && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting && !fired) { fired = true; drift(); } }); }, { threshold: .35 }).observe(target);
  }
  var polo = document.getElementById('polo');
  if (polo) { polo.style.pointerEvents = 'auto'; polo.style.cursor = 'pointer'; polo.addEventListener('click', function () { unlock(); drift(); }); }
})();
