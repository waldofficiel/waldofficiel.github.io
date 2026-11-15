/* Wald Royal : ZOMBIES du mode survie (window.ZOMB).
   ~90 zombies répartis dans le monde (camps en ruine, forêts sombres, partout). 4 sortes : rôdeur, brute, coureur, « bizarre » (grosse tête).
   Ils dorment loin du joueur, errent, puis foncent sur lui quand ils le voient (plus loin la nuit) ; ils tapent les murs qui les bloquent
   (constructions comprises) et montent les rampes. Le but : tous les tuer. Les morts sont gardés dans la sauvegarde (survie.js).
   Modèles : le squelette commun des persos (skins.js, skin « zombie »), 16 modèles réutilisés pour les zombies les plus proches. */
(function () {
  var T, C, Z = [], POOL = [], NPOOL = 16, built = 0, onKill = null, A;
  /* CRÉATURES : 8 espèces de la Brume Violette, plus ou moins rares (w = poids d'apparition), certaines seulement la nuit.
     Elles réapparaissent à l'infini loin du joueur (population POP). Chaque espèce a sa fiche dans le LIVRE DES CRÉATURES (survie.js). */
  var KIND = [
    { id: 'rodeur', name: 'Rôdeur', hp: 100, walk: 1.1, run: 3.5, dmg: 12, sc: 1, m: 0, w: 30, rar: 'Commun' },
    { id: 'brute', name: 'Brute', hp: 280, walk: .9, run: 2.7, dmg: 26, sc: 1.32, m: 1, w: 12, rar: 'Peu commun' },
    { id: 'coureur', name: 'Coureur', hp: 70, walk: 1.4, run: 5.6, dmg: 9, sc: .93, m: 2, w: 22, rar: 'Commun' },
    { id: 'bizarre', name: 'Bizarre', hp: 150, walk: 1, run: 3.9, dmg: 15, sc: 1.05, m: 3, w: 12, rar: 'Peu commun' },
    { id: 'hurleur', name: 'Hurleur', hp: 160, walk: 1.2, run: 4.6, dmg: 16, sc: 1.08, m: 3, w: 5, rar: 'Rare', o: { SK: '#d89ad0', SH: '#5a2a5a', eye: '#ff2bd6', spikes: 1 } },
    { id: 'colosse', name: 'Colosse de mousse', hp: 650, walk: .7, run: 2.1, dmg: 38, sc: 1.75, m: 1, w: 3, rar: 'Rare', o: { SK: '#6a8a4a', SH: '#3a5a2a', PA: '#2a3a1a', eye: '#c8ff2a', moss: 1 } },
    { id: 'spectre', name: 'Spectre des brumes', hp: 120, walk: 1.6, run: 6.4, dmg: 20, sc: 1, m: 2, w: 3, rar: 'Épique', night: 1, o: { SK: '#c8e0ff', SH: '#6a88c8', PA: '#3a4a7a', eye: '#3dd6ff' } },
    { id: 'roi', name: 'Roi Violet', hp: 1200, walk: .9, run: 3.2, dmg: 45, sc: 1.55, m: 1, w: .6, rar: 'Légendaire', o: { SK: '#9a5ac8', SH: '#2a0a4a', PA: '#1a0630', eye: '#ffd23d', crown: 1 } }];
  var POP = 110, RESP = [], NID = 0;
  function pickKind(night) { var tot = 0, ws = KIND.map(function (k) { var w = k.night && !night ? 0 : k.w * (night && k.w < 6 ? 2 : 1); tot += w; return w; }), r = Math.random() * tot; for (var i = 0; i < ws.length; i++) { r -= ws[i]; if (r <= 0) return i; } return 0; }
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function gen() {
    var r = rng(9090), id = 0;
    function add(x, z) { if (!C.onLand(x, z) || C.inLake(x, z, 3) || C.hgt(x, z) > 70) return false; var k = pickKind(false); Z.push({ id: id++, k: k, x: x, z: z, y: C.hgt(x, z), a: r() * 6.28, hp: KIND[k].hp, st: 'idle', t: r() * 4, wx: x, wz: z, hx: x, hz: z, step: 0, atk: 0, m: null, dead: false, dt0: 0, groan: r() * 8 }); return true; }
    C.TOWNS.forEach(function (t, ti) { if (t[4] === 'arena') return; for (var n = 0, k = 0; n < (ti === 0 ? 4 : 8) && k < 60; k++) { var a = r() * 6.283, d = 6 + r() * t[3] * 1.1; if (add(t[1] + Math.cos(a) * d, t[2] + Math.sin(a) * d)) n++; } });
    C.DARKFS.forEach(function (F) { for (var n = 0, k = 0; n < 9 && k < 60; k++) { var a = r() * 6.283, d = Math.sqrt(r()) * F[2] * .9; if (add(F[0] + Math.cos(a) * d, F[1] + Math.sin(a) * d)) n++; } });
    for (var n = 0, k = 0; n < 26 && k < 400; k++) { var a = r() * 6.283, d = 120 + r() * (C.ISLM - 140); if (add(Math.cos(a) * d, Math.sin(a) * d)) n++; }
    var T0 = C.TOWNS[0]; Z = Z.filter(function (z) { return Math.hypot(z.x - T0[1], z.z - T0[2]) > 30; });   // jamais collés au point de départ
    NID = id; }
  function spawnOne(night) { var P = C.me(); for (var tries = 0; tries < 40; tries++) { var x, z, q = Math.random();   // réapparition loin du joueur (60 à 260 m), près des lieux ou au hasard
      if (q < .5) { var t = C.TOWNS[Math.random() * C.TOWNS.length | 0]; if (t[4] === 'arena') continue; var a = Math.random() * 6.283, d = 8 + Math.random() * t[3] * 1.3; x = t[1] + Math.cos(a) * d; z = t[2] + Math.sin(a) * d; }
      else { var a2 = Math.random() * 6.283, d2 = 60 + Math.random() * 200; x = P.x + Math.cos(a2) * d2; z = P.z + Math.sin(a2) * d2; }
      var dp = Math.hypot(x - P.x, z - P.z); if (dp < 60 || !C.onLand(x, z) || C.inLake(x, z, 3) || C.hgt(x, z) > 70) continue;
      var k = pickKind(night); Z.push({ id: NID++, k: k, x: x, z: z, y: C.hgt(x, z), a: Math.random() * 6.28, hp: KIND[k].hp, st: 'idle', t: Math.random() * 3, hx: x, hz: z, step: 0, groan: 3, atk: 0 }); return; } }
  function makeModel(k) { var K = KIND[k], c = C.makeChar(Object.assign({ sk: 'zombie', zv: K.m, v: (POOL.length * 3 + 1) }, K.o || {})); c.root.visible = false; c.root.scale.setScalar(K.sc); C.scene.add(c.root); c.root.traverse(function (o) { o.frustumCulled = false; }); var e = { k: k, c: c, z: null }; POOL.push(e); return e; }
  function grab(z) { for (var i = 0; i < POOL.length; i++) { var p = POOL[i]; if (!p.z && p.k === z.k) { p.z = z; z.m = p; p.c.root.visible = true; return; } }
    if (built < 40 && POOL.filter(function (q) { return q.k === z.k; }).length < (KIND[z.k].w >= 10 ? 6 : 2)) { built++; var e = makeModel(z.k); e.z = z; z.m = e; e.c.root.visible = true; } }
  function release(z) { if (!z.m) return; z.m.c.root.visible = false; z.m.z = null; z.m = null; }
  function blockWall(z, dx, dz) {   // un mur juste devant (dans la direction de la marche) ?
    var best = null, bt = 1.3; for (var i = 0; i < C.WALLS.length; i++) { var w = C.WALLS[i]; if (!w.alive || Math.abs(w.x - z.x) > 6 || Math.abs(w.z - z.z) > 6) continue;
      var t = C.rayBox(z.x, z.y + 1, z.z, dx, 0, dz, w.x - w.hw, w.y0, w.z - w.hd, w.x + w.hw, w.y0 + w.h, w.z + w.hd); if (t < bt) { bt = t; best = w; } } return best; }
  function die(z, by) {
    z.dead = true; z.st = 'dead'; z.dt0 = 0; C.burst(z.x, z.y + 1.2, z.z, 24, ['#7aff4a', '#3a8a2a', '#5a4a3a', '#1a3a12'], 7, .3, 1.2); C.tone('sawtooth', 160, 50, .5, .06); C.noise(.3, .12, 400);
    if (Math.random() < .35) C.dropItem(z.x + .8, z.z, Math.random() < .5 ? 'ammo' : ['mini', 'heal', 'shield'][Math.random() * 3 | 0]);
    RESP.push(20 + Math.random() * 25);   // une autre créature apparaîtra ailleurs
    if (onKill) onKill(z, KIND[z.k]);
  }
  function pose(z, dt, now) {
    var c = z.m.c, k = KIND[z.k], sp = z.spd || 0, amp = Math.min(1, sp / 3), T2;
    z.step += dt * sp * 1.5;
    T2 = amp > .05 ? A.walk(z.step, amp * .85, sp > 4) : A.idle(now + z.id);
    var sw = Math.sin(now * 2 + z.id), at = z.atk > 0 ? Math.sin((1 - z.atk / 1.1) * Math.PI) : 0;
    T2.la = 1.25 + sw * .12 + at * .9; T2.ra = 1.35 - sw * .12 + at * 1.1; T2.lb = .18; T2.rb = .12; T2.le = .25 + at * .5; T2.re = .2 + at * .6; T2.lw = .2; T2.rw = .2;   // bras tendus en avant
    T2.bp = (T2.bp || 0) + .28 + at * .2; T2.hp = .25 + Math.sin(now * 1.3 + z.id) * .12; T2.hr = Math.sin(now * .9 + z.id * 2) * .3; T2.hy = Math.sin(now * .7 + z.id) * .2;   // dos voûté, tête qui ballotte
    if (KIND[z.k].m === 2) { T2.hr += Math.sin(now * 9) * .1; } if (KIND[z.k].m === 3) { T2.hr = Math.sin(now * 3 + z.id) * .55; }
    A.apply(c, A.blend(c, T2, dt, 10), true);
  }
  window.ZOMB = {
    on: false,
    init: function (THREE, ctx, kill) { T = THREE; C = ctx; A = C.ANIM; onKill = kill; gen(); this.on = true; }, kinds: function () { return KIND; },
    total: function () { return Z.length; }, left: function () { return Z.filter(function (z) { return !z.dead; }).length; },
    deadIds: function () { return Z.filter(function (z) { return z.dead; }).map(function (z) { return z.id; }); },
    reset: function (dead) { var D = {}; RESP = []; Z.forEach(function (z) { release(z); z.dead = !!D[z.id]; z.x = z.hx; z.z = z.hz; z.y = C.hgt(z.x, z.z); z.hp = KIND[z.k].hp; z.st = 'idle'; z.atk = 0; z.spd = 0; }); },
    list: function () { return Z; }, prebuild: function () { for (var k = 0; k < 4; k++) { makeModel(k); built++; } },
    update: function (dt, night) {
      if (!this.on) return; var P = C.me(), now = performance.now() / 1000;
      if (built < 8) { makeModel(built % 4); built++; return; }   // premiers modèles construits un par image (pas de gel au chargement)
      for (var ri = RESP.length - 1; ri >= 0; ri--) { RESP[ri] -= dt; if (RESP[ri] <= 0) { RESP.splice(ri, 1); spawnOne(night); } }   // réapparition à l'infini
      if (Math.random() < .002) { Z = Z.filter(function (q) { return !q.dead || q.m; }); var al = Z.filter(function (q) { return !q.dead; }).length; if (al + RESP.length < POP) RESP.push(5); }
      var sense = night ? 48 : 26, pAlive = P.alive && C.state() === 'play';
      for (var i = 0; i < Z.length; i++) { var z = Z[i], d = Math.hypot(z.x - P.x, z.z - P.z);
        if (z.dead) { if (z.m) { z.dt0 += dt; var c = z.m.c, f = Math.min(1, z.dt0 / .6); c.root.rotation.set(0, -z.a, -f * 1.45); c.root.position.y = z.y - Math.max(0, z.dt0 - 2.5) * .8; if (z.dt0 > 4) release(z); } continue; }
        if (d > 170) { if (z.m) release(z); continue; }   // endormi loin du joueur
        var k = KIND[z.k], tx = null, tz = null, spd = 0; z.t -= dt; if (z.atk > 0) z.atk -= dt;
        if (pAlive && (d < sense || (z.st === 'chase' && d < sense * 2.2))) { if (z.st !== 'chase') { z.st = 'chase'; if (d < 40) C.tone('sawtooth', 110 + z.k * 25, 70, .5, .05); } }
        else if (z.st === 'chase') { z.st = 'idle'; z.t = 2; }
        if (z.st === 'chase') { tx = P.x; tz = P.z; spd = d < 1.4 ? 0 : k.run * (night ? 1.15 : 1);
          if (d < 1.55 && Math.abs(P.y - z.y) < 1.8 && z.atk <= 0) { z.atk = 1.1; z.hitAt = .5; }
          if (z.atk > 0 && z.hitAt > 0 && 1.1 - z.atk >= z.hitAt) { z.hitAt = 0; if (d < 2 && Math.abs(P.y - z.y) < 2) { C.hurt(P, k.dmg); C.noise(.12, .2, 700); } }
          if ((z.groan -= dt) < 0 && d < 30) { z.groan = 4 + Math.random() * 6; C.tone('sawtooth', 80 + Math.random() * 50, 55, .7, .045); } }
        else { if (z.t <= 0) { z.t = 3 + Math.random() * 6; if (Math.random() < .55) { var a = Math.random() * 6.283, rr = 4 + Math.random() * 12; z.wx = z.hx + Math.cos(a) * rr; z.wz = z.hz + Math.sin(a) * rr; } else { z.wx = z.x; z.wz = z.z; } }
          tx = z.wx; tz = z.wz; spd = Math.hypot(tx - z.x, tz - z.z) > 1 ? k.walk : 0; }
        if (spd > 0) { var dx = tx - z.x, dz = tz - z.z, l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; var ta = Math.atan2(dz, dx), da = ((ta - z.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI; z.a += da * Math.min(1, dt * 6);
          var w = d < 70 ? blockWall(z, dx, dz) : null;
          if (w && z.st === 'chase') { spd = 0; if (z.atk <= 0) { z.atk = 1.1; C.hitWall(w, k.dmg * 1.4, null); C.noise(.1, .15, 500); } }   // il tape le mur
          else { z.x += dx * spd * dt; z.z += dz * spd * dt; if (d < 80) { var o = { x: z.x, z: z.z, y: z.y, vx: dx * spd, vz: dz * spd }; C.pushCircle(o, .42 * k.sc); z.x = o.x; z.z = o.z; } } }
        z.spd = spd; var gy = C.hgt(z.x, z.z); if (C.groundAt) gy = Math.max(gy, C.groundAt(z.x, z.z, z.y)); z.y += (gy - z.y) * Math.min(1, dt * 12);
        if (d < 95 && !z.m) grab(z); else if (d > 110 && z.m) release(z);
        if (z.m) { var c2 = z.m.c; c2.root.position.set(z.x, z.y, z.z); c2.root.rotation.set(0, -z.a, 0); if (z.flash > 0) z.flash -= dt; pose(z, dt, now); } }
    },
    ray: function (ox, oy, oz, dx, dy, dz, maxT, fat) { var best = null, bt = maxT, f = fat || 0;
      for (var i = 0; i < Z.length; i++) { var z = Z[i]; if (z.dead || Math.abs(z.x - ox) > maxT + 2 || Math.abs(z.z - oz) > maxT + 2) continue; var s = KIND[z.k].sc, hh = 2.05 * s, r = .45 * s + f;
        var t = C.rayBox(ox, oy, oz, dx, dy, dz, z.x - r, z.y, z.z - r, z.x + r, z.y + hh + f * .5, z.z + r); if (t < bt) { bt = t; best = { t: t, kind: 'zomb', o: z, head: oy + dy * t - z.y > hh - .55 * s }; } }
      return best; },
    hurt: function (z, d, by) { if (z.dead) return; z.hp -= d; z.st = 'chase'; z.flash = .15; if (z.hp <= 0) die(z, by); else C.noise(.06, .08, 1200); },
    melee: function (x, y, z0, fx, fz, range, dmg) { var best = null, bd = range; Z.forEach(function (z) { if (z.dead) return; var dx = z.x - x, dz = z.z - z0, d = Math.hypot(dx, dz); if (d > bd || Math.abs(z.y - y) > 2.2) return; if ((dx * fx + dz * fz) / (d || 1) < .2 && d > .8) return; bd = d; best = z; });
      if (best) { this.hurt(best, dmg, C.me()); C.burst(best.x, best.y + 1.3, best.z, 8, ['#7aff4a', '#3a8a2a'], 4, .15, .5); C.dmgNum(best.x, best.y + 1.8, best.z, dmg, false, false); } return best; },
    nearest: function (x, z) { var b = null, bd = 1e9; Z.forEach(function (q) { if (q.dead) return; var d = Math.hypot(q.x - x, q.z - z); if (d < bd) { bd = d; b = q; } }); return b ? { z: b, d: bd } : null; }
  };
})();
