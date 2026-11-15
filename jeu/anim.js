/* Wald Royal : animations des persos par POSES.
   Tous les persos ont le même squelette (skins.js > skinify) : corps, cuisse + genou, épaule + coude, tête.
   Une pose = des angles simples (en radians) :
     by  hauteur du bassin (ajoutée), bp penché en avant, br penché sur le côté, byw rotation des hanches
     lt/rt  cuisse vers l'avant, lo/ro  cuisse écartée, lk/rk  genou plié (>= 0)
     la/ra  bras vers l'avant (0 = le long du corps, 1,57 = devant, 3,1 = en l'air), lb/rb bras écarté (négatif = vers le centre),
     lw/rw  rotation du bras sur lui-même (positif = coude qui plie vers le ventre), le/re coude plié (>= 0)
     hy  tête qui tourne, hp tête qui hoche vers le bas, hr tête penchée
   ANIM.blend lisse le passage d'une pose à l'autre, ANIM.apply pose le squelette (et garde les pieds au sol). */
(function () {
  var KEYS = ['by', 'bp', 'br', 'byw', 'lt', 'lo', 'lk', 'rt', 'ro', 'rk', 'la', 'lb', 'lw', 'le', 'ra', 'rb', 'rw', 're', 'hy', 'hp', 'hr'];
  function P(o) { var p = {}; KEYS.forEach(function (k) { p[k] = 0; }); return Object.assign(p, o || {}); }
  var S = Math.sin, C = Math.cos, PI = Math.PI;
  function ease(x) { return x * x * (3 - 2 * x); }
  function pulse(b, w) { var f = b - Math.floor(b); return f < w ? S(f / w * PI) : 0; }   // petit coup en début de temps
  function tri(b) { var f = b - Math.floor(b); return f < .5 ? f * 2 : 2 - f * 2; }
  function hipL(o) { var c = Math.cos(o.lo || 0); return (.43 * C(o.lt) + .44 * C(o.lt - o.lk)) * c; }
  function hipR(o) { var c = Math.cos(o.ro || 0); return (.43 * C(o.rt) + .44 * C(o.rt - o.rk)) * c; }

  /* ---------- poses de base ---------- */
  function idle(t) { var br = S(t * 1.8); return P({ lb: .1 + br * .015, rb: .1 + br * .015, le: .14, re: .14, lw: .3, rw: .3, lo: .06, ro: .06, lk: .05, rk: .05, hp: -.02 + br * .015, bp: .02 }); }
  function walk(step, amp, run) {   // marche / course : jambes et bras opposés, genou qui se plie au retour, coudes qui plient en avant
    var s = S(step), s2 = S(step + PI);
    var o = P({ lt: s * .62 * amp, rt: s2 * .62 * amp,
      lk: (.08 + Math.max(0, S(step - 1.3)) * (run ? 1.25 : .95)) * amp, rk: (.08 + Math.max(0, S(step + 1.84)) * (run ? 1.25 : .95)) * amp,
      la: -s * .55 * amp, ra: -s2 * .55 * amp, lb: .1, rb: .1, lw: .4, rw: .4,
      le: (.25 + Math.max(0, -s) * (run ? 1.1 : .55)) * amp + .12, re: (.25 + Math.max(0, -s2) * (run ? 1.1 : .55)) * amp + .12,
      bp: (run ? .14 : .05) * amp, byw: s * .1 * amp, hy: -s * .06 * amp, by: -Math.abs(C(step)) * .03 * amp });
    return o;
  }
  function gunArms(o, recoil) {   // tient l'arme à deux mains
    o.ra = 1.42 + recoil * 2; o.rb = .08; o.rw = 0; o.re = .3; o.la = 1.25 + recoil * 1.2; o.lb = -.72; o.lw = .5; o.le = .72; return o;
  }
  function crouch(step, amp) {
    var s = S(step) * amp; return P({ lt: 1.15 + s * .3, rt: .7 - s * .3, lk: 1.95 + s * .2, rk: 1.55 - s * .2, bp: .28, la: .5, ra: .5, lb: .15, rb: .15, le: .9, re: .9, lw: .5, rw: .5, hp: -.2 });
  }
  function glide(t) { var w = S(t * 3); return P({ la: 2.92, ra: 2.92, lb: .32, rb: .32, le: .28, re: .28, lt: .2 + w * .12, rt: -.05 - w * .12, lk: .5, rk: .35 + w * .1, bp: .08, hp: .15 }); }
  function drive() { return P({ lt: 1.5, rt: 1.5, lk: 1.35, rk: 1.35, la: 1.05, ra: 1.05, lb: -.12, rb: -.12, le: .65, re: .65, lw: .2, rw: .2, hp: -.05 }); }
  function lobbyGun(t) { var o = idle(t); o.ra = 1.15; o.rb = .1; o.re = .45; o.la = 1.0; o.lb = -.45; o.lw = .5; o.le = .7; return o; }

  /* ---------- danses (le tempo est en battements, 2 par seconde) ---------- */
  var D = {};
  D.wald = { name: 'Wald Groove', bpm: 118, f: function (b) {   // rebond sur les genoux, pas chassés, poings qui pompent, « raise the roof » toutes les 8 mesures
    var bb = b % 16, roof = bb >= 12, side = S(b * PI / 2), k = ease(tri(b)), pump = pulse(b, .5);
    var o = P({ lk: .25 + k * .45, rk: .25 + (1 - k) * .45, lt: .12 + k * .3, rt: .12 + (1 - k) * .3, lo: .1 + Math.max(0, side) * .22, ro: .1 + Math.max(0, -side) * .22,
      byw: side * .35, br: side * .08, bp: .1 + pump * .06, hp: pump * .25 - .05, hy: side * .2 });
    if (roof) { var pu = pulse(b * 2, .5); o.la = o.ra = 2.6 + pu * .35; o.lb = o.rb = .55; o.le = o.re = 1.5 - pu * .9; o.lw = o.rw = -.6; }
    else { var a = S(b * PI), q = (b % 4) < 2; o.la = .55 + Math.max(0, a) * .7; o.ra = .55 + Math.max(0, -a) * .7; o.lb = .28; o.rb = .28; o.le = 1.9; o.re = 1.9; o.lw = .1; o.rw = .1; if (q) { o.la += .2; o.ra += .2; } }
    return o; } };
  D.disco = { name: 'Disco Fou', bpm: 116, f: function (b) {   // le doigt pointe en haut en diagonale puis en bas en travers, l'autre main sur la hanche
    var up = ((b % 2) < 1), f = ease(Math.min(1, (b % 1) * 3)), side = S(b * PI);
    var o = P({ lb: .55, lw: 1.5, le: 1.95, la: .05, lk: .2 + Math.abs(side) * .3, rk: .2 + Math.abs(side) * .25, lt: .12 + Math.max(0, side) * .3, rt: .12 + Math.max(0, -side) * .3, byw: side * .3, br: -side * .1, bp: .05 });
    var hi = { a: 2.65, b: .75, e: .05 }, lo = { a: .55, b: -.55, e: .1 }, A = up ? lo : hi, B = up ? hi : lo;
    o.ra = A.a + (B.a - A.a) * f; o.rb = A.b + (B.b - A.b) * f; o.re = A.e; o.rw = 0; o.hy = (up ? .35 : -.25) * f; o.hp = up ? -.3 * f : .25 * f;
    return o; } };
  D.robot = { name: 'Robot', bpm: 104, f: function (b) {   // mouvements secs par à-coups, bras en équerre
    var st = Math.floor(b * 2) % 8, sn = function (x) { return x; };
    var o = P({ lb: 1.45, rb: 1.45, le: 1.57, re: 1.57, lk: .15, rk: .15, lt: .1, rt: .1, bp: 0 });
    var seq = [[0, 0, 0], [1.57, 0, .5], [1.57, 1.57, -.5], [0, 1.57, 0], [0, 0, .5], [-1.2, 0, 0], [-1.2, -1.2, -.5], [0, 0, 0]], s = seq[st], f = ease(Math.min(1, ((b * 2) % 1) * 5));
    var pr = seq[(st + 7) % 8]; function m(i) { return pr[i] + (s[i] - pr[i]) * f; }
    o.lw = m(0); o.rw = m(1); o.hy = m(2); o.byw = -m(2) * .5; o.by = -pulse(b * 2, .2) * .03; o.lk += pulse(b * 2, .2) * .15; o.rk += pulse(b * 2, .2) * .15; return sn(o); } };
  D.poulet = { name: 'Danse du Poulet', bpm: 128, f: function (b) {   // coudes qui battent comme des ailes, genoux pliés, la tête qui picore
    var fl = Math.abs(S(b * PI * 2)), pk = pulse(b, .35), s = S(b * PI);
    var o = P({ lt: .55, rt: .55, lk: 1.0 + fl * .2, rk: 1.0 + fl * .2, lo: .3, ro: .3, bp: .35, la: .2, ra: .2, lb: .25 + fl * .9, rb: .25 + fl * .9, lw: 0, rw: 0, le: 2.6, re: 2.6, hp: pk * .5 - .2, byw: s * .25, br: s * .06 });
    if ((b % 8) >= 6) { o.lt = .4 + Math.max(0, s) * .6; o.lk = .8 + Math.max(0, s) * .9; }   // petit coup de patte
    return o; } };
  D.moulin = { name: 'Moulinette', bpm: 112, f: function (b) {   // les bras font des grands cercles en sens opposé, rebond des genoux
    var a = b * PI * .5, k = Math.abs(S(b * PI));
    return P({ la: ((a % (2 * PI)) + 2 * PI) % (2 * PI), ra: (((a + PI) % (2 * PI)) + 2 * PI) % (2 * PI), lb: .3, rb: .3, le: .1, re: .1, lk: .2 + k * .45, rk: .2 + k * .45, lt: .1 + k * .25, rt: .1 + k * .25, bp: .08, hy: S(a) * .2, byw: S(a) * .15 }); } };
  D.vague = { name: 'La Vague', bpm: 100, f: function (b) {   // vague qui traverse les bras de gauche à droite puis revient
    var ph = S(b * PI * .5), w = function (o2) { return S(b * PI * .5 + o2); };
    return P({ lb: 1.45, rb: 1.45, la: .1 + w(0) * .3, ra: .1 - w(1.5) * .3, le: .6 + w(.8) * .6, re: .6 - w(2.3) * .6, lw: 1.3, rw: 1.3,
      byw: ph * .2, br: ph * .12, hr: -ph * .2, lk: .2 + Math.abs(ph) * .3, rk: .2 + Math.abs(ph) * .3, lt: .15, rt: .15 }); } };
  /* ---------- SYNC DANCES : chorégraphies calées sur leur musique (16 temps), pensées pour danser à plusieurs en même temps ---------- */
  function hit(b, w) { return pulse(b, w || .18); }   // à-coup sec sur le temps
  D.syncrobot = { name: 'Sync Robot', bpm: 120, f: function (b) {   // robot « popping » : bras qui se bloquent en équerre, tête qui clique, le corps tourne par crans
    var bar = Math.floor(b) % 16, ph = Math.floor(b / 4) % 4, st = (b * 2) % 1, lock = ease(Math.min(1, st * 6)), k = hit(b);
    var o = P({ lk: .22 + k * .2, rk: .22 + k * .2, lt: .12 + k * .1, rt: .12 + k * .1, lo: .08, ro: .08, by: -k * .03, bp: .04 });
    var pose = [[1.57, 0, 1.57, 1.57, 0, 0], [1.57, 1.57, 1.57, 0, .35, 0], [3.0, 1.57, .2, 1.57, -.35, 0], [.2, 1.57, 3.0, 1.57, .35, 0],
      [1.57, 1.45, 1.57, 1.45, 0, .5], [1.57, 1.45, 1.57, 1.45, 0, -.5], [2.2, 0, 2.2, 0, 0, 0], [.4, 1.9, .4, 1.9, 0, 0]];
    var i0 = (Math.floor(b * 2)) % 8, i1 = (i0 + 7) % 8, A = pose[(i0 + ph * 2) % 8], B = pose[(i1 + ph * 2) % 8], m = function (i) { return B[i] + (A[i] - B[i]) * lock; };
    o.la = m(0); o.le = m(1); o.ra = m(2); o.re = m(3); o.hy = m(4); o.byw = m(5) + (ph === 3 ? Math.floor(b) % 4 * .4 - .6 : 0);
    o.lb = .25; o.rb = .25; o.lw = .2; o.rw = .2; o.hp = -k * .12; o.hr = (Math.floor(b) % 2 ? .12 : -.12) * lock;
    if (ph === 2 && (bar % 4) >= 2) { var w = S(b * PI * 2); o.la = 1.57 + w * .25; o.ra = 1.57 - w * .25; o.le = .1 + Math.max(0, w) * 1.2; o.re = .1 + Math.max(0, -w) * 1.2; o.lw = o.rw = 1.4; }   // la vague mécanique
    return o; } };
  D.syncshuffle = { name: 'Sync Shuffle', bpm: 124, f: function (b) {   // running man + T-step, bras qui pompent, demi-tour toutes les 8 mesures
    var ph = Math.floor(b / 8) % 2, s = S(b * PI), c2 = C(b * PI), k = Math.abs(s), pump = hit(b, .3);
    var o = P({ by: -.04 - pump * .03, bp: .12 });
    if (!ph) { o.lt = .15 + Math.max(0, s) * .95; o.lk = .15 + Math.max(0, s) * 1.25; o.rt = .15 + Math.max(0, -s) * .95; o.rk = .15 + Math.max(0, -s) * 1.25; o.lo = .06; o.ro = .06;   // running man
      o.la = .9 + pump * .6; o.ra = .9 + pump * .6; o.lb = .2; o.rb = .2; o.le = 1.7 - pump * .5; o.re = 1.7 - pump * .5; o.lw = .1; o.rw = .1; o.hp = pump * .2; }
    else { o.lo = .15 + Math.max(0, s) * .45; o.ro = .15 + Math.max(0, -s) * .45; o.lk = .3 + k * .3; o.rk = .3 + k * .3; o.lt = .2; o.rt = .2; o.byw = c2 * .45;   // T-step
      o.la = 1.4 + c2 * .5; o.ra = 1.4 - c2 * .5; o.lb = .9; o.rb = .9; o.le = .3; o.re = .3; o.hy = -c2 * .3; }
    return o; } };
  /* danses des créatures : débloquées en remplissant le Livre des créatures (Survie) */
  D.zombi = { name: 'Danse du Zombie', bpm: 100, f: function (b) {   // bras tendus, pas traînés, la tête qui tombe sur le côté puis se redresse
    var s = S(b * PI), k = Math.abs(s), dr = pulse(b / 2, .3);
    return P({ la: 1.45 + s * .12, ra: 1.45 - s * .12, lb: .12, rb: .12, le: .15, re: .15, lw: .2, rw: .2, lt: .1 + Math.max(0, s) * .35, rt: .1 + Math.max(0, -s) * .35, lk: .2 + k * .3, rk: .2 + k * .3, bp: .3, byw: s * .25, br: s * .1, hr: .5 * S(b * PI / 2) - dr * .4, hp: .3 + dr * .3 }); } };
  D.rampe = { name: 'La Rampante', bpm: 128, f: function (b) {   // accroupi au ras du sol, bras qui griffent le sol en rythme, puis redressement brusque
    var bb = b % 8, up = bb >= 6, s = S(b * PI * 2), g = pulse(b, .4);
    if (up) { var f = ease(Math.min(1, (bb - 6) * 2)); return P({ la: 2.8 * f, ra: 2.8 * f, lb: .6, rb: .6, le: .3, re: .3, lk: 1.2 * (1 - f), rk: 1.2 * (1 - f), lt: .8 * (1 - f), rt: .8 * (1 - f), bp: .9 * (1 - f) - .1 * f, hp: -.4 * f }); }
    return P({ lt: .85, rt: .85, lk: 1.45, rk: 1.45, lo: .35, ro: .35, bp: .95, la: 1.5 + s * .5 + g * .3, ra: 1.5 - s * .5 + g * .3, lb: .3, rb: .3, le: .4, re: .4, hp: -.6, hy: s * .3 }); } };
  D.spectre = { name: 'Valse du Spectre', bpm: 116, f: function (b) {   // flotte en tournant lentement, bras qui ondulent comme de la fumée
    var s = S(b * PI / 2), w = S(b * PI);
    return P({ by: .08 + S(b * PI / 4) * .06, byw: s * .9, la: 1.2 + w * .5, ra: 1.2 - w * .5, lb: .9 + S(b * PI + 1) * .3, rb: .9 - S(b * PI + 1) * .3, le: .5 + w * .4, re: .5 - w * .4, lw: w * .5, rw: -w * .5, lt: .2, rt: .2, lk: .5, rk: .5, hr: w * .25, hp: -.1 }); } };
  D.couronne = { name: 'Danse du Roi Violet', bpm: 118, f: function (b) {   // pose royale, bras qui « appellent » la Brume, frappe du pied, puis bras croisés
    var bb = b % 16, cross = bb >= 12, st = pulse(b, .25), s = S(b * PI);
    var o = P({ lk: .1 + st * .3, rk: .1, lt: .05 + st * .4, rt: .05, bp: -.08, hp: -.25, byw: s * .15 });
    if (cross) { o.la = o.ra = 1.2; o.lb = o.rb = -.6; o.le = o.re = 2.2; o.lw = o.rw = .4; o.hy = s * .4; }
    else { var u = ease(tri(b / 2)); o.la = 1.6 + u * 1.1; o.ra = 1.6 + (1 - u) * 1.1; o.lb = o.rb = .7; o.le = .2 + (1 - u) * .8; o.re = .2 + u * .8; o.lw = -.4; o.rw = -.4; }
    return o; } };
  var ORDER = ['wald', 'disco', 'robot', 'poulet', 'moulin', 'vague', 'syncrobot', 'syncshuffle', 'zombi', 'rampe', 'spectre', 'couronne'];
  function dance(id, t) { var d = D[id] || D.wald; return d.f(t * d.bpm / 60); }

  function blend(c, T, dt, k) {   // la pose affichée glisse vers la pose voulue
    if (!c.P) { c.P = P(T); return c.P; }
    var f = Math.min(1, dt * (k || 12)); KEYS.forEach(function (n) { var d = T[n] - c.P[n]; if (n === 'la' || n === 'ra') { if (d > PI) d -= 2 * PI; else if (d < -PI) d += 2 * PI; } c.P[n] += d * f; if (n === 'la' || n === 'ra') { if (c.P[n] > 2 * PI) c.P[n] -= 2 * PI; else if (c.P[n] < -PI) c.P[n] += 2 * PI; } });
    return c.P;
  }
  function apply(c, o, grounded) {
    var by = o.by; if (grounded) by -= (.87 - Math.max(hipL(o), hipR(o)));   // les pieds restent au sol quand les genoux plient
    c.body.position.y = by; c.body.rotation.set(o.br, o.byw, -o.bp);
    c.lL.rotation.set(o.lo, 0, o.lt); c.lR.rotation.set(-o.ro, 0, o.rt);
    if (c.kL) { c.kL.rotation.set(0, 0, -o.lk); c.kR.rotation.set(0, 0, -o.rk); }
    c.aL.rotation.set(o.lb, -o.lw, o.la); c.aR.rotation.set(-o.rb, o.rw, o.ra);
    if (c.eL) { c.eL.rotation.set(0, 0, o.le); c.eR.rotation.set(0, 0, o.re); }
    c.head.rotation.set(o.hr, o.hy, -o.hp);
  }
  window.ANIM = { P: P, idle: idle, walk: walk, gunArms: gunArms, crouch: crouch, glide: glide, drive: drive, lobbyGun: lobbyGun, dance: dance, D: D, ORDER: ORDER, blend: blend, apply: apply };
})();
