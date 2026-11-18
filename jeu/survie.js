/* Wald Royal : mode SURVIE (carte « Terres Sauvages »).
   - Pioche : on casse les arbres (bois), les rochers (pierre) et le minerai (métal + un peu de pierre). Les murs des cabanes donnent aussi des matériaux.
   - Constructions façon Fortnite sur une grille de 4 m : MUR, SOL, ESCALIER, TOIT (chapeau), en bois, pierre ou métal (10 matériaux par pièce).
   - Les arbres abattus laissent une souche et repoussent au bout de 5 min ; les rochers reviennent au bout de 4 min (quand on n'est pas à côté).
   Branché par index.html : SURVIE.init(THREE, ctx), reset(), update(dt), use(tir, dt), groundAt(x, z, y), pose(T, perso, ok), tool(), setTool(), hudLine().
   Modèles : Quaternius (CC0) dans models/survie/ (rochers, minerai) et models/nature/q_TreeStump.glb. */
(function () {
  var T, C, READY = false, CELL = 5, LH = 3.5, COST = 10;   // pièces 5 m × 3,5 m (proportions 4 × 2,8 demandées ; Fortnite = 5,12 × 3,84)
  var RES = { bois: 0, pierre: 0, metal: 0 }, TOOL = null, PIECE = 'mur', MATK = 'bois', TIME = 0;
  var MATW = { bois: 'bois', pierre: 'brique', metal: 'metal' }, WTH = .07;   // demi-épaisseur des murs : 14 cm comme Fortnite (avant 28 cm)   // matériau de mur (MATS d'index.html)
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
    esc: SV('<path d="M4 40 L36 10 L44 16 L12 44 Z" fill="#c98a4a" stroke="#4a2a14" stroke-width="2" stroke-linejoin="round"/><path d="M10 34 L40 13 M16 39 L43 18 M7 37 L38 11" stroke="#4a2a14" stroke-width="1.2" opacity=".6"/><path d="M12 44 L44 16 L44 20 L13 47 Z" fill="#8a5a2e" stroke="#4a2a14" stroke-width="1.4"/>'),
    toit: SV('<path d="M24 6 L44 34 L24 42 L4 34 Z" fill="#c98a4a" stroke="#4a2a14" stroke-width="2" stroke-linejoin="round"/><path d="M24 6v36" stroke="#4a2a14" stroke-width="1.6"/><path d="M24 6 L44 34 L24 42 Z" fill="#000" opacity=".22"/>'),
    lit: SV('<rect x="5" y="22" width="38" height="11" rx="3" fill="#e8e2f0" stroke="#3a2a4a" stroke-width="2"/><rect x="5" y="24" width="24" height="9" rx="2" fill="#c43a6a"/><rect x="31" y="17" width="12" height="9" rx="3" fill="#fff" stroke="#3a2a4a" stroke-width="1.6"/><path d="M5 14v28M43 18v24" stroke="#5a3a20" stroke-width="3.5" stroke-linecap="round"/>') };
  var HPP = { bois: 150, pierre: 300, metal: 500 };   // vie MAX comme Fortnite (mur) ; sols / escaliers / toits un peu moins
  var HP0 = { bois: 90, pierre: 99, metal: 110 }, HPT = { bois: 4, pierre: 11.5, metal: 24.5 };
  /* PEINTURES de la favela (outil « Maison favela » du Créatif) : murs en crépi peint, solides comme la pierre */
  var FAVC = ['#e85a4a', '#f2b33a', '#4ab0d8', '#7acb5a', '#e87ab8', '#9a6ae0', '#f08a3a', '#3ac8b0']; FAVC.forEach(function (c, i) { var k = 'pc' + i; MATW[k] = 'peint'; HPP[k] = 300; HP0[k] = 99; HPT[k] = 11.5; });   // vie au départ + temps pour finir de se construire (la vie monte petit à petit)
  function hpMax(p) { var m = HPP[p.m] || 150; return p.t === 'mur' ? m : Math.round(m * (p.m === 'bois' ? 140 / 150 : p.m === 'pierre' ? 280 / 300 : 460 / 500)); }
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
    function ok(x, z, m) { if ((window.NOSPAWN && NOSPAWN(x, z)) || !C.onLand(x, z) || C.inTown(x, z, 8) || C.nearRoad(x, z, 3.5)) return false; if (C.LAKE && Math.hypot(x - C.LAKE[0], z - C.LAKE[1]) < C.LAKE[2] * 1.45 + 4) return false;
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
  /* prise à deux mains : pour chaque angle du bras droit, angles des deux bras calculés pour que la main gauche tienne le manche 24 cm au-dessus de la droite */
  var GRIP = [[-.1, -.5, 1.4, 0, -.6, -.8, .15], [.55, 0, 1.1, .4, -.4, .4, .15], [1.0, .5, 1.2, .5, -.2, .7, .15], [1.6, .5, .7, 1.2, -.9, .4, 0], [2.2, .5, .7, 1.1, -1.3, 1, .3]];
  function pickGrip(th) { var i = 0; while (i < GRIP.length - 2 && th > GRIP[i + 1][0]) i++; var A = GRIP[i], B = GRIP[i + 1], k = Math.max(0, Math.min(1, (th - A[0]) / (B[0] - A[0]))), r = [];
    for (var j = 1; j < 7; j++) r.push(A[j] + (B[j] - A[j]) * k); return r; }
  var BOOK = null;
  function buildBook() {   // « cahier de construction » : un plan bleu quadrillé, tenu dans la main gauche quand on construit
    var cv = document.createElement('canvas'); cv.width = cv.height = 128; var x = cv.getContext('2d'); x.fillStyle = '#1d5fd6'; x.fillRect(0, 0, 128, 128); x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 1;
    for (var i = 8; i < 128; i += 15) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 128); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(128, i); x.stroke(); }
    x.strokeStyle = '#fff'; x.lineWidth = 3; x.strokeRect(22, 30, 84, 60); x.beginPath(); x.moveTo(22, 30); x.lineTo(64, 12); x.lineTo(106, 30); x.stroke(); x.strokeRect(54, 62, 20, 28);
    var tx = new T.CanvasTexture(cv), cover = new T.MeshLambertMaterial({ map: tx }), page = new T.MeshLambertMaterial({ color: '#f4f1e6' }), g = new T.Group();
    var b = new T.Mesh(new T.BoxGeometry(.05, .3, .38), [page, page, page, page, cover, cover]); b.rotation.y = Math.PI / 2; g.add(b);
    var c2 = new T.Mesh(new T.BoxGeometry(.012, .31, .39), cover); c2.position.set(-.03, 0, 0); g.add(c2);
    g.traverse(function (m) { if (m.isMesh) m.castShadow = true; }); g.visible = false; return g; }
  function attachBook(c) { if (!BOOK) BOOK = buildBook(); var par = c.eL || c.aL; if (BOOK.parent !== par) { if (BOOK.parent) BOOK.parent.remove(BOOK); par.add(BOOK); BOOK.position.set(.12, c.eL ? -.36 : -.66, .06); BOOK.rotation.set(0, 0, -.9); } }
  function attachPick(c) { if (!PICK) PICK = buildPick(); if (PICK.parent !== c.aR) { if (PICK.parent) PICK.parent.remove(PICK); c.aR.add(PICK); } }

  /* ---------------- constructions ---------------- */
  function rampGeo() {   // escalier = UNE planche en pente (comme Fortnite) : de 0 à LH sur une case, sans jupe ni bloc dessous
    var L = Math.hypot(CELL, LH), th = .15, a = Math.atan2(LH, CELL), g = new T.BoxGeometry(L, th, CELL - .06); g.rotateZ(a); g.translate(Math.sin(a) * th / 2, LH / 2 - Math.cos(a) * th / 2, 0); g.computeVertexNormals(); return g; }
  /* UV « posées » sur chaque pente : les planches restent droites et à la bonne taille sur chaque face du toit (avant : texture du cône tordue vers la pointe) */
  function slopeUV(g) { g = g.index ? g.toNonIndexed() : g; var P = g.attributes.position, uv = [], A = new T.Vector3(), B = new T.Vector3(), Cc = new T.Vector3(), n = new T.Vector3();
    for (var i = 0; i < P.count; i += 3) { A.fromBufferAttribute(P, i); B.fromBufferAttribute(P, i + 1); Cc.fromBufferAttribute(P, i + 2); n.subVectors(Cc, B).cross(new T.Vector3().subVectors(A, B)).normalize(); var hx = n.x, hz = n.z, hl = Math.hypot(hx, hz);
      [A, B, Cc].forEach(function (q) { if (hl < .05) { uv.push(q.x / CELL + .5, q.z / LH + .5); return; } var ux = -hz / hl, uz = hx / hl, along = q.x * ux + q.z * uz, across = -(q.x * hx + q.z * hz) / hl, sl = Math.abs(n.y) > .02 ? 1 / Math.abs(n.y) : 1; uv.push(along / CELL + .5, (across * sl) / LH + .5); }); }
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.computeVertexNormals(); return g; }
  function roofGeo() { var g = new T.ConeGeometry(CELL / Math.SQRT2, 2.4, 4, 1); g.rotateY(Math.PI / 4); g.translate(0, 1.2, 0); return slopeUV(g); }
  /* TEXTURES DES CONSTRUCTIONS façon Fortnite (dessinées une fois, 1024 × 716 = un panneau 5 × 3,5 m) :
     BOIS = cadre en poutres + planches clouées avec des jours entre elles et des petits trous (on voit à travers),
     PIERRE = briquettes en quinconce dans un cadre de pierre, joints creusés, MÉTAL = tôle ondulée dans un cadre riveté. */
  var BMAT = {};
  function rng(sd) { return function () { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; }; }
  function favTex(mk) { var W = 512, H = 358, c = document.createElement('canvas'); c.width = W; c.height = H; var g = c.getContext('2d'), r = rng(31 + (+mk.slice(2) || 0)), col = FAVC[+mk.slice(2) || 0];
    g.fillStyle = col; g.fillRect(0, 0, W, H); for (var i = 0; i < 900; i++) { g.fillStyle = r() < .5 ? 'rgba(0,0,0,' + (r() * .08) + ')' : 'rgba(255,255,255,' + (r() * .1) + ')'; g.fillRect(r() * W, r() * H, 1 + r() * 3, 1 + r() * 3); }   // crépi
    for (var k = 0; k < 4; k++) { var x = r() * W, y = r() * H, gr = g.createRadialGradient(x, y, 0, x, y, 30 + r() * 60); gr.addColorStop(0, 'rgba(60,40,20,.22)'); gr.addColorStop(1, 'rgba(60,40,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }   // taches
    if (r() < .8) { var bx = r() * W * .7, by = r() * H * .6, bw = 40 + r() * 90, bh = 30 + r() * 50; g.fillStyle = '#b5684a'; g.fillRect(bx, by, bw, bh); g.strokeStyle = 'rgba(240,220,200,.5)'; g.lineWidth = 2; for (var yy = by; yy < by + bh; yy += 10) { g.beginPath(); g.moveTo(bx, yy); g.lineTo(bx + bw, yy); g.stroke(); } }   // crépi tombé : briques visibles
    var dg = g.createLinearGradient(0, H * .78, 0, H); dg.addColorStop(0, 'rgba(70,45,20,0)'); dg.addColorStop(1, 'rgba(70,45,20,.45)'); g.fillStyle = dg; g.fillRect(0, 0, W, H);   // terre en bas du mur
    g.strokeStyle = 'rgba(30,20,10,.35)'; g.lineWidth = 1.5; for (var cr = 0; cr < 3; cr++) { var cx = r() * W, cy = r() * H; g.beginPath(); g.moveTo(cx, cy); for (var s2 = 0; s2 < 5; s2++) { cx += (r() - .5) * 40; cy += 10 + r() * 20; g.lineTo(cx, cy); } g.stroke(); }
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 8; t.wrapS = t.wrapT = T.RepeatWrapping; return t; }
  /* MURS INCASSABLES (outil des créateurs de maps, comme les murs « indestructibles » du créatif de Fortnite) : mêmes pièces 5 × 3,5 m, éditables,
     mais impossibles à casser, avec une texture au choix. Seul le créateur (sur son île) peut les enlever, d'un coup de pioche. */
  var IXM = { ixb: ['BÉTON', '#8f9399'], ixr: ['BRIQUE', '#a8503a'], ixs: ['GRÈS', '#d8b884'], ixm: ['ACIER', '#4a5260'], ixw: ['BOIS SOMBRE', '#5a3a22'], ixn: ['NÉON', '#16101f'] };
  Object.keys(IXM).forEach(function (k) { MATW[k] = 'inv'; HPP[k] = 1e9; HP0[k] = 1e9; HPT[k] = 1; ICON[k] = '🛡️'; NAME[k] = IXM[k][0] + ' INCASSABLE'; });
  function isIX(m) { return /^ix/.test(m || ''); }
  function ixTex(mk) { var W = 512, H = 358, c = document.createElement('canvas'); c.width = W; c.height = H; var g = c.getContext('2d'), r = rng(57 + mk.charCodeAt(2)), base = IXM[mk][1];
    function speck(n, a) { for (var i = 0; i < n; i++) { g.fillStyle = r() < .5 ? 'rgba(0,0,0,' + (r() * a) + ')' : 'rgba(255,255,255,' + (r() * a) + ')'; g.fillRect(r() * W, r() * H, 1 + r() * 3, 1 + r() * 3); } }
    g.fillStyle = base; g.fillRect(0, 0, W, H);
    if (mk === 'ixb') { speck(2500, .09); g.strokeStyle = 'rgba(40,42,46,.55)'; g.lineWidth = 3; [W / 2].forEach(function (x) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }); g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
      [[W / 4, H / 4], [W * .75, H / 4], [W / 4, H * .75], [W * .75, H * .75]].forEach(function (q) { g.fillStyle = 'rgba(30,30,34,.6)'; g.beginPath(); g.arc(q[0], q[1], 7, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.15)'; g.beginPath(); g.arc(q[0] - 1.5, q[1] - 1.5, 3, 0, 7); g.fill(); }); }
    else if (mk === 'ixr' || mk === 'ixs') { var bh = mk === 'ixr' ? 30 : 60, bw = mk === 'ixr' ? 64 : 128; g.fillStyle = mk === 'ixr' ? '#6a5a50' : '#b89a6a'; g.fillRect(0, 0, W, H);
      for (var row = 0, y = 0; y < H; row++, y += bh) for (var x = -(row % 2) * bw / 2; x < W; x += bw) { var li = (mk === 'ixr' ? 36 : 70) + r() * 10; g.fillStyle = mk === 'ixr' ? 'hsl(' + (10 + r() * 8) + ',55%,' + li + '%)' : 'hsl(' + (36 + r() * 6) + ',45%,' + li + '%)'; g.fillRect(x + 3, y + 3, bw - 6, bh - 6); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x + 3, y + 3, bw - 6, 3); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x + 3, y + bh - 6, bw - 6, 3); }
      speck(1200, .08); }
    else if (mk === 'ixm') { var gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#5a6474'); gr.addColorStop(1, '#343a46'); g.fillStyle = gr; g.fillRect(0, 0, W, H); speck(600, .1);
      g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 4; g.strokeRect(8, 8, W - 16, H - 16); g.beginPath(); g.moveTo(W / 2, 8); g.lineTo(W / 2, H - 8); g.stroke();
      for (var bx = 24; bx < W; bx += 46) [20, H - 20].forEach(function (by) { g.fillStyle = '#9aa2ae'; g.beginPath(); g.arc(bx, by, 5, 0, 7); g.fill(); });
      for (var s = -H; s < W; s += 40) { g.fillStyle = (s / 40) % 2 ? '#e8b81a' : '#1a1a1a'; g.beginPath(); g.moveTo(s, H - 34); g.lineTo(s + 20, H - 34); g.lineTo(s + 40, H - 14); g.lineTo(s + 20, H - 14); g.fill(); } }
    else if (mk === 'ixw') { for (var p = 0; p < 6; p++) { var py = p * H / 6, cols = ['#5a3a22', '#4a2e1a', '#64422a'][p % 3]; g.fillStyle = cols; g.fillRect(0, py + 2, W, H / 6 - 4); g.strokeStyle = 'rgba(20,10,4,.35)'; for (var l = 0; l < 6; l++) { g.lineWidth = 1 + r() * 2; g.beginPath(); var yy = py + 6 + r() * (H / 6 - 12); g.moveTo(0, yy); for (var xx = 0; xx <= W; xx += 32) g.lineTo(xx, yy + Math.sin(xx * .03 + l) * 2); g.stroke(); } } }
    else { g.fillStyle = '#120a1c'; g.fillRect(0, 0, W, H); speck(400, .06); g.shadowBlur = 16; [['#ff2bd6', 14], ['#2de2ff', 30]].forEach(function (q) { g.strokeStyle = q[0]; g.shadowColor = q[0]; g.lineWidth = 5; g.strokeRect(q[1], q[1], W - 2 * q[1], H - 2 * q[1]); }); g.shadowBlur = 0; }
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 8; t.wrapS = t.wrapT = T.RepeatWrapping; return t; }
  function bTex(mk) { if (/^pc\d$/.test(mk)) return favTex(mk); if (isIX(mk)) return ixTex(mk); var W = 1024, H = 716, c = document.createElement('canvas'); c.width = W; c.height = H; var g = c.getContext('2d'), r = rng(mk === 'bois' ? 7 : mk === 'pierre' ? 11 : 13);
    function grain(x, y, w, h, base, dark, n) { g.fillStyle = base; g.fillRect(x, y, w, h); g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
      for (var i = 0; i < n; i++) { g.strokeStyle = dark; g.globalAlpha = .12 + r() * .25; g.lineWidth = 1 + r() * 2.5; var yy = y + r() * h; g.beginPath(); g.moveTo(x, yy); for (var xx = x; xx <= x + w; xx += 24) g.lineTo(xx, yy + Math.sin(xx * .02 + i) * 3); g.stroke(); }
      g.globalAlpha = 1; if (r() < .7) { var kx = x + r() * w, ky = y + h * (.3 + r() * .4); g.fillStyle = dark; g.globalAlpha = .55; g.beginPath(); g.ellipse(kx, ky, 9 + r() * 6, 4 + r() * 3, 0, 0, 7); g.fill(); g.globalAlpha = .3; g.beginPath(); g.ellipse(kx, ky, 18, 8, 0, 0, 7); g.stroke(); g.globalAlpha = 1; }
      var hl = g.createLinearGradient(0, y, 0, y + h); hl.addColorStop(0, 'rgba(255,240,200,.35)'); hl.addColorStop(.18, 'rgba(255,240,200,0)'); hl.addColorStop(.82, 'rgba(0,0,0,0)'); hl.addColorStop(1, 'rgba(40,15,0,.45)'); g.fillStyle = hl; g.fillRect(x, y, w, h); g.restore(); }
    function nail(x, y) { g.fillStyle = '#2a2a2e'; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); g.fillStyle = '#9aa0aa'; g.beginPath(); g.arc(x - 1.5, y - 1.5, 3, 0, 7); g.fill(); }
    if (mk === 'bois') {
      g.clearRect(0, 0, W, H); var F = 64, PL = 7, ph = (H - 2 * F) / PL;
      for (var i = 0; i < PL; i++) { var y = F + i * ph + 5, hh = ph - 20 - (i % 3 === 1 ? 6 : 0), cut = r() < .5 ? W * (.3 + r() * .4) : -1, cols = [['#c98d4f', '#6a3c18'], ['#b97a3e', '#5a3010'], ['#d49a5c', '#7a4a20']][i % 3];
        if (cut > 0) { grain(F - 10, y, cut - F + 6, hh, cols[0], cols[1], 14); grain(cut + 4, y + 2, W - F + 10 - cut - 4, hh - 2, cols[0], cols[1], 14); } else grain(F - 10, y, W - 2 * F + 20, hh, cols[0], cols[1], 18);
        [F + 30, W - F - 30, W / 2].forEach(function (nx) { nail(nx, y + hh * .3); nail(nx, y + hh * .72); }); }
      for (var h2 = 0; h2 < 12; h2++) { var hx = F + 40 + r() * (W - 2 * F - 80), hy = F + r() * (H - 2 * F); g.save(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.ellipse(hx, hy, 5 + r() * 9, 3 + r() * 6, r() * 3, 0, 7); g.fill(); g.restore(); }   // petits trous (on voit à travers)
      [[0, 0, W, F], [0, H - F, W, F]].forEach(function (b) { grain(b[0], b[1], b[2], b[3], '#8a5228', '#3a1e08', 16); });   // poutres haut / bas
      [[0, 0, F, H], [W - F, 0, F, H], [W / 2 - F / 2, F, F * .8, H - 2 * F]].forEach(function (b, k) { g.save(); g.translate(b[0] + b[2] / 2, b[1] + b[3] / 2); g.rotate(Math.PI / 2); grain(-b[3] / 2, -b[2] / 2, b[3], b[2], k === 2 ? '#a0642e' : '#8a5228', '#3a1e08', 16); g.restore(); });
      g.save(); g.translate(W / 2, H / 2); g.rotate(Math.atan2(H - 2 * F, W - 2 * F)); grain(-W * .45, -F * .38, W * .9, F * .76, '#a86a34', '#4a2408', 12); g.restore();   // écharpe en diagonale
      [[F / 2, F / 2], [W - F / 2, F / 2], [F / 2, H - F / 2], [W - F / 2, H - F / 2], [W / 2, H / 2]].forEach(function (q) { nail(q[0] - 12, q[1]); nail(q[0] + 12, q[1]); });
    } else if (mk === 'pierre') {
      g.fillStyle = '#5c4a44'; g.fillRect(0, 0, W, H); var F2 = 54, bh = 44, bw = 104;
      for (var row = 0, yy2 = F2; yy2 < H - F2; row++, yy2 += bh) for (var xx2 = F2 - (row % 2 ? bw / 2 : 0); xx2 < W - F2; xx2 += bw) {
        var x0 = Math.max(F2, xx2 + 4), x1 = Math.min(W - F2, xx2 + bw - 4), y0 = yy2 + 4, y1 = Math.min(H - F2, yy2 + bh - 4); if (x1 - x0 < 10 || y1 - y0 < 8) continue;
        var hue = 8 + r() * 14, li = 36 + r() * 14; g.fillStyle = 'hsl(' + hue + ',' + (45 + r() * 15) + '%,' + li + '%)'; g.beginPath(); if (g.roundRect) g.roundRect(x0, y0, x1 - x0, y1 - y0, 6); else g.rect(x0, y0, x1 - x0, y1 - y0); g.fill();
        g.fillStyle = 'rgba(255,220,190,.28)'; g.fillRect(x0 + 3, y0 + 2, x1 - x0 - 6, 5); g.fillStyle = 'rgba(30,8,0,.35)'; g.fillRect(x0 + 3, y1 - 6, x1 - x0 - 6, 5);
        for (var sp = 0; sp < 10; sp++) { g.fillStyle = r() < .5 ? 'rgba(0,0,0,.18)' : 'rgba(255,230,200,.14)'; g.fillRect(x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), 2 + r() * 4, 2 + r() * 3); }
        if (r() < .12) { g.strokeStyle = 'rgba(20,5,0,.6)'; g.lineWidth = 2; g.beginPath(); var cx = x0 + r() * (x1 - x0); g.moveTo(cx, y0); g.lineTo(cx + 8, (y0 + y1) / 2); g.lineTo(cx - 4, y1); g.stroke(); } }
      function stone(x, y, w, h) { var gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#9a948c'); gr.addColorStop(1, '#5e5852'); g.fillStyle = gr; g.fillRect(x, y, w, h); g.strokeStyle = 'rgba(30,26,22,.8)'; g.lineWidth = 4; for (var sx = x; sx < x + w; sx += 120 + r() * 60) { g.beginPath(); g.moveTo(sx, y); g.lineTo(sx + 6, y + h); g.stroke(); } g.strokeRect(x + 2, y + 2, w - 4, h - 4);
        g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x + 4, y + 4, w - 8, 4); }
      stone(0, 0, W, F2); stone(0, H - F2, W, F2); g.save(); g.translate(F2, 0); g.rotate(Math.PI / 2); stone(0, 0, H, F2); g.restore(); g.save(); g.translate(W, 0); g.rotate(Math.PI / 2); stone(0, 0, H, F2); g.restore();
    } else {
      var gr2 = g.createLinearGradient(0, 0, W, 0); for (var k2 = 0; k2 <= 24; k2++) { var t2 = k2 / 24; gr2.addColorStop(t2, k2 % 2 ? '#5a6474' : '#b8c2d0'); } g.fillStyle = gr2; g.fillRect(0, 0, W, H);   // tôle ondulée
      for (var s3 = 0; s3 < 60; s3++) { g.strokeStyle = 'rgba(255,255,255,' + (.05 + r() * .12) + ')'; g.lineWidth = 1; var sx3 = r() * W, sy3 = r() * H; g.beginPath(); g.moveTo(sx3, sy3); g.lineTo(sx3 + 30 + r() * 60, sy3 + (r() - .5) * 10); g.stroke(); }   // rayures
      for (var ru = 0; ru < 9; ru++) { var rx = r() * W, ry = r() * H, rg = g.createRadialGradient(rx, ry, 0, rx, ry, 30 + r() * 40); rg.addColorStop(0, 'rgba(150,70,20,.45)'); rg.addColorStop(1, 'rgba(150,70,20,0)'); g.fillStyle = rg; g.fillRect(rx - 80, ry - 80, 160, 160); }   // rouille
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, H / 2 - 4, W, 8);
      [[0, 0, W, 50], [0, H - 50, W, 50], [0, 0, 50, H], [W - 50, 0, 50, H], [0, H / 2 - 22, W, 44]].forEach(function (b) { var gb = g.createLinearGradient(b[0], b[1], b[0] + (b[2] < b[3] ? b[2] : 0), b[1] + (b[2] < b[3] ? 0 : b[3])); gb.addColorStop(0, '#d0d6de'); gb.addColorStop(.5, '#7a8494'); gb.addColorStop(1, '#3a404a'); g.fillStyle = gb; g.fillRect(b[0], b[1], b[2], b[3]); g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 3; g.strokeRect(b[0] + 1.5, b[1] + 1.5, b[2] - 3, b[3] - 3); });
      function rivet(x, y) { var rg2 = g.createRadialGradient(x - 2, y - 2, 1, x, y, 7); rg2.addColorStop(0, '#ffffff'); rg2.addColorStop(.4, '#a8b0bc'); rg2.addColorStop(1, '#2a2e36'); g.fillStyle = rg2; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); }
      for (var rx2 = 40; rx2 < W - 20; rx2 += 64) { rivet(rx2, 25); rivet(rx2, H - 25); rivet(rx2, H / 2); } for (var ry2 = 70; ry2 < H - 40; ry2 += 64) { rivet(25, ry2); rivet(W - 25, ry2); }
    }
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 8; t.wrapS = t.wrapT = T.RepeatWrapping; return t; }
  function bMat(mk, type) { var key = mk + (type === 'esc' ? 'e' : ''); if (BMAT[key]) return BMAT[key]; var tx = (BMAT['t' + mk] = BMAT['t' + mk] || bTex(mk)), m;
    m = mk === 'metal' || mk === 'ixm' ? new T.MeshStandardMaterial({ map: tx, metalness: .55, roughness: .42, color: '#ffffff' }) : mk === 'ixn' ? new T.MeshStandardMaterial({ map: tx, emissiveMap: tx, emissive: '#ffffff', emissiveIntensity: .8, metalness: 0, roughness: .6, color: '#ffffff' }) : new T.MeshStandardMaterial({ map: tx, metalness: 0, roughness: mk === 'bois' ? .78 : .9, color: '#ffffff' });
    if (mk === 'bois') { m.alphaTest = .5; m.side = T.DoubleSide; }
    return BMAT[key] = m; }
  /* TEXTURES PERSO (Créatif) : un créateur peut remplacer la texture du bois, de la pierre ou du métal par une image à lui (ou d'origine avec null) */
  function setTex(mk, src) { if (!/^(bois|pierre|metal)$/.test(mk)) return; var tx;
    if (src) { tx = new T.CanvasTexture(src); tx.encoding = T.sRGBEncoding; tx.anisotropy = 8; tx.wrapS = tx.wrapT = T.RepeatWrapping; } else tx = bTex(mk);
    var old = BMAT['t' + mk]; BMAT['t' + mk] = tx; [mk, mk + 'e'].forEach(function (k) { var m = BMAT[k]; if (!m) return; m.map = tx; if (mk === 'bois') { m.alphaTest = src ? 0 : .5; } m.needsUpdate = true; }); if (old && old !== tx) old.dispose(); }
  function pieceIM(type, mk) { var key = type + mk; if (PIM[key]) return PIM[key]; var mat = bMat(mk, type);
    var CAP = isIX(mk) ? 1500 : 600, im = new T.InstancedMesh(type === 'mur' || type === 'sol' ? C.BOX : GEO[type], mat, CAP); im.count = CAP; for (var i = 0; i < CAP; i++) im.setMatrixAt(i, ZERO); im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; im.userData.dyn = true; im.free = []; for (i = CAP - 1; i >= 0; i--) im.free.push(i); C.scene.add(im); PIM[key] = im; return im; }
  function pieceMatrix(p, o) { o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1);
    if (p.t === 'sol') { o.position.set(p.x, p.L, p.z); o.scale.set(CELL, .16, CELL); }
    else if (p.t === 'esc') { o.position.set(p.x, p.L, p.z); o.rotation.y = -p.d * Math.PI / 2; }
    else if (p.t === 'toit') { o.position.set(p.x, p.L, p.z); }
    o.updateMatrix(); return o.matrix; }
  // où va la pièce ? (cellule de 4 m, niveau aligné sur les pièces voisines)
  function plan(noAim) { var P0 = me(), onR = PIECES.some(function (q) { return q.t === 'esc' && Math.abs(P0.x - q.x) <= CELL / 2 + .1 && Math.abs(P0.z - q.z) <= CELL / 2 + .1 && P0.y > q.L - .2 && P0.y < q.L + LH + .5; });
    if (!noAim) { var pa = planAim(); if (pa) return pa; }   // sur une rampe : on construit dans la foulée (règle d'avant)
    var P = me(), a = C.camA(), pitch = C.camP(), d = ((Math.round(a / (Math.PI / 2)) % 4) + 4) % 4, dx = [1, 0, -1, 0][d], dz = [0, 1, 0, -1][d];
    var ci = Math.floor(P.x / CELL), cj = Math.floor(P.z / CELL), b0 = null, bd = 14;
    PIECES.forEach(function (q) { var dd = Math.hypot(q.x - P.x, q.z - P.z); if (dd < bd && Math.abs(q.L - P.y) < 10) { bd = dd; b0 = q.L; } });
    var g1 = C.snapY ? C.snapY(P.y) : P.y; if (g1 > P.y + 1.2) g1 -= LH; var L = b0 == null ? g1 : b0 + LH * Math.floor((P.y + .6 - b0) / LH), t = PIECE, p = { t: t, m: MATK, d: d };
    // debout sur une rampe : on construit dans la foulée, en haut (la cellule de la rampe compte comme la nôtre, niveau = haut de la rampe)
    var R = null; PIECES.forEach(function (q) { if (q.t === 'esc' && Math.abs(P.x - q.x) <= CELL / 2 + .1 && Math.abs(P.z - q.z) <= CELL / 2 + .1 && P.y > q.L + .1 && P.y < q.L + LH + .5) R = q; });
    if (R) { ci = Math.floor(R.x / CELL); cj = Math.floor(R.z / CELL); if (t !== 'mur') { var i0 = ci + dx, j0 = cj + dz, L0 = R.L + LH;
        p.L = t === 'toit' && pitch <= 0 ? L0 : t === 'toit' ? L0 : L0; p.x = i0 * CELL + CELL / 2; p.z = j0 * CELL + CELL / 2; p.key = t[0] + '|' + i0 + '|' + j0 + '|' + p.L.toFixed(1); if (t === 'lit') p = null; if (p) return p; p = { t: t, m: MATK, d: d }; }
      else L = R.L + (pitch > .2 ? LH : 0); }
    if (t === 'mur') { p.L = L + (pitch > .45 ? LH : 0); var ex = d === 0 ? ci + 1 : d === 2 ? ci : null, ez = d === 1 ? cj + 1 : d === 3 ? cj : null;
      if (ex != null) { p.x = ex * CELL; p.z = cj * CELL + CELL / 2; p.hw = WTH; p.hd = CELL / 2; p.key = 'm|x|' + ex + '|' + cj; } else { p.z = ez * CELL; p.x = ci * CELL + CELL / 2; p.hw = CELL / 2; p.hd = WTH; p.key = 'm|z|' + ci + '|' + ez; } }
    else if (t === 'lit') { var bx = P.x + Math.cos(a) * 2.4, bz = P.z + Math.sin(a) * 2.4; p.x = bx; p.z = bz; p.L = Math.max(C.hgt(bx, bz), groundAt(bx, bz, P.y + .5)); p.d = a; p.key = 'lit|' + Math.round(bx) + '|' + Math.round(bz); return p; }
    else { var i = ci, j = cj, LL = L; if (t === 'sol') { if (pitch > .35) LL = L + LH; else { i += dx; j += dz; } }
      else if (t === 'esc') { i += dx; j += dz; if (pitch > .55) LL = L + LH; }
      else { if (pitch > 0) LL = L + LH; else { i += dx; j += dz; } }
      p.L = LL; p.x = i * CELL + CELL / 2; p.z = j * CELL + CELL / 2; p.key = t[0] + '|' + i + '|' + j; }
    for (var hi = 0; hi < C.HOUSES.length; hi++) { var hs = C.HOUSES[hi]; if (Math.abs(p.x - hs.x) > hs.hx + .6 || Math.abs(p.z - hs.z) > hs.hz + .6 || p.L < hs.y0 - 1.2 || p.L > hs.y0 + hs.h + 1.2) continue;
      p.L = hs.y0 + LH * Math.round((p.L - hs.y0) / LH); break; }   // dans un bâtiment : on se cale sur ses étages (mur cassé → ton mur prend exactement sa place)
    p.key += '|' + p.L.toFixed(1); return p; }
  function anchored(p) { if (!p || p.t === 'lit') return true; if (grounded(p) || (p.t === 'mur' && C.hgt(p.x, p.z) > p.L - .8)) return true;
    for (var i = 0; i < PIECES.length; i++) if (linked(p, PIECES[i])) return true;
    return houseTouch(p); }
  function planOk() { var p = planFree(); if (anchored(p)) return p; var q = plan(true); return q && anchored(q) && !taken(q.key, q) ? q : Object.assign(p, { bad: true }); }   /* visée dans le vide : on retombe sur la case devant soi, sinon rien */
  function planFree() {   /* case visée déjà prise : on essaie la case de la grille devant soi, puis un étage au-dessus (comme Fortnite qui pose toujours quelque part) — sauf l'escalier : UN seul à la fois */
    var p = plan(); if (!p || p.t === 'lit' || !taken(p.key, p) || p.t === 'esc') return p; var q = plan(true); if (q && !taken(q.key, q)) return q;
    var up = Object.assign({}, p, { L: p.L + LH }); up.key = p.key.replace(/\|[-\d.]+$/, '|' + up.L.toFixed(1)); return taken(up.key, up) ? p : up; }
  function slotWalls(p, lin) { var ax = p.hw > p.hd; return C.WALLS.filter(function (w) { return w.alive && !w.build && !!w.lintel === lin && Math.abs(ax ? w.z - p.z : w.x - p.x) < .45 && Math.abs(ax ? w.x - p.x : w.z - p.z) < (ax ? w.hw : w.hd) + CELL / 2 - .3 && w.y0 < p.L + LH - .4 && w.y0 + w.h > p.L + .4; }); }
  /* CONSTRUIRE AU VISEUR : on suit le rayon de la caméra jusqu'au sol, à une pièce ou à un mur ; la pièce va dans la case visée,
     au niveau visé (calé sur la grille de 3,5 m des pièces voisines ou du sol). Les escaliers se prolongent pile au bout du précédent. */
  function aimHit() { var cm = C.cam(); if (!cm) return null; var o = cm.position, d = new T.Vector3(); cm.getWorldDirection(d); var P = me(), x, y, z;
    for (var t = 1; t < 22; t += .15) { x = o.x + d.x * t; y = o.y + d.y * t; z = o.z + d.z * t; if (Math.hypot(x - P.x, z - P.z) > CELL * 2.1) break;
      var g = Math.max(C.hgt(x, z), groundAt(x, z, y + .2)); if (y <= g + .02) return { x: x, y: g, z: z, top: true };
      for (var i = 0; i < C.WALLS.length; i++) { var w = C.WALLS[i]; if (w.alive && Math.abs(x - w.x) <= w.hw + .05 && Math.abs(z - w.z) <= w.hd + .05 && y >= w.y0 && y <= w.y0 + w.h) return { x: x, y: y, z: z, wall: w }; } }
    return { x: x, y: Math.max(P.y - LH * 1.6, Math.min(P.y + LH * .9, y)), z: z, air: true }; }
  function lvl(x, z, y) { var base = null, bd = 12; PIECES.forEach(function (q) { var dd = Math.hypot(q.x - x, q.z - z); if (dd < bd) { bd = dd; base = q.L; } });
    for (var hi = 0; hi < C.HOUSES.length && base == null; hi++) { var hs = C.HOUSES[hi]; if (Math.abs(x - hs.x) < hs.hx + 3 && Math.abs(z - hs.z) < hs.hz + 3) base = hs.y0; }
    if (base == null) { var g0 = C.hgt(Math.floor(x / CELL) * CELL + CELL / 2, Math.floor(z / CELL) * CELL + CELL / 2); base = C.snapY ? C.snapY(g0) : g0; }   /* grille verticale commune à toute la map */
    return base + LH * Math.floor((y - base) / LH + .12); }
  /* VISÉE DE CONSTRUCTION façon Fortnite (pour réussir les « 90 » facilement) : tout part de TES PIEDS et de la direction où tu regardes.
     · regarde vers le bas → le SOL / la RAMPE se pose dans TA case, au niveau de tes pieds (même en plein saut : le sol apparaît sous toi)
     · regarde devant → dans la case DEVANT toi, au niveau de tes pieds · regarde en haut → un étage au-dessus
     · MUR : sur le bord de ta case, dans la direction où tu regardes · TOIT : au-dessus de ta case */
  function planAim() { var t = PIECE; if (t === 'lit') return null; var P = me(), pt = C.camP(), a = C.camA(), d = ((Math.round(a / (Math.PI / 2)) % 4) + 4) % 4, dx = [1, 0, -1, 0][d], dz = [0, 1, 0, -1][d];
    var down = pt < -.62, up = pt > .42, p = { t: t, m: MATK, d: d }, oi = Math.floor(P.x / CELL), oj = Math.floor(P.z / CELL);
    var feet = lvl(oi * CELL + CELL / 2, oj * CELL + CELL / 2, P.y + .35);   // niveau de la grille sous tes pieds (avec un peu de marge pendant un saut)
    PIECES.forEach(function (q) { if (q.t === 'esc' && Math.abs(P.x - q.x) <= CELL / 2 + .2 && Math.abs(P.z - q.z) <= CELL / 2 + .2 && P.y > q.L + LH * .35 && P.y < q.L + LH + 1.2) feet = Math.max(feet, q.L + LH); });   // sur une rampe (assez haut) : on compte le HAUT de la rampe
    if (t === 'mur') { var lw = feet + (up ? LH : 0); if (dx) { var ex = oi + (dx > 0 ? 1 : 0); p.x = ex * CELL; p.z = oj * CELL + CELL / 2; p.hw = WTH; p.hd = CELL / 2; p.key = 'm|x|' + ex + '|' + oj; } else { var ez = oj + (dz > 0 ? 1 : 0); p.z = ez * CELL; p.x = oi * CELL + CELL / 2; p.hw = CELL / 2; p.hd = WTH; p.key = 'm|z|' + oi + '|' + ez; } p.L = lw; }
    else { var ci = oi, cj = oj; if (!down && t !== 'toit') { ci = oi + dx; cj = oj + dz; }   // devant toi, sauf si tu regardes en bas
      p.x = ci * CELL + CELL / 2; p.z = cj * CELL + CELL / 2; p.L = feet + (up || t === 'toit' ? LH : 0);
      if (down && t !== 'toit') p.L = lvl(p.x, p.z, P.y + .3 - LH * .12);   /* dans TA case : jamais au-dessus de tes pieds (avant : jusqu'à 77 cm plus haut, ou le haut de la rampe → le sol se posait SUR toi) */
      if (t === 'esc') { var back = PIECES.filter(function (q) { return q.t === 'esc' && q.d === d && Math.abs(q.x - (p.x - dx * CELL)) < .1 && Math.abs(q.z - (p.z - dz * CELL)) < .1 && Math.abs(q.L + LH - p.L) < LH * .8; })[0]; if (back) p.L = back.L + LH; }   // dans le prolongement : pile au bout
      p.key = t[0] + '|' + ci + '|' + cj; }
    p.L = +p.L.toFixed(2); p.key += '|' + p.L.toFixed(1); return p; }
  function taken(key, p) { for (var i = 0; i < PIECES.length; i++) if (PIECES[i].key === key) return true; return !!(p && p.t === 'mur' && (slotWalls(p, false).length || slotWalls(p, true).length)); }   // un mur de maison occupe la place — y compris une PORTE de maison : c'est un « edit » de la map (comme Fortnite), on ne peut pas la boucher
  function placeBed(p) { BED = { x: p.x, z: p.z, y: p.L, a: p.d }; showBed(); C.toast('LIT POSÉ : TU RÉAPPARAÎTRAS ICI'); save(); return true; }
  function showBed() { if (!BED) { if (BEDM) BEDM.visible = false; return; } if (!BEDM) { if (!BEDTPL) return; BEDM = new T.Mesh(BEDTPL.geo, BEDTPL.mat); BEDM.castShadow = true; BEDM.userData.dyn = true; C.scene.add(BEDM); }
    BEDM.visible = true; BEDM.position.set(BED.x, BED.y, BED.z); BEDM.rotation.set(0, -BED.a + Math.PI / 2, 0); }
  /* ÉDITER un mur : plein, porte, fenêtre, 2 fenêtres, porte + fenêtre. Un mur = des morceaux [u0, u1, y0, y1] (u le long du mur, 0 = centre) */
  var EDITS = ['plein', 'porte', 'fenetre', 'fenetres', 'portefen'], ENAME = { plein: 'MUR PLEIN', porte: 'PORTE', fenetre: 'FENÊTRE', fenetres: '2 FENÊTRES', portefen: 'PORTE + FENÊTRE' };
  function segsOf(v) { var W = CELL / 2, H2 = LH;
    return { plein: [[-W, W, 0, H2]], porte: [[-W, -.75, 0, H2], [.75, W, 0, H2], [-.75, .75, 2.45, H2]], fenetre: [[-W, -.85, 0, H2], [.85, W, 0, H2], [-.85, .85, 0, 1.1], [-.85, .85, 2.5, H2]],
      fenetres: [[-W, -1.9, 0, H2], [-.7, .7, 0, H2], [1.9, W, 0, H2], [-1.9, -.7, 0, 1.1], [-1.9, -.7, 2.5, H2], [.7, 1.9, 0, 1.1], [.7, 1.9, 2.5, H2]],
      portefen: [[-W, -1.9, 0, H2], [-1.9, -.6, 2.45, H2], [-.6, .7, 0, H2], [.7, 1.9, 0, 1.1], [.7, 1.9, 2.5, H2], [1.9, W, 0, H2]] }[v || 'plein']; }
  function maskSegs(mk) { var W = CELL / 2, cw = CELL / 3, rh = LH / 3, out = [];   // ÉDITION façon Fortnite : grille 3×3, cases enlevées = trous (portes, fenêtres…)
    for (var r = 0; r < 3; r++) { var c = 0; while (c < 3) { if (mk[r * 3 + c]) { c++; continue; } var c0 = c; while (c < 3 && !mk[r * 3 + c]) c++; out.push([-W + c0 * cw, -W + c * cw, r * rh, (r + 1) * rh]); } }
    return out.length ? out : [[-.01, .01, 0, .01]]; }
  /* ÉDITS EN TRIANGLE comme Fortnite : un « L » de 3 cases dans un coin = petit triangle (coupe en biais), un escalier de 6 cases = demi-mur en diagonale */
  var TRIS = { '3,6,7': ['tl', 1], '5,7,8': ['tr', 1], '0,1,3': ['bl', 1], '1,2,5': ['br', 1],   /* L de 3 cases dans un coin = DEMI-MUR en diagonale (la moitié du mur) */ '0,3,4,6,7,8': ['tl', 1], '2,4,5,6,7,8': ['tr', 1], '0,1,2,3,4,6': ['bl', 1], '0,1,2,4,5,8': ['br', 1] };
  function triOf(mk) { if (!mk) return null; var ids = []; for (var i = 0; i < 9; i++) if (mk[i]) ids.push(i); return TRIS[ids.join(',')] || null; }
  function triMesh(p, tri) { var W = CELL, H = LH, k = tri[1] ? 3 : 2, a = W * k / 3, b = H * k / 3, pts;   // forme du mur = carré moins le triangle du coin
    var C4 = { bl: [0, 0], br: [W, 0], tl: [0, H], tr: [W, H] }[tri[0]], sx = tri[0].charAt(1) === 'l' ? 1 : -1, sy = tri[0].charAt(0) === 'b' ? 1 : -1, P1 = [C4[0] + sx * a, C4[1]], P2 = [C4[0], C4[1] + sy * b];
    var ring = [[0, 0], [W, 0], [W, H], [0, H]], out = []; ring.forEach(function (q) { if (q[0] === C4[0] && q[1] === C4[1]) { if (sx * sy > 0) out.push(P2, P1); else out.push(P1, P2); } else out.push(q); });
    var sh = new T.Shape(); out.forEach(function (q, i) { if (i) sh.lineTo(q[0] - W / 2, q[1]); else sh.moveTo(q[0] - W / 2, q[1]); });
    var th = WTH * 2, g = new T.ExtrudeGeometry(sh, { depth: th, bevelEnabled: false }); g.translate(0, 0, -th / 2); var uv = g.attributes.uv; for (var v = 0; v < uv.count; v++) uv.setXY(v, (uv.getX(v) + W / 2) / W, uv.getY(v) / H);
    var m = new T.Mesh(g, p.im.material); m.castShadow = m.receiveShadow = true; m.userData.dyn = true; m.position.set(p.x, p.L, p.z); if (!(p.hw > p.hd)) m.rotation.y = -Math.PI / 2; C.scene.add(m); return m; }
  /* MUR ÉDITÉ PROPRE (fenêtres, portes, arches) : un seul objet fait des cases restantes, la texture garde sa place (plus de texture
     écrasée dans chaque morceau), + un ENCADREMENT autour des trous (bois foncé, appui en pierre, cadre en acier, crépi blanc) */
  var FRM = {}; function frameMat(mk) { var c = mk === 'bois' ? '#5a3418' : mk === 'pierre' ? '#d8d2c4' : mk === 'metal' ? '#3a3f48' : '#f4efe4'; return FRM[c] || (FRM[c] = new T.MeshStandardMaterial({ color: c, roughness: mk === 'metal' ? .4 : .85, metalness: mk === 'metal' ? .5 : 0 })); }
  function maskMesh(p, mk, ext) { var W = CELL, H = LH, cw = W / 3, rh = H / 3, th = WTH * 2, P = [], N = [], U = [], I = [], FP = [], FN = [], FU = [], FI = [];
    function quad(A, B, C2, D, n, pa, na, ua, ia) { var b = pa.length / 3; [A, B, C2, D].forEach(function (q) { pa.push(q[0], q[1], q[2]); na.push(n[0], n[1], n[2]); ua.push((q[0] + W / 2) / W, q[1] / H); }); ia.push(b, b + 1, b + 2, b, b + 2, b + 3); }
    function box(x0, x1, y0, y1, z0, z1, pa, na, ua, ia) {
      quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], pa, na, ua, ia); quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], pa, na, ua, ia);
      quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], pa, na, ua, ia); quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], pa, na, ua, ia);
      quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], pa, na, ua, ia); quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], pa, na, ua, ia); }
    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) if (!mk[r * 3 + c]) box(-W / 2 + c * cw, -W / 2 + (c + 1) * cw, r ? r * rh : -ext, (r + 1) * rh, -th / 2, th / 2, P, N, U, I);
    var fw = .09, fd = th / 2 + .035;   // encadrement : un peu plus épais que le mur, déborde des deux côtés
    /* VRAIES FENÊTRES : la grille d'édition sert juste à choisir ; une case enlevée qui n'est pas une porte devient une fenêtre plus petite que la case,
       avec du mur autour, un cadre et un appui. Les portes (colonne ouverte depuis le bas) gardent toute la largeur. */
    function doorish(r2, c2) { for (var k = 0; k <= r2; k++) if (!mk[k * 3 + c2]) return false; return true; }
    var IH = .2, IV = .15;
    for (r = 0; r < 3; r++) for (c = 0; c < 3; c++) { if (!mk[r * 3 + c]) continue; var x0 = -W / 2 + c * cw, x1 = x0 + cw, y0 = r * rh, y1 = y0 + rh, dr = doorish(r, c);
      var kL = c === 0 ? !(mk[0] && mk[3] && mk[6]) : !mk[r * 3 + c - 1], kR = c === 2 ? !(mk[2] && mk[5] && mk[8]) : !mk[r * 3 + c + 1], kT = r === 2 ? !(mk[6] && mk[7] && mk[8]) : !mk[(r + 1) * 3 + c], kB = r > 0 && !mk[(r - 1) * 3 + c];
      var ox0 = x0 + (kL ? (dr ? (c === 0 ? fw * 1.4 : 0) : IH) : 0), ox1 = x1 - (kR ? (dr ? (c === 2 ? fw * 1.4 : 0) : IH) : 0), oy0 = y0 + (kB && !dr ? IV : 0), oy1 = y1 - (kT ? (dr ? (r === 2 ? fw * 1.4 : 0) : IV) : 0);
      if (ox0 > x0) box(x0, ox0, r ? y0 : y0 - (dr ? 0 : ext), y1, -th / 2, th / 2, P, N, U, I); if (ox1 < x1) box(ox1, x1, r ? y0 : y0 - (dr ? 0 : ext), y1, -th / 2, th / 2, P, N, U, I);   // mur autour de la fenêtre
      if (oy0 > y0) box(ox0, ox1, y0, oy0, -th / 2, th / 2, P, N, U, I); if (oy1 < y1) box(ox0, ox1, oy1, y1, -th / 2, th / 2, P, N, U, I);
      if (kL) box(ox0, ox0 + fw, oy0, oy1, -fd, fd, FP, FN, FU, FI); if (kR) box(ox1 - fw, ox1, oy0, oy1, -fd, fd, FP, FN, FU, FI);   // cadre
      if (kT) box(ox0, ox1, oy1 - fw, oy1, -fd, fd, FP, FN, FU, FI);
      if (kB) box(ox0 - (kL ? .06 : 0), ox1 + (kR ? .06 : 0), oy0, oy0 + fw * 1.3, -fd - .07, fd + .07, FP, FN, FU, FI); }   // appui de fenêtre
    /* PORTES : une colonne dont les 2 cases du bas sont enlevées (le haut reste) = une vraie porte qui s'ouvre (E) ; 2 colonnes côte à côte = double porte */
    var dc = [0, 1, 2].filter(function (c2) { return mk[c2] && mk[3 + c2] && !mk[6 + c2]; }); p.doorsW = [];
    if (dc.length && dc.length < 3 && window.DOORS) { var grpD = []; if (dc.length === 2 && dc[1] - dc[0] === 1) grpD.push([dc[0], dc[1]]); else dc.forEach(function (c2) { grpD.push([c2, c2]); });
      grpD.forEach(function (q) { var lu0 = -W / 2 + q[0] * cw + (q[0] === 0 ? fw * 1.4 : fw), lu1 = -W / 2 + (q[1] + 1) * cw - (q[1] === 2 ? fw * 1.4 : fw), ax = p.hw > p.hd;
        p.doorsW.push({ key: p.key + '|' + q[0], ax: ax, x: p.x, z: p.z, y0: p.L, u0: (ax ? p.x : p.z) + lu0, u1: (ax ? p.x : p.z) + lu1, h: 2 * rh - fw, two: q[1] > q[0] }); }); }
    function mesh(pa, na, ua, ia, mat) { var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pa, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(na, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(ua, 2)); g.setIndex(ia); var m = new T.Mesh(g, mat); m.castShadow = m.receiveShadow = true; return m; }
    var grp = new T.Group(); grp.userData.dyn = true; if (P.length) grp.add(mesh(P, N, U, I, p.im.material)); if (FP.length) grp.add(mesh(FP, FN, FU, FI, frameMat(p.m)));
    grp.geometry = { dispose: function () { grp.children.forEach(function (q) { q.geometry.dispose(); }); } };
    grp.position.set(p.x, p.L, p.z); if (!(p.hw > p.hd)) grp.rotation.y = -Math.PI / 2; C.scene.add(grp); p.doors = p.doorsW.map(function (o) { return DOORS.make(o); }); return grp; }
  function wallSegs(p, im) { var below = PIECES.some(function (q) { return q !== p && Math.abs(q.L - (p.L - LH)) < .2 && Math.hypot(q.x - p.x, q.z - p.z) < 3; }), gr = Math.min(C.hgt(p.x - (p.hw > p.hd ? CELL / 2 - .3 : 0), p.z - (p.hw > p.hd ? 0 : CELL / 2 - .3)), C.hgt(p.x + (p.hw > p.hd ? CELL / 2 - .3 : 0), p.z + (p.hw > p.hd ? 0 : CELL / 2 - .3))),
      ext = below || p.L - gr > 1.2 ? 0 : Math.max(0, p.L - gr + .05), alongX = p.hw > p.hd;   /* le bas du mur ne descend que jusqu'au sol (avant : 1 m dans le vide → « petit mur » sous les escaliers) */
    var TRI0 = triOf(p.mask), HOLE = !TRI0 && p.mask && p.mask.some(Boolean); p.ws = []; (p.mask ? maskSegs(p.mask) : segsOf(p.v)).forEach(function (sg) { if (!im.free.length) return; var cu = (sg[0] + sg[1]) / 2, hu = (sg[1] - sg[0]) / 2, y0 = sg[2] === 0 ? p.L - ext : p.L + sg[2], y1 = p.L + sg[3];
      var w = { x: p.x + (alongX ? cu : 0), z: p.z + (alongX ? 0 : cu), y0: y0, hw: alongX ? hu : p.hw, hd: alongX ? p.hd : hu, m: MATW[p.m], h: y1 - y0, house: null, im: im, ii: im.free.pop(), alive: true, hp: p.hp, build: p };
      if (TRI0 || HOLE) w.cut = true; C.WALLS.push(w); C.setWall(w, true); p.ws.push(w); }); p.w = p.ws[0]; if (TRI0) p.tri = triMesh(p, TRI0); else if (HOLE) p.tri = maskMesh(p, p.mask, ext); }
  /* SOLS / ESCALIERS / TOITS SOLIDES (comme Fortnite) : des « plats » invisibles dans C.WALLS → les balles s'arrêtent dessus (et les cassent),
     la tête cogne dessous en sautant ; on ne passe plus à travers par en dessous. Sol édité = 4 quarts (on enlève 1 à 3 cases). */
  function flatSegs(p) { p.ws = []; var Q = CELL / 4, out = [];
    if (p.t === 'sol') { for (var i = 0; i < 4; i++) { if (p.mask && p.mask[i]) continue; out.push([p.x + (i % 2 ? Q : -Q), p.z + (i > 1 ? Q : -Q), Q, Q, p.L - .08, .16]); } }
    else if (p.t === 'esc' && p.rp) { rampShape(p).forEach(function (sg) { var n = sg.y0 === sg.y1 ? 1 : 3; for (var k = 0; k < n; k++) { var f0 = k / n, f1 = (k + 1) / n, x0 = sg.x0, x1 = sg.x1, z0 = sg.z0, z1 = sg.z1;
        if (n > 1) { if (sg.d === 0) { x0 = sg.x0 + (sg.x1 - sg.x0) * f0; x1 = sg.x0 + (sg.x1 - sg.x0) * f1; } else if (sg.d === 2) { x1 = sg.x1 - (sg.x1 - sg.x0) * f0; x0 = sg.x1 - (sg.x1 - sg.x0) * f1; } else if (sg.d === 1) { z0 = sg.z0 + (sg.z1 - sg.z0) * f0; z1 = sg.z0 + (sg.z1 - sg.z0) * f1; } else { z1 = sg.z1 - (sg.z1 - sg.z0) * f0; z0 = sg.z1 - (sg.z1 - sg.z0) * f1; } }
        var ya = sg.y0 + (sg.y1 - sg.y0) * f0, yb = sg.y0 + (sg.y1 - sg.y0) * f1; out.push([p.x + (x0 + x1) / 2, p.z + (z0 + z1) / 2, (x1 - x0) / 2, (z1 - z0) / 2, p.L + ya - .12, yb - ya + .12]); } }); }
    else if (p.t === 'esc') { var ax = p.d % 2 === 0, sg = p.d < 2 ? 1 : -1; for (var k = 0; k < 4; k++) { var u = (k + .5) * Q - CELL / 2; out.push([p.x + (ax ? sg * u : 0), p.z + (ax ? 0 : sg * u), ax ? Q / 2 + .02 : CELL / 2, ax ? CELL / 2 : Q / 2 + .02, p.L + LH * k / 4 - .12, LH / 4 + .12]); } }
    else if (p.t === 'toit') { out.push([p.x, p.z, CELL / 2 - .2, CELL / 2 - .2, p.L, 1.1]); }
    out.forEach(function (q) { var w = { x: q[0], z: q[1], hw: q[2], hd: q[3], y0: q[4], h: q[5], m: MATW[p.m] || 'bois', house: null, alive: true, hp: p.hp, build: p, flat: p.t === 'esc' ? 2 : 1, cut: true }; C.WALLS.push(w); p.ws.push(w); }); }
  function flatFree(p) { (p.ws || []).forEach(function (w) { var wi = C.WALLS.indexOf(w); if (wi >= 0) C.WALLS.splice(wi, 1); }); p.ws = []; }
  function floorMesh(p) { var P = [], N = [], U = [], I = [], H2 = CELL / 2, t = .08;
    function quad(A, B, C2, D, n) { var b = P.length / 3; [A, B, C2, D].forEach(function (q) { P.push(q[0], q[1], q[2]); N.push(n[0], n[1], n[2]); U.push((n[1] ? q[0] : n[0] ? q[2] : q[0]) / CELL + .5, (n[1] ? q[2] : q[1] * 4) / CELL + .5); }); I.push(b, b + 1, b + 2, b, b + 2, b + 3); }
    for (var i = 0; i < 4; i++) { if (p.mask[i]) continue; var x0 = i % 2 ? 0 : -H2, x1 = x0 + H2, z0 = i > 1 ? 0 : -H2, z1 = z0 + H2;
      quad([x0, t, z1], [x1, t, z1], [x1, t, z0], [x0, t, z0], [0, 1, 0]); quad([x0, -t, z0], [x1, -t, z0], [x1, -t, z1], [x0, -t, z1], [0, -1, 0]);
      quad([x0, -t, z1], [x1, -t, z1], [x1, t, z1], [x0, t, z1], [0, 0, 1]); quad([x1, -t, z0], [x0, -t, z0], [x0, t, z0], [x1, t, z0], [0, 0, -1]);
      quad([x1, -t, z1], [x1, -t, z0], [x1, t, z0], [x1, t, z1], [1, 0, 0]); quad([x0, -t, z0], [x0, -t, z1], [x0, t, z1], [x0, t, z0], [-1, 0, 0]);
      /* petit rebord (≈ 45 cm) le long de chaque côté coupé, comme sur les sols édités */
      if (p.mask[i ^ 1]) { var rx = i % 2 ? .045 : -.045; rail(rx - .045, rx + .045, z0, z1); }
      if (p.mask[i ^ 2]) { var rz = i > 1 ? .045 : -.045; rail(x0, x1, rz - .045, rz + .045); } }
    function rail(a0, a1, b0, b1) { var y0 = t, y1 = t + .45; quad([a0, y1, b1], [a1, y1, b1], [a1, y1, b0], [a0, y1, b0], [0, 1, 0]); quad([a0, y0, b1], [a1, y0, b1], [a1, y1, b1], [a0, y1, b1], [0, 0, 1]); quad([a1, y0, b0], [a0, y0, b0], [a0, y1, b0], [a1, y1, b0], [0, 0, -1]);
      quad([a1, y0, b1], [a1, y0, b0], [a1, y1, b0], [a1, y1, b1], [1, 0, 0]); quad([a0, y0, b0], [a0, y0, b1], [a0, y1, b1], [a0, y1, b0], [-1, 0, 0]); }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(N, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(U, 2)); g.setIndex(I);
    var m = new T.Mesh(g, p.im.material); m.castShadow = m.receiveShadow = true; m.userData.dyn = true; m.position.set(p.x, p.L, p.z); C.scene.add(m); return m; }
  /* ESCALIER ÉDITÉ façon Fortnite (grille 3×3, cases 0 1 2 le long de +x, rangées le long de +z) :
     · glisser la case du MILIEU vers un bord (ou une ligne qui passe par le milieu) = l'escalier PIVOTE dans ce sens
     · 3 cases en ligne sur un BORD = DEMI-ESCALIER de ce côté, qui monte dans le sens du glissé
     · 5 cases en L le long de 2 bords = ESCALIER QUI TOURNE (« house stairs ») : une volée, un palier dans le coin, une volée à 90° */
  function tcr(i) { return [i % 3, Math.floor(i / 3)]; }
  function dirOf(a, b) { var A = tcr(a), B = tcr(b), dc = B[0] - A[0], dr = B[1] - A[1]; if (dr === 0 && dc) return dc > 0 ? 0 : 2; if (dc === 0 && dr) return dr > 0 ? 1 : 3; return -1; }
  function lineOk(P) { for (var i = 1; i < P.length; i++) { var A = tcr(P[i - 1]), B = tcr(P[i]); if (Math.abs(A[0] - B[0]) + Math.abs(A[1] - B[1]) !== 1) return false; } return true; }
  function rampEditOf(P) { if (!P.length || !lineOk(P)) return null; var d = dirOf(P[0], P[P.length - 1]);
    if (P.length === 2 && (P[0] === 4 || P[1] === 4) && d >= 0) return { d: d, rp: null };   // on fait pivoter avec la case du milieu
    if (P.length === 3 && d >= 0) { if (P[1] === 4) return { d: d, rp: null }; if (P.indexOf(4) < 0) return { d: d, rp: P.slice() }; return null; }   // ligne au milieu = pivoter, ligne sur un bord = demi-escalier
    if (P.length === 5 && P.indexOf(4) < 0) { var d1 = dirOf(P[0], P[2]), d2 = dirOf(P[2], P[4]); if (d1 >= 0 && d2 >= 0 && d1 % 2 !== d2 % 2 && dirOf(P[0], P[1]) === d1 && dirOf(P[2], P[3]) === d2) return { d: d1, rp: P.slice() }; }
    return null; }
  function rampShape(p) { var H = CELL / 2, W = CELL / 2, P = p.rp;
    if (!P) return [{ x0: -H, x1: H, z0: -H, z1: H, d: p.d, y0: 0, y1: LH }];
    function band(i, alongX) { var cr = tcr(i), k = alongX ? cr[1] : cr[0]; return k === 0 ? [-H, -H + W] : k === 2 ? [H - W, H] : [-W / 2, W / 2]; }
    function rect(alongX, a0, a1, bd) { return alongX ? { x0: a0, x1: a1, z0: bd[0], z1: bd[1] } : { x0: bd[0], x1: bd[1], z0: a0, z1: a1 }; }
    var d1 = dirOf(P[0], P[2]), ax1 = d1 % 2 === 0, s1 = d1 < 2 ? 1 : -1;
    if (P.length === 3) { var r = rect(ax1, -H, H, band(P[0], ax1)); r.d = d1; r.y0 = 0; r.y1 = LH; return [r]; }
    var d2 = dirOf(P[2], P[4]), ax2 = d2 % 2 === 0, s2 = d2 < 2 ? 1 : -1, b1 = band(P[0], ax1), hiEnd = s1 > 0 ? [H - W, H] : [-H, -H + W], loEnd2 = s2 > 0 ? [-H, -H + W] : [H - W, H];
    var leg1 = rect(ax1, s1 > 0 ? -H : -H + W, s1 > 0 ? H - W : H, b1); leg1.d = d1; leg1.y0 = 0; leg1.y1 = LH / 2;
    var land = rect(ax1, hiEnd[0], hiEnd[1], loEnd2); land.d = d2; land.y0 = land.y1 = LH / 2;
    var leg2 = rect(ax2, s2 > 0 ? -H + W : -H, s2 > 0 ? H : H - W, hiEnd); leg2.d = d2; leg2.y0 = LH / 2; leg2.y1 = LH;
    return [leg1, land, leg2]; }
  function segY(sg, lx, lz) { var f = sg.d === 0 ? (lx - sg.x0) / (sg.x1 - sg.x0) : sg.d === 2 ? (sg.x1 - lx) / (sg.x1 - sg.x0) : sg.d === 1 ? (lz - sg.z0) / (sg.z1 - sg.z0) : (sg.z1 - lz) / (sg.z1 - sg.z0); return sg.y0 + (sg.y1 - sg.y0) * Math.max(0, Math.min(1, f)); }
  function rampMesh(p) { var grp = new T.Group(); grp.userData.dyn = true; rampShape(p).forEach(function (sg) { var len = sg.d % 2 ? sg.z1 - sg.z0 : sg.x1 - sg.x0, wid = sg.d % 2 ? sg.x1 - sg.x0 : sg.z1 - sg.z0, dy = sg.y1 - sg.y0, a = Math.atan2(dy, len), th = .15;
      var g = new T.BoxGeometry(Math.hypot(len, dy), th, wid - .04); g.rotateZ(a); g.translate(Math.sin(a) * th / 2, -Math.cos(a) * th / 2, 0); g.rotateY(-sg.d * Math.PI / 2);
      var m = new T.Mesh(g, p.im.material); m.castShadow = m.receiveShadow = true; m.position.set((sg.x0 + sg.x1) / 2, (sg.y0 + sg.y1) / 2, (sg.z0 + sg.z1) / 2); grp.add(m); });
    grp.geometry = { dispose: function () { grp.children.forEach(function (q) { q.geometry.dispose(); }); } }; grp.position.set(p.x, p.L, p.z); C.scene.add(grp); return grp; }
  /* TOIT ÉDITÉ (grille 2×2) : on ne retire rien, chaque case choisie LÈVE son coin. 1 case = un coin levé ;
     2 cases d'un même côté = ce côté levé → pente qui monte vers ce côté (escalier) ; 2 en diagonale = arête en travers ; 3 = coins levés autour d'un coin bas. */
  function roofGrid(p) { var m = p.mask || [], RH = LH, ch = function (i) { return m[i] ? RH : 0; }, c00 = ch(0), c10 = ch(1), c01 = ch(2), c11 = ch(3);
    if (!m.some(Boolean)) return [[0, 1.2, 0], [1.2, 2.4, 1.2], [0, 1.2, 0]];   // chapeau d'origine (pointe au milieu)
    var mid = (c00 + c10 + c01 + c11) / 4; if (m[0] && m[3] && !m[1] && !m[2] || m[1] && m[2] && !m[0] && !m[3]) mid = RH;   // diagonale : arête qui passe par le milieu
    return [[c00, (c00 + c10) / 2, c10], [(c00 + c01) / 2, mid, (c10 + c11) / 2], [c01, (c01 + c11) / 2, c11]]; }   // [rangée z][colonne x]
  function roofY(p, dx, dz) { var G = roofGrid(p), H = CELL / 2, fx = Math.max(0, Math.min(2, (dx + H) / H)), fz = Math.max(0, Math.min(2, (dz + H) / H)), c = Math.min(1, Math.floor(fx)), r = Math.min(1, Math.floor(fz)), u = fx - c, v = fz - r;
    return G[r][c] * (1 - u) * (1 - v) + G[r][c + 1] * u * (1 - v) + G[r + 1][c] * (1 - u) * v + G[r + 1][c + 1] * u * v; }
  function roofMesh(p) { var G = roofGrid(p), H = CELL / 2, P = [], U = [], I = [], th = .12;
    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) { P.push(-H + c * H, G[r][c], -H + r * H); U.push(c / 2, r / 2); }
    for (r = 0; r < 2; r++) for (c = 0; c < 2; c++) { var a = r * 3 + c, b = a + 1, d = a + 3, e = d + 1; I.push(a, d, e, a, e, b); }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setIndex(I); g = slopeUV(g);
    var mat = p.im.material.clone(); mat.side = T.DoubleSide; var m = new T.Mesh(g, mat); m.receiveShadow = true; var grp = new T.Group(); grp.userData.dyn = true; grp.add(m); grp.position.set(p.x, p.L + th / 2, p.z); C.scene.add(grp);
    grp.geometry = { dispose: function () { g.dispose(); mat.dispose(); } }; return grp; }
  function pieceShow(p) { if (p.t === 'toit' && p.mask && p.mask.some(Boolean)) { p.im.setMatrixAt(p.ii, ZERO); p.im.instanceMatrix.needsUpdate = true; p.tri = roofMesh(p); p._cp = null; flatSegs(p); return; }
    if (p.t === 'esc' && p.rp) { p.im.setMatrixAt(p.ii, ZERO); p.im.instanceMatrix.needsUpdate = true; p.tri = rampMesh(p); p._cp = null; flatSegs(p); return; }
    var cut = p.t === 'sol' && p.mask && p.mask.some(Boolean); p.im.setMatrixAt(p.ii, cut ? ZERO : pieceMatrix(p, O3 || (O3 = new T.Object3D()))); p.im.instanceMatrix.needsUpdate = true; if (cut) p.tri = floorMesh(p); p._cp = null; if (p.t !== 'lit' && p.t !== 'coffre') flatSegs(p); }
  function pieceHide(p) { p.im.setMatrixAt(p.ii, ZERO); p.im.instanceMatrix.needsUpdate = true; if (p.tri) { C.scene.remove(p.tri); p.tri.geometry.dispose(); p.tri = null; } flatFree(p); }
  function ceilAt(x, z, y0, y1) { var c = null; for (var i = 0; i < C.WALLS.length; i++) { var w = C.WALLS[i]; if (!w.flat || !w.alive || Math.abs(x - w.x) > w.hw + .25 || Math.abs(z - w.z) > w.hd + .25) continue; if (w.y0 >= y0 - .05 && w.y0 < y1 && (c == null || w.y0 < c)) c = w.y0; } return c; }
  function wallFree(p) { (p.doors || []).forEach(function (d) { window.DOORS && DOORS.kill(d); }); p.doors = null; if (p.tri) { C.scene.remove(p.tri); p.tri.geometry.dispose(); p.tri = null; } (p.ws || []).forEach(function (w) { var wi = C.WALLS.indexOf(w); if (wi >= 0) C.WALLS.splice(wi, 1); if (w.alive) C.setWall(w, false); p.im.free.push(w.ii); }); p.ws = []; p.w = null; }
  function placePiece(p) { if (p.t === 'lit') return placeBed(p);
    var im = pieceIM(p.t, p.m); if (!im.free.length) return false; p.im = im; if (!p.hp) { p.hmax = hpMax(p); p.hp = p.t === 'lit' || p.t === 'coffre' ? p.hmax : Math.round(p.hmax * (HP0[p.m] || 90) / (HPP[p.m] || 150)); p.grow = p.hp < p.hmax; }
    if (p.t === 'mur') { slotWalls(p, true).forEach(function (w) { w.alive = false; C.setWall(w, false); }); wallSegs(p, im); }
    else { p.ii = im.free.pop(); if (p.d0 == null) p.d0 = p.d; pieceShow(p); }
    PIECES.push(p); return true; }
  /* SOLIDITÉ comme Fortnite : une pièce qui n'est plus reliée au sol (directement ou par d'autres pièces) TOMBE */
  function grounded(p) { if (isIX(p.m)) return true;   /* un mur incassable tient toujours */ if (p.t === 'mur' && p.mask && p.mask[0] && p.mask[1] && p.mask[2]) return false;   /* rangée du bas enlevée : le mur ne touche plus le sol */
    var g = C.hgt(p.x, p.z); if (window.INTERIORS && INTERIORS.groundAt) g = Math.max(g, INTERIORS.groundAt(p.x, p.z, p.L + .5)); return p.L <= g + .6; }
  /* LIENS ENTRE PIÈCES comme Fortnite : deux pièces se tiennent seulement si elles partagent une arête (bas d'un mur sur le bord d'un sol,
     mur posé pile sur un mur, coin de deux murs, bas d'une rampe sur un sol…). Un mur décalé en « escalier » sur un autre ne tient plus. */
  function cpts(p) { if (p._cp) return p._cp; var H = CELL / 2, L = p.L, x = p.x, z = p.z, o;
    if (p.t === 'mur') { var ax = p.hw > p.hd, mk = p.mask || []; o = [[x, L + LH / 2, z]]; if (!(mk[0] && mk[1] && mk[2])) o.push([x, L, z]); if (!(mk[6] && mk[7] && mk[8])) o.push([x, L + LH, z]);   /* un côté entièrement enlevé ne tient plus rien */
      if (!(mk[0] && mk[3] && mk[6])) o.push(ax ? [x - H, L + LH / 2, z] : [x, L + LH / 2, z - H]); if (!(mk[2] && mk[5] && mk[8])) o.push(ax ? [x + H, L + LH / 2, z] : [x, L + LH / 2, z + H]); }
    else if (p.t === 'esc') { var dx = [1, 0, -1, 0][p.d], dz = [0, 1, 0, -1][p.d]; o = [[x - dx * H, L, z - dz * H], [x + dx * H, L + LH, z + dz * H], [x + dz * H, L + LH / 2, z - dx * H], [x - dz * H, L + LH / 2, z + dx * H]]; }
    else o = [[x - H, L, z], [x + H, L, z], [x, L, z - H], [x, L, z + H]];
    return (p._cp = o); }
  function linked(a, b) { if (Math.abs(a.L - b.L) > LH + .3 || Math.abs(a.x - b.x) > CELL + .3 || Math.abs(a.z - b.z) > CELL + .3) return false; var A = cpts(a), B = cpts(b);
    for (var i = 0; i < A.length; i++) for (var j = 0; j < B.length; j++) if (Math.abs(A[i][0] - B[j][0]) < .35 && Math.abs(A[i][1] - B[j][1]) < .35 && Math.abs(A[i][2] - B[j][2]) < .35) return true; return false; }
  function houseTouch(p) { for (var j = 0; j < C.WALLS.length; j++) { var w = C.WALLS[j]; if (!w.alive || w.build) continue; if (Math.abs(w.x - p.x) < w.hw + CELL / 2 + .3 && Math.abs(w.z - p.z) < w.hd + CELL / 2 + .3 && w.y0 < p.L + LH + .2 && w.y0 + w.h > p.L - .3) return true; } return false; }
  var SUPT = 0; function support() { SUPT = 0; var ok = new Set(), q = []; PIECES.forEach(function (p) { if (p.t === 'lit' || grounded(p) || houseTouch(p)) { ok.add(p); q.push(p); } });
    while (q.length) { var a = q.pop(); for (var i = 0; i < PIECES.length; i++) { var b = PIECES[i]; if (!ok.has(b) && linked(a, b)) { ok.add(b); q.push(b); } } }
    var fall = PIECES.filter(function (p) { return !ok.has(p); }); fall.forEach(function (p, k) { setTimeout(function () { removePiece(p, true, true); }, 60 + k * 45); }); }
  function removePiece(p, fx, noChk) { var i = PIECES.indexOf(p); if (i < 0) return; PIECES.splice(i, 1); if (HOOK && !p._net) HOOK('r', { key: p.key }); if (!noChk && fx && !SUPT) { SUPT = 1; setTimeout(support, 120); }
    if (p.t === 'mur') wallFree(p);
    else { pieceHide(p); p.im.free.push(p.ii); }
    if (fx) { var c = C.MATS[MATW[p.m]].col; C.burst(p.x, p.L + 1.5, p.z, 16, [c, c, '#5a3a20'], 7, .5, 1.4); C.SFX.crack(); } }
  /* ÉDITER (façon Fortnite) : on vise un de ses murs → grille de 9 cases bleues ; on tire/clique sur les cases à enlever ; ÉDITER à nouveau = valider */
  /* ===== HISTOIRE DE LA SURVIE : la Brume Violette, le LIVRE DES CRÉATURES et les AFFICHES à découvrir ===== */
  var LORE = {
    rodeur: "Les premiers touchés par la Brume Violette. Ils errent là où ils vivaient, comme s'ils cherchaient encore leur maison. Lents, mais jamais seuls.",
    brute: "D'anciens bûcherons et mineurs. La Brume a gonflé leurs muscles. Ils cassent les murs pour t'attraper : construis en pierre ou en métal.",
    coureur: "Rapides et maigres, ils sentent ta présence de loin. Un seul coureur en attire souvent d'autres. Ne cours pas en ligne droite.",
    bizarre: "Leur tête a doublé de volume. Les savants du Camp pensaient qu'ils « entendent » la Brume. Ils sont plus malins que les autres.",
    hurleur: "Rose et couvert d'épines, il hurle pour appeler la meute. On le trouve près des villages brûlés. Rare.",
    colosse: "Un géant recouvert de mousse, né dans les forêts sombres. Très lent, mais un coup suffit à briser un mur en bois.",
    spectre: "Il n'apparaît que la nuit, pâle et bleuté, glissant dans la brume. Plus rapide que tout. Allume un feu… ou fuis.",
    roi: "On dit qu'il est la source de la Brume Violette. Une couronne d'or sur la tête. Personne ne l'a jamais vaincu… pour l'instant." };
  var AFF = [   // affiches posées sur des pierres : un morceau de l'histoire + un indice sur une créature
    ['Camp du Départ', 'JOURNAL DU CAMP · JOUR 1', "La Brume Violette est sortie de la terre au nord. Ceux qu'elle touche ne dorment plus. Si tu lis ceci : construis, pose ton lit, et note tout ce que tu croises dans le Livre des créatures.", 'rodeur'],
    ['Village Brûlé', 'AVIS DE RECHERCHE', "Un HURLEUR rôde autour du village. Ses cris réveillent les autres. Il est rose, couvert d'épines. Récompense à qui le fera taire.", 'hurleur'],
    ['Refuge des Loups', 'NOTE DU GARDE-FORESTIER', "Dans la forêt sombre, quelque chose de très grand bouge entre les sapins. La mousse pousse sur son dos. On l'appelle le COLOSSE.", 'colosse'],
    ['Ruines du Nord', 'GRAVURE SUR LA PIERRE', "« Quand la lune est haute, les SPECTRES glissent dans la brume. Ils ne laissent pas de traces. »", 'spectre'],
    ['Ferme Abandonnée', 'CARNET DU FERMIER', "Mes ouvriers sont devenus des BRUTES. Ils ont défoncé la grange à mains nues. Les murs en bois ne servent à rien.", 'brute'],
    ['Plage des Naufragés', 'BOUTEILLE À LA MER', "Le bateau a coulé à cause des COUREURS : ils ont couru jusque dans l'eau pour nous attraper. Ne les sous-estime pas.", 'coureur'],
    ['Col des Brumes', 'MESSAGE DES SAVANTS', "Les BIZARRES suivent la Brume comme une boussole. Suivez-les, et vous trouverez sa source…", 'bizarre'],
    ['Avant-poste', 'DERNIÈRE PAGE', "La source a une couronne. Le ROI VIOLET ne sort que rarement. Celui qui le battra libérera les Terres Sauvages.", 'roi']];
  var BESTI = {}, AFFD = {}, AFFM = [], BOOKON = false, NEARAFF = -1;
  try { BESTI = JSON.parse(localStorage.getItem('wr_bestiaire') || '{}'); AFFD = JSON.parse(localStorage.getItem('wr_affiches') || '{}'); } catch (e) {}
  function lsave() { try { localStorage.setItem('wr_bestiaire', JSON.stringify(BESTI)); localStorage.setItem('wr_affiches', JSON.stringify(AFFD)); } catch (e) {} }
  function onKill(z, K) { if (!K) return; var first = !BESTI[K.id]; BESTI[K.id] = (BESTI[K.id] || 0) + 1; lsave();
    if (first) { C.toast('📖 NOUVELLE CRÉATURE : ' + K.name.toUpperCase() + ' (' + K.rar + ') · sa fiche est dans ton Livre des créatures'); C.tone('triangle', 660, 1320, .35, .08);
      var kk0 = window.ZOMB && ZOMB.kinds ? ZOMB.kinds() : [], kn0 = kk0.filter(function (k) { return BESTI[k.id]; }).length; if (window.WRUNLOCK) setTimeout(function () { WRUNLOCK(kn0); }, 1800); }
    else C.toast('🧟 ' + K.name + ' éliminé · ' + BESTI[K.id] + ' au total'); }
  function posters() { var kinds = window.ZOMB && ZOMB.kinds ? ZOMB.kinds() : [];
    AFF.forEach(function (a, i) { var t = C.TOWNS.filter(function (q) { return q[0] === a[0]; })[0]; if (!t) return; var x = t[1] + t[3] * .45, z = t[2] - t[3] * .2, y = C.hgt(x, z);
      var g = new T.Group(), st = new T.Mesh(new T.BoxGeometry(1.6, 2.4, .5), new T.MeshLambertMaterial({ color: '#6a6a72' })); st.position.y = 1.1; st.rotation.z = .04; g.add(st);
      var c = document.createElement('canvas'); c.width = 256; c.height = 320; var q = c.getContext('2d'); q.fillStyle = '#e8d8b0'; q.fillRect(0, 0, 256, 320); for (var n = 0; n < 500; n++) { q.fillStyle = 'rgba(90,60,20,' + Math.random() * .12 + ')'; q.fillRect(Math.random() * 256, Math.random() * 320, 3, 3); }
      q.fillStyle = '#3a0a5a'; q.font = '900 22px sans-serif'; q.textAlign = 'center'; q.fillText(a[1].split(' · ')[0], 128, 40); q.fillStyle = '#7a2fff'; q.beginPath(); q.arc(128, 150, 70, 0, 6.283); q.fill(); q.fillStyle = '#e8ff4a'; q.beginPath(); q.arc(104, 140, 10, 0, 6.283); q.arc(152, 140, 10, 0, 6.283); q.fill();
      q.fillStyle = '#2a0a3a'; q.fillRect(98, 180, 60, 10); q.fillStyle = '#3a0a5a'; q.font = '900 26px sans-serif'; var kk = kinds.filter(function (k) { return k.id === a[3]; })[0]; q.fillText((kk ? kk.name : '?').toUpperCase(), 128, 268); q.font = '700 14px sans-serif'; q.fillText('LIS-MOI', 128, 298);
      var tx = new T.CanvasTexture(c); tx.encoding = T.sRGBEncoding; var pm = new T.Mesh(new T.PlaneGeometry(1.2, 1.5), new T.MeshBasicMaterial({ map: tx })); pm.position.set(0, 1.35, .26); g.add(pm); var pm2 = pm.clone(); pm2.rotation.y = Math.PI; pm2.position.z = -.26; g.add(pm2);
      var gl = new T.PointLight('#c77dff', .8, 6, 2); gl.position.set(0, 2.6, .8); g.add(gl); g.position.set(x, y, z); g.rotation.y = Math.atan2(t[1] - x, t[2] - z); g.userData.dyn = true; C.scene.add(g); AFFM.push({ i: i, x: x, z: z }); }); }
  function affTick() { var P = me(), near = -1; AFFM.forEach(function (m) { if (Math.hypot(P.x - m.x, P.z - m.z) < 3.2) near = m.i; });
    if (near !== NEARAFF) { NEARAFF = near; var el = document.getElementById('sAff'); if (near < 0) { if (el) el.hidden = true; return; } var a = AFF[near], first = !AFFD[near]; AFFD[near] = 1; lsave();
      if (!el) { el = document.createElement('div'); el.id = 'sAff'; document.body.appendChild(el); } el.hidden = false; el.innerHTML = '<small>' + (first ? '📜 AFFICHE DÉCOUVERTE · ' : '📜 ') + a[0].toUpperCase() + '</small><b>' + a[1] + '</b><p>' + a[2] + '</p><i>Indice ajouté au Livre des créatures</i>'; if (first) C.tone('sine', 520, 1040, .3, .06); } }
  function book(on) { var d = document.getElementById('sBook'); if (!d) { d = document.createElement('div'); d.id = 'sBook'; document.body.appendChild(d); d.addEventListener('pointerdown', function (e) { if (e.target === d || e.target.classList.contains('x')) { e.preventDefault(); book(false); } }); }
    BOOKON = on; d.hidden = !on; if (!on) return; if (document.pointerLockElement) document.exitPointerLock(); var kinds = window.ZOMB && ZOMB.kinds ? ZOMB.kinds() : [], known = kinds.filter(function (k) { return BESTI[k.id]; }).length, RC = { 'Commun': '#b9bcc4', 'Peu commun': '#4dd65a', 'Rare': '#3d9bff', 'Épique': '#b05cff', 'Légendaire': '#ffb52e' };
    d.innerHTML = '<div class="bk"><button type="button" class="x">✕</button><h2>📖 LIVRE DES CRÉATURES</h2><p class="sub">La Brume Violette · ' + known + '/' + kinds.length + ' espèces découvertes · ' + Object.keys(AFFD).length + '/' + AFF.length + ' affiches</p>' + (window.WRUNLOCKS ? '<div class="rw">' + WRUNLOCKS().map(function (u) { return '<span class="' + (known >= u[0] ? 'ok' : '') + '">' + (known >= u[0] ? '💃 ' : '🔒 ') + u[1] + ' <i>' + u[0] + ' espèces</i></span>'; }).join('') + '</div>' : '') + '<div class="pg">' +
      kinds.map(function (k) { var n = BESTI[k.id] || 0, hint = AFF.filter(function (a, i) { return a[3] === k.id && AFFD[i]; })[0];
        return '<div class="ent' + (n ? '' : ' lock') + '" style="--r:' + RC[k.rar] + '"><div class="ic">' + (n ? '🧟' : '❔') + '</div><div><b>' + (n ? k.name : '???') + '</b><small>' + k.rar + (k.night ? ' · la nuit' : '') + (n ? ' · ' + n + ' tué' + (n > 1 ? 's' : '') + ' · ' + k.hp + ' PV' : '') + '</small><p>' + (n ? LORE[k.id] : hint ? '🔎 Indice : ' + hint[2] : 'Tue cette créature pour découvrir sa fiche. Les affiches cachées dans les lieux donnent des indices.') + '</p></div></div>'; }).join('') + '</div></div>'; }
  /* JEU EN LIGNE : chaque pièce posée / cassée / éditée est envoyée aux potes (HOOK branché par index.html) */
  var HOOK = null;
  function mkStr(p) { return p.t === 'esc' && p.rp ? 'r' + p.rp.join('') : p.mask ? p.mask.map(Number).join('') : ''; }
  function mkParse(v, p) { var s2 = v ? String(v) : ''; if (s2.charAt(0) === 'r') { p.rp = s2.slice(1).split('').map(Number); return null; } return s2 ? s2.split('').map(function (c) { return c === '1'; }) : null; }   /* escalier édité : « r » + le chemin des cases (ex. r03678) */
  function ser(p) { return [p.t, p.m, p.x, p.z, p.L, p.d, p.key, p.hw || 0, p.hd || 0, mkStr(p)]; }
  function netPlace(a) { if (!a || taken(a[6])) return; var p = { t: a[0], m: a[1], x: a[2], z: a[3], L: a[4], d: a[5], key: a[6], hw: a[7] || undefined, hd: a[8] || undefined, _net: true }; p.mask = mkParse(a[9], p); placePiece(p); }
  function netRemove(key) { for (var i = 0; i < PIECES.length; i++) if (PIECES[i].key === key) { var p = PIECES[i]; p._net = true; removePiece(p, true); return; } }
  function netEdit(key, mk) { mk = mk == null ? '' : String(mk); PIECES.forEach(function (p) { if (p.key !== key) return;
      if (p.t === 'esc') { if (/^d[0-3]$/.test(mk)) editApply(p, +mk.charAt(1)); else if (/^r\d{3,5}$/.test(mk)) { var re2 = rampEditOf(mk.slice(1).split('').map(Number)); if (re2) editApply(p, re2.rp ? re2 : re2.d); } } else if (p.t === 'mur' || p.t === 'sol' || p.t === 'toit') editApply(p, mk ? mk.split('').map(function (c) { return c === '1'; }) : null); }); support(); }
  var EDW = null, EMK = null, EGRID = null, ELAST = false;
  /* ÉDITION façon Fortnite de TOUTES les pièces : MUR = grille 3×3, SOL = 2×2 (on enlève 1 à 3 cases), ESCALIER = 2×2 (on choisit 2 cases
     côte à côte, du bas vers le haut → l'escalier tourne dans ce sens). Les cases sont un hologramme bleu transparent ; les cases choisies s'éteignent. */
  function rayRamp(p, o, d) { var ax = p.d % 2 === 0, sg = p.d < 2 ? 1 : -1, ou = (ax ? o.x - p.x : o.z - p.z) * sg + CELL / 2, du = (ax ? d.x : d.z) * sg, k = LH / CELL, den = d.y - k * du; if (Math.abs(den) < 1e-6) return Infinity;
    var t = (p.L + k * ou - o.y) / den; if (t < 0) return Infinity; var x = o.x + d.x * t, z = o.z + d.z * t; return Math.abs(x - p.x) <= CELL / 2 + .05 && Math.abs(z - p.z) <= CELL / 2 + .05 ? t : Infinity; }
  function aimWall(any) { var P = me(), cm = C.cam(), d = new T.Vector3(); cm.getWorldDirection(d); var o = cm.position, best = null, bt = 15;
    PIECES.forEach(function (p) { if (Math.abs(p.x - P.x) > 9 || Math.abs(p.z - P.z) > 9) return; var t;
      if (p.t === 'mur') t = C.rayBox(o.x, o.y, o.z, d.x, d.y, d.z, p.x - p.hw - .1, p.L, p.z - p.hd - .1, p.x + p.hw + .1, p.L + LH, p.z + p.hd + .1);
      else if (any && p.t === 'sol') t = C.rayBox(o.x, o.y, o.z, d.x, d.y, d.z, p.x - CELL / 2, p.L - .12, p.z - CELL / 2, p.x + CELL / 2, p.L + .12, p.z + CELL / 2);
      else if (any && p.t === 'esc') { t = rayRamp(p, o, d); if (EDW === p && Math.abs(d.y) > .02) { var tf = (p.L + .06 - o.y) / d.y, fx = o.x + d.x * tf - p.x, fz = o.z + d.z * tf - p.z; if (tf > 0 && Math.abs(fx) <= CELL / 2 + .3 && Math.abs(fz) <= CELL / 2 + .3) t = tf; } }   // en édition : grille À PLAT au pied de l'escalier
      else if (any && p.t === 'toit') t = C.rayBox(o.x, o.y, o.z, d.x, d.y, d.z, p.x - CELL / 2, p.L - .1, p.z - CELL / 2, p.x + CELL / 2, p.L + 2.5, p.z + CELL / 2); else return;
      if (t < bt) { bt = t; best = p; } });
    return best ? { p: best, t: bt, o: o, d: d } : null; }
  function aimEdit() { return aimWall(true); }
  function NT(p) { return p.t === 'mur' || p.t === 'esc' ? 9 : 4; }
  function rampY(p, x, z) { var u = (p.d === 0 ? x - p.x : p.d === 1 ? z - p.z : p.d === 2 ? p.x - x : p.z - z) + CELL / 2; return p.L + Math.max(0, Math.min(CELL, u)) * LH / CELL; }
  function gridDraw() { if (!EGRID) { EGRID = new T.Group(); EGRID.userData.dyn = true; EGRID.renderOrder = 6; for (var i = 0; i < 9; i++) { var m = new T.Mesh(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial({ color: '#4fb8ff', transparent: true, opacity: .34, depthWrite: false })); m.renderOrder = 6; EGRID.add(m);
        var e = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(1, 1, 1)), new T.LineBasicMaterial({ color: '#dff4ff', transparent: true, opacity: .95 })); e.renderOrder = 7; m.add(e); } C.scene.add(EGRID); }
    EGRID.visible = !!EDW; if (!EDW) { if (EARR) arrowsDraw(null); return; } var p = EDW, n = NT(p);
    EGRID.children.forEach(function (m, i) { m.visible = i < n; if (i >= n) return; m.rotation.set(0, 0, 0); var on = EMK[i], e = m.children[0];
      if (p.t === 'mur') { var ax = p.hw > p.hd, cw = CELL / 3, rh = LH / 3, r = Math.floor(i / 3), c = i % 3, u = -CELL / 2 + (c + .5) * cw; m.position.set(p.x + (ax ? u : 0), p.L + (r + .5) * rh, p.z + (ax ? 0 : u)); m.scale.set(ax ? cw - .06 : WTH * 2 + .12, rh - .06, ax ? WTH * 2 + .12 : cw - .06); }
      else if (p.t === 'esc') { var c3 = i % 3, r3 = Math.floor(i / 3), x0 = RB[c3], x1 = RB[c3 + 1], z0 = RB[r3], z1 = RB[r3 + 1];   // grille À PLAT au pied de l'escalier, cases du milieu plus fines
        m.position.set(p.x + (x0 + x1) / 2, p.L + .07, p.z + (z0 + z1) / 2); m.scale.set(x1 - x0 - .08, .06, z1 - z0 - .08); }
      else { var Q = CELL / 4, x = p.x + (i % 2 ? Q : -Q), z = p.z + (i > 1 ? Q : -Q), y = p.t === 'toit' ? p.L + 1.25 : p.L + .02; m.position.set(x, y, z); m.scale.set(CELL / 2 - .08, .2, CELL / 2 - .08); }
      m.material.color.set(on ? '#ffb02e' : '#4fb8ff'); m.material.opacity = on ? .12 : .36; e.material.color.set(on ? '#ffd27a' : '#dff4ff'); m.material.depthTest = e.material.depthTest = p.t !== 'esc';   // escalier : la grille au sol se voit À TRAVERS les marches
    });
    arrowsDraw(p); }
  /* FLÈCHES sur la grille de l'escalier : montrent dans quel sens ça monte (forme actuelle, ou forme qu'on est en train de faire) */
  var RB = [-CELL / 2, -.6, .6, CELL / 2], EARR = null;
  function arrowTex() { var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d'); g.strokeStyle = '#ffffff'; g.lineWidth = 16; g.lineCap = g.lineJoin = 'round';
    [[30, 0], [70, 0]].forEach(function (q) { g.beginPath(); g.moveTo(q[0], 26); g.lineTo(q[0] + 30, 64); g.lineTo(q[0], 102); g.stroke(); }); var t = new T.CanvasTexture(c); return t; }
  function arrowsDraw(p) { if (!EARR) { EARR = []; var tx = arrowTex(); for (var i = 0; i < 9; i++) { var g = new T.PlaneGeometry(1, 1); g.rotateX(-Math.PI / 2); var a = new T.Mesh(g, new T.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false, depthTest: false, color: '#ffffff' })); a.renderOrder = 8; a.userData.dyn = true; C.scene.add(a); EARR.push(a); } }
    var show = p && p.t === 'esc' && EDW === p, dirs = new Array(9).fill(-1);
    if (show) { var RE = ESEL.length ? rampEditOf(ESEL) : null, shp = RE ? rampShape({ d: RE.d, rp: RE.rp }) : ESEL.length ? null : rampShape(p);
      if (shp) for (var k = 0; k < 9; k++) { var cx = (RB[k % 3] + RB[k % 3 + 1]) / 2, cz = (RB[Math.floor(k / 3)] + RB[Math.floor(k / 3) + 1]) / 2; shp.forEach(function (sg) { if (cx >= sg.x0 - .01 && cx <= sg.x1 + .01 && cz >= sg.z0 - .01 && cz <= sg.z1 + .01 && sg.y1 > sg.y0) dirs[k] = sg.d; }); }
      else ESEL.forEach(function (t2, j) { var a2 = j ? ESEL[j - 1] : t2, b2 = j ? t2 : ESEL[1]; if (b2 != null) dirs[t2] = dirOf(a2, b2); }); }
    EARR.forEach(function (a, k) { a.visible = show && dirs[k] >= 0; if (!a.visible) return; var c3 = k % 3, r3 = Math.floor(k / 3), w = Math.min(RB[c3 + 1] - RB[c3], RB[r3 + 1] - RB[r3]) * .72;
      a.position.set(p.x + (RB[c3] + RB[c3 + 1]) / 2, p.L + .12, p.z + (RB[r3] + RB[r3 + 1]) / 2); a.scale.set(w, 1, w); a.rotation.y = -dirs[k] * Math.PI / 2; a.material.color.set(ESEL.length ? '#ffd27a' : '#ffffff'); }); }
  /* ÉDITS DE MUR AUTORISÉS (comme Fortnite) — cases enlevées, numérotées de bas en haut (0 1 2 / 3 4 5 / 6 7 8). Tout le reste est refusé (pas de formes en Z…) */
  var EDOK = {}; ['4', '3,4', '4,5', '3,4,5', '7', '1,4', '0,3', '2,5', '1,4,7', '0,3,6', '2,5,8', '0,1,3,4', '1,2,4,5', '0,1,2,4', '0,1,2,3,4,5', '0,1,2', '6,7,8', '3,4,5,6,7,8', '6,7', '7,8',
    '0,1,3,4,6,7', '1,2,4,5,7,8', '0,3,6,1,4,7', '3,6,7', '5,7,8', '0,1,3', '1,2,5', '0,3,4,6,7,8', '2,4,5,6,7,8', '0,1,2,3,4,6', '0,1,2,4,5,8', '4,7', '1,4,6,7,8', '3,4,5,7'].forEach(function (k) { EDOK[k.split(',').map(Number).sort(function (a, b) { return a - b; }).join(',')] = 1; });
  var ESEL = [];
  /* édit de mur valable = n'importe quelles cases (fenêtre sur le côté, en haut, porte de côté, arche, demi-mur…) tant qu'il reste au moins une case et que le reste tient en UN seul morceau */
  function wallEditOk(sel) { if (sel.length >= 9) return false; var keep = [], k; for (k = 0; k < 9; k++) if (sel.indexOf(k) < 0) keep.push(k); var seen = [keep[0]], st = [keep[0]];
    while (st.length) { var c = st.pop(), cr = tcr(c); keep.forEach(function (o) { if (seen.indexOf(o) >= 0) return; var orr = tcr(o); if (Math.abs(orr[0] - cr[0]) + Math.abs(orr[1] - cr[1]) === 1) { seen.push(o); st.push(o); } }); }
    return seen.length === keep.length; }
  function rampDir(a, b) { var ra = a > 1 ? 1 : 0, ca = a % 2, rb = b > 1 ? 1 : 0, cb = b % 2; if (ra === rb && ca !== cb) return cb > ca ? 0 : 2; if (ca === cb && ra !== rb) return rb > ra ? 1 : 3; return -1; }
  function editApply(p, mk) {   // applique un édit (local ou reçu du réseau)
    if (p.t === 'mur') { wallFree(p); p.mask = mk && mk.some(Boolean) ? mk.slice() : null; p.v = null; p._cp = null; wallSegs(p, p.im); }
    else if (p.t === 'sol' || p.t === 'toit') { pieceHide(p); p.mask = mk && mk.some(Boolean) ? mk.slice() : null; pieceShow(p); }
    else if (p.t === 'esc') { pieceHide(p); if (typeof mk === 'number') { p.d = mk; p.rp = null; } else if (mk) { p.d = mk.d; p.rp = mk.rp; } pieceShow(p); } }
  function editWall() {   // bouton / touche ÉDITER : ouvre la grille, ou valide si elle est ouverte
    if (EDW) { var p = EDW, sel = EMK.map(function (b, i) { return b ? i : -1; }).filter(function (i) { return i >= 0; }), msg = null;
      if (p.t === 'mur' && sel.length && !wallEditOk(sel)) msg = sel.length === 9 ? '❌ GARDE AU MOINS UNE CASE DU MUR' : '❌ LE RESTE DU MUR DOIT TENIR EN UN SEUL MORCEAU';
      if (p.t === 'sol' && sel.length === 4) msg = '❌ GARDE AU MOINS UNE CASE DU SOL';
      if (p.t === 'toit' && sel.length === 4) msg = '❌ TOIT : 1 à 3 coins à lever';
      var RE = p.t === 'esc' && sel.length ? rampEditOf(ESEL) : null; if (p.t === 'esc' && sel.length && !RE) msg = '❌ ESCALIER : case du MILIEU → un bord = tourner · 3 cases sur un bord = demi-escalier · L de 5 cases = escalier qui tourne';
      if (msg) { C.toast(msg); C.tone('square', 220, 160, .12, .06); return; }   // on garde la grille ouverte pour corriger
      EDW = null; var net;
      if (p.t === 'esc') { if (RE) { editApply(p, RE.rp ? RE : RE.d); net = RE.rp ? 'r' + RE.rp.join('') : 'd' + RE.d; } }
      else { editApply(p, EMK); net = p.mask ? p.mask.map(Number).join('') : ''; }
      support(); if (HOOK && net != null) HOOK('e', { key: p.key, mask: net }); gridDraw(); editPop(p); C.toast('✏️ ÉDITION VALIDÉE'); C.tone('triangle', 660, 990, .1, .07); C.noise(.06, .08, 2500); return; }
    var h = aimEdit(); if (!h) { C.toast('VISE UNE DE TES CONSTRUCTIONS POUR L\'ÉDITER'); return; }
    EDRAG = 0; ELASTI = -1; ESEL = []; EDW = h.p; var n = NT(h.p); EMK = (h.p.t !== 'esc' && h.p.mask && h.p.mask.length === n ? h.p.mask : new Array(n).fill(false)).slice(); if (TOOL !== 'edit') { EPREV = TOOL; TOOL = 'edit'; } gridDraw();
    C.toast(h.p.t === 'toit' ? '✏️ TOIT : choisis les coins à LEVER (2 cases d\'un côté = pente vers ce côté)' : h.p.t === 'esc' ? '✏️ ESCALIER : glisse la case du MILIEU vers un bord = tourner · 3 cases sur un bord = demi-escalier · L de 5 cases = escalier qui tourne' : C.editRel && C.editRel() ? '✏️ CLIQUE (OU GLISSE) SUR LES CASES · ÇA VALIDE TOUT SEUL EN RELÂCHANT' : '✏️ TOUCHE LES CASES À ENLEVER · ÉDITER POUR VALIDER'); C.tone('sine', 880, 1100, .06, .05); }
  function editPop(p) { C.burst(p.x, p.L + (p.t === 'mur' ? LH / 2 : .4), p.z, 12, ['#4fb8ff', '#dff4ff', '#ffffff'], 3, .12, .45); }   // petites étincelles bleues à la validation
  var EPREV = null;
  function editCell() { if (!EDW) return -1; var h = aimEdit(); if (!h || h.p !== EDW) return -1; var o = h.o, d = h.d, p = EDW, x = o.x + d.x * h.t, y = o.y + d.y * h.t, z = o.z + d.z * h.t;
    if (p.t === 'esc') { var ci = function (v) { return v < RB[1] ? 0 : v < RB[2] ? 1 : 2; }; return ci(x - p.x) + 3 * ci(z - p.z); }
    if (p.t !== 'mur') return (x > p.x ? 1 : 0) + (z > p.z ? 2 : 0);
    var ax = p.hw > p.hd, u = (ax ? x - p.x : z - p.z) + CELL / 2, c = Math.max(0, Math.min(2, Math.floor(u / (CELL / 3)))), r = Math.max(0, Math.min(2, Math.floor((y - p.L) / (LH / 3)))); return r * 3 + c; }
  function editSet(i, on) { EMK[i] = on; var k = ESEL.indexOf(i); if (on && k < 0) ESEL.push(i); if (!on && k >= 0) ESEL.splice(k, 1); }
  function editTap() { var i = editCell(); if (i < 0) return; editSet(i, !EMK[i]); ELASTI = i; gridDraw(); C.tone('square', EMK[i] ? 520 : 760, 0, .05, .04); }
  var EDRAG = 0, ELASTI = -1;
  function editDrag() { var i = editCell(); if (i < 0 || i === ELASTI) return; ELASTI = i; if (!EMK[i]) { editSet(i, true); gridDraw(); C.tone('square', 520, 0, .05, .04); } }   /* on glisse en gardant appuyé : chaque case survolée est choisie */
  function editReset() {   // clic droit en édition (comme Fortnite) : la pièce redevient d'origine, sans recliquer les cases
    var p = EDW; if (!p) { var h = aimEdit(); if (!h) return false; p = h.p; } EDW = null; var net = '';
    if (p.t === 'esc') { editApply(p, p.d0 != null ? p.d0 : p.d); net = 'd' + p.d; } else editApply(p, null);
    support(); if (HOOK) HOOK('e', { key: p.key, mask: net }); gridDraw();
    if (TOOL === 'edit') TOOL = EPREV === 'edit' ? null : EPREV; C.toast('↺ ' + { mur: 'MUR', sol: 'SOL', esc: 'ESCALIER', toit: 'TOIT' }[p.t] + ' RÉINITIALISÉ'); C.tone('triangle', 900, 520, .1, .07); C.noise(.05, .08, 2000); return true; }
  function editCancel() { if (!EDW) return; EDW = null; gridDraw(); TOOL = EPREV === 'edit' ? null : EPREV; }
  function ghostShow(p, ok) {
    if (!GHOST) { GHOST = {}; var gm = new T.MeshBasicMaterial({ color: '#7fd4ff', transparent: true, opacity: .42, depthWrite: false, depthTest: true }); GHOST.mat = gm; var gl = new T.LineBasicMaterial({ color: '#e8f8ff', transparent: true, opacity: .9, depthWrite: false }); GHOST.lm = gl;
      GEO.lit = new T.BoxGeometry(1.2, .6, 2.2); GEO.lit.translate(0, .3, 0); GEO.coffre = new T.BoxGeometry(1.2, .85, .8); GEO.coffre.translate(0, .42, 0);
      ['mur', 'sol', 'esc', 'toit', 'lit', 'coffre'].forEach(function (k) { var m = new T.Mesh(k === 'mur' || k === 'sol' ? C.BOX : GEO[k], gm); m.visible = false; m.renderOrder = 3; m.userData.dyn = true; m.frustumCulled = false; try { var ln = new T.LineSegments(new T.EdgesGeometry(m.geometry, 30), gl); ln.renderOrder = 4; ln.frustumCulled = false; m.add(ln); } catch (e) {} C.scene.add(m); GHOST[k] = m; }); }
    ['mur', 'sol', 'esc', 'toit', 'lit', 'coffre'].forEach(function (k) { GHOST[k].visible = !!p && p.t === k; });
    if (!p) return; var m = GHOST[p.t]; GHOST.mat.color.set(ok ? '#7fd4ff' : '#ff3a5a'); GHOST.lm.color.set(ok ? '#e8f8ff' : '#ffc0c8');
    if (p.t === 'mur') { m.position.set(p.x, p.L + LH / 2, p.z); m.rotation.set(0, 0, 0); m.scale.set(p.hw * 2 + .02, LH, p.hd * 2 + .02); }
    else if (p.t === 'lit' || p.t === 'coffre') { m.position.set(p.x, p.L, p.z); m.rotation.set(0, -p.d + Math.PI / 2, 0); m.scale.set(1, 1, 1); }
    else { var o = O3 || (O3 = new T.Object3D()); pieceMatrix(p, o); m.position.copy(o.position); m.rotation.copy(o.rotation); m.scale.copy(o.scale); if (p.t === 'sol') m.scale.y = .32; } }
  function groundAt(x, z, y) { var g = -1e9, lim = y + .75;   // les rampes se montent sans sauter (on « accroche » jusqu'à 1,3 m)
    for (var wi = 0; wi < C.WALLS.length; wi++) { var w = C.WALLS[wi]; if (!w.alive || w.flat || Math.abs(x - w.x) > w.hw + .22 || Math.abs(z - w.z) > w.hd + .22) continue; var wt = w.y0 + w.h; if (wt <= lim && wt > g) g = wt; }   // on peut tenir debout sur le haut des murs
    for (var i = 0; i < PIECES.length; i++) { var p = PIECES[i]; if (p.t === 'mur') continue; var dx = x - p.x, dz = z - p.z; if (Math.abs(dx) > CELL / 2 + .05 || Math.abs(dz) > CELL / 2 + .05) continue; var h;
      if (p.t === 'sol') { if (p.mask && p.mask[(dx > 0 ? 1 : 0) + (dz > 0 ? 2 : 0)]) continue; h = p.L + .08; }
      else if (p.t === 'esc' && p.rp) { var SG = rampShape(p), hb = null; for (var si = 0; si < SG.length; si++) { var sg = SG[si]; if (dx < sg.x0 - .05 || dx > sg.x1 + .05 || dz < sg.z0 - .05 || dz > sg.z1 + .05) continue; var hs2 = p.L + .02 + segY(sg, dx, dz); if (hs2 <= y + 1.3 && (hb == null || hs2 > hb)) hb = hs2; } if (hb != null && hb > g) g = hb; continue; }   // demi-escalier / escalier qui tourne : seulement sur les marches
      else if (p.t === 'esc') { var u = (p.d === 0 ? dx : p.d === 1 ? dz : p.d === 2 ? -dx : -dz) + CELL / 2; h = p.L + .02 + Math.max(0, Math.min(CELL, u)) * LH / CELL; if (h <= y + 1.3 && h > g) { g = h; continue; } }
      else if (p.t === 'lit') continue;
      else h = p.mask && p.mask.some(Boolean) ? p.L + .06 + roofY(p, dx, dz) : p.L + 2.4 * (1 - Math.max(Math.abs(dx), Math.abs(dz)) / (CELL / 2));
      if (h <= lim && h > g) g = h; }
    return g; }

  /* ---------------- pioche : viser et taper ---------------- */
  var RMAX = 500; function INF() { return C.CREA && !(C.mat500 && C.mat500()); }   // matériaux : 500 max de chaque (comme Fortnite) ; infinis en Créatif sauf si la partie dit « 500 max »
  function give(k, n, x, y, z) { if (!C.BUILD || INF()) return; if (RES[k] >= RMAX) { pop('MAX ' + ICON[k]); return; } RES[k] = Math.min(RMAX, RES[k] + n); pop('+' + n + ' ' + ICON[k]); hudRes(); }
  function pop(t) { var d = document.createElement('div'); d.className = 'sPop'; d.textContent = t; d.style.left = (46 + Math.random() * 8) + '%'; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 900); }
  function strike() {
    var P = me(), a = C.camA(), fx = Math.cos(a), fz = Math.sin(a), best = null, bd = 3.3, ox = P.x, oz = P.z, oy = P.y + 1.2;
    function cand(x, z, r, obj, kind) { var dx = x - ox, dz = z - oz, d = Math.hypot(dx, dz) - r; if (d > 2.2) return; var dot = (dx * fx + dz * fz) / (Math.hypot(dx, dz) || 1); if (dot < .45 && d > .3) return; if (d < bd) { bd = d; best = [kind, obj]; } }
    if (window.FAUNE && FAUNE.on && FAUNE.melee(P.x, P.y, P.z, fx, fz, 2.6, 30)) { C.tone('square', 170, 100, .08, .07); return; }
    if (window.ZOMB && ZOMB.on && ZOMB.melee(P.x, P.y, P.z, fx, fz, 2.6, 34)) { C.tone('square', 150, 90, .08, .08); return; }   // un coup de pioche sur un zombie
    if (C.meleePl && C.meleePl(fx, fz, 10)) { C.tone('square', 200, 110, .08, .08); return; }   // coup de pioche sur un joueur : 10 dégâts (comme demandé, façon Fortnite)
    if (window.INTERIORS && INTERIORS.melee) { var fh = INTERIORS.melee(ox, oy, oz, fx, fz, 2.1, 50); if (fh) { if (C.bhp) C.bhp(fh.x, fh.y, fh.z, fh.hp, fh.max); give('bois', fh.dead ? (fh.big ? 8 : 4) : 2); C.burst(fh.x, fh.y - .4, fh.z, fh.dead ? 18 : 6, ['#8a5a2e', '#c8955a', '#5a3a1e'], fh.dead ? 6 : 4, .14, fh.dead ? 1 : .5); C.tone('square', 260, 150, .07, .07); if (fh.dead) C.SFX.crack(); return; } }   // meubles : 50 / 100 PV
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
      if ((window.NOSPAWN && NOSPAWN(x, z)) || !C.onLand(x, z) || C.nearRoad(x, z, 3.5) || C.inLake(x, z, 4) || C.hgt(x, z) > 60) continue;
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
  function hitPiece(p, dmg) { if (isIX(p.m)) { if (C.EDITOR) { removePiece(p, true); return; } if (C.bhp) C.bhp(p.x, p.L + 3.9, p.z, 1, 1); C.tone('square', 900, 700, .05, .05); return; }   /* incassable (seul le créateur l'enlève sur son île) */
    p.hp -= dmg; if (C.bhp) C.bhp(p.x, p.L + (p.t === 'sol' ? 1.2 : 3.9), p.z, p.hp, p.hmax || hpMax(p)); C.tone('square', 240, 150, .07, .06); (p.ws || []).forEach(function (w) { w.hp = p.hp; }); if (p.hp <= 0) removePiece(p, true); else C.burst(p.x, p.L + 1.2, p.z, 5, [C.MATS[MATW[p.m]].col], 3, .12, .4); }
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
    '#sAff{position:fixed;z-index:9;left:50%;bottom:calc(150px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);width:min(440px,86vw);background:linear-gradient(180deg,#f2e2b8,#d8c08a);color:#2a1206;border-radius:14px;padding:12px 16px;box-shadow:0 10px 30px rgba(0,0,0,.5),0 0 0 3px #7a2fff;font-family:Georgia,serif}#sAff small{display:block;font:900 10px var(--body);letter-spacing:.12em;color:#7a2fff}#sAff b{display:block;font-size:17px;margin:2px 0 4px}#sAff p{margin:0 0 6px;font-size:14px;line-height:1.35}#sAff i{font-size:11px;color:#6a4a20}#sAff[hidden]{display:none}',
    '#sBook{position:fixed;inset:0;z-index:30;background:rgba(11,4,24,.72);display:grid;place-items:center}#sBook[hidden]{display:none}#sBook .bk{position:relative;width:min(760px,94vw);max-height:88vh;overflow:auto;background:linear-gradient(180deg,#2a0a3a,#140a24);border:2px solid #b05cff;border-radius:18px;padding:16px 18px;box-shadow:0 0 40px rgba(176,92,255,.4)}#sBook h2{margin:0;font:900 22px var(--body);color:#ffd23d}#sBook .sub{margin:2px 0 12px;color:#c9b8e8;font-size:12px}#sBook .x{position:absolute;right:10px;top:8px;background:none;border:0;color:#fff;font-size:22px;cursor:pointer}',
    '#sBook .rw{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}#sBook .rw span{font:800 11px var(--body);color:#b9a8d0;background:rgba(255,255,255,.06);border:1px dashed rgba(255,255,255,.2);border-radius:20px;padding:5px 10px}#sBook .rw span.ok{color:#fff;background:linear-gradient(90deg,#ff2bd6,#8a3dff);border:0}#sBook .rw i{font-style:normal;opacity:.7;font-weight:600}' +
    '#sBook .pg{display:grid;grid-template-columns:1fr 1fr;gap:8px}#sBook .ent{display:flex;gap:10px;background:rgba(255,255,255,.05);border-left:4px solid var(--r);border-radius:10px;padding:8px}#sBook .ent .ic{font-size:30px}#sBook .ent b{display:block;color:#fff;font-size:14px}#sBook .ent small{color:var(--r);font-weight:800;font-size:11px}#sBook .ent p{margin:4px 0 0;color:#ddd;font-size:12px;line-height:1.35}#sBook .lock{opacity:.75}#sBook .lock .ic{filter:grayscale(1)}@media (max-width:640px){#sBook .pg{grid-template-columns:1fr}}',
    '#sBookB{position:fixed;z-index:8;left:12px;top:calc(122px + env(safe-area-inset-top,0px));font:900 11px var(--body);color:#fff;background:rgba(58,10,90,.8);border:2px solid #b05cff;border-radius:12px;padding:6px 10px;cursor:pointer}',
    '#sEdit{position:fixed;z-index:8;right:calc(232px + env(safe-area-inset-right,0px));bottom:calc(372px + env(safe-area-inset-bottom,0px));width:64px;height:64px;border-radius:50%;display:grid;place-items:center;align-content:center;font-size:22px;color:#fff;background:rgba(11,4,24,.55);border:3px solid #3ab0ff;box-shadow:0 0 14px rgba(58,176,255,.6);cursor:pointer}#sEdit small{font:900 9px var(--body);color:#bfe8ff}body:not(.touch) #sEdit{display:none}body.won #sEdit{display:none}',
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
    el.tools.innerHTML = (C.NOPICK ? '' : '<button type="button" data-t="pioche" title="Pioche (X)">' + IC.pioche + '<b>' + (C.isTouch ? '' : 'X') + '</b></button>') + (C.BUILD ? '<button type="button" data-t="build" title="Construire (V)">' + IC.build + '<b>' + (C.isTouch ? '' : 'V') + '</b></button>' : '');
    var hb = document.getElementById('hotbar'); if (hb) hb.appendChild(el.tools); else document.body.appendChild(el.tools);
    el.tools.querySelectorAll('button').forEach(function (b) { press(b, function () { setTool(TOOL === b.dataset.t ? null : b.dataset.t); }); });
    el.build = document.createElement('div'); el.build.id = 'sBuild'; el.build.className = 'hud'; el.build.hidden = true;
    el.build.innerHTML = PLIST().map(function (k, i) { return '<button type="button" data-p="' + k + '">' + IC[k] + '<small>' + PNAME[k] + (C.isTouch || k === 'lit' ? '' : ' ' + KN(['mur', 'sol', 'escalier', 'toit'][i])) + '</small></button>'; }).join('') + '<button type="button" class="mat" data-m="1"><span id="sMatI">🪵</span><i id="sMatN">BOIS</i></button>';
    document.body.appendChild(el.build);
    el.build.querySelectorAll('[data-p]').forEach(function (b) { press(b, function () { PIECE = b.dataset.p; hudBuild(); }); });
    press(el.build.querySelector('.mat'), function () { nextMat(); });
    el.edit = document.createElement('button'); el.edit.type = 'button'; el.edit.id = 'sEdit'; el.edit.innerHTML = '✏️<small>ÉDITER</small>'; if (C.BUILD) document.body.appendChild(el.edit); press(el.edit, function () { editWall(); });   // bouton ÉDITER à part, comme sur Fortnite
    setInterval(function () { var on = /^(play|pause)$/.test(C.state()) && me() && me().alive && !(C.NOPICK && !C.BUILD);   /* GTA / jeux sans pioche : barre sans pioche, comme les réglages d'inventaire du créatif de Fortnite */ if (el.tools.hidden === on) el.tools.hidden = !on; if (!on && !el.build.hidden) el.build.hidden = true; else if (on && TOOL === 'build' && el.build.hidden) el.build.hidden = false; }, 250);
    addEventListener('keydown', function (e) { if (C.state() !== 'play' || e.repeat) return; var a = window.bindAct ? bindAct(e.code) : null;
      if (a === 'pioche') { if (!C.NOPICK) setTool(TOOL === 'pioche' ? null : 'pioche'); }
      else if (a === 'construire') setTool(TOOL === 'build' ? null : 'build');
      else if (a === 'mur' || a === 'sol' || a === 'escalier' || a === 'toit') { e.preventDefault(); PIECE = { mur: 'mur', sol: 'sol', escalier: 'esc', toit: 'toit' }[a]; if (TOOL !== 'build') setTool('build'); hudBuild(); }
      else if (a === 'materiau' && TOOL === 'build') nextMat();
      else if (a === 'editer' && C.BUILD) editWall(); });
  }
  function press(b, fn) { b.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); fn(); }); }
  function pickMat(cs) { if (isIX(MATK)) return C.EDITOR ? MATK : (MATK = 'bois'); if (INF() || RES[MATK] >= cs) return MATK; var L = ['bois', 'pierre', 'metal']; for (var i = 0; i < 3; i++) if (RES[L[i]] >= cs) return L[i]; return MATK; }   // plus assez de la matière choisie : on passe tout seul à une autre (bois, puis pierre, puis métal)
  function nextMat() { var L = ['bois', 'pierre', 'metal'].concat(C.EDITOR ? Object.keys(IXM) : []); MATK = L[(L.indexOf(MATK) + 1) % L.length]; hudBuild(); if (isIX(MATK)) C.toast('🛡️ ' + NAME[MATK] + ' · clic droit = texture suivante'); }
  function hudRes() { ['bois', 'pierre', 'metal'].forEach(function (k) { var b = el[k] && el[k].querySelector('b'), v = INF() ? '∞' : String(RES[k]); if (b && b.textContent !== v) { b.textContent = v; el[k].classList.remove('flash'); void el[k].offsetWidth; el[k].classList.add('flash'); setTimeout(function () { el[k].classList.remove('flash'); }, 250); } }); }
  function hudBuild() { if (!el.build) return; el.build.querySelectorAll('[data-p]').forEach(function (b) { b.classList.toggle('on', b.dataset.p === PIECE); });
    document.getElementById('sMatI').textContent = ICON[MATK]; document.getElementById('sMatN').textContent = NAME[MATK] + ' ' + (INF() || isIX(MATK) ? '∞' : RES[MATK]);
    el.tools.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.t === TOOL); }); el.build.hidden = TOOL !== 'build'; }
  function act() { if (!C.SURV) return false; if (window.FAUNE && FAUNE.on && FAUNE.act()) return true; var c = nearStor(); if (!c) return false; OPENC = null; bag(true); OPENC = c; bagDraw(); return true; }
  function setTool(t) { if (EDW && t !== 'edit') { EDW = null; gridDraw(); } if (t === 'build' && !C.BUILD) { C.toast(C.CREA ? 'CONSTRUCTIONS DÉSACTIVÉES DANS CETTE PARTIE' : 'PAS DE CONSTRUCTIONS EN ZÉRO CONSTRUCTION'); t = null; } if (t !== 'place') { PLACEK = null; PLACEI = -1; } TOOL = t; SW.t = -1; if (PICK) PICK.visible = t === 'pioche'; if (t !== 'build') ghostShow(null); hudBuild(); if (t === 'pioche') C.tone('triangle', 520, 780, .1, .06); }

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
  function itName(it) { return !it ? '' : it.t === 'arme' ? C.WEAPONS[it.k].name : it.t === 'soin' ? C.HEAL[it.k].name + ' ×' + it.n : it.t === 'lit' ? 'Lit (point de réapparition)' : it.t === 'coffre' ? 'Coffre de rangement' : it.t === 'livre' ? 'Livre des créatures' : ''; }
  function drawIt(cv, it) { var g = cv.getContext('2d'), w = cv.width, h = cv.height; g.clearRect(0, 0, w, h); if (!it) return;
    if (it.t === 'arme') C.icon(g, it.k, w, h); else if (it.t === 'soin') { C.healIcon(g, it.k, w, h); g.fillStyle = '#fff'; g.font = '900 13px sans-serif'; g.textAlign = 'right'; g.fillText('×' + it.n, w - 3, h - 3); }
    else { g.save(); g.translate(w / 2, h / 2); if (it.t === 'livre') { g.fillStyle = '#3a0a5a'; g.fillRect(-16, -16, 32, 30); g.fillStyle = '#ff2bd6'; g.fillRect(-16, -16, 5, 30); g.strokeStyle = '#ffd23d'; g.lineWidth = 2; g.strokeRect(-9, -11, 20, 20); g.fillStyle = '#ffd23d'; g.font = '900 15px sans-serif'; g.textAlign = 'center'; g.fillText('?', 1, 5); }
      else if (it.t === 'lit') { g.fillStyle = '#5a3a20'; g.fillRect(-22, -2, 44, 12); g.fillStyle = '#f0ecf6'; g.fillRect(-20, -8, 40, 10); g.fillStyle = '#c43a6a'; g.fillRect(-20, -8, 26, 10); g.fillStyle = '#fff'; g.fillRect(8, -12, 11, 7); }
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
    h += '<div class="ac">' + (sel && (sel.t === 'lit' || sel.t === 'coffre') && BSEL[0] === 'bag' ? '<button type="button" class="pose">POSER</button>' : '') + (sel && sel.t === 'livre' ? '<button type="button" class="read">📖 LIRE</button>' : '') + (sel && (sel.t === 'arme' || sel.t === 'soin') ? '<button type="button" class="drop">JETER</button>' : '') + '</div></div>';
    d.innerHTML = h;
    d.querySelectorAll('.bs').forEach(function (b) { var src = b.dataset.s, i = +b.dataset.i; drawIt(b.querySelector('canvas'), getS(src, i));
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); if (!BSEL) { if (getS(src, i)) BSEL = [src, i]; } else { if (!(BSEL[0] === src && BSEL[1] === i)) moveSlot(BSEL, [src, i]); BSEL = null; } C.tone('triangle', 700, 900, .04, .04); bagDraw(); }); });
    d.querySelector('.x').addEventListener('pointerdown', function (e) { e.preventDefault(); bag(false); });
    var rd = d.querySelector('.read'); if (rd) rd.addEventListener('pointerdown', function (e) { e.preventDefault(); BSEL = null; bag(false); book(true); });
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
  /* GÉNÉRATEURS D'ARMES (comme dans les modes créatifs des gros jeux) : une dalle de 5 m (comme un sol construit) avec un plot futuriste
     bleu-violet au milieu ; l'arme ou la potion réapparaît dessus à l'infini ; une pancarte à côté dit ce que c'est. Toutes les armes + toutes les potions. */
  function armory() { var BF = C.BF && C.ARENA, T0 = BF ? C.ARENA : C.TOWNS[0], K = ['pompeS', 'pompe', 'fusil', 'smg', 'pmx', 'scar', 'sniper', 'pistolet', 'roquette', 'laser', 'patate', 'mini', 'shield', 'heal'], n = K.length, ARM2 = [];
    var cx0 = Math.round((T0[1] - n * CELL / 2) / CELL) * CELL, cz = Math.round((T0[2] + (BF ? (T0[3] >= 50 ? -30 : 32.5) : -22.5)) / CELL) * CELL + CELL / 2, IN = BF && T0[3] >= 50; ARM = [];   /* grande arène : la rangée de générateurs est SUR le carré, côté nord */
    var g = new T.Group(), slab = new T.MeshLambertMaterial({ color: '#3a3448' }), rim = new T.MeshBasicMaterial({ color: '#7a2fff' }), core = new T.MeshBasicMaterial({ color: '#3dd6ff', transparent: true, opacity: .85 }), dk = new T.MeshLambertMaterial({ color: '#1a1424' }), WN = C.WEAPONS, HN = C.HEAL;
    K.forEach(function (k, i) { var x = cx0 + i * CELL + CELL / 2, z = cz, y = Math.max(C.hgt(x, z), C.hgt(x - 2, z - 2), C.hgt(x + 2, z + 2)) + .02;
      var fl = new T.Mesh(new T.BoxGeometry(CELL - .1, .3, CELL - .1), slab); fl.position.set(x, y + .15, z); g.add(fl);   // dalle = un sol de construction
      [[0, 2.45, CELL - .1, .08], [0, -2.45, CELL - .1, .08], [2.45, 0, .08, CELL - .1], [-2.45, 0, .08, CELL - .1]].forEach(function (q) { var e = new T.Mesh(new T.BoxGeometry(q[2], .06, q[3]), rim); e.position.set(x + q[0], y + .31, z + q[1]); g.add(e); });
      var pad = new T.Mesh(new T.CylinderGeometry(1, 1.15, .22, 6), dk); pad.position.set(x, y + .41, z); g.add(pad);   // plot hexagonal
      var ring = new T.Mesh(new T.TorusGeometry(.95, .07, 8, 6), rim); ring.rotation.x = Math.PI / 2; ring.position.set(x, y + .53, z); g.add(ring);
      var glow = new T.Mesh(new T.CylinderGeometry(.82, .82, .04, 6), core); glow.position.set(x, y + .54, z); g.add(glow);
      var beam = new T.Mesh(new T.CylinderGeometry(.5, .8, 2.2, 6, 1, true), new T.MeshBasicMaterial({ color: '#7ac8ff', transparent: true, opacity: .16, side: T.DoubleSide, depthWrite: false })); beam.position.set(x, y + 1.6, z); g.add(beam);
      var cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; var c2 = cv.getContext('2d'), nm = WN[k] ? WN[k].name : HN[k] ? HN[k].name : k, rc = WN[k] ? ['#b9bcc4', '#4dd65a', '#3d9bff', '#b05cff', '#ffb52e'][WN[k].rar] : '#3dd6ff';
      c2.fillStyle = '#0c0614'; c2.fillRect(0, 0, 256, 128); c2.strokeStyle = rc; c2.lineWidth = 6; c2.strokeRect(5, 5, 246, 118); c2.fillStyle = rc; c2.fillRect(5, 5, 246, 26); c2.fillStyle = '#0c0614'; c2.font = '900 18px Arial'; c2.textAlign = 'center'; c2.fillText(WN[k] ? 'GÉNÉRATEUR D\'ARMES' : 'GÉNÉRATEUR DE SOINS', 128, 25);
      c2.fillStyle = '#fff'; var fs = nm.length > 14 ? 26 : 32; c2.font = '900 ' + fs + 'px Arial Black, Arial'; c2.fillText(nm.toUpperCase(), 128, 84); c2.font = '700 15px Arial'; c2.fillStyle = '#c9b8e8'; c2.fillText('RÉAPPARAÎT À L\'INFINI', 128, 112);
      var tx = new T.CanvasTexture(cv); tx.encoding = T.sRGBEncoding; var sg = new T.Mesh(new T.PlaneGeometry(2.2, 1.1), new T.MeshBasicMaterial({ map: tx, side: T.DoubleSide })); sg.position.set(x, y + 2.3, z + (IN ? -2.35 : BF ? 2.35 : -2.35)); sg.rotation.y = BF ? 0 : Math.PI; g.add(sg);
      var po = new T.Mesh(new T.BoxGeometry(.12, 2.3, .12), dk); po.position.set(x, y + 1.15, z + (IN ? -2.4 : BF ? 2.4 : -2.4)); g.add(po);
      ARM.push({ k: k, x: x, z: z, y: y + .6, it: null, t: 9, ring: ring, glow: glow }); });
    g.traverse(function (o) { o.userData.dyn = true; }); C.scene.add(g); }
  function armoryTick(dt) { if (!ARM || !C.items) return; var on = !C.genOn || C.genOn(); ARM.forEach(function (a) { a.glow.visible = on; }); if (!on) { ARM.forEach(function (a) { a.it = null; a.t = 0; }); return; } var L = C.items(), now = performance.now() / 1000; ARM.forEach(function (a) { a.ring.rotation.z = now * 1.5; a.glow.material.opacity = .6 + Math.sin(now * 4 + a.x) * .25; if (a.it && L.indexOf(a.it) >= 0) { a.it.m.position.y = a.y + .2 + Math.sin(now * 2 + a.x) * .12; a.it.m.rotation.y = now; return; } a.t += dt; if (a.t < 1.5) return; a.t = 0; C.dropItem(a.x, a.z, a.k); a.it = L[L.length - 1]; if (a.it) a.it.m.position.y = a.y; }); }

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
        pieces: PIECES.map(function (q) { return [q.t, q.m, q.x, q.z, q.L, q.d, q.key, q.hp, q.hw, q.hd, q.v || 0, mkStr(q) || 0]; }),
        trees: C.TREES.map(function (t, i) { return t.gone ? i : t.cut ? -i - 1 : null; }).filter(function (v) { return v != null; }),
        harv: HARV().map(function (it, i) { return it.dead ? i : -1; }).filter(function (i) { return i >= 0; }),
        nodes: NODES.map(function (n, i) { return n.dead ? i : -1; }).filter(function (i) { return i >= 0; }),
        wrecks: WRECKS.filter(function (w) { return w.dead; }).map(function (w) { return w.id; }), walls: hw,
        zdead: window.ZOMB && ZOMB.on ? ZOMB.deadIds() : [], bag: BAG, stor: STOR.map(function (c) { return [c.x, c.z, c.y, c.a, c.items]; }) };
      localStorage.setItem(SKEY, JSON.stringify(d)); var fd = C.fogData && C.fogData(); if (fd) localStorage.setItem(SKEY + '_fog', fd); if (el.saveI) { el.saveI.classList.remove('on'); void el.saveI.offsetWidth; el.saveI.classList.add('on'); } } catch (e) { console.warn('sauvegarde', e); } }
  function loadSave() { try { var d = JSON.parse(localStorage.getItem(SKEY) || 'null'); return d && d.v === 1 ? d : null; } catch (e) { return null; } }
  function applySave(d) { var P = me(); TIME = d.t || 0; RES = d.res || RES; BED = d.bed || null; showBed();
    if (d.bag) { bagInit(); d.bag.forEach(function (it, i) { if (i < NB) BAG[i] = it; }); } if (C.SURV && !C.CREA && !BAG.some(function (q) { return q && q.t === 'livre'; })) { var fi = BAG.indexOf(null); if (fi >= 0) BAG[fi] = { t: 'livre' }; } (d.stor || []).forEach(function (q) { placeStor(q[0], q[1], q[2], q[3], q[4]); }); if (C.setDay && d.day) C.setDay(d.day);
    if (d.p) { P.x = d.p.x; P.z = d.p.z; P.y = P.gy = Math.max(C.hgt(P.x, P.z), d.p.y || 0); P.hp = Math.max(30, d.p.hp || 100); P.sh = d.p.sh || 0; }
    if (d.inv) d.inv.forEach(function (w, i) { if (w && C.WEAPONS[w.k]) { var sl = C.newSlot(w.k); sl.mag = w.mag; sl.res = w.res; P.inv[i] = sl; } });
    if (d.heals) Object.keys(d.heals).forEach(function (k) { P.heals[k] = d.heals[k]; });
    (d.pieces || []).forEach(function (q) { var p = { t: q[0], m: q[1], x: q[2], z: q[3], L: q[4], d: q[5], key: q[6], hw: q[8], hd: q[9], v: q[10] || null, hp: q[7] }; p.mask = mkParse(q[11], p); if (placePiece(p)) { (p.ws || []).forEach(function (w) { w.hp = q[7]; }); } });
    (d.trees || []).forEach(function (v) { var t = C.TREES[v >= 0 ? v : -v - 1]; if (!t || !t.d3) return; fellQuiet(t); if (v >= 0) { t.gone = true; STUMPL.splice(STUMPL.indexOf(t), 1); } }); stumpsRefresh();
    var H2 = HARV(); (d.harv || []).forEach(function (i) { if (H2[i] && window.PROPS) { PROPS.harvBreak(H2[i]); H2[i].t = 0; } });
    (d.nodes || []).forEach(function (i) { var n = NODES[i]; if (n) { n.dead = true; n.t = 0; nodeSet(n); var ci = C.PCOL.indexOf(n.col); if (ci >= 0) C.PCOL.splice(ci, 1); } });
    LOADED = d; }
  function fellQuiet(t) { t.cut = true; t.cutT = 0; t.r0 = t.r; t.h0 = t.h; t.r = 0; t.h = -99; if (window.TREES3D && TREES3D.cut) TREES3D.cut(t, false); STUMPL.push(t); }

  /* ---------------- petit écran d'explication des commandes au début ---------------- */
  function intro() { if (!C.SURV) { var nI = 0; try { nI = +localStorage.getItem('wr_introBR') || 0; localStorage.setItem('wr_introBR', nI + 1); } catch (e) {} if (nI >= 3) return; }   // en Battle Royale : seulement les 3 premières fois
    var d = document.getElementById('sIntro'); if (!d) { d = document.createElement('div'); d.id = 'sIntro'; document.body.appendChild(d); }
    var tc = C.isTouch, row = function (k, t) { return '<div class="r"><b>' + k + '</b><span>' + t + '</span></div>'; };
    if (C.CREA && C.creaIntro) { var ci = C.creaIntro(); d.innerHTML = '<div class="box"><h2>' + ci.t + '</h2><p>' + ci.d + '</p><div class="g">' + ci.r.map(function (q) { return row(q[0], q[1]); }).join('') + '</div><button type="button" id="sIntroGo">C\'EST PARTI</button><div class="bar"><i></i></div></div>';
      d.hidden = false; var cl = function () { d.hidden = true; }; d.querySelector('#sIntroGo').addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); cl(); }); d.querySelector('#sIntroGo').addEventListener('click', cl); setTimeout(cl, 12000); return; }   /* créatif : le message dépend du mode (et du créateur), pas de liste de touches */
    d.innerHTML = '<div class="box"><h2>' + (C.CREA ? '🎨 CRÉATIF · TERRES SAUVAGES' : C.SURV ? '🧟 SURVIE · TERRES SAUVAGES' : C.BUILD ? '⚔️ BATTLE ROYALE' : '🛡️ ZÉRO CONSTRUCTION') + '</h2>' + (C.CREA ? '<p>Matériaux illimités, construis ce que tu veux. Les armes de l\'armurerie reviennent à l\'infini.</p>' : C.SURV ? '<p>Le monde est envahi de zombies. Récupère des matériaux, construis ta base, pose ton lit… et tue-les tous.</p>' : C.BUILD ? '<p>Pioche, matériaux et constructions !</p>' : '<p>Pas de constructions : utilise la bulle bouclier pour te protéger.</p>') +
      '<div class="g">' + (tc ? row(IC.pioche, 'Bouton pioche (en haut) puis le bouton de TIR pour frapper') + row(IC.build, 'Bouton construire puis le bouton de TIR pour poser la pièce') + row('🧱', 'Choisis MUR, SOL, ESCALIER, TOIT' + ' en bas, et la matière à droite')
        : row(KN('pioche'), 'Pioche · clic gauche pour frapper') + row(KN('construire'), 'Construire · clic gauche pour poser') + row(KN('mur') + '–' + KN('toit'), 'Mur, sol, escalier, toit') + row(KN('materiau'), 'Changer de matière (bois, pierre, métal)') + row(KN('sprint'), 'Sprinter · ' + KN('sauter') + ' contre un mur pour grimper')) + row(tc ? '✏️' : KN('editer'), 'Éditer un de tes murs : porte, fenêtre, 2 fenêtres…') +
      row('🪵', 'Arbres et cactus = bois · souche arrachée = l\'arbre ne repousse plus') + row('🧱', 'Rochers et murs en brique = pierre') + row('⛓', 'Carcasses de voitures, tracteur' + (C.SURV ? ', minerai bleu' : '') + ' = métal') + (C.SURV ? row('🎒', 'Sac de 20 places : ton lit et tes coffres sont dedans, touche POSER') + row('🛏', 'Pose ton lit chez toi = ton point de réapparition') + row('📦', 'Casse un coffre à la pioche pour le garder et ranger tes affaires') + row('💾', 'Sauvegarde automatique sur ton téléphone') : '') +
      '</div><button type="button" id="sIntroGo">C\'EST PARTI</button><div class="bar"><i></i></div></div>';
    d.hidden = false; var close = function () { d.hidden = true; }; d.querySelector('#sIntroGo').addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); close(); }); d.querySelector('#sIntroGo').addEventListener('click', close); setTimeout(close, C.SURV ? 15000 : 10000); }

  function bfKit() {   // 1v1 entre potes : 100 vie + 100 bouclier (200 PV), AR, pompe spécialisé, PM, 2 shields
    var P = me(); P.hp = 100; P.sh = 100; P.inv = [C.newSlot('fusil'), C.newSlot('pompeS'), C.newSlot('smg')]; P.slot = 1; P.heals.shield = 2; P.heals.mini = 0; P.heals.heal = 0; if (C.hudRefresh) C.hudRefresh(); }
  function KN(a) { try { return window.keyName(window.BIND[a]); } catch (e) { return ''; } }
  window.SURVIE = {
    init: function (THREE, ctx) { T = THREE; C = ctx; ZERO = new T.Matrix4().makeScale(0, 0, 0); GEO.esc = rampGeo(); GEO.toit = roofGeo(); C.groundAt = groundAt;
      if (C.SURV) genNodes(); ui();
      if (C.SURV && !C.CREA && window.FAUNE) FAUNE.init(T, C, { groundAt: groundAt, give: function (k, n, x, y, z) { give(k, n, x, y, z); } });
      if (C.SURV && !C.CREA && window.ZOMB) { ZOMB.init(T, C, onKill); posters(); var bb = document.createElement('button'); bb.type = 'button'; bb.id = 'sBookB'; bb.textContent = '📖 CRÉATURES'; document.body.appendChild(bb); press(bb, function () { book(!BOOKON); }); }
      if (C.SURV) { addEventListener('pagehide', save); document.addEventListener('visibilitychange', function () { if (document.hidden) save(); }); }
      if (C.SURV && T.GLTFLoader && window.LOOT3D) new T.GLTFLoader().load('models/bedSingle.glb', function (g) { try { BEDTPL = LOOT3D.bake(T, g.scene, { size: 2.3, col: {} }); showBed(); } catch (e) { console.error(e); } });
      var L = window.LOOT3D, GL = T.GLTFLoader ? new T.GLTFLoader() : null, left = NDEF.length + 1, tpl = [], stp = null;
      function done() { if (--left > 0) return; try { buildNodes(tpl); buildStumps(stp); READY = true; } catch (e) { console.error('SURVIE', e); } }
      if (!GL || !L || !L.bake) { left = 1; done(); return; }
      NDEF.forEach(function (d, i) { GL.load('models/survie/' + d.f + '.glb', function (g) { try { tpl[i] = L.bake(T, g.scene, d); } catch (e) { console.error(e); } done(); }, null, done); });
      GL.load('models/nature/q_TreeStump.glb', function (g) { try { stp = L.bake(T, g.scene, { size: 1.3, col: {} }); } catch (e) { console.error(e); } done(); }, null, done); },
    reset: function () { RES = { bois: 0, pierre: 0, metal: 0 }; TIME = 0; BED = null; bagInit(); if (C.SURV) BAG[0] = { t: 'lit' }; if (C.SURV && !C.CREA) BAG[1] = { t: 'livre' }; if (C.CREA) { BAG[1] = { t: 'coffre' }; BAG[2] = { t: 'coffre' }; BAG[3] = { t: 'coffre' }; if (C.BF) BAG[1] = BAG[2] = BAG[3] = null; var Pp = me(); Pp.inv = [null, null, null]; Pp.slot = 0; Pp.heals.shield = 0; }   /* créatif : AUCUNE arme avant « Lancer la partie » (l'équipement vient des Paramètres de la partie) */   // créatif : 2 shields de base, constructions illimitées STOR.slice().forEach(removeStor); bag(false); PIECES.slice().forEach(function (p) { removePiece(p, false); }); setTool(C.SURV ? 'pioche' : null); hudRes();
      if (el.tools) el.tools.hidden = false;
      NODES.forEach(function (n) { if (n.dead) { n.dead = false; if (C.PCOL.indexOf(n.col) < 0) C.PCOL.push(n.col); } n.hp = n.max; n.shk = 0; nodeSet(n); });
      STUMPL.forEach(function (t) { regrow(t); }); STUMPL = []; C.TREES.forEach(function (t) { t.hp = null; t.gone = false; t.shp = null; });
      HARV().forEach(function (it) { if (it.dead || it.hp !== it.hp0) PROPS.harvBack(it); });
      WRECKS.forEach(function (w) { if (w.dead || w.hp !== w.hp0) backWreck(w); });
      if (C.SURV) { applyRuins(); var d = C.CREA ? null : loadSave(); if (C.fogLoad) { var fu = null; try { fu = d ? localStorage.getItem(SKEY + '_fog') : null; } catch (e) {} C.fogLoad(fu); } if (d) { applySave(d); applyRuins((d.walls || []).map(function (i) { return C.WALLS[i]; })); (d.wrecks || []).forEach(function (id) { var w = WRECKS.filter(function (q) { return q.id === id; })[0]; if (w) breakWreck(w, false); }); }
        if (window.ZOMB && ZOMB.on) ZOMB.reset(d ? d.zdead : []); showBed(); }
      stumpsRefresh(); hudRes(); hudBuild(); setTimeout(function () { if (C.state() === 'play') intro(); }, 60); saveT = 0; },
    respawn: function () { var P = me(); P.hp = 100; P.sh = 0; P.vx = P.vz = P.vy = 0; if (P.veh) return false;
      if (C.CREA) { var A = C.BF && C.ARENA ? C.ARENA : C.TOWNS[0]; P.x = A[1] + (C.PROPM ? 17 : 3) + (Math.random() - .5) * 8; P.z = A[2] + (C.BF ? 0 : 6); P.y = P.gy = C.hgt(P.x, P.z); var kit = C.crKit && C.crKit(); if (!kit) { P.inv = [null, null, null]; P.slot = 0; } C.toast(kit ? '⚔️ C\'EST REPARTI · ' + (P.sh ? '200' : '100') + ' PV' : '🎨 RÉAPPARITION'); return true; }
      if (BED) { P.x = BED.x + Math.cos(BED.a + 1.57) * 1.4; P.z = BED.z + Math.sin(BED.a + 1.57) * 1.4; C.toast('🛏 TU TE RÉVEILLES DANS TON LIT'); }
      else { var T0 = C.TOWNS[0]; P.x = T0[1] + 3; P.z = T0[2] + 6; ['bois', 'pierre', 'metal'].forEach(function (k) { RES[k] = Math.floor(RES[k] / 2); }); hudRes(); C.toast('☠ TU ES MORT · PAS DE LIT : RETOUR AU CAMP (MOITIÉ DES MATÉRIAUX PERDUE)'); }
      P.y = P.gy = Math.max(C.hgt(P.x, P.z), groundAt(P.x, P.z, (BED ? BED.y : 0) + 1)); C.noise(.8, .2, 300); save(); return true; },
    nowPlaying: function (n) { if (!el.now) return; el.now.textContent = '🎵 ' + n; el.now.classList.add('on'); setTimeout(function () { el.now.classList.remove('on'); }, 5000); },
    bag: function (on) { bag(on); }, bagOpen: function () { return BAGON; }, bagAdd: bagAdd, act: act,
    clearBuilds: function () { PIECES.slice().forEach(function (p) { if (p.t === 'lit' || p.t === 'coffre') return; p._net = true; removePiece(p, false, true); }); },   // efface toutes les constructions (panneau RÉINITIALISER, nouvelle manche)
    save: save, hasSave: function () { return !!loadSave(); }, wipe: function () { try { localStorage.removeItem(SKEY); localStorage.removeItem(SKEY + '_fog'); } catch (e) {} },
    update: function (dt) { TIME += dt; for (var gi = 0; gi < PIECES.length; gi++) { var gp = PIECES[gi]; if (!gp.grow) continue; gp.hp = Math.min(gp.hmax, gp.hp + (gp.hmax * (1 - (HP0[gp.m] || 90) / (HPP[gp.m] || 150))) / (HPT[gp.m] || 4) * dt); if (gp.hp >= gp.hmax) gp.grow = false; if (gp.ws) gp.ws.forEach(function (w) { w.hp = gp.hp; }); } if (AFFM.length && C.state() === 'play') affTick(); var P = me(); if (P && P.model && P === me()) attachPick(P.model);
      if (PICK) PICK.visible = TOOL === 'pioche' && P.alive && !(P.danceT > 0) && !P.swim && !P.ko; if (P.model && (TOOL === 'build' || TOOL === 'edit')) attachBook(P.model); if (BOOK) BOOK.visible = (TOOL === 'build' || TOOL === 'edit') && P.alive && !(P.danceT > 0) && P.mode === 'ground' && !P.swim && !P.ko;
      // arbres qui tremblent, rochers qui reviennent, arbres qui repoussent
      C.TREES.forEach(function (t) { if (t.shk > 0) { t.shk = Math.max(0, t.shk - dt); if (window.TREES3D && TREES3D.shake) TREES3D.shake(t, t.shk > 0 ? Math.sin(t.shk * 70) * t.shk * .5 : 0); } });
      NODES.forEach(function (n) { if (n.shk > 0) { n.shk = Math.max(0, n.shk - dt); nodeSet(n); } if (n.dead) { n.t += dt; if (n.t > 240 && Math.hypot(n.x - P.x, n.z - P.z) > 40) { n.dead = false; n.hp = n.max; C.PCOL.push(n.col); nodeSet(n); } } });
      for (var i = STUMPL.length - 1; i >= 0; i--) { var t = STUMPL[i]; t.cutT += dt; if (t.cutT > 300 && Math.hypot(t.x - P.x, t.z - P.z) > 50) { regrow(t); STUMPL.splice(i, 1); stumpsRefresh(); } }   // souche gardée = l'arbre repousse
      HARV().forEach(function (it) { if (it.shk > 0) { it.shk = Math.max(0, it.shk - dt); if (!it.dead) PROPS.harvSet(it, true); } if (it.dead) { it.t = (it.t || 0) + dt; if (it.t > 300 && Math.hypot(it.x - P.x, it.z - P.z) > 60) PROPS.harvBack(it); } });
      if (!WRK && C.cars) WRK = buildWrecks(); if ((TICK += dt) > .5) { TICK = 0; wreckVis(); if (C.SURV) { saveT += .5; if (saveT > 20) { saveT = 0; save(); } } }
      if (window.ZOMB && ZOMB.on) ZOMB.update(dt, C.isNight && C.isNight());
      if (window.FAUNE && FAUNE.on) FAUNE.update(dt);
      if (el.open) { var ns = C.SURV && P.alive && !BAGON ? nearStor() : null; if (!!ns === el.open.hidden) el.open.hidden = !ns; }
      if (C.CREA && (!C.PROPM || C.BF)) { if (!ARM) armory(); armoryTick(dt); }
      if (C.SURV) { if (!BUT) critters(); crittersTick(dt); if (NIM.MET && Math.hypot(P.x - PACKP.x, P.z - PACKP.z) > 40) nodePack(P.x, P.z); }
      PIECES.slice().forEach(function (p) { if (p.ws && p.ws.some(function (w) { return !w.alive; })) removePiece(p, true); });   // un morceau cassé = tout le mur tombe
      if (PLACE_CD > 0) PLACE_CD -= dt;
      if (TOOL === 'place' && P.alive && P.mode === 'ground') ghostShow(placePlan(), true);
      else if (TOOL === 'build' && P.alive && P.mode === 'ground' && C.state() === 'play') { var p = planOk(), ok = !p.bad && !taken(p.key, p) && (INF() || isIX(MATK) || RES[p.t === 'lit' ? 'bois' : pickMat(cost(p.t))] >= cost(p.t)); ghostShow(taken(p.key, p) ? null : p, ok); } else ghostShow(null);
      if (SW.t >= 0) { SW.t += dt; if (!SW.hit && SW.t >= .27) { SW.hit = true; strike(); } if (SW.t >= .5) SW.t = -1; } },
    use: function (held, dt) {
      if (TOOL === 'edit') { if (!EDW) { TOOL = EPREV; return; } if (held && !ELAST) { editTap(); EDRAG = 1; } else if (held && EDRAG) editDrag(); if (!held && ELAST && EDRAG && C.editRel && C.editRel()) { EDRAG = 0; ELAST = false; editWall(); return; } ELAST = held; var P2 = me(); if (Math.hypot(P2.x - EDW.x, P2.z - EDW.z) > 9) editCancel(); return; }
      if (TOOL === 'pioche') { if (held && SW.t < 0) { SW.t = 0; SW.hit = false; C.noise(.12, .05, 1800); } }
      else if (TOOL === 'place' && held && PLACE_CD <= 0) { PLACE_CD = .4; placeItem(); }
      else if (TOOL === 'build' && held && PLACE_CD <= 0) { PLACE_CD = .2; var p = planOk(); if (p.bad || taken(p.key, p)) return; var cs = cost(p.t), mk = p.t === 'lit' ? 'bois' : pickMat(cs); if (p.t !== 'lit' && mk !== MATK) { MATK = mk; p.m = mk; hudBuild(); }
        if (!INF() && !isIX(mk) && RES[mk] < cs) { C.toast('PAS ASSEZ DE ' + NAME[mk] + ' (' + cs + ')'); PLACE_CD = .8; return; }
        if (placePiece(p)) { p.mine = true; if (HOOK) HOOK('b', { p: ser(p) }); if (!INF() && !isIX(mk)) RES[mk] -= cs; hudRes(); hudBuild(); C.tone('triangle', 420, 640, .09, .07); C.noise(.08, .1, 1200); } } },
    groundAt: groundAt,
    pose: function (o, c, ok) {   // bras qui tiennent la pioche / le plan de construction
      if (!TOOL || !ok) return; var th;
      if (TOOL === 'pioche') { var t = SW.t; th = t < 0 ? .55 : t < .2 ? .55 + (2.2 - .55) * (t / .2) : t < .3 ? 2.2 - (2.2 + .1) * ((t - .2) / .1) : -.1 + (.65) * ((t - .3) / .2);
        o.ra = th; o.rb = -.06; o.rw = 0; o.re = 0; o.la = th - .12; o.lb = -.62; o.lw = .35; o.le = .55; /* pioche bien DROITE dans l'axe, main gauche qui vient aider */ o.bp = (o.bp || 0) + (t >= .2 && t < .36 ? .18 : t >= 0 && t < .2 ? -.06 : 0); }   // pioche à DEUX mains (main gauche plus haut sur le manche), comme Fortnite
      else { o.ra = 1.3; o.rb = .05; o.re = .15; o.rw = .25; o.la = 1.0; o.lb = -.5; o.le = .75; o.lw = .45; } },   // plan de construction tenu dans la main gauche, main droite qui vise
    blendK: function () { return TOOL === 'pioche' ? 30 : 12; },
    tool: function () { return TOOL; }, ceil: ceilAt, setTool: setTool, hook: function (f) { HOOK = f; }, netPlace: netPlace, netRemove: netRemove, netEdit: netEdit, myPieces: function () { return PIECES.filter(function (p) { return p.mine; }).map(ser); }, _edit: function () { editWall(); }, _etap: function () { editTap(); },
    toolName: function () { if (TOOL === 'place') return 'Poser ' + (PLACEK === 'lit' ? 'le LIT 🛏' : 'le COFFRE 📦') + ' · tire pour poser'; return TOOL === 'pioche' ? 'Pioche ⛏ · arbres = bois, rochers = pierre, carcasses = métal' : PIECE === 'lit' ? 'Construire 🔨 · LIT (30 bois) = réapparition' : 'Construire 🔨 · ' + PNAME[PIECE] + ' en ' + NAME[MATK].toLowerCase() + ' (' + COST + ')'; },
    timeStr: function () { var s = Math.floor(TIME); return (s >= 60 ? Math.floor(s / 60) + ' min ' : '') + (s % 60) + ' s'; },
    hudLine: function () { var s = Math.floor(TIME), kk = window.ZOMB && ZOMB.kinds ? ZOMB.kinds() : [], tk = 0; kk.forEach(function (k) { tk += BESTI[k.id] || 0; }); var zl = window.ZOMB && ZOMB.on ? ' · 🧟 ' + tk + ' tuées · 📖 ' + kk.filter(function (k) { return BESTI[k.id]; }).length + '/' + kk.length : ''; return (C.isNight && C.isNight() ? '🌙 ' : '☀️ ') + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + zl; },
    time: function () { return TIME; },
    res: function () { return RES; }, setRes: function (n) { RES = { bois: n, pierre: n, metal: n }; hudRes(); hudBuild(); }, restore: function (a) { if (!a || taken(a[6])) return; var p = { t: a[0], m: a[1], x: a[2], z: a[3], L: a[4], d: a[5], key: a[6], hw: a[7] || undefined, hd: a[8] || undefined }; p.mask = mkParse(a[9], p); if (placePiece(p)) { p.mine = true; p.hp = p.hmax = hpMax(p); p.grow = false; } }, wipe: function () { PIECES.slice().forEach(function (p) { p._net = true; removePiece(p, false, true); }); }, wallDown: function (p) { if (PIECES.indexOf(p) >= 0) removePiece(p, true); }, editReset: editReset, ledge: function (x, y, z, fx, fz) { var best = null;   // bord d'un sol / d'une rampe juste devant, à portée de saut : on s'y agrippe
      [.7, 1.3].forEach(function (k) { var px = x + fx * k, pz = z + fz * k; PIECES.forEach(function (q) { if (q.t !== 'sol' && q.t !== 'esc' && q.t !== 'toit') return; if (Math.abs(px - q.x) > CELL / 2 + .05 || Math.abs(pz - q.z) > CELL / 2 + .05) return; var top = q.t === 'sol' ? q.L + .15 : groundAt(px, pz, y + 4); if (top > y + .7 && top < y + 4.3 && (best == null || top < best)) best = top; }); }); return best; },
    _ev: function (s) { return eval(s); }, setTex: setTex,
    _edit: function (key, sel) { var q = PIECES.filter(function (x) { return x.key === key; })[0]; if (!q) return false; EDW = q; ESEL = (sel || []).slice(); EMK = new Array(NT(q)).fill(false); ESEL.forEach(function (i) { EMK[i] = true; }); gridDraw(); return true; },
    nextMat: function () { if (TOOL === 'build') nextMat(); }, _btex: function (m) { return bTex(m); }, _sw: function (t) { SW.t = t; SW.hit = true; }, _strike: function () { strike(); }, _build: function (t, mk) { PIECE = t; MATK = mk || MATK; PLACE_CD = 0; var tl = TOOL; TOOL = 'build'; this.use(true, 0); TOOL = tl; }, give: function (k, n) { RES[k] = Math.min(RMAX, RES[k] + n); hudRes(); hudBuild(); }, pieces: function () { return PIECES; }, nodes: function () { return NODES; }, ready: function () { return READY; }
  };
  function regrow(t) { t.cut = false; t.r = t.r0 || t.r || .5; t.h = t.h0 || t.h || 6; t.hp = null; if (window.TREES3D && TREES3D.cut) TREES3D.cut(t, true); }
})();
