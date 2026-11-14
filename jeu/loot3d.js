/* Wald Royal : butin et bancs en vrais modèles 3D (Quaternius, CC0) dans jeu/models/loot/.
   Caisse de munitions, petit bouclier (fiole bleue), gros bouclier (grosse fiole bleue), kit de soins (trousse rouge), bulle (fiole cristal rose),
   coffre (bois et ferrures dorées), banc de parc. Chaque modèle est fusionné en un mesh à couleurs de sommets (+ un mesh de verre transparent
   pour les fioles), mis à la bonne taille, posé au sol. LOOT3D.get(clé) donne une copie, ou null tant que ce n'est pas chargé. */
(function () {
  var T, TPL = {}, READY = false;
  var DEFS = {
    ammo: { f: 'Lootbox', size: .78 },
    mini: { f: 'Potion4_Filled', size: .5, liq: '#38b8ff' },
    shield: { f: 'Potion9_Filled', size: .62, liq: '#2a7bff' },
    bulle: { f: 'Potion10_Filled', size: .52, liq: '#ff4ad8' },
    heal: { f: 'FirstAidKit', size: .62 },
    chest: { f: 'Chest_Closed', size: 1.25, col: { Metal: '#ffc53a', DarkMetal: '#6a4a1a', Wood: '#8a4f24' }, emis: { Metal: '#5a3a00' } },
    bench: { f: 'Bench_1', size: 1.8, col: { Wood: '#8f5a2e' }, bench: true }
  };
  function bake(scene, d) {
    scene.updateMatrixWorld(true); var op = [], gl = [];
    scene.traverse(function (o) { if (!o.isMesh) return; var mats = Array.isArray(o.material) ? o.material : [o.material], g0 = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); g0.applyMatrix4(o.matrixWorld);
      var groups = g0.groups.length ? g0.groups : [{ start: 0, count: g0.attributes.position.count, materialIndex: 0 }];
      groups.forEach(function (gr) { var mt = mats[gr.materialIndex] || mats[0], nm = mt.name || '';
        var sub = new T.BufferGeometry(); ['position', 'normal'].forEach(function (a) { var A = g0.attributes[a]; sub.setAttribute(a, new T.BufferAttribute(A.array.slice(gr.start * 3, (gr.start + gr.count) * 3), 3)); });
        if (/^Glass/.test(nm)) { gl.push(sub); return; }
        var c = d.col && d.col[nm] ? new T.Color(d.col[nm]) : /^Liquid/.test(nm) && d.liq ? new T.Color(d.liq) : mt.color.clone();
        var e = d.emis && d.emis[nm] ? new T.Color(d.emis[nm]) : null; op.push([sub, c, e]); }); });
    var box = new T.Box3(); op.concat(gl.map(function (g) { return [g]; })).forEach(function (p) { p[0].computeBoundingBox(); box.union(p[0].boundingBox); });
    var sz = box.getSize(new T.Vector3()), s = d.size / Math.max(sz.x, sz.y, sz.z), cx = (box.min.x + box.max.x) / 2, cz = (box.min.z + box.max.z) / 2, rotY = 0;
    if (d.bench) { if (sz.z > sz.x) rotY = Math.PI / 2; s = d.size / Math.max(sz.x, sz.z); }
    function fix(g) { g.translate(-cx, -box.min.y, -cz); if (rotY) g.rotateY(rotY); g.scale(s, s, s); return g; }
    var n = 0; op.forEach(function (p) { fix(p[0]); n += p[0].attributes.position.count; });
    var pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), k = 0;
    op.forEach(function (p) { var g = p[0], c = g.attributes.position.count, cc = p[1].clone(); if (p[2]) cc.add(p[2]);
      pos.set(g.attributes.position.array, k * 3); nor.set(g.attributes.normal.array, k * 3); for (var i = 0; i < c; i++) { col[(k + i) * 3] = cc.r; col[(k + i) * 3 + 1] = cc.g; col[(k + i) * 3 + 2] = cc.b; } k += c; });
    var G = new T.BufferGeometry(); G.setAttribute('position', new T.BufferAttribute(pos, 3)); G.setAttribute('normal', new T.BufferAttribute(nor, 3)); G.setAttribute('color', new T.BufferAttribute(col, 3));
    if (d.bench) {   // le dossier doit être derrière (-z), comme les anciens bancs
      var sb = 0, nb = 0, top = G.attributes.position; G.computeBoundingBox(); for (var j = 0; j < top.count; j++) if (top.getY(j) > G.boundingBox.max.y * .7) { sb += top.getZ(j); nb++; } if (nb && sb / nb > 0) G.rotateY(Math.PI); }
    G.computeBoundingSphere();
    var out = { geo: G, mat: new T.MeshPhongMaterial({ vertexColors: true, shininess: 40, specular: '#2a2a2a' }) };
    if (gl.length) { var gn = 0; gl.forEach(function (g) { fix(g); gn += g.attributes.position.count; }); var gp = new Float32Array(gn * 3), gnn = new Float32Array(gn * 3), q = 0;
      gl.forEach(function (g) { gp.set(g.attributes.position.array, q * 3); gnn.set(g.attributes.normal.array, q * 3); q += g.attributes.position.count; });
      var GG = new T.BufferGeometry(); GG.setAttribute('position', new T.BufferAttribute(gp, 3)); GG.setAttribute('normal', new T.BufferAttribute(gnn, 3)); GG.computeBoundingSphere();
      out.glass = GG; out.gmat = new T.MeshPhongMaterial({ color: '#dff4ff', transparent: true, opacity: .32, shininess: 140, specular: '#ffffff', depthWrite: false }); }
    return out;
  }
  window.LOOT3D = {
    ready: function () { return READY; }, onReady: null,
    load: function (THREE) { T = THREE; if (!T.GLTFLoader) return; var keys = Object.keys(DEFS), left = keys.length, L = new T.GLTFLoader();
      keys.forEach(function (k) { L.load('models/loot/' + DEFS[k].f + '.glb', function (g) { try { TPL[k] = bake(g.scene, DEFS[k]); } catch (e) { console.error('LOOT3D', k, e); } if (--left === 0) done(); }, null, function () { if (--left === 0) done(); }); });
      function done() { READY = true; if (window.LOOT3D.onReady) window.LOOT3D.onReady(); } },
    get: function (k) { var t = TPL[k]; if (!t) return null; var g = new T.Group(), m = new T.Mesh(t.geo, t.mat); m.castShadow = true; g.add(m);
      if (t.glass) { var gm = new T.Mesh(t.glass, t.gmat); gm.renderOrder = 2; g.add(gm); } g.userData.real3d = true; return g; },
    // bancs de la ville : un seul InstancedMesh pour tous (positions données par city.js dans window.EXT_BENCH)
    benches: function (scene) { var t = TPL.bench, L = window.EXT_BENCH || []; if (!t || !L.length) return null;
      var im = new T.InstancedMesh(t.geo, t.mat, L.length), o = new T.Object3D(); L.forEach(function (b, i) { o.position.set(b.x, b.y, b.z); o.rotation.set(0, b.ry || 0, 0); o.scale.setScalar(b.s || 1); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
      im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; scene.add(im); if (window.OPT) OPT.chunk(im); return im; }
  };
})();
