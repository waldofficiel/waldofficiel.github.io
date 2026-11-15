/* Wald Royal : mode SURVIE (carte « Terres Sauvages »).
   - Pioche : on casse les arbres (bois), les rochers (pierre) et le minerai (métal + un peu de pierre). Les murs des cabanes donnent aussi des matériaux.
   - Constructions façon Fortnite sur une grille de 4 m : MUR, SOL, ESCALIER, TOIT (chapeau), en bois, pierre ou métal (10 matériaux par pièce).
   - Les arbres abattus laissent une souche et repoussent au bout de 5 min ; les rochers reviennent au bout de 4 min (quand on n'est pas à côté).
   Branché par index.html : SURVIE.init(THREE, ctx), reset(), update(dt), use(tir, dt), groundAt(x, z, y), pose(T, perso, ok), tool(), setTool(), hudLine().
   Modèles : Quaternius (CC0) dans models/survie/ (rochers, minerai) et models/nature/q_TreeStump.glb. */
(function () {
  var T, C, READY = false, CELL = 5, LH = 3.75, COST = 10;   // pièces en 4/3 comme dans Fortnite : 5 m de large, 3,75 m de haut
  var RES = { bois: 0, pierre: 0, metal: 0 }, TOOL = null, PIECE = 'mur', MATK = 'bois', TIME = 0;
  var MATW = { bois: 'bois', pierre: 'brique', metal: 'metal' };   // matériau de mur (MATS d'index.html)
  var ICON = { bois: '🪵', pierre: '🧱', metal: '⛓' }, NAME = { bois: 'BOIS', pierre: 'PIERRE', metal: 'MÉTAL' };
  var PNAME = { mur: 'MUR', sol: 'SOL', esc: 'ESCALIER', toit: 'TOIT', lit: 'LIT' };
  // icônes dessinées (SVG) : pioche, construire (plan + petit mur), pièces
  var SV = function (b) { return '<svg viewBox="0 0 48 48" width="30" height="30" aria-hidden="true">' + b + '</svg>'; };
  var IC = {
    pioche: SV('<path d="M14 42 L33 15" stroke="#3a2416" stroke-width="7" stroke-linecap="round"/><path d="M14 42 L33 15" stroke="#b07440" stroke-width="4.5" stroke-linecap="round"/><path d="M12 39l5 2-2 3z" fill="#2a1c34"/>' +
      '<path d="M5 19 Q23 1 44 12 Q42 15 40 17 Q24 8 9 22 Z" fill="#e6eef8" stroke="#55607a" stroke-width="2" stroke-linejoin="round"/><circle cx="31" cy="16" r="3.2" fill="#ff2bd6"/>'),
    build: SV('<g transform="rotate(-8 20 18)"><rect x="4" y="5" width="30" height="24" rx="2" fill="#2f7be0" stroke="#bfe0ff" stroke-width="1.6"/><path d="M4 13h30M4 21h30M14 5v24M24 5v24" stroke="#bfe0ff" stroke-width=".9" opacity=".7"/><path d="M8 25 L12 10 L22 10 L28 22" stroke="#fff" stroke-width="1.6" fill="none"/></g>' +
      '<g><rect x="22" y="26" width="23" height="18" rx="1.5" fill="#c9653a" stroke="#4a2414" stroke-width="1.6"/><path d="M22 32h23M22 38h23M30 26v6M39 26v6M26 32v6M35 32v6M30 38v6M39 38v6" stroke="#4a2414" stroke-width="1.3"/></g>'),
    mur: SV('<rect x="8" y="6" width="32" height="36" rx="2" fill="#c98a4a" stroke="#4a2a14" stroke-width="2"/><path d="M8 18h32M8 30h32M24 6v12M16 18v12M32 18v12M24 30v12" stroke="#4a2a14" stroke-width="1.6"/>'),
    sol: SV('<path d="M4 30 L18 20 L44 20 L30 30 Z" fill="#c98a4a" stroke="#4a2a14" stroke-width="2" stroke-linejoin="round"/><path d="M4 30v5h26v-5M30 35l14-10v-5" fill="#8a5a2e" stroke="#4a2a14" stroke-width="1.6" stroke-linejoin="round"/>'),
    esc: SV('<path d="M6 42h36V8h-8v8h-8v9h-8v9H6z" fill="#c98a4a" stroke="#4a2a14" stroke-width="2" stroke-linejoin="round"/>'),
    toit: SV('<path d="M24 6 L44 34 L24 42 L4 34 Z" fill="#c98a4a" stroke="#4a2a14" stroke-width="2" stroke-linejoin="round"/><path d="M24 6v36" stroke="#4a2a14" stroke-width="1.6"/><path d="M24 6 L44 34 L24 42 Z" fill="#000" opacity=".22"/>'),
    lit: SV('<rect x="5" y="22" width="38" height="11" rx="3" fill="#e8e2f0" stroke="#3a2a4a" stroke-width="2"/><rect x="5" y="24" width="24" height="9" rx="2" fill="#c43a6a"/><rect x="31" y="17" width="12" height="9" rx="3" fill="#fff" stroke="#3a2a4a" stroke-width="1.6"/><path d="M5 14v28M43 18v24" stroke="#5a3a20" stroke-width="3.5" stroke-linecap="round"/>') };
  var HPP = { bois: 150, pierre: 260, metal: 420 };
  var NODES = [], NIM = {}, STUMPS = null, STUMPL = [], PIECES = [], PIM = {}, GEO = {}, GHOST = null, PICK = null, el = {};
  var SW = { t: -1, hit: false }, PLACE_CD = 0, popT = 0, ZERO, TICK = 0, saveT = 0, BED = null, BEDM = null, BEDTPL = null, RUBBLE = null, LOADED = null;
  function PLIST() { return ['mur', 'sol', 'esc', 'toit']; }
  function cost(t) { return t === 'lit' ? 30 : COST; }
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
      if (C.treeNear(x, z, m)) return false; var key = Math.floor(x / 12) + ',' + Math.floor(z / 12); for (var a2 = -1; a2 <= 1; a2++) for (var b2 = -1; b2 <= 1; b2++) { var L2 = NG[(Math.floor(x / 12) + a2) + ',' + (Math.floor(z / 12) + b2)]; if (L2 && L2.some(function (q) { return Math.abs(q.x - x) < 6 && Math.abs(q.z - z) < 6; })) return false; } return true; }
    var NG = {}, want = { pierre: 1500, metal: 420 }, got = { pierre: 0, metal: 0 };
    for (var n = 0; n < 220000 && (got.pierre < want.pierre || got.metal < want.metal); n++) {
      var a = r() * 6.283, d = 30 + Math.sqrt(r()) * (H - 40), x = Math.cos(a) * d, z = Math.sin(a) * d, h = C.hgt(x, z), dk = C.darkIn(x, z);
      var k = r() < .23 ? 'metal' : 'pierre'; if (got[k] >= want[k]) k = k === 'metal' ? 'pierre' : 'metal'; if (got[k] >= want[k]) continue;
      if (k === 'metal' && !(h > 26 || dk > .15 || (C.aridK && C.aridK(x, z) > .5)) && r() < .85) continue;   // le métal : en montagne et dans les forêts sombres
      if (k === 'pierre' && h < 10 && r() < .55) continue;                 // la pierre : plus nombreuse en hauteur
      if (h > 92 || !ok(x, z, 2.6)) continue;
      var vi = k === 'metal' ? 3 + (r() * 2 | 0) : r() * 3 | 0, s = .8 + r() * .55;
      var nd = { k: k, vi: vi, x: x, z: z, y: h - .15, s: s, a: r() * 6.283, max: k === 'metal' ? 7 : 5, hp: 0, dead: false, t: 0, shk: 0 }; NODES.push(nd); var gk = Math.floor(x / 12) + ',' + Math.floor(z / 12); (NG[gk] = NG[gk] || []).push(nd); got[k]++; }
  }
  function nodeMatrix(n, o) { var p = n.shk > 0 ? 1 + Math.sin(n.shk * 60) * .05 : 1; o.position.set(n.x, n.y, n.z); o.rotation.set(0, n.a, 0); o.scale.setScalar(n.dead ? 0 : n.s * p); o.updateMatrix(); return o.matrix; }
  function buildNodes(tpl) {
    var o = new T.Object3D(); ZERO = new T.Matrix4().makeScale(0, 0, 0);
    NDEF.forEach(function (d, vi) { var t = tpl[vi]; if (!t) return; var L = NODES.filter(function (n) { return n.vi === vi; }); if (!L.length) return;
      var im = new T.InstancedMesh(t.geo, t.mat, L.length); im.castShadow = true; im.receiveShadow = true; im.userData.dyn = true; im.frustumCulled = false;
      L.forEach(function (n, i) { n.im = im; n.ii = -1; }); C.scene.add(im); NIM[vi] = im; NIM['L' + vi] = L; });
    O3 = O3 || new T.Object3D();
    // minerai de métal : cristaux bleu acier lumineux plantés dans la roche (on les repère de loin)
    var MET = NODES.filter(function (n) { return n.k === 'metal'; }), cg = new T.OctahedronGeometry(.42, 0); cg.scale(.5, 1.7, .5); cg.translate(0, .5, 0);
    var cm = new T.MeshPhongMaterial({ color: '#bfe2ff', emissive: '#2a7cff', emissiveIntensity: .9, shininess: 120, specular: '#ffffff', flatShading: true });
    var CR = new T.InstancedMesh(cg, cm, MET.length * 5); CR.castShadow = true; CR.userData.dyn = true; CR.frustumCulled = false; C.scene.add(CR); NIM.cr = CR;
    MET.forEach(function (n, i) { n.cr = []; for (var k = 0; k < 5; k++) { var a = n.a + k * 1.26, rr = k ? .45 + (k % 2) * .25 : 0; n.cr.push({ i: k, dx: Math.cos(a) * rr, dz: Math.sin(a) * rr, h: k ? .65 + (k % 3) * .22 : 1.3, tx: k ? Math.cos(a) * .55 : 0, tz: k ? Math.sin(a) * .55 : 0 }); } });
    NODES.forEach(function (n) { n.col = { x: n.x, z: n.z, y: n.y, r: 1.0 * n.s * (NDEF[n.vi].size / 2.2), h: 1.6 * n.s }; C.PCOL.push(n.col); n.hp = n.max; });
    NIM.MET = MET; nodePack(C.TOWNS[0][1], C.TOWNS[0][2]);
  }
  // seuls les rochers / minerais à moins de 300 m sont dessinés (la carte en a ~2 000) : on les range dans les instances toutes les 1,5 s
  var PACKP = { x: 1e9, z: 1e9 };
  function nodePack(px, pz) { PACKP.x = px; PACKP.z = pz; var R2 = 300 * 300;
    NDEF.forEach(function (d, vi) { var im = NIM[vi], L = NIM['L' + vi]; if (!im) return; var k = 0; L.forEach(function (n) { var dx = n.x - px, dz = n.z - pz; n.ii = dx * dx + dz * dz < R2 ? k++ : -1; }); im.count = k; });
    var cb = 0; (NIM.MET || []).forEach(function (n) { n.cri = n.ii >= 0 ? (cb += 5) - 5 : -1; }); if (NIM.cr) NIM.cr.count = cb;
    NODES.forEach(nodeSet); }
  var O3 = null;
  function nodeSet(n) { if (!n.im || n.ii < 0) return; var o = O3 || (O3 = new T.Object3D()); n.im.setMatrixAt(n.ii, nodeMatrix(n, o)); n.im.instanceMatrix.needsUpdate = true;
    if (n.cr && NIM.cr) { var sc = n.dead ? 0 : n.s * (n.shk > 0 ? 1 + Math.sin(n.shk * 60) * .08 : 1); n.cr.forEach(function (c) { o.position.set(n.x + c.dx * n.s, n.y + (c.dx || c.dz ? .5 : .8) * n.s, n.z + c.dz * n.s); o.rotation.set(c.tz, 0, -c.tx); o.scale.set(sc, sc * c.h, sc); o.updateMatrix(); NIM.cr.setMatrixAt(n.cri + c.i, o.matrix); }); NIM.cr.instanceMatrix.needsUpdate = true; } }

  /* ---------------- souches des arbres abattus ---------------- */
  function buildStumps(tpl) { if (!tpl) return; STUMPS = new T.InstancedMesh(tpl.geo, tpl.mat, 400); STUMPS.count = 0; STUMPS.castShadow = true; STUMPS.userData.dyn = true; STUMPS.frustumCulled = false; C.scene.add(STUMPS); }
  function stumpsRefresh() { if (!STUMPS) return; var o = O3 || (O3 = new T.Object3D()), n = 0; STUMPL.forEach(function (t) { if (n >= 400) return; o.position.set(t.x, t.y - .05, t.z); o.rotation.set(0, t.x * 3.1, 0); o.scale.setScalar(1.25 * (t.s || 1)); o.updateMatrix(); STUMPS.setMatrixAt(n++, o.matrix); }); STUMPS.count = n; STUMPS.instanceMatrix.needsUpdate = true; }

  /* ---------------- la pioche (modèle fait main, style néon) ---------------- */
  function buildPick() {   // vraie pioche : manche serré dans le poing, perpendiculaire au bras (axe +x de l'os du bras), tête en croissant au bout
    var g = new T.Group(), wood = new T.MeshPhongMaterial({ color: '#8a5530', shininess: 20 }), grip = new T.MeshLambertMaterial({ color: '#2a1c34' }), steel = new T.MeshPhongMaterial({ color: '#dfe8f4', shininess: 110, specular: '#ffffff' }),
      neon = new T.MeshBasicMaterial({ color: '#ff2bd6' }), dark = new T.MeshPhongMaterial({ color: '#3a3f4c', shininess: 60 });
    function m(geo, mt, x, y, z) { var o = new T.Mesh(geo, mt); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; }
    var hd = new T.CylinderGeometry(.03, .036, 1.0, 10); hd.rotateZ(-Math.PI / 2); m(hd, wood, .36, 0, 0);            // manche : de -0,14 (sous le poing) à +0,86
    [-.06, 0, .06].forEach(function (x) { var w = new T.CylinderGeometry(.041, .041, .04, 10); w.rotateZ(-Math.PI / 2); m(w, grip, x, 0, 0); });   // poignée sous la main
    var bg = new T.CylinderGeometry(.044, .044, .04, 10); bg.rotateZ(-Math.PI / 2); m(bg, neon, .62, 0, 0);            // bague néon
    m(new T.BoxGeometry(.12, .15, .11), dark, .84, 0, 0);                                                                // douille
    // tête : arc d'acier (croissant) perpendiculaire au manche, deux pointes recourbées vers le manche
    var arc = new T.Shape(), R1 = .62, R2 = .54, A = 1.05; arc.absarc(0, 0, R1, Math.PI / 2 - A, Math.PI / 2 + A, false); arc.absarc(0, 0, R2, Math.PI / 2 + A * .97, Math.PI / 2 - A * .97, true);
    var hg = new T.ExtrudeGeometry(arc, { depth: .07, bevelEnabled: true, bevelThickness: .015, bevelSize: .015, bevelSegments: 1, curveSegments: 18 }); hg.translate(0, -R1 + .02, -.035); hg.rotateZ(-Math.PI / 2);
    m(hg, steel, .9 + .02, 0, 0);
    [-1, 1].forEach(function (sd) { var sp = new T.ConeGeometry(.04, .2, 6); var o = m(sp, steel, .9 - .28, sd * .5, 0); o.rotation.z = sd > 0 ? -.55 : Math.PI + .55; });
    var nb = new T.BoxGeometry(.03, .16, .08); m(nb, neon, .955, 0, 0);
    g.position.set(.02, -.7, 0); g.visible = false; return g;
  }
  function attachPick(c) { if (!PICK) PICK = buildPick(); if (PICK.parent !== c.aR) { if (PICK.parent) PICK.parent.remove(PICK); c.aR.add(PICK); } }

  /* ---------------- constructions ---------------- */
  function rampGeo() {   // escalier = rampe pleine et lisse (comme un toit en pente), 4 m de long, 4 m de haut, avec une jupe dessous pour ne pas flotter
    var s = new T.Shape(); s.moveTo(0, -1.2); s.lineTo(CELL, -1.2); s.lineTo(CELL, LH); s.lineTo(CELL - .3, LH); s.lineTo(0, .3); s.lineTo(0, -1.2);
    var g = new T.ExtrudeGeometry(s, { depth: CELL - .06, bevelEnabled: false }); g.translate(-CELL / 2, 0, -(CELL - .06) / 2); g.computeVertexNormals(); return g; }
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
    var L = b0 == null ? Math.round((P.y - .05) * 20) / 20 : b0 + LH * Math.floor((P.y + .6 - b0) / LH), t = PIECE, p = { t: t, m: MATK, d: d };
    // debout sur une rampe : on construit dans la foulée, en haut (la cellule de la rampe compte comme la nôtre, niveau = haut de la rampe)
    var R = null; PIECES.forEach(function (q) { if (q.t === 'esc' && Math.abs(P.x - q.x) <= CELL / 2 + .1 && Math.abs(P.z - q.z) <= CELL / 2 + .1 && P.y > q.L + .1 && P.y < q.L + LH + .5) R = q; });
    if (R) { ci = Math.floor(R.x / CELL); cj = Math.floor(R.z / CELL); if (t !== 'mur') { var i0 = ci + dx, j0 = cj + dz, L0 = R.L + LH;
        p.L = t === 'toit' && pitch <= 0 ? L0 : t === 'toit' ? L0 : L0; p.x = i0 * CELL + CELL / 2; p.z = j0 * CELL + CELL / 2; p.key = t[0] + '|' + i0 + '|' + j0 + '|' + p.L.toFixed(1); if (t === 'lit') p = null; if (p) return p; p = { t: t, m: MATK, d: d }; }
      else L = R.L + (pitch > .2 ? LH : 0); }
    if (t === 'mur') { p.L = L + (pitch > .45 ? LH : 0); var ex = d === 0 ? ci + 1 : d === 2 ? ci : null, ez = d === 1 ? cj + 1 : d === 3 ? cj : null;
      if (ex != null) { p.x = ex * CELL; p.z = cj * CELL + CELL / 2; p.hw = .14; p.hd = CELL / 2; p.key = 'm|x|' + ex + '|' + cj; } else { p.z = ez * CELL; p.x = ci * CELL + CELL / 2; p.hw = CELL / 2; p.hd = .14; p.key = 'm|z|' + ci + '|' + ez; } }
    else if (t === 'lit') { var bx = P.x + Math.cos(a) * 2.4, bz = P.z + Math.sin(a) * 2.4; p.x = bx; p.z = bz; p.L = Math.max(C.hgt(bx, bz), groundAt(bx, bz, P.y + .5)); p.d = a; p.key = 'lit|' + Math.round(bx) + '|' + Math.round(bz); return p; }
    else { var i = ci, j = cj, LL = L; if (t === 'sol') { if (pitch > .35) LL = L + LH; else { i += dx; j += dz; } }
      else if (t === 'esc') { i += dx; j += dz; if (pitch > .55) LL = L + LH; }
      else { if (pitch > 0) LL = L + LH; else { i += dx; j += dz; } }
      p.L = LL; p.x = i * CELL + CELL / 2; p.z = j * CELL + CELL / 2; p.key = t[0] + '|' + i + '|' + j; }
    for (var hi = 0; hi < C.HOUSES.length; hi++) { var hs = C.HOUSES[hi]; if (Math.abs(p.x - hs.x) > hs.hx + .6 || Math.abs(p.z - hs.z) > hs.hz + .6 || p.L < hs.y0 - 1.2 || p.L > hs.y0 + hs.h + 1.2) continue;
      p.L = hs.y0 + LH * Math.round((p.L - hs.y0) / LH); break; }   // dans un bâtiment : on se cale sur ses étages (mur cassé → ton mur prend exactement sa place)
    p.key += '|' + p.L.toFixed(1); return p; }
  function slotWalls(p, lin) { var ax = p.hw > p.hd; return C.WALLS.filter(function (w) { return w.alive && !w.build && !!w.lintel === lin && Math.abs(ax ? w.z - p.z : w.x - p.x) < .45 && Math.abs(ax ? w.x - p.x : w.z - p.z) < (ax ? w.hw : w.hd) + CELL / 2 - .3 && w.y0 < p.L + LH - .4 && w.y0 + w.h > p.L + .4; }); }
  function taken(key, p) { for (var i = 0; i < PIECES.length; i++) if (PIECES[i].key === key) return true; return !!(p && p.t === 'mur' && slotWalls(p, false).length); }   // un mur de maison encore debout occupe la place
  function placeBed(p) { BED = { x: p.x, z: p.z, y: p.L, a: p.d }; showBed(); C.toast('LIT POSÉ : TU RÉAPPARAÎTRAS ICI'); save(); return true; }
  function showBed() { if (!BED) { if (BEDM) BEDM.visible = false; return; } if (!BEDM) { if (!BEDTPL) return; BEDM = new T.Mesh(BEDTPL.geo, BEDTPL.mat); BEDM.castShadow = true; BEDM.userData.dyn = true; C.scene.add(BEDM); }
    BEDM.visible = true; BEDM.position.set(BED.x, BED.y, BED.z); BEDM.rotation.set(0, -BED.a + Math.PI / 2, 0); }
  /* ÉDITER un mur : plein, porte, fenêtre, 2 fenêtres, porte + fenêtre. Un mur = des morceaux [u0, u1, y0, y1] (u le long du mur, 0 = centre) */
  var EDITS = ['plein', 'porte', 'fenetre', 'fenetres', 'portefen'], ENAME = { plein: 'MUR PLEIN', porte: 'PORTE', fenetre: 'FENÊTRE', fenetres: '2 FENÊTRES', portefen: 'PORTE + FENÊTRE' };
  function segsOf(v) { var W = CELL / 2, H2 = LH;
    return { plein: [[-W, W, 0, H2]], porte: [[-W, -.75, 0, H2], [.75, W, 0, H2], [-.75, .75, 2.45, H2]], fenetre: [[-W, -.85, 0, H2], [.85, W, 0, H2], [-.85, .85, 0, 1.1], [-.85, .85, 2.5, H2]],
      fenetres: [[-W, -1.9, 0, H2], [-.7, .7, 0, H2], [1.9, W, 0, H2], [-1.9, -.7, 0, 1.1], [-1.9, -.7, 2.5, H2], [.7, 1.9, 0, 1.1], [.7, 1.9, 2.5, H2]],
      portefen: [[-W, -1.9, 0, H2], [-1.9, -.6, 2.45, H2], [-.6, .7, 0, H2], [.7, 1.9, 0, 1.1], [.7, 1.9, 2.5, H2], [1.9, W, 0, H2]] }[v || 'plein']; }
  function wallSegs(p, im) { var below = PIECES.some(function (q) { return q !== p && Math.abs(q.L - (p.L - LH)) < .2 && Math.hypot(q.x - p.x, q.z - p.z) < 3; }), ext = below ? 0 : 1, alongX = p.hw > p.hd;
    p.ws = []; segsOf(p.v).forEach(function (sg) { if (!im.free.length) return; var cu = (sg[0] + sg[1]) / 2, hu = (sg[1] - sg[0]) / 2, y0 = sg[2] === 0 ? p.L - ext : p.L + sg[2], y1 = p.L + sg[3];
      var w = { x: p.x + (alongX ? cu : 0), z: p.z + (alongX ? 0 : cu), y0: y0, hw: alongX ? hu : p.hw, hd: alongX ? p.hd : hu, m: MATW[p.m], h: y1 - y0, house: null, im: im, ii: im.free.pop(), alive: true, hp: p.hp, build: p };
      C.WALLS.push(w); C.setWall(w, true); p.ws.push(w); }); p.w = p.ws[0]; }
  function wallFree(p) { (p.ws || []).forEach(function (w) { var wi = C.WALLS.indexOf(w); if (wi >= 0) C.WALLS.splice(wi, 1); if (w.alive) C.setWall(w, false); p.im.free.push(w.ii); }); p.ws = []; p.w = null; }
  function placePiece(p) { if (p.t === 'lit') return placeBed(p);
    var im = pieceIM(p.t, p.m); if (!im.free.length) return false; p.im = im; p.hp = p.hp || HPP[p.m];
    if (p.t === 'mur') { slotWalls(p, true).forEach(function (w) { w.alive = false; C.setWall(w, false); }); wallSegs(p, im); }
    else { p.ii = im.free.pop(); im.setMatrixAt(p.ii, pieceMatrix(p, O3 || (O3 = new T.Object3D()))); im.instanceMatrix.needsUpdate = true; }
    PIECES.push(p); return true; }
  function removePiece(p, fx) { var i = PIECES.indexOf(p); if (i < 0) return; PIECES.splice(i, 1);
    if (p.t === 'mur') wallFree(p);
    else { p.im.setMatrixAt(p.ii, ZERO); p.im.instanceMatrix.needsUpdate = true; p.im.free.push(p.ii); }
    if (fx) { var c = C.MATS[MATW[p.m]].col; C.burst(p.x, p.L + 1.5, p.z, 16, [c, c, '#5a3a20'], 7, .5, 1.4); C.SFX.crack(); } }
  function editWall() {   // le mur de construction devant soi passe au modèle suivant
    var P = me(), a = C.camA(), fx = Math.cos(a), fz = Math.sin(a), best = null, bt = 4.5;
    PIECES.forEach(function (p) { if (p.t !== 'mur' || Math.abs(p.x - P.x) > 8 || Math.abs(p.z - P.z) > 8) return; var t = C.rayBox(P.x, P.y + 1.4, P.z, fx, 0, fz, p.x - p.hw - .1, p.L, p.z - p.hd - .1, p.x + p.hw + .1, p.L + LH, p.z + p.hd + .1); if (t < bt) { bt = t; best = p; } });
    if (!best) { C.toast('VISE UN DE TES MURS POUR L\'ÉDITER'); return; }
    wallFree(best); best.v = EDITS[(EDITS.indexOf(best.v || 'plein') + 1) % EDITS.length]; wallSegs(best, best.im); C.toast('✏️ ' + ENAME[best.v]); C.tone('triangle', 660, 880, .08, .06); C.noise(.06, .08, 2500); }
  function ghostShow(p, ok) {
    if (!GHOST) { GHOST = {}; var gm = new T.MeshBasicMaterial({ color: '#3ab0ff', transparent: true, opacity: .38, depthWrite: false }); GHOST.mat = gm;
      GEO.lit = new T.BoxGeometry(1.2, .6, 2.2); GEO.lit.translate(0, .3, 0); GEO.coffre = new T.BoxGeometry(1.2, .85, .8); GEO.coffre.translate(0, .42, 0);
      ['mur', 'sol', 'esc', 'toit', 'lit', 'coffre'].forEach(function (k) { var m = new T.Mesh(k === 'mur' || k === 'sol' ? C.BOX : GEO[k], gm); m.visible = false; m.renderOrder = 3; m.userData.dyn = true; C.scene.add(m); GHOST[k] = m; }); }
    ['mur', 'sol', 'esc', 'toit', 'lit', 'coffre'].forEach(function (k) { GHOST[k].visible = !!p && p.t === k; });
    if (!p) return; var m = GHOST[p.t]; GHOST.mat.color.set(ok ? '#3ab0ff' : '#ff3a5a');
    if (p.t === 'mur') { m.position.set(p.x, p.L + LH / 2, p.z); m.rotation.set(0, 0, 0); m.scale.set(p.hw * 2 + .02, LH, p.hd * 2 + .02); }
    else if (p.t === 'lit' || p.t === 'coffre') { m.position.set(p.x, p.L, p.z); m.rotation.set(0, -p.d + Math.PI / 2, 0); m.scale.set(1, 1, 1); }
    else { var o = O3 || (O3 = new T.Object3D()); pieceMatrix(p, o); m.position.copy(o.position); m.rotation.copy(o.rotation); m.scale.copy(o.scale); if (p.t === 'sol') m.scale.y = .32; } }
  function groundAt(x, z, y) { var g = -1e9, lim = y + .75;   // les rampes se montent sans sauter (on « accroche » jusqu'à 1,3 m)
    for (var wi = 0; wi < C.WALLS.length; wi++) { var w = C.WALLS[wi]; if (!w.alive || Math.abs(x - w.x) > w.hw + .22 || Math.abs(z - w.z) > w.hd + .22) continue; var wt = w.y0 + w.h; if (wt <= lim && wt > g) g = wt; }   // on peut tenir debout sur le haut des murs
    for (var i = 0; i < PIECES.length; i++) { var p = PIECES[i]; if (p.t === 'mur') continue; var dx = x - p.x, dz = z - p.z; if (Math.abs(dx) > CELL / 2 + .05 || Math.abs(dz) > CELL / 2 + .05) continue; var h;
      if (p.t === 'sol') h = p.L + .15;
      else if (p.t === 'esc') { var u = (p.d === 0 ? dx : p.d === 1 ? dz : p.d === 2 ? -dx : -dz) + CELL / 2; h = p.L + .3 + Math.max(0, Math.min(CELL - .3, u)) * (LH - .3) / (CELL - .3); if (h <= y + 1.3 && h > g) { g = h; continue; } }
      else if (p.t === 'lit') continue;
      else h = p.L + 2.4 * (1 - Math.max(Math.abs(dx), Math.abs(dz)) / (CELL / 2));
      if (h <= lim && h > g) g = h; }
    return g; }

  /* ---------------- pioche : viser et taper ---------------- */
  function give(k, n, x, y, z) { if (!C.BUILD || C.CREA) return; RES[k] = Math.min(999, RES[k] + n); pop('+' + n + ' ' + ICON[k]); hudRes(); }
  function pop(t) { var d = document.createElement('div'); d.className = 'sPop'; d.textContent = t; d.style.left = (46 + Math.random() * 8) + '%'; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 900); }
  function strike() {
    var P = me(), a = C.camA(), fx = Math.cos(a), fz = Math.sin(a), best = null, bd = 3.3, ox = P.x, oz = P.z, oy = P.y + 1.2;
    function cand(x, z, r, obj, kind) { var dx = x - ox, dz = z - oz, d = Math.hypot(dx, dz) - r; if (d > 2.2) return; var dot = (dx * fx + dz * fz) / (Math.hypot(dx, dz) || 1); if (dot < .45 && d > .3) return; if (d < bd) { bd = d; best = [kind, obj]; } }
    if (window.ZOMB && ZOMB.on && ZOMB.melee(P.x, P.y, P.z, fx, fz, 2.6, 34)) { C.tone('square', 150, 90, .08, .08); return; }   // un coup de pioche sur un zombie
    NODES.forEach(function (n) { if (!n.dead && Math.abs(n.x - ox) < 6 && Math.abs(n.z - oz) < 6) cand(n.x, n.z, n.col.r, n, 'node'); });
    C.TREES.forEach(function (t) { if (!t.rock && t.d3 && !t.cut && Math.abs(t.x - ox) < 6 && Math.abs(t.z - oz) < 6 && P.y < t.y + 6) cand(t.x, t.z, (t.r || .5) * .8, t, 'tree'); });
    STUMPL.forEach(function (t) { if (Math.abs(t.x - ox) < 5 && Math.abs(t.z - oz) < 5) cand(t.x, t.z, .45, t, 'stump'); });
    HARV().forEach(function (it) { if (it.dead || Math.abs(it.x - ox) > 9 || Math.abs(it.z - oz) > 9) return; var r = it.col ? it.col.r0 || it.col.r || .6 : .4; cand(it.x, it.z, r, it, 'harv'); });
    WRECKS.forEach(function (w) { if (!w.dead && Math.abs(w.x - ox) < 7 && Math.abs(w.z - oz) < 7) cand(w.x, w.z, w.r, w, 'wreck'); });
    if (BED && Math.abs(BED.x - ox) < 5 && Math.abs(BED.z - oz) < 5) cand(BED.x, BED.z, .8, BED, 'bed');
    STOR.forEach(function (c) { if (Math.abs(c.x - ox) < 5 && Math.abs(c.z - oz) < 5) cand(c.x, c.z, .6, c, 'stor'); });
    if (C.SURV && C.chests) C.chests().forEach(function (c) { if (Math.abs(c.x - ox) < 5 && Math.abs(c.z - oz) < 5) cand(c.x, c.z, .6, c, 'loot'); });
    var pitch = C.camP(), dy = Math.sin(Math.max(-.6, Math.min(.6, pitch))), dl = Math.cos(Math.max(-.6, Math.min(.6, pitch)));
    C.WALLS.forEach(function (w) { if (!w.alive || Math.abs(w.x - ox) > 7 || Math.abs(w.z - oz) > 7) return; var y0 = w.y0 + (w.lintel ? 2.6 : 0);
      var t = C.rayBox(ox, oy, oz, fx * dl, dy, fz * dl, w.x - w.hw - .05, y0, w.z - w.hd - .05, w.x + w.hw + .05, w.y0 + w.h, w.z + w.hd + .05); if (t < 2.8 && t - .35 < bd) { bd = t - .35; best = ['wall', w]; } });
    PIECES.forEach(function (p) { if (p.t === 'mur' || Math.abs(p.x - ox) > 7 || Math.abs(p.z - oz) > 7) return; var top = p.t === 'sol' ? p.L + .2 : p.L + (p.t === 'esc' ? LH : 2.4), bot = p.t === 'sol' ? p.L - .2 : p.L;
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
    else if (best[0] === 'stump') { o.shp = (o.shp == null ? 3 : o.shp) - 1; give('bois', 3); C.burst(o.x, o.y + .5, o.z, 7, ['#8a5a2e', '#5a3a1e'], 4, .12, .5); C.tone('square', 170, 110, .08, .07);
      if (o.shp <= 0) { o.gone = true; STUMPL.splice(STUMPL.indexOf(o), 1); stumpsRefresh(); C.SFX.crack(); C.burst(o.x, o.y + .5, o.z, 16, ['#8a5a2e', '#5a3a1e', '#3a6a2a'], 6, .25, .9); C.toast('SOUCHE ARRACHÉE : CET ARBRE NE REPOUSSERA PAS'); } }
    else if (best[0] === 'harv') { o.hp--; o.shk = .2; if (window.PROPS) PROPS.harvSet(o, true); var k3 = o.hv; give(k3, k3 === 'pierre' ? (o.hp0 <= 2 ? 4 : 8) : 6);
      C.burst(o.x - fx * .5, o.y + 1, o.z - fz * .5, 9, k3 === 'pierre' ? ['#9a958a', '#c8c2b4', '#6a665e'] : ['#4a8a3a', '#7ac85a', '#2a5a1e'], 5, .13, .5); C.tone('square', k3 === 'pierre' ? 900 : 300, k3 === 'pierre' ? 600 : 180, .05, .06); C.noise(.07, .14, 3000);
      if (o.hp <= 0) { if (window.PROPS) PROPS.harvBreak(o); o.t = 0; C.SFX.crack(); C.burst(o.x, o.y + 1, o.z, 20, ['#9a958a', '#5a5650', '#c8c2b4'], 7, .3, 1.1); } }
    else if (best[0] === 'bed') { if (bagAdd({ t: 'lit' })) { BED = null; showBed(); C.toast('🛏 LIT RANGÉ DANS TON SAC'); save(); } }
    else if (best[0] === 'stor') { if (o.items.some(function (q) { return q; })) C.toast('VIDE LE COFFRE AVANT DE LE RÉCUPÉRER'); else if (bagAdd({ t: 'coffre' })) { removeStor(o); C.toast('📦 COFFRE RANGÉ DANS TON SAC'); save(); } }
    else if (best[0] === 'loot') { C.breakChest(o); C.SFX.crack(); }   // on casse le coffre : son butin tombe et on garde le coffre
    else if (best[0] === 'wreck') { o.hp--; o.shk = .2; give('metal', 7); C.burst(o.x - fx * .8, o.y + 1, o.z - fz * .8, 10, ['#ffd27a', '#8a5a3a', '#cfd8e3'], 6, .12, .5); C.tone('square', 1300, 700, .05, .07); C.tone('triangle', 520, 380, .12, .05);
      if (o.hp <= 0) breakWreck(o, true); }
  }
  /* ---------------- carcasses de voitures (et le tracteur du ranch) = MÉTAL ---------------- */
  var WRECKS = [], WRK = false;
  function HARV() { return window.PROPS && PROPS.harv ? PROPS.harv() : []; }
  function breakWreck(w, fx) { w.dead = true; if (w.g) w.g.visible = false; if (w.kit) w.kit.show(w.i, false); (w.cols || []).forEach(function (c) { var a = C.PCOL.indexOf(c); if (a >= 0) C.PCOL.splice(a, 1); var b = C.PCOLB ? C.PCOLB.indexOf(c) : -1; if (b >= 0) C.PCOLB.splice(b, 1); });
    if (fx) { C.SFX.crack(); C.noise(.5, .3, 700); C.burst(w.x, w.y + 1, w.z, 26, ['#8a5a3a', '#cfd8e3', '#3a3a3a', '#ffd27a'], 8, .35, 1.2); } }
  function backWreck(w) { w.dead = false; w.hp = w.hp0; if (w.g) w.g.visible = true; if (w.kit) w.kit.show(w.i, true); (w.cols || []).forEach(function (c) { if (c.hw != null) { if (C.PCOLB && C.PCOLB.indexOf(c) < 0) C.PCOLB.push(c); } else if (C.PCOL.indexOf(c) < 0) C.PCOL.push(c); }); }
  function buildWrecks() {   // une fois les modèles de voitures chargés
    var CA = C.cars(), ks = ['golf', '2cv', 'van'].filter(function (k) { return CA[k]; }); if (ks.length < 3) return false;
    var r = rng(C.SURV ? 5150 : C.DES ? 5151 : 5152), n = C.SURV ? 70 : 14, mats = {};
    ks.forEach(function (k) { var m = CA[k].mat.clone(); m.color = new T.Color('#b8845e'); m.shininess = 4; m.specular = new T.Color('#222222'); mats[k] = m; });
    for (var q = 0, tries = 0; q < n && tries < 3000; tries++) { var x, z;
      if (C.ROADP.length && r() < .75) { var rd = C.ROADP[r() * C.ROADP.length | 0], pt = rd[r() * rd.length | 0], a0 = r() * 6.283, off = 6 + r() * 7; x = pt[0] + Math.cos(a0) * off; z = pt[1] + Math.sin(a0) * off; }
      else { var a1 = r() * 6.283, d1 = 40 + r() * (C.ISLM - 60); x = Math.cos(a1) * d1; z = Math.sin(a1) * d1; }
      if (!C.onLand(x, z) || C.nearRoad(x, z, 3.5) || C.inLake(x, z, 4) || C.hgt(x, z) > 60) continue;
      if (C.HOUSES.some(function (h) { return Math.abs(h.x - x) < h.hx + 4 && Math.abs(h.z - z) < h.hz + 4; })) continue;
      if (C.TREES.some(function (t) { return Math.abs(t.x - x) < 3.2 && Math.abs(t.z - z) < 3.2; }) || WRECKS.some(function (w) { return Math.abs(w.x - x) < 9 && Math.abs(w.z - z) < 9; })) continue;
      var k = ks[r() * ks.length | 0], T3 = CA[k], g = new T.Group(), bm = new T.Mesh(T3.body, mats[k]); bm.castShadow = true; bm.receiveShadow = true; g.add(bm);
      T3.wheels.forEach(function (w, wi) { if (r() < .45) return; var wm = new T.Mesh(w.g, mats[k]); wm.position.copy(w.p); wm.rotation.x = r() * .6; g.add(wm); });   // il manque des roues
      var y = C.hgt(x, z), a = r() * 6.283; g.position.set(x, y - .25, z); g.rotation.set((r() - .5) * .18, -a, (r() - .5) * .25 + (r() < .12 ? 2.9 : 0)); if (g.rotation.z > 2) g.position.y += 1.6;   // parfois sur le toit
      g.userData.dyn = true; C.scene.add(g);
      var ca = Math.cos(a), sa = Math.sin(a), cols = [-1, 1].map(function (sd) { return { x: x + ca * sd * 1.1, z: z + sa * sd * 1.1, y: y, r: 1.1, h: 1.6 }; }); cols.forEach(function (c) { C.PCOL.push(c); });
      WRECKS.push({ x: x, z: z, y: y, r: 2, g: g, cols: cols, hp: 8, hp0: 8, id: 'w' + q }); q++; }
    (window.EXT_WRECK || []).forEach(function (w, i) { w.hp0 = w.hp; w.cols = w.col ? [w.col] : []; w.id = 'k' + i; WRECKS.push(w); });   // le tracteur du ranch
    return true; }
  function wreckVis() { var P = me(); WRECKS.forEach(function (w) { if (w.g && !w.dead) w.g.visible = Math.abs(w.x - P.x) < 260 && Math.abs(w.z - P.z) < 260; }); }
  function hitPiece(p, dmg) { p.hp -= dmg; C.tone('square', 240, 150, .07, .06); (p.ws || []).forEach(function (w) { w.hp = p.hp; }); if (p.hp <= 0) removePiece(p, true); else C.burst(p.x, p.L + 1.2, p.z, 5, [C.MATS[MATW[p.m]].col], 3, .12, .4); }
  function fell(t) {   // l'arbre tombe : il disparaît, une souche reste, il repoussera
    t.cut = true; t.cutT = 0; t.r0 = t.r; t.h0 = t.h; t.r = 0; t.h = -99; if (window.TREES3D && TREES3D.cut) TREES3D.cut(t, false);
    STUMPL.push(t); stumpsRefresh(); C.SFX.crack(); C.noise(.5, .25, 500); C.burst(t.x, t.y + 3, t.z, 30, ['#3a6a2a', '#5a8a3a', '#8a5a2e', '#2a4a1e'], 8, .35, 1.6, .5); give('bois', 10); }

  /* ---------------- interface ---------------- */
  function css() { var s = document.createElement('style'); s.textContent = [
    'body.surv #tl>.chip{display:none}body.surv #pill{display:none}',
    'body:not(.surv) .sres{position:fixed;z-index:6;right:max(12px,env(safe-area-inset-right,0px));top:calc(116px + env(safe-area-inset-top,0px));transform:scale(.85);transform-origin:top right}',   // Battle Royale : sous la mini-carte
    '.sres{display:flex;gap:5px}.sres .chip b{font:900 13px var(--body);color:#fff}.sres .chip.flash{border-color:#ffd23d;box-shadow:0 0 10px #ffd23d}',
    '#sTools{display:flex;gap:5px;margin-left:7px;padding-left:7px;border-left:2px solid rgba(255,255,255,.25)}',
    '#sTools button{display:flex;align-items:center;justify-content:center}#sTools svg{filter:drop-shadow(0 1px 2px #000)}',
    '#hotbar #sTools button.on{border-color:#ffd23d;background:rgba(255,210,61,.28);box-shadow:0 0 12px rgba(255,210,61,.7);outline:none}',
    '#sBuild button{pointer-events:auto;cursor:pointer;font:900 20px/1 var(--body);color:#fff;background:rgba(11,4,24,.7);border:2px solid rgba(255,255,255,.3);border-radius:14px}',
    '#sBuild{position:fixed;z-index:6;left:50%;transform:translateX(-50%);bottom:calc(74px + env(safe-area-inset-bottom,0px));display:flex;gap:6px;align-items:flex-end}',
    'body.touch #sBuild{bottom:calc(18px + env(safe-area-inset-bottom,0px))}',
    '#sBuild button{width:60px;height:58px;padding:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}#sBuild button small{font:900 9px var(--body);letter-spacing:.04em}',
    '#sBuild button.on{border-color:#3ab0ff;background:rgba(58,176,255,.3);box-shadow:0 0 12px #3ab0ff;transform:translateY(-4px)}#sBuild .mat{border-color:#ffd23d;margin-left:6px}',
    '#sBuild .edit{border-color:#3affb0;margin-left:4px}#sBuild .edit small{color:#3affb0}',
    '#sBuild .mat i{font-style:normal;font:900 10px var(--body);color:#ffd23d}',
    '.sPop{position:fixed;z-index:9;top:44%;font:900 18px var(--display,var(--body));color:#fff;text-shadow:0 2px 6px #000,0 0 10px rgba(255,210,61,.8);pointer-events:none;animation:sPop .9s ease-out forwards}',
    '@keyframes sPop{0%{transform:translate(-50%,0) scale(.7);opacity:0}15%{opacity:1;transform:translate(-50%,-8px) scale(1.1)}100%{transform:translate(-50%,-46px) scale(1);opacity:0}}',
    'body.won #sTools,body.won #sBuild{display:none!important}',
    '#sIntro{position:fixed;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 40%,rgba(40,10,60,.82),rgba(5,2,12,.94));font-family:var(--body);color:#fff}#sIntro[hidden]{display:none}',
    '#sIntro .box{width:min(620px,92vw);max-height:92vh;overflow:auto;padding:14px 18px;border:2px solid rgba(255,43,214,.6);border-radius:18px;background:rgba(11,4,24,.85);box-shadow:0 0 30px rgba(255,43,214,.35)}',
    '#sIntro h2{margin:0 0 4px;font:900 20px var(--display,var(--body));letter-spacing:.04em;color:#ffd23d;text-shadow:0 0 12px rgba(255,210,61,.6)}#sIntro p{margin:0 0 8px;font-size:13px;opacity:.9}',
    '#sIntro .g{display:grid;grid-template-columns:1fr 1fr;gap:5px 12px}#sIntro .r{display:flex;align-items:center;gap:8px;font-size:12px;line-height:1.25}#sIntro .r b{flex:0 0 auto;min-width:34px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:8px;background:rgba(255,255,255,.1);font:900 12px var(--body)}',
    '#sIntro button{margin:10px auto 6px;display:block;font:900 15px var(--body);color:#1a0820;background:linear-gradient(#ffe36a,#ffb23d);border:0;border-radius:12px;padding:9px 28px;cursor:pointer}',
    '#sIntro .bar{height:4px;border-radius:2px;background:rgba(255,255,255,.12);overflow:hidden}#sIntro .bar i{display:block;height:100%;width:100%;background:#ff2bd6;animation:sIntroB 15s linear forwards}@keyframes sIntroB{from{transform:translateX(-100%)}to{transform:none}}',
    '#sBag{position:fixed;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;background:rgba(5,2,12,.6);font-family:var(--body)}#sBag[hidden]{display:none}',
    '#sBag .box{background:rgba(20,12,34,.95);border:2px solid rgba(255,255,255,.25);border-radius:14px;padding:8px 10px;max-height:96vh;overflow:auto;box-shadow:0 0 24px rgba(0,0,0,.6)}',
    '#sBag .hd{display:flex;align-items:center;gap:10px;color:#fff;margin-bottom:6px}#sBag .hd b{font:900 15px var(--body);color:#ffd23d}#sBag .hd span{flex:1;font:700 11px var(--body);opacity:.85}#sBag .x{font:900 16px var(--body);color:#fff;background:rgba(255,58,90,.4);border:0;border-radius:8px;width:30px;height:28px}',
    '#sBag .gr{display:grid;grid-template-columns:repeat(10,48px);gap:4px}#sBag .gr.hot{grid-template-columns:repeat(4,48px)}#sBag .sep{font:900 10px var(--body);color:#bbb;margin:6px 0 3px;letter-spacing:.08em}',
    '#sBag .bs{width:48px;height:40px;padding:0;border-radius:7px;border:2px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);cursor:pointer}#sBag .bs canvas{width:44px;height:30px;display:block;margin:auto}#sBag .bs.sel{border-color:#ffd23d;background:rgba(255,210,61,.22)}#sBag .hot .bs{border-color:rgba(61,187,255,.4)}',
    '#sBag .ac{display:flex;gap:8px;justify-content:center;margin-top:7px}#sBag .ac button{font:900 13px var(--body);border:0;border-radius:10px;padding:7px 18px;cursor:pointer}#sBag .pose{background:linear-gradient(#ffe36a,#ffb23d);color:#1a0820}#sBag .drop{background:rgba(255,58,90,.5);color:#fff}',
    '#sOpen{position:fixed;z-index:8;left:50%;transform:translateX(-50%);bottom:calc(140px + env(safe-area-inset-bottom,0px));font:900 14px var(--body);color:#1a0820;background:linear-gradient(#ffe36a,#ffb23d);border:0;border-radius:12px;padding:9px 18px;cursor:pointer}#sOpen[hidden]{display:none}',
    '#sSave{position:fixed;z-index:7;left:12px;bottom:calc(64px + env(safe-area-inset-bottom,0px));font:900 11px var(--body);color:#7aff9a;opacity:0;pointer-events:none}#sSave.on{animation:sSave 1.6s ease-out}@keyframes sSave{0%,70%{opacity:1}100%{opacity:0}}',
    '#sNow{position:fixed;z-index:7;left:50%;top:calc(80px + env(safe-area-inset-top,0px));transform:translateX(-50%);font:800 12px var(--body);color:#fff;background:rgba(11,4,24,.6);border-radius:12px;padding:4px 12px;opacity:0;pointer-events:none;transition:opacity 1s}#sNow.on{opacity:1}'].join('\n'); document.head.appendChild(s); }
  function ui() {
    css(); var tl = document.getElementById('tl'); el.res = document.createElement('div'); el.res.className = 'sres';
    ['bois', 'pierre', 'metal'].forEach(function (k) { var c = document.createElement('span'); c.className = 'chip'; c.innerHTML = '<span>' + ICON[k] + '</span><b>0</b>'; c.title = NAME[k]; el.res.appendChild(c); el[k] = c; });
    if (tl && C.BUILD) tl.appendChild(el.res);
    el.saveI = document.createElement('div'); el.saveI.id = 'sSave'; el.saveI.textContent = '💾 Sauvegardé'; document.body.appendChild(el.saveI);
    el.now = document.createElement('div'); el.now.id = 'sNow'; document.body.appendChild(el.now);
    el.open = document.createElement('button'); el.open.type = 'button'; el.open.id = 'sOpen'; el.open.hidden = true; el.open.innerHTML = '📦 OUVRIR LE COFFRE' + (C.isTouch ? '' : ' (E)'); document.body.appendChild(el.open);
    press(el.open, function () { act(); });
    el.tools = document.createElement('span'); el.tools.id = 'sTools';
    el.tools.innerHTML = '<button type="button" data-t="pioche" title="Pioche (X)">' + IC.pioche + '<b>' + (C.isTouch ? '' : 'X') + '</b></button>' + (C.BUILD ? '<button type="button" data-t="build" title="Construire (V)">' + IC.build + '<b>' + (C.isTouch ? '' : 'V') + '</b></button>' : '');
    var hb = document.getElementById('hotbar'); if (hb) hb.appendChild(el.tools); else document.body.appendChild(el.tools);
    el.tools.querySelectorAll('button').forEach(function (b) { press(b, function () { setTool(TOOL === b.dataset.t ? null : b.dataset.t); }); });
    el.build = document.createElement('div'); el.build.id = 'sBuild'; el.build.className = 'hud'; el.build.hidden = true;
    el.build.innerHTML = PLIST().map(function (k, i) { return '<button type="button" data-p="' + k + '">' + IC[k] + '<small>' + PNAME[k] + (C.isTouch || k === 'lit' ? '' : ' ' + KN(['mur', 'sol', 'escalier', 'toit'][i])) + '</small></button>'; }).join('') + '<button type="button" class="mat" data-m="1"><span id="sMatI">🪵</span><i id="sMatN">BOIS</i></button><button type="button" class="edit" data-e="1">✏️<small>ÉDITER' + (C.isTouch ? '' : ' ' + KN('editer')) + '</small></button>';
    document.body.appendChild(el.build);
    el.build.querySelectorAll('[data-p]').forEach(function (b) { press(b, function () { PIECE = b.dataset.p; hudBuild(); }); });
    press(el.build.querySelector('.mat'), function () { nextMat(); });
    press(el.build.querySelector('.edit'), function () { editWall(); });
    setInterval(function () { var on = /^(play|pause)$/.test(C.state()) && me() && me().alive; if (el.tools.hidden === on) el.tools.hidden = !on; if (!on && !el.build.hidden) el.build.hidden = true; else if (on && TOOL === 'build' && el.build.hidden) el.build.hidden = false; }, 250);
    addEventListener('keydown', function (e) { if (C.state() !== 'play' || e.repeat) return; var a = window.bindAct ? bindAct(e.code) : null;
      if (a === 'pioche') setTool(TOOL === 'pioche' ? null : 'pioche');
      else if (a === 'construire') setTool(TOOL === 'build' ? null : 'build');
      else if (a === 'mur' || a === 'sol' || a === 'escalier' || a === 'toit') { e.preventDefault(); PIECE = { mur: 'mur', sol: 'sol', escalier: 'esc', toit: 'toit' }[a]; if (TOOL !== 'build') setTool('build'); hudBuild(); }
      else if (a === 'materiau' && TOOL === 'build') nextMat();
      else if (a === 'editer' && C.BUILD) editWall(); });
  }
  function press(b, fn) { b.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); fn(); }); }
  function nextMat() { var L = ['bois', 'pierre', 'metal']; MATK = L[(L.indexOf(MATK) + 1) % 3]; hudBuild(); }
  function hudRes() { ['bois', 'pierre', 'metal'].forEach(function (k) { var b = el[k] && el[k].querySelector('b'), v = C.CREA ? '∞' : String(RES[k]); if (b && b.textContent !== v) { b.textContent = v; el[k].classList.remove('flash'); void el[k].offsetWidth; el[k].classList.add('flash'); setTimeout(function () { el[k].classList.remove('flash'); }, 250); } }); }
  function hudBuild() { if (!el.build) return; el.build.querySelectorAll('[data-p]').forEach(function (b) { b.classList.toggle('on', b.dataset.p === PIECE); });
    document.getElementById('sMatI').textContent = ICON[MATK]; document.getElementById('sMatN').textContent = NAME[MATK] + ' ' + RES[MATK];
    el.tools.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.t === TOOL); }); el.build.hidden = TOOL !== 'build'; }
  function act() { if (!C.SURV) return false; var c = nearStor(); if (!c) return false; OPENC = null; bag(true); OPENC = c; bagDraw(); return true; }
  function setTool(t) { if (t === 'build' && !C.BUILD) { C.toast('PAS DE CONSTRUCTIONS EN ZÉRO CONSTRUCTION'); t = null; } if (t !== 'place') { PLACEK = null; PLACEI = -1; } TOOL = t; SW.t = -1; if (PICK) PICK.visible = t === 'pioche'; if (t !== 'build') ghostShow(null); hudBuild(); if (t === 'pioche') C.tone('triangle', 520, 780, .1, .06); }

  /* ---------------- API ---------------- */
  /* ---------------- ambiance : papillons le jour (prés et forêts), lucioles la nuit et dans les forêts sombres ---------------- */
  var BUT = null, FLIES = null;
  function critters() {
    var NB = 46, wg = new T.BufferGeometry(); wg.setAttribute('position', new T.Float32BufferAttribute([0, 0, 0, .16, 0, .1, .2, 0, -.06, 0, 0, 0, .2, 0, -.06, .1, 0, -.16], 3)); wg.computeVertexNormals();
    var wm = new T.MeshBasicMaterial({ side: T.DoubleSide, vertexColors: false }), im = new T.InstancedMesh(wg, wm, NB * 2); im.frustumCulled = false; im.userData.dyn = true; C.scene.add(im);
    var cols = ['#ff8a1a', '#3ab0ff', '#fff2a8', '#ff4ad8', '#ffd23d', '#b07aff', '#ffffff'], c = new T.Color(), L = [];
    for (var i = 0; i < NB; i++) { var cc = cols[i % cols.length]; im.setColorAt(i * 2, c.set(cc)); im.setColorAt(i * 2 + 1, c.set(cc)); L.push({ x: 0, z: 0, y: 0, a: Math.random() * 6.28, ph: Math.random() * 6.28, t: 0, sp: .8 + Math.random() * .9, life: 0 }); }
    BUT = { im: im, L: L, o: new T.Object3D() };
    var NF = 160, pos = new Float32Array(NF * 3), ph = new Float32Array(NF); for (i = 0; i < NF; i++) ph[i] = Math.random() * 6.283;
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aPh', new T.BufferAttribute(ph, 1));
    var m = new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { uT: { value: 0 }, uA: { value: 0 } },
      vertexShader: 'attribute float aPh; uniform float uT; varying float vA; void main(){ vec3 p = position + vec3(sin(uT * .7 + aPh) * 1.4, sin(uT * 1.3 + aPh * 2.0) * .6, cos(uT * .6 + aPh) * 1.4); vec4 mv = modelViewMatrix * vec4(p, 1.0); vA = .5 + .5 * sin(uT * 3.0 + aPh * 5.0); gl_PointSize = clamp(260.0 / -mv.z, 2.0, 22.0); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform float uA; varying float vA; void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, 0.0, d); gl_FragColor = vec4(vec3(.85, 1.0, .45) * 2.2, a * (.2 + vA * .8) * uA); }' });
    FLIES = { pts: new T.Points(g, m), pos: pos, n: NF }; FLIES.pts.frustumCulled = false; FLIES.pts.userData.dyn = true; C.scene.add(FLIES.pts);
  }
  function crittersTick(dt) { if (!BUT) return; var P = me(), now = performance.now() / 1000, night = C.isNight && C.isNight(), dk = C.darkIn ? C.darkIn(P.x, P.z) : 0, ar = C.aridK ? C.aridK(P.x, P.z) : 0, o = BUT.o, day = !night && P.y < 70;
    BUT.L.forEach(function (b, i) { b.life -= dt; var far = Math.hypot(b.x - P.x, b.z - P.z) > 45;
      if (b.life <= 0 || far) { var a = Math.random() * 6.283, d = 6 + Math.random() * 30; b.x = P.x + Math.cos(a) * d; b.z = P.z + Math.sin(a) * d; b.y = C.hgt(b.x, b.z) + .5 + Math.random() * 2; b.life = 12 + Math.random() * 20; b.on = day && Math.random() > ar * .8 && !(C.inLake && C.inLake(b.x, b.z, 0)); }
      b.a += (Math.sin(now * .7 + b.ph) * 1.6) * dt; b.x += Math.cos(b.a) * b.sp * dt; b.z += Math.sin(b.a) * b.sp * dt; var gy = C.hgt(b.x, b.z); b.y += ((gy + .6 + (Math.sin(now * 1.1 + b.ph) + 1) * 1.1) - b.y) * dt * 1.5;
      var fl = Math.sin(now * 18 + b.ph) * 1.1, s = b.on ? 1 : 0;
      [-1, 1].forEach(function (sd, k) { o.position.set(b.x, b.y + Math.sin(now * 18 + b.ph) * .04, b.z); o.rotation.set(sd * fl, -b.a, 0, 'YXZ'); o.scale.set(s, s, s * sd); o.updateMatrix(); BUT.im.setMatrixAt(i * 2 + k, o.matrix); }); });
    BUT.im.instanceMatrix.needsUpdate = true;
    var want = Math.max(night ? 1 : 0, Math.min(1, dk * 2.5)), u = FLIES.pts.material.uniforms; u.uT.value = now; u.uA.value += (want - u.uA.value) * Math.min(1, dt * .8); FLIES.pts.visible = u.uA.value > .02;
    if (FLIES.pts.visible) { if (!FLIES.c || Math.hypot(FLIES.c[0] - P.x, FLIES.c[1] - P.z) > 25) { FLIES.c = [P.x, P.z]; for (var i = 0; i < FLIES.n; i++) { var a = Math.random() * 6.283, d = 3 + Math.sqrt(Math.random()) * 40, x = P.x + Math.cos(a) * d, z = P.z + Math.sin(a) * d; FLIES.pos[i * 3] = x; FLIES.pos[i * 3 + 1] = C.hgt(x, z) + .5 + Math.random() * 3.5; FLIES.pos[i * 3 + 2] = z; } FLIES.pts.geometry.attributes.position.needsUpdate = true; FLIES.pts.geometry.computeBoundingSphere(); } } }

  /* ---------------- SAC de survie (20 places, façon Minecraft) + coffres de rangement ---------------- */
  var BAG = [], NB = 20, BSEL = null, BAGON = false, STOR = [], STORM = null, OPENC = null, PLACEK = null, PLACEI = -1, CHM = null;
  function bagInit() { BAG = []; for (var i = 0; i < NB; i++) BAG.push(null); }
  function bagAdd(it) { if (it.t === 'soin') { for (var i = 0; i < NB; i++) if (BAG[i] && BAG[i].t === 'soin' && BAG[i].k === it.k && BAG[i].n < 10) { BAG[i].n += it.n || 1; bagDraw(); return true; } }
    for (i = 0; i < NB; i++) if (!BAG[i]) { BAG[i] = it; bagDraw(); return true; } C.toast('SAC PLEIN'); return false; }
  function itName(it) { return !it ? '' : it.t === 'arme' ? C.WEAPONS[it.k].name : it.t === 'soin' ? C.HEAL[it.k].name + ' ×' + it.n : it.t === 'lit' ? 'Lit (point de réapparition)' : it.t === 'coffre' ? 'Coffre de rangement' : ''; }
  function drawIt(cv, it) { var g = cv.getContext('2d'), w = cv.width, h = cv.height; g.clearRect(0, 0, w, h); if (!it) return;
    if (it.t === 'arme') C.icon(g, it.k, w, h); else if (it.t === 'soin') { C.healIcon(g, it.k, w, h); g.fillStyle = '#fff'; g.font = '900 13px sans-serif'; g.textAlign = 'right'; g.fillText('×' + it.n, w - 3, h - 3); }
    else { g.save(); g.translate(w / 2, h / 2); if (it.t === 'lit') { g.fillStyle = '#5a3a20'; g.fillRect(-22, -2, 44, 12); g.fillStyle = '#f0ecf6'; g.fillRect(-20, -8, 40, 10); g.fillStyle = '#c43a6a'; g.fillRect(-20, -8, 26, 10); g.fillStyle = '#fff'; g.fillRect(8, -12, 11, 7); }
      else { g.fillStyle = '#8a5a2e'; g.fillRect(-18, -8, 36, 20); g.fillStyle = '#a8743c'; g.fillRect(-18, -14, 36, 8); g.fillStyle = '#ffd23d'; g.fillRect(-18, -7, 36, 3); g.fillRect(-3, -6, 6, 7); g.strokeStyle = '#3a2410'; g.lineWidth = 2; g.strokeRect(-18, -14, 36, 26); } g.restore(); } }
  function slotHTML(src, i, it) { return '<button type="button" class="bs' + (BSEL && BSEL[0] === src && BSEL[1] === i ? ' sel' : '') + '" data-s="' + src + '" data-i="' + i + '"><canvas width="64" height="44"></canvas></button>'; }
  function hotItem(i) { var P = me(); if (i < 3) { var w = P.inv[i]; return w ? { t: 'arme', k: w.k, mag: w.mag, res: w.res } : null; } var k = P.healSel && P.heals[P.healSel] ? P.healSel : C.HORDER.filter(function (q) { return P.heals[q]; })[0]; return k ? { t: 'soin', k: k, n: P.heals[k] } : null; }
  function getS(src, i) { return src === 'bag' ? BAG[i] : src === 'ch' ? OPENC.items[i] : hotItem(i); }
  function setS(src, i, it) { if (src === 'bag') BAG[i] = it; else if (src === 'ch') OPENC.items[i] = it; else { var P = me(); if (i < 3) { P.inv[i] = it ? (function () { var sl = C.newSlot(it.k); sl.mag = it.mag; sl.res = it.res; return sl; })() : null; } } C.hudRefresh(); }
  function moveSlot(a, b) {   // a → b (échange) ; règles spéciales pour la barre (armes en 0-2, soins en 3)
    var A = getS(a[0], a[1]), B = getS(b[0], b[1]), P = me(); if (!A) return;
    if (b[0] === 'hot' && b[1] < 3 && A.t !== 'arme') { C.toast('SEULEMENT DES ARMES ICI'); return; }
    if (b[0] === 'hot' && b[1] === 3) { if (A.t !== 'soin') { C.toast('SEULEMENT DES SOINS ICI'); return; } var room = C.HEAL[A.k].max - (P.heals[A.k] || 0), n = Math.min(room, A.n); if (n <= 0) { C.toast('MAX ' + C.HEAL[A.k].max); return; } P.heals[A.k] = (P.heals[A.k] || 0) + n; P.healSel = A.k; A.n -= n; setS(a[0], a[1], A.n > 0 ? A : null); return; }
    if (a[0] === 'hot' && a[1] === 3) { if (B && !(B.t === 'soin' && B.k === A.k)) { C.toast('CASE OCCUPÉE'); return; } P.heals[A.k] = 0; setS(b[0], b[1], B ? { t: 'soin', k: A.k, n: B.n + A.n } : A); C.hudRefresh(); return; }
    if (a[0] === 'hot' && B && B.t !== 'arme') { C.toast('CASE OCCUPÉE'); return; }
    if (B && A.t === 'soin' && B.t === 'soin' && A.k === B.k && !(a[0] === b[0] && a[1] === b[1])) { B.n += A.n; setS(a[0], a[1], null); return; }
    setS(b[0], b[1], A); setS(a[0], a[1], B); }
  function bagDraw() { var d = document.getElementById('sBag'); if (!d || d.hidden) return; var sel = BSEL ? getS(BSEL[0], BSEL[1]) : null;
    var h = '<div class="box"><div class="hd"><b>' + (OPENC ? '📦 COFFRE' : '🎒 SAC') + '</b><span>' + (sel ? itName(sel) : 'Touche un objet, puis une case pour le déplacer') + '</span><button type="button" class="x">✕</button></div>';
    if (OPENC) { h += '<div class="gr">'; for (var i = 0; i < NB; i++) h += slotHTML('ch', i); h += '</div><div class="sep">🎒 TON SAC</div>'; }
    h += '<div class="gr">'; for (i = 0; i < NB; i++) h += slotHTML('bag', i); h += '</div><div class="sep">BARRE</div><div class="gr hot">'; for (i = 0; i < 4; i++) h += slotHTML('hot', i); h += '</div>';
    h += '<div class="ac">' + (sel && (sel.t === 'lit' || sel.t === 'coffre') && BSEL[0] === 'bag' ? '<button type="button" class="pose">POSER</button>' : '') + (sel && (sel.t === 'arme' || sel.t === 'soin') ? '<button type="button" class="drop">JETER</button>' : '') + '</div></div>';
    d.innerHTML = h;
    d.querySelectorAll('.bs').forEach(function (b) { var src = b.dataset.s, i = +b.dataset.i; drawIt(b.querySelector('canvas'), getS(src, i));
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); if (!BSEL) { if (getS(src, i)) BSEL = [src, i]; } else { if (!(BSEL[0] === src && BSEL[1] === i)) moveSlot(BSEL, [src, i]); BSEL = null; } C.tone('triangle', 700, 900, .04, .04); bagDraw(); }); });
    d.querySelector('.x').addEventListener('pointerdown', function (e) { e.preventDefault(); bag(false); });
    var po = d.querySelector('.pose'); if (po) po.addEventListener('pointerdown', function (e) { e.preventDefault(); PLACEK = sel.t; PLACEI = BSEL[1]; BSEL = null; bag(false); setTool('place'); C.toast('VISE ET TIRE POUR POSER ' + (PLACEK === 'lit' ? 'LE LIT' : 'LE COFFRE')); });
    var dr = d.querySelector('.drop'); if (dr) dr.addEventListener('pointerdown', function (e) { e.preventDefault(); var P = me(), a = C.camA(), x = P.x + Math.cos(a) * 2.6, z = P.z + Math.sin(a) * 2.6;
      if (sel.t === 'arme') { var sl = C.newSlot(sel.k); sl.mag = sel.mag; sl.res = sel.res; C.dropItem(x, z, sel.k, sl); } else { for (var q = 0; q < sel.n; q++) C.dropItem(x + q * .5, z, sel.k); if (BSEL[0] === 'hot') P.heals[sel.k] = 0; }
      setS(BSEL[0], BSEL[1], null); BSEL = null; bagDraw(); }); }
  function bag(on) { var d = document.getElementById('sBag'); if (!d) { d = document.createElement('div'); d.id = 'sBag'; d.hidden = true; document.body.appendChild(d); }
    BAGON = on == null ? !BAGON : !!on; if (!BAGON) OPENC = null; BSEL = null; d.hidden = !BAGON; if (BAGON) { if (document.pointerLockElement) document.exitPointerLock(); bagDraw(); } }
  // coffres posés
  function chestMesh() { var m = C.lootModel('chest'); if (!m) { m = new T.Mesh(new T.BoxGeometry(1.2, .8, .8), new T.MeshLambertMaterial({ color: '#8a5a2e' })); m.geometry.translate(0, .4, 0); } m.userData.dyn = true; m.castShadow = true; return m; }
  function placeStor(x, z, y, a, items) { var c = { x: x, z: z, y: y, a: a, items: items || Array(NB).fill(null) }; c.m = chestMesh(); c.m.position.set(x, y, z); c.m.rotation.y = -a + Math.PI / 2; C.scene.add(c.m); c.col = { x: x, z: z, y: y, r: .6, h: .9 }; C.PCOL.push(c.col); STOR.push(c); return c; }
  function removeStor(c) { var i = STOR.indexOf(c); if (i >= 0) STOR.splice(i, 1); C.scene.remove(c.m); var k = C.PCOL.indexOf(c.col); if (k >= 0) C.PCOL.splice(k, 1); }
  function nearStor() { var P = me(), b = null, bd = 2.6; STOR.forEach(function (c) { var d = Math.hypot(c.x - P.x, c.z - P.z); if (d < bd && Math.abs(c.y - P.y) < 2) { bd = d; b = c; } }); return b; }
  function placePlan() { var P = me(), a = C.camA(), x = P.x + Math.cos(a) * 2.4, z = P.z + Math.sin(a) * 2.4; return { t: PLACEK, x: x, z: z, L: Math.max(C.hgt(x, z), groundAt(x, z, P.y + .5)), d: a }; }
  function placeItem() { var p = placePlan(); if (PLACEI < 0 || !BAG[PLACEI] || BAG[PLACEI].t !== PLACEK) { setTool(null); return; }
    if (PLACEK === 'lit') { if (BED) { bagAdd({ t: 'lit' }); } BED = { x: p.x, z: p.z, y: p.L, a: p.d }; showBed(); C.toast('🛏 LIT POSÉ : TU RÉAPPARAÎTRAS ICI'); }
    else { placeStor(p.x, p.z, p.L, p.d); C.toast('📦 COFFRE POSÉ · APPROCHE-TOI POUR L\'OUVRIR'); }
    BAG[PLACEI] = null; PLACEI = -1; PLACEK = null; setTool(C.SURV ? 'pioche' : null); C.tone('triangle', 420, 640, .09, .07); save(); }

  /* ---------------- CRÉATIF : armurerie au point de départ, les armes réapparaissent à l'infini ---------------- */
  var ARM = null;
  function armory() { var T0 = C.TOWNS[0], cx = T0[1] + 10, cz = T0[2] - 8, K = ['pompe', 'pompeS', 'smg', 'fusil', 'sniper', 'shield', 'shield', 'heal']; ARM = [];
    var g = new T.Group(), dark = new T.MeshLambertMaterial({ color: '#241a34' }), neon = new T.MeshBasicMaterial({ color: '#ff2bd6' }), gold = new T.MeshPhongMaterial({ color: '#ffd23d', shininess: 80 });
    var base = new T.Mesh(new T.BoxGeometry(18, .3, 7), dark); base.position.set(cx, C.hgt(cx, cz) + .15, cz); g.add(base);
    K.forEach(function (k, i) { var x = cx - 7.7 + i * 2.2, z = cz, y = C.hgt(x, z); var pd = new T.Mesh(new T.CylinderGeometry(.55, .65, .9, 12), dark); pd.position.set(x, y + .45, z); g.add(pd); var rg = new T.Mesh(new T.TorusGeometry(.6, .05, 6, 20), k === 'sniper' ? gold : neon); rg.rotation.x = Math.PI / 2; rg.position.set(x, y + .9, z); g.add(rg); ARM.push({ k: k, x: x, z: z + 1.6, it: null, t: 0 }); });
    var cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; var c2 = cv.getContext('2d'); c2.fillStyle = '#0c0614'; c2.fillRect(0, 0, 512, 128); c2.strokeStyle = '#ff2bd6'; c2.lineWidth = 6; c2.shadowColor = '#ff2bd6'; c2.shadowBlur = 20; c2.strokeRect(8, 8, 496, 112); c2.font = '900 64px Arial Black, Arial'; c2.textAlign = 'center'; c2.fillStyle = '#fff'; c2.fillText('ARMURERIE', 256, 88);
    var tx = new T.CanvasTexture(cv); tx.encoding = T.sRGBEncoding; var sg = new T.Mesh(new T.PlaneGeometry(9, 2.25), new T.MeshBasicMaterial({ map: tx })); sg.position.set(cx, C.hgt(cx, cz) + 4.2, cz - 1.5); g.add(sg);
    [-9, 9].forEach(function (dx) { var po = new T.Mesh(new T.BoxGeometry(.3, 4.5, .3), dark); po.position.set(cx + dx * .5, C.hgt(cx, cz) + 2.25, cz - 1.5); g.add(po); });
    g.traverse(function (o) { o.userData.dyn = true; }); C.scene.add(g); }
  function armoryTick(dt) { if (!ARM || !C.items) return; var L = C.items(); ARM.forEach(function (a) { if (a.it && L.indexOf(a.it) >= 0) return; a.t += dt; if (a.t < 1.5) return; a.t = 0; C.dropItem(a.x, a.z, a.k); a.it = L[L.length - 1]; }); }

  /* ---------------- maisons à moitié détruites (la guerre contre les zombies) + gravats ---------------- */
  var RUINS = null;
  function ruins() {   // mêmes murs cassés à chaque partie (tirés au sort une fois), toits effondrés, tas de gravats
    var r = rng(777), list = [];
    C.HOUSES.forEach(function (hs) { var ws = hs.walls.filter(function (w) { return !w.lintel; }); if (!ws.length) return; var nb = 1 + (r() * Math.min(3, ws.length - 1) | 0);
      for (var i = 0; i < nb; i++) { var w = ws[r() * ws.length | 0]; if (list.indexOf(w) < 0) list.push(w); } if (r() < .35) hs.walls.forEach(function (w) { if (w.lintel && list.indexOf(w) < 0 && r() < .6) list.push(w); }); });
    RUINS = list;
    if (!RUBBLE) { var n = list.length * 6, g = new T.DodecahedronGeometry(.4, 0); RUBBLE = new T.InstancedMesh(g, new T.MeshLambertMaterial({ color: '#ffffff' }), n); RUBBLE.userData.dyn = true; RUBBLE.castShadow = true; RUBBLE.receiveShadow = true; RUBBLE.frustumCulled = false;
      var o = new T.Object3D(), c = new T.Color(), k = 0; list.forEach(function (w) { for (var j = 0; j < 6; j++) { var along = (r() - .5) * 2, x = w.x + (w.hw > w.hd ? along * w.hw : (r() - .5) * 2.2), z = w.z + (w.hd > w.hw ? along * w.hd : (r() - .5) * 2.2);
        o.position.set(x, C.hgt(x, z) + .1, z); o.rotation.set(r() * 3, r() * 3, r() * 3); var sc = .5 + r() * 1.1; o.scale.set(sc * (1 + r()), sc * .6, sc); o.updateMatrix(); RUBBLE.setMatrixAt(k, o.matrix); RUBBLE.setColorAt(k, c.set(C.MATS[w.m] ? C.MATS[w.m].col : '#8a7a6a').multiplyScalar(.75 + r() * .3)); k++; } });
      C.scene.add(RUBBLE); }
    return list; }
  function applyRuins(extra) { (RUINS || ruins()).concat(extra || []).forEach(function (w) { if (!w || !w.alive) return; w.alive = false; C.setWall(w, false); if (w.house) w.house.broken++; }); }

  /* ---------------- sauvegarde de la survie (sur le téléphone : localStorage) ---------------- */
  var SKEY = 'wr_survie_v1';
  function save() { if (!C.SURV || C.CREA || C.state() !== 'play') return; var P = me(); try {
      var hw = []; C.WALLS.forEach(function (w, i) { if (!w.build && !w.alive && RUINS && RUINS.indexOf(w) < 0) hw.push(i); });
      var d = { v: 1, t: TIME, day: C.dayT ? C.dayT() : 0, res: RES, bed: BED, p: { x: P.x, z: P.z, y: P.y, hp: P.hp, sh: P.sh || 0 },
        inv: P.inv.map(function (w) { return w ? { k: w.k, mag: w.mag, res: w.res } : null; }), heals: P.heals,
        pieces: PIECES.map(function (q) { return [q.t, q.m, q.x, q.z, q.L, q.d, q.key, q.hp, q.hw, q.hd, q.v || 0]; }),
        trees: C.TREES.map(function (t, i) { return t.gone ? i : t.cut ? -i - 1 : null; }).filter(function (v) { return v != null; }),
        harv: HARV().map(function (it, i) { return it.dead ? i : -1; }).filter(function (i) { return i >= 0; }),
        nodes: NODES.map(function (n, i) { return n.dead ? i : -1; }).filter(function (i) { return i >= 0; }),
        wrecks: WRECKS.filter(function (w) { return w.dead; }).map(function (w) { return w.id; }), walls: hw,
        zdead: window.ZOMB && ZOMB.on ? ZOMB.deadIds() : [], bag: BAG, stor: STOR.map(function (c) { return [c.x, c.z, c.y, c.a, c.items]; }) };
      localStorage.setItem(SKEY, JSON.stringify(d)); var fd = C.fogData && C.fogData(); if (fd) localStorage.setItem(SKEY + '_fog', fd); if (el.saveI) { el.saveI.classList.remove('on'); void el.saveI.offsetWidth; el.saveI.classList.add('on'); } } catch (e) { console.warn('sauvegarde', e); } }
  function loadSave() { try { var d = JSON.parse(localStorage.getItem(SKEY) || 'null'); return d && d.v === 1 ? d : null; } catch (e) { return null; } }
  function applySave(d) { var P = me(); TIME = d.t || 0; RES = d.res || RES; BED = d.bed || null; showBed();
    if (d.bag) { bagInit(); d.bag.forEach(function (it, i) { if (i < NB) BAG[i] = it; }); } (d.stor || []).forEach(function (q) { placeStor(q[0], q[1], q[2], q[3], q[4]); }); if (C.setDay && d.day) C.setDay(d.day);
    if (d.p) { P.x = d.p.x; P.z = d.p.z; P.y = P.gy = Math.max(C.hgt(P.x, P.z), d.p.y || 0); P.hp = Math.max(30, d.p.hp || 100); P.sh = d.p.sh || 0; }
    if (d.inv) d.inv.forEach(function (w, i) { if (w && C.WEAPONS[w.k]) { var sl = C.newSlot(w.k); sl.mag = w.mag; sl.res = w.res; P.inv[i] = sl; } });
    if (d.heals) Object.keys(d.heals).forEach(function (k) { P.heals[k] = d.heals[k]; });
    (d.pieces || []).forEach(function (q) { var p = { t: q[0], m: q[1], x: q[2], z: q[3], L: q[4], d: q[5], key: q[6], hw: q[8], hd: q[9], v: q[10] || null, hp: q[7] }; if (placePiece(p)) { (p.ws || []).forEach(function (w) { w.hp = q[7]; }); } });
    (d.trees || []).forEach(function (v) { var t = C.TREES[v >= 0 ? v : -v - 1]; if (!t || !t.d3) return; fellQuiet(t); if (v >= 0) { t.gone = true; STUMPL.splice(STUMPL.indexOf(t), 1); } }); stumpsRefresh();
    var H2 = HARV(); (d.harv || []).forEach(function (i) { if (H2[i] && window.PROPS) { PROPS.harvBreak(H2[i]); H2[i].t = 0; } });
    (d.nodes || []).forEach(function (i) { var n = NODES[i]; if (n) { n.dead = true; n.t = 0; nodeSet(n); var ci = C.PCOL.indexOf(n.col); if (ci >= 0) C.PCOL.splice(ci, 1); } });
    LOADED = d; }
  function fellQuiet(t) { t.cut = true; t.cutT = 0; t.r0 = t.r; t.h0 = t.h; t.r = 0; t.h = -99; if (window.TREES3D && TREES3D.cut) TREES3D.cut(t, false); STUMPL.push(t); }

  /* ---------------- petit écran d'explication des commandes au début ---------------- */
  function intro() { if (!C.SURV) { var nI = 0; try { nI = +localStorage.getItem('wr_introBR') || 0; localStorage.setItem('wr_introBR', nI + 1); } catch (e) {} if (nI >= 3) return; }   // en Battle Royale : seulement les 3 premières fois
    var d = document.getElementById('sIntro'); if (!d) { d = document.createElement('div'); d.id = 'sIntro'; document.body.appendChild(d); }
    var tc = C.isTouch, row = function (k, t) { return '<div class="r"><b>' + k + '</b><span>' + t + '</span></div>'; };
    d.innerHTML = '<div class="box"><h2>' + (C.CREA ? '🎨 CRÉATIF · TERRES SAUVAGES' : C.SURV ? '🧟 SURVIE · TERRES SAUVAGES' : C.BUILD ? '⚔️ BATTLE ROYALE' : '🛡️ ZÉRO CONSTRUCTION') + '</h2>' + (C.CREA ? '<p>Matériaux illimités, construis ce que tu veux. Les armes de l\'armurerie reviennent à l\'infini.</p>' : C.SURV ? '<p>Le monde est envahi de zombies. Récupère des matériaux, construis ta base, pose ton lit… et tue-les tous.</p>' : C.BUILD ? '<p>Pioche, matériaux et constructions !</p>' : '<p>Pas de constructions : utilise la bulle bouclier pour te protéger.</p>') +
      '<div class="g">' + (tc ? row(IC.pioche, 'Bouton pioche (en haut) puis le bouton de TIR pour frapper') + row(IC.build, 'Bouton construire puis le bouton de TIR pour poser la pièce') + row('🧱', 'Choisis MUR, SOL, ESCALIER, TOIT' + ' en bas, et la matière à droite')
        : row(KN('pioche'), 'Pioche · clic gauche pour frapper') + row(KN('construire'), 'Construire · clic gauche pour poser') + row(KN('mur') + '–' + KN('toit'), 'Mur, sol, escalier, toit') + row(KN('materiau'), 'Changer de matière (bois, pierre, métal)') + row(KN('sprint'), 'Sprinter · ' + KN('sauter') + ' contre un mur pour grimper')) + row(tc ? '✏️' : KN('editer'), 'Éditer un de tes murs : porte, fenêtre, 2 fenêtres…') +
      row('🪵', 'Arbres et cactus = bois · souche arrachée = l\'arbre ne repousse plus') + row('🧱', 'Rochers et murs en brique = pierre') + row('⛓', 'Carcasses de voitures, tracteur' + (C.SURV ? ', minerai bleu' : '') + ' = métal') + (C.SURV ? row('🎒', 'Sac de 20 places : ton lit et tes coffres sont dedans, touche POSER') + row('🛏', 'Pose ton lit chez toi = ton point de réapparition') + row('📦', 'Casse un coffre à la pioche pour le garder et ranger tes affaires') + row('💾', 'Sauvegarde automatique sur ton téléphone') : '') +
      '</div><button type="button" id="sIntroGo">C\'EST PARTI</button><div class="bar"><i></i></div></div>';
    d.hidden = false; var close = function () { d.hidden = true; }; d.querySelector('#sIntroGo').addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); close(); }); setTimeout(close, C.SURV ? 15000 : 10000); }

  function KN(a) { try { return window.keyName(window.BIND[a]); } catch (e) { return a; } }
  window.SURVIE = {
    init: function (THREE, ctx) { T = THREE; C = ctx; ZERO = new T.Matrix4().makeScale(0, 0, 0); GEO.esc = rampGeo(); GEO.toit = roofGeo(); C.groundAt = groundAt;
      if (C.SURV) genNodes(); ui();
      if (C.SURV && !C.CREA && window.ZOMB) ZOMB.init(T, C, function (z) { var n = ZOMB.left(); C.toast(n ? '🧟 ZOMBIE ÉLIMINÉ · ENCORE ' + n : '🏆 TOUS LES ZOMBIES SONT MORTS ! LE MONDE EST LIBRE'); });
      if (C.SURV) { addEventListener('pagehide', save); document.addEventListener('visibilitychange', function () { if (document.hidden) save(); }); }
      if (C.SURV && T.GLTFLoader && window.LOOT3D) new T.GLTFLoader().load('models/bedSingle.glb', function (g) { try { BEDTPL = LOOT3D.bake(T, g.scene, { size: 2.3, col: {} }); showBed(); } catch (e) { console.error(e); } });
      var L = window.LOOT3D, GL = T.GLTFLoader ? new T.GLTFLoader() : null, left = NDEF.length + 1, tpl = [], stp = null;
      function done() { if (--left > 0) return; try { buildNodes(tpl); buildStumps(stp); READY = true; } catch (e) { console.error('SURVIE', e); } }
      if (!GL || !L || !L.bake) { left = 1; done(); return; }
      NDEF.forEach(function (d, i) { GL.load('models/survie/' + d.f + '.glb', function (g) { try { tpl[i] = L.bake(T, g.scene, d); } catch (e) { console.error(e); } done(); }, null, done); });
      GL.load('models/nature/q_TreeStump.glb', function (g) { try { stp = L.bake(T, g.scene, { size: 1.3, col: {} }); } catch (e) { console.error(e); } done(); }, null, done); },
    reset: function () { RES = { bois: 0, pierre: 0, metal: 0 }; TIME = 0; BED = null; bagInit(); if (C.SURV) BAG[0] = { t: 'lit' }; if (C.CREA) { BAG[1] = { t: 'coffre' }; BAG[2] = { t: 'coffre' }; BAG[3] = { t: 'coffre' }; me().heals.shield = 2; }   // créatif : 2 shields de base, constructions illimitées STOR.slice().forEach(removeStor); bag(false); PIECES.slice().forEach(function (p) { removePiece(p, false); }); setTool(C.SURV ? 'pioche' : null); hudRes();
      if (el.tools) el.tools.hidden = false;
      NODES.forEach(function (n) { if (n.dead) { n.dead = false; if (C.PCOL.indexOf(n.col) < 0) C.PCOL.push(n.col); } n.hp = n.max; n.shk = 0; nodeSet(n); });
      STUMPL.forEach(function (t) { regrow(t); }); STUMPL = []; C.TREES.forEach(function (t) { t.hp = null; t.gone = false; t.shp = null; });
      HARV().forEach(function (it) { if (it.dead || it.hp !== it.hp0) PROPS.harvBack(it); });
      WRECKS.forEach(function (w) { if (w.dead || w.hp !== w.hp0) backWreck(w); });
      if (C.SURV) { applyRuins(); var d = C.CREA ? null : loadSave(); if (C.fogLoad) { var fu = null; try { fu = d ? localStorage.getItem(SKEY + '_fog') : null; } catch (e) {} C.fogLoad(fu); } if (d) { applySave(d); applyRuins((d.walls || []).map(function (i) { return C.WALLS[i]; })); (d.wrecks || []).forEach(function (id) { var w = WRECKS.filter(function (q) { return q.id === id; })[0]; if (w) breakWreck(w, false); }); }
        if (window.ZOMB && ZOMB.on) ZOMB.reset(d ? d.zdead : []); showBed(); }
      stumpsRefresh(); hudRes(); hudBuild(); setTimeout(function () { if (C.state() === 'play') intro(); }, 60); saveT = 0; },
    respawn: function () { var P = me(); P.hp = 100; P.sh = 0; P.vx = P.vz = P.vy = 0; if (P.veh) return false;
      if (BED) { P.x = BED.x + Math.cos(BED.a + 1.57) * 1.4; P.z = BED.z + Math.sin(BED.a + 1.57) * 1.4; C.toast('🛏 TU TE RÉVEILLES DANS TON LIT'); }
      else { var T0 = C.TOWNS[0]; P.x = T0[1] + 3; P.z = T0[2] + 6; ['bois', 'pierre', 'metal'].forEach(function (k) { RES[k] = Math.floor(RES[k] / 2); }); hudRes(); C.toast('☠ TU ES MORT · PAS DE LIT : RETOUR AU CAMP (MOITIÉ DES MATÉRIAUX PERDUE)'); }
      P.y = P.gy = Math.max(C.hgt(P.x, P.z), groundAt(P.x, P.z, (BED ? BED.y : 0) + 1)); C.noise(.8, .2, 300); save(); return true; },
    nowPlaying: function (n) { if (!el.now) return; el.now.textContent = '🎵 ' + n; el.now.classList.add('on'); setTimeout(function () { el.now.classList.remove('on'); }, 5000); },
    bag: function (on) { bag(on); }, bagOpen: function () { return BAGON; }, bagAdd: bagAdd, act: act,
    save: save, hasSave: function () { return !!loadSave(); }, wipe: function () { try { localStorage.removeItem(SKEY); localStorage.removeItem(SKEY + '_fog'); } catch (e) {} },
    update: function (dt) { TIME += dt; var P = me(); if (P && P.model && P === me()) attachPick(P.model);
      if (PICK) PICK.visible = TOOL === 'pioche' && P.alive && !(P.danceT > 0);
      // arbres qui tremblent, rochers qui reviennent, arbres qui repoussent
      C.TREES.forEach(function (t) { if (t.shk > 0) { t.shk = Math.max(0, t.shk - dt); if (window.TREES3D && TREES3D.shake) TREES3D.shake(t, t.shk > 0 ? Math.sin(t.shk * 70) * t.shk * .5 : 0); } });
      NODES.forEach(function (n) { if (n.shk > 0) { n.shk = Math.max(0, n.shk - dt); nodeSet(n); } if (n.dead) { n.t += dt; if (n.t > 240 && Math.hypot(n.x - P.x, n.z - P.z) > 40) { n.dead = false; n.hp = n.max; C.PCOL.push(n.col); nodeSet(n); } } });
      for (var i = STUMPL.length - 1; i >= 0; i--) { var t = STUMPL[i]; t.cutT += dt; if (t.cutT > 300 && Math.hypot(t.x - P.x, t.z - P.z) > 50) { regrow(t); STUMPL.splice(i, 1); stumpsRefresh(); } }   // souche gardée = l'arbre repousse
      HARV().forEach(function (it) { if (it.shk > 0) { it.shk = Math.max(0, it.shk - dt); if (!it.dead) PROPS.harvSet(it, true); } if (it.dead) { it.t = (it.t || 0) + dt; if (it.t > 300 && Math.hypot(it.x - P.x, it.z - P.z) > 60) PROPS.harvBack(it); } });
      if (!WRK && C.cars) WRK = buildWrecks(); if ((TICK += dt) > .5) { TICK = 0; wreckVis(); if (C.SURV) { saveT += .5; if (saveT > 20) { saveT = 0; save(); } } }
      if (window.ZOMB && ZOMB.on) ZOMB.update(dt, C.isNight && C.isNight());
      if (el.open) { var ns = C.SURV && P.alive && !BAGON ? nearStor() : null; if (!!ns === el.open.hidden) el.open.hidden = !ns; }
      if (C.CREA) { if (!ARM) armory(); armoryTick(dt); }
      if (C.SURV) { if (!BUT) critters(); crittersTick(dt); if (NIM.MET && Math.hypot(P.x - PACKP.x, P.z - PACKP.z) > 40) nodePack(P.x, P.z); }
      PIECES.slice().forEach(function (p) { if (p.ws && p.ws.some(function (w) { return !w.alive; })) removePiece(p, true); });   // un morceau cassé = tout le mur tombe
      if (PLACE_CD > 0) PLACE_CD -= dt;
      if (TOOL === 'place' && P.alive && P.mode === 'ground') ghostShow(placePlan(), true);
      else if (TOOL === 'build' && P.alive && P.mode === 'ground' && C.state() === 'play') { var p = plan(), ok = !taken(p.key, p) && (C.CREA || RES[p.t === 'lit' ? 'bois' : MATK] >= cost(p.t)); ghostShow(taken(p.key, p) ? null : p, ok); } else ghostShow(null);
      if (SW.t >= 0) { SW.t += dt; if (!SW.hit && SW.t >= .27) { SW.hit = true; strike(); } if (SW.t >= .5) SW.t = -1; } },
    use: function (held, dt) {
      if (TOOL === 'pioche') { if (held && SW.t < 0) { SW.t = 0; SW.hit = false; C.noise(.12, .05, 1800); } }
      else if (TOOL === 'place' && held && PLACE_CD <= 0) { PLACE_CD = .4; placeItem(); }
      else if (TOOL === 'build' && held && PLACE_CD <= 0) { PLACE_CD = .2; var p = plan(); if (taken(p.key, p)) return; var mk = p.t === 'lit' ? 'bois' : MATK, cs = cost(p.t);
        if (!C.CREA && RES[mk] < cs) { C.toast('PAS ASSEZ DE ' + NAME[mk] + ' (' + cs + ')'); PLACE_CD = .8; return; }
        if (placePiece(p)) { if (!C.CREA) RES[mk] -= cs; hudRes(); hudBuild(); C.tone('triangle', 420, 640, .09, .07); C.noise(.08, .1, 1200); } } },
    groundAt: groundAt,
    pose: function (o, c, ok) {   // bras qui tiennent la pioche / le plan de construction
      if (!TOOL || !ok) return; var th;
      if (TOOL === 'pioche') { var t = SW.t; th = t < 0 ? .55 : t < .2 ? .55 + (2.6 - .55) * (t / .2) : t < .3 ? 2.6 - (2.6 + .1) * ((t - .2) / .1) : -.1 + (.65) * ((t - .3) / .2);
        o.ra = th; o.rb = .12; o.rw = 0; o.re = 0; o.la = th + .05; o.lb = -.42; o.lw = .3; o.le = .15; o.bp = (o.bp || 0) + (t >= .2 && t < .36 ? .18 : t >= 0 && t < .2 ? -.06 : 0); }
      else { o.ra = .95; o.rb = .1; o.re = .5; o.rw = .2; o.la = .95; o.lb = -.25; o.le = .5; o.lw = .4; } },
    blendK: function () { return TOOL === 'pioche' ? 30 : 12; },
    tool: function () { return TOOL; }, setTool: setTool,
    toolName: function () { if (TOOL === 'place') return 'Poser ' + (PLACEK === 'lit' ? 'le LIT 🛏' : 'le COFFRE 📦') + ' · tire pour poser'; return TOOL === 'pioche' ? 'Pioche ⛏ · arbres = bois, rochers = pierre, carcasses = métal' : PIECE === 'lit' ? 'Construire 🔨 · LIT (30 bois) = réapparition' : 'Construire 🔨 · ' + PNAME[PIECE] + ' en ' + NAME[MATK].toLowerCase() + ' (' + COST + ')'; },
    timeStr: function () { var s = Math.floor(TIME); return (s >= 60 ? Math.floor(s / 60) + ' min ' : '') + (s % 60) + ' s'; },
    hudLine: function () { var s = Math.floor(TIME), zl = window.ZOMB && ZOMB.on ? ' · 🧟 ' + ZOMB.left() + '/' + ZOMB.total() : ''; return (C.isNight && C.isNight() ? '🌙 ' : '☀️ ') + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + zl; },
    time: function () { return TIME; },
    res: function () { return RES; }, _sw: function (t) { SW.t = t; SW.hit = true; }, _strike: function () { strike(); }, _build: function (t, mk) { PIECE = t; MATK = mk || MATK; PLACE_CD = 0; var tl = TOOL; TOOL = 'build'; this.use(true, 0); TOOL = tl; }, give: function (k, n) { RES[k] += n; hudRes(); hudBuild(); }, pieces: function () { return PIECES; }, nodes: function () { return NODES; }, ready: function () { return READY; }
  };
  function regrow(t) { t.cut = false; t.r = t.r0 || t.r || .5; t.h = t.h0 || t.h || 6; t.hp = null; if (window.TREES3D && TREES3D.cut) TREES3D.cut(t, true); }
})();
