/* Wald Royal : détails des villes (décor instancié, presque sans coût de collision).
   window.CITY.build(THREE, ctx) ; ctx = { scene, HOUSES, TOWNS, ROADS, hgt, inTown, nearRoad, DES, H, PCOL }
   - toits plats : rebords, clims, châteaux d'eau, antennes + paraboles, panneaux solaires, cabanons d'accès
   - façades : bandeaux d'étage, piliers d'angle, auvents, enseignes néon (sans marque), jardinières
   - rues : lampadaires le long des routes, bancs, poubelles, bouches d'incendie, abribus, panneaux pub, plots
   - chaque ville : conteneurs + grue (docks), château d'eau + bidons + pneus (ranch), clôtures + foin + puits (village), drapeaux + arche néon (avenue)
   Les gros objets (conteneurs, abribus, château d'eau) ajoutent des boîtes de collision dans ctx.PCOL. */
(function () {
  var T, MC = {};
  function M(col, o) { var k = col + JSON.stringify(o || {}); if (!MC[k]) MC[k] = new T.MeshLambertMaterial(Object.assign({ color: col }, o || {})); return MC[k]; }
  function P(col, o) { var k = 'p' + col + JSON.stringify(o || {}); if (!MC[k]) MC[k] = new T.MeshPhongMaterial(Object.assign({ color: col, shininess: 60, specular: '#666' }, o || {})); return MC[k]; }
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* « kit » : un type d'objet = plusieurs morceaux (géométrie + matériau + placement local). On accumule les positions, puis 1 InstancedMesh par morceau. */
  function Kit(parts) { this.parts = parts; this.list = []; }
  Kit.prototype.add = function (x, y, z, ry, s, col) { this.list.push([x, y, z, ry || 0, s || 1, col]); };
  Kit.prototype.flush = function (scene, shadow) {
    var L = this.list; if (!L.length) return; var o = new T.Object3D(), loc = new T.Object3D(), m4 = new T.Matrix4(), c = new T.Color();
    this.parts.forEach(function (pt) {
      var im = new T.InstancedMesh(pt.g, pt.m, L.length); loc.position.fromArray(pt.p || [0, 0, 0]); loc.rotation.fromArray((pt.r || [0, 0, 0]).concat(['XYZ'])); loc.scale.fromArray(pt.s || [1, 1, 1]); loc.updateMatrix();
      L.forEach(function (it, i) { o.position.set(it[0], it[1], it[2]); o.rotation.set(0, it[3], 0); o.scale.setScalar(it[4]); o.updateMatrix(); m4.multiplyMatrices(o.matrix, loc.matrix); im.setMatrixAt(i, m4); if (pt.tint && it[5]) im.setColorAt(i, c.set(it[5])); });
      im.frustumCulled = false; im.castShadow = shadow !== false && !pt.noShadow; im.receiveShadow = true; scene.add(im);
    });
  };
  var GB, GC, GC8, GS;
  function part(g, m, p, s, r, extra) { return Object.assign({ g: g, m: m, p: p, s: s, r: r }, extra || {}); }

  function neonTex(txt, col, w) {
    var c = document.createElement('canvas'); c.width = w || 512; c.height = 128; var g = c.getContext('2d');
    g.fillStyle = '#0c0614'; g.fillRect(0, 0, c.width, 128); g.strokeStyle = col; g.lineWidth = 6; g.shadowColor = col; g.shadowBlur = 24; g.strokeRect(10, 10, c.width - 20, 108);
    g.font = '900 64px Arial Black, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.shadowBlur = 30; g.fillText(txt, c.width / 2, 68); g.fillStyle = col; g.shadowBlur = 0; g.globalAlpha = .35; g.fillText(txt, c.width / 2, 68);
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4; return t;
  }
  function adTex(lines, bg, fg) {
    var c = document.createElement('canvas'); c.width = 512; c.height = 256; var g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 512, 256); gr.addColorStop(0, bg[0]); gr.addColorStop(1, bg[1]); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
    g.fillStyle = 'rgba(255,255,255,.08)'; for (var i = 0; i < 12; i++) g.fillRect(i * 48, 0, 20, 256);
    g.textAlign = 'center'; g.fillStyle = fg; g.shadowColor = '#000'; g.shadowBlur = 10; g.font = '900 70px Arial Black, Arial'; g.fillText(lines[0], 256, 110); g.font = '800 34px Arial'; g.fillText(lines[1], 256, 175);
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
  }
  function ribTex() { var c = document.createElement('canvas'); c.width = 128; c.height = 64; var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 64); for (var x = 0; x < 128; x += 8) { g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x, 0, 3, 64); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(x + 3, 0, 1, 64); } g.fillStyle = 'rgba(80,40,10,.25)'; for (var i = 0; i < 60; i++) g.fillRect(Math.random() * 128, Math.random() * 64, 2 + Math.random() * 6, 1 + Math.random() * 3); var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(3, 1); return t; }

  window.CITY = { build: function (THREE, ctx) {
    T = THREE; var S = ctx.scene, hgt = ctx.hgt, r = rng(77), H = ctx.H || 3.2, DES = ctx.DES, PCOL = ctx.PCOL || [];
    GB = new T.BoxGeometry(1, 1, 1); GC = new T.CylinderGeometry(.5, .5, 1, 14); GC8 = new T.CylinderGeometry(.5, .5, 1, 8); GS = new T.SphereGeometry(.5, 12, 8);
    var steel = P('#9aa2ae'), dark = M('#2a2d34'), white = M('#e8eaee'), concrete = M('#b8b4ac'), glow = new T.MeshBasicMaterial({ color: '#fff4c8' });
    function col(x, z, hw, hd, h, y0) { PCOL.push({ x: x, z: z, hw: hw, hd: hd, y0: y0 == null ? hgt(x, z) : y0, h: h }); }

    // ---------- kits ----------
    var AC = new Kit([part(GB, M('#c8ccd2'), [0, .45, 0], [1.3, .9, 1]), part(GC, dark, [.15, .91, 0], [.8, .04, .8]), part(GC8, M('#555a62'), [.15, .93, 0], [.25, .04, .25]), part(GB, dark, [-.66, .3, 0], [.05, .4, .6])]);
    var TANK = new Kit([part(GC, M('#8a6a4a'), [0, 2.4, 0], [2.2, 2, 2.2]), part(new T.ConeGeometry(1.25, .7, 14), dark, [0, 3.75, 0]), part(GB, dark, [.7, 1, .7], [.12, 2, .12]), part(GB, dark, [-.7, 1, .7], [.12, 2, .12]), part(GB, dark, [.7, 1, -.7], [.12, 2, .12]), part(GB, dark, [-.7, 1, -.7], [.12, 2, .12]), part(GB, dark, [0, 1.4, 0], [1.5, .08, .08])]);
    var ANT = new Kit([part(GC8, steel, [0, 2.2, 0], [.08, 4.4, .08]), part(GB, steel, [0, 3.2, 0], [1, .05, .05]), part(GB, steel, [0, 3.8, 0], [.7, .05, .05]), part(GS, M('#ff2b4a', { emissive: '#ff0020', emissiveIntensity: 2 }), [0, 4.45, 0], [.16, .16, .16]),
      part(new T.SphereGeometry(.6, 14, 8, 0, 6.283, 0, 1.1), white, [.7, 1.1, 0], [1, 1, 1], [0, 0, -1.2], { noShadow: true }), part(GB, dark, [.45, .6, 0], [.08, 1.2, .08])]);
    var SOLAR = new Kit([part(GB, M('#1d2a4a', {}), [0, .55, 0], [2, .06, 1.2], [-.45, 0, 0]), part(GB, dark, [0, .3, .3], [.08, .6, .08]), part(GB, dark, [0, .2, -.3], [.08, .4, .08])]);
    var HUT = new Kit([part(GB, concrete, [0, 1.2, 0], [2.4, 2.4, 2.2]), part(GB, M('#6a4a3a'), [1.21, 1, 0], [.05, 2, .9]), part(GB, dark, [0, 2.45, 0], [2.6, .1, 2.4])]);
    var AWN = new Kit([part(GB, M('#ffffff'), [0, 0, .7], [3.4, .08, 1.5], [.25, 0, 0], { tint: 1 }), part(GB, dark, [-1.65, -.5, 1.35], [.05, 1, .05]), part(GB, dark, [1.65, -.5, 1.35], [.05, 1, .05])]);
    var LAMP = new Kit([part(GC8, M('#2c2f36'), [0, 3.1, 0], [.16, 6.2, .16]), part(GC8, M('#2c2f36'), [0, .15, 0], [.4, .3, .4]), part(GB, M('#2c2f36'), [.6, 6.15, 0], [1.3, .1, .14]), part(GB, glow, [1.15, 6.05, 0], [.5, .08, .26], null, { noShadow: true })]);
    var BENCH = new Kit([part(GB, M('#7a4a2a'), [0, .45, 0], [1.7, .06, .5]), part(GB, M('#7a4a2a'), [0, .75, -.24], [1.7, .4, .05], [-.15, 0, 0]), part(GB, dark, [-.75, .22, 0], [.07, .45, .5]), part(GB, dark, [.75, .22, 0], [.07, .45, .5])]);
    var BIN = new Kit([part(GC, M('#2e6a3a'), [0, .45, 0], [.55, .9, .55], null, { tint: 1 }), part(GC, dark, [0, .92, 0], [.6, .06, .6])]);
    var HYD = new Kit([part(GC, M('#d8202e'), [0, .35, 0], [.26, .7, .26]), part(GS, M('#d8202e'), [0, .72, 0], [.3, .25, .3]), part(GC8, M('#e8b020'), [0, .45, .16], [.1, .14, .1], [Math.PI / 2, 0, 0])]);
    var BOLL = new Kit([part(GC8, M('#e8e8e8'), [0, .45, 0], [.18, .9, .18]), part(GC8, M('#ff2bd6', { emissive: '#ff2bd6', emissiveIntensity: .8 }), [0, .78, 0], [.19, .08, .19], null, { noShadow: true })]);
    var PLANT = new Kit([part(GB, concrete, [0, .3, 0], [1.4, .6, .7]), part(GS, M('#3f8a34'), [0, .75, 0], [1.3, .6, .65]), part(GS, M('#e84a8a'), [.35, .95, .1], [.25, .2, .25]), part(GS, M('#ffd83a'), [-.3, .95, -.1], [.2, .18, .2])]);
    var STOP = new Kit([part(GB, new T.MeshPhongMaterial({ color: '#bfe6ff', transparent: true, opacity: .35, shininess: 120 }), [0, 1.3, -.7], [3.2, 2.4, .05], null, { noShadow: true }), part(GB, dark, [0, 2.55, 0], [3.4, .1, 1.6]),
      part(GB, dark, [-1.6, 1.3, -.7], [.08, 2.6, .08]), part(GB, dark, [1.6, 1.3, -.7], [.08, 2.6, .08]), part(GB, dark, [-1.6, 1.3, .7], [.08, 2.6, .08]), part(GB, dark, [1.6, 1.3, .7], [.08, 2.6, .08]), part(GB, M('#7a4a2a'), [0, .5, -.45], [2.6, .08, .4])]);
    var CONE = new Kit([part(new T.ConeGeometry(.22, .7, 10), M('#ff6a1a'), [0, .38, 0]), part(GB, M('#ff6a1a'), [0, .03, 0], [.5, .06, .5]), part(GC, white, [0, .4, 0], [.3, .1, .3])]);
    var BARREL = new Kit([part(GC, M('#ffffff'), [0, .5, 0], [.62, 1, .62], null, { tint: 1 }), part(GC, dark, [0, .3, 0], [.64, .05, .64]), part(GC, dark, [0, .72, 0], [.64, .05, .64])]);
    var TIRE = new Kit([part(new T.TorusGeometry(.38, .16, 8, 14), M('#1a1a1c'), [0, .16, 0], [1, 1, 1], [Math.PI / 2, 0, 0]), part(new T.TorusGeometry(.38, .16, 8, 14), M('#1a1a1c'), [0, .48, 0], [1, 1, 1], [Math.PI / 2, 0, .3])]);
    var CRATE = new Kit([part(GB, M('#a87a44'), [0, .5, 0], [1, 1, 1]), part(GB, M('#6a4a2a'), [0, .5, .505], [1, .12, .02]), part(GB, M('#6a4a2a'), [0, .5, -.505], [1, .12, .02])]);
    var FENCE = new Kit([part(GB, M('#f0ead8'), [0, .55, 0], [2, .1, .05]), part(GB, M('#f0ead8'), [0, .25, 0], [2, .1, .05]), part(GB, M('#f0ead8'), [-.8, .45, 0], [.1, .9, .06]), part(GB, M('#f0ead8'), [-.27, .45, 0], [.1, .9, .06]), part(GB, M('#f0ead8'), [.27, .45, 0], [.1, .9, .06]), part(GB, M('#f0ead8'), [.8, .45, 0], [.1, .9, .06])]);
    var HAY = new Kit([part(GC, M('#d8b45a'), [0, .6, 0], [1.2, 1.2, 1.2], [Math.PI / 2, 0, 0]), part(GC, M('#b8943a'), [0, .6, 0], [1.22, .08, 1.22], [Math.PI / 2, 0, 0])]);
    var CONT = new Kit([part(GB, M('#fff', { map: ribTex() }), [0, 1.3, 0], [6, 2.6, 2.45], null, { tint: 1 }), part(GB, dark, [3.01, 1.3, 0], [.04, 2.5, 2.3])]);
    var FLAG = new Kit([part(GC8, steel, [0, 3.5, 0], [.1, 7, .1]), part(GB, M('#ffffff', { side: T.DoubleSide }), [.7, 6.3, 0], [1.4, .9, .02], null, { tint: 1, noShadow: true })]);
    var POT = new Kit([part(GC, M('#c97a4a'), [0, .3, 0], [.6, .6, .6]), part(new T.ConeGeometry(.15, 1.6, 6), M('#3a7a2a'), [0, 1.3, 0]), part(GS, M('#3a8a30'), [0, .8, 0], [.6, .5, .6])]);
    var WELL = new Kit([part(GC, M('#8a8a84'), [0, .45, 0], [1.6, .9, 1.6]), part(GB, M('#6a4a2a'), [-.7, 1.3, 0], [.12, 1.8, .12]), part(GB, M('#6a4a2a'), [.7, 1.3, 0], [.12, 1.8, .12]), part(new T.ConeGeometry(1.2, .7, 4), M('#7a3a2a'), [0, 2.5, 0], [1, 1, 1], [0, Math.PI / 4, 0])]);
    var CHIM = new Kit([part(GB, M('#8a4a3a'), [0, .7, 0], [.6, 1.4, .6]), part(GB, dark, [0, 1.42, 0], [.7, .08, .7])]);

    // ---------- bâtiments ----------
    var SIGNS = DES ? [['MIRAGE CAFÉ', '#ff2bd6'], ['OASIS BURGER', '#ffb02a'], ['HÔTEL DUNE', '#2de2ff'], ['TURBO GYM', '#7dff6a'], ['PIZZA SABLE', '#ff4a3a'], ['NÉON BAR', '#c77dff']]
      : [['WALD BURGER', '#ff2bd6'], ['NÉON CAFÉ', '#2de2ff'], ['HÔTEL ROYAL', '#ffd23d'], ['TURBO GYM', '#7dff6a'], ['PIZZA ROYALE', '#ff4a3a'], ['CLUB VIOLET', '#c77dff'], ['PHARMACIE', '#3dff8a'], ['GARAGE W', '#ff8a2d']];
    var signN = 0, AWNC = ['#ff2bd6', '#9b4dff', '#ff1f4b', '#2de2ff', '#ffd23d'];
    function doorDir(hs) { return { s: [0, 1], n: [0, -1], e: [1, 0], w: [-1, 0] }[hs.door || 's']; }
    ctx.HOUSES.forEach(function (hs, i) {
      var y = hs.y0, top = y + hs.h, town = ctx.inTown(hs.x, hs.z, 2), dd = doorDir(hs), fx = dd[0], fz = dd[1], ry = Math.atan2(fx, fz);
      var fW = Math.abs(fx) ? hs.hz : hs.hx, fD = Math.abs(fx) ? hs.hx : hs.hz;   // demi-largeur de la façade, demi-profondeur
      if (hs.flat) {
        // rebord du toit + bandeaux d'étage + piliers d'angle
        var pm = hs.m === 'facade' ? M('#d8dce4') : hs.m === 'metal' ? M('#7a828c') : M('#c8c2b6'), parts = [];
        [[0, hs.hz, hs.hx * 2 + .3, .3], [0, -hs.hz, hs.hx * 2 + .3, .3], [hs.hx, 0, .3, hs.hz * 2], [-hs.hx, 0, .3, hs.hz * 2]].forEach(function (q) { var m = new T.Mesh(GB, pm); m.position.set(hs.x + q[0], top + .35, hs.z + q[1]); m.scale.set(q[2], .7, q[3]); m.castShadow = true; S.add(m); });
        for (var f = 1; f * H < hs.h - .5; f++) [[0, hs.hz + .12, hs.hx * 2 + .45, .25], [0, -hs.hz - .12, hs.hx * 2 + .45, .25], [hs.hx + .12, 0, .25, hs.hz * 2 + .45], [-hs.hx - .12, 0, .25, hs.hz * 2 + .45]].forEach(function (q) { var m = new T.Mesh(GB, pm); m.position.set(hs.x + q[0], y + f * H, hs.z + q[1]); m.scale.set(q[2], .22, q[3]); S.add(m); });
        if (hs.h > 6) [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (q) { var m = new T.Mesh(GB, pm); m.position.set(hs.x + q[0] * (hs.hx + .1), y + hs.h / 2, hs.z + q[1] * (hs.hz + .1)); m.scale.set(.5, hs.h, .5); m.castShadow = true; S.add(m); });
        // toit : clims, antenne, château d'eau / panneaux solaires, cabanon
        var nAC = Math.max(1, Math.round(hs.hx * hs.hz / 18)); for (var k = 0; k < nAC; k++) AC.add(hs.x + (r() - .5) * (hs.hx * 2 - 2.5), top, hs.z + (r() - .5) * (hs.hz * 2 - 2.5), (r() * 4 | 0) * Math.PI / 2);
        if (hs.h > 8 || r() < .5) ANT.add(hs.x + hs.hx * .55, top, hs.z - hs.hz * .5, r() * 6);
        if (hs.h > 10) TANK.add(hs.x - hs.hx * .45, top, hs.z + hs.hz * .4, 0, .8);
        else if (hs.m === 'beton' || hs.m === 'metal') for (var sp = 0; sp < 3; sp++) SOLAR.add(hs.x - hs.hx * .4 + sp * 2.2 - 1, top, hs.z + hs.hz * .35, 0);
        if (hs.h > 6) HUT.add(hs.x + hs.hx * .35, top, hs.z + hs.hz * .35, 0, .9);
      } else { CHIM.add(hs.x + hs.hx * .45, top + .9, hs.z - hs.hz * .25, 0); }
      // devant la porte : auvent + enseigne néon (villes), jardinières
      var dx = hs.x + fx * (fD + .02), dz = hs.z + fz * (fD + .02);
      if (town) {
        AWN.add(dx, y + 3.1, dz, ry, 1, AWNC[i % AWNC.length]);
        if (hs.flat && signN < 40 && hs.m !== 'metal') { var sg = SIGNS[signN++ % SIGNS.length], mt = new T.MeshBasicMaterial({ map: neonTex(sg[0], sg[1]) }), sw = Math.min(fW * 1.6, 7), sm = new T.Mesh(new T.PlaneGeometry(sw, sw / 4), mt);
          sm.position.set(hs.x + fx * (fD + .2), y + Math.min(hs.h - 1, 4.6), hs.z + fz * (fD + .2)); sm.rotation.y = ry; S.add(sm);
          var lt = new T.PointLight(sg[1], 1.2, 9, 2); lt.position.set(hs.x + fx * (fD + 1.5), y + 4.3, hs.z + fz * (fD + 1.5)); if (signN <= 6) S.add(lt); }
        [-1, 1].forEach(function (sd) { var px = dx + fx * 1.2 + (fz ? sd * (fW - 1.2) : 0), pz = dz + fz * 1.2 + (fx ? sd * (fW - 1.2) : 0); if (r() < .7) PLANT.add(px, hgt(px, pz), pz, ry, .9); });
      }
    });

    // ---------- rues des villes ----------
    ctx.TOWNS.forEach(function (t, ti) {
      var R = t[3], kind = t[4];
      for (var n = 0; n < (kind === 'centre' ? 46 : 20); n++) {
        var a = r() * 6.283, d = R * (.35 + r() * .55), x = t[1] + Math.cos(a) * d, z = t[2] + Math.sin(a) * d, y = hgt(x, z);
        if (ctx.HOUSES.some(function (h) { return Math.abs(h.x - x) < h.hx + 2 && Math.abs(h.z - z) < h.hz + 2; })) continue;
        var q = r(), ry = a + Math.PI / 2;
        if (kind === 'centre' || kind === 'concess') { if (q < .3) BENCH.add(x, y, z, ry); else if (q < .5) BIN.add(x, y, z, 0, 1, r() < .5 ? '#2e6a3a' : '#3a4a8a'); else if (q < .62) HYD.add(x, y, z, ry); else if (q < .82) BOLL.add(x, y, z); else POT.add(x, y, z, r() * 6); }
        else if (kind === '2cv') { if (q < .35) BARREL.add(x, y, z, r() * 6, 1, ['#8a3a1a', '#3a5a8a', '#6a6a2a', '#9a2a2a'][n % 4]); else if (q < .6) TIRE.add(x, y, z, r() * 6); else if (q < .8) CRATE.add(x, y, z, r() * 6, .8 + r() * .4); else CONE.add(x, y, z); }
        else if (kind === 'garage') { if (q < .4) BARREL.add(x, y, z, r() * 6, 1, ['#d8202e', '#2a6aff', '#ffd23d'][n % 3]); else if (q < .7) CRATE.add(x, y, z, r() * 6, 1 + r() * .5); else CONE.add(x, y, z); }
        else { if (q < .4) HAY.add(x, y, z, r() * 6); else if (q < .7) CRATE.add(x, y, z, r() * 6, .7); else BARREL.add(x, y, z, 0, .9, '#7a4a2a'); }
      }
      if (kind === 'centre') {   // abribus, panneaux pub
        [[R * .62, 0], [-R * .62, 0], [0, R * .62]].forEach(function (q, k) { var x = t[1] + q[0], z = t[2] + q[1], ry = Math.atan2(q[0], q[1]); STOP.add(x, hgt(x, z), z, ry); col(x, z, 1.7, 1.7, 2.6); });
        var ADS = [['WALD ROYAL', 'TÉLÉCHARGE-LE'], ['FLUBB', 'LÉGENDAIRE EN BOUTIQUE'], ['LA WALD', 'ARRIVE EN MONTGOLFIÈRE']], BGS = [['#7a1fff', '#ff2bd6'], ['#ffb800', '#ff6a1a'], ['#0a1a4a', '#2de2ff']];
        ADS.forEach(function (ad, k) { var a = k / 3 * 6.283 + .5, x = t[1] + Math.cos(a) * (R * .82), z = t[2] + Math.sin(a) * (R * .82), y = hgt(x, z), g = new T.Group();
          var pole = new T.Mesh(GC8, dark); pole.scale.set(.3, 6, .3); pole.position.y = 3; g.add(pole); var bd = new T.Mesh(GB, dark); bd.scale.set(6.4, 3.4, .3); bd.position.y = 7.2; g.add(bd);
          var mat = new T.MeshBasicMaterial({ map: adTex(ad, BGS[k], '#fff') }); [-1, 1].forEach(function (sd) { var pl = new T.Mesh(new T.PlaneGeometry(6, 3), mat); pl.position.set(0, 7.2, sd * .16); if (sd < 0) pl.rotation.y = Math.PI; g.add(pl); });
          g.position.set(x, y, z); g.rotation.y = -a + Math.PI / 2; g.traverse(function (o) { if (o.isMesh) o.castShadow = true; }); S.add(g); col(x, z, .3, .3, 9); });
      }
      if (kind === 'garage') {   // conteneurs empilés + grue
        var CC = ['#c8302a', '#2a5ab8', '#2a8a4a', '#d89a20', '#7a2ab8', '#e8e8e8'];
        for (var c2 = 0; c2 < 10; c2++) { var x = t[1] - 12 + (c2 % 4) * 7, z = t[2] - 14 - Math.floor(c2 / 4) * 3.2, stack = c2 % 3 === 0 ? 2 : 1, y0 = hgt(x, z);
          for (var s2 = 0; s2 < stack; s2++) CONT.add(x, y0 + s2 * 2.6, z, 0, 1, CC[(c2 + s2) % CC.length]); col(x, z, 3, 1.25, stack * 2.6, y0); }
        var cr = new T.Group(), cy = M('#ffb800'); [[0, 9, 0, 1, 18, 1], [5, 18, 0, 14, .8, .8], [-3, 18, 0, 6, .8, .8], [-5, 16.5, 0, 2, 2, 2], [10, 14, 0, .05, 8, .05], [10, 9.8, 0, 1.2, .5, 1.2]].forEach(function (b) { var m = new T.Mesh(GB, b[3] < .1 ? dark : cy); m.position.set(b[0], b[1], b[2]); m.scale.set(b[3], b[4], b[5]); m.castShadow = true; cr.add(m); });
        cr.position.set(t[1] + 14, hgt(t[1] + 14, t[2] - 20), t[2] - 20); cr.rotation.y = .6; S.add(cr); col(t[1] + 14, t[2] - 20, .6, .6, 18);
      }
      if (kind === '2cv') { var wx = t[1] + 6, wz = t[2] + 28; TANK.add(wx, hgt(wx, wz), wz, 0, 2.2); col(wx, wz, 1.6, 1.6, 9); }
      if (kind === 'village') { for (var f2 = 0; f2 < 26; f2++) { var a2 = f2 / 26 * 6.283, x2 = t[1] + Math.cos(a2) * (R + 1), z2 = t[2] + Math.sin(a2) * (R + 1); if (ctx.nearRoad(x2, z2, 7)) continue; FENCE.add(x2, hgt(x2, z2), z2, -a2); } WELL.add(t[1] + 3, hgt(t[1] + 3, t[2] + 2), t[2] + 2, 0); col(t[1] + 3, t[2] + 2, .8, .8, 2); }
      if (kind === 'concess') { for (var f3 = 0; f3 < 8; f3++) { var a3 = f3 / 8 * 6.283, x3 = t[1] + Math.cos(a3) * (R - 3), z3 = t[2] + Math.sin(a3) * (R - 3); FLAG.add(x3, hgt(x3, z3), z3, -a3, 1, ['#ff2bd6', '#9b4dff', '#ff1f4b', '#ffd23d'][f3 % 4]); } }
    });

    // ---------- lampadaires le long des routes ----------
    ctx.ROADS.forEach(function (rd) { var a = ctx.TOWNS[rd[0]], b = ctx.TOWNS[rd[1]], L = Math.hypot(b[1] - a[1], b[2] - a[2]), ux = (b[1] - a[1]) / L, uz = (b[2] - a[2]) / L;
      for (var d = a[3] + 6; d < L - b[3] - 6; d += 26) { var sd = (Math.round(d / 26) % 2) ? 1 : -1, x = a[1] + ux * d - uz * 6.6 * sd, z = a[2] + uz * d + ux * 6.6 * sd; LAMP.add(x, hgt(x, z), z, Math.atan2(ux * sd, uz * sd)); } });

    [AC, TANK, ANT, SOLAR, HUT, AWN, LAMP, BENCH, BIN, HYD, BOLL, PLANT, STOP, CONE, BARREL, TIRE, CRATE, FENCE, HAY, CONT, FLAG, POT, WELL, CHIM].forEach(function (k) { k.flush(S, true); });
  } };
})();
