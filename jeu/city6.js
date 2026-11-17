/* ===== WALD CITY — la petite ville « réaliste » au coucher du soleil (mode 'city') =====
   Ville ORIGINALE façon côte de Floride : hôtels art déco pastel avec néons sur le front de mer, tours de verre qui reflètent le ciel,
   immeubles à balcons, boutiques, palmiers, plage avec cabanes de sauveteurs, ponton avec grande roue, marina.
   Tout est généré ici (aucun modèle d'un autre jeu) : textures dessinées, matériaux PBR, reflets du ciel (environnement pré-filtré).
   Les murs invisibles 'inv' (C.W) donnent les collisions (balles, joueurs, toits où l'on peut marcher).
   CITY6.hotel / tower / lamp / parasol servent aussi d'APPAREILS du Créatif. */
(function () {
  var T, C, R, ENV = null, MATS = {}, TX = {};
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function canvas(w, h, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; }
  function texOf(c, rep, srgb) { var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; if (srgb !== false) t.encoding = T.sRGBEncoding; t.anisotropy = 8; if (rep) t.repeat.set(rep[0], rep[1]); return t; }
  function noise(g, w, h, n, a, dark) { for (var i = 0; i < n; i++) { var v = Math.random(); g.fillStyle = (dark && v < .5 ? 'rgba(0,0,0,' : 'rgba(255,255,255,') + (Math.random() * a) + ')'; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); } }

  /* ---------- TEXTURES (dessinées une fois) ---------- */
  function makeTextures() {
    // asphalte : granulat fin, plaques plus sombres, traces de pneus
    TX.asph = texOf(canvas(512, 512, function (g, w, h) { g.fillStyle = '#3b3d42'; g.fillRect(0, 0, w, h); noise(g, w, h, 26000, .16, true);
      for (var i = 0; i < 14; i++) { var x = Math.random() * w, y = Math.random() * h, r = 30 + Math.random() * 90, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(20,20,24,.28)'); gr.addColorStop(1, 'rgba(20,20,24,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
      g.strokeStyle = 'rgba(15,15,18,.5)'; g.lineWidth = 1.2; for (var c = 0; c < 6; c++) { var cx = Math.random() * w, cy = Math.random() * h; g.beginPath(); g.moveTo(cx, cy); for (var s = 0; s < 6; s++) { cx += (Math.random() - .5) * 50; cy += (Math.random() - .5) * 50; g.lineTo(cx, cy); } g.stroke(); } }));
    // trottoir : dalles de béton 1,5 m avec joints, taches
    TX.walk = texOf(canvas(512, 512, function (g, w, h) { g.fillStyle = '#b9b4aa'; g.fillRect(0, 0, w, h); noise(g, w, h, 14000, .12, true);
      for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) { g.fillStyle = 'rgba(' + (Math.random() < .5 ? '255,255,255' : '0,0,0') + ',' + (Math.random() * .06) + ')'; g.fillRect(i * 128, j * 128, 128, 128); }
      g.strokeStyle = 'rgba(60,55,50,.55)'; g.lineWidth = 3; for (var k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(k * 128, 0); g.lineTo(k * 128, h); g.stroke(); g.beginPath(); g.moveTo(0, k * 128); g.lineTo(w, k * 128); g.stroke(); } }));
    // sable : grain + rides du vent
    TX.sand = texOf(canvas(512, 512, function (g, w, h) { g.fillStyle = '#e6d2a8'; g.fillRect(0, 0, w, h); noise(g, w, h, 30000, .18, true);
      g.strokeStyle = 'rgba(160,130,90,.18)'; g.lineWidth = 2; for (var y = 0; y < h; y += 9) { g.beginPath(); for (var x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x * .04 + y * .3) * 3); g.stroke(); } }));
    // herbe tondue
    TX.grass = texOf(canvas(256, 256, function (g, w, h) { g.fillStyle = '#5f9a3e'; g.fillRect(0, 0, w, h); for (var i = 0; i < 9000; i++) { g.fillStyle = 'hsl(' + (85 + Math.random() * 25) + ',' + (40 + Math.random() * 25) + '%,' + (28 + Math.random() * 22) + '%)'; g.fillRect(Math.random() * w, Math.random() * h, 1, 2 + Math.random() * 3); } }));
    // planches du ponton
    TX.deck = texOf(canvas(256, 256, function (g, w, h) { for (var i = 0; i < 8; i++) { g.fillStyle = 'hsl(' + (25 + Math.random() * 8) + ',35%,' + (38 + Math.random() * 10) + '%)'; g.fillRect(0, i * 32, w, 30); g.fillStyle = 'rgba(30,15,5,.6)'; g.fillRect(0, i * 32 + 30, w, 2); } noise(g, w, h, 4000, .12, true); }));
  }
  /* façade d'hôtel art déco : une travée de 3 m × 3,2 m — crépi pastel, fenêtre avec reflet du ciel, cadre blanc, « sourcil » d'ombre */
  function facadeTex(col) { var c = canvas(256, 272, function (g, w, h) { g.fillStyle = col; g.fillRect(0, 0, w, h); noise(g, w, h, 5000, .07, true);
      var gr = g.createLinearGradient(0, 70, 0, 230); gr.addColorStop(0, '#9fc6e6'); gr.addColorStop(.45, '#4b6f96'); gr.addColorStop(1, '#203247'); g.fillStyle = '#f6f2ea'; g.fillRect(52, 62, 152, 176); g.fillStyle = gr; g.fillRect(60, 70, 136, 160);
      g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.moveTo(60, 70); g.lineTo(120, 70); g.lineTo(60, 160); g.fill(); g.fillStyle = '#f6f2ea'; g.fillRect(124, 70, 8, 160); g.fillRect(60, 146, 136, 6);
      g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(44, 48, 168, 12); g.fillStyle = 'rgba(255,255,255,.65)'; g.fillRect(44, 44, 168, 5); });
    return texOf(c); }
  /* mur-rideau des tours : panneaux de verre 1,5 × 4 m, montants métalliques */
  function curtainTex(tint) { var c = canvas(256, 512, function (g, w, h) { for (var i = 0; i < 4; i++) for (var j = 0; j < 2; j++) { var l = 30 + Math.random() * 14; g.fillStyle = 'hsl(' + tint + ',35%,' + l + '%)'; g.fillRect(i * 64, j * 256, 64, 256); var gr = g.createLinearGradient(0, j * 256, 0, j * 256 + 256); gr.addColorStop(0, 'rgba(255,255,255,.14)'); gr.addColorStop(1, 'rgba(0,0,0,.18)'); g.fillStyle = gr; g.fillRect(i * 64, j * 256, 64, 256); }
      g.fillStyle = '#8b939c'; for (var k = 0; k <= 4; k++) g.fillRect(k * 64 - 3, 0, 6, h); g.fillRect(0, 0, w, 10); g.fillRect(0, 251, w, 10); g.fillStyle = 'rgba(30,34,40,.85)'; g.fillRect(0, 236, w, 15); });
    return texOf(c); }
  /* immeuble d'habitation : crépi clair, fenêtres coulissantes */
  function aptTex(col) { var c = canvas(256, 256, function (g, w, h) { g.fillStyle = col; g.fillRect(0, 0, w, h); noise(g, w, h, 5000, .08, true);
      [[30, 60], [146, 60]].forEach(function (p) { g.fillStyle = '#e9e4da'; g.fillRect(p[0] - 6, p[1] - 6, 92, 132); var gr = g.createLinearGradient(0, p[1], 0, p[1] + 120); gr.addColorStop(0, '#a9c4dc'); gr.addColorStop(1, '#2f4258'); g.fillStyle = gr; g.fillRect(p[0], p[1], 80, 120); g.fillStyle = '#e9e4da'; g.fillRect(p[0] + 38, p[1], 4, 120); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(p[0] + 4, p[1] + 4, 20, 60); }); });
    return texOf(c); }
  function storeTex() { var c = canvas(256, 128, function (g, w, h) { g.fillStyle = '#2b2f36'; g.fillRect(0, 0, w, h); var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#d8c39a'); gr.addColorStop(1, '#6a5638'); g.fillStyle = gr; g.fillRect(8, 10, 240, 112);
      g.fillStyle = 'rgba(40,30,20,.5)'; for (var i = 0; i < 6; i++) g.fillRect(20 + i * 38, 60 + Math.random() * 20, 22, 60); g.fillStyle = '#2b2f36'; g.fillRect(124, 10, 6, 112); g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(14, 14, 60, 50); });
    return texOf(c); }
  function signTex(txt, col) { var c = canvas(512, 128, function (g, w, h) { g.clearRect(0, 0, w, h); g.font = 'italic 900 84px Georgia, "Times New Roman", serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = col; g.shadowBlur = 26; g.fillStyle = col; g.fillText(txt, w / 2, h / 2 + 4); g.shadowBlur = 8; g.fillStyle = '#ffffff'; g.fillText(txt, w / 2, h / 2 + 4); });
    var t = texOf(c); t.wrapS = t.wrapT = T.ClampToEdgeWrapping; return t; }

  /* ---------- MATÉRIAUX PBR ---------- */
  function std(o) { var m = new T.MeshStandardMaterial(o); if (ENV) m.envMap = ENV; return m; }
  function makeMats() {
    MATS.asph = std({ map: TX.asph, roughness: .82, metalness: 0 }); MATS.walk = std({ map: TX.walk, roughness: .88, envMapIntensity: .4 }); MATS.sand = std({ map: TX.sand, roughness: .95, envMapIntensity: .35 }); MATS.grass = std({ map: TX.grass, roughness: .95 });
    MATS.deck = std({ map: TX.deck, roughness: .8 }); MATS.white = std({ color: '#ece6dc', roughness: .6, envMapIntensity: .4 }); MATS.trim = std({ color: '#f6f2ea', roughness: .45, envMapIntensity: .4 }); MATS.dark = std({ color: '#26292e', roughness: .5, metalness: .4 });
    MATS.metal = std({ color: '#b8bec6', roughness: .3, metalness: .9 }); MATS.pole = std({ color: '#3a3f46', roughness: .45, metalness: .7 }); MATS.line = new T.MeshBasicMaterial({ color: '#f2f0e6' }); MATS.yline = new T.MeshBasicMaterial({ color: '#f2c230' });
    MATS.glassD = std({ color: '#7fa6c4', roughness: .05, metalness: .95 }); MATS.store = std({ map: storeTex(), roughness: .15, metalness: .3, emissive: '#3a2a10', emissiveIntensity: .35 });
    MATS.curb = std({ color: '#d7d3cb', roughness: .75 }); MATS.water = std({ color: '#2a8fb0', roughness: .06, metalness: .4, transparent: true, opacity: .9 });
    var PAST = ['#f294b6', '#7fd8bc', '#ae9cf0', '#f6b97e', '#7fcaee', '#f0dc6a', '#f08672', '#b2e48a']; MATS.fac = PAST.map(function (c) { return std({ map: facadeTex(c), roughness: .6, envMapIntensity: .45 }); }); MATS.pastel = PAST.map(function (c) { return std({ color: c, roughness: .7, envMapIntensity: .45 }); });
    MATS.cw = [205, 190, 30, 215, 170].map(function (h, i) { return std({ map: curtainTex(h), roughness: .08 + i * .02, metalness: .9, envMapIntensity: 1.4 }); });
    MATS.apt = ['#e6dccb', '#e2c6a4', '#c9d8de', '#ead6b0'].map(function (c) { return std({ map: aptTex(c), roughness: .8, envMapIntensity: .4 }); });
    MATS.neon = ['#ff3fa8', '#3ff0ff', '#b45cff', '#ffa040', '#7dff8a'].map(function (c) { return new T.MeshBasicMaterial({ color: c }); });
    MATS.awn = ['#e8495f', '#2a9fd8', '#f4f1ea', '#2fae7a', '#f2a23a'].map(function (c) { return std({ color: c, roughness: .8, side: T.DoubleSide }); });
  }

  /* ---------- FUSION DE GÉOMÉTRIE (une seule mesh par matériau → rapide) ---------- */
  var BK = {};
  function bucket(mat) { var k = mat.uuid; return BK[k] || (BK[k] = { mat: mat, P: [], N: [], U: [], I: [] }); }
  var _m = null, _v = null, _n = null, _q = null;
  function addGeo(mat, geo, x, y, z, ry, sx, sy, sz, uvs) {   // ajoute une géométrie transformée au seau du matériau
    var b = bucket(mat), base = b.P.length / 3; _m.compose(_v.set(x, y, z), _q.setFromEuler(new T.Euler(0, ry || 0, 0)), new T.Vector3(sx || 1, sy || 1, sz || 1)); var nm = new T.Matrix3().getNormalMatrix(_m);
    var p = geo.attributes.position, n = geo.attributes.normal, u = geo.attributes.uv;
    for (var i = 0; i < p.count; i++) { _v.set(p.getX(i), p.getY(i), p.getZ(i)).applyMatrix4(_m); b.P.push(_v.x, _v.y, _v.z); _n.set(n.getX(i), n.getY(i), n.getZ(i)).applyMatrix3(nm).normalize(); b.N.push(_n.x, _n.y, _n.z); b.U.push(u ? u.getX(i) * (uvs ? uvs[0] : 1) : 0, u ? u.getY(i) * (uvs ? uvs[1] : 1) : 0); }
    if (geo.index) for (var k = 0; k < geo.index.count; k++) b.I.push(base + geo.index.getX(k)); else for (k = 0; k < p.count; k++) b.I.push(base + k); }
  /* boîte avec UV en mètres (chaque face : u = largeur / tu, v = hauteur / tv) — la texture garde sa taille réelle */
  var FACES = [   // [normale, 4 coins (BL, BR, TR, TL) en ±1, axe largeur, axe hauteur]
    [[1, 0, 0], [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]], 2, 1], [[-1, 0, 0], [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]], 2, 1],
    [[0, 0, 1], [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], 0, 1], [[0, 0, -1], [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]], 0, 1],
    [[0, 1, 0], [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]], 0, 2], [[0, -1, 0], [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]], 0, 2]];
  function box(mat, x, y, z, sx, sy, sz, ry, tu, tv) { var b = bucket(mat), c = Math.cos(ry || 0), s = Math.sin(ry || 0), S = [sx, sy, sz];
    FACES.forEach(function (f) { var n = f[0], k0 = b.P.length / 3, W = S[f[2]], H = S[f[3]];
      f[1].forEach(function (q, qi) { var lx = q[0] * sx / 2, ly = q[1] * sy / 2, lz = q[2] * sz / 2; b.P.push(x + lx * c + lz * s, y + ly, z - lx * s + lz * c); b.N.push(n[0] * c + n[2] * s, n[1], -n[0] * s + n[2] * c);
        var uu = qi === 1 || qi === 2 ? 1 : 0, vv = qi >= 2 ? 1 : 0; b.U.push(tu ? uu * W / tu : uu, tv ? vv * H / tv : (tu ? vv * H / tu : vv)); });
      b.I.push(k0, k0 + 1, k0 + 2, k0, k0 + 2, k0 + 3); }); }
  var GEOS = {};
  function flush(group, shadow) { Object.keys(BK).forEach(function (k) { var b = BK[k]; if (!b.I.length) return; var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(b.P, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(b.N, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(b.U, 2)); g.setIndex(b.I); g.computeBoundingSphere();
      var m = new T.Mesh(g, b.mat); m.castShadow = shadow !== false && !(b.mat.isMeshBasicMaterial); m.receiveShadow = true; m.userData.dyn = true; group.add(m); }); BK = {}; }


  /* ---------- PIÈCES DE LA VILLE ---------- */
  var WALLS = [];
  function solid(x, z, w, d, h, y0) { if (!C.W) return; var o = C.W(x, z, w, d, 'inv', h); if (y0 != null) { o.y0 = y0; o.h = h; } else { o.y0 = C.hgt(x, z) - .5; o.h = h + .5; } WALLS.push(o); return o; }
  function neonBox(ci, x, y, z, sx, sy, sz, ry) { box(MATS.neon[ci % MATS.neon.length], x, y, z, sx, sy, sz, ry); }
  var SIGNS = [];
  function sign(txt, col, x, y, z, ry, w) { var m = new T.Mesh(new T.PlaneGeometry(w || 8, (w || 8) / 4), new T.MeshBasicMaterial({ map: signTex(txt, col), transparent: true, depthWrite: false, side: T.DoubleSide })); m.position.set(x, y, z); m.rotation.y = ry || 0; m.userData.dyn = true; SIGNS.push(m); return m; }

  /* HÔTEL ART DÉCO : bloc principal pastel + tour centrale à gradins + sourcils + néons + enseigne, terrasse au rez-de-chaussée */
  var HN = ['CORALINE', 'FLAMINGO', 'PALMERA', 'OCEANA', 'LA PERLA', 'SUNSET', 'MIRAGE', 'AZUR', 'ROSALIA', 'NEPTUNO', 'DELMAR', 'CRYSTAL'];
  function hotel(x, z, ry, w, d, fl, seed, grp) { var r = rng(seed), ci = seed % 8, H0 = C.hgt(x, z), fh = 3.2, H = fl * fh + 1.2, c = Math.cos(ry), s = Math.sin(ry);
    function P(lx, lz) { return [x + lx * c + lz * s, z - lx * s + lz * c]; }
    box(MATS.fac[ci], x, H0 + H / 2, z, w, H, d, ry, 3, 3.2);   // façade
    box(MATS.white, x, H0 + H + .25, z, w + .5, .5, d + .5, ry);   // corniche
    for (var f = 1; f < fl; f++) { var q = P(0, d / 2 + .35); box(MATS.trim, q[0], H0 + f * fh + 1.05, q[1], w, .12, .7, ry); }   // sourcils au-dessus des fenêtres
    var tw = Math.min(6, w * .32), th = 5 + r() * 6, q0 = P(0, d / 2 - 1.2);   // tour centrale à gradins
    box(MATS.pastel[(ci + 3) % 8], q0[0], H0 + H + th / 2, q0[1], tw, th, 3, ry); box(MATS.white, q0[0], H0 + H + th + .6, q0[1], tw * .7, 1.2, 2.2, ry); box(MATS.white, q0[0], H0 + H + th + 1.6, q0[1], tw * .4, .8, 1.4, ry);
    var qn = P(0, d / 2 + .3); [-1, 1].forEach(function (sd) { var qq = P(sd * (tw / 2 + .15), d / 2 + .3); neonBox(ci, qq[0], H0 + H + th / 2 - 1, qq[1], .14, th + H * .55, .14, ry); });   // filets néon verticaux
    var qs = P(0, d / 2 + .25); box(MATS.neon[(ci + 1) % 5], qs[0], H0 + H - .1, qs[1], w, .12, .12, ry);   // néon sous la corniche
    var sg = sign(HN[seed % HN.length], ['#ff4fb0', '#4ff0ff', '#c58cff', '#ffb050', '#8dff9a'][ci % 5], P(0, d / 2 + 1.55)[0], H0 + H + th * .55, P(0, d / 2 + 1.55)[1], ry, tw * 1.9); grp.add(sg);
    // rez-de-chaussée : vitrines, auvent, terrasse avec tables et parasols
    var qa = P(0, d / 2 + 1.4); box(MATS.store, P(0, d / 2 + .02)[0], H0 + 1.5, P(0, d / 2 + .02)[1], w - 1, 2.8, .1, ry, 4, 2.8); box(MATS.awn[seed % 5], qa[0], H0 + 3.15, qa[1], w - .6, .12, 2.8, ry);
    for (var t = 0; t < Math.floor(w / 4); t++) { var qt = P(-w / 2 + 2 + t * 4, d / 2 + 4.2); box(MATS.white, qt[0], H0 + .72, qt[1], .9, .06, .9, ry); box(MATS.dark, qt[0], H0 + .36, qt[1], .08, .72, .08, ry); }
    solid(x, z, Math.abs(c) > .5 ? w : d, Math.abs(c) > .5 ? d : w, H + .3); }
  /* TOUR DE VERRE : 2 ou 3 volumes en retrait, couronne, antenne, héliport parfois */
  function tower(x, z, ry, w, d, h, seed) { var r = rng(seed), mi = seed % MATS.cw.length, H0 = C.hgt(x, z), y = H0, parts = h > 60 ? 3 : 2, hw = w, hd = d;
    box(MATS.dark, x, H0 + 2.5, z, w + .6, 5, d + .6, ry); box(MATS.glassD, x, H0 + 2.5, z, w + .7, 3.6, d + .7, ry);   // socle vitré sombre
    for (var p = 0; p < parts; p++) { var ph = (h - 5) / parts * (p === 0 ? 1.15 : .95); box(MATS.cw[mi], x, y + 5 + ph / 2, z, hw, ph, hd, ry, 6, 8); box(MATS.metal, x, y + 5 + ph + .2, z, hw + .3, .4, hd + .3, ry); y += ph; hw *= .78; hd *= .78; }
    var top = y + 5; box(MATS.dark, x, top + 1.5, z, hw * .8, 3, hd * .8, ry);
    if (r() < .5) { box(MATS.pole, x, top + 9, z, .35, 14, .35, ry); box(MATS.neon[0], x, top + 16.2, z, .5, .5, .5, ry); }
    else { box(MATS.neon[1], x, top + 3.1, z, hw * .8 + .1, .15, hd * .8 + .1, ry); }
    solid(x, z, Math.abs(Math.cos(ry)) > .5 ? w + .6 : d + .6, Math.abs(Math.cos(ry)) > .5 ? d + .6 : w + .6, h); }
  /* IMMEUBLE D'HABITATION à balcons */
  function apartment(x, z, ry, w, d, fl, seed) { var r = rng(seed), mi = seed % MATS.apt.length, H0 = C.hgt(x, z), fh = 3, H = fl * fh, c = Math.cos(ry), s = Math.sin(ry);
    box(MATS.apt[mi], x, H0 + H / 2, z, w, H, d, ry, 6, 3); box(MATS.white, x, H0 + H + .2, z, w + .4, .4, d + .4, ry);
    for (var f = 1; f < fl; f++) for (var b = 0; b < Math.floor(w / 6); b++) { var lx = -w / 2 + 3 + b * 6, lz = d / 2 + .7; box(MATS.white, x + lx * c + lz * s, H0 + f * fh + .05, z - lx * s + lz * c, 4.2, .18, 1.4, ry); box(MATS.glassD, x + lx * c + (lz + .65) * s, H0 + f * fh + .6, z - lx * s + (lz + .65) * c, 4.2, 1, .05, ry); }
    for (var k = 0; k < 3; k++) box(MATS.metal, x + (r() - .5) * w * .6, H0 + H + .9, z + (r() - .5) * d * .6, 1.6, 1.2, 1.2, ry);   // clims
    solid(x, z, Math.abs(c) > .5 ? w : d, Math.abs(c) > .5 ? d : w, H); }
  /* BOUTIQUES basses (un étage) avec vitrine et auvent */
  function shops(x, z, ry, w, d, seed) { var H0 = C.hgt(x, z), c = Math.cos(ry), s = Math.sin(ry); box(MATS.pastel[seed % 8], x, H0 + 2.6, z, w, 5.2, d, ry); box(MATS.white, x, H0 + 5.3, z, w + .3, .3, d + .3, ry);
    var lz = d / 2 + .02; box(MATS.store, x + lz * s, H0 + 1.6, z + lz * c, w - 1, 2.8, .1, ry, 4, 2.8); var la = d / 2 + 1.1; box(MATS.awn[(seed + 2) % 5], x + la * s, H0 + 3.2, z + la * c, w - .5, .1, 2.2, ry);
    solid(x, z, Math.abs(c) > .5 ? w : d, Math.abs(c) > .5 ? d : w, 5.3); }
  /* LAMPADAIRE moderne (mât courbé + tête) */
  function lamp(x, z, ry) { var H0 = C.hgt(x, z), c = Math.cos(ry), s = Math.sin(ry); box(MATS.pole, x, H0 + 4, z, .18, 8, .18, 0); box(MATS.pole, x + 1.1 * s, H0 + 8, z + 1.1 * c, .14, .14, 2.3, ry); box(MATS.dark, x + 2.2 * s, H0 + 7.9, z + 2.2 * c, .5, .22, .9, ry); box(MATS.neon[3], x + 2.2 * s, H0 + 7.77, z + 2.2 * c, .4, .04, .75, ry); }
  function parasol(x, z, ci, grp) { var H0 = C.hgt(x, z); box(MATS.white, x, H0 + 1.2, z, .06, 2.4, .06, 0); var m = new T.Mesh(new T.ConeGeometry(1.4, .55, 10, 1, true), MATS.awn[ci % 5]); m.position.set(x, H0 + 2.45, z); m.castShadow = true; m.userData.dyn = true; grp.add(m);
    box(MATS.white, x + .9, H0 + .3, z + .4, .7, .1, 1.9, .3); box(MATS.awn[(ci + 2) % 5], x + .9, H0 + .38, z + .4, .6, .05, 1.7, .3); }
  function lifeguard(x, z, ci) { var H0 = C.hgt(x, z); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { box(MATS.white, x + q[0] * 1.1, H0 + 1.2, z + q[1] * 1.1, .15, 2.4, .15, 0); });
    box(MATS.pastel[ci % 8], x, H0 + 3.4, z, 3, 2.2, 3, 0); box(MATS.white, x, H0 + 2.35, z, 3.6, .15, 3.6, 0); box(MATS.neon[ci % 5], x, H0 + 4.6, z, 3.4, .25, 3.4, 0); box(MATS.glassD, x, H0 + 3.6, z + 1.52, 2.2, 1, .04, 0); }
  function palm(x, z, h) { (window.EXT_TREES = window.EXT_TREES || []).push({ sp: 'palm', x: x, y: C.hgt(x, z), z: z, a: (x * 7 + z * 3) % 6.28, h: h || 9 }); }
  function carSpot(x, z, a) { SPOTS.push([x, z, a]); }
  var SPOTS = [];

  /* sol suivant le terrain (plage qui descend dans l'eau) */
  function terrainPlane(mat, x0, z0, x1, z1, seg, lift, rep) { var g = new T.PlaneGeometry(x1 - x0, z1 - z0, seg, seg); g.rotateX(-Math.PI / 2); var p = g.attributes.position, u = g.attributes.uv;
    for (var i = 0; i < p.count; i++) { var x = p.getX(i) + (x0 + x1) / 2, z = p.getZ(i) + (z0 + z1) / 2; p.setXYZ(i, x, C.hgt(x, z) + lift, z); u.setXY(i, x / rep, z / rep); } g.computeVertexNormals();
    var m = new T.Mesh(g, mat); m.receiveShadow = true; m.userData.dyn = true; return m; }

  /* ===== LA VILLE ===== */
  var AV = [-150, -90, -30, 30, 90, 150], ST = [-120, -60, 0, 60, 120], OD = 162, RW = 12, SW = 4;
  function build(grp) { var y0 = C.hgt(0, 0);
    // chaussée (un grand plan) + trottoirs surélevés par îlot + bordures
    box(MATS.asph, 0, y0 + .02, 21, 312, .04, 306, 0, 8, 8);
    for (var i = 0; i < AV.length - 1; i++) for (var j = 0; j < ST.length; j++) { var x0 = AV[i] + RW / 2, x1 = AV[i + 1] - RW / 2, z0 = ST[j] + RW / 2, z1 = (j < ST.length - 1 ? ST[j + 1] : OD) - RW / 2;
      box(MATS.walk, (x0 + x1) / 2, y0 + .12, (z0 + z1) / 2, x1 - x0, .2, z1 - z0, 0, 3, 3); box(MATS.curb, (x0 + x1) / 2, y0 + .11, (z0 + z1) / 2, x1 - x0 + .3, .18, z1 - z0 + .3, 0); }
    // marquage : lignes jaunes au centre, pointillés blancs, passages piétons
    AV.forEach(function (ax) { for (var z = -150; z < OD + 4; z += 6) { if (ST.concat([OD]).some(function (s) { return Math.abs(z - s) < 9; })) continue; box(MATS.yline, ax - .12, y0 + .045, z, .1, .01, 4, 0); box(MATS.yline, ax + .12, y0 + .045, z, .1, .01, 4, 0); } });
    ST.concat([OD]).forEach(function (sz) { for (var x = -156; x < 156; x += 6) { if (AV.some(function (a) { return Math.abs(x - a) < 9; })) continue; box(MATS.line, x, y0 + .045, sz, 3, .01, .14, 0); } });
    AV.forEach(function (ax) { ST.concat([OD]).forEach(function (sz) { for (var k = -5; k <= 5; k++) { box(MATS.line, ax + k * 1.1, y0 + .046, sz - RW / 2 - 1.6, .55, .01, 2.6, 0); box(MATS.line, ax + k * 1.1, y0 + .046, sz + RW / 2 + 1.6, .55, .01, 2.6, 0); box(MATS.line, ax - RW / 2 - 1.6, y0 + .046, sz + k * 1.1, 2.6, .01, .55, 0); box(MATS.line, ax + RW / 2 + 1.6, y0 + .046, sz + k * 1.1, 2.6, .01, .55, 0); } }); });
    // feux tricolores aux carrefours
    AV.forEach(function (ax) { ST.forEach(function (sz) { [[1, 1], [-1, -1]].forEach(function (q) { var x = ax + q[0] * (RW / 2 + 1), z = sz + q[1] * (RW / 2 + 1); box(MATS.pole, x, y0 + 3, z, .2, 6, .2, 0); box(MATS.pole, x - q[0] * 3, y0 + 5.9, z, 6, .16, .16, 0); box(MATS.dark, x - q[0] * 5.6, y0 + 5.3, z, .5, 1.4, .45, 0); box(MATS.neon[4], x - q[0] * 5.6, y0 + 4.8, z + q[1] * .24, .25, .25, .05, 0); }); }); });
    // lampadaires le long des rues
    AV.forEach(function (ax) { for (var z = -110; z < OD; z += 26) { lamp(ax - RW / 2 - 1, z, Math.PI / 2); lamp(ax + RW / 2 + 1, z + 13, -Math.PI / 2); } });
    // FRONT DE MER (entre la rue z=120 et Ocean Drive) : hôtels art déco face à la mer
    var sd = 1; for (var b = 0; b < AV.length - 1; b++) { var xa = AV[b] + RW / 2 + SW, xb = AV[b + 1] - RW / 2 - SW, zc = (ST[4] + RW / 2 + OD - RW / 2) / 2, L = xb - xa, nH = 2;
      for (var k = 0; k < nH; k++) { var w = L / nH - 2, xc = xa + (k + .5) * (L / nH); hotel(xc, zc + 2, 0, w, 22, 4 + ((b * 2 + k) * 7 % 4), b * 2 + k + 1, grp); } }
    // centre-ville (au nord) : tours de verre
    var TW = [[-120, -90, 26, 22, 118], [-60, -90, 22, 22, 92], [0, -92, 30, 26, 138], [60, -90, 24, 20, 104], [120, -88, 22, 22, 78], [-120, -30, 22, 18, 66], [0, -32, 20, 20, 72], [120, -30, 24, 18, 86]];
    TW.forEach(function (q, k) { tower(q[0], q[1], 0, q[2], q[3], q[4], 31 + k); });
    // quartier du milieu : immeubles à balcons, boutiques, parc avec fontaine
    [[-60, -30], [60, -30]].forEach(function (q, k) { apartment(q[0] - 10, q[1], 0, 20, 16, 7 + k * 2, 70 + k); shops(q[0] + 14, q[1] + 8, 0, 12, 14, 80 + k); });
    [[-120, 30], [-60, 30], [60, 30], [120, 30], [-120, 90], [0, 90], [120, 90]].forEach(function (q, k) { apartment(q[0] - 9, q[1] - 6, 0, 18, 18, 4 + (k * 3) % 5, 90 + k); shops(q[0] + 12, q[1] + 10, 0, 14, 12, 100 + k); });
    // parc central (bloc 0,30 et -60,90 / 60,90) : pelouse, palmiers, fontaine
    [[0, 30], [-60, 90], [60, 90]].forEach(function (q, k) { box(MATS.grass, q[0], y0 + .24, q[1], 44, .06, 44, 0, 6, 6); for (var p = 0; p < 10; p++) { var a = p / 10 * 6.28; palm(q[0] + Math.cos(a) * 17, q[1] + Math.sin(a) * 17, 8 + (p % 3) * 2); }
      if (k === 0) { var fy = y0 + .25; box(MATS.white, q[0], fy + .4, q[1], 10, .8, 10, 0); box(MATS.water, q[0], fy + .75, q[1], 9, .1, 9, 0); box(MATS.white, q[0], fy + 1.8, q[1], 1.2, 2.6, 1.2, 0); box(MATS.neon[1], q[0], fy + 3.2, q[1], 1.6, .2, 1.6, 0); solid(q[0], q[1], 10, 10, 1); } });
    // OCEAN DRIVE : terre-plein de palmiers + promenade
    for (var x = -150; x <= 150; x += 12) { palm(x, OD, 10 + (Math.abs(x) % 3)); }
    box(MATS.walk, 0, y0 + .12, OD + RW / 2 + 4, 312, .2, 8, 0, 3, 3);
    // PLAGE : sable qui suit le terrain jusqu'à l'eau
    grp.add(terrainPlane(MATS.sand, -240, OD + RW / 2 + 8, 240, 250, 80, .04, 6));
    for (var u = 0; u < 22; u++) { var px = -140 + u * 13 + (u % 2) * 4, pz = OD + 28 + (u % 3) * 7; if (C.hgt(px, pz) > .3) parasol(px, pz, u, grp); }
    [-110, -20, 70, 140].forEach(function (lx, k) { var lz = OD + 44; if (C.hgt(lx, lz) > .2) { lifeguard(lx, lz, k); solid(lx, lz, 3.6, 3.6, 4.8); } });
    // PONTON + GRANDE ROUE
    var PX = 100, PZ0 = OD + 10, PZ1 = OD + 130; box(MATS.deck, PX, y0 + .9, (PZ0 + PZ1) / 2, 8, .3, PZ1 - PZ0, 0, 2, 2); for (var pz2 = PZ0; pz2 <= PZ1; pz2 += 8) [-1, 1].forEach(function (sd2) { box(MATS.dark, PX + sd2 * 3.6, y0 - 1.2, pz2, .4, 4.4, .4, 0); box(MATS.white, PX + sd2 * 3.9, y0 + 1.6, pz2, .1, 1.2, .1, 0); });
    [-1, 1].forEach(function (sd3) { box(MATS.white, PX + sd3 * 3.9, y0 + 2.2, (PZ0 + PZ1) / 2, .1, .1, PZ1 - PZ0, 0); });
    solid(PX, (PZ0 + PZ1) / 2, 8, PZ1 - PZ0, .3, y0 + .75);
    WHEEL = ferris(PX, y0 + 1, PZ1 - 14, grp);
    // marina (ouest) : yachts amarrés
    for (var yb = 0; yb < 5; yb++) yacht(-120 + yb * 14, OD + 75 + (yb % 2) * 6, Math.PI / 2 + (yb % 2) * .2, yb, grp);
    // places de parking le long des trottoirs (voitures de la ville)
    AV.forEach(function (ax) { for (var z = -105; z < 150; z += 22) { carSpot(ax - RW / 2 + 1.6, z, Math.PI / 2); carSpot(ax + RW / 2 - 1.6, z + 11, -Math.PI / 2); } });
    // nature autour : palmiers et buissons sur le reste de l'île
    var rr = rng(9); for (var n = 0; n < 160; n++) { var a = rr() * 6.283, d = 175 + rr() * 50, tx = Math.cos(a) * d, tz = Math.sin(a) * d; if (tz > OD - 10 || C.hgt(tx, tz) < .4) continue; palm(tx, tz, 7 + rr() * 6); }
    grp.add(terrainPlane(MATS.grass, -250, -260, 250, -150, 60, .015, 6)); [[-250, -150, -158, OD], [158, -150, 250, OD]].forEach(function (q) { grp.add(terrainPlane(MATS.grass, q[0], q[1], q[2], q[3], 40, .015, 6)); });
    SIGNS.forEach(function (m) { grp.add(m); }); flush(grp); }
  /* yacht : coque blanche, cabine vitrée */
  function yacht(x, z, ry, k, grp) { var y = -.2, L = 14 + (k % 3) * 3; box(MATS.white, x, y + .9, z, 4, 1.8, L, ry); box(MATS.white, x, y + 2.4, z, 3.2, 1.4, L * .55, ry); box(MATS.glassD, x, y + 2.5, z, 3.3, .7, L * .56, ry); box(MATS.white, x, y + 3.5, z, 2.4, .8, L * .3, ry); box(MATS.neon[1], x, y + 1.85, z, 4.05, .1, L + .05, ry); }
  /* grande roue : couronne, rayons, nacelles colorées, qui tourne lentement */
  var WHEEL = null;
  function ferris(x, y, z, grp) { var g = new T.Group(), Rr = 16, rim = new T.Mesh(new T.TorusGeometry(Rr, .25, 8, 64), MATS.metal), rim2 = rim.clone(); rim.position.z = -.8; rim2.position.z = .8; g.add(rim, rim2);
    var lights = new T.Mesh(new T.TorusGeometry(Rr + .3, .12, 6, 96), MATS.neon[0]); g.add(lights);
    for (var i = 0; i < 16; i++) { var a = i / 16 * Math.PI * 2, sp = new T.Mesh(new T.BoxGeometry(.12, Rr, .12), MATS.metal); sp.position.set(Math.cos(a) * Rr / 2, Math.sin(a) * Rr / 2, 0); sp.rotation.z = a - Math.PI / 2; g.add(sp);
      var cab = new T.Mesh(new T.BoxGeometry(1.6, 1.4, 1.4), MATS.pastel[i % 8]); cab.position.set(Math.cos(a) * Rr, Math.sin(a) * Rr - 1, 0); cab.userData.cab = 1; g.add(cab); }
    g.position.set(x, y + Rr + 2, z); g.rotation.y = Math.PI / 2; g.traverse(function (o) { o.castShadow = true; o.userData.dyn = true; }); grp.add(g);
    [-1, 1].forEach(function (sd) { var leg = new T.Mesh(new T.BoxGeometry(.5, Rr + 3, .5), MATS.metal); leg.position.set(x + sd * 1.2, y + (Rr + 2) / 2, z); leg.rotation.x = 0; leg.userData.dyn = true; grp.add(leg); });
    solid(x, z, 4, 4, Rr * 2 + 2, y); return g; }

  /* ---------- ENVIRONNEMENT (reflets) et lumière du coucher de soleil ---------- */
  function envFromSky(scene, sky) { try { var pm = new T.PMREMGenerator(R), sc = new T.Scene(), s2 = new T.Mesh(sky.geometry, sky.material); s2.scale.setScalar(900); sc.add(s2);
      var g = new T.Mesh(new T.PlaneGeometry(4000, 4000), new T.MeshBasicMaterial({ color: '#4a4036' })); g.rotation.x = -Math.PI / 2; g.position.y = -20; sc.add(g);
      ENV = pm.fromScene(sc, 0, .1, 2000).texture; pm.dispose(); } catch (e) { ENV = null; } }
  function loadHDR(url, done) { if (!T.RGBELoader) return; try { new T.RGBELoader().setDataType(T.UnsignedByteType).load(url, function (t) { try { var pm = new T.PMREMGenerator(R); pm.compileEquirectangularShader(); var e = pm.fromEquirectangular(t).texture; t.dispose(); pm.dispose(); done(e); } catch (x) {} }); } catch (e) {} }

  window.CITY6 = {
    spots: SPOTS, grid: { AV: AV, ST: ST.concat([OD]), RW: RW },
    build: function (THREE, ctx) { T = THREE; C = ctx; R = ctx.renderer; _m = new T.Matrix4(); _v = new T.Vector3(); _n = new T.Vector3(); _q = new T.Quaternion();
      if (ctx.sky) envFromSky(ctx.scene, ctx.sky); makeTextures(); makeMats(); var grp = new T.Group(); grp.userData.dyn = true; build(grp); ctx.scene.add(grp); this.grp = grp;
      if (ctx.scene && ENV) ctx.scene.environment = ENV;
      loadHDR('hdr/venice_sunset_1k.hdr', function (e) { ENV = e; ctx.scene.environment = e; grp.traverse(function (o) { if (o.material && o.material.isMeshStandardMaterial) { o.material.envMap = e; o.material.needsUpdate = true; } }); });
      return grp; },
    update: function (dt) { if (WHEEL) { WHEEL.rotation.z += dt * .06; WHEEL.children.forEach(function (o) { if (o.userData.cab) o.rotation.z = -WHEEL.rotation.z; }); } },
    /* ---- APPAREILS DU CRÉATIF : renvoient un groupe (déjà fusionné) + les murs de collision créés ---- */
    device: function (k, x, z, ry, seed, THREE, ctx) { if (!T) { T = THREE; C = ctx; R = ctx.renderer; _m = new T.Matrix4(); _v = new T.Vector3(); _n = new T.Vector3(); _q = new T.Quaternion(); makeTextures(); makeMats(); }
      var g = new T.Group(); g.userData.dyn = true; WALLS = []; SIGNS = [];
      if (k === 'hotel') hotel(x, z, ry || 0, 18, 18, 5, seed || 1, g); else if (k === 'tour') tower(x, z, ry || 0, 20, 18, 70 + (seed % 4) * 12, seed || 1); else if (k === 'immeuble') apartment(x, z, ry || 0, 18, 14, 6, seed || 1); else if (k === 'boutique') shops(x, z, ry || 0, 12, 10, seed || 1);
      else if (k === 'lampe') lamp(x, z, ry || 0); else if (k === 'parasol') parasol(x, z, seed || 0, g); else if (k === 'sauveteur') { lifeguard(x, z, seed || 0); solid(x, z, 3.6, 3.6, 4.8); }
      SIGNS.forEach(function (m) { g.add(m); }); flush(g); g.userData.walls = WALLS.slice(); return g; }
  };
})();
