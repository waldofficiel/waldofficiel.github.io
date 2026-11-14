/* Wald Royal : toute la végétation en vrais modèles 3D libres (Quaternius « Ultimate Stylized Nature », CC0) dans jeu/models/trees/.
   - Sapins, chênes, bouleaux, érables rouges : modèles détaillés (branches en cartes de feuilles) pour les N arbres les plus proches ;
     plus loin, des IMPOSTEURS : une image de chaque modèle, rendue au chargement, sur un panneau qui se tourne vers la caméra.
   - Palmiers et arbres morts du désert, arbres des villes (window.EXT_TREES), buissons, fleurs autour du joueur, petits rochers moussus.
   Tout est en InstancedMesh, avec le vent dans le vertex shader et une lumière d'appoint pour ne jamais avoir de noir. */
(function () {
  var T, C, U = null, READY = false, SETS = [], FAR = [], ROCKS = [], PALMSET = null, DEADSET = null, FLOWERS = [], last = { x: 1e9, z: 1e9, r: -1, n: -1 };
  var DIR = 'models/trees/';
  var SPEC = {
    pine: { m: ['PineTree_1', 'PineTree_2', 'PineTree_4', 'PineTree_5', 'PineTree_3'], leaf: 'PineTree_Leaves.png', bark: 'PineTree_Bark.jpg', k: 1.6, tint: '#a9c98f', bt: [2.6, 2.3, 2.1] },
    oak: { m: ['NormalTree_2', 'NormalTree_3', 'NormalTree_5'], leaf: 'NormalTree_Leaves.png', bark: 'NormalTree_Bark.jpg', k: 1.25, tint: '#c4dc9c', bt: [1.15, 1.1, 1.05] },
    birch: { m: ['BirchTree_1', 'BirchTree_4', 'BirchTree_5'], leaf: 'BirchTree_Leaves.png', bark: 'BirchTree_Bark.jpg', k: 1.3, tint: '#d2e4a2' },
    maple: { m: ['MapleTree_2', 'MapleTree_5', 'MapleTree_4'], leaf: 'MapleTree_Leaves.png', bark: 'MapleTree_Bark.jpg', k: 1.2, tint: '#ffffff', bt: [1.2, 1.1, 1.05] },
    palm: { m: ['PalmTree_1', 'PalmTree_2', 'PalmTree_3', 'PalmTree_4'], leaf: 'PalmTree_Leaves.png', bark: 'PalmTree_Trunk.jpg', k: 1.6, tint: '#b8e07a', bt: [1.2, 1.1, 1] },
    dead: { m: ['DeadTree_1', 'DeadTree_3', 'DeadTree_5'], bark: 'NormalTree_Bark.jpg', k: 1.1, bt: [1.3, 1.15, 1] },
    bush: { m: ['Bush', 'Bush_Large', 'Bush_Small', 'Bush_Flowers', 'Bush_Large_Flowers'], leaf: 'Bush_Leaves.png', flo: 'Flowers.png', k: 1, tint: '#b6d68e' },
    flower: { m: ['Flower_2_Clump', 'Flower_3_Clump', 'Flower_4_Clump', 'Flower_5_Clump', 'Plant_Flowers'], flo: 'Flowers.png', k: 1, tint: '#ffffff' },
    rock: { m: ['Rock_1', 'Rock_2', 'Rock_3', 'Rock_4', 'Rock_5'], bark: 'Rocks.jpg', k: 1, tint: '#ffffff' }
  };
  var BIG = ['pine', 'oak', 'birch', 'maple'];
  var GEO = {}, TEXC = {};
  function tex(n, done) { if (TEXC[n]) { if (done) done(); return TEXC[n]; } var t = new T.TextureLoader().load(DIR + n, done, null, done); t.encoding = T.sRGBEncoding; t.anisotropy = 4; if (/Bark|Trunk|Rocks/.test(n)) t.wrapS = t.wrapT = T.RepeatWrapping; return (TEXC[n] = t); }
  // matériau : texture + vent + lumière d'appoint ; lod → caché au-delà du rayon des arbres détaillés
  function mat(map, leaf, lod, tint) {
    var m = new T.MeshLambertMaterial({ map: map, color: typeof tint === 'string' ? tint : '#ffffff', alphaTest: leaf ? .42 : 0, side: leaf ? T.DoubleSide : T.FrontSide });
    if (Array.isArray(tint)) m.color.setRGB(tint[0], tint[1], tint[2]);
    m.onBeforeCompile = function (sh) {
      sh.uniforms.uTime = U.uTime; sh.uniforms.uCam = U.uCam; sh.uniforms.uR = U.uR;
      sh.vertexShader = 'uniform float uTime; uniform vec3 uCam; uniform float uR; attribute float aSway;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' +
        ' vec3 ip = vec3(instanceMatrix[3][0], 0., instanceMatrix[3][2]); float ph = ip.x * .07 + ip.z * .05;\n' +
        ' transformed.x += (sin(uTime * 1.3 + ph) * .5 + sin(uTime * 2.7 + ph * 3.) * .2) * aSway * .22; transformed.z += sin(uTime * 1.7 + ph * 1.3) * aSway * .14;\n' +
        (leaf ? ' transformed += normal * sin(uTime * 4. + position.y * 3. + ph) * aSway * .025;\n' : '') +
        (lod ? ' vec2 dd = ip.xz - uCam.xz; if (dot(dd, dd) > uR * uR) transformed = vec3(0.);\n' : ''));
      sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * ' + (leaf ? '.42' : '.3') + ';');
    };
    m.customProgramCacheKey = function () { return 'tree' + (leaf ? 'L' : 'B') + (lod ? 'D' : ''); };
    return m;
  }
  function depthMat(map) { return new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map: map, alphaTest: .42 }); }
  function prep(scene) {   // une géométrie par partie (écorce / feuilles / fleurs), avec le poids du vent par sommet
    var out = {}, H = 0, W = 0; scene.traverse(function (o) { if (o.isMesh) { o.geometry.computeBoundingBox(); var b = o.geometry.boundingBox; H = Math.max(H, b.max.y); W = Math.max(W, -b.min.x, b.max.x, -b.min.z, b.max.z); } });
    scene.traverse(function (o) { if (!o.isMesh) return; var g = o.geometry, p = g.attributes.position, n = p.count, sw = new Float32Array(n), key = /flowers/.test(o.name) ? 'flowers' : /leaves/.test(o.name) ? 'leaves' : 'bark', soft = key !== 'bark';
      for (var i = 0; i < n; i++) { var y = p.getY(i), r = Math.hypot(p.getX(i), p.getZ(i)); sw[i] = Math.min(1, Math.max(0, (y - H * .15) / H)) * (soft ? 1 : .6) + (soft ? Math.min(.6, r * .12) : 0); }
      g.setAttribute('aSway', new T.BufferAttribute(sw, 1)); g.computeBoundingSphere(); out[key] = g; });
    out.H = H; out.W = W; return out;
  }
  function load(cb) {
    var L = new T.GLTFLoader(), names = [], left;
    var want = C.DES ? ['palm', 'dead', 'rock'] : ['pine', 'oak', 'birch', 'maple', 'bush', 'flower', 'rock'];
    (window.EXT_TREES || []).forEach(function (e) { if (want.indexOf(e.sp) < 0 && SPEC[e.sp]) want.push(e.sp); });   // les arbres des villes
    want.forEach(function (k) { SPEC[k].m.forEach(function (n) { names.push(n); }); });
    var tx = []; want.forEach(function (k) { ['leaf', 'bark', 'flo'].forEach(function (f) { if (SPEC[k][f] && tx.indexOf(SPEC[k][f]) < 0) tx.push(SPEC[k][f]); }); });
    left = names.length + tx.length;   // on attend aussi les textures : les imposteurs sont photographiés juste après
    tx.forEach(function (n) { tex(n, function () { if (--left === 0) cb(); }); });
    names.forEach(function (n) { L.load(DIR + n + '.glb', function (g) { GEO[n] = prep(g.scene); if (--left === 0) cb(); }, null, function () { if (--left === 0) cb(); }); });
  }
  function parts(S, g) {   // [clé, géométrie, texture, carte transparente ?, teinte]
    var o = []; if (g.leaves && S.leaf) o.push(['leaves', g.leaves, tex(S.leaf), true, S.tint]); if (g.flowers && S.flo) o.push(['flowers', g.flowers, tex(S.flo), true, '#ffffff']); if (g.bark && S.bark) o.push(['bark', g.bark, tex(S.bark), false, S.bt || '#ffffff']); return o;
  }
  function newIM(geo, m, cap) { var im = new T.InstancedMesh(geo, m, Math.max(1, cap)); im.instanceColor = new T.InstancedBufferAttribute(new Float32Array(Math.max(1, cap) * 3).fill(1), 3); im.receiveShadow = true; im.frustumCulled = false; im.userData.dyn = true; return im; }
  var O3 = null, COL = null;
  function h01(x, z) { return Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1; }

  /* ---- grands arbres : détaillés près de la caméra, imposteurs au loin ---- */
  function buildTrees() {
    var list = C.trees || []; O3 = new T.Object3D(); COL = new T.Color();
    list.forEach(function (t) { var h = h01(t.x, t.z), sp = t.kind === 'oak' ? 'oak' : t.kind === 'birch' ? 'birch' : 'pine';
      if ((sp === 'oak' || sp === 'birch') && h01(t.z * 1.7, t.x) < .22) sp = 'maple';   // quelques érables rouges pour la couleur
      var S = SPEC[sp]; t.d3 = { sp: sp, mi: Math.floor(h * S.m.length) % S.m.length, rot: h * 6.283, sc: t.s * S.k * (t.dark ? 1.08 : 1) * (.9 + h * .25),
        col: t.dark ? [.42 + h * .1, .58 + h * .1, .56 + h * .08] : sp === 'pine' ? [.78 + h * .2, .88 + h * .12, .8 + h * .1] : [.85 + h * .15, .9 + h * .1, .8 + h * .15] }; });
    BIG.forEach(function (sp) { var S = SPEC[sp];
      S.m.forEach(function (n, mi) { var g = GEO[n]; if (!g) return; var mine = list.filter(function (t) { return t.d3.sp === sp && t.d3.mi === mi; }); if (!mine.length) return;
        var set = { sp: sp, mi: mi, ims: [] };
        parts(S, g).forEach(function (q) { var im = newIM(q[1], mat(q[2], q[3], true, q[4]), mine.length); im.count = 0; im.castShadow = true; if (q[3]) im.customDepthMaterial = depthMat(q[2]); im.instanceMatrix.setUsage(T.DynamicDrawUsage); C.scene.add(im); set.ims.push(im); });
        SETS.push(set);
        var imp = impostor(n, S); if (imp) FAR.push(farIM(imp, mine)); }); });
  }
  // imposteur : on photographie le modèle de face (lumière du jeu) dans une petite texture, une fois pour toutes
  function impostor(n, S) {
    var R = C.renderer, g = GEO[n]; if (!R || !g) return null;
    var Wd = g.W * 2.1, Hd = g.H * 1.04, tw = 128, th = Math.max(128, Math.min(256, Math.round(128 * Hd / Wd / 32) * 32));
    var sc = new T.Scene(), cam = new T.OrthographicCamera(-Wd / 2, Wd / 2, Hd, 0, -50, 50); cam.position.set(0, 0, 10); cam.lookAt(0, 0, 0);
    sc.add(new T.HemisphereLight('#dfeeff', '#4a6a34', 1.0)); var dl = new T.DirectionalLight('#fff4e0', 1.5); dl.position.set(.4, 1, .8); sc.add(dl);
    parts(S, g).forEach(function (q) { var m = new T.MeshLambertMaterial({ map: q[2], alphaTest: q[3] ? .42 : 0, side: T.DoubleSide, color: typeof q[4] === 'string' ? q[4] : '#ffffff' }); if (Array.isArray(q[4])) m.color.setRGB(q[4][0], q[4][1], q[4][2]); sc.add(new T.Mesh(q[1], m)); });
    var rt = new T.WebGLRenderTarget(tw, th);
    var oldRT = R.getRenderTarget(), oldC = R.getClearColor(new T.Color()), oldA = R.getClearAlpha(), tm = R.toneMapping, oe = R.outputEncoding;
    R.toneMapping = T.NoToneMapping; R.outputEncoding = T.LinearEncoding; R.setRenderTarget(rt); R.setClearColor(0x405030, 0); R.clear(); R.render(sc, cam);
    R.setRenderTarget(oldRT); R.setClearColor(oldC, oldA); R.toneMapping = tm; R.outputEncoding = oe;
    return { tex: rt.texture, rt: rt, W: Wd, H: Hd };
  }
  function farIM(imp, mine) {   // panneau qui pivote vers la caméra (autour de la verticale), caché dans le rayon des arbres détaillés
    var geo = new T.PlaneGeometry(imp.W, imp.H); geo.translate(0, imp.H / 2, 0);
    var m = new T.MeshBasicMaterial({ map: imp.tex, alphaTest: .5, side: T.DoubleSide });
    m.onBeforeCompile = function (sh) { sh.uniforms.uCam = U.uCam; sh.uniforms.uR = U.uR;
      sh.vertexShader = 'uniform vec3 uCam; uniform float uR;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' +
        ' vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]); vec2 tc = cameraPosition.xz - ip.xz; float tl = max(length(tc), .001); tc /= tl;\n' +
        ' transformed = vec3(-tc.y * position.x, position.y, tc.x * position.x);\n' +
        ' vec2 dd = ip.xz - uCam.xz; if (dot(dd, dd) < uR * uR) transformed = vec3(0.);'); };
    m.customProgramCacheKey = function () { return 'treeFar'; };
    var im = newIM(geo, m, mine.length), o = new T.Object3D(), c = new T.Color();
    mine.forEach(function (t, k) { o.position.set(t.x, t.y + .05, t.z); o.rotation.set(0, 0, 0); o.scale.setScalar(t.d3.sc); o.updateMatrix(); im.setMatrixAt(k, o.matrix); c.setRGB(t.d3.col[0], t.d3.col[1], t.d3.col[2]); im.setColorAt(k, c); });
    im.castShadow = false; im.userData.dyn = false; im.userData.rt = imp.rt; C.scene.add(im); if (window.OPT) OPT.chunk(im, 200); return im;
  }
  function fill(cx, cz, R, N) {   // les N arbres les plus proches (dans le rayon R) passent en détaillé ; le rayon s'adapte si la forêt est dense
    SETS.forEach(function (s) { s.n = 0; });
    var list = C.trees || [], R2 = R * R, cand = [];
    for (var i = 0; i < list.length; i++) { var t = list[i], dx = t.x - cx, dz = t.z - cz, d2 = dx * dx + dz * dz; if (d2 < R2) cand.push([d2, t]); }
    cand.sort(function (a, b) { return a[0] - b[0]; });
    var r = R; if (cand.length > N) { r = Math.sqrt(cand[N][0]) - .01; cand.length = N; }
    for (i = 0; i < cand.length; i++) { var t2 = cand[i][1], d = t2.d3;
      for (var k = 0; k < SETS.length; k++) { var s = SETS[k]; if (s.sp !== d.sp || s.mi !== d.mi) continue;
        O3.position.set(t2.x, t2.y + .05, t2.z); O3.rotation.set(0, d.rot, 0); O3.scale.setScalar(d.sc); O3.updateMatrix(); COL.setRGB(d.col[0], d.col[1], d.col[2]);
        s.ims.forEach(function (im) { im.setMatrixAt(s.n, O3.matrix); im.setColorAt(s.n, COL); }); s.n++; break; } }
    SETS.forEach(function (s) { s.ims.forEach(function (im) { im.count = s.n; im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; }); });
    U.uCam.value.set(cx, 0, cz); U.uR.value = r; return r;
  }

  /* ---- ensembles fixes : palmiers, arbres morts, arbres des villes, buissons, rochers ---- */
  function staticSet(sp, items, scaleFn, colFn, shadow, cell) {
    var S = SPEC[sp], by = S.m.map(function () { return []; }); items.forEach(function (it, i) { by[it.mi != null ? it.mi % S.m.length : i % S.m.length].push(it); });
    var o = new T.Object3D(), c = new T.Color(), out = [];
    S.m.forEach(function (n, mi) { var g = GEO[n], L = by[mi]; if (!g || !L.length) return;
      parts(S, g).forEach(function (q) { var im = newIM(q[1], mat(q[2], q[3], false, q[4]), L.length);
        L.forEach(function (it, k) { o.position.set(it.x, it.y + (it.sink || 0), it.z); o.rotation.set(it.rx || 0, it.a || 0, 0); var sc = scaleFn(it, g); if (typeof sc === 'number') o.scale.setScalar(sc); else o.scale.set(sc[0], sc[1], sc[2]); o.updateMatrix(); im.setMatrixAt(k, o.matrix); var cc = colFn(it, k); c.setRGB(cc[0], cc[1], cc[2]); im.setColorAt(k, c); });
        im.castShadow = !!shadow; if (shadow && q[3]) im.customDepthMaterial = depthMat(q[2]); im.userData.dyn = false; C.scene.add(im); if (window.OPT) OPT.chunk(im, cell || 160); out.push(im); }); });
    return out;
  }
  function buildExtra(E) {   // décor posé par props.js : palmiers, arbres morts, buissons et fleurs des prés
    PALMSET = [];
    ['palm', 'dead', 'bush', 'flower'].forEach(function (sp) { var L = E.filter(function (e) { return e.sp === sp; }); if (!L.length || !GEO[SPEC[sp].m[0]]) return;
      PALMSET = PALMSET.concat(staticSet(sp, L, function (it, g) { return it.h / Math.max(sp === 'flower' ? .4 : sp === 'bush' ? .5 : 2, g.H) * (sp === 'palm' ? .95 : 1); }, function (it, k) { var h = (k * .37) % 1; return sp === 'palm' ? [.85 + h * .15, .95, .75 + h * .1] : sp === 'dead' ? [.9 + h * .2, .85 + h * .1, .75] : [.85 + h * .2, .92 + h * .1, .82 + h * .1]; }, sp === 'palm' || sp === 'dead')); });
  }
  function buildPalms(P) { PALMSET = staticSet('palm', P, function (it, g) { return it.h / Math.max(3, g.H) * .95; }, function (it, k) { var h = (k * .37) % 1; return [.85 + h * .15, .95, .75 + h * .1]; }, true); }
  function buildDead(P) { DEADSET = staticSet('dead', P, function (it, g) { return it.h / Math.max(2, g.H); }, function (it, k) { var h = (k * .53) % 1; return [.9 + h * .2, .85 + h * .1, .75]; }, true); }
  function buildCity() {   // arbres des villes (bacs de la place, palmiers des villas) posés par city.js dans window.EXT_TREES
    var E = window.EXT_TREES || []; if (!E.length) return;
    ['oak', 'birch', 'maple', 'palm', 'pine', 'bush', 'flower'].forEach(function (sp) { var L = E.filter(function (e) { return e.sp === sp; }); if (L.length && GEO[SPEC[sp].m[0]]) staticSet(sp, L, function (it, g) { return it.h / Math.max(2, g.H); }, function () { return [1, 1, 1]; }, true); });
  }
  function buildBushes() {
    var B = C.bushes || []; if (!B.length) return;
    staticSet('bush', B.map(function (b) { var h = h01(b.x, b.z); return { x: b.x, z: b.z, y: b.y, a: b.a, s: b.s, mi: h < .35 ? 0 : h < .55 ? 1 : h < .7 ? 2 : h < .87 ? 3 : 4, sink: -.06 }; }),
      function (it) { return it.s * 1.15; }, function (it, k) { var h = (k * .618) % 1; return [.8 + h * .25, .9 + h * .15, .78 + h * .12]; }, false, 120);
  }
  function buildRocks() {
    var P = C.pebbles || []; if (!P.length) return;
    ROCKS = staticSet('rock', P.map(function (p, i) { return { x: p.x, z: p.z, y: p.y, a: (i * 2.39) % 6.283, rx: ((i * .7) % 1 - .5) * .5, sink: -.12 * p.s, s: p.s }; }), function (it) { return [it.s * .55, it.s * .42, it.s * .55]; },
      function (it, k) { var h = (k * .618) % 1; return C.DES ? [1.6 + h * .2, 1.0 + h * .1, .6] : [.85 + h * .25, .95 + h * .2, .85 + h * .15]; }, false);
  }
  function buildFlowers() {   // fleurs autour du joueur : 5 sortes de touffes, remplies par index.html (placeGrass)
    if (C.DES) return; var S = SPEC.flower;
    S.m.forEach(function (n) { var g = GEO[n]; if (!g) return; var ims = parts(S, g).map(function (q) { var im = newIM(q[1], mat(q[2], q[3], false, q[4]), 140); im.count = 0; im.instanceMatrix.setUsage(T.DynamicDrawUsage); C.scene.add(im); return im; }); if (ims.length) FLOWERS.push(ims); });
  }
  window.TREES3D = {
    R: 0, sets: SETS, far: FAR,
    build: function (THREE, ctx) { T = THREE; C = ctx; U = { uTime: ctx.uTime || { value: 0 }, uCam: ctx.uCam || { value: new T.Vector3() }, uR: ctx.uR || { value: 0 } };
      if (!T.GLTFLoader) return;
      load(function () { try { if (!C.DES) { buildTrees(); buildBushes(); buildFlowers(); } buildRocks(); buildCity(); READY = true; if (C.onReady) C.onReady(); } catch (e) { console.error('TREES3D', e); } }); },
    ready: function () { return READY; },
    hasFar: function () { return FAR.length > 0; },
    // appelé à chaque image : rayon des arbres détaillés selon les graphismes, et rechargement quand on s'est déplacé
    update: function (cx, cz, R, N, high) {
      if (!READY) return; var r = high ? Math.min(R, 40) : R;
      if (!PALMSET && C.extra && C.extra()) buildExtra(C.extra());
      if (!SETS.length) return;
      if ((cx - last.x) * (cx - last.x) + (cz - last.z) * (cz - last.z) > 64 || r !== last.r || N !== last.n) { last.x = cx; last.z = cz; last.r = r; last.n = N; this.R = fill(cx, cz, r, N); }
    },
    // fleurs : index.html donne les matrices des emplacements, on les répartit entre les 5 sortes
    flowers: function (mats) { if (!FLOWERS.length) return false; var n = FLOWERS.map(function () { return 0; });
      mats.forEach(function (m, i) { var k = i % FLOWERS.length, ims = FLOWERS[k]; if (n[k] >= ims[0].instanceMatrix.count) return; ims.forEach(function (im) { im.setMatrixAt(n[k], m); }); n[k]++; });
      FLOWERS.forEach(function (ims, k) { ims.forEach(function (im) { im.count = n[k]; im.instanceMatrix.needsUpdate = true; }); }); return true; },
    flowerVis: function (v) { FLOWERS.forEach(function (ims) { ims.forEach(function (im) { im.visible = v; }); }); },
    rocks: function () { return ROCKS; }
  };
})();
