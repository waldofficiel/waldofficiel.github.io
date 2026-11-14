/* Wald Royal : beaux arbres texturés (Quaternius « Ultimate Stylized Nature », CC0) dans jeu/models/trees/.
   - Sapins, chênes, bouleaux : modèles détaillés (branches en cartes de feuilles avec transparence) affichés autour de la caméra
     (rayon TREES3D.R selon les graphismes). Plus loin, ce sont les arbres simples d'avant (cachés dans le rayon par leur shader).
   - Palmiers du désert (positions données par props.js dans ctx.PALMS) et petits rochers moussus (à la place des cailloux gris).
   Tout est en InstancedMesh, avec le vent dans le vertex shader et une lumière d'appoint pour ne jamais avoir de noir. */
(function () {
  var T, C, U = null, READY = false, SETS = [], ROCKS = [], PALMSET = null, last = { x: 1e9, z: 1e9, r: -1 };
  var DIR = 'models/trees/';
  var SPEC = {
    pine: { m: ['PineTree_1', 'PineTree_2', 'PineTree_4', 'PineTree_5', 'PineTree_3'], leaf: 'PineTree_Leaves.png', bark: 'PineTree_Bark.jpg', k: 1.6, tint: '#a9c98f', bt: [2.6, 2.3, 2.1] },
    oak: { m: ['NormalTree_2', 'NormalTree_3', 'NormalTree_5'], leaf: 'NormalTree_Leaves.png', bark: 'NormalTree_Bark.jpg', k: 1.25, tint: '#c4dc9c', bt: [1.15, 1.1, 1.05] },
    birch: { m: ['BirchTree_1', 'BirchTree_4', 'BirchTree_5'], leaf: 'BirchTree_Leaves.png', bark: 'BirchTree_Bark.jpg', k: 1.3, tint: '#d2e4a2' },
    palm: { m: ['PalmTree_1', 'PalmTree_2', 'PalmTree_3', 'PalmTree_4'], leaf: 'PalmTree_Leaves.png', bark: 'PalmTree_Trunk.jpg', k: 1.6, tint: '#b8e07a', bt: [1.2, 1.1, 1] },
    rock: { m: ['Rock_1', 'Rock_2', 'Rock_3', 'Rock_4', 'Rock_5'], bark: 'Rocks.jpg', k: 1, tint: '#ffffff' }
  };
  var GEO = {}, TEXC = {};
  function tex(n) { if (TEXC[n]) return TEXC[n]; var t = new T.TextureLoader().load(DIR + n); t.encoding = T.sRGBEncoding; t.anisotropy = 4; if (/Bark|Trunk|Rocks/.test(n)) t.wrapS = t.wrapT = T.RepeatWrapping; return (TEXC[n] = t); }
  // matériau : texture + vent + lumière d'appoint ; lod = 1 → caché au-delà du rayon (les arbres simples prennent le relais)
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
  function prep(scene) {   // une géométrie par partie (écorce / feuilles), avec le poids du vent par sommet
    var out = {}, H = 0; scene.traverse(function (o) { if (o.isMesh) { o.geometry.computeBoundingBox(); H = Math.max(H, o.geometry.boundingBox.max.y); } });
    scene.traverse(function (o) { if (!o.isMesh) return; var g = o.geometry, p = g.attributes.position, n = p.count, sw = new Float32Array(n), leaf = /leaves/.test(o.name) || /leaves/.test(o.material.name);
      for (var i = 0; i < n; i++) { var y = p.getY(i), r = Math.hypot(p.getX(i), p.getZ(i)); sw[i] = Math.min(1, Math.max(0, (y - H * .15) / H)) * (leaf ? 1 : .6) + (leaf ? Math.min(.6, r * .12) : 0); }
      g.setAttribute('aSway', new T.BufferAttribute(sw, 1)); g.computeBoundingSphere(); out[leaf ? 'leaves' : 'bark'] = g; });
    out.H = H; return out;
  }
  function load(cb) {
    var L = new T.GLTFLoader(), names = [], left;
    Object.keys(SPEC).forEach(function (k) { if (k === 'palm' && !C.DES) return; if ((k === 'pine' || k === 'oak' || k === 'birch') && C.DES) return; SPEC[k].m.forEach(function (n) { names.push(n); }); });
    left = names.length; if (!left) { cb(); return; }
    names.forEach(function (n) { L.load(DIR + n + '.glb', function (g) { GEO[n] = prep(g.scene); if (--left === 0) cb(); }, null, function () { if (--left === 0) cb(); }); });
  }
  function mkIM(geo, m, cap, shadow, dm) { var im = new T.InstancedMesh(geo, m, Math.max(1, cap)); im.instanceColor = new T.InstancedBufferAttribute(new Float32Array(Math.max(1, cap) * 3).fill(1), 3); im.count = 0; im.frustumCulled = false; im.castShadow = !!shadow; im.receiveShadow = true; if (dm) im.customDepthMaterial = dm; im.instanceMatrix.setUsage(T.DynamicDrawUsage); im.userData.dyn = true; C.scene.add(im); return im; }
  var O3 = null, COL = null;
  function setT(o, it, sp, scale) { o.position.set(it.x, it.y + (it.sink || 0), it.z); o.rotation.set(0, it.rot, 0); o.scale.setScalar(scale); o.updateMatrix(); }
  /* ---- arbres détaillés autour de la caméra ---- */
  function buildTrees() {
    var list = C.trees || []; O3 = new T.Object3D(); COL = new T.Color();
    list.forEach(function (t, i) { var sp = t.kind === 'oak' ? 'oak' : t.kind === 'birch' ? 'birch' : 'pine', S = SPEC[sp], h = Math.abs(Math.sin(t.x * 12.9898 + t.z * 78.233) * 43758.5453) % 1;
      t.d3 = { sp: sp, mi: Math.floor(h * S.m.length) % S.m.length, rot: h * 6.283, sc: t.s * S.k * (t.dark ? 1.08 : 1) * (.9 + h * .25),
        col: t.dark ? [.42 + h * .1, .58 + h * .1, .56 + h * .08] : sp === 'pine' ? [.78 + h * .2, .88 + h * .12, .8 + h * .1] : [.85 + h * .15, .9 + h * .1, .8 + h * .15] }; });
    Object.keys(SPEC).forEach(function (sp) { if (sp === 'palm' || sp === 'rock') return; var S = SPEC[sp];
      S.m.forEach(function (n, mi) { var g = GEO[n]; if (!g) return; var cap = list.filter(function (t) { return t.d3.sp === sp && t.d3.mi === mi; }).length; if (!cap) return;
        var lt = tex(S.leaf), set = { sp: sp, mi: mi, list: [], leaves: null, bark: null };
        if (g.leaves) set.leaves = mkIM(g.leaves, mat(lt, true, true, S.tint), cap, true, depthMat(lt));
        if (g.bark) set.bark = mkIM(g.bark, mat(tex(S.bark), false, true, S.bt || '#ffffff'), cap, true);
        SETS.push(set); }); });
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
        if (s.leaves) { s.leaves.setMatrixAt(s.n, O3.matrix); s.leaves.setColorAt(s.n, COL); } if (s.bark) { s.bark.setMatrixAt(s.n, O3.matrix); s.bark.setColorAt(s.n, COL); } s.n++; break; } }
    SETS.forEach(function (s) { [s.leaves, s.bark].forEach(function (im) { if (!im) return; im.count = s.n; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; }); });
    U.uCam.value.set(cx, 0, cz); U.uR.value = r; return r;
  }
  /* ---- palmiers (désert) et petits rochers : posés une fois, toujours visibles ---- */
  function staticSet(sp, items, scaleFn, colFn, shadow) {
    var S = SPEC[sp], by = S.m.map(function () { return []; }); items.forEach(function (it, i) { by[i % S.m.length].push(it); });
    var o = new T.Object3D(), c = new T.Color(), out = [];
    S.m.forEach(function (n, mi) { var g = GEO[n], L = by[mi]; if (!g || !L.length) return;
      [['leaves', true], ['bark', false]].forEach(function (q) { if (!g[q[0]]) return; var lt = q[1] ? tex(S.leaf) : tex(S.bark), im = new T.InstancedMesh(g[q[0]], mat(lt, q[1], false, q[1] ? S.tint : S.bt || '#ffffff'), L.length); im.instanceColor = new T.InstancedBufferAttribute(new Float32Array(L.length * 3).fill(1), 3);
        L.forEach(function (it, k) { o.position.set(it.x, it.y + (it.sink || 0), it.z); o.rotation.set(it.rx || 0, it.a || 0, 0); var sc = scaleFn(it, g); if (typeof sc === 'number') o.scale.setScalar(sc); else o.scale.set(sc[0], sc[1], sc[2]); o.updateMatrix(); im.setMatrixAt(k, o.matrix); var cc = colFn(it, k); c.setRGB(cc[0], cc[1], cc[2]); im.setColorAt(k, c); });
        im.castShadow = !!shadow; im.receiveShadow = true; if (shadow && q[1]) im.customDepthMaterial = depthMat(lt); im.frustumCulled = false; C.scene.add(im); if (window.OPT) OPT.chunk(im, 160); out.push(im); }); });
    return out;
  }
  function buildPalms(P) { PALMSET = staticSet('palm', P, function (it, g) { return it.h / Math.max(3, g.H) * .95; }, function (it, k) { var h = (k * .37) % 1; return [.85 + h * .15, .95, .75 + h * .1]; }, true); }
  function buildRocks() {
    var P = C.pebbles || []; if (!P.length) return;
    ROCKS = staticSet('rock', P.map(function (p, i) { return { x: p.x, z: p.z, y: p.y, a: (i * 2.39) % 6.283, rx: ((i * .7) % 1 - .5) * .5, sink: -.12 * p.s, s: p.s }; }), function (it) { return [it.s * .55, it.s * .42, it.s * .55]; },
      function (it, k) { var h = (k * .618) % 1; return C.DES ? [1.6 + h * .2, 1.0 + h * .1, .6] : [.85 + h * .25, .95 + h * .2, .85 + h * .15]; }, false);
  }
  window.TREES3D = {
    R: 0, sets: SETS,
    build: function (THREE, ctx) { T = THREE; C = ctx; U = { uTime: ctx.uTime || { value: 0 }, uCam: ctx.uCam || { value: new T.Vector3() }, uR: ctx.uR || { value: 0 } };
      if (!T.GLTFLoader) return; load(function () { try { if (!C.DES) buildTrees(); buildRocks(); READY = true; if (C.onReady) C.onReady(); } catch (e) { console.error('TREES3D', e); } }); },
    ready: function () { return READY; },
    // appelé à chaque image : rayon des arbres détaillés selon les graphismes, et rechargement quand on s'est déplacé
    update: function (cx, cz, R, N, high) {
      if (!READY) return; var r = high ? Math.min(R, 40) : R;
      if (!PALMSET && C.palms && C.palms()) buildPalms(C.palms());
      if (!SETS.length) return;
      if ((cx - last.x) * (cx - last.x) + (cz - last.z) * (cz - last.z) > 64 || r !== last.r || N !== last.n) { last.x = cx; last.z = cz; last.r = r; last.n = N; this.R = fill(cx, cz, r, N); }
    },
    rocks: function () { return ROCKS; }
  };
})();
