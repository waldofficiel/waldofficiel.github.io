/* Wald Royal : mode SURVIE (carte « Terres Sauvages »).
   - Pioche : on casse les arbres (bois), les rochers (pierre) et le minerai (métal + un peu de pierre). Les murs des cabanes donnent aussi des matériaux.
   - Constructions façon Fortnite sur une grille de 4 m : MUR, SOL, ESCALIER, TOIT (chapeau), en bois, pierre ou métal (10 matériaux par pièce).
   - Les arbres abattus laissent une souche et repoussent au bout de 5 min ; les rochers reviennent au bout de 4 min (quand on n'est pas à côté).
   Branché par index.html : SURVIE.init(THREE, ctx), reset(), update(dt), use(tir, dt), groundAt(x, z, y), pose(T, perso, ok), tool(), setTool(), hudLine().
   Modèles : Quaternius (CC0) dans models/survie/ (rochers, minerai) et models/nature/q_TreeStump.glb. */
(function () {
  var T, C, READY = false, CELL = 4, COST = 10;
  var RES = { bois: 0, pierre: 0, metal: 0 }, TOOL = null, PIECE = 'mur', MATK = 'bois', TIME = 0;
  var MATW = { bois: 'bois', pierre: 'brique', metal: 'metal' };   // matériau de mur (MATS d'index.html)
  var ICON = { bois: '🪵', pierre: '🧱', metal: '⛓' }, NAME = { bois: 'BOIS', pierre: 'PIERRE', metal: 'MÉTAL' };
  var PNAME = { mur: 'MUR', sol: 'SOL', esc: 'ESCALIER', toit: 'TOIT' }, PICO = { mur: '▮', sol: '▬', esc: '◢', toit: '▲' };
  var HPP = { bois: 150, pierre: 260, metal: 420 };
  var NODES = [], NIM = {}, STUMPS = null, STUMPL = [], PIECES = [], PIM = {}, GEO = {}, GHOST = null, PICK = null, el = {};
  var SW = { t: -1, hit: false }, PLACE_CD = 0, popT = 0, ZERO;
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function me() { return C.me(); }

  /* ---------------- ressources : rochers et minerai ---------------- */
  var NDEF = [
    { k: 'pierre', f: 'Resource_Rock_1', size: 2.6, col: { Stone: '#c4beb0' } },
    { k: 'pierre', f: 'Resource_Rock_2', size: 2.4, col: { Stone: '#cfc9bb' } },
    { k: 'pierre', f: 'Resource_Rock_3', size: 2.2, col: { Stone: '#bdb8ac' } },
    { k: 'metal', f: 'Resource_Gold_1', size: 2.5, col: { Stone: '#7c7f8c', Gold: '#e6f3ff' }, emis: { Gold: '#3a78c8' } },
    { k: 'metal', f: 'Resource_Gold_2', size: 2.3, col: { Stone: '#757886', Gold: '#dcecff' }, emis: { Gold: '#3470c0' } }];
  function genNodes() {
    var r = rng(4242), H = C.ISLM;
    function ok(x, z, m) { if (!C.onLand(x, z) || C.inTown(x, z, 8) || C.nearRoad(x, z, 3.5)) return false; if (C.LAKE && Math.hypot(x - C.LAKE[0], z - C.LAKE[1]) < C.LAKE[2] * 1.45 + 4) return false;
      for (var i = 0; i < C.TREES.length; i++) { var t = C.TREES[i]; if (Math.abs(t.x - x) < m && Math.abs(t.z - z) < m) return false; }
      for (i = 0; i < NODES.length; i++) if (Math.abs(NODES[i].x - x) < 6 && Math.abs(NODES[i].z - z) < 6) return false; return true; }
    var want = { pierre: 560, metal: 150 }, got = { pierre: 0, metal: 0 };
    for (var n = 0; n < 60000 && (got.pierre < want.pierre || got.metal < want.metal); n++) {
      var a = r() * 6.283, d = 30 + Math.sqrt(r()) * (H - 40), x = Math.cos(a) * d, z = Math.sin(a) * d, h = C.hgt(x, z), dk = C.darkIn(x, z);
      var k = r() < .23 ? 'metal' : 'pierre'; if (got[k] >= want[k]) k = k === 'metal' ? 'pierre' : 'metal'; if (got[k] >= want[k]) continue;
      if (k === 'metal' && !(h > 26 || dk > .15) && r() < .85) continue;   // le métal : en montagne et dans les forêts sombres
      if (k === 'pierre' && h < 10 && r() < .55) continue;                 // la pierre : plus nombreuse en hauteur
      if (h > 92 || !ok(x, z, 2.6)) continue;
      var vi = k === 'metal' ? 3 + (r() * 2 | 0) : r() * 3 | 0, s = .8 + r() * .55;
      NODES.push({ k: k, vi: vi, x: x, z: z, y: h - .15, s: s, a: r() * 6.283, max: k === 'metal' ? 7 : 5, hp: 0, dead: false, t: 0, shk: 0 }); got[k]++; }
  }
  function nodeMatrix(n, o) { var p = n.shk > 0 ? 1 + Math.sin(n.shk * 60) * .05 : 1; o.position.set(n.x, n.y, n.z); o.rotation.set(0, n.a, 0); o.scale.setScalar(n.dead ? 0 : n.s * p); o.updateMatrix(); return o.matrix; }
  function buildNodes(tpl) {
    var o = new T.Object3D(); ZERO = new T.Matrix4().makeScale(0, 0, 0);
    NDEF.forEach(function (d, vi) { var t = tpl[vi]; if (!t) return; var L = NODES.filter(function (n) { return n.vi === vi; }); if (!L.length) return;
      var im = new T.InstancedMesh(t.geo, t.mat, L.length); im.castShadow = true; im.receiveShadow = true; im.userData.dyn = true; im.frustumCulled = false;
      L.forEach(function (n, i) { n.im = im; n.ii = i; }); C.scene.add(im); NIM[vi] = im; });
    O3 = O3 || new T.Object3D();
    // minerai de métal : cristaux bleu acier lumineux plantés dans la roche (on les repère de loin)
    var MET = NODES.filter(function (n) { return n.k === 'metal'; }), cg = new T.OctahedronGeometry(.42, 0); cg.scale(.5, 1.7, .5); cg.translate(0, .5, 0);
    var cm = new T.MeshPhongMaterial({ color: '#bfe2ff', emissive: '#2a7cff', emissiveIntensity: .9, shininess: 120, specular: '#ffffff', flatShading: true });
    var CR = new T.InstancedMesh(cg, cm, MET.length * 5); CR.castShadow = true; CR.userData.dyn = true; CR.frustumCulled = false; C.scene.add(CR); NIM.cr = CR;
    MET.forEach(function (n, i) { n.cr = []; for (var k = 0; k < 5; k++) { var a = n.a + k * 1.26, rr = k ? .45 + (k % 2) * .25 : 0; n.cr.push({ i: i * 5 + k, dx: Math.cos(a) * rr, dz: Math.sin(a) * rr, h: k ? .65 + (k % 3) * .22 : 1.3, tx: k ? Math.cos(a) * .55 : 0, tz: k ? Math.sin(a) * .55 : 0 }); } });
    NODES.forEach(function (n) { n.col = { x: n.x, z: n.z, y: n.y, r: 1.0 * n.s * (NDEF[n.vi].size / 2.2), h: 1.6 * n.s }; C.PCOL.push(n.col); n.hp = n.max; });
    NODES.forEach(nodeSet);
  }
  var O3 = null;
  function nodeSet(n) { if (!n.im) return; var o = O3 || (O3 = new T.Object3D()); n.im.setMatrixAt(n.ii, nodeMatrix(n, o)); n.im.instanceMatrix.needsUpdate = true;
    if (n.cr && NIM.cr) { var sc = n.dead ? 0 : n.s * (n.shk > 0 ? 1 + Math.sin(n.shk * 60) * .08 : 1); n.cr.forEach(function (c) { o.position.set(n.x + c.dx * n.s, n.y + (c.dx || c.dz ? .5 : .8) * n.s, n.z + c.dz * n.s); o.rotation.set(c.tz, 0, -c.tx); o.scale.set(sc, sc * c.h, sc); o.updateMatrix(); NIM.cr.setMatrixAt(c.i, o.matrix); }); NIM.cr.instanceMatrix.needsUpdate = true; } }

  /* ---------------- souches des arbres abattus ---------------- */
  function buildStumps(tpl) { if (!tpl) return; STUMPS = new T.InstancedMesh(tpl.geo, tpl.mat, 400); STUMPS.count = 0; STUMPS.castShadow = true; STUMPS.userData.dyn = true; STUMPS.frustumCulled = false; C.scene.add(STUMPS); }
  function stumpsRefresh() { if (!STUMPS) return; var o = O3 || (O3 = new T.Object3D()), n = 0; STUMPL.forEach(function (t) { if (n >= 400) return; o.position.set(t.x, t.y - .05, t.z); o.rotation.set(0, t.x * 3.1, 0); o.scale.setScalar(1.25 * (t.s || 1)); o.updateMatrix(); STUMPS.setMatrixAt(n++, o.matrix); }); STUMPS.count = n; STUMPS.instanceMatrix.needsUpdate = true; }

  /* ---------------- la pioche (modèle fait main, style néon) ---------------- */
  function buildPick() {
    var g = new T.Group(), wood = new T.MeshLambertMaterial({ color: '#7a4a26' }), grip = new T.MeshLambertMaterial({ color: '#241a2e' }), steel = new T.MeshPhongMaterial({ color: '#d9e4f2', shininess: 90, specular: '#ffffff' }),
      neon = new T.MeshBasicMaterial({ color: '#ff2bd6' }), dark = new T.MeshLambertMaterial({ color: '#3a3f4c' });
    function m(geo, mt, x, y, z, rx, rz) { var o = new T.Mesh(geo, mt); o.position.set(x, y, z); if (rx) o.rotation.x = rx; if (rz) o.rotation.z = rz; o.castShadow = true; g.add(o); return o; }
    m(new T.CylinderGeometry(.032, .04, 1.05, 8), wood, 0, -1.02, 0);                         // manche
    [-.64, -.7, -.76].forEach(function (y) { m(new T.CylinderGeometry(.046, .046, .045, 8), grip, 0, y, 0); });   // poignée
    m(new T.CylinderGeometry(.05, .05, .05, 8), neon, 0, -1.3, 0);                             // bague néon
    m(new T.BoxGeometry(.13, .16, .12), dark, 0, -1.47, 0);                                    // douille
    var spike = new T.ConeGeometry(.055, .5, 6); spike.rotateZ(-Math.PI / 2); spike.translate(.25, 0, 0);
    var a = m(spike, steel, .05, -1.48, 0, 0, -.28), b = m(spike, steel, -.05, -1.48, 0, 0, Math.PI + .28); a.scale.set(1, 1, .7); b.scale.set(.85, 1, .7);   // deux pointes un peu courbées
    m(new T.BoxGeometry(.1, .05, .125), neon, 0, -1.39, 0);
    g.position.set(.02, 0, 0); g.visible = false; return g;
  }
  function attachPick(c) { if (!PICK) PICK = buildPick(); if (PICK.parent !== c.aR) { if (PICK.parent) PICK.parent.remove(PICK); c.aR.add(PICK); } }

  /* ---------------- constructions ---------------- */
  function rampGeo() {   // escalier : marches sur une dalle inclinée, 4 m de long, 4 m de haut, 4 m de large
    var s = new T.Shape(), N = 8, st = CELL / N; s.moveTo(0, 0); for (var i = 0; i < N; i++) { s.lineTo(i * st, (i + 1) * st); s.lineTo((i + 1) * st, (i + 1) * st); } s.lineTo(CELL, CELL - .45); s.lineTo(.45, 0); s.lineTo(0, 0);
    var g = new T.ExtrudeGeometry(s, { depth: CELL - .1, bevelEnabled: false }); g.translate(-CELL / 2, 0, -(CELL - .1) / 2); g.computeVertexNormals(); return g; }
  function roofGeo() { var g = new T.ConeGeometry(CELL / Math.SQRT2, 2.4, 4, 1); g.rotateY(Math.PI / 4); g.translate(0, 1.2, 0); g.computeVertexNormals(); return g; }
  function pieceIM(type, mk) { var key = type + mk; if (PIM[key]) return PIM[key]; var mat = C.WMAT[MATW[mk]] || new T.MeshLambertMaterial({ color: '#c8955a' });
    var im = new T.InstancedMesh(type === 'mur' || type === 'sol' ? C.BOX : GEO[type], mat, 300); im.count = 300; for (var i = 0; i < 300; i++) im.setMatrixAt(i, ZERO); im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; im.userData.dyn = true; im.free = []; for (i = 299; i >= 0; i--) im.free.push(i); C.scene.add(im); PIM[key] = im; return im; }
  function pieceMatrix(p, o) { o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1);
    if (p.t === 'sol') { o.position.set(p.x, p.L, p.z); o.scale.set(CELL, .3, CELL); }
    else if (p.t === 'esc') { o.position.set(p.x, p.L, p.z); o.rotation.y = -p.d * Math.PI / 2; }
    else if (p.t === 'toit') { o.position.set(p.x, p.L, p.z); }
    o.updateMatrix(); return o.matrix; }
  // où va la pièce ? (cellule de 4 m, niveau aligné sur les pièces voisines)
  function plan() {
    var P = me(), a = C.camA(), pitch = C.camP(), d = ((Math.round(a / (Math.PI / 2)) % 4) + 4) % 4, dx = [1, 0, -1, 0][d], dz = [0, 1, 0, -1][d];
    var ci = Math.floor(P.x / CELL), cj = Math.floor(P.z / CELL), b0 = null, bd = 14;
    PIECES.forEach(function (q) { var dd = Math.hypot(q.x - P.x, q.z - P.z); if (dd < bd && Math.abs(q.L - P.y) < 10) { bd = dd; b0 = q.L; } });
    var L = b0 == null ? Math.round((P.y - .05) * 20) / 20 : b0 + CELL * Math.floor((P.y + .6 - b0) / CELL), t = PIECE, p = { t: t, m: MATK, d: d };
    if (t === 'mur') { p.L = L + (pitch > .45 ? CELL : 0); var ex = d === 0 ? ci + 1 : d === 2 ? ci : null, ez = d === 1 ? cj + 1 : d === 3 ? cj : null;
      if (ex != null) { p.x = ex * CELL; p.z = cj * CELL + CELL / 2; p.hw = .14; p.hd = CELL / 2; p.key = 'm|x|' + ex + '|' + cj; } else { p.z = ez * CELL; p.x = ci * CELL + CELL / 2; p.hw = CELL / 2; p.hd = .14; p.key = 'm|z|' + ci + '|' + ez; } }
    else { var i = ci, j = cj, LL = L; if (t === 'sol') { if (pitch > .35) LL = L + CELL; else { i += dx; j += dz; } }
      else if (t === 'esc') { i += dx; j += dz; if (pitch > .55) LL = L + CELL; }
      else { if (pitch > 0) LL = L + CELL; else { i += dx; j += dz; } }
      p.L = LL; p.x = i * CELL + CELL / 2; p.z = j * CELL + CELL / 2; p.key = t[0] + '|' + i + '|' + j; }
    p.key += '|' + p.L.toFixed(1); return p; }
  function taken(key) { for (var i = 0; i < PIECES.length; i++) if (PIECES[i].key === key) return true; return false; }
  function placePiece(p) {
    var im = pieceIM(p.t, p.m); if (!im.free.length) return false; p.ii = im.free.pop(); p.im = im; p.hp = HPP[p.m];
    if (p.t === 'mur') { var below = PIECES.some(function (q) { return Math.abs(q.L - (p.L - CELL)) < .2 && Math.hypot(q.x - p.x, q.z - p.z) < 3; }), ext = below ? 0 : 1;
      p.w = { x: p.x, z: p.z, y0: p.L - ext, hw: p.hw, hd: p.hd, m: MATW[p.m], h: CELL + ext, house: null, im: im, ii: p.ii, alive: true, hp: HPP[p.m], build: p };
      C.WALLS.push(p.w); C.setWall(p.w, true); }
    else { im.setMatrixAt(p.ii, pieceMatrix(p, O3 || (O3 = new T.Object3D()))); im.instanceMatrix.needsUpdate = true; }
    PIECES.push(p); return true; }
  function removePiece(p, fx) { var i = PIECES.indexOf(p); if (i < 0) return; PIECES.splice(i, 1);
    if (p.w) { var wi = C.WALLS.indexOf(p.w); if (wi >= 0) C.WALLS.splice(wi, 1); if (p.w.alive) C.setWall(p.w, false); }
    else { p.im.setMatrixAt(p.ii, ZERO); p.im.instanceMatrix.needsUpdate = true; }
    p.im.free.push(p.ii); if (fx) { var c = C.MATS[MATW[p.m]].col; C.burst(p.x, p.L + 1.5, p.z, 16, [c, c, '#5a3a20'], 7, .5, 1.4); C.SFX.crack(); } }
  function ghostShow(p, ok) {
    if (!GHOST) { GHOST = {}; var gm = new T.MeshBasicMaterial({ color: '#3ab0ff', transparent: true, opacity: .38, depthWrite: false }); GHOST.mat = gm;
      ['mur', 'sol', 'esc', 'toit'].forEach(function (k) { var m = new T.Mesh(k === 'mur' || k === 'sol' ? C.BOX : GEO[k], gm); m.visible = false; m.renderOrder = 3; m.userData.dyn = true; C.scene.add(m); GHOST[k] = m; }); }
    ['mur', 'sol', 'esc', 'toit'].forEach(function (k) { GHOST[k].visible = !!p && p.t === k; });
    if (!p) return; var m = GHOST[p.t]; GHOST.mat.color.set(ok ? '#3ab0ff' : '#ff3a5a');
    if (p.t === 'mur') { m.position.set(p.x, p.L + CELL / 2, p.z); m.rotation.set(0, 0, 0); m.scale.set(p.hw * 2 + .02, CELL, p.hd * 2 + .02); }
    else { var o = O3 || (O3 = new T.Object3D()); pieceMatrix(p, o); m.position.copy(o.position); m.rotation.copy(o.rotation); m.scale.copy(o.scale); if (p.t === 'sol') m.scale.y = .32; } }
  function groundAt(x, z, y) { var g = -1e9, lim = y + .75;
    for (var i = 0; i < PIECES.length; i++) { var p = PIECES[i]; if (p.t === 'mur') continue; var dx = x - p.x, dz = z - p.z; if (Math.abs(dx) > CELL / 2 + .05 || Math.abs(dz) > CELL / 2 + .05) continue; var h;
      if (p.t === 'sol') h = p.L + .15;
      else if (p.t === 'esc') { var u = (p.d === 0 ? dx : p.d === 1 ? dz : p.d === 2 ? -dx : -dz) + CELL / 2; h = p.L + Math.max(0, Math.min(CELL, u)) + .08; }
      else h = p.L + 2.4 * (1 - Math.max(Math.abs(dx), Math.abs(dz)) / (CELL / 2));
      if (h <= lim && h > g) g = h; }
    return g; }

  /* ---------------- pioche : viser et taper ---------------- */
  function give(k, n, x, y, z) { RES[k] = Math.min(999, RES[k] + n); pop('+' + n + ' ' + ICON[k]); hudRes(); }
  function pop(t) { var d = document.createElement('div'); d.className = 'sPop'; d.textContent = t; d.style.left = (46 + Math.random() * 8) + '%'; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 900); }
  function strike() {
    var P = me(), a = C.camA(), fx = Math.cos(a), fz = Math.sin(a), best = null, bd = 3.3, ox = P.x, oz = P.z, oy = P.y + 1.2;
    function cand(x, z, r, obj, kind) { var dx = x - ox, dz = z - oz, d = Math.hypot(dx, dz) - r; if (d > 2.2) return; var dot = (dx * fx + dz * fz) / (Math.hypot(dx, dz) || 1); if (dot < .45 && d > .3) return; if (d < bd) { bd = d; best = [kind, obj]; } }
    NODES.forEach(function (n) { if (!n.dead && Math.abs(n.x - ox) < 6 && Math.abs(n.z - oz) < 6) cand(n.x, n.z, n.col.r, n, 'node'); });
    C.TREES.forEach(function (t) { if (!t.rock && !t.cut && Math.abs(t.x - ox) < 6 && Math.abs(t.z - oz) < 6 && P.y < t.y + 6) cand(t.x, t.z, (t.r || .5) * .8, t, 'tree'); });
    var pitch = C.camP(), dy = Math.sin(Math.max(-.6, Math.min(.6, pitch))), dl = Math.cos(Math.max(-.6, Math.min(.6, pitch)));
    C.WALLS.forEach(function (w) { if (!w.alive || Math.abs(w.x - ox) > 7 || Math.abs(w.z - oz) > 7) return; var y0 = w.y0 + (w.lintel ? 2.6 : 0);
      var t = C.rayBox(ox, oy, oz, fx * dl, dy, fz * dl, w.x - w.hw - .05, y0, w.z - w.hd - .05, w.x + w.hw + .05, w.y0 + w.h, w.z + w.hd + .05); if (t < 2.8 && t - .35 < bd) { bd = t - .35; best = ['wall', w]; } });
    PIECES.forEach(function (p) { if (p.t === 'mur' || Math.abs(p.x - ox) > 7 || Math.abs(p.z - oz) > 7) return; var top = p.t === 'sol' ? p.L + .2 : p.L + (p.t === 'esc' ? CELL : 2.4), bot = p.t === 'sol' ? p.L - .2 : p.L;
      var t = C.rayBox(ox, oy, oz, fx * dl, dy, fz * dl, p.x - 2, bot, p.z - 2, p.x + 2, top, p.z + 2); if (t < 2.8 && t - .35 < bd) { bd = t - .35; best = ['piece', p]; } });
    if (!best) { C.tone('triangle', 300, 200, .08, .04); return; }
    var o = best[1], hx = P.x + fx * 1.6, hz = P.z + fz * 1.6;
    if (best[0] === 'tree') { var big = o.dark || o.s > 1.2, gain = big ? 9 : 7; o.hp = (o.hp == null ? (big ? 8 : 6) : o.hp) - 1; o.shk = .16; give('bois', gain);
      C.burst(o.x - fx * .6, P.y + 1.2, o.z - fz * .6, 8, ['#8a5a2e', '#c8955a', '#5a8a3a'], 4, .14, .6); C.tone('square', 190, 120, .09, .07); C.noise(.06, .12, 900);
      if (o.hp <= 0) fell(o); }
    else if (best[0] === 'node') { o.hp--; o.shk = .2; nodeSet(o); if (o.k === 'metal') { give('metal', 6); if (Math.random() < .5) give('pierre', 2); } else give('pierre', 8);
      C.burst(o.x - fx * .5, o.y + 1, o.z - fz * .5, 9, o.k === 'metal' ? ['#cfe3ff', '#7a7f8a', '#ffffff'] : ['#9a958a', '#c8c2b4', '#6a665e'], 5, .13, .5); C.tone('square', 900, 600, .05, .06); C.noise(.07, .14, 3000);
      if (o.hp <= 0) { o.dead = true; o.t = 0; nodeSet(o); var ci = C.PCOL.indexOf(o.col); if (ci >= 0) C.PCOL.splice(ci, 1); C.SFX.crack(); C.burst(o.x, o.y + 1, o.z, 22, ['#9a958a', '#5a5650', '#cfe3ff'], 7, .3, 1.1); } }
    else if (best[0] === 'wall') { var w = o, mk = /^(brique|beton|facade|riche)$/.test(w.m) ? 'pierre' : w.m === 'metal' ? 'metal' : w.m === 'verre' ? null : 'bois';
      if (w.build) { hitPiece(w.build, 50); return; }
      C.hitWall(w, 40, P); if (mk) give(mk, 4); C.tone('square', 260, 160, .07, .06); C.burst(hx, P.y + 1.3, hz, 6, [C.MATS[w.m].col, '#5a3a20'], 4, .12, .5); }
    else if (best[0] === 'piece') hitPiece(o, 50);
  }
  function hitPiece(p, dmg) { p.hp -= dmg; C.tone('square', 240, 150, .07, .06); if (p.w) { p.w.hp = p.hp; } if (p.hp <= 0) removePiece(p, true); else C.burst(p.x, p.L + 1.2, p.z, 5, [C.MATS[MATW[p.m]].col], 3, .12, .4); }
  function fell(t) {   // l'arbre tombe : il disparaît, une souche reste, il repoussera
    t.cut = true; t.cutT = 0; t.r0 = t.r; t.h0 = t.h; t.r = 0; t.h = -99; if (window.TREES3D && TREES3D.cut) TREES3D.cut(t, false);
    STUMPL.push(t); stumpsRefresh(); C.SFX.crack(); C.noise(.5, .25, 500); C.burst(t.x, t.y + 3, t.z, 30, ['#3a6a2a', '#5a8a3a', '#8a5a2e', '#2a4a1e'], 8, .35, 1.6, .5); give('bois', 10); }

  /* ---------------- interface ---------------- */
  function css() { var s = document.createElement('style'); s.textContent = [
    'body.surv #tl>.chip{display:none}body.surv #pill{display:none}',
    '.sres{display:flex;gap:5px}.sres .chip b{font:900 13px var(--body);color:#fff}.sres .chip.flash{border-color:#ffd23d;box-shadow:0 0 10px #ffd23d}',
    '#sTools{position:fixed;z-index:6;right:max(14px,env(safe-area-inset-right,0px));top:calc(124px + env(safe-area-inset-top,0px));display:flex;flex-direction:column;gap:8px}',
    '#sTools button,#sBuild button{pointer-events:auto;cursor:pointer;font:900 20px/1 var(--body);color:#fff;background:rgba(11,4,24,.7);border:2px solid rgba(255,255,255,.3);border-radius:14px;width:52px;height:52px}',
    '#sTools button.on{border-color:#ffd23d;background:rgba(255,210,61,.25);box-shadow:0 0 12px rgba(255,210,61,.6)}',
    '#sBuild{position:fixed;z-index:6;left:50%;transform:translateX(-50%);bottom:calc(74px + env(safe-area-inset-bottom,0px));display:flex;gap:6px;align-items:flex-end}',
    'body.touch #sBuild{bottom:calc(18px + env(safe-area-inset-bottom,0px))}',
    '#sBuild button{width:62px;height:58px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}#sBuild button small{font:900 9px var(--body);letter-spacing:.04em}',
    '#sBuild button.on{border-color:#3ab0ff;background:rgba(58,176,255,.3);box-shadow:0 0 12px #3ab0ff;transform:translateY(-4px)}#sBuild .mat{border-color:#ffd23d;margin-left:6px}',
    '#sBuild .mat i{font-style:normal;font:900 10px var(--body);color:#ffd23d}',
    '.sPop{position:fixed;z-index:9;top:44%;font:900 18px var(--display,var(--body));color:#fff;text-shadow:0 2px 6px #000,0 0 10px rgba(255,210,61,.8);pointer-events:none;animation:sPop .9s ease-out forwards}',
    '@keyframes sPop{0%{transform:translate(-50%,0) scale(.7);opacity:0}15%{opacity:1;transform:translate(-50%,-8px) scale(1.1)}100%{transform:translate(-50%,-46px) scale(1);opacity:0}}',
    'body:not(.surv) #sTools,body:not(.surv) #sBuild{display:none}body.won #sTools,body.won #sBuild{display:none!important}'].join('\n'); document.head.appendChild(s); }
  function ui() {
    css(); var tl = document.getElementById('tl'); el.res = document.createElement('div'); el.res.className = 'sres';
    ['bois', 'pierre', 'metal'].forEach(function (k) { var c = document.createElement('span'); c.className = 'chip'; c.innerHTML = '<span>' + ICON[k] + '</span><b>0</b>'; c.title = NAME[k]; el.res.appendChild(c); el[k] = c; });
    if (tl) tl.appendChild(el.res);
    el.tools = document.createElement('div'); el.tools.id = 'sTools'; el.tools.className = 'hud'; el.tools.hidden = true;
    el.tools.innerHTML = '<button type="button" data-t="pioche" title="Pioche (X)">⛏</button><button type="button" data-t="build" title="Construire (V)">🔨</button>'; document.body.appendChild(el.tools);
    el.tools.querySelectorAll('button').forEach(function (b) { press(b, function () { setTool(TOOL === b.dataset.t ? null : b.dataset.t); }); });
    el.build = document.createElement('div'); el.build.id = 'sBuild'; el.build.className = 'hud'; el.build.hidden = true;
    el.build.innerHTML = ['mur', 'sol', 'esc', 'toit'].map(function (k, i) { return '<button type="button" data-p="' + k + '">' + PICO[k] + '<small>' + PNAME[k] + (C.isTouch ? '' : ' F' + (i + 1)) + '</small></button>'; }).join('') + '<button type="button" class="mat" data-m="1"><span id="sMatI">🪵</span><i id="sMatN">BOIS</i></button>';
    document.body.appendChild(el.build);
    el.build.querySelectorAll('[data-p]').forEach(function (b) { press(b, function () { PIECE = b.dataset.p; hudBuild(); }); });
    press(el.build.querySelector('.mat'), function () { nextMat(); });
    setInterval(function () { var on = /^(play|pause)$/.test(C.state()) && me() && me().alive; if (el.tools.hidden === on) el.tools.hidden = !on; if (!on && !el.build.hidden) el.build.hidden = true; else if (on && TOOL === 'build' && el.build.hidden) el.build.hidden = false; }, 250);
    addEventListener('keydown', function (e) { if (C.state() !== 'play') return;
      if (e.code === 'KeyX') setTool(TOOL === 'pioche' ? null : 'pioche');
      else if (e.code === 'KeyV') setTool(TOOL === 'build' ? null : 'build');
      else if (/^F[1-4]$/.test(e.code)) { e.preventDefault(); PIECE = ['mur', 'sol', 'esc', 'toit'][+e.code[1] - 1]; if (TOOL !== 'build') setTool('build'); hudBuild(); }
      else if (e.code === 'KeyG' && TOOL === 'build') nextMat(); });
  }
  function press(b, fn) { b.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); fn(); }); }
  function nextMat() { var L = ['bois', 'pierre', 'metal']; MATK = L[(L.indexOf(MATK) + 1) % 3]; hudBuild(); }
  function hudRes() { ['bois', 'pierre', 'metal'].forEach(function (k) { var b = el[k] && el[k].querySelector('b'); if (b && b.textContent !== String(RES[k])) { b.textContent = RES[k]; el[k].classList.remove('flash'); void el[k].offsetWidth; el[k].classList.add('flash'); setTimeout(function () { el[k].classList.remove('flash'); }, 250); } }); }
  function hudBuild() { if (!el.build) return; el.build.querySelectorAll('[data-p]').forEach(function (b) { b.classList.toggle('on', b.dataset.p === PIECE); });
    document.getElementById('sMatI').textContent = ICON[MATK]; document.getElementById('sMatN').textContent = NAME[MATK] + ' ' + RES[MATK];
    el.tools.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.t === TOOL); }); el.build.hidden = TOOL !== 'build'; }
  function setTool(t) { TOOL = t; SW.t = -1; if (PICK) PICK.visible = t === 'pioche'; if (t !== 'build') ghostShow(null); hudBuild(); if (t === 'pioche') C.tone('triangle', 520, 780, .1, .06); }

  /* ---------------- API ---------------- */
  window.SURVIE = {
    init: function (THREE, ctx) { T = THREE; C = ctx; ZERO = new T.Matrix4().makeScale(0, 0, 0); GEO.esc = rampGeo(); GEO.toit = roofGeo();
      genNodes(); ui();
      var L = window.LOOT3D, GL = T.GLTFLoader ? new T.GLTFLoader() : null, left = NDEF.length + 1, tpl = [], stp = null;
      function done() { if (--left > 0) return; try { buildNodes(tpl); buildStumps(stp); READY = true; } catch (e) { console.error('SURVIE', e); } }
      if (!GL || !L || !L.bake) { left = 1; done(); return; }
      NDEF.forEach(function (d, i) { GL.load('models/survie/' + d.f + '.glb', function (g) { try { tpl[i] = L.bake(T, g.scene, d); } catch (e) { console.error(e); } done(); }, null, done); });
      GL.load('models/nature/q_TreeStump.glb', function (g) { try { stp = L.bake(T, g.scene, { size: 1.3, col: {} }); } catch (e) { console.error(e); } done(); }, null, done); },
    reset: function () { RES = { bois: 0, pierre: 0, metal: 0 }; TIME = 0; PIECES.slice().forEach(function (p) { removePiece(p, false); }); setTool('pioche'); hudRes();
      if (el.tools) el.tools.hidden = false;
      NODES.forEach(function (n) { if (n.dead) { n.dead = false; if (C.PCOL.indexOf(n.col) < 0) C.PCOL.push(n.col); } n.hp = n.max; n.shk = 0; nodeSet(n); });
      STUMPL.forEach(function (t) { regrow(t); }); STUMPL = []; stumpsRefresh(); C.TREES.forEach(function (t) { t.hp = null; }); },
    update: function (dt) { TIME += dt; var P = me(); if (P && P.model && P === me()) attachPick(P.model);
      if (PICK) PICK.visible = TOOL === 'pioche' && P.alive && !(P.danceT > 0);
      // arbres qui tremblent, rochers qui reviennent, arbres qui repoussent
      C.TREES.forEach(function (t) { if (t.shk > 0) { t.shk = Math.max(0, t.shk - dt); if (window.TREES3D && TREES3D.shake) TREES3D.shake(t, t.shk > 0 ? Math.sin(t.shk * 70) * t.shk * .5 : 0); } });
      NODES.forEach(function (n) { if (n.shk > 0) { n.shk = Math.max(0, n.shk - dt); nodeSet(n); } if (n.dead) { n.t += dt; if (n.t > 240 && Math.hypot(n.x - P.x, n.z - P.z) > 40) { n.dead = false; n.hp = n.max; C.PCOL.push(n.col); nodeSet(n); } } });
      for (var i = STUMPL.length - 1; i >= 0; i--) { var t = STUMPL[i]; t.cutT += dt; if (t.cutT > 300 && Math.hypot(t.x - P.x, t.z - P.z) > 50) { regrow(t); STUMPL.splice(i, 1); stumpsRefresh(); } }
      PIECES.slice().forEach(function (p) { if (p.w && !p.w.alive) removePiece(p, false); });
      if (PLACE_CD > 0) PLACE_CD -= dt;
      if (TOOL === 'build' && P.alive && P.mode === 'ground' && C.state() === 'play') { var p = plan(), ok = !taken(p.key) && RES[MATK] >= COST; ghostShow(taken(p.key) ? null : p, ok); } else ghostShow(null);
      if (SW.t >= 0) { SW.t += dt; if (!SW.hit && SW.t >= .27) { SW.hit = true; strike(); } if (SW.t >= .5) SW.t = -1; } },
    use: function (held, dt) {
      if (TOOL === 'pioche') { if (held && SW.t < 0) { SW.t = 0; SW.hit = false; C.noise(.12, .05, 1800); } }
      else if (TOOL === 'build' && held && PLACE_CD <= 0) { PLACE_CD = .2; var p = plan(); if (taken(p.key)) return;
        if (RES[MATK] < COST) { C.toast('PAS ASSEZ DE ' + NAME[MATK] + ' (' + COST + ')'); PLACE_CD = .8; return; }
        if (placePiece(p)) { RES[MATK] -= COST; hudRes(); hudBuild(); C.tone('triangle', 420, 640, .09, .07); C.noise(.08, .1, 1200); } } },
    groundAt: groundAt,
    pose: function (o, c, ok) {   // bras qui tiennent la pioche / le plan de construction
      if (!TOOL || !ok) return; var th;
      if (TOOL === 'pioche') { var t = SW.t; th = t < 0 ? 1.05 : t < .2 ? 1.05 + (2.95 - 1.05) * (t / .2) : t < .3 ? 2.95 - (2.95 - .7) * ((t - .2) / .1) : .7 + (1.05 - .7) * ((t - .3) / .2);
        o.ra = th; o.rb = .06; o.rw = 0; o.re = .12; o.la = th - .12; o.lb = -.5; o.lw = .45; o.le = .35; o.bp = (o.bp || 0) + (t >= .2 && t < .36 ? .18 : t >= 0 && t < .2 ? -.06 : 0); }
      else { o.ra = .95; o.rb = .1; o.re = .5; o.rw = .2; o.la = .95; o.lb = -.25; o.le = .5; o.lw = .4; } },
    blendK: function () { return TOOL === 'pioche' ? 30 : 12; },
    tool: function () { return TOOL; }, setTool: setTool,
    toolName: function () { return TOOL === 'pioche' ? 'Pioche ⛏ · arbres = bois, rochers = pierre, minerai bleu = métal' : 'Construire 🔨 · ' + PNAME[PIECE] + ' en ' + NAME[MATK].toLowerCase() + ' (' + COST + ')'; },
    timeStr: function () { var s = Math.floor(TIME); return (s >= 60 ? Math.floor(s / 60) + ' min ' : '') + (s % 60) + ' s'; },
    hudLine: function () { var s = Math.floor(TIME); return '🌲 TERRES SAUVAGES · ' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); },
    res: function () { return RES; }, _sw: function (t) { SW.t = t; SW.hit = true; }, _strike: function () { strike(); }, _build: function (t, mk) { PIECE = t; MATK = mk || MATK; PLACE_CD = 0; var tl = TOOL; TOOL = 'build'; this.use(true, 0); TOOL = tl; }, give: function (k, n) { RES[k] += n; hudRes(); hudBuild(); }, pieces: function () { return PIECES; }, nodes: function () { return NODES; }, ready: function () { return READY; }
  };
  function regrow(t) { t.cut = false; t.r = t.r0 || t.r || .5; t.h = t.h0 || t.h || 6; t.hp = null; if (window.TREES3D && TREES3D.cut) TREES3D.cut(t, true); }
})();
