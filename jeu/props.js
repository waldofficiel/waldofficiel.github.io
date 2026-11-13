/* Wald Royal — décor naturel en 3D (Kenney Nature Kit, CC0) : rochers, falaises, souches, troncs, champignons, fleurs, nénuphars,
   campements, ruines, cactus et palmiers. Tout est fusionné par zones de 150 m en meshes à couleurs de sommets (1 appel de dessin par zone),
   cachés au-delà de 320 m. Les gros rochers ont une collision (PEBS). PROPS.build(THREE, ctx). */
(function () {
  var T, ctx, TPL = {}, ITEMS = [], MESHES = [];
  function rng(s) { return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
  function load(names, done) {
    var L = new T.GLTFLoader(), left = names.length;
    names.forEach(function (nm) { L.load('models/nature/' + nm + '.glb', function (gl) {
        var s = gl.scene; s.updateMatrixWorld(true); var b = new T.Box3().setFromObject(s), c = b.getCenter(new T.Vector3()), sz = b.getSize(new T.Vector3()), off = new T.Matrix4().makeTranslation(-c.x, -b.min.y, -c.z), parts = [];
        s.traverse(function (o) { if (!o.isMesh) return; var mats = Array.isArray(o.material) ? o.material : [o.material], m = new T.Matrix4().multiplyMatrices(off, o.matrixWorld);
          if (mats.length > 1 && o.geometry.groups.length) { var gn = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry; gn.groups.forEach(function (gr) { var sub = new T.BufferGeometry(); ['position', 'normal'].forEach(function (a) { var A = gn.attributes[a]; if (A) sub.setAttribute(a, new T.BufferAttribute(A.array.slice(gr.start * 3, (gr.start + gr.count) * 3), 3)); }); parts.push({ g: sub, m: m, c: mats[gr.materialIndex].color.clone() }); }); }
          else parts.push({ g: o.geometry, m: m, c: mats[0].color.clone() }); });
        parts.forEach(function (p) { var c2 = p.c; c2.r = Math.pow(c2.r, 1.25); c2.g = Math.pow(c2.g, 1.25); c2.b = Math.pow(c2.b, 1.25); });   // un peu plus franc, comme le reste du jeu
        TPL[nm] = { parts: parts, s: sz }; if (--left === 0) done(); }, undefined, function () { if (--left === 0) done(); }); });
  }
  // pose un modèle : h = hauteur voulue en mètres (l'échelle est calculée), tint = couleur multipliée
  function put(nm, x, z, h, ry, tint, sink) { var t = TPL[nm]; if (!t) return null; if (/^plant_bush|^grass/.test(nm)) tint = tint || '#e2f07a'; var s = h / Math.max(.05, t.s.y), y = ctx.hgt(x, z) - (sink || 0) * h; var it = { n: nm, x: x, y: y, z: z, s: s, ry: ry, tint: tint }; ITEMS.push(it); return it; }
  function free(x, z, m) { if (!ctx.onLand(x, z) || ctx.inTown(x, z, m) || ctx.nearRoad(x, z, m + 5)) return false;
    for (var i = 0; i < ctx.HOUSES.length; i++) { var h = ctx.HOUSES[i]; if (Math.abs(h.x - x) < h.hx + m && Math.abs(h.z - z) < h.hz + m) return false; }
    if (ctx.inField && ctx.inField(x, z, 3)) return false; return true; }
  function slope(x, z) { return Math.abs(ctx.hgt(x + 3, z) - ctx.hgt(x - 3, z)) + Math.abs(ctx.hgt(x, z + 3) - ctx.hgt(x, z - 3)); }
  function nearTree(x, z, d) { var T2 = ctx.TREES || []; for (var i = 0; i < T2.length; i++) if (Math.abs(T2[i].x - x) < d && Math.abs(T2[i].z - z) < d) return true; return false; }

  function place() {
    var r = rng(ctx.DES ? 777 : 555), DES = ctx.DES, R = ctx.ISLM, pick = function (a) { return a[r() * a.length | 0]; };
    var RT = DES ? '#e8905a' : null, ST = DES ? '#f0b07a' : null;   // dans le désert, la roche est rouge orangé
    function rand(m) { for (var k = 0; k < 40; k++) { var a = r() * 6.283, d = 25 + r() * (R - 30), x = Math.cos(a) * d, z = Math.sin(a) * d; if (free(x, z, m)) return [x, z]; } return null; }
    // 1) gros rochers et aiguilles rocheuses, plus nombreux sur les pentes et en montagne
    for (var n = 0; n < (DES ? 110 : 85); n++) { var p = rand(8); if (!p) continue; if (slope(p[0], p[1]) < (DES ? .8 : 1.6) && r() < .6) continue;
      var big = r() < .45, h = big ? 4 + r() * 6 : 2.2 + r() * 2.5, nm = big ? pick(['rock_tallA', 'rock_tallB', 'rock_tallC', 'rock_tallD', 'rock_tallE', 'rock_tallF', 'rock_tallG', 'rock_tallH']) : pick(['rock_largeA', 'rock_largeB', 'rock_largeC', 'rock_largeD', 'rock_largeE', 'rock_largeF']);
      var it = put(nm, p[0], p[1], h, r() * 6.283, RT, .12); if (it) ctx.PEBS.push({ x: p[0], z: p[1], y: it.y, r: Math.max(TPL[nm].s.x, TPL[nm].s.z) * it.s * .38, h: h * .9 });
      for (var k = 0; k < 3; k++) { var x2 = p[0] + (r() - .5) * 9, z2 = p[1] + (r() - .5) * 9; if (free(x2, z2, 4)) put(pick(['stone_smallA', 'stone_smallB', 'stone_smallC', 'stone_smallFlatA', 'stone_largeA', 'stone_largeB']), x2, z2, .4 + r() * .8, r() * 6.283, ST); } }
    if (!DES) {
      // 2) sous-bois : souches, troncs couchés, tas de bûches, champignons, mousse
      (ctx.TREES || []).forEach(function (t, i) { if (t.rock || r() > .5) return; var a = r() * 6.283, d = 2.5 + r() * 3, x = t.x + Math.cos(a) * d, z = t.z + Math.sin(a) * d; if (!free(x, z, 2)) return; var q = r();
        if (q < .25) put(pick(['stump_old', 'stump_oldTall', 'stump_roundDetailed', 'stump_squareDetailed']), x, z, .7 + r() * .5, r() * 6.283);
        else if (q < .38) { var it2 = put(pick(['log', 'log_large']), x, z, .55, r() * 6.283); }
        else if (q < .44) put(pick(['log_stack', 'log_stackLarge']), x, z, 1.1, r() * 6.283);
        else if (q < .8) put(pick(['mushroom_redGroup', 'mushroom_tanGroup', 'mushroom_red', 'mushroom_tan', 'mushroom_redTall', 'mushroom_tanTall']), x, z, .45 + r() * .5, r() * 6.283);
        else put(pick(['plant_bushDetailed', 'plant_bushLarge', 'plant_bush']), x, z, 1 + r() * .6, r() * 6.283); });
      // 3) prés fleuris
      for (n = 0; n < 70; n++) { p = rand(5); if (!p || nearTree(p[0], p[1], 5) || slope(p[0], p[1]) > 2) continue; var fl = pick([['flower_purpleA', 'flower_purpleC'], ['flower_redA', 'flower_redC'], ['flower_yellowA', 'flower_yellowC']]);
        for (k = 0; k < 9; k++) { x2 = p[0] + (r() - .5) * 7; z2 = p[1] + (r() - .5) * 7; if (free(x2, z2, 2)) put(pick(fl), x2, z2, .45 + r() * .35, r() * 6.283); } }
      // 4) le lac : nénuphars, canoës, petit camping avec feu de camp
      if (ctx.LAKE) { var Lk = ctx.LAKE;
        for (n = 0; n < 46; n++) { var a = r() * 6.283, d = r() * (Lk[2] - 6), x = Lk[0] + Math.cos(a) * d, z = Lk[1] + Math.sin(a) * d, t2 = TPL[n % 3 ? 'lily_small' : 'lily_large']; if (!t2) continue; ITEMS.push({ n: n % 3 ? 'lily_small' : 'lily_large', x: x, y: -.72, z: z, s: (n % 3 ? 1.1 : 1.8) / Math.max(t2.s.x, t2.s.z), ry: r() * 6.283 }); }
        [[.3, 1], [.36, 1]].forEach(function (q, i) { var a2 = q[0] * 6.283 + i * .12, d2 = Lk[2] + 3, x3 = Lk[0] + Math.cos(a2) * d2, z3 = Lk[1] + Math.sin(a2) * d2; put('canoe', x3, z3, .55, a2 + 1.57); put('canoe_paddle', x3 + 1.2, z3 + .6, .12, a2); });
        var ca = 2.4, cx = Lk[0] + Math.cos(ca) * (Lk[2] + 14), cz = Lk[1] + Math.sin(ca) * (Lk[2] + 14);
        if (free(cx, cz, 3)) { put('campfire_stones', cx, cz, .5, 0); put('tent_detailedOpen', cx + 4, cz - 3, 2.4, -.8); put('tent_smallOpen', cx - 4.5, cz - 2.5, 1.8, .9); put('log', cx, cz + 2.6, .5, 0); put('log', cx + 2.6, cz + .4, .5, 1.57); ctx.FIRES && ctx.FIRES.push([cx, ctx.hgt(cx, cz), cz]); } }
      // 4b) forêt sombre : rochers moussus, troncs couchés, souches, champignons, cercle de pierres, lucioles
      if (ctx.DARKF) { var DF = ctx.DARKF;
        for (n = 0; n < 160; n++) { var a6 = r() * 6.283, d6 = Math.sqrt(r()) * DF[2], x8 = DF[0] + Math.cos(a6) * d6, z8 = DF[1] + Math.sin(a6) * d6; if (!free(x8, z8, 2.5)) continue; var q2 = r();
          if (q2 < .2) { var it3 = put(pick(['rock_largeA', 'rock_largeB', 'rock_largeC', 'rock_largeE']), x8, z8, 1.8 + r() * 2.2, r() * 6.283, '#9a9a80', .1); if (it3) ctx.PEBS.push({ x: x8, z: z8, y: it3.y, r: 1.1, h: 2.5 }); }
          else if (q2 < .36) put('log_large', x8, z8, .8, r() * 6.283, '#8a8a70');
          else if (q2 < .5) put(pick(['stump_old', 'stump_oldTall']), x8, z8, .9 + r() * .6, r() * 6.283, '#9a9a80');
          else if (q2 < .82) put(pick(['mushroom_redGroup', 'mushroom_redTall', 'mushroom_tanGroup', 'mushroom_red']), x8, z8, .5 + r() * .7, r() * 6.283);
          else put(pick(['plant_bushDetailed', 'plant_bushLarge']), x8, z8, 1 + r() * .7, r() * 6.283, '#76883a'); }
        var cx2 = DF[0] + 12, cz2 = DF[1] - 8; if (free(cx2, cz2, 4)) { for (k = 0; k < 9; k++) { var a7 = k / 9 * 6.283, x9 = cx2 + Math.cos(a7) * 6, z9 = cz2 + Math.sin(a7) * 6; put(k % 4 === 3 ? 'statue_columnDamaged' : 'stone_tallA', x9, z9, k % 4 === 3 ? 1.8 : 2.6 + r(), a7, '#8a9a8a'); ctx.PEBS.push({ x: x9, z: z9, y: ctx.hgt(x9, z9), r: .6, h: 2.4 }); } put('statue_ring', cx2, cz2, 1.2, 0, '#9aa89a'); }
        FLY.at = DF; }
      // 5) ruines sur une colline (colonnes en cercle autour d'un obélisque)
      var best = null; for (n = 0; n < 200; n++) { p = rand(14); if (!p) continue; var hh = ctx.hgt(p[0], p[1]); if (slope(p[0], p[1]) < 2.2 && (!best || hh > best[2])) best = [p[0], p[1], hh]; }
      if (best) { put('statue_obelisk', best[0], best[1], 6.5, .3); for (k = 0; k < 7; k++) { var a3 = k / 7 * 6.283, x4 = best[0] + Math.cos(a3) * 7, z4 = best[1] + Math.sin(a3) * 7; put(k % 3 === 2 ? 'statue_columnDamaged' : 'statue_column', x4, z4, k % 3 === 2 ? 2.2 : 4.2, a3); ctx.PEBS.push({ x: x4, z: z4, y: ctx.hgt(x4, z4), r: .7, h: 4 }); }
        put('statue_head', best[0] + 3, best[1] - 2, 1.4, 2.2); ctx.PEBS.push({ x: best[0], z: best[1], y: best[2], r: .9, h: 6 }); ctx.RUINS = best; }
    } else {
      // désert : cactus géants, palmiers au bord du lagon, campement nomade, ruines dans les plateaux
      for (n = 0; n < 140; n++) { p = rand(4); if (!p) continue; var tall = r() < .5; put(tall ? 'cactus_tall' : 'cactus_short', p[0], p[1], tall ? 3.5 + r() * 2.5 : 1.4 + r(), r() * 6.283); if (tall) ctx.PEBS.push({ x: p[0], z: p[1], y: ctx.hgt(p[0], p[1]), r: .45, h: 3 }); }
      for (n = 0; n < 900 && ITEMS.filter(function (i) { return /palm/.test(i.n); }).length < 45; n++) { var a4 = r() * 6.283, sr = ctx.shoreR(a4) - 10 - r() * 16, x5 = Math.cos(a4) * sr, z5 = Math.sin(a4) * sr;
        if (!free(x5, z5, 3) || Math.cos(a4) > -.2) continue; put(pick(['tree_palmDetailedTall', 'tree_palmDetailedShort', 'tree_palmBend']), x5, z5, 7 + r() * 5, r() * 6.283); ctx.PEBS.push({ x: x5, z: z5, y: ctx.hgt(x5, z5), r: .35, h: 6 }); }
      // oasis : palmiers en couronne, buissons verts, fleurs, nénuphars, campement
      if (ctx.LAKE) { var O = ctx.LAKE;
        for (n = 0; n < 16; n++) { var a8 = n / 16 * 6.283 + r() * .3, d8 = O[2] + 4 + r() * 9, x10 = O[0] + Math.cos(a8) * d8, z10 = O[1] + Math.sin(a8) * d8; put(pick(['tree_palmDetailedTall', 'tree_palmDetailedShort', 'tree_palmBend']), x10, z10, 7 + r() * 5, r() * 6.283); ctx.PEBS.push({ x: x10, z: z10, y: ctx.hgt(x10, z10), r: .35, h: 6 }); }
        for (n = 0; n < 40; n++) { var a9 = r() * 6.283, d9 = O[2] + 2 + r() * 16, x11 = O[0] + Math.cos(a9) * d9, z11 = O[1] + Math.sin(a9) * d9; put(pick(['plant_bushLarge', 'plant_bushDetailed', 'plant_bush', 'flower_redA', 'flower_yellowA', 'flower_purpleA', 'grass_leafsLarge']), x11, z11, .6 + r() * .9, r() * 6.283); }
        for (n = 0; n < 14; n++) { var a10 = r() * 6.283, d10 = r() * (O[2] - 4), t3 = TPL[n % 2 ? 'lily_small' : 'lily_large']; if (t3) ITEMS.push({ n: n % 2 ? 'lily_small' : 'lily_large', x: O[0] + Math.cos(a10) * d10, y: -.72, z: O[1] + Math.sin(a10) * d10, s: (n % 2 ? 1.1 : 1.8) / Math.max(t3.s.x, t3.s.z), ry: r() * 6.283 }); }
        var ox = O[0] + O[2] + 16, oz = O[1] + 4; put('tent_detailedOpen', ox, oz, 2.6, -1.2); put('campfire_logs', ox - 4, oz + 3, .5, 0); put('pot_large', ox + 2.5, oz + 3.5, .9, 0); put('canoe', O[0] - O[2] + 1, O[1], .55, 1.57); }
      p = rand(10); if (p) { put('tent_detailedClosed', p[0], p[1], 2.6, .4); put('tent_detailedOpen', p[0] + 5, p[1] + 2, 2.4, -.6); put('campfire_logs', p[0] + 2, p[1] + 4.5, .5, 0); put('pot_large', p[0] - 2.5, p[1] + 3, .9, 0); ctx.FIRES && ctx.FIRES.push([p[0] + 2, ctx.hgt(p[0] + 2, p[1] + 4.5), p[1] + 4.5]); }
      (ctx.PEAKS || []).forEach(function (pk, i) { if (i > 1) return; var x6 = pk[0] + pk[2] * .82, z6 = pk[1]; if (!free(x6, z6, 6)) return; put('statue_obelisk', x6, z6, 7, 0, '#f2c89a'); for (var k2 = 0; k2 < 5; k2++) { var a5 = k2 / 5 * 6.283, x7 = x6 + Math.cos(a5) * 6, z7 = z6 + Math.sin(a5) * 6; put(k2 % 2 ? 'statue_columnDamaged' : 'statue_column', x7, z7, k2 % 2 ? 2 : 4, a5, '#f2c89a'); ctx.PEBS.push({ x: x7, z: z7, y: ctx.hgt(x7, z7), r: .7, h: 4 }); } });
    }
  }
  function bake() {
    var groups = {}, o = new T.Object3D(), m4 = new T.Matrix4(), nm = new T.Matrix3(), v = new T.Vector3(), cc = new T.Color(), tc = new T.Color(), mat = new T.MeshLambertMaterial({ vertexColors: true }); mat.onBeforeCompile = function (sh) { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * .22;'); }; mat.customProgramCacheKey = function () { return 'propfill'; };
    ITEMS.forEach(function (it) { if (!TPL[it.n]) return; var key = Math.floor(it.x / 150) + ',' + Math.floor(it.z / 150); (groups[key] = groups[key] || []).push(it); });
    Object.keys(groups).forEach(function (key) { var L = groups[key], nV = 0, nI = 0, sx = 0, sz = 0;
      L.forEach(function (it) { TPL[it.n].parts.forEach(function (pt) { nV += pt.g.attributes.position.count; nI += pt.g.index ? pt.g.index.count : pt.g.attributes.position.count; }); });
      var pos = new Float32Array(nV * 3), nor = new Float32Array(nV * 3), col = new Float32Array(nV * 3), idx = nV > 65000 ? new Uint32Array(nI) : new Uint16Array(nI), k = 0, ki = 0;
      L.forEach(function (it) { o.position.set(it.x, it.y, it.z); o.rotation.set(0, it.ry, 0); o.scale.setScalar(it.s); o.updateMatrix(); sx += it.x; sz += it.z; if (it.tint) tc.set(it.tint);
        TPL[it.n].parts.forEach(function (pt) { m4.multiplyMatrices(o.matrix, pt.m); nm.getNormalMatrix(m4); var P = pt.g.attributes.position, N = pt.g.attributes.normal, I = pt.g.index, base = k; cc.copy(pt.c); if (it.tint) cc.multiply(tc);
          if (I) for (var j = 0; j < I.count; j++) idx[ki++] = base + I.getX(j); else for (j = 0; j < P.count; j++) idx[ki++] = base + j;
          for (var i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(m4); pos[k * 3] = v.x; pos[k * 3 + 1] = v.y; pos[k * 3 + 2] = v.z; if (N) { v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor[k * 3] = v.x; nor[k * 3 + 1] = v.y; nor[k * 3 + 2] = v.z; } col[k * 3] = cc.r; col[k * 3 + 1] = cc.g; col[k * 3 + 2] = cc.b; k++; } }); });
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('normal', new T.BufferAttribute(nor, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3)); g.setIndex(new T.BufferAttribute(idx, 1)); g.computeBoundingSphere();
      var mesh = new T.Mesh(g, mat); mesh.castShadow = true; mesh.receiveShadow = true; ctx.scene.add(mesh); MESHES.push({ m: mesh, x: sx / L.length, z: sz / L.length }); });
  }
  // lucioles de la forêt sombre (points lumineux qui flottent)
  var FLY = { at: null, pts: null };
  function makeFlies() { if (!FLY.at) return; var n = 260, pos = new Float32Array(n * 3), ph = new Float32Array(n), r = rng(99);
    for (var i = 0; i < n; i++) { var a = r() * 6.283, d = Math.sqrt(r()) * FLY.at[2], x = FLY.at[0] + Math.cos(a) * d, z = FLY.at[1] + Math.sin(a) * d; pos[i * 3] = x; pos[i * 3 + 1] = ctx.hgt(x, z) + .6 + r() * 3; pos[i * 3 + 2] = z; ph[i] = r() * 6.283; }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aPh', new T.BufferAttribute(ph, 1)); g.computeBoundingSphere();
    var m = new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { uT: { value: 0 } },
      vertexShader: 'attribute float aPh; uniform float uT; varying float vA; void main(){ vec3 p = position + vec3(sin(uT * .7 + aPh) * 1.2, sin(uT * 1.3 + aPh * 2.0) * .5, cos(uT * .6 + aPh) * 1.2); vec4 mv = modelViewMatrix * vec4(p, 1.0); vA = .5 + .5 * sin(uT * 3.0 + aPh * 5.0); gl_PointSize = (90.0 / -mv.z) * (.6 + vA); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, 0.0, d); gl_FragColor = vec4(vec3(.85, 1.0, .45) * 2.0, a * (.25 + vA * .75)); }' });
    FLY.pts = new T.Points(g, m); FLY.pts.frustumCulled = false; ctx.scene.add(FLY.pts); }
  var NAMES = ['rock_largeA', 'rock_largeB', 'rock_largeC', 'rock_largeD', 'rock_largeE', 'rock_largeF', 'rock_tallA', 'rock_tallB', 'rock_tallC', 'rock_tallD', 'rock_tallE', 'rock_tallF', 'rock_tallG', 'rock_tallH', 'stone_largeA', 'stone_largeB', 'stone_smallA', 'stone_smallB', 'stone_smallC', 'stone_smallFlatA',
    'stump_old', 'stump_oldTall', 'stump_roundDetailed', 'stump_squareDetailed', 'log', 'log_large', 'log_stack', 'log_stackLarge', 'mushroom_red', 'mushroom_redGroup', 'mushroom_redTall', 'mushroom_tan', 'mushroom_tanGroup', 'mushroom_tanTall',
    'flower_purpleA', 'flower_redA', 'flower_yellowA', 'flower_purpleC', 'flower_redC', 'flower_yellowC', 'plant_bush', 'plant_bushDetailed', 'plant_bushLarge', 'grass_large', 'grass_leafsLarge', 'lily_large', 'lily_small', 'canoe', 'canoe_paddle',
    'tent_detailedOpen', 'tent_detailedClosed', 'tent_smallOpen', 'campfire_stones', 'campfire_logs', 'statue_column', 'statue_columnDamaged', 'statue_obelisk', 'statue_head', 'cactus_tall', 'cactus_short', 'stone_tallA', 'statue_ring', 'tree_palmDetailedTall', 'tree_palmDetailedShort', 'tree_palmBend', 'pot_large'];
  window.PROPS = {
    build: function (THREE, c) { T = THREE; ctx = c; if (!T.GLTFLoader) return; load(NAMES, function () { try { place(); bake(); makeFlies(); } catch (e) { console.error('PROPS', e); } if (ctx.onReady) ctx.onReady(ITEMS.length); }); },
    update: function (cam) { if (FLY.pts) { FLY.pts.material.uniforms.uT.value = performance.now() / 1000; FLY.pts.visible = Math.hypot(cam.position.x - FLY.at[0], cam.position.z - FLY.at[1]) < FLY.at[2] + 60; } var px = cam.position.x, pz = cam.position.z, R = cam.position.y > 120 ? 600 : 330; MESHES.forEach(function (q) { q.m.visible = Math.hypot(q.x - px, q.z - pz) < R; }); },
    stats: function () { return { items: ITEMS.length, meshes: MESHES.length }; }
  };
})();
