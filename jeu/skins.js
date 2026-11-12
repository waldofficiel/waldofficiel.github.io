/* Wald Royal : skins cartoon (Wald Off, Flubb, Léa, Stan).
   window.buildSkin(THREE, id) -> { root, body, lL, lR, aL, aR, head, gunHold }
   Le perso regarde vers +x. Hanches à y = .95 (z ±.16), épaules à y = 1.55, tête à y = 1.86.
   Chaque groupe est fusionné par matériau pour garder peu d'appels de dessin. */
(function () {
  var T3 = null, GS = null, MC = {}, TX = {};
  function init(THREE) {
    if (T3) return; T3 = THREE;
    GS = new THREE.SphereGeometry(1, 18, 13);
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
      if (!shiny) { delete p.shininess; delete p.specular; MC[k] = new T3.MeshLambertMaterial(p); }
      else MC[k] = new T3.MeshPhongMaterial(Object.assign({ specular: '#333333' }, p));
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
  function TUBE(par, pts, r, mt) { var cv = new T3.CatmullRomCurve3(pts.map(function (p) { return new T3.Vector3(p[0], p[1], p[2]); })); return par.add(new T3.Mesh(new T3.TubeGeometry(cv, 14, r, 5, false), mt)); }

  // fusionne les meshes enfants directs d'un groupe, par matériau
  function merge(g) {
    var by = {}, kids = g.children.filter(function (o) { return o.isMesh; });
    kids.forEach(function (m) { (by[m.material.uuid] = by[m.material.uuid] || { mat: m.material, list: [] }).list.push(m); });
    Object.keys(by).forEach(function (k) {
      var list = by[k].list; if (list.length < 2) return;
      var parts = list.map(function (m) { m.updateMatrix(); var geo = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); geo.applyMatrix4(m.matrix); return geo; });
      var n = 0; parts.forEach(function (p) { n += p.attributes.position.count; });
      var pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), o = 0;
      parts.forEach(function (p) { pos.set(p.attributes.position.array, o * 3); nor.set(p.attributes.normal.array, o * 3); if (p.attributes.uv) uv.set(p.attributes.uv.array, o * 2); o += p.attributes.position.count; p.dispose(); });
      var mg = new T3.BufferGeometry(); mg.setAttribute('position', new T3.BufferAttribute(pos, 3)); mg.setAttribute('normal', new T3.BufferAttribute(nor, 3)); mg.setAttribute('uv', new T3.BufferAttribute(uv, 2)); mg.computeBoundingSphere();
      list.forEach(function (m) { g.remove(m); }); g.add(new T3.Mesh(mg, by[k].mat));
    });
  }

  function rig() {
    var root = new T3.Group(), body = new T3.Group(); root.add(body);
    function limb(px, py, pz) { var p = new T3.Group(); p.position.set(px, py, pz); body.add(p); return p; }
    var r = { root: root, body: body, lL: limb(0, .95, -.16), lR: limb(0, .95, .16), aL: limb(0, 1.55, -.4), aR: limb(0, 1.55, .4), head: limb(0, 1.86, 0) };
    r.gunHold = limb(.45, 1.38, .26); return r;
  }
  function eachSide(f) { f(-1); f(1); }
  function chainLinks(par, cx, y, rx, rz, dip, link, tube, gold) {
    var n = 18; for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2, c = Math.cos(a); TO(par, link, tube, 0, cx + c * rx, y - Math.max(0, c) * dip, Math.sin(a) * rz, gold, i % 2 ? Math.PI / 2 : 0, -a, c > 0 ? .5 : 0); }
  }

  var B = {};
  /* ---------- WALD OFF : bob, lunettes noires, bouc, t-shirt rouge, chaîne en or, short à carreaux ---------- */
  B.wald = function (R) {
    var skin = M('#e9b08a'), red = M('#c8101c'), white = M('#f4f4f4'), navy = M('#1a2030'), hat = M('#0e121b'), cream = M('#efe8d8'), sole = M('#1c1c22'), beard = M('#6a4630', { shininess: 4 }),
      lens = M('#0c0d12', { shininess: 120, specular: '#8fa0ff' }), gold = M('#ffc22a', { shininess: 110, specular: '#fff3b0', emissive: '#3a2400' }), chk = M('#fff', checks()), pip = M('#e0303a');
    [R.lL, R.lR].forEach(function (l) {
      C(l, .17, .175, .34, 0, -.15, 0, chk); C(l, .178, .178, .07, 0, -.33, 0, navy); TO(l, .178, .012, 0, 0, -.36, 0, pip, Math.PI / 2);
      CAP(l, .085, -.36, -.74, skin); C(l, .095, .095, .12, 0, -.78, 0, white);
      S(l, .2, .1, .12, .05, -.86, 0, cream); S(l, .11, .055, .125, .0, -.85, 0, red); S(l, .07, .04, .125, .16, -.87, 0, navy); S(l, .21, .035, .13, .05, -.94, 0, sole);
    });
    S(R.body, .25, .36, .32, 0, 1.28, 0, red); S(R.body, .23, .16, .31, 0, 1.0, 0, chk); TO(R.body, .29, .02, 0, 0, 1.06, 0, navy, Math.PI / 2, 0, 0);
    C(R.body, .09, .1, .14, 0, 1.66, 0, skin); chainLinks(R.body, .03, 1.62, .2, .25, .13, .035, .013, gold);
    [R.aL, R.aR].forEach(function (a) { S(a, .12, .16, .12, 0, -.08, 0, red); C(a, .124, .124, .045, 0, -.07, 0, white); CAP(a, .072, -.17, -.5, skin, 0, 0, .066); S(a, .085, .1, .075, .01, -.6, 0, skin); });
    var h = R.head;
    S(h, .3, .33, .3, 0, .12, 0, skin); S(h, .23, .16, .23, .06, -.04, 0, skin); S(h, .05, .065, .045, .31, .1, 0, skin);
    eachSide(function (s) { S(h, .04, .08, .06, 0, .1, s * .3, skin); S(h, .06, .1, .02, .16, -.02, s * .245, beard); S(h, .04, .03, .1, .23, .19, s * .12, beard); });
    S(h, .055, .07, .075, .26, -.1, 0, beard); S(h, .03, .02, .11, .3, .035, 0, beard); S(h, .02, .012, .07, .3, -.015, 0, M('#8a3a2e'));
    eachSide(function (s) { S(h, .035, .075, .1, .29, .2, s * .115, lens); C(h, .006, .006, .26, .17, .25, s * .3, navy, 0, 0, Math.PI / 2); });
    S(h, .03, .022, .3, .3, .265, 0, navy);
    C(h, .27, .31, .26, -.01, .42, 0, hat); S(h, .27, .06, .27, -.01, .55, 0, hat); C(h, .316, .316, .06, -.01, .31, 0, navy); C(h, .33, .52, .1, -.01, .26, 0, hat);
    TO(h, .37, .009, 0, 0, .1, 0, navy, 0, Math.PI / 2, 0);
    return { skin: '#e9b08a', shirt: '#d8262e', pants: '#f1f1f1' };
  };
  /* ---------- FLUBB : blob jaune, gros yeux, gilet rayé, baskets multicolores ---------- */
  B.flubb = function (R) {
    var y = M('#f5c518', { shininess: 55, specular: '#5a4a10' }), w = M('#ffffff', { shininess: 80 }), dark = M('#151515'), mouth = M('#7a3c10'), pin = M('#fff', pinstripe()), sh = M('#fff', fun()), cream = M('#f3ecd8'), sole = M('#222'), irisB = M('#4a86c8'), irisH = M('#8a7a3a');
    [R.lL, R.lR].forEach(function (l) { CAP(l, .06, -.05, -.8, y, 0, 0, .05); S(l, .21, .11, .125, .06, -.86, 0, sh); S(l, .22, .04, .13, .06, -.935, 0, cream); S(l, .2, .02, .12, .06, -.965, 0, sole); });
    S(R.body, .27, .34, .27, 0, 1.13, 0, y); S(R.body, .2, .2, .22, 0, 1.42, 0, y); S(R.body, .012, .02, .02, .268, 1.08, 0, mouth);
    eachSide(function (s) { S(R.body, .22, .27, .16, -.02, 1.36, s * .12, pin); });
    C(R.body, .065, .075, .2, 0, 1.64, 0, y);
    [R.aL, R.aR].forEach(function (a) { CAP(a, .05, -.04, -.66, y, 0, 0, .045); S(a, .07, .1, .05, .02, -.74, 0, y); S(a, .02, .07, .02, .02, -.84, .03, y); });
    var h = R.head;
    S(h, .42, .36, .4, 0, .33, 0, y); S(h, .26, .22, .26, -.05, .52, -.2, y); S(h, .26, .2, .26, -.04, .54, .2, y); S(h, .25, .2, .25, .08, .58, 0, y); eachSide(function (s) { S(h, .22, .2, .22, .2, .17, s * .19, y); });
    eachSide(function (s) { S(h, .14, .14, .14, .34, .4, s * .15, w); S(h, .04, .065, .065, .465, .39, s * .15, s < 0 ? irisH : irisB); S(h, .02, .034, .034, .497, .39, s * .15, dark); });
    TO(h, .13, .026, Math.PI, .36, .17, 0, mouth, 0, Math.PI / 2, Math.PI); S(h, .03, .035, .04, .385, .05, .05, w);
    return { skin: '#f5c518', shirt: '#3b3448', pants: '#f5c518' };
  };
  /* ---------- LÉA : cheveux bouclés, chemise blanche nouée, jupe en jean, boots noires ---------- */
  B.lea = function (R) {
    var skin = M('#f1b993'), hair = M('#5a3424', { shininess: 40 }), wh = M('#f3efe8'), den = M('#fff', denim('#6d8fc4')), boot = M('#18181c', { shininess: 60 }), sole = M('#2a2a2e'), eyeW = M('#fff', { shininess: 90 }), iris = M('#5a3420'), dark = M('#111'), lip = M('#c4505c'), blush = M('#f39a9a'), gold = M('#ffc22a', { shininess: 110, specular: '#fff3b0', emissive: '#3a2400' });
    [R.lL, R.lR].forEach(function (l) { CAP(l, .09, -.18, -.66, skin, 0, 0, .075); C(l, .105, .1, .22, 0, -.74, 0, boot); S(l, .19, .1, .12, .05, -.87, 0, boot); S(l, .2, .04, .13, .05, -.94, 0, sole); });
    C(R.body, .25, .32, .38, 0, .93, 0, den); S(R.body, .23, .3, .28, 0, 1.3, 0, wh); S(R.body, .08, .06, .1, .21, 1.07, 0, wh); S(R.body, .05, .08, .04, .22, 1.0, .06, wh, 0, 0, .3); S(R.body, .12, .04, .17, .1, 1.58, 0, wh);
    C(R.body, .08, .09, .12, 0, 1.66, 0, skin); TO(R.body, .13, .007, 0, .05, 1.56, 0, gold, Math.PI / 2, -.5, 0);
    [R.aL, R.aR].forEach(function (a) { S(a, .12, .15, .12, 0, -.1, 0, wh); C(a, .1, .1, .07, 0, -.25, 0, wh); CAP(a, .062, -.27, -.5, skin); S(a, .08, .09, .07, .01, -.58, 0, skin); });
    var h = R.head;
    S(h, .34, .36, .33, 0, .2, 0, skin);
    eachSide(function (s) { S(h, .05, .1, .085, .29, .22, s * .13, eyeW); S(h, .03, .08, .068, .316, .21, s * .13, iris); S(h, .02, .05, .045, .332, .21, s * .13, dark); S(h, .01, .022, .022, .342, .25, s * .11, eyeW); S(h, .022, .026, .09, .3, .36, s * .14, hair, s * .15, 0, 0); S(h, .02, .04, .06, .3, .09, s * .2, blush); });
    S(h, .04, .04, .04, .345, .14, 0, skin); TO(h, .06, .012, Math.PI, .325, .06, 0, lip, 0, Math.PI / 2, Math.PI);
    S(h, .36, .42, .4, -.09, .16, 0, hair); S(h, .3, .15, .35, .02, .47, 0, hair); S(h, .13, .08, .26, .2, .46, .04, hair, 0, 0, -.3);
    for (var k = 0; k < 34; k++) { var a = Math.PI * .32 + (k % 12) / 11 * Math.PI * 1.36, yy = .5 - Math.floor(k / 12) * .32 - (k % 2) * .08, rr = .37 + (k % 3) * .02; if (yy < -.3) yy = -.3; var cr = .11 + (k % 4) * .015; S(h, cr, cr * 1.1, cr, Math.cos(a) * rr - .04, yy, Math.sin(a) * rr * 1.04, hair); }
    return { skin: '#f1b993', shirt: '#f3efe8', pants: '#6d8fc4' };
  };
  /* ---------- STAN : chauve, deux cheveux, yeux fatigués, gilet rayé, chemise bleue, boots marron ---------- */
  B.stan = function (R) {
    var skin = M('#f1bf9e'), stub = M('#d9a688', { shininess: 4 }), shirt = M('#bfd2ee'), jean = M('#fff', denim('#8ea5d6')), boot = M('#6b4428', { shininess: 30 }), sole = M('#3a2a1e'), pin = M('#fff', pinstripe()), eyeW = M('#fbfbf6', { shininess: 90 }), dark = M('#2a2a2e'), bag = M('#e8a888'), hairM = M('#2e241e'), lip = M('#9a5040');
    [R.lL, R.lR].forEach(function (l) { CAP(l, .08, -.02, -.7, jean, 0, 0, .07); C(l, .12, .11, .2, 0, -.74, 0, boot); TO(l, .11, .025, 0, 0, -.64, 0, sole, Math.PI / 2); S(l, .22, .11, .13, .06, -.87, 0, boot); S(l, .23, .04, .14, .06, -.945, 0, sole); });
    S(R.body, .3, .36, .3, .03, 1.18, 0, shirt); S(R.body, .27, .1, .28, 0, .95, 0, shirt); S(R.body, .305, .34, .305, .035, 1.2, 0, pin); S(R.body, .05, .13, .085, .305, 1.43, 0, shirt); S(R.body, .12, .05, .17, .12, 1.58, 0, shirt);
    for (var b = 0; b < 4; b++) S(R.body, .018, .018, .018, .333 - b * .004, 1.36 - b * .09, 0, dark);
    C(R.body, .09, .1, .14, 0, 1.66, 0, skin);
    [R.aL, R.aR].forEach(function (a) { S(a, .115, .14, .115, 0, -.1, 0, shirt); C(a, .1, .1, .07, 0, -.24, 0, shirt); CAP(a, .056, -.26, -.62, skin, 0, 0, .05); S(a, .08, .11, .06, .02, -.71, 0, skin); });
    var h = R.head;
    S(h, .3, .4, .3, 0, .27, 0, skin); S(h, .27, .2, .28, .02, 0, 0, stub); S(h, .26, .19, .27, .0, .02, 0, skin);
    eachSide(function (s) { S(h, .05, .1, .07, 0, .2, s * .3, skin); S(h, .045, .11, .05, -.06, .24, s * .29, hairM);
      S(h, .1, .1, .1, .24, .32, s * .13, eyeW); S(h, .105, .055, .105, .245, .37, s * .13, skin); S(h, .08, .04, .095, .26, .22, s * .13, bag); S(h, .02, .034, .034, .335, .3, s * .13, dark); });
    S(h, .08, .07, .065, .33, .2, 0, skin); TO(h, .09, .011, Math.PI * .85, .29, .08, -.01, lip, 0, Math.PI / 2, Math.PI * 1.05);
    TUBE(h, [[.02, .64, -.1], [.0, .76, -.12], [.06, .8, -.17], [.1, .74, -.15]], .007, hairM); TUBE(h, [[-.02, .64, .1], [-.04, .78, .12], [.03, .82, .17], [.07, .76, .15]], .007, hairM);
    return { skin: '#f1bf9e', shirt: '#3b3448', pants: '#8ea5d6' };
  };

  window.SKIN_IDS = ['wald', 'flubb', 'lea', 'stan'];
  window.buildSkin = function (THREE, id) {
    init(THREE); var R = rig(), cols = (B[id] || B.wald)(R);
    [R.body, R.lL, R.lR, R.aL, R.aR, R.head].forEach(merge);
    R.cols = cols; return R;
  };
})();
