/* Wald Royal : skins cartoon (Wald Off, Flubb, Léa, Stan).
   window.buildSkin(THREE, id) -> { root, body, lL, lR, aL, aR, head, gunHold }
   Le perso regarde vers +x. Hanches à y = .95 (z ±.16), épaules à y = 1.55, tête à y = 1.86.
   Chaque groupe est fusionné par matériau pour garder peu d'appels de dessin. */
(function () {
  var T3 = null, GS = null, MC = {}, TX = {};
  function init(THREE) {
    if (T3) return; T3 = THREE;
    GS = new THREE.SphereGeometry(1, 26, 18);
  }
  function tex(key, w, h, draw, rx, ry) {
    if (TX[key]) return TX[key];
    var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    var t = new T3.CanvasTexture(c); t.encoding = T3.sRGBEncoding; t.wrapS = t.wrapT = T3.RepeatWrapping; t.repeat.set(rx || 1, ry || 1); t.anisotropy = 4; TX[key] = t; return t;
  }
  function M(col, o) {
    var k = col + JSON.stringify(o || {});
    if (!MC[k]) {
      var p = Object.assign({ color: col }, o || {}), shiny = p.shininess > 30;
      if (p.map) p.color = '#ffffff';
      var mt = new T3.MeshPhongMaterial(Object.assign({ specular: shiny ? '#333333' : '#161616', shininess: shiny ? p.shininess : 10 }, p));
      // liseré lumineux sur les bords (comme dans les jeux cartoon) : le perso ressort du décor
      mt.onBeforeCompile = function (sh) { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n float rimF = pow(1. - abs(dot(normalize(normal), normalize(vViewPosition))), 3.); totalEmissiveRadiance += (vec3(.18, .17, .2) + diffuseColor.rgb * .5) * rimF * .55;'); };
      mt.customProgramCacheKey = function () { return 'skinRim'; };
      MC[k] = mt;
    }
    return MC[k];
  }
  // matériaux texturés
  function pinstripe() { return { map: tex('pin', 128, 128, function (g, w, h) { g.fillStyle = '#3b3448'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(225,215,240,.55)'; for (var x = 4; x < w; x += 16) g.fillRect(x, 0, 2, h); }, 4, 1) }; }
  function checks() { return { map: tex('chk', 128, 128, function (g, w, h) { g.fillStyle = '#f1f1f1'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3a4050'; g.lineWidth = 3; for (var i = 0; i <= w; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); } for (var n = 0; n < 300; n++) { g.fillStyle = 'rgba(0,0,0,' + Math.random() * .08 + ')'; g.fillRect(Math.random() * w, Math.random() * h, 3, 1); } }, 3, 2) }; }
  function denim(col) { return { map: tex('den' + col, 64, 64, function (g, w, h) { g.fillStyle = col; g.fillRect(0, 0, w, h); for (var n = 0; n < 900; n++) { g.fillStyle = 'rgba(255,255,255,' + Math.random() * .12 + ')'; g.fillRect(Math.random() * w, Math.random() * h, 1, 2); } }, 3, 3) }; }
  function fun() { return { map: tex('fun', 128, 128, function (g, w, h) { g.fillStyle = '#ffd83a'; g.fillRect(0, 0, w, h); var cs = ['#2f6fe0', '#e23b3b', '#2fae4a', '#2f6fe0', '#e23b3b']; for (var n = 0; n < 22; n++) { g.fillStyle = cs[n % cs.length]; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 6 + Math.random() * 14, 5 + Math.random() * 10, Math.random() * 3, 0, 6.283); g.fill(); } }, 2, 1) }; }

  // primitives
  function place(m, par, x, y, z, rx, ry, rz) { m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, rz || 0); par.add(m); return m; }
  function S(par, sx, sy, sz, x, y, z, mt, rx, ry, rz) { var m = new T3.Mesh(GS, mt); m.scale.set(sx, sy, sz); return place(m, par, x, y, z, rx, ry, rz); }
  function C(par, rt, rb, h, x, y, z, mt, rx, ry, rz) { return place(new T3.Mesh(new T3.CylinderGeometry(rt, rb, h, 16), mt), par, x, y, z, rx, ry, rz); }
  function TO(par, r, tube, arc, x, y, z, mt, rx, ry, rz) { return place(new T3.Mesh(new T3.TorusGeometry(r, tube, 6, 22, arc || Math.PI * 2), mt), par, x, y, z, rx, ry, rz); }
  // membre arrondi vertical entre y1 et y2 (y1 > y2)
  function CAP(par, r, y1, y2, mt, x, z, r2) { x = x || 0; z = z || 0; r2 = r2 || r; C(par, r, r2, y1 - y2, x, (y1 + y2) / 2, z, mt); S(par, r, r, r, x, y1, z, mt); S(par, r2, r2, r2, x, y2, z, mt); }
  function TUBE(par, pts, r, mt, sg) { var cv = new T3.CatmullRomCurve3(pts.map(function (p) { return new T3.Vector3(p[0], p[1], p[2]); })); return par.add(new T3.Mesh(new T3.TubeGeometry(cv, sg || Math.max(14, pts.length * 3), r, 5, false), mt)); }

  // fusionne les meshes enfants directs d'un groupe, par matériau
  // fusionne TOUS les morceaux d'une partie du corps en un seul mesh (une géométrie avec des groupes, un matériau par groupe)
  function merge(g) {
    var kids = g.children.filter(function (o) { return o.isMesh; }); if (kids.length < 2) return;
    var mats = [], by = {}; kids.forEach(function (m) { var k = m.material.uuid; if (!by[k]) { by[k] = []; mats.push(m.material); } by[k].push(m); });
    var parts = [], groups = [], n = 0;
    mats.forEach(function (mt, mi) { var start = n; by[mt.uuid].forEach(function (m) { m.updateMatrix(); var geo = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); geo.applyMatrix4(m.matrix); parts.push(geo); n += geo.attributes.position.count; }); groups.push([start, n - start, mi]); });
    var pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), o = 0;
    parts.forEach(function (p) { pos.set(p.attributes.position.array, o * 3); nor.set(p.attributes.normal.array, o * 3); if (p.attributes.uv) uv.set(p.attributes.uv.array, o * 2); o += p.attributes.position.count; p.dispose(); });
    var mg = new T3.BufferGeometry(); mg.setAttribute('position', new T3.BufferAttribute(pos, 3)); mg.setAttribute('normal', new T3.BufferAttribute(nor, 3)); mg.setAttribute('uv', new T3.BufferAttribute(uv, 2));
    groups.forEach(function (q) { mg.addGroup(q[0], q[1], q[2]); }); mg.computeBoundingSphere();
    kids.forEach(function (m) { g.remove(m); }); var one = new T3.Mesh(mg, mats); one.name = 'bloc'; g.add(one);
  }
  // coque : morceau de sphère qui épouse la tête (cheveux, barbe). phi = 0 est l'arrière de la tête, theta = 0 le sommet
  function shell(par, rx, ry, rz, x, y, z, mt, ph0, phL, th0, thL) { var m = new T3.Mesh(new T3.SphereGeometry(1, 30, 20, ph0, phL, th0, thL), mt); m.scale.set(rx, ry, rz); return place(m, par, x, y, z); }
  function hairTex(key, base, dark, light) { return { map: tex(key, 256, 128, function (g, w, h) { g.fillStyle = base; g.fillRect(0, 0, w, h); for (var i = 0; i < 2600; i++) { var x = Math.random() * w, y = Math.random() * h, l = 2 + Math.random() * 5; g.strokeStyle = Math.random() < .5 ? dark : light; g.lineWidth = .8 + Math.random(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - .5) * 2, y + l); g.stroke(); } }, 3, 2) }; }
  // grosse chaîne en or façon gourmette, qui tombe sur le torse, avec un médaillon W
  function bigChain(par, gold) {
    var cv = new T3.CatmullRomCurve3([[-.13, 1.63, 0], [-.07, 1.635, .15], [.07, 1.6, .2], [.2, 1.5, .15], [.255, 1.4, .05], [.255, 1.4, -.05], [.2, 1.5, -.15], [.07, 1.6, -.2], [-.07, 1.635, -.15]].map(function (q) { return new T3.Vector3(q[0], q[1], q[2]); }), true);
    var N = 30, up = new T3.Vector3(), tg = new T3.Vector3(), q = new T3.Quaternion(), geo = new T3.TorusGeometry(.024, .009, 6, 12);
    for (var i = 0; i < N; i++) { var t = i / N, p = cv.getPointAt(t); cv.getTangentAt(t, tg); var m = new T3.Mesh(geo, gold); m.position.copy(p); q.setFromUnitVectors(new T3.Vector3(1, 0, 0), tg); m.quaternion.copy(q); m.rotateX(i % 2 ? Math.PI / 2 : 0); m.scale.set(1.25, 1, 1); par.add(m); }
    var med = new T3.Mesh(new T3.CylinderGeometry(.055, .055, .018, 24), gold); med.rotation.z = Math.PI / 2; med.position.set(.27, 1.34, 0); par.add(med);
    var w = new T3.Shape(); [[-.035, .025], [-.02, -.025], [-.006, .005], [.006, -.025]].forEach(function () {});
    var pts = [[-.04, .03], [-.025, .03], [-.016, -.008], [-.006, .018], [.006, .018], [.016, -.008], [.025, .03], [.04, .03], [.022, -.032], [.01, -.032], [0, -.006], [-.01, -.032], [-.022, -.032]];
    pts.forEach(function (p, k) { if (k) w.lineTo(p[0], p[1]); else w.moveTo(p[0], p[1]); }); w.closePath();
    var wg = new T3.ExtrudeGeometry(w, { depth: .008, bevelEnabled: false }); var wm = new T3.Mesh(wg, M('#16081f', { shininess: 80 })); wm.rotation.y = Math.PI / 2; wm.position.set(.281, 1.34, .0); par.add(wm);
    var bail = new T3.Mesh(new T3.TorusGeometry(.016, .006, 6, 10), gold); bail.position.set(.265, 1.405, 0); bail.rotation.y = Math.PI / 2; par.add(bail);
  }
  function rig() {
    var root = new T3.Group(), body = new T3.Group(); root.add(body);
    function limb(px, py, pz) { var p = new T3.Group(); p.position.set(px, py, pz); body.add(p); return p; }
    var r = { root: root, body: body, lL: limb(0, .95, -.13), lR: limb(0, .95, .13), aL: limb(0, 1.47, -.33), aR: limb(0, 1.47, .33), head: limb(0, 1.86, 0) };
    r.gunHold = limb(.45, 1.38, .26); return r;
  }
  function eachSide(f) { f(-1); f(1); }
  function chainLinks(par, cx, y, rx, rz, dip, link, tube, gold) {
    var n = 18; for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2, c = Math.cos(a); TO(par, link, tube, 0, cx + c * rx, y - Math.max(0, c) * dip, Math.sin(a) * rz, gold, i % 2 ? Math.PI / 2 : 0, -a, c > 0 ? .5 : 0); }
  }

  /* ---------- corps humain sculpté : torse tourné (épaules reliées), membres effilés, mains, chaussures ---------- */
  function lathe(par, prof, mt, sx, sz, gap, x) {   // prof = [[rayon, y], ...] ; gap = ouverture devant (gilet)
    var pts = prof.map(function (q) { return new T3.Vector2(q[0], q[1]); }), g = gap ? new T3.LatheGeometry(pts, 26, Math.PI / 2 + gap, Math.PI * 2 - gap * 2) : new T3.LatheGeometry(pts, 26);
    var m = new T3.Mesh(g, mt); m.scale.set(sx || .74, 1, sz || 1); m.position.x = x || 0; par.add(m); return m;
  }
  function seg(par, r1, r2, y1, y2, mt, x, z) { x = x || 0; z = z || 0; C(par, r1, r2, y1 - y2, x, (y1 + y2) / 2, z, mt); S(par, r2, r2, r2, x, y2, z, mt); }
  function hand(a, y, skin) { S(a, .055, .075, .065, .01, y, 0, skin); S(a, .035, .05, .045, .015, y - .07, 0, skin); S(a, .022, .04, .022, .05, y - .01, .045, skin, 0, 0, -.5); }
  function shoe(l, up, sole, acc, boot) {
    if (boot) C(l, .1, .095, .2, 0, -.76, 0, up);
    S(l, .16, .085, .105, .05, -.875, 0, up); S(l, .1, .08, .1, -.06, -.87, 0, up);
    C(l, .108, .108, .045, .03, -.935, 0, sole, 0, 0, 0); S(l, .19, .025, .11, .045, -.935, 0, sole);
    if (acc) S(l, .09, .045, .108, .02, -.86, 0, acc);
  }
  function arm(a, sleeve, skin, o) {   // o.len longueur de manche (0 = bras nu), o.cuff couleur de revers
    S(a, .1, .1, .1, 0, -.02, 0, sleeve || skin);
    if (o.len) { C(a, .1, .092, o.len, 0, -.02 - o.len / 2, 0, sleeve); if (o.stripe) C(a, .096, .096, .035, 0, -.08, 0, o.stripe); if (o.cuff) C(a, .097, .097, .05, 0, -.02 - o.len, 0, o.cuff); }
    seg(a, .07, .058, -.08, -.5, skin); S(a, .062, .062, .062, 0, -.27, 0, skin); hand(a, -.58, skin);
  }
  function leg(l, thigh, shin, o) {
    seg(l, .125, .1, .02, -.42, thigh); seg(l, .1, .075, -.42, -.78, shin || thigh);
    if (o && o.hem) { C(l, .118, .118, .06, 0, o.hemY, 0, o.hem); if (o.pipe) TO(l, .119, .008, 0, 0, o.hemY - .03, 0, o.pipe, Math.PI / 2); }
  }

  function curl(par, x, y, z, len, rad, turns, th, mt, ox, oz) {   // boucle de cheveux en tire-bouchon
    var pts = [], n = 18; for (var i = 0; i <= n; i++) { var t = i / n, a = t * turns * Math.PI * 2; pts.push([x + Math.cos(a) * rad + (ox || 0) * t, y - len * t, z + Math.sin(a) * rad + (oz || 0) * t]); }
    TUBE(par, pts, th, mt);
  }
  function laces(l, x0, mt) { for (var i = 0; i < 3; i++) S(l, .012, .008, .055, x0 + i * .04, -.8 - i * .022, 0, mt, 0, 0, .5); }
  var B = {};
  /* ---------- WALD OFF : bob, lunettes noires, bouc, t-shirt rouge, grosse chaîne, short à carreaux, baskets ---------- */
  B.wald = function (R) {
    var skin = M('#dc9a72'), red = M('#c8101c'), white = M('#f4f4f4'), navy = M('#1a2030'), hat = M('#0e121b'), cream = M('#efe8d8'), sole = M('#1c1c22'), beard = M('#5a3a26'), lip = M('#9a4a3a'),
      lens = M('#0c0d12', { shininess: 120, specular: '#8fa0ff' }), gold = M('#ffc22a', { shininess: 110, specular: '#fff3b0', emissive: '#3a2400' }), chk = M('#fff', checks()), pip = M('#e0303a'), socks = M('#f2f2f2');
    [R.lL, R.lR].forEach(function (l) { leg(l, chk, skin, { hem: navy, hemY: -.36, pipe: pip }); seg(l, .09, .085, -.22, -.36, chk); C(l, .08, .078, .1, 0, -.78, 0, socks); shoe(l, cream, sole, red); S(l, .06, .035, .106, .17, -.87, 0, navy); });
    lathe(R.body, [[0, .86], [.2, .87], [.245, .94], [.25, 1.02], [.0, 1.03]], chk); TO(R.body, .245, .018, 0, 0, 1.0, 0, navy, Math.PI / 2, 0, 0).scale.set(.74, 1, 1);
    lathe(R.body, [[0, .98], [.24, .99], [.245, 1.1], [.255, 1.24], [.28, 1.36], [.31, 1.45], [.3, 1.51], [.24, 1.57], [.13, 1.61], [0, 1.62]], red);
    C(R.body, .075, .085, .22, 0, 1.68, 0, skin); TO(R.body, .105, .018, 0, .0, 1.6, 0, red, Math.PI / 2, 0, 0).scale.set(1, 1.15, 1); bigChain(R.body, gold);
    [R.aL, R.aR].forEach(function (a) { arm(a, red, skin, { len: .2, stripe: white }); });
    var h = R.head;
    S(h, .27, .29, .27, -.01, .16, 0, skin); S(h, .23, .18, .235, .04, -.01, 0, skin); S(h, .06, .07, .09, .2, -.08, 0, skin);
    S(h, .045, .055, .045, .29, .1, 0, skin); S(h, .03, .025, .035, .3, .065, 0, skin);
    eachSide(function (s) { S(h, .035, .07, .05, -.01, .1, s * .27, skin); S(h, .012, .02, .02, -.005, .1, s * .3, skin); S(h, .03, .05, .1, .21, .2, s * .11, lens); });
    S(h, .055, .065, .07, .22, -.11, 0, beard); S(h, .025, .018, .1, .27, .03, 0, beard); S(h, .015, .01, .065, .275, -.01, 0, lip);
    S(h, .028, .02, .27, .23, .245, 0, navy); eachSide(function (s) { S(h, .035, .075, .1, .255, .19, s * .11, lens); C(h, .006, .006, .24, .12, .23, s * .27, navy, 0, 0, Math.PI / 2); });
    C(h, .25, .29, .24, -.01, .4, 0, hat); S(h, .25, .055, .25, -.01, .52, 0, hat); C(h, .295, .295, .055, -.01, .3, 0, navy); C(h, .31, .5, .09, -.01, .25, 0, hat);
    TO(h, .34, .008, 0, 0, .1, 0, navy, 0, Math.PI / 2, 0);
    [[R.lL, -1], [R.lR, 1]].forEach(function (q) { var l = q[0], sd = q[1]; S(l, .03, .19, .07, 0, -.17, sd * .1, navy); S(l, .012, .19, .012, .05, -.17, sd * .118, pip); S(l, .012, .19, .012, -.05, -.17, sd * .118, pip);
      C(l, .081, .081, .016, 0, -.745, 0, red); C(l, .081, .081, .01, 0, -.765, 0, navy); laces(l, .05, white); });
    var hairD = M('#2a1c14');
    var hairM = M('#fff', hairTex('hairW', '#2a1c14', '#120a06', '#4a3424')), beardM = M('#fff', hairTex('beardW', '#5a3a26', '#3a2214', '#7a5236'));
    shell(h, .283, .3, .283, -.01, .16, 0, hairM, -1.85, 3.7, .55, 1.25);   // cheveux courts : arrière et côtés de la tête, sous le bob
    shell(h, .238, .188, .243, .04, -.01, 0, beardM, Math.PI - 1.45, 2.9, 1.62, 1.15);   // barbe courte le long de la mâchoire
    eachSide(function (s2) { shell(h, .275, .29, .275, -.01, .16, 0, beardM, Math.PI / 2 * s2 + Math.PI - (s2 > 0 ? 1.0 : .25), .25, 1.45, .45); });   // pattes
    S(h, .025, .045, .025, .14, -.27, 0, navy); TO(h, .43, .005, 0, -.01, .265, 0, navy, Math.PI / 2); TO(h, .36, .005, 0, -.01, .27, 0, navy, Math.PI / 2);
    S(h, .035, .012, .06, .255, .275, 0, M('#3a3f4c'));
    return { skin: '#dc9a72', shirt: '#c8101c', pants: '#f1f1f1' };
  };
  /* ---------- FLUBB : blob jaune, gros yeux, gilet rayé ouvert, baskets multicolores ---------- */
  B.flubb = function (R) { R.EY = -.31;
    var y = M('#f5c518', { shininess: 55, specular: '#5a4a10' }), w = M('#ffffff', { shininess: 80 }), dark = M('#151515'), mouth = M('#7a3c10'), pin = M('#fff', Object.assign(pinstripe(), { side: T3.DoubleSide })), sh = M('#fff', fun()), cream = M('#f3ecd8'), irisB = M('#4a86c8'), irisH = M('#8a7a3a');
    R.lL.position.z = -.11; R.lR.position.z = .11; R.aL.position.set(0, 1.44, -.21); R.aR.position.set(0, 1.44, .21);
    [R.lL, R.lR].forEach(function (l) { seg(l, .06, .05, .05, -.42, y); seg(l, .05, .045, -.42, -.8, y); S(l, .055, .055, .055, 0, -.42, 0, y); shoe(l, sh, cream, null); });
    lathe(R.body, [[0, .84], [.17, .86], [.26, .96], [.285, 1.1], [.26, 1.25], [.21, 1.37], [.17, 1.47], [.11, 1.56], [.07, 1.66], [0, 1.68]], y, .9, 1);
    S(R.body, .012, .02, .02, .258, 1.08, 0, mouth); R.head.position.y = 1.6;
    lathe(R.body, [[.27, 1.06], [.305, 1.16], [.305, 1.27], [.28, 1.38], [.24, 1.48], [.19, 1.56], [.14, 1.61]], pin, .95, 1.05, .36);
    [R.aL, R.aR].forEach(function (a) { S(a, .05, .05, .05, 0, 0, 0, y); seg(a, .045, .04, 0, -.62, y); S(a, .045, .045, .045, 0, -.31, 0, y); S(a, .06, .085, .045, .02, -.69, 0, y); S(a, .018, .06, .018, .02, -.79, .025, y); S(a, .016, .05, .016, .03, -.77, -.02, y); });
    var h = R.head;
    S(h, .42, .36, .4, 0, .33, 0, y); S(h, .26, .22, .26, -.05, .52, -.2, y); S(h, .26, .2, .26, -.04, .54, .2, y); S(h, .25, .2, .25, .08, .58, 0, y); eachSide(function (s) { S(h, .22, .2, .22, .2, .17, s * .19, y); });
    eachSide(function (s) { S(h, .14, .14, .14, .34, .4, s * .15, w); S(h, .04, .065, .065, .465, .39, s * .15, s < 0 ? irisH : irisB); S(h, .02, .034, .034, .497, .39, s * .15, dark); });
    TO(h, .13, .026, Math.PI, .36, .17, 0, mouth, 0, Math.PI / 2, Math.PI); S(h, .03, .035, .04, .385, .05, .05, w);
    var lipD = M('#c88a10', { shininess: 55 }), tooth = M('#fffdf2', { shininess: 80 }), dk = M('#4a2a08');
    TUBE(h, [[.33, .22, -.25], [.39, .14, -.15], [.42, .18, -.05], [.425, .13, .05], [.4, .17, .15], [.34, .22, .25]], .028, dk);
    TUBE(h, [[.34, .25, -.24], [.4, .18, -.14], [.43, .22, -.04], [.435, .17, .06], [.41, .21, .16], [.35, .25, .24]], .03, lipD);
    TUBE(h, [[.35, .18, -.2], [.4, .09, -.1], [.425, .07, .02], [.41, .1, .13], [.36, .18, .2]], .03, lipD);
    S(h, .025, .04, .035, .425, .115, .02, tooth); S(h, .025, .035, .03, .42, .12, .085, tooth);
    eachSide(function (s2) { S(h, .15, .075, .15, .33, .47, s2 * .15, y, 0, 0, s2 * .1); });
    S(h, .2, .17, .22, -.18, .4, .18, y); S(h, .18, .16, .2, -.2, .42, -.2, y); S(h, .16, .12, .16, .05, .66, -.12, y);
    [R.aL, R.aR].forEach(function (a) { for (var f = 0; f < 4; f++) S(a, .014, .055, .014, .03 + (f % 2) * .01, -.8, -.03 + f * .02, y, 0, 0, -.15); });
    var btn = M('#1c1c22'); for (var bb = 0; bb < 3; bb++) S(R.body, .014, .014, .014, .27 - bb * .005, 1.4 - bb * .09, .1, btn);
    [R.lL, R.lR].forEach(function (l) { laces(l, .05, M('#ffd83a')); });
    return { skin: '#f5c518', shirt: '#3b3448', pants: '#f5c518' };
  };
  /* ---------- LÉA : cheveux bouclés, chemise blanche nouée, jupe en jean, boots noires ---------- */
  B.lea = function (R) {
    var skin = M('#eeb08a'), hair = M('#5a3424', { shininess: 40 }), wh = M('#f3efe8'), den = M('#fff', denim('#6d8fc4')), boot = M('#18181c', { shininess: 60 }), sole = M('#2a2a2e'), eyeW = M('#fff', { shininess: 90 }), iris = M('#5a3420'), dark = M('#111'), lip = M('#c4505c'), blush = M('#f39a9a'), gold = M('#ffc22a', { shininess: 110, specular: '#fff3b0', emissive: '#3a2400' });
    R.lL.position.z = -.11; R.lR.position.z = .11; R.aL.position.set(0, 1.46, -.29); R.aR.position.set(0, 1.46, .29);
    [R.lL, R.lR].forEach(function (l) { leg(l, skin, skin); S(l, .085, .085, .085, 0, -.42, 0, skin); shoe(l, boot, sole, null, 1); });
    lathe(R.body, [[0, .68], [.29, .7], [.27, .8], [.24, .92], [.22, 1.02], [0, 1.04]], den);
    lathe(R.body, [[0, 1.0], [.2, 1.01], [.19, 1.1], [.21, 1.22], [.25, 1.34], [.275, 1.43], [.26, 1.49], [.2, 1.55], [.11, 1.59], [0, 1.6]], wh);
    S(R.body, .07, .055, .09, .17, 1.06, 0, wh); S(R.body, .04, .075, .035, .19, .99, .06, wh, 0, 0, .3); S(R.body, .04, .07, .035, .19, .99, -.05, wh, 0, 0, -.2);
    S(R.body, .1, .035, .15, .1, 1.55, 0, wh); C(R.body, .065, .075, .2, 0, 1.66, 0, skin); TO(R.body, .11, .006, 0, .04, 1.55, 0, gold, Math.PI / 2, -.5, 0);
    [R.aL, R.aR].forEach(function (a) { arm(a, wh, skin, { len: .24, cuff: wh }); });
    var h = R.head;
    S(h, .31, .33, .3, 0, .2, 0, skin); S(h, .22, .16, .23, .05, .04, 0, skin);
    eachSide(function (s) { S(h, .045, .09, .078, .27, .22, s * .12, eyeW); S(h, .03, .075, .063, .292, .21, s * .12, iris); S(h, .02, .045, .042, .308, .21, s * .12, dark); S(h, .01, .02, .02, .318, .25, s * .1, eyeW); S(h, .02, .024, .085, .28, .34, s * .13, hair, s * .15, 0, 0); S(h, .02, .036, .055, .27, .1, s * .18, blush); });
    S(h, .035, .04, .035, .32, .15, 0, skin); TO(h, .055, .011, Math.PI, .3, .075, 0, lip, 0, Math.PI / 2, Math.PI);
    S(h, .33, .4, .37, -.09, .17, 0, hair); S(h, .28, .14, .33, .01, .45, 0, hair); S(h, .12, .07, .24, .19, .43, .04, hair, 0, 0, -.3);
    var hairT = M('#fff', Object.assign(hairTex('hairL', '#5a3424', '#3a1e12', '#7a4a32'), { shininess: 35 }));
    shell(h, .37, .44, .39, -.07, .14, 0, hairT, -2.1, 4.2, 0, 2.3); shell(h, .35, .2, .36, .0, .38, 0, hairT, 0, 6.283, 0, 1.5);   // masse lisse de cheveux avec mèches
    var hair2 = M('#6b4030', { shininess: 45 }), lash = M('#1a0f0a'), jean2 = M('#4d6ea3');
    for (var c = 0; c < 34; c++) { var aa = Math.PI * .34 + c / 33 * Math.PI * 1.32, rr2 = .36 + (c % 2) * .05, yy2 = .3 - (c % 3) * .1; curl(h, Math.cos(aa) * rr2 - .06, yy2, Math.sin(aa) * rr2 * 1.04, .42 + (c % 4) * .07, .045, 2.2, .032, c % 3 ? hair : hair2, -Math.cos(aa) * .03, Math.sin(aa) * .05); }
    for (var c2 = 0; c2 < 8; c2++) { var a2 = -.9 + c2 * .26; curl(h, .1 + Math.cos(a2) * .05, .52, Math.sin(a2) * .3, .18, .03, 1.5, .03, hair2, .08, 0); }
    eachSide(function (s2) { S(h, .008, .012, .075, .305, .3, s2 * .12, lash, s2 * .2, 0, 0); S(h, .006, .025, .01, .3, .31, s2 * .175, lash, 0, 0, .4); });
    C(R.body, .225, .225, .05, 0, 1.0, 0, jean2); S(R.body, .015, .015, .015, .17, 1.0, 0, M('#d8b04a', { shininess: 90 })); S(R.body, .01, .14, .01, .17, .86, 0, jean2);
    eachSide(function (s2) { S(R.body, .06, .07, .015, -.17, .9, s2 * .1, jean2, 0, 0, 0); S(R.body, .07, .02, .08, .13, 1.56, s2 * .06, wh, 0, 0, -.6); });
    [R.lL, R.lR].forEach(function (l) { laces(l, .03, M('#555')); TO(l, .1, .015, 0, 0, -.66, 0, sole, Math.PI / 2); });
    return { skin: '#eeb08a', shirt: '#f3efe8', pants: '#6d8fc4' };
  };
  /* ---------- STAN : chauve, deux cheveux, yeux fatigués, gilet rayé, chemise bleue, jean, boots marron ---------- */
  B.stan = function (R) {
    var skin = M('#efb894'), shirt = M('#bfd2ee'), jean = M('#fff', denim('#8ea5d6')), boot = M('#6b4428', { shininess: 30 }), sole = M('#3a2a1e'), pin = M('#fff', Object.assign(pinstripe(), { side: T3.DoubleSide })), eyeW = M('#fbfbf6', { shininess: 90 }), dark = M('#2a2a2e'), bag = M('#e0a080'), hairM = M('#2e241e'), lip = M('#9a5040'), stub = M('#d4a084');
    R.aL.position.set(0, 1.47, -.31); R.aR.position.set(0, 1.47, .31);
    [R.lL, R.lR].forEach(function (l) { leg(l, jean, jean); S(l, .1, .1, .1, 0, -.42, 0, jean); shoe(l, boot, sole, null, 1); TO(l, .1, .02, 0, 0, -.66, 0, sole, Math.PI / 2); });
    lathe(R.body, [[0, .88], [.23, .9], [.27, .98], [.3, 1.08], [.315, 1.2], [.3, 1.32], [.29, 1.42], [.28, 1.5], [.21, 1.57], [.11, 1.61], [0, 1.62]], shirt, .8, 1);
    lathe(R.body, [[.245, .97], [.285, 1.04], [.315, 1.12], [.33, 1.2], [.315, 1.32], [.305, 1.42], [.29, 1.5], [.22, 1.565]], pin, .82, 1.03, .22);
    for (var b = 0; b < 4; b++) S(R.body, .016, .016, .016, .258 - b * .002, 1.36 - b * .09, -.06, dark);
    S(R.body, .1, .035, .15, .1, 1.57, 0, shirt); C(R.body, .085, .09, .2, 0, 1.68, 0, skin);
    [R.aL, R.aR].forEach(function (a) { arm(a, shirt, skin, { len: .26, cuff: shirt }); });
    var h = R.head;
    S(h, .27, .37, .28, 0, .25, 0, skin); S(h, .24, .17, .25, .03, .01, 0, stub); S(h, .235, .165, .245, .015, .03, 0, skin);
    eachSide(function (s) { S(h, .045, .09, .065, 0, .19, s * .28, skin); S(h, .04, .1, .045, -.06, .23, s * .27, hairM);
      S(h, .095, .095, .095, .21, .3, s * .12, eyeW); S(h, .1, .05, .1, .215, .345, s * .12, skin); S(h, .07, .035, .085, .23, .21, s * .12, bag); S(h, .02, .032, .032, .3, .285, s * .12, dark); });
    S(h, .075, .065, .06, .3, .19, 0, skin); TO(h, .085, .01, Math.PI * .85, .265, .07, -.01, lip, 0, Math.PI / 2, Math.PI * 1.05);
    TUBE(h, [[.02, .61, -.1], [.0, .73, -.12], [.06, .77, -.17], [.1, .71, -.15]], .007, hairM); TUBE(h, [[-.02, .61, .1], [-.04, .75, .12], [.03, .79, .17], [.07, .73, .15]], .007, hairM);
    eachSide(function (s2) { TO(h, .07, .01, Math.PI * .8, .27, .37, s2 * .12, hairM, 0, Math.PI / 2, .3);
      for (var k3 = 0; k3 < 5; k3++) TUBE(h, [[-.02, .3 - k3 * .03, s2 * .27], [-.07, .26 - k3 * .03, s2 * .3], [-.12, .2 - k3 * .03, s2 * (.29 + k3 * .006)]], .006, hairM); });
    S(R.body, .015, .05, .06, .245, 1.42, .14, M('#2a2433')); S(R.body, .012, .03, .004, .25, 1.45, .14, M('#fff'));
    [R.lL, R.lR].forEach(function (l) { laces(l, .05, M('#d8c8a0')); C(l, .085, .088, .03, 0, -.72, 0, M('#6d84b8')); });
    return { skin: '#efb894', shirt: '#3b3448', pants: '#8ea5d6' };
  };


  /* ---------- BOTS : même corps sculpté que les skins, tenues variées selon o.v ---------- */
  B.npc = function (R, o) {
    o = o || {}; var v = o.v || 0, skin = M(o.skin || '#e0ac85'), shirt = M(o.shirt || '#3dd6ff'), pants = M(o.pants || '#2b3a67'), sole = M('#1c1c22'), white = M('#f2f2f2'), dark = M('#151515');
    var HC = ['#1c1410', '#4a2e1a', '#8a5a2a', '#d8b060', '#2a2a30', '#b8483a'], hc = HC[v % HC.length], hairM = M('#fff', hairTex('hairN' + hc, hc, '#0a0806', '#7a6a5a')), hoodie = v % 3 === 2, shorts = v % 4 === 1, hat = ['cap', 'beanie', 'none', 'bob', 'none', 'cap'][v % 6];
    [R.lL, R.lR].forEach(function (l) { leg(l, pants, shorts ? skin : pants, shorts ? { hem: pants, hemY: -.34 } : null); if (shorts) seg(l, .1, .09, -.2, -.34, pants); shoe(l, M(o.shoes || '#eeeeee'), sole, shirt); laces(l, .05, white); });
    lathe(R.body, [[0, .86], [.2, .87], [.245, .94], [.25, 1.02], [0, 1.03]], pants); TO(R.body, .245, .016, 0, 0, 1.0, 0, dark, Math.PI / 2, 0, 0).scale.set(.74, 1, 1);
    lathe(R.body, [[0, .98], [.24, .99], [.25, 1.1], [.26, 1.24], [.285, 1.36], [.31, 1.45], [.3, 1.51], [.24, 1.57], [.13, 1.61], [0, 1.62]], shirt);
    C(R.body, .075, .085, .22, 0, 1.68, 0, skin);
    if (hoodie) { TO(R.body, .16, .06, 0, -.06, 1.6, 0, shirt, Math.PI / 2 + .3, 0, 0).scale.set(1, 1.2, 1); S(R.body, .04, .12, .17, .2, 1.15, 0, shirt); eachSide(function (s2) { C(R.body, .006, .006, .18, .2, 1.48, s2 * .05, white); }); }
    else TO(R.body, .1, .016, 0, 0, 1.6, 0, shirt, Math.PI / 2, 0, 0);
    [R.aL, R.aR].forEach(function (a) { arm(a, shirt, skin, { len: hoodie ? .5 : .2, cuff: hoodie ? shirt : null }); });
    var h = R.head;
    S(h, .26, .28, .26, -.01, .15, 0, skin); S(h, .22, .17, .225, .04, -.01, 0, skin); S(h, .04, .05, .04, .28, .1, 0, skin);
    eachSide(function (s2) { S(h, .035, .065, .05, -.01, .1, s2 * .26, skin); S(h, .03, .042, .036, .235, .17, s2 * .09, M('#ffffff', { shininess: 80 })); S(h, .016, .028, .022, .262, .165, s2 * .09, dark); S(h, .012, .014, .055, .245, .235, s2 * .095, hairM, 0, 0, 0); });
    TO(h, .05, .009, Math.PI, .262, .02, 0, M('#9a4a3a'), 0, Math.PI / 2, Math.PI);
    if (v % 4 === 3) shell(h, .228, .178, .233, .04, -.01, 0, hairM, Math.PI - 1.45, 2.9, 1.62, 1.15);   // barbe
    if (v % 5 === 3) eachSide(function (s2) { TO(h, .05, .008, 0, .255, .17, s2 * .09, dark, 0, Math.PI / 2, 0); });   // lunettes rondes
    if (hat !== 'cap' && hat !== 'beanie') shell(h, .272, .29, .272, -.01, .15, 0, hairM, -1.9, 3.8, 0, 1.75);   // cheveux
    if (hat === 'cap') { var cm = M(o.hatCol || '#e83a3a'); shell(h, .275, .27, .275, -.01, .17, 0, cm, 0, 6.283, 0, 1.45); var vis = new T3.Mesh(new T3.CylinderGeometry(.2, .2, .02, 20, 1, false, -Math.PI / 2, Math.PI), cm); vis.scale.set(1.15, 1, 1); place(vis, h, .17, .2, 0, 0, 0, -.12); S(h, .02, .02, .02, -.01, .44, 0, cm); shell(h, .272, .29, .272, -.01, .15, 0, hairM, -1.2, 2.4, 1.3, .4); }
    else if (hat === 'beanie') { var bm = M(o.hatCol || '#7a2ab8'); shell(h, .28, .3, .28, -.01, .16, 0, bm, 0, 6.283, 0, 1.4); TO(h, .27, .035, 0, -.01, .21, 0, bm, Math.PI / 2, 0, 0); S(h, .07, .07, .07, -.01, .47, 0, white); }
    else if (hat === 'bob') { var hm = M(o.hatCol || '#ffb23d'); C(h, .23, .27, .2, -.01, .37, 0, hm); S(h, .23, .05, .23, -.01, .47, 0, hm); C(h, .28, .44, .07, -.01, .26, 0, hm); }
    return { skin: o.skin || '#e0ac85', shirt: o.shirt || '#3dd6ff', pants: o.pants || '#2b3a67' };
  };
  window.SKIN_IDS = ['wald', 'flubb', 'lea', 'stan'];
  window.buildSkin = function (THREE, id, opts) {
    init(THREE); var R = rig(), cols = (B[id] || B.wald)(R, opts);
    R.cols = cols; return skinify(R);
  };
  /* ---------- SQUELETTE COMMUN : tous les persos passent par ici ----------
     Os : corps, cuisse + genou (x2), épaule + coude (x2), tête. Chaque sommet est attaché à son os ;
     près du genou et du coude il est partagé entre les deux os, donc la jambe et le bras se plient en douceur.
     Le perso devient un seul SkinnedMesh (un matériau par groupe) : peu d'appels de dessin. */
  function smooth(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function skinify(R) {
    var KY = R.KY || -.43, EY = R.EY || -.28, root = R.root;
    root.updateMatrixWorld(true);
    var names = ['body', 'lL', 'lR', 'aL', 'aR', 'head'], groupsP = names.map(function (n) { return R[n]; });
    function bone(par, v) { var b = new T3.Bone(); b.position.copy(v); if (par) par.add(b); return b; }
    var P = function (n) { return R[n].position.clone(); };
    var bB = bone(null, new T3.Vector3()), bLL = bone(bB, P('lL')), bKL = bone(bLL, new T3.Vector3(0, KY, 0)), bLR = bone(bB, P('lR')), bKR = bone(bLR, new T3.Vector3(0, KY, 0)),
        bAL = bone(bB, P('aL')), bEL = bone(bAL, new T3.Vector3(0, EY, 0)), bAR = bone(bB, P('aR')), bER = bone(bAR, new T3.Vector3(0, EY, 0)), bH = bone(bB, P('head'));
    var bones = [bB, bLL, bKL, bLR, bKR, bAL, bEL, bAR, bER, bH];
    var list = [];
    function collect(o, pi) { o.children.forEach(function (ch) { if (groupsP.indexOf(ch) >= 0 || ch === R.gunHold) return; if (ch.isMesh) list.push([ch, pi]); if (ch.children.length) collect(ch, pi); }); }
    groupsP.forEach(function (g, pi) { collect(g, pi); });
    var mats = [], by = {};
    list.forEach(function (q) { var k = q[0].material.uuid; if (!by[k]) { by[k] = []; mats.push(q[0].material); } by[k].push(q); });
    var parts = [], n = 0, grp = [];
    mats.forEach(function (mt, mi) { var st = n; by[mt.uuid].forEach(function (q) { var m = q[0], geo = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); geo.applyMatrix4(m.matrixWorld); parts.push([geo, q[1]]); n += geo.attributes.position.count; }); grp.push([st, n - st, mi]); });
    var pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), o = 0;
    var piv = groupsP.map(function (g) { return new T3.Vector3().setFromMatrixPosition(g.matrixWorld); });
    parts.forEach(function (q) { var g = q[0], pi = q[1], pa = g.attributes.position, c = pa.count;
      pos.set(pa.array, o * 3); nor.set(g.attributes.normal.array, o * 3); if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
      for (var i = 0; i < c; i++) { var j = (o + i) * 4, ly = pa.getY(i) - piv[pi].y, a = 0, b = 0, w = 0;
        if (pi === 0) a = 0; else if (pi === 5) a = 9;
        else if (pi === 1 || pi === 2) { a = pi === 1 ? 1 : 3; b = a + 1; w = smooth(KY + .07, KY - .07, ly); }
        else { a = pi === 3 ? 5 : 7; b = a + 1; w = smooth(EY + .05, EY - .08, ly); }
        si[j] = a; si[j + 1] = b; sw[j] = 1 - w; sw[j + 1] = w; }
      o += c; g.dispose(); });
    var G = new T3.BufferGeometry();
    G.setAttribute('position', new T3.BufferAttribute(pos, 3)); G.setAttribute('normal', new T3.BufferAttribute(nor, 3)); G.setAttribute('uv', new T3.BufferAttribute(uv, 2));
    G.setAttribute('skinIndex', new T3.Uint16BufferAttribute(si, 4)); G.setAttribute('skinWeight', new T3.Float32BufferAttribute(sw, 4));
    grp.forEach(function (q) { G.addGroup(q[0], q[1], q[2]); }); G.computeBoundingSphere(); G.boundingSphere.radius *= 1.35;
    mats.forEach(function (m) { m.skinning = true; });
    var sm = new T3.SkinnedMesh(G, mats); sm.name = 'perso'; sm.castShadow = true; sm.add(bB);
    root.remove(R.body); root.add(sm); bB.add(R.gunHold);
    sm.updateMatrixWorld(true); sm.bind(new T3.Skeleton(bones));
    bones.forEach(function (b) { b.rotation.order = 'ZXY'; });
    R.body = bB; R.lL = bLL; R.kL = bKL; R.lR = bLR; R.kR = bKR; R.aL = bAL; R.eL = bEL; R.aR = bAR; R.eR = bER; R.head = bH; R.mesh = sm;
    return R;
  }
})();
