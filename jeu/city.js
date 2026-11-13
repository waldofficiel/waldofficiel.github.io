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
      im.frustumCulled = false; im.castShadow = shadow !== false && !pt.noShadow; im.receiveShadow = true; im.userData.kit = 1; scene.add(im); if (window.OPT) OPT.chunk(im);
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


  /* ---------- place centrale : pavage en rosace, fontaine à 2 vasques, statue de La Wald en or, jets d'eau, pigeons ---------- */
  var FX = { t: 0, jets: null, water: [], pig: [], pigG: null, fires: [] };
  function pavingTex() {
    var c = document.createElement('canvas'); c.width = c.height = 1024; var g = c.getContext('2d'), C = 512;
    g.fillStyle = '#d8cdb8'; g.fillRect(0, 0, 1024, 1024);
    var rings = [[60, '#b8a68a'], [140, '#e6dcc8'], [230, '#c9a87a'], [330, '#e2d6c0'], [430, '#b49870'], [512, '#ddd2bc']];
    for (var k = rings.length - 1; k >= 0; k--) { g.fillStyle = rings[k][1]; g.beginPath(); g.arc(C, C, rings[k][0], 0, 6.283); g.fill(); }
    for (var rr = 1; rr < rings.length; rr++) { var r0 = rings[rr - 1][0], r1 = rings[rr][0], n = Math.round(r1 / 9);   // dalles de chaque anneau
      for (var i = 0; i < n; i++) { var a0 = i / n * 6.283, a1 = (i + 1) / n * 6.283, sh = (i * 37 + rr * 11) % 7 / 7;
        g.fillStyle = 'rgba(' + (sh < .4 ? '0,0,0' : '255,255,255') + ',' + (.04 + sh * .06) + ')'; g.beginPath(); g.arc(C, C, r1 - 3, a0, a1); g.arc(C, C, r0 + 3, a1, a0, true); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(90,70,50,.45)'; g.lineWidth = 3; g.beginPath(); g.moveTo(C + Math.cos(a0) * r0, C + Math.sin(a0) * r0); g.lineTo(C + Math.cos(a0) * r1, C + Math.sin(a0) * r1); g.stroke(); }
      g.strokeStyle = 'rgba(90,70,50,.5)'; g.lineWidth = 4; g.beginPath(); g.arc(C, C, r0, 0, 6.283); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; g.beginPath(); g.arc(C, C, r0 + 3, 0, 6.283); g.stroke(); }
    g.fillStyle = '#b05a8a'; for (var st = 0; st < 8; st++) { var a = st / 8 * 6.283; g.save(); g.translate(C + Math.cos(a) * 280, C + Math.sin(a) * 280); g.rotate(a); g.beginPath(); g.moveTo(-34, 0); g.lineTo(0, -14); g.lineTo(34, 0); g.lineTo(0, 14); g.closePath(); g.fill(); g.restore(); }   // étoile en mosaïque
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 8; return t;
  }
  function stoneTex() { var c = document.createElement('canvas'); c.width = 256; c.height = 128; var g = c.getContext('2d'); g.fillStyle = '#e4dccb'; g.fillRect(0, 0, 256, 128);
    for (var y = 0; y < 4; y++) for (var x = -1; x < 5; x++) { var bx = x * 64 + (y % 2) * 32, by = y * 32, l = 78 + ((x * 7 + y * 3) % 5) * 3; g.fillStyle = 'hsl(40,22%,' + l + '%)'; g.fillRect(bx + 2, by + 2, 60, 28); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(bx + 2, by + 2, 60, 3); g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(bx + 2, by + 27, 60, 3); }
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.wrapS = t.wrapT = T.RepeatWrapping; return t; }
  function plaza(ctx, x0, z0) {
    var S = ctx.scene, y0 = ctx.hgt(x0, z0) + .02, G = new T.Group(); G.position.set(x0, y0, z0); S.add(G);
    var stone = new T.MeshPhongMaterial({ map: stoneTex(), shininess: 20, specular: '#333' }), stoneW = new T.MeshPhongMaterial({ color: '#efe8d8', shininess: 25, specular: '#444' }), gold = new T.MeshPhongMaterial({ color: '#ffc83a', shininess: 140, specular: '#fff4c0', emissive: '#4a3000' });
    function add(geo, m, x, y, z, sx, sy, sz, rx) { var o = new T.Mesh(geo, m); o.position.set(x, y, z); if (sx) o.scale.set(sx, sy, sz); if (rx) o.rotation.x = rx; o.castShadow = o.receiveShadow = true; G.add(o); return o; }
    var pave = new T.Mesh(new T.CircleGeometry(10, 64), new T.MeshLambertMaterial({ map: pavingTex() })); pave.rotation.x = -Math.PI / 2; pave.position.y = .03; pave.receiveShadow = true; G.add(pave);
    add(new T.TorusGeometry(10, .18, 8, 64), stoneW, 0, .05, 0, 1, 1, 1, Math.PI / 2);
    // bassin
    var basin = new T.CylinderGeometry(4.2, 4.4, .8, 48, 1, true); basin.scale(1, 1, 1); stone.map.repeat.set(10, 1); add(basin, stone, 0, .4, 0);
    add(new T.TorusGeometry(4.3, .22, 10, 64), stoneW, 0, .82, 0, 1, 1, 1, Math.PI / 2);
    add(new T.CylinderGeometry(4.2, 4.2, .1, 48), new T.MeshLambertMaterial({ color: '#3a6a7a' }), 0, .08, 0);
    // eau animée (ondulations, reflets) dans le bassin et la vasque
    var wm = new T.ShaderMaterial({ transparent: true, uniforms: { uT: { value: 0 } }, vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: 'uniform float uT; varying vec2 vP; void main(){ float r = length(vP); float w = sin(r * 6. - uT * 3.) * .5 + .5, w2 = sin(vP.x * 3. + uT * 1.7) * sin(vP.y * 3.4 - uT * 1.3);\n vec3 c = mix(vec3(.02, .3, .42), vec3(.15, .75, .9), w * .6 + w2 * .2); c += vec3(1.) * smoothstep(.82, 1., w + w2 * .3) * .55;\n gl_FragColor = vec4(c, .86);\n#include <tonemapping_fragment>\n#include <encodings_fragment>\n}' });
    FX.water.push(wm); wm.userData.noBatch = true; var w1 = new T.Mesh(new T.CircleGeometry(4.15, 48), wm); w1.rotation.x = -Math.PI / 2; w1.position.y = .62; G.add(w1);
    // colonne + vasque haute
    var col = [[.0, 0], [.95, .1], [.7, .5], [.55, 1.2], [.65, 1.9], [.9, 2.05], [0, 2.1]].map(function (q) { return new T.Vector2(q[0], q[1]); });
    add(new T.LatheGeometry(col, 24), stoneW, 0, .5, 0);
    var bowl = [[.3, 0], [1.4, .25], [2.1, .55], [2.2, .7], [2.0, .72], [1.3, .45], [.3, .3]].map(function (q) { return new T.Vector2(q[0], q[1]); });
    add(new T.LatheGeometry(bowl, 32), stoneW, 0, 2.55, 0); var w2m = new T.Mesh(new T.CircleGeometry(1.95, 32), wm); w2m.rotation.x = -Math.PI / 2; w2m.position.y = 3.2; G.add(w2m);
    add(new T.CylinderGeometry(.55, .75, .8, 16), stoneW, 0, 3.55, 0); add(new T.CylinderGeometry(.85, .85, .14, 20), gold, 0, 4.0, 0);
    // statue de La Wald en or
    if (window.buildPolo) { var car = window.buildPolo(T, { lite: true }); car.traverse(function (o) { if (o.isMesh) { o.material = gold; o.castShadow = true; } }); car.scale.setScalar(.38); car.position.set(0, 4.07, 0); car.rotation.set(0, .6, -.18); if (window.OPT) OPT.mergeLocal(car); G.add(car); FX.statue = car; car.userData.dyn = true; }
    var halo = new T.PointLight('#ffd23d', 1.5, 14, 2); halo.position.set(0, 6, 0); G.add(halo);
    // jets d'eau : gouttes instanciées qui suivent des paraboles (8 jets du bord vers le centre + la vasque qui déborde)
    var N = 360, drop = new T.InstancedMesh(new T.SphereGeometry(.07, 6, 4), new T.MeshBasicMaterial({ color: '#d8f6ff', transparent: true, opacity: .8 }), N); drop.frustumCulled = false; G.add(drop);
    FX.jets = { m: drop, n: N, o: new T.Object3D() };
    // bancs, arbres en bacs, parterres, lampadaires à globes
    var wood = new T.MeshLambertMaterial({ color: '#8a5a32' }), iron = new T.MeshLambertMaterial({ color: '#1e2228' }), globe = new T.MeshBasicMaterial({ color: '#fff2c8' });
    for (var b = 0; b < 8; b++) { var a = b / 8 * 6.283 + Math.PI / 8, bx = Math.cos(a) * 7.3, bz = Math.sin(a) * 7.3, gB = new T.Group(); gB.position.set(bx, 0, bz); gB.rotation.y = -a + Math.PI / 2; G.add(gB);
      if (b % 2) {   // banc
        [[0, .48, 0, 1.9, .07, .55], [0, .82, .26, 1.9, .42, .06]].forEach(function (q) { var o = new T.Mesh(T.BoxGeometry ? new T.BoxGeometry(1, 1, 1) : null, wood); o.position.set(q[0], q[1], q[2]); o.scale.set(q[3], q[4], q[5]); o.castShadow = true; gB.add(o); });
        [-.85, .85].forEach(function (sx) { var o = new T.Mesh(new T.BoxGeometry(.08, .48, .6), iron); o.position.set(sx, .24, 0); gB.add(o); });
      } else {   // bac à fleurs + arbre
        var pot = new T.Mesh(new T.CylinderGeometry(1.1, 1, .7, 20), stone); pot.position.y = .35; pot.castShadow = true; gB.add(pot);
        var soil = new T.Mesh(new T.CylinderGeometry(1.02, 1.02, .05, 20), new T.MeshLambertMaterial({ color: '#4a3020' })); soil.position.y = .68; gB.add(soil);
        if (window.NATURE) { var tg = NATURE.tree(T, b === 0 || b === 4 ? 'birch' : 'oak', 40 + b), tm = new T.Mesh(tg, new T.MeshLambertMaterial({ vertexColors: true })); tm.scale.setScalar(.55); tm.position.y = .6; tm.castShadow = true; gB.add(tm); }
        var fc = ['#ff4a8a', '#ffd23d', '#c77dff', '#ff7a3a', '#ffffff']; for (var f = 0; f < 14; f++) { var fa = f / 14 * 6.283, fl = new T.Mesh(new T.IcosahedronGeometry(.11, 0), new T.MeshLambertMaterial({ color: fc[f % fc.length] })); fl.position.set(Math.cos(fa) * .82, .78, Math.sin(fa) * .82); gB.add(fl); }
        ctx.PCOL.push({ x: x0 + bx, z: z0 + bz, hw: .9, hd: .9, y0: y0, h: .8 });
      }
      // lampadaire à globe entre chaque élément
      var la = a + Math.PI / 8, lx = Math.cos(la) * 9.2, lz = Math.sin(la) * 9.2, pole = new T.Mesh(new T.CylinderGeometry(.07, .12, 3.6, 8), iron); pole.position.set(lx, 1.8, lz); pole.castShadow = true; G.add(pole);
      var gl = new T.Mesh(new T.SphereGeometry(.28, 14, 10), globe); gl.position.set(lx, 3.75, lz); G.add(gl); var cap = new T.Mesh(new T.ConeGeometry(.3, .25, 12), iron); cap.position.set(lx, 4.08, lz); G.add(cap);
    }
    ctx.PCOL.push({ x: x0, z: z0, hw: 3.6, hd: 3.6, y0: y0, h: .85 }, { x: x0, z: z0, hw: .9, hd: .9, y0: y0, h: 4.5 });
    // pigeons
    var pg = new T.Group(), pb = new T.MeshLambertMaterial({ color: '#8a8f9a' }), pk = new T.MeshLambertMaterial({ color: '#e8a030' });
    var body = new T.SphereGeometry(.12, 8, 6), head = new T.SphereGeometry(.07, 8, 6);
    for (var k = 0; k < 10; k++) { var bird = new T.Group(), bd = new T.Mesh(body, pb); bd.scale.set(1.3, .9, .9); bird.add(bd); var hd = new T.Mesh(head, pb); hd.position.set(.15, .1, 0); bird.add(hd); var bk = new T.Mesh(new T.ConeGeometry(.025, .07, 5), pk); bk.rotation.z = -Math.PI / 2; bk.position.set(.24, .09, 0); bird.add(bk);
      var a2 = k / 10 * 6.283 + Math.random(), r2 = 5 + Math.random() * 1.5; bird.userData = { hx: Math.cos(a2) * r2, hz: Math.sin(a2) * r2, fly: 0, ph: Math.random() * 6 }; bird.position.set(bird.userData.hx, .12, bird.userData.hz); bird.rotation.y = Math.random() * 6; pg.add(bird); FX.pig.push(bird); }
    pg.userData.dyn = true; G.add(pg); FX.G = G;
  }
  window.CITY_FX = FX;
  window.CITY_UPDATE = function (t, dt, px, pz) {
    if (FX.mill) FX.mill.rotation.z = -t * 2.2; if (FX.mineWheel) FX.mineWheel.rotation.z = t * 1.5;
    FX.fires.forEach(function (f, i) { f.l.intensity = 1.3 + Math.sin(t * 13 + i) * .25 + Math.sin(t * 29) * .15; });
    if (!FX.G) return; FX.water.forEach(function (m) { m.uniforms.uT.value = t; });
    var J = FX.jets, o = J.o, k = 0;
    for (var i = 0; i < J.n; i++) { var jet = i % 12, ph = ((t * .8 + i * .137) % 1), x, y, z;
      if (jet < 8) { var a = jet / 8 * 6.283, r = 4.1 - ph * 3.1; x = Math.cos(a) * r; z = Math.sin(a) * r; y = .9 + ph * 2.6 - ph * ph * 2.4; }   // jets du bord vers la colonne
      else { var a2 = (i * 2.399) % 6.283, r2 = 2.15 + ph * .55; x = Math.cos(a2) * r2; z = Math.sin(a2) * r2; y = 3.25 - ph * ph * 2.6; }   // débord de la vasque
      o.position.set(x, y, z); var sc = jet < 8 ? 1 : .8; o.scale.set(sc, sc * 1.6, sc); o.updateMatrix(); J.m.setMatrixAt(k++, o.matrix); }
    J.m.instanceMatrix.needsUpdate = true;
    if (FX.statue) FX.statue.rotation.y = .6 + t * .25;
    var lx = px - FX.G.position.x, lz = pz - FX.G.position.z;
    FX.pig.forEach(function (b) { var u = b.userData, d = Math.hypot(lx - b.position.x, lz - b.position.z);
      if (u.fly <= 0 && d < 4.5) { u.fly = .01; u.vx = (b.position.x - lx) / d * 4; u.vz = (b.position.z - lz) / d * 4; }
      if (u.fly > 0) { u.fly += dt; b.position.x += u.vx * dt; b.position.z += u.vz * dt; b.position.y += dt * 5; b.rotation.y = Math.atan2(-u.vz, u.vx); b.children[0].scale.z = .9 + Math.abs(Math.sin(t * 30)) * 1.6;
        if (u.fly > 9) { u.fly = 0; b.position.set(u.hx, .12, u.hz); b.children[0].scale.z = .9; } }
      else { b.position.y = .12 + Math.max(0, Math.sin(t * 6 + u.ph)) * .02; b.children[1].position.y = .1 - Math.max(0, Math.sin(t * 4 + u.ph)) * .08; if (Math.sin(t * .7 + u.ph) > .98) b.rotation.y += dt * 3; } });
  };
  window.EXT_FURN = window.EXT_FURN || [];
  window.CITY = { build: function (THREE, ctx) {
    T = THREE; var S = ctx.scene, hgt = ctx.hgt, r = rng(77), H = ctx.H || 3.2, DES = ctx.DES, PCOL = ctx.PCOL || [];
    GB = new T.BoxGeometry(1, 1, 1); GC = new T.CylinderGeometry(.5, .5, 1, 14); GC8 = new T.CylinderGeometry(.5, .5, 1, 8); GS = new T.SphereGeometry(.5, 12, 8);
    var steel = P('#9aa2ae'), dark = M('#2a2d34'), white = M('#e8eaee'), concrete = M('#b8b4ac'), glow = new T.MeshBasicMaterial({ color: '#fff4c8' });
    function col(x, z, hw, hd, h, y0) { PCOL.push({ x: x, z: z, hw: hw, hd: hd, y0: y0 == null ? hgt(x, z) : y0, h: h }); }

    // ---------- kits ----------
    var AC = new Kit([part(GB, M('#c8ccd2'), [0, .45, 0], [1.3, .9, 1]), part(GC, dark, [.15, .91, 0], [.8, .04, .8]), part(GC8, M('#555a62'), [.15, .93, 0], [.25, .04, .25]), part(GB, dark, [-.66, .3, 0], [.05, .4, .6])]);
    var TANK = new Kit([part(GC, M('#c48a52'), [0, 2.4, 0], [2.2, 2, 2.2]), part(GC, M('#6a4a2a'), [0, 1.9, 0], [2.24, .08, 2.24]), part(GC, M('#6a4a2a'), [0, 2.9, 0], [2.24, .08, 2.24]), part(new T.ConeGeometry(1.25, .7, 14), M('#a83a2a'), [0, 3.75, 0]), part(GB, dark, [.7, 1, .7], [.12, 2, .12]), part(GB, dark, [-.7, 1, .7], [.12, 2, .12]), part(GB, dark, [.7, 1, -.7], [.12, 2, .12]), part(GB, dark, [-.7, 1, -.7], [.12, 2, .12]), part(GB, dark, [0, 1.4, 0], [1.5, .08, .08])]);
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
    var BTANK = new Kit([part(GC, M('#2a6ad8'), [0, .55, 0], [1.1, 1.1, 1.1]), part(GC, M('#1a4aa8'), [0, 1.12, 0], [.6, .08, .6])]);
    var REBAR = new Kit([part(GC8, M('#6a4a3a'), [0, .5, 0], [.05, 1, .05]), part(GC8, M('#6a4a3a'), [.12, .45, 0], [.05, .9, .05])]);
    var LINE = new Kit([part(GC8, dark, [-2, .9, 0], [.06, 1.8, .06]), part(GC8, dark, [2, .9, 0], [.06, 1.8, .06]), part(GB, dark, [0, 1.75, 0], [4, .02, .02]), part(GB, M('#ff4a6a', { side: T.DoubleSide }), [-1.2, 1.45, 0], [.6, .6, .02]), part(GB, M('#ffd23d', { side: T.DoubleSide }), [-.2, 1.4, 0], [.5, .7, .02]), part(GB, M('#3aa8ff', { side: T.DoubleSide }), [.8, 1.5, 0], [.7, .5, .02])]);
    var glassR = new T.MeshPhongMaterial({ color: '#cfefff', transparent: true, opacity: .35, shininess: 120 });
    var ORE = new Kit([part(new T.ConeGeometry(1, 1, 7), M('#a8482a'), [0, .5, 0], [1.6, 1, 1.6]), part(GS, M('#7a3420'), [.5, .2, .3], [.6, .4, .6])]);
    var LOGS = new Kit([part(GC, M('#8a5a32'), [0, .25, 0], [.5, 2.4, .5], [0, 0, Math.PI / 2]), part(GC, M('#7a4a28'), [0, .25, .5], [.5, 2.4, .5], [0, 0, Math.PI / 2]), part(GC, M('#9a6a3a'), [0, .68, .25], [.5, 2.4, .5], [0, 0, Math.PI / 2])]);
    var PALM = new Kit([part(GC8, M('#8a6a42'), [0, 2.5, 0], [.32, 5, .32], [0, 0, .06]), part(GS, M('#6a4a2a'), [.15, 5.1, 0], [.6, .5, .6])].concat([0, 1, 2, 3, 4, 5, 6].map(function (i) { var a = i / 7 * 6.283; return part(GB, M('#3aa83a', { side: T.DoubleSide }), [.15 + Math.cos(a) * 1.3, 4.95, Math.sin(a) * 1.3], [2.8, .05, .55], [0, -a, -.3]); })));
    var TENT = new Kit([part(new T.ConeGeometry(1.6, 2, 4), M('#ffffff', { side: T.DoubleSide }), [0, 1, 0], [1, 1, 1.3], [0, Math.PI / 4, 0], { tint: 1 }), part(GB, M('#3a2a1a'), [0, .6, 1.12], [.7, 1.1, .05])]);
    var FIRE = new Kit([part(GC8, M('#6a6a66'), [0, .12, 0], [1.6, .24, 1.6]), part(GC8, M('#4a2a14'), [0, .3, 0], [.15, 1.2, .15], [0, 0, 1.2]), part(GC8, M('#4a2a14'), [0, .3, 0], [.15, 1.2, .15], [1.2, 0, 0]),
      part(new T.ConeGeometry(.4, 1.2, 7), new T.MeshBasicMaterial({ color: '#ff8a2a' }), [0, .8, 0], null, null, { noShadow: true }), part(new T.ConeGeometry(.22, .8, 7), new T.MeshBasicMaterial({ color: '#ffe06a' }), [0, .7, 0], null, null, { noShadow: true })]);
    var PICNIC = new Kit([part(GB, M('#8a5a32'), [0, .75, 0], [2, .08, .9]), part(GB, M('#8a5a32'), [0, .45, .75], [2, .06, .35]), part(GB, M('#8a5a32'), [0, .45, -.75], [2, .06, .35]), part(GB, M('#5e3c20'), [-.8, .38, 0], [.08, .76, 1.8]), part(GB, M('#5e3c20'), [.8, .38, 0], [.08, .76, 1.8])]);
    var RAILT = new Kit([part(GB, M('#6a4a2a'), [0, .05, 0], [1.4, .1, .22]), part(GB, M('#7a7a80'), [-.45, .14, 0], [.06, .08, 1.25]), part(GB, M('#7a7a80'), [.45, .14, 0], [.06, .08, 1.25])]);
    var CART = new Kit([part(GB, M('#6a6a70'), [0, .75, 0], [1.1, .7, 1.5]), part(new T.ConeGeometry(.6, .5, 6), M('#a8482a'), [0, 1.3, 0], [1, 1, 1.3]), part(GC, dark, [.55, .25, .45], [.4, .1, .4], [0, 0, Math.PI / 2]), part(GC, dark, [-.55, .25, .45], [.4, .1, .4], [0, 0, Math.PI / 2]), part(GC, dark, [.55, .25, -.45], [.4, .1, .4], [0, 0, Math.PI / 2]), part(GC, dark, [-.55, .25, -.45], [.4, .1, .4], [0, 0, Math.PI / 2])]);
    var PUMP = new Kit([part(GB, M('#e8e8ee'), [0, .9, 0], [.8, 1.8, .55]), part(GB, M('#d8202e'), [0, 1.65, 0], [.82, .3, .57]), part(GB, M('#1a1a20'), [0, 1.2, .28], [.5, .35, .02]), part(GB, M('#2a2a30'), [0, .08, 0], [1.2, .16, .9])]);
    var LOUNGE = new Kit([part(GB, white, [0, .3, 0], [.7, .1, 1.9]), part(GB, white, [0, .55, -.85], [.7, .5, .08], [-.6, 0, 0]), part(GB, M('#2ab8f0'), [0, .37, .1], [.65, .06, 1.4])]);
    var GOLDF = new Kit([part(GB, P('#ffc83a', { emissive: '#3a2400' }), [0, 1.2, 0], [3.4, .1, .1]), part(GB, P('#ffc83a', { emissive: '#3a2400' }), [0, .3, 0], [3.4, .1, .1])].concat([-1.5, -.9, -.3, .3, .9, 1.5].map(function (x) { return part(GC8, P('#ffc83a', { emissive: '#3a2400' }), [x, .8, 0], [.08, 1.6, .08]); })));
    var PARASOL = new Kit([part(GC8, M('#e8e8ee'), [0, 1.2, 0], [.07, 2.4, .07]), part(new T.ConeGeometry(1.5, .55, 10, 1, true), M('#ffffff', { side: T.DoubleSide }), [0, 2.35, 0], null, null, { tint: 1 }), part(GC8, M('#e8e8ee'), [0, .05, 0], [.5, .1, .5])]);
    var CHIM = new Kit([part(GB, M('#8a4a3a'), [0, .7, 0], [.6, 1.4, .6]), part(GB, dark, [0, 1.42, 0], [.7, .08, .7])]);

    // ---------- bâtiments ----------
    var SIGNS = DES ? [['MIRAGE CAFÉ', '#ff2bd6'], ['OASIS BURGER', '#ffb02a'], ['HÔTEL DUNE', '#2de2ff'], ['TURBO GYM', '#7dff6a'], ['PIZZA SABLE', '#ff4a3a'], ['NÉON BAR', '#c77dff']]
      : [['WALD BURGER', '#ff2bd6'], ['NÉON CAFÉ', '#2de2ff'], ['HÔTEL ROYAL', '#ffd23d'], ['TURBO GYM', '#7dff6a'], ['PIZZA ROYALE', '#ff4a3a'], ['CLUB VIOLET', '#c77dff'], ['PHARMACIE', '#3dff8a'], ['GARAGE W', '#ff8a2d']];
    var signN = 0, AWNC = ['#ff2bd6', '#9b4dff', '#ff1f4b', '#2de2ff', '#ffd23d'];
    function farmDecor(hs, y, top) {   // grange : boiseries blanches, portes ouvertes à croix, porte de grenier ; maison : porche, fenêtres à volets
      var wt = M('#f6f2e8'), rd = M('#b0302a'), gl = new T.MeshPhongMaterial({ color: '#8fd0ff', shininess: 90, specular: '#fff' }), sh = M('#2e5a3a');
      function bx(m, x, yy, z, sx, sy, sz, rx) { var o = new T.Mesh(GB, m); o.position.set(x, yy, z); o.scale.set(sx, sy, sz); if (rx) o.rotation.x = rx; o.castShadow = true; S.add(o); return o; }
      if (hs.barn) {
        [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (q) { bx(wt, hs.x + q[0] * (hs.hx + .05), y + hs.h / 2, hs.z + q[1] * (hs.hz + .05), .36, hs.h, .36); });
        [-1, 1].forEach(function (sd) { bx(wt, hs.x, top - .15, hs.z + sd * (hs.hz + .12), hs.hx * 2 + .4, .3, .1); bx(wt, hs.x + sd * (hs.hx + .12), top - .15, hs.z, .1, .3, hs.hz * 2 + .4); });
        var ex = hs.x + hs.hx + .2, dz;   // porte (côté est)
        [-1, 1].forEach(function (sd) { var zc = hs.z + sd * (1.3 + .78), g = new T.Group(); g.position.set(ex, y + 1.6, zc); S.add(g);
          [[0, 0, .1, 3.2, 1.56, rd], [0, 1.55, .14, .14, 1.6, wt], [0, -1.55, .14, .14, 1.6, wt], [0, 0, .14, 3.2, .14, wt, 0, .72], [0, 0, .14, 3.2, .14, wt, 0, -.72]].forEach(function (q) { var o = new T.Mesh(GB, q[5]); o.position.set(q[0], q[1], q[6] || 0); o.scale.set(q[2], q[3], q[4]); if (q[7]) o.position.z = q[7]; o.castShadow = true; g.add(o); });
          [.45, -.45].forEach(function (a) { var o = new T.Mesh(GB, wt); o.scale.set(.13, 3.4, .12); o.rotation.x = a; g.add(o); }); });
        bx(wt, ex, y + 3.3, hs.z, .14, .16, 2.9);
        var gy = top + 1.05, gx = hs.x + hs.hx; bx(wt, gx + .02, gy, hs.z, .1, 1.5, 1.7); bx(M('#3a1a12'), gx + .06, gy, hs.z, .1, 1.2, 1.4); bx(wt, gx + .09, gy, hs.z, .1, .1, 1.4); bx(wt, gx + .02, top + 2.35, hs.z, .12, .5, .12);
        bx(wt, hs.x - hs.hx - .02, gy, hs.z, .1, 1.3, 1.3); bx(M('#3a1a12'), hs.x - hs.hx - .06, gy, hs.z, .1, 1.0, 1.0);
      } else {
        var fz2 = hs.z + hs.hz, pd = 2.4;   // porche devant (côté sud)
        bx(M('#c8b8a0'), hs.x, y + .14, fz2 + pd / 2, hs.hx * 2 - .4, .28, pd); bx(wt, hs.x, y + 3.05, fz2 + pd / 2 + .1, hs.hx * 2, .14, pd + .5, .22);
        [-1, -.33, .33, 1].forEach(function (k) { bx(wt, hs.x + k * (hs.hx - .5), y + 1.55, fz2 + pd - .1, .18, 2.9, .18); });
        for (var k2 = -1; k2 <= 1; k2 += .25) if (Math.abs(k2) > .3) bx(wt, hs.x + k2 * (hs.hx - .5), y + .55, fz2 + pd - .1, .06, .8, .06); bx(wt, hs.x - hs.hx * .55, y + .95, fz2 + pd - .1, hs.hx - 1.5, .08, .08); bx(wt, hs.x + hs.hx * .55, y + .95, fz2 + pd - .1, hs.hx - 1.5, .08, .08);
        function win(x, z, nx, nz) { var px = nz ? 1 : 0, pz = nx ? 1 : 0; bx(wt, x + nx * .17, y + 1.8, z + nz * .17, px * 1.3 + .08, 1.5, pz * 1.3 + .08); bx(gl, x + nx * .2, y + 1.8, z + nz * .2, px * 1.0 + .06, 1.2, pz * 1.0 + .06);
          bx(wt, x + nx * .24, y + 1.8, z + nz * .24, px * 1.0 + .04, .07, pz * 1.0 + .04); [-1, 1].forEach(function (sd) { bx(sh, x + nx * .2 + px * sd * .9, y + 1.8, z + nz * .2 + pz * sd * .9, px * .5 + .05, 1.4, pz * .5 + .05); }); }
        win(hs.x - hs.hx * .55, fz2, 0, 1); win(hs.x + hs.hx * .55, fz2, 0, 1); win(hs.x - hs.hx * .5, hs.z - hs.hz, 0, -1); win(hs.x + hs.hx * .5, hs.z - hs.hz, 0, -1);
        [-1, 1].forEach(function (sd) { win(hs.x + sd * hs.hx, hs.z, sd, 0); });
      }
    }
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
        if (hs.fav) { if (r() < .75) BTANK.add(hs.x + (r() - .5) * (hs.hx - 1), top, hs.z + (r() - .5) * (hs.hz - 1), r() * 3); if (r() < .5) for (var rb = 0; rb < 4; rb++) REBAR.add(hs.x + (rb % 2 ? 1 : -1) * (hs.hx - .3), top, hs.z + (rb > 1 ? 1 : -1) * (hs.hz - .3), 0);
          if (r() < .4) LINE.add(hs.x, top, hs.z, r() < .5 ? 0 : 1.57, 1); }
        else if (hs.villa) { [[0, hs.hz, hs.hx * 2, .06], [0, -hs.hz, hs.hx * 2, .06], [hs.hx, 0, .06, hs.hz * 2], [-hs.hx, 0, .06, hs.hz * 2]].forEach(function (q) { var m = new T.Mesh(GB, glassR); m.position.set(hs.x + q[0], top + 1.1, hs.z + q[1]); m.scale.set(q[2], 1, q[3]); S.add(m); });
          for (var sp2 = 0; sp2 < 4; sp2++) SOLAR.add(hs.x - hs.hx * .5 + sp2 * 2.2, top, hs.z - hs.hz * .45, 0); }
        else {
        var nAC = Math.max(1, Math.round(hs.hx * hs.hz / 18)); for (var k = 0; k < nAC; k++) AC.add(hs.x + (r() - .5) * (hs.hx * 2 - 2.5), top, hs.z + (r() - .5) * (hs.hz * 2 - 2.5), (r() * 4 | 0) * Math.PI / 2);
        if (hs.h > 8 || r() < .5) ANT.add(hs.x + hs.hx * .55, top, hs.z - hs.hz * .5, r() * 6);
        if (hs.h > 10) TANK.add(hs.x - hs.hx * .45, top, hs.z + hs.hz * .4, 0, .8);
        else if (hs.m === 'beton' || hs.m === 'metal') for (var sp = 0; sp < 3; sp++) SOLAR.add(hs.x - hs.hx * .4 + sp * 2.2 - 1, top, hs.z + hs.hz * .35, 0);
        if (hs.h > 6) HUT.add(hs.x + hs.hx * .35, top, hs.z + hs.hz * .35, 0, .9);
        }
      } else if (!hs.barn) CHIM.add(hs.x + hs.hx * .45, top + .9, hs.z - hs.hz * .25, 0);
      if (hs.barn || hs.farmhouse) farmDecor(hs, y, top);
      // devant la porte : auvent + enseigne néon (villes), jardinières
      var dx = hs.x + fx * (fD + .02), dz = hs.z + fz * (fD + .02);
      // terrasses de café devant les immeubles des villes modernes (tables et chaises Kenney + parasol)
      var tw = ctx.TOWNS.filter(function (t) { return Math.hypot(hs.x - t[1], hs.z - t[2]) < t[3]; })[0];
      if (tw && hs.flat && !hs.fav && !hs.villa && (tw[4] === 'centre' || tw[4] === 'concess' || tw[4] === 'motel') && r() < .7) [-1, 1].forEach(function (sd) {
        var tx = dx + fx * 3.6 + (fz ? sd * Math.min(fW - 1.6, 4) : 0), tz = dz + fz * 3.6 + (fx ? sd * Math.min(fW - 1.6, 4) : 0);
        if (Math.hypot(tx - tw[1], tz - tw[2]) < 13 || ctx.HOUSES.some(function (h) { return Math.abs(h.x - tx) < h.hx + 1.8 && Math.abs(h.z - tz) < h.hz + 1.8; })) return;
        var ty = hgt(tx, tz); window.EXT_FURN.push(['tableRound', tx, ty, tz, 0]); [0, 2.1, 4.2].forEach(function (a) { window.EXT_FURN.push([r() < .5 ? 'chairCushion' : 'chair', tx + Math.sin(a) * 1.05, ty, tz + Math.cos(a) * 1.05, a + Math.PI]); });
        PARASOL.add(tx, ty, tz, r() * 6, 1, ['#ff2bd6', '#ffd23d', '#2de2ff', '#ff4a3a', '#7dff6a'][(i + (sd > 0 ? 1 : 0)) % 5]); col(tx, tz, .6, .6, .8); });
      if (town && !hs.barn && !hs.farmhouse && !hs.fav && !hs.villa) {
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
      for (var n = 0; n < (kind === 'centre' ? 60 : 32); n++) {
        var a = r() * 6.283, d = R * (.35 + r() * .55), x = t[1] + Math.cos(a) * d, z = t[2] + Math.sin(a) * d, y = hgt(x, z);
        if (ctx.HOUSES.some(function (h) { return Math.abs(h.x - x) < h.hx + 2 && Math.abs(h.z - z) < h.hz + 2; })) continue; if (kind === 'centre' && Math.hypot(x - t[1], z - t[2]) < 11.5) continue; if (kind === 'centre' && DES && z - t[2] > 20) continue;
        var q = r(), ry = a + Math.PI / 2;
        if (kind === 'centre' || kind === 'concess') { if (q < .3) BENCH.add(x, y, z, ry); else if (q < .5) BIN.add(x, y, z, 0, 1, r() < .5 ? '#2e6a3a' : '#3a4a8a'); else if (q < .62) HYD.add(x, y, z, ry); else if (q < .82) BOLL.add(x, y, z); else POT.add(x, y, z, r() * 6); }
        else if (kind === '2cv') { if (ctx.inField && (ctx.inField(x, z, 1.5) || ctx.onFarmPath(x - t[1], z - t[2], 2) || Math.hypot(x - t[1] + 4, z - t[2] - 38) < 4)) continue; if (n > 12) continue; if (q < .45) HAY.add(x, y, z, r() * 6); else if (q < .75) CRATE.add(x, y, z, r() * 6, .7 + r() * .3); else BARREL.add(x, y, z, r() * 6, .9, ['#7a4a2a', '#3a6a3a', '#8a3a1a'][n % 3]); }
        else if (kind === 'garage') { if (q < .4) BARREL.add(x, y, z, r() * 6, 1, ['#d8202e', '#2a6aff', '#ffd23d'][n % 3]); else if (q < .7) CRATE.add(x, y, z, r() * 6, 1 + r() * .5); else CONE.add(x, y, z); }
        else if (kind === 'mine') { if (q < .35) BARREL.add(x, y, z, r() * 6, 1, ['#8a3a1a', '#5a5a5a', '#9a6a2a'][n % 3]); else if (q < .7) CRATE.add(x, y, z, r() * 6, .8 + r() * .4); else ORE.add(x, y, z, r() * 6, .6 + r() * .6); }
        else if (kind === 'motel') { if (q < .35) CONE.add(x, y, z); else if (q < .6) BIN.add(x, y, z, 0, 1, '#c8302a'); else if (q < .8) HYD.add(x, y, z, ry); else BENCH.add(x, y, z, ry); }
        else if (kind === 'chalet') { if (q < .4) LOGS.add(x, y, z, r() * 6); else if (q < .7) CRATE.add(x, y, z, r() * 6, .7); else BENCH.add(x, y, z, ry); }
        else { if (q < .4) HAY.add(x, y, z, r() * 6); else if (q < .7) CRATE.add(x, y, z, r() * 6, .7); else BARREL.add(x, y, z, 0, .9, '#7a4a2a'); }
        col(x, z, .45, .45, .9);   // on ne traverse plus les caisses, tonneaux, bottes de foin…
      }
      if (kind === 'centre') { plaza(ctx, t[1], t[2]); }
      if (kind === 'centre') {   // abribus, panneaux pub
        (DES ? [[R * .45, -6], [-R * .45, -6], [0, -R * .55]] : [[R * .62, 0], [-R * .62, 0], [0, R * .62]]).forEach(function (q, k) { var x = t[1] + q[0], z = t[2] + q[1], ry = Math.atan2(q[0], q[1]); STOP.add(x, hgt(x, z), z, ry); col(x, z, 1.7, 1.7, 2.6); });
        var ADS = [['WALD ROYAL', 'TÉLÉCHARGE-LE'], ['FLUBB', 'LÉGENDAIRE EN BOUTIQUE'], ['LA WALD', 'ARRIVE EN MONTGOLFIÈRE']], BGS = [['#7a1fff', '#ff2bd6'], ['#ffb800', '#ff6a1a'], ['#0a1a4a', '#2de2ff']];
        ADS.forEach(function (ad, k) { var a = DES ? 3.5 + k * 1.1 : k / 3 * 6.283 + .5, x = t[1] + Math.cos(a) * (R * (DES ? .6 : .82)), z = t[2] + Math.sin(a) * (R * (DES ? .6 : .82)), y = hgt(x, z), g = new T.Group();
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
      if (kind === 'village') { for (var f2 = 0; f2 < 26; f2++) { var a2 = f2 / 26 * 6.283, x2 = t[1] + Math.cos(a2) * (R + 1), z2 = t[2] + Math.sin(a2) * (R + 1); if (ctx.nearRoad(x2, z2, 7)) continue; FENCE.add(x2, hgt(x2, z2), z2, -a2); } WELL.add(t[1] + 3, hgt(t[1] + 3, t[2] + 2), t[2] + 2, 0); col(t[1] + 3, t[2] + 2, .8, .8, 2); }
      if (kind === 'centre' && DES) {   // le mur de la favela (barbelés, tags), piscines et palmiers du quartier riche, héliport
        var wire = M('#3a3a40'), tagC = ['#ff2bd6', '#2de2ff', '#ffd23d', '#7dff6a', '#ff6a1a'];
        for (var wz = 27; wz < 86; wz += 1.5) { var wy = hgt(t[1], t[2] + wz) + 4.2; [[0, 0], [.25, .4]].forEach(function (q) { var m = new T.Mesh(GC8, wire); m.scale.set(.05, .9, .05); m.position.set(t[1] + q[0] - .1, wy + .45, t[2] + wz); S.add(m); }); }
        var coil = new T.Mesh(new T.CylinderGeometry(.3, .3, 58, 6, 1, true), new T.MeshBasicMaterial({ color: '#555', wireframe: true })); coil.rotation.x = Math.PI / 2; coil.position.set(t[1], hgt(t[1], t[2] + 56) + 4.6, t[2] + 56.5); S.add(coil);
        for (var tg = 0; tg < 6; tg++) { var tz = t[2] + 32 + tg * 9, cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; var g2 = cv.getContext('2d'); g2.font = '900 54px Arial Black, Arial'; g2.textAlign = 'center'; g2.lineWidth = 8; g2.strokeStyle = '#111';
          var txt = ['WALD', 'TOP 1', 'FAVELA', 'LIBRES', 'W', 'ROYAL'][tg]; g2.strokeText(txt, 128, 80); g2.fillStyle = tagC[tg % tagC.length]; g2.fillText(txt, 128, 80); var tx2 = new T.CanvasTexture(cv); tx2.encoding = T.sRGBEncoding;
          var pl = new T.Mesh(new T.PlaneGeometry(4, 2), new T.MeshBasicMaterial({ map: tx2, transparent: true })); pl.position.set(t[1] - .37, hgt(t[1], tz) + 1.6, tz); pl.rotation.y = -Math.PI / 2; S.add(pl); }
        var poolM = new T.MeshPhongMaterial({ color: '#2ab8f0', shininess: 140, specular: '#ffffff', transparent: true, opacity: .85 });
        [[26, 40], [58, 34], [34, 68]].forEach(function (v, i) { var px = t[1] + v[0], pz = t[2] + v[1] + 9.5, py = hgt(px, pz); var w = new T.Mesh(GB, poolM); w.position.set(px, py + .08, pz); w.scale.set(8, .1, 4); S.add(w);
          [[0, 2.2, 8.8, .5], [0, -2.2, 8.8, .5], [4.2, 0, .5, 4.4], [-4.2, 0, .5, 4.4]].forEach(function (q) { var m = new T.Mesh(GB, white); m.position.set(px + q[0], py + .1, pz + q[1]); m.scale.set(q[2], .2, q[3]); m.receiveShadow = true; S.add(m); });
          [-1, 1].forEach(function (sd) { PALM.add(px + sd * 6.5, hgt(px + sd * 6.5, pz), pz + 1, r() * 6, .9 + r() * .3); col(px + sd * 6.5, pz + 1, .3, .3, 5); BENCH.add(px + sd * 2, py, pz + 3.4, Math.PI, 1); }); });
        for (var pp = 0; pp < 8; pp++) { var a5 = .15 + pp / 8 * 1.25, x5 = t[1] + Math.cos(a5) * 84, z5 = t[2] + Math.sin(a5) * 84; if (z5 - t[2] < 22) continue; PALM.add(x5, hgt(x5, z5), z5, r() * 6, 1.1); col(x5, z5, .3, .3, 5); }
        for (var gf = 0; gf < 26; gf++) { var a6 = .28 + gf / 26 * 1.3, x6 = t[1] + Math.cos(a6) * 87, z6 = t[2] + Math.sin(a6) * 87; if (z6 - t[2] < 24 || x6 - t[1] < 3) continue; GOLDF.add(x6, hgt(x6, z6), z6, -a6); }
        var hx = t[1] + 66, hz = t[2] + 58, hp = new T.Mesh(GC, M('#54585e')); hp.position.set(hx, hgt(hx, hz) + .1, hz); hp.scale.set(14, .2, 14); hp.receiveShadow = true; S.add(hp);
        [[-1.3, 0, .6, 4.2], [1.3, 0, .6, 4.2], [0, 0, 2, .6]].forEach(function (q) { var m = new T.Mesh(GB, white); m.position.set(hx + q[0], hgt(hx, hz) + .22, hz + q[1]); m.scale.set(q[2], .04, q[3]); S.add(m); });
      }
      if (kind === 'chalet') {   // tentes, feu de camp, tas de bois, tables de pique-nique
        [[22, -10, .4], [-22, -12, -.5], [8, 30, 2.6]].forEach(function (q, i) { TENT.add(t[1] + q[0], hgt(t[1] + q[0], t[2] + q[1]), t[2] + q[1], q[2], 1, ['#e85a2a', '#2a8ae8', '#e8c22a'][i]); col(t[1] + q[0], t[2] + q[1], 1.2, 1.2, 1.6); });
        var fx2 = t[1] + 2, fz2 = t[2] + 6, fy = hgt(fx2, fz2); FIRE.add(fx2, fy, fz2, 0); var fl = new T.PointLight('#ff9a3a', 1.6, 12, 2); fl.position.set(fx2, fy + 1.2, fz2); S.add(fl); FX.fires.push({ l: fl, m: null });
        [0, 1.57, 3.14, 4.71].forEach(function (a) { LOGS.add(fx2 + Math.cos(a) * 2.6, fy, fz2 + Math.sin(a) * 2.6, a + 1.57, .8); });
        [[-12, -2], [12, 22]].forEach(function (q) { LOGS.add(t[1] + q[0], hgt(t[1] + q[0], t[2] + q[1]), t[2] + q[1], 0, 1.3); col(t[1] + q[0], t[2] + q[1], 1.6, .8, 1); });
        for (var pt = 0; pt < 3; pt++) { var px2 = t[1] - 14 + pt * 6, pz2 = t[2] + 32; PICNIC.add(px2, hgt(px2, pz2), pz2, .3 * pt); }
        var sign = new T.Mesh(new T.PlaneGeometry(6, 1.5), new T.MeshBasicMaterial({ map: neonTex('LODGE DES PINS', '#ffb02a', 1024) })); sign.position.set(t[1], hgt(t[1], t[2] - 2) + 4.6, t[2] - 6.85); sign.rotation.y = 0; S.add(sign);
      }
      if (kind === 'mine') {   // chevalement, rails, wagonnets, entrée de mine dans la roche
        var hf = new T.Group(), timber = M('#7a5432'), hy = hgt(t[1] - 2, t[2] + 2); hf.position.set(t[1] - 2, hy, t[2] + 2); S.add(hf);
        [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (q) { var m = new T.Mesh(GB, timber); m.scale.set(.4, 12, .4); m.position.set(q[0] * 2.2, 6, q[1] * 2.2); m.rotation.set(-q[1] * .08, 0, q[0] * .08); hf.add(m); });
        for (var lv = 1; lv < 4; lv++) [[0, 2.2, 4.4, .25], [0, -2.2, 4.4, .25], [2.2, 0, .25, 4.4], [-2.2, 0, .25, 4.4]].forEach(function (q) { var m = new T.Mesh(GB, timber); m.position.set(q[0] * (1 - lv * .06), lv * 3, q[1] * (1 - lv * .06)); m.scale.set(q[2], .25, q[3]); hf.add(m); });
        var wheel = new T.Mesh(new T.TorusGeometry(1.6, .12, 8, 28), M('#3a3a40')); wheel.position.set(0, 12.6, 0); hf.add(wheel); FX.mineWheel = wheel; wheel.userData.dyn = true;
        for (var sk = 0; sk < 6; sk++) { var m = new T.Mesh(GB, M('#3a3a40')); m.scale.set(.08, 3.1, .08); m.rotation.z = sk / 6 * Math.PI; wheel.add(m); }
        hf.traverse(function (o) { if (o.isMesh) o.castShadow = true; }); col(t[1] - 2, t[2] + 2, 2.4, 2.4, 12);
        var ex = t[1] - 22, ez = t[2] + 20, ey = hgt(ex, ez), mound = new T.Mesh(new T.SphereGeometry(1, 14, 8, 0, 6.283, 0, Math.PI / 2), M('#a0583a')); mound.scale.set(11, 8, 9); mound.position.set(ex - 6, ey - .5, ez + 4); mound.castShadow = mound.receiveShadow = true; S.add(mound); col(ex - 6, ez + 4, 8, 6, 7);
        var hole = new T.Mesh(GB, M('#0a0806')); hole.scale.set(3.2, 3.4, .3); hole.position.set(ex + 2.6, ey + 1.7, ez - 1.2); hole.rotation.y = -.8; S.add(hole);
        [[-1.7, 0], [1.7, 0]].forEach(function (q) { var m = new T.Mesh(GB, timber); m.scale.set(.35, 3.8, .35); m.position.set(ex + 2.6 + q[0] * .7, ey + 1.9, ez - 1.2 - q[0] * .7); S.add(m); });
        var lintel = new T.Mesh(GB, timber); lintel.scale.set(4.2, .4, .4); lintel.position.set(ex + 2.6, ey + 3.8, ez - 1.2); lintel.rotation.y = -.8; S.add(lintel);
        var rx0 = ex + 4, rz0 = ez - 3, rx1 = t[1] + 4, rz1 = t[2] - 2, rl = Math.hypot(rx1 - rx0, rz1 - rz0), ra = Math.atan2(rx1 - rx0, rz1 - rz0);
        for (var rs = 0; rs < rl; rs += 1.2) { var x7 = rx0 + Math.sin(ra) * rs, z7 = rz0 + Math.cos(ra) * rs; RAILT.add(x7, hgt(x7, z7), z7, ra); }
        [.3, .55, .8].forEach(function (f) { var x8 = rx0 + Math.sin(ra) * rl * f, z8 = rz0 + Math.cos(ra) * rl * f; CART.add(x8, hgt(x8, z8), z8, ra); col(x8, z8, .8, .8, 1.4); });
        [[16, 4], [-6, -22], [24, -4]].forEach(function (q) { ORE.add(t[1] + q[0], hgt(t[1] + q[0], t[2] + q[1]), t[2] + q[1], r() * 6, 1.4); col(t[1] + q[0], t[2] + q[1], 1.2, 1.2, 1.4); });
      }
      if (kind === 'motel') {   // station-service, enseigne néon géante, piscine
        var gx = t[1] + 10, gz = t[2] + 12, gy = hgt(gx, gz); [[-5, -3], [5, -3], [-5, 3], [5, 3]].forEach(function (q) { var m = new T.Mesh(GB, white); m.scale.set(.5, 4.6, .5); m.position.set(gx + q[0], gy + 2.3, gz + q[1]); m.castShadow = true; S.add(m); col(gx + q[0], gz + q[1], .3, .3, 4.6); });
        var roof = new T.Mesh(GB, M('#d8202e')); roof.scale.set(13, .7, 9); roof.position.set(gx, gy + 4.9, gz); roof.castShadow = true; S.add(roof); var rl2 = new T.Mesh(GB, new T.MeshBasicMaterial({ color: '#fff4c8' })); rl2.scale.set(12, .05, 8); rl2.position.set(gx, gy + 4.53, gz); S.add(rl2);
        [-2.5, 2.5].forEach(function (dx) { PUMP.add(gx + dx, gy, gz, 0); col(gx + dx, gz, .5, .4, 1.8); });
        var pole = new T.Mesh(GC8, dark); pole.scale.set(.5, 10, .5); pole.position.set(t[1] - 26, hgt(t[1] - 26, t[2] - 6) + 5, t[2] - 6); S.add(pole); col(t[1] - 26, t[2] - 6, .3, .3, 10);
        var ns = new T.Group(); [-1, 1].forEach(function (sd) { var pl = new T.Mesh(new T.PlaneGeometry(7, 1.75), new T.MeshBasicMaterial({ map: neonTex('MOTEL NÉON', '#ff2bd6', 1024) })); pl.position.z = sd * .2; if (sd < 0) pl.rotation.y = Math.PI; ns.add(pl); });
        var nb = new T.Mesh(GB, dark); nb.scale.set(7.4, 2, .3); ns.add(nb); ns.position.set(t[1] - 26, hgt(t[1] - 26, t[2] - 6) + 10.5, t[2] - 6); ns.rotation.y = .5; S.add(ns);
        var nl = new T.PointLight('#ff2bd6', 1.4, 14, 2); nl.position.set(t[1] - 24, hgt(t[1] - 26, t[2] - 6) + 8, t[2] - 4); S.add(nl);
        var px3 = t[1] - 14, pz3 = t[2] + 12.5, py3 = hgt(px3, pz3), pw = new T.Mesh(GB, new T.MeshPhongMaterial({ color: '#2ab8f0', shininess: 140, specular: '#fff', transparent: true, opacity: .85 })); pw.position.set(px3, py3 + .08, pz3); pw.scale.set(8, .1, 5); S.add(pw);
        [[-4.3, 0, .6, 5.6], [4.3, 0, .6, 5.6], [0, 2.8, 9.2, .6], [0, -2.8, 9.2, .6]].forEach(function (q) { var m = new T.Mesh(GB, white); m.position.set(px3 + q[0], py3 + .12, pz3 + q[1]); m.scale.set(q[2], .24, q[3]); S.add(m); });
        [-2, 0, 2].forEach(function (dx) { LOUNGE.add(px3 + dx, py3, pz3 - 4.4, 0); });
      }
      if (kind === 'concess') { for (var f3 = 0; f3 < 8; f3++) { var a3 = f3 / 8 * 6.283, x3 = t[1] + Math.cos(a3) * (R - 3), z3 = t[2] + Math.sin(a3) * (R - 3); FLAG.add(x3, hgt(x3, z3), z3, -a3, 1, ['#ff2bd6', '#9b4dff', '#ff1f4b', '#ffd23d'][f3 % 4]); } }
    });

    // ---------- la ferme : champs, silos, éolienne, tracteur, épouvantails, clôtures ----------
    if (ctx.FARM) (function () {
      var F = ctx.FARM, rf = rng(404), wood = M('#8a5a32'), woodD = M('#5e3c20'), red = M('#b8322a'), whiteT = M('#f4f0e6'), black = M('#1c1c1e'), yel = M('#ffd23d'), trG = M('#2f9e3c');
      var leafM = M('#5fae34', { side: T.DoubleSide });
      var CORN = new Kit([part(GC8, M('#4f9a2a'), [0, 1.1, 0], [.09, 2.2, .09]), part(GB, leafM, [.3, .85, 0], [.66, .03, .15], [0, 0, -.55]), part(GB, leafM, [-.28, 1.3, 0], [.62, .03, .14], [0, 0, .6]),
        part(GB, leafM, [0, 1.65, .26], [.13, .03, .58], [.55, 0, 0]), part(GB, M('#78c040', { side: T.DoubleSide }), [0, .5, -.28], [.12, .03, .6], [-.5, 0, 0]),
        part(GC8, M('#f2c230'), [.14, 1.32, 0], [.15, .42, .15], [0, 0, -.28]), part(new T.ConeGeometry(.12, .5, 5), M('#d8b860'), [0, 2.42, 0])]);
      var WHEAT = new Kit([part(new T.ConeGeometry(.45, 1, 7, 1, true), M('#d6ae44', { side: T.DoubleSide }), [0, .5, 0], [1, 1, 1], [Math.PI, 0, 0]), part(GS, M('#f0cd62'), [0, 1.02, 0], [.82, .24, .82])]);
      var PUMP = new Kit([part(GS, M('#ff8a1a'), [0, .34, 0], [.95, .64, .95]), part(GS, M('#ef7410'), [.24, .32, 0], [.52, .58, .74]), part(GS, M('#ef7410'), [-.24, .32, 0], [.52, .58, .74]),
        part(GC8, M('#5a6a22'), [0, .72, 0], [.08, .24, .08], [.3, 0, 0]), part(GS, M('#3f8a2a'), [.6, .07, .35], [.9, .12, .7]), part(GS, M('#4a9a30'), [-.5, .07, -.4], [.8, .12, .6])]);
      var CABB = new Kit([part(GS, M('#9ad874'), [0, .26, 0], [.55, .46, .55]), part(GS, M('#4f9a3a'), [0, .13, 0], [.95, .24, .95])]);
      var SCARE = new Kit([part(GB, woodD, [0, 1.15, 0], [.12, 2.3, .12]), part(GB, woodD, [0, 1.7, 0], [1.7, .1, .1]), part(GB, M('#3a6ab8'), [0, 1.42, 0], [.62, .72, .34]), part(GB, M('#c84a2a'), [.58, 1.66, 0], [.55, .24, .26]), part(GB, M('#c84a2a'), [-.58, 1.66, 0], [.55, .24, .26]),
        part(GB, M('#e8c25a'), [.93, 1.62, 0], [.16, .3, .12], [0, 0, .5]), part(GB, M('#e8c25a'), [-.93, 1.62, 0], [.16, .3, .12], [0, 0, -.5]), part(GS, M('#e8d6a0'), [0, 2.08, 0], [.44, .48, .44]), part(GS, black, [.1, 2.12, .2], [.07, .07, .04]), part(GS, black, [-.1, 2.12, .2], [.07, .07, .04]),
        part(GC, M('#c8a048'), [0, 2.29, 0], [.95, .04, .95]), part(new T.ConeGeometry(.25, .42, 10), M('#c8a048'), [0, 2.48, 0]), part(GB, M('#d8b45a'), [0, 1.07, 0], [.66, .14, .36])]);
      var siloM = new T.MeshLambertMaterial({ color: '#e6eaee', map: ribTex() }); siloM.map.wrapS = T.RepeatWrapping; siloM.map.repeat.set(6, 1);
      var SILO = new Kit([part(GC, siloM, [0, 6, 0], [4.8, 12, 4.8]), part(GC, red, [0, 2.6, 0], [4.88, .35, 4.88]), part(GC, red, [0, 8.6, 0], [4.88, .35, 4.88]), part(new T.SphereGeometry(.5, 18, 8, 0, 6.283, 0, Math.PI / 2), red, [0, 12, 0], [4.9, 3.4, 4.9]),
        part(GB, M('#5a5e66'), [-.3, 6.2, 2.44], [.07, 12.4, .07]), part(GB, M('#5a5e66'), [.3, 6.2, 2.44], [.07, 12.4, .07]), part(GC, M('#5a5e66'), [0, .25, 0], [5.2, .5, 5.2])]);
      var tp = [part(GB, trG, [0, 1.05, .55], [1.25, .85, 2.0]), part(GB, trG, [0, 1.15, -.95], [1.5, .8, 1.2]), part(GB, yel, [0, .62, .3], [1.0, .26, 3.0]), part(GB, black, [0, 1.0, 1.56], [1.0, .6, .05]),
        part(GS, M('#fff8d0', { emissive: '#fff0a0', emissiveIntensity: .4 }), [.42, 1.28, 1.56], [.2, .2, .1]), part(GS, M('#fff8d0', { emissive: '#fff0a0', emissiveIntensity: .4 }), [-.42, 1.28, 1.56], [.2, .2, .1]),
        part(GB, trG, [0, 2.85, -.95], [1.8, .1, 1.6]), part(GB, black, [0, 1.75, -1.15], [.6, .5, .5]), part(GC8, black, [.42, 2.0, 1.1], [.12, 1.2, .12]), part(GB, black, [0, 1.6, -.35], [.08, .7, .08], [-.5, 0, 0])];
      [[.75, -.35], [-.75, -.35], [.75, -1.5], [-.75, -1.5]].forEach(function (q) { tp.push(part(GB, black, [q[0], 2.2, q[1]], [.08, 1.3, .08])); });
      [-1, 1].forEach(function (sd) { tp.push(part(GC, black, [sd * 1.02, .88, -1.0], [1.76, .5, 1.76], [0, 0, Math.PI / 2]), part(GC, yel, [sd * 1.28, .88, -1.0], [.8, .04, .8], [0, 0, Math.PI / 2]), part(GC, black, [sd * .8, .46, 1.25], [.92, .34, .92], [0, 0, Math.PI / 2]), part(GC, yel, [sd * .98, .46, 1.25], [.42, .04, .42], [0, 0, Math.PI / 2]), part(GB, trG, [sd * 1.02, 1.55, -1.0], [.55, .1, 1.5])); });
      var TRAC = new Kit(tp);
      var RAIL = new Kit([part(GB, wood, [0, .5, 0], [3, .11, .07]), part(GB, wood, [0, .92, 0], [3, .11, .07]), part(GB, woodD, [-1.5, .55, 0], [.15, 1.15, .15])]);
      var BALE = new Kit([part(GB, M('#e2bf5c'), [0, .3, 0], [1.25, .6, .62]), part(GB, M('#b8943a'), [.3, .3, 0], [.04, .62, .64]), part(GB, M('#b8943a'), [-.3, .3, 0], [.04, .62, .64])]);
      var TROUGH = new Kit([part(GB, wood, [0, .4, 0], [2.4, .5, .8]), part(GB, M('#4a8ab8'), [0, .62, 0], [2.2, .05, .6])]);
      var X = F.x, Z = F.z;
      function hasPath(lx, lz, m) { return ctx.onFarmPath(lx, lz, m); }
      // cultures en rangs
      F.fields.forEach(function (f, fi) { var w = f[2], d = f[3], k = f[4], sx = k === 'mais' ? 1.2 : k === 'ble' ? .8 : k === 'citrouille' ? 2.4 : 1.2, sz = k === 'mais' ? .9 : k === 'ble' ? .8 : k === 'citrouille' ? 1.9 : 1.05;
        for (var lx = -w / 2 + .6; lx < w / 2 - .2; lx += sx) for (var lz = -d / 2 + sz / 2; lz < d / 2; lz += sz) { var px = f[0] + lx + (k === 'mais' ? 0 : (rf() - .5) * .25), pz = f[1] + lz + (rf() - .5) * .2; if (hasPath(px, pz, k === 'mais' ? 2 : 1.7)) continue;
          var x = X + px, z = Z + pz, y = hgt(x, z);
          if (k === 'mais') CORN.add(x, y, z, rf() * 6.283, .85 + rf() * .35); else if (k === 'ble') WHEAT.add(x, y, z, rf() * 6.283, .85 + rf() * .3); else if (k === 'citrouille') PUMP.add(x, y, z, rf() * 6.283, .8 + rf() * .6); else CABB.add(x, y, z, rf() * 6.283, .85 + rf() * .3); }
        // clôture en bois autour du champ (ouverte là où passe un chemin, plus une entrée)
        var per = [], gx = w / 2 + 1, gz = d / 2 + 1;
        for (var a = -gx + 1.5; a <= gx - 1.4; a += 3) { per.push([a, -gz, 0]); per.push([a, gz, 0]); }
        for (a = -gz + 1.5; a <= gz - 1.4; a += 3) { per.push([-gx, a, Math.PI / 2]); per.push([gx, a, Math.PI / 2]); }
        per.forEach(function (q, i) { if (i === 2 || hasPath(f[0] + q[0], f[1] + q[1], 2.2)) return; var x = X + f[0] + q[0], z = Z + f[1] + q[1]; RAIL.add(x, hgt(x, z), z, q[2]); });
        if (k !== 'ble') { var sx2 = X + f[0] + (fi % 2 ? 2 : -2), sz2 = Z + f[1] + 1; SCARE.add(sx2, hgt(sx2, sz2), sz2, rf() * 6.283); col(sx2, sz2, .2, .2, 2.4); } });
      // silos à côté de la grange
      [[-25.5, -18.5], [-25.5, -9.5]].forEach(function (q, i) { var x = X + q[0], z = Z + q[1]; SILO.add(x, hgt(x, z), z, i * 1.3, i ? .9 : 1); col(x, z, 2.3, 2.3, 14); });
      // tracteur garé dans la cour, foin, abreuvoir, château d'eau
      var tx = X + 3, tz = Z + 3; TRAC.add(tx, hgt(tx, tz), tz, .7); col(tx, tz, 1.3, 1.3, 2.6);
      [[-1, -19, 0], [-1, -17.6, 0], [.4, -18.3, 0], [-2.4, -18.3, 0]].forEach(function (q, i) { var x = X + q[0], z = Z + q[1]; BALE.add(x, hgt(x, z) + (i > 1 ? .6 : 0), z, q[2]); });
      col(X - 1, Z - 18.3, 1.6, 1.4, 1.2);
      [[-14, -14], [-16.5, -16], [-9, -11.5]].forEach(function (q) { var x = X + q[0], z = Z + q[1]; HAY.add(x, hgt(x, z), z, rf() * 3); });
      [[8, -3], [-6, 7], [26, -6]].forEach(function (q) { var x = X + q[0], z = Z + q[1]; HAY.add(x, hgt(x, z), z, rf() * 3); col(x, z, .6, .6, 1.2); });
      var trx = X - 2, trz = Z - 4; TROUGH.add(trx, hgt(trx, trz), trz, 1.57); col(trx, trz, .4, 1.2, .7);
      var wx = X + 31, wz = Z - 27; TANK.add(wx, hgt(wx, wz), wz, 0, 2.2); col(wx, wz, 1.6, 1.6, 9);
      // éolienne de ferme (roue à pales qui tourne)
      var mx = X - 4, mz = Z + 38, my = hgt(mx, mz), mill = new T.Group(), steelM = M('#a8b0ba'), Gm = new T.Group(); mill.position.set(mx, my, mz); S.add(mill);
      function beam(a, b, th, m) { var dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz), o = new T.Mesh(GB, m); o.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); o.scale.set(th, L, th); o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(dx / L, dy / L, dz / L)); o.castShadow = true; mill.add(o); }
      var HT = 11, B0 = 1.8, B1 = .35; [[1, 1], [1, -1], [-1, -1], [-1, 1]].forEach(function (q, i, A) { var n = A[(i + 1) % 4]; beam([q[0] * B0, 0, q[1] * B0], [q[0] * B1, HT, q[1] * B1], .14, steelM);
        for (var lv = 0; lv < 4; lv++) { var y0 = lv / 4 * HT, y1 = (lv + 1) / 4 * HT, r0 = B0 + (B1 - B0) * lv / 4, r1 = B0 + (B1 - B0) * (lv + 1) / 4; beam([q[0] * r0, y0, q[1] * r0], [n[0] * r1, y1, n[1] * r1], .06, steelM); beam([q[0] * r1, y1, q[1] * r1], [n[0] * r1, y1, n[1] * r1], .07, steelM); } });
      var plat = new T.Mesh(GB, woodD); plat.scale.set(1.4, .12, 1.4); plat.position.y = HT; mill.add(plat);
      var head = new T.Mesh(GC, M('#c8302a')); head.scale.set(.7, 1.1, .7); head.rotation.x = Math.PI / 2; head.position.set(0, HT + .6, .1); mill.add(head);
      var tail = new T.Mesh(GB, M('#c8302a')); tail.scale.set(.05, 1.3, 2.4); tail.position.set(0, HT + .8, -2.2); mill.add(tail); beam([0, HT + .6, -.4], [0, HT + .6, -1.4], .1, steelM);
      Gm.position.set(0, HT + .6, .8); mill.add(Gm); var bladeM = M('#f2f2ee', { side: T.DoubleSide });
      for (var bl = 0; bl < 14; bl++) { var bg = new T.Group(), b = new T.Mesh(GB, bl % 2 ? bladeM : M('#d83a30', { side: T.DoubleSide })); b.scale.set(.42, 1.7, .03); b.position.y = 1.55; b.rotation.y = .5; bg.add(b); bg.rotation.z = bl / 14 * 6.283; Gm.add(bg); }
      var ring = new T.Mesh(new T.TorusGeometry(2.35, .05, 6, 40), steelM); Gm.add(ring); var ring2 = new T.Mesh(new T.TorusGeometry(.75, .05, 6, 24), steelM); Gm.add(ring2);
      var hub = new T.Mesh(GC, M('#3a3a40')); hub.scale.set(.45, .4, .45); hub.rotation.x = Math.PI / 2; Gm.add(hub);
      mill.traverse(function (o) { if (o.isMesh) o.castShadow = true; }); FX.mill = Gm; Gm.userData.dyn = true; col(mx, mz, 1.9, 1.9, 4);
      [CORN, WHEAT, PUMP, CABB, SCARE, SILO, TRAC, RAIL, BALE, TROUGH].forEach(function (k) { k.flush(S, true); });
    })();

    // ---------- lampadaires le long des routes ----------
    (ctx.ROADP || []).forEach(function (pts) { var acc = 0, n = 0;
      for (var i = 1; i < pts.length; i++) { var dx = pts[i][0] - pts[i - 1][0], dz = pts[i][1] - pts[i - 1][1], L = Math.hypot(dx, dz) || 1; acc += L; if (acc < 26) continue; acc = 0; n++;
        var ux = dx / L, uz = dz / L, sd = n % 2 ? 1 : -1, x = pts[i][0] - uz * 6.8 * sd, z = pts[i][1] + ux * 6.8 * sd; if (ctx.inTown(x, z, 2) || ctx.nearRoad(x, z, 5.5)) continue; LAMP.add(x, hgt(x, z), z, Math.atan2(ux * sd, uz * sd)); } });
    [AC, TANK, ANT, SOLAR, HUT, AWN, LAMP, BENCH, BIN, HYD, BOLL, PLANT, STOP, CONE, BARREL, TIRE, CRATE, FENCE, HAY, CONT, FLAG, POT, WELL, CHIM, PARASOL, BTANK, REBAR, LINE, ORE, LOGS, PALM, TENT, FIRE, PICNIC, RAILT, CART, PUMP, LOUNGE, GOLDF].forEach(function (k) { k.flush(S, true); });
  } };
})();
