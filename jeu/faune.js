/* Wald Royal : FAUNE du mode SURVIE (window.FAUNE) — animaux façon Minecraft, viande, loups à apprivoiser, événements.
   - Animaux en blocs : loup, sanglier, cochon, mouton, poule, lapin, cerf. Ils se promènent, fuient ou attaquent.
   - Viande (seulement en Survie) : on la récupère sur les animaux, on la mange (V ou bouton 🍖) = +20 PV.
   - LOUP : donne-lui de la viande (touche Interagir près de lui) → 1 chance sur 3 qu'il devienne TON loup :
     il te suit, attaque les créatures autour de toi, s'assoit / te suit quand tu interagis avec lui. Sauvegardé.
   - Événements : Lune des loups, Pluie d'étoiles filantes (métal), Troupeau migrateur, Ravitaillement du ciel. */
(function () {
  var T, C, X, ON = false, L = [], MAT = {}, GB = null, SAVE = { meat: 0, tamed: 0, names: [] }, SPAWNT = 0, EVT = null, EVTT = 90, UI = null, LAST = 0;
  var K = {
    loup: { n: 'Loup', hp: 70, walk: 1.6, run: 7.2, dmg: 9, meat: 1, mode: 'neutre', body: [.42, .42, .95], head: [.36, .34, .34], leg: [.13, .42], col: '#9aa0aa', col2: '#d8dce2', snout: 1, ears: 1, tail: [.12, .12, .5] },
    sanglier: { n: 'Sanglier', hp: 90, walk: 1.3, run: 6.2, dmg: 12, meat: 2, mode: 'hostile', body: [.6, .55, 1.05], head: [.42, .4, .4], leg: [.15, .36], col: '#5a3a26', col2: '#3a2414', snout: 1, tusks: 1 },
    cochon: { n: 'Cochon', hp: 40, walk: 1.1, run: 4.5, meat: 2, mode: 'passif', body: [.62, .55, .9], head: [.45, .42, .4], leg: [.16, .3], col: '#f2a6b0', col2: '#e07a8a', snout: 1 },
    mouton: { n: 'Mouton', hp: 40, walk: 1, run: 4.2, meat: 2, mode: 'passif', body: [.72, .66, .95], head: [.32, .36, .36], leg: [.13, .38], col: '#f4f2ea', col2: '#2a2622', wool: 1 },
    poule: { n: 'Poule', hp: 15, walk: .9, run: 4, meat: 1, mode: 'passif', body: [.3, .32, .38], head: [.2, .26, .2], leg: [.05, .22], col: '#ffffff', col2: '#ff3a2a', beak: 1, two: 1, sc: .9 },
    lapin: { n: 'Lapin', hp: 12, walk: 1.4, run: 7, meat: 1, mode: 'passif', body: [.26, .26, .38], head: [.22, .22, .22], leg: [.07, .14], col: '#b8946a', col2: '#f4efe6', ears2: 1, hop: 1 },
    cerf: { n: 'Cerf', hp: 60, walk: 1.4, run: 8.5, meat: 3, mode: 'passif', body: [.48, .6, 1.15], head: [.3, .34, .42], leg: [.1, .72], col: '#9a6a3a', col2: '#f2e2c8', antlers: 1 }
  };
  var WEIGHT = [['lapin', 3], ['poule', 3], ['cochon', 3], ['mouton', 3], ['cerf', 2], ['loup', 3], ['sanglier', 2]];
  function mat(c) { return MAT[c] || (MAT[c] = new T.MeshLambertMaterial({ color: c })); }
  function box(par, w, h, d, x, y, z, c) { var m = new T.Mesh(GB, mat(c)); m.scale.set(w, h, d); m.position.set(x, y, z); m.castShadow = true; par.add(m); return m; }
  function model(k, tame) { var D = K[k], R = new T.Group(), g = new T.Group(), sc = D.sc || 1; R.add(g); var b = D.body, lh = D.leg[1], lw = D.leg[0], by = lh + b[1] / 2;
    box(g, b[2], b[1], b[0], 0, by, 0, D.col); if (D.wool) box(g, b[2] * 1.08, b[1] * .4, b[0] * 1.1, 0, by + b[1] * .38, 0, '#ffffff');
    var head = new T.Group(); head.position.set(b[2] / 2 + D.head[2] * .3, by + b[1] * .35, 0); g.add(head); box(head, D.head[2], D.head[1], D.head[0], D.head[2] / 2, 0, 0, D.wool ? D.col2 : D.col);
    var eyeY = D.head[1] * .15, ex = D.head[2] * .98, ez = D.head[0] * .28; [-1, 1].forEach(function (s) { box(head, .02, .06, .06, ex, eyeY, s * ez, '#111'); if (!tame && D.mode !== 'passif') box(head, .021, .03, .03, ex + .002, eyeY + .01, s * ez, k === 'loup' ? '#ffd23d' : '#ff3a2a'); });
    if (D.snout) box(head, .16, D.head[1] * .45, D.head[0] * .55, D.head[2] + .07, -D.head[1] * .18, 0, D.col2);
    if (D.ears) [-1, 1].forEach(function (s) { box(head, .06, .14, .08, D.head[2] * .3, D.head[1] / 2 + .06, s * D.head[0] * .3, D.col); });
    if (D.ears2) [-1, 1].forEach(function (s) { box(head, .05, .26, .07, D.head[2] * .25, D.head[1] / 2 + .13, s * .06, D.col); });
    if (D.tusks) [-1, 1].forEach(function (s) { box(head, .12, .04, .04, D.head[2] + .12, -D.head[1] * .1, s * .13, '#f4f0e0'); });
    if (D.beak) { box(head, .1, .06, .1, D.head[2] + .04, 0, 0, '#ffb12a'); box(head, .05, .1, .06, D.head[2] + .01, -.1, 0, D.col2); box(head, .14, .07, .04, D.head[2] * .4, D.head[1] / 2 + .03, 0, D.col2); }
    if (D.antlers) [-1, 1].forEach(function (s) { box(head, .04, .34, .04, D.head[2] * .3, D.head[1] / 2 + .17, s * .1, '#d8c8a0'); box(head, .2, .04, .04, D.head[2] * .3 + .06, D.head[1] / 2 + .3, s * .1, '#d8c8a0'); box(head, .04, .14, .04, D.head[2] * .3 + .14, D.head[1] / 2 + .38, s * .1, '#d8c8a0'); });
    var tail = null; if (D.tail) { tail = new T.Group(); tail.position.set(-b[2] / 2, by + b[1] * .3, 0); g.add(tail); box(tail, D.tail[2], D.tail[1], D.tail[0], -D.tail[2] / 2, 0, 0, D.col); tail.rotation.z = .5; }
    if (tame) { box(head, .06, .07, D.head[0] * 1.05, -.02, -D.head[1] * .38, 0, '#e0202a'); box(head, .03, .05, .05, .02, -D.head[1] * .5, 0, '#ffd23d'); }
    var legs = []; (D.two ? [[0, -1], [0, 1]] : [[1, -1], [1, 1], [-1, -1], [-1, 1]]).forEach(function (q) { var p = new T.Group(); p.position.set(q[0] * (b[2] / 2 - lw), lh, q[1] * (b[0] / 2 - lw * .7)); g.add(p); box(p, lw, lh, lw, 0, -lh / 2, 0, D.two ? '#ffb12a' : D.wool ? D.col2 : D.col); legs.push(p); });
    R.scale.setScalar(sc); C.scene.add(R); return { root: R, g: g, head: head, legs: legs, tail: tail, h: (by + b[1] / 2) * sc, r: Math.max(b[0], b[2]) * .5 * sc, len: b[2] * sc }; }
  function free(a) { if (a.m) { C.scene.remove(a.m.root); a.m = null; } }
  function pick() { var night = C.isNight && C.isNight(), tot = 0; WEIGHT.forEach(function (w) { tot += w[1] * (night && w[0] === 'loup' ? 2.5 : 1); }); var r = Math.random() * tot;
    for (var i = 0; i < WEIGHT.length; i++) { r -= WEIGHT[i][1] * (night && WEIGHT[i][0] === 'loup' ? 2.5 : 1); if (r <= 0) return WEIGHT[i][0]; } return 'lapin'; }
  function spot(P, d0, d1) { for (var t = 0; t < 8; t++) { var a = Math.random() * 6.283, d = d0 + Math.random() * (d1 - d0), x = P.x + Math.cos(a) * d, z = P.z + Math.sin(a) * d;
      if (C.inLake && C.inLake(x, z, 0)) continue; if (C.onLand && !C.onLand(x, z)) continue; var y = C.hgt(x, z); if (y < -.5) continue; return { x: x, z: z, y: y }; } return null; }
  function spawn(k, x, z, o) { var D = K[k]; var a = { k: k, x: x, z: z, y: C.hgt(x, z), a: Math.random() * 6.283, hp: D.hp, st: 'idle', t: 0, wx: x, wz: z, ph: Math.random() * 6, atk: 0, m: null, tame: false, sit: false, ang: 0, flash: 0 };
    if (o) Object.assign(a, o); L.push(a); return a; }
  function gy(x, z, y) { var g = C.hgt(x, z); if (X.groundAt) g = Math.max(g, X.groundAt(x, z, y + .6)); return g; }
  function save() { try { localStorage.setItem('wr_faune', JSON.stringify(SAVE)); } catch (e) {} uiDraw(); }
  function load() { try { var s = JSON.parse(localStorage.getItem('wr_faune') || 'null'); if (s) SAVE = Object.assign(SAVE, s); } catch (e) {} }
  function tamedSpawn() { var P = C.me(); L.filter(function (a) { return a.tame; }).forEach(function (a) { free(a); a.dead = true; }); L = L.filter(function (a) { return !a.dead; });
    for (var i = 0; i < Math.min(6, SAVE.tamed); i++) spawn('loup', P.x + Math.cos(i * 1.7) * 3, P.z + Math.sin(i * 1.7) * 3, { tame: true, name: SAVE.names[i] || 'Loup ' + (i + 1) }); }
  function hearts(x, y, z, ok) { C.burst(x, y, z, ok ? 14 : 8, ok ? ['#ff3a6a', '#ff7a9a', '#ffd0dc'] : ['#bbbbbb', '#888888', '#eeeeee'], ok ? 3 : 2, .18, .8); }
  function uiInit() { var b = document.createElement('button'); b.type = 'button'; b.id = 'fMeat'; b.style.cssText = 'position:fixed;left:calc(10px + env(safe-area-inset-left,0px));bottom:calc(150px + env(safe-area-inset-bottom,0px));z-index:22;font:900 13px Inter,system-ui,sans-serif;color:#fff;background:linear-gradient(180deg,#7a2a1a,#3a1208);border:2px solid #ff9a5a;border-radius:12px;padding:7px 10px;box-shadow:0 0 14px rgba(255,120,60,.45);cursor:pointer';
    b.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); eat(); }); document.body.appendChild(b); UI = b; uiDraw(); }
  function uiDraw() { if (!UI) return; UI.hidden = !ON; UI.innerHTML = '🍖 ' + SAVE.meat + (C.isTouch ? '' : ' <small style="opacity:.7">(V)</small>') + (SAVE.tamed ? ' · 🐺 ' + SAVE.tamed : ''); UI.style.opacity = SAVE.meat ? 1 : .6; }
  function eat() { var P = C.me(); if (!ON || !P.alive) return; if (!SAVE.meat) { C.toast('🍖 PAS DE VIANDE · chasse des animaux'); return; } if (P.hp >= 100) { C.toast('❤️ TU AS DÉJÀ TOUTE TA VIE'); return; }
    SAVE.meat--; P.hp = Math.min(100, P.hp + 20); C.tone('triangle', 300, 520, .12, .07); C.toast('🍖 MIAM · +20 PV'); if (C.hudRefresh) C.hudRefresh(); save(); }
  function die(a, by) { a.dead = true; a.dtT = 0; var D = K[a.k]; if (a.tame) { SAVE.tamed = Math.max(0, SAVE.tamed - 1); var ni = SAVE.names.indexOf(a.name); if (ni >= 0) SAVE.names.splice(ni, 1); C.toast('💔 ' + a.name.toUpperCase() + ' EST MORT'); save(); return; }
    if (by === C.me()) { SAVE.meat = Math.min(99, SAVE.meat + D.meat); C.toast('🍖 +' + D.meat + ' VIANDE (' + D.n + ')'); C.tone('triangle', 520, 780, .1, .06); save(); } }
  function nearestZ(x, z, r) { if (!window.ZOMB || !ZOMB.on) return null; var n = ZOMB.nearest(x, z); return n && n.d < r ? n.z : null; }
  function event(kind) { var P = C.me(); EVT = { k: kind, t: 0 };
    if (kind === 'lune') { C.toast('🌕🐺 LUNE DES LOUPS · une meute te chasse cette nuit !'); for (var i = 0; i < 5; i++) { var s = spot(P, 30, 45); if (s) spawn('loup', s.x, s.z, { st: 'chase', angry: 40 }); } C.tone('sawtooth', 220, 440, 1.4, .08); }
    if (kind === 'etoiles') { C.toast('🌠 PLUIE D\'ÉTOILES FILANTES · va ramasser le métal où elles tombent !'); EVT.n = 6; EVT.next = 0; }
    if (kind === 'troupeau') { C.toast('🦌 UN TROUPEAU DE CERFS PASSE PRÈS DE TOI · de la viande en vue !'); var s2 = spot(P, 35, 50); if (s2) for (var j = 0; j < 7; j++) spawn('cerf', s2.x + (Math.random() - .5) * 8, s2.z + (Math.random() - .5) * 8, { herd: { x: P.x * 2 - s2.x, z: P.z * 2 - s2.z } }); }
    if (kind === 'ravito') { var s3 = spot(P, 18, 30); if (!s3) return; C.toast('📦 RAVITAILLEMENT DU CIEL · il tombe à ' + Math.round(Math.hypot(s3.x - P.x, s3.z - P.z)) + ' m !'); EVT.box = s3; EVT.y = s3.y + 60;
      var g = new T.Group(); box(g, 1.2, 1.2, 1.2, 0, .6, 0, '#3a8aff'); box(g, 1.25, .2, 1.25, 0, .6, 0, '#ffd23d'); box(g, .2, 1.25, 1.25, 0, .6, 0, '#ffd23d'); var para = new T.Mesh(new T.SphereGeometry(1.6, 12, 6, 0, 6.283, 0, 1.4), mat('#ff3a8a')); para.position.y = 3.4; g.add(para); EVT.para = para; g.position.set(s3.x, EVT.y, s3.z); C.scene.add(g); EVT.g = g; } }
  function eventTick(dt) { var P = C.me(); EVTT -= dt;
    if (!EVT && EVTT <= 0) { EVTT = 150 + Math.random() * 120; var night = C.isNight && C.isNight(), L2 = night ? ['lune', 'etoiles', 'ravito'] : ['troupeau', 'ravito', 'troupeau']; event(L2[Math.random() * L2.length | 0]); return; }
    if (!EVT) return; EVT.t += dt;
    if (EVT.k === 'etoiles') { EVT.next -= dt; if (EVT.next <= 0 && EVT.n > 0) { EVT.n--; EVT.next = 4 + Math.random() * 4; var s = spot(P, 12, 40); if (s) { C.burst(s.x, s.y + 1, s.z, 26, ['#ffffff', '#9ad8ff', '#ffd23d'], 7, .3, 1.2); C.noise(.6, .3, 200); C.tone('sawtooth', 900, 120, .8, .07); if (X.give) X.give('metal', 12 + (Math.random() * 10 | 0), s.x, s.y, s.z, true); } } if (EVT.n <= 0 && EVT.next <= 0) EVT = null; }
    else if (EVT.k === 'ravito') { if (EVT.g) { EVT.y = Math.max(EVT.box.y, EVT.y - dt * 4); EVT.g.position.y = EVT.y; EVT.g.rotation.y += dt * .4; if (EVT.y <= EVT.box.y + .01 && EVT.para) { EVT.g.remove(EVT.para); EVT.para = null; C.noise(.3, .2, 300); }
        if (!EVT.para && Math.hypot(P.x - EVT.box.x, P.z - EVT.box.z) < 2.2) { C.scene.remove(EVT.g); EVT.g = null; SAVE.meat += 4; save(); if (C.dropItem && C.randWeapon) { for (var i = 0; i < 2; i++) C.dropItem(EVT.box.x + i - .5, EVT.box.z + .8, C.randWeapon()); } if (X.give) { X.give('metal', 30, EVT.box.x, EVT.box.y, EVT.box.z, true); X.give('pierre', 30, EVT.box.x, EVT.box.y, EVT.box.z, true); } C.toast('📦 RAVITAILLEMENT : armes, 4 viandes, métal et pierre !'); C.tone('triangle', 520, 1040, .3, .08); EVT = null; } } else EVT = null;
      if (EVT && EVT.t > 240) { if (EVT.g) C.scene.remove(EVT.g); EVT = null; } }
    else if (EVT.t > 60) EVT = null; }
  function tick(a, dt, P, now, night) { var D = K[a.k], d = Math.hypot(a.x - P.x, a.z - P.z), spd = 0, tx = a.x, tz = a.z;
    if (a.dead) { if (a.m) { a.dtT += dt; a.m.g.rotation.x = Math.min(1.5, a.dtT * 3); a.m.root.position.y = a.y - Math.max(0, a.dtT - 2) * .5; if (a.dtT > 3.5) free(a); } return; }
    if (!a.tame && d > 170) { free(a); a.gone = true; return; }
    if (a.atk > 0) a.atk -= dt; if (a.angry > 0) a.angry -= dt; if (a.flee > 0) a.flee -= dt; a.t -= dt;
    if (a.tame) { var z = nearestZ(P.x, P.z, 16);
      if (d > 45) { a.x = P.x - Math.cos(P.a || 0) * 2; a.z = P.z - Math.sin(P.a || 0) * 2; a.y = gy(a.x, a.z, P.y); }
      if (z && !a.sit) { tx = z.x; tz = z.z; var dz2 = Math.hypot(z.x - a.x, z.z - a.z); spd = dz2 > 1.4 ? D.run : 0; if (dz2 < 1.8 && a.atk <= 0) { a.atk = .8; ZOMB.hurt(z, 16, null); C.tone('square', 260, 140, .08, .05); a.bite = .25; } }
      else if (!a.sit && d > 4) { tx = P.x; tz = P.z; spd = d > 9 ? D.run : D.walk * 2; } }
    else if (a.angry > 0 || (D.mode === 'hostile' && d < 9 && P.alive) || a.st === 'chase') { if (!P.alive || d > 40) { a.st = 'idle'; a.angry = 0; } else { tx = P.x; tz = P.z; spd = d < 1.3 ? 0 : D.run * (night ? 1.1 : 1);
        if (d < 1.7 && Math.abs(P.y - a.y) < 1.6 && a.atk <= 0) { a.atk = 1; a.bite = .25; C.hurt(P, D.dmg || 8); C.tone('square', 200, 110, .1, .06); } } }
    else if (a.flee > 0) { var fx = a.x - P.x, fz = a.z - P.z, fl = Math.hypot(fx, fz) || 1; tx = a.x + fx / fl * 10; tz = a.z + fz / fl * 10; spd = D.run; }
    else if (a.herd) { tx = a.herd.x; tz = a.herd.z; spd = D.walk * 2.2; if (Math.hypot(tx - a.x, tz - a.z) < 4) a.herd = null; }
    else { if (a.t <= 0) { a.t = 2 + Math.random() * 5; if (Math.random() < .6) { var ra = Math.random() * 6.283, rr = 3 + Math.random() * 9; a.wx = a.x + Math.cos(ra) * rr; a.wz = a.z + Math.sin(ra) * rr; } else { a.wx = a.x; a.wz = a.z; } }
      tx = a.wx; tz = a.wz; spd = Math.hypot(tx - a.x, tz - a.z) > .6 ? D.walk : 0; }
    if (spd > 0) { var dx = tx - a.x, dz = tz - a.z, l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; var ta = Math.atan2(dz, dx), da = ((ta - a.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI; a.a += da * Math.min(1, dt * 7);
      var nx = a.x + Math.cos(a.a) * spd * dt, nz = a.z + Math.sin(a.a) * spd * dt; if (!(C.inLake && C.inLake(nx, nz, 0))) { a.x = nx; a.z = nz; if (d < 60 && C.pushCircle) { var o = { x: a.x, z: a.z, y: a.y, vx: 0, vz: 0 }; C.pushCircle(o, .35); a.x = o.x; a.z = o.z; } } else a.t = 0; }
    a.spd = spd; var g = gy(a.x, a.z, a.y); a.y += (g - a.y) * Math.min(1, dt * 12);
    if (d < 95 && !a.m) a.m = model(a.k, a.tame); else if (d > 110 && a.m && !a.tame) free(a);
    if (a.m) { var m = a.m, ph = (a.ph += dt * (spd > 0 ? 3 + spd * 1.6 : 0)), sw = spd > 0 ? Math.min(.9, .35 + spd * .08) : 0, hop = D.hop && spd > 0 ? Math.abs(Math.sin(ph)) * .25 : 0;
      m.root.position.set(a.x, a.y + hop, a.z); m.root.rotation.set(0, -a.a, 0); m.legs.forEach(function (lg, i) { lg.rotation.z = Math.sin(ph + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI : 0)) * sw; });
      if (a.bite > 0) a.bite -= dt; m.head.rotation.z = a.sit ? .25 : a.bite > 0 ? -.4 : Math.sin(now * 1.3 + a.ph) * .08 - (spd === 0 && !a.tame && D.mode === 'passif' && Math.sin(now * .3 + a.ph) > .6 ? .6 : 0);
      if (m.tail) m.tail.rotation.y = a.tame ? Math.sin(now * 9) * .5 : 0; m.g.rotation.z = a.sit ? .35 : 0; m.g.position.y = a.sit ? -.15 : 0;
      if (a.flash > 0) { a.flash -= dt; m.g.visible = Math.sin(now * 60) > -.3; } else m.g.visible = true; } }
  window.FAUNE = {
    on: false,
    init: function (THREE, ctx, extra) { T = THREE; C = ctx; X = extra || {}; GB = new T.BoxGeometry(1, 1, 1); load(); ON = this.on = true; uiInit(); setTimeout(tamedSpawn, 1500);
      addEventListener('keydown', function (e) { if (e.code === 'KeyV' && !e.repeat && C.state() === 'play' && !(e.target && /INPUT|TEXTAREA/.test(e.target.tagName))) eat(); }); },
    update: function (dt) { if (!ON) return; var P = C.me(); if (!P) return; var now = performance.now() / 1000, night = C.isNight && C.isNight();
      if ((SPAWNT -= dt) <= 0) { SPAWNT = 2; var wild = L.filter(function (a) { return !a.tame && !a.dead; }).length; if (wild < (night ? 18 : 14)) { var s = spot(P, 45, 110); if (s) { var k = pick(), n = k === 'loup' ? 2 + (Math.random() * 2 | 0) : k === 'poule' || k === 'mouton' || k === 'cochon' ? 2 : 1;
          for (var i = 0; i < n; i++) spawn(k, s.x + (Math.random() - .5) * 5, s.z + (Math.random() - .5) * 5, { pack: k === 'loup' ? s : null }); } } L = L.filter(function (a) { return !a.gone && !(a.dead && !a.m); }); }
      for (var i = 0; i < L.length; i++) tick(L[i], dt, P, now, night);
      if (C.state() === 'play') eventTick(dt);
      if (now - LAST > 1) { LAST = now; uiDraw(); } },
    ray: function (ox, oy, oz, dx, dy, dz, maxT, fat) { var best = null, bt = maxT, f = fat || 0;
      for (var i = 0; i < L.length; i++) { var a = L[i]; if (a.dead || !a.m || a.tame || Math.abs(a.x - ox) > maxT + 2 || Math.abs(a.z - oz) > maxT + 2) continue; var r = a.m.r + f, h = a.m.h;
        var t = C.rayBox(ox, oy, oz, dx, dy, dz, a.x - r, a.y, a.z - r, a.x + r, a.y + h + f * .5, a.z + r); if (t < bt) { bt = t; best = { t: t, kind: 'faune', o: a, head: false }; } }
      return best; },
    hurt: function (a, d, by) { if (a.dead || a.tame) return; a.hp -= d; a.flash = .2; var D = K[a.k];
      if (D.mode === 'passif') a.flee = 6; else { a.angry = 25; a.st = 'chase'; if (a.k === 'loup') L.forEach(function (b) { if (b.k === 'loup' && !b.tame && !b.dead && Math.hypot(b.x - a.x, b.z - a.z) < 15) { b.angry = 25; b.st = 'chase'; } }); }   /* toute la meute s'énerve */
      if (a.hp <= 0) die(a, by); else C.tone('square', 420, 300, .05, .04); },
    melee: function (x, y, z0, fx, fz, range, dmg) { var best = null, bd = range; L.forEach(function (a) { if (a.dead || a.tame) return; var dx = a.x - x, dz = a.z - z0, d = Math.hypot(dx, dz); if (d > bd || Math.abs(a.y - y) > 2) return; if ((dx * fx + dz * fz) / (d || 1) < .3) return; bd = d; best = a; });
      if (best) { this.hurt(best, dmg, C.me()); C.burst(best.x, best.y + .6, best.z, 6, ['#c8202a', '#7a1010'], 3, .12, .4); C.dmgNum(best.x, best.y + 1, best.z, dmg, false, false); } return best; },
    act: function () { var P = C.me(), best = null, bd = 3.2; L.forEach(function (a) { if (a.dead || a.k !== 'loup') return; var d = Math.hypot(a.x - P.x, a.z - P.z); if (d < bd) { bd = d; best = a; } }); if (!best) return false;
      if (best.tame) { best.sit = !best.sit; C.toast(best.sit ? '🐺 ' + best.name.toUpperCase() + ' S\'ASSOIT ET T\'ATTEND' : '🐺 ' + best.name.toUpperCase() + ' TE SUIT'); return true; }
      if (best.angry > 0) { C.toast('🐺 IL EST EN COLÈRE · calme-le d\'abord (éloigne-toi)'); return true; }
      if (!SAVE.meat) { C.toast('🐺 DONNE-LUI DE LA VIANDE POUR L\'APPRIVOISER · chasse des animaux'); return true; }
      SAVE.meat--; if (Math.random() < .34) { free(best); best.tame = true; best.sit = false; best.name = 'Loup ' + (SAVE.tamed + 1); SAVE.tamed++; SAVE.names.push(best.name); hearts(best.x, best.y + 1, best.z, true); C.tone('triangle', 600, 1200, .4, .08); C.toast('❤️ ' + best.name.toUpperCase() + ' EST À TOI ! Il te suit et te défend · Interagir = assis / suis-moi'); }
      else { hearts(best.x, best.y + 1, best.z, false); C.toast('🍖 IL A MANGÉ… réessaie (il te reste ' + SAVE.meat + ' viande' + (SAVE.meat > 1 ? 's' : '') + ')'); }
      save(); return true; },
    meat: function () { return SAVE.meat; }, eat: eat, list: function () { return L; }, event: event
  };
})();
