/* Wald Royal — optimisation du rendu
   OPT.chunk(im)   : découpe un InstancedMesh fixe en paquets de 200 m qui ont une vraie sphère englobante (les paquets hors champ ne sont plus dessinés)
   OPT.batch(roots): fusionne tous les petits meshes fixes (décor des villes, fermes, maisons…) par matériau et par zone de 160 m → quelques appels de dessin au lieu de milliers
   Tout ce qui bouge doit avoir userData.dyn = true (il est laissé tel quel, avec ses enfants). */
(function () {
  var EMPTY = null;
  function sharedGeo(g) { var n = new THREE.BufferGeometry(); for (var k in g.attributes) n.setAttribute(k, g.attributes[k]); if (g.index) n.setIndex(g.index); g.groups.forEach(function (q) { n.addGroup(q.start, q.count, q.materialIndex); }); return n; }
  function chunk(im, cell) {
    cell = cell || 200; if (!im || !im.isInstancedMesh || im.count < 24 || im.userData.chunked) return; im.userData.chunked = true;
    var g = im.geometry; if (!g.boundingSphere) g.computeBoundingSphere(); var gr = g.boundingSphere.radius, gc = g.boundingSphere.center;
    var m = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), cells = {};
    for (var i = 0; i < im.count; i++) { im.getMatrixAt(i, m); m.decompose(p, q, sc); if (sc.x === 0 && sc.y === 0) continue; var key = Math.floor(p.x / cell) + ',' + Math.floor(p.z / cell); (cells[key] = cells[key] || []).push(i); }
    var col = new THREE.Color();
    Object.keys(cells).forEach(function (key) { var L = cells[key], sub = new THREE.InstancedMesh(sharedGeo(g), im.material, L.length), mn = new THREE.Vector3(1e9, 1e9, 1e9), mx = new THREE.Vector3(-1e9, -1e9, -1e9), rMax = 0;
      L.forEach(function (i, k) { im.getMatrixAt(i, m); sub.setMatrixAt(k, m); m.decompose(p, q, sc); var c = gc.clone().applyMatrix4(m); mn.min(c); mx.max(c); rMax = Math.max(rMax, gr * Math.max(sc.x, sc.y, sc.z)); if (im.instanceColor) { im.getColorAt(i, col); sub.setColorAt(k, col); } });
      sub.geometry.boundingSphere = new THREE.Sphere(mn.clone().add(mx).multiplyScalar(.5), mn.distanceTo(mx) / 2 + rMax);
      sub.castShadow = im.castShadow; sub.receiveShadow = im.receiveShadow; sub.frustumCulled = true; sub.userData.st = 1; im.add(sub); });
    EMPTY = EMPTY || new THREE.BufferGeometry(); im.geometry = EMPTY;   // le parent ne dessine plus rien (0 sommet) mais garde sa visibilité pour ses paquets
  }
  // deux matériaux identiques (même type, couleur, texture…) sont fusionnés ensemble même si ce sont deux objets différents
  function sig(m) { if (m.isShaderMaterial || m.onBeforeCompile && m.onBeforeCompile.toString().length > 20 && !m.customProgramCacheKey) return m.uuid;
    var bake = canBake(m);
    return [m.type, m.color && !bake ? m.color.getHexString() : 'cb', m.emissive ? m.emissive.getHexString() + (m.emissiveIntensity || 1) : '', m.map ? m.map.uuid : '', m.transparent ? 't' + m.opacity : '', m.side, m.vertexColors ? 'v' : '', m.flatShading ? 'f' : '', m.depthWrite ? '' : 'nd',
      m.shininess || '', m.specular ? m.specular.getHexString() : '', m.customProgramCacheKey ? m.customProgramCacheKey() : '', m.alphaTest || '', m.wireframe ? 'w' : '', m.fog === false ? 'nf' : ''].join('|'); }
  // un matériau uni (sans texture ni shader maison) : sa couleur peut être écrite dans les sommets, donc tous les objets de ce type fusionnent
  function canBake(m) { return !m.map && !m.isShaderMaterial && !m.onBeforeCompile.toString().match(/sh\./) && !!m.color && !m.transparent && (m.isMeshLambertMaterial || m.isMeshPhongMaterial || m.isMeshStandardMaterial || m.isMeshBasicMaterial); }
  // fusion statique
  function batch(roots, cell, target) {
    cell = cell || 160; var groups = {}, kill = [], v = new THREE.Vector3(), nm = new THREE.Matrix3();
    function visit(o) { if (o.userData && o.userData.dyn) return; if (o.isLight || o.isCamera || o.isSprite || o.isPoints || o.isLine) return;
      function add(o, g, mw, icol) { if (!g.boundingSphere) g.computeBoundingSphere(); var c = g.boundingSphere.center.clone().applyMatrix4(mw);
        var key = sig(o.material) + '|' + (o.castShadow ? 1 : 0) + (o.receiveShadow ? 1 : 0) + '|' + Math.floor(c.x / cell) + ',' + Math.floor(c.z / cell) + '|' + o.renderOrder;
        (groups[key] = groups[key] || { mat: o.material, cast: o.castShadow, rec: o.receiveShadow, ro: o.renderOrder, list: [] }).list.push({ geometry: g, matrixWorld: mw, material: o.material, icol: icol }); }
      if (o.isMesh && !o.isInstancedMesh && !o.isSkinnedMesh && !Array.isArray(o.material) && o.visible && o.geometry && o.geometry.attributes.position && !o.material.userData.noBatch) {
        o.updateMatrixWorld(true); add(o, o.geometry, o.matrixWorld); kill.push(o); }
      // petits paquets instanciés du décor (moins de 24 exemplaires) : on les fond aussi dans la fusion
      else if (o.isInstancedMesh && o.userData.kit && !o.userData.chunked && o.count < 24 && !Array.isArray(o.material) && o.geometry.attributes.position) {
        var m4 = new THREE.Matrix4(), cl = new THREE.Color(); for (var ii = 0; ii < o.count; ii++) { o.getMatrixAt(ii, m4); var ic = null; if (o.instanceColor) { o.getColorAt(ii, cl); ic = cl.clone(); } add(o, o.geometry, m4.clone(), ic); } kill.push(o); }
      if (!o.isInstancedMesh) o.children.slice().forEach(visit); }
    roots.forEach(function (r) { r.updateMatrixWorld(true); visit(r); });
    var made = 0;
    Object.keys(groups).forEach(function (key) { var G = groups[key];
      var bake = canBake(G.mat), needUv = !!(G.mat.map || G.mat.alphaMap || G.mat.normalMap) || G.mat.isShaderMaterial, needCol = !!G.mat.vertexColors || bake, nV = 0, nI = 0;
      G.list.forEach(function (o) { var g = o.geometry, n = g.attributes.position.count; nV += n; nI += g.index ? g.index.count : n; });
      var pos = new Float32Array(nV * 3), nor = new Float32Array(nV * 3), uv = needUv ? new Float32Array(nV * 2) : null, colA = needCol ? new Float32Array(nV * 3) : null, idx = nV > 65000 ? new Uint32Array(nI) : new Uint16Array(nI), k = 0, ki = 0;
      G.list.forEach(function (o) { var g = o.geometry, P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv, C = g.attributes.color, base = k, mw = o.matrixWorld; nm.getNormalMatrix(mw);
        if (!N) { g.computeVertexNormals(); N = g.attributes.normal; }
        var flip = mw.determinant() < 0;
        if (g.index) for (var j = 0; j < g.index.count; j += 3) { var a = g.index.getX(j), b = g.index.getX(j + 1), cc = g.index.getX(j + 2); idx[ki++] = base + a; idx[ki++] = base + (flip ? cc : b); idx[ki++] = base + (flip ? b : cc); }
        else for (j = 0; j < P.count; j += 3) { idx[ki++] = base + j; idx[ki++] = base + j + (flip ? 2 : 1); idx[ki++] = base + j + (flip ? 1 : 2); }
        for (var i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(mw); pos[k * 3] = v.x; pos[k * 3 + 1] = v.y; pos[k * 3 + 2] = v.z;
          v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor[k * 3] = v.x; nor[k * 3 + 1] = v.y; nor[k * 3 + 2] = v.z;
          if (uv && U) { uv[k * 2] = U.getX(i); uv[k * 2 + 1] = U.getY(i); }
          if (colA) { var mc = bake ? o.material.color : null, cr = mc ? mc.r : 1, cg = mc ? mc.g : 1, cb = mc ? mc.b : 1; if (o.icol) { cr *= o.icol.r; cg *= o.icol.g; cb *= o.icol.b; }
            if (C) { colA[k * 3] = C.getX(i) * cr; colA[k * 3 + 1] = C.getY(i) * cg; colA[k * 3 + 2] = C.getZ(i) * cb; } else { colA[k * 3] = cr; colA[k * 3 + 1] = cg; colA[k * 3 + 2] = cb; } }
          k++; } });
      var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); if (uv) g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); if (colA) g.setAttribute('color', new THREE.BufferAttribute(colA, 3));
      g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeBoundingSphere();
      var mat = G.mat; if (bake) { mat = G.mat.clone(); mat.color.setRGB(1, 1, 1); mat.vertexColors = true; }
      var mesh = new THREE.Mesh(g, mat); mesh.castShadow = G.cast; mesh.receiveShadow = G.rec; mesh.renderOrder = G.ro; mesh.userData.batched = 1; (target || window.OPT.scene).add(mesh); made++; });
    kill.forEach(function (o) { if (o.parent) o.parent.remove(o); });
    return { merged: kill.length, meshes: made };
  }
  // fusionne un objet qui bouge d'un bloc (véhicule…) : ses morceaux sont regroupés par matériau dans son repère local
  function mergeLocal(g) { var p = g.position.clone(), r = g.rotation.clone(), sc = g.scale.clone(); g.position.set(0, 0, 0); g.rotation.set(0, 0, 0); g.scale.set(1, 1, 1); g.updateMatrixWorld(true);
    try { batch([g], 1e6, g); } catch (e) { console.warn('mergeLocal', e); } g.position.copy(p); g.rotation.copy(r); g.scale.copy(sc); return g; }
  window.OPT = { chunk: chunk, batch: batch, mergeLocal: mergeLocal, scene: null };
})();
