/* Wald Royal : armes en vraie 3D + planeur.
   window.buildGun(THREE, k, rarColor)  -> Group, canon vers +x, à l'échelle de la main (longueur 0,4 à 1 m)
   window.buildGlider(THREE, col)       -> Group, aile delta avec armature ; barre de contrôle à y ≈ 0 (mains du perso)
   Les silhouettes sont des profils 2D extrudés avec biseau. */
(function () {
  var MC = {}, T;
  function M(col, o) { var k = col + JSON.stringify(o || {}); if (!MC[k]) MC[k] = new T.MeshPhongMaterial(Object.assign({ color: col, shininess: 40, specular: '#555555' }, o || {})); return MC[k]; }
  var STEEL = function () { return M('#3a3e46', { shininess: 90, specular: '#9aa4b4' }); }, DARK = function () { return M('#1c1e23', { shininess: 30, specular: '#333' }); },
    POLY = function () { return M('#26282d', { shininess: 12, specular: '#222' }); }, WOOD = function () { return M('#fff', { map: woodTex(), shininess: 25, specular: '#3a2a1a' }); },
    GOLD = function () { return M('#f2c14a', { shininess: 120, specular: '#fff3c0', emissive: '#3a2600' }); };
  var WT = null;
  function woodTex() { if (WT) return WT; var c = document.createElement('canvas'); c.width = 256; c.height = 64; var g = c.getContext('2d'); g.fillStyle = '#4e2c14'; g.fillRect(0, 0, 256, 64);
    for (var i = 0; i < 40; i++) { g.strokeStyle = 'rgba(' + (40 + Math.random() * 40 | 0) + ',20,5,' + (.2 + Math.random() * .3) + ')'; g.lineWidth = 1 + Math.random() * 2; g.beginPath(); var y = Math.random() * 64; g.moveTo(0, y); for (var x = 0; x <= 256; x += 16) g.lineTo(x, y + Math.sin(x * .05 + i) * 3); g.stroke(); }
    WT = new T.CanvasTexture(c); WT.encoding = T.sRGBEncoding; WT.wrapS = WT.wrapT = T.RepeatWrapping; WT.repeat.set(4, 4); return WT; }
  function shape(pts, holes) { var s = new T.Shape(); pts.forEach(function (p, i) { if (i) s.lineTo(p[0], p[1]); else s.moveTo(p[0], p[1]); }); s.closePath(); (holes || []).forEach(function (h) { var p0 = new T.Path(); h.forEach(function (p, i) { if (i) p0.lineTo(p[0], p[1]); else p0.moveTo(p[0], p[1]); }); p0.closePath(); s.holes.push(p0); }); return s; }
  function ext(g, pts, w, mt, z, bev, holes) {   // profil (x, y) extrudé sur l'épaisseur w, centré en z
    var b = bev == null ? Math.min(.012, w * .25) : bev, geo = new T.ExtrudeGeometry(shape(pts, holes), { depth: Math.max(.002, w - b * 2), bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 6 });
    geo.translate(0, 0, -(w - b * 2) / 2 + (z || 0)); var m = new T.Mesh(geo, mt); g.add(m); return m; }
  function cyl(g, r1, r2, len, x, y, z, mt, seg, axis) { var m = new T.Mesh(new T.CylinderGeometry(r1, r2, len, seg || 14), mt); m.position.set(x, y, z || 0); if (axis !== 'y') m.rotation.z = Math.PI / 2; g.add(m); return m; }
  function boxm(g, sx, sy, sz, x, y, z, mt) { var m = new T.Mesh(new T.BoxGeometry(sx, sy, sz), mt); m.position.set(x, y, z || 0); g.add(m); return m; }
  function rail(g, x0, x1, y, w, mt) { boxm(g, x1 - x0, .012, w, (x0 + x1) / 2, y, 0, mt); for (var x = x0 + .015; x < x1; x += .03) boxm(g, .014, .012, w + .004, x, y + .011, 0, mt); }
  function guard(g, x, y, r, mt) { var m = new T.Mesh(new T.TorusGeometry(r, .008, 6, 14, Math.PI), mt); m.position.set(x, y, 0); m.rotation.z = Math.PI; g.add(m); boxm(g, .008, .028, .006, x + .005, y - .005, 0, M('#111')); }
  function accent(g, x0, x1, y, col, w) { var m = M(col, { emissive: col, emissiveIntensity: .8, shininess: 60 }); [-1, 1].forEach(function (s) { boxm(g, x1 - x0, .012, .004, (x0 + x1) / 2, y, s * (w / 2 + .002), m); }); }

  var B = {};
  B.pistolet = function (g, c) {
    ext(g, [[-.06, 0], [.2, 0], [.21, .012], [.21, .052], [-.06, .052], [-.07, .04]], .042, STEEL(), 0);   // glissière
    for (var i = 0; i < 6; i++) boxm(g, .004, .03, .046, -.04 + i * .012, .03, 0, DARK());   // stries
    ext(g, [[-.05, -.02], [.16, -.02], [.16, 0], [-.05, 0]], .038, POLY());
    ext(g, [[-.05, -.02], [.01, -.02], [-.01, -.15], [-.075, -.15], [-.07, -.1]], .044, POLY(), 0, .01);   // poignée
    for (var j = 0; j < 5; j++) boxm(g, .05, .004, .048, -.035 - j * .004, -.05 - j * .02, 0, DARK());
    guard(g, .045, -.02, .028, POLY()); cyl(g, .011, .011, .02, .215, .03, 0, M('#111'));
    boxm(g, .01, .012, .012, .19, .058, 0, DARK()); boxm(g, .012, .012, .02, -.05, .058, 0, DARK()); accent(g, .02, .17, -.01, c, .038);
  };
  B.smg = function (g, c) {
    ext(g, [[-.12, -.03], [.22, -.03], [.24, -.01], [.24, .05], [-.12, .05]], .055, POLY());
    rail(g, -.1, .2, .056, .03, DARK());
    cyl(g, .03, .03, .2, .36, .015, 0, DARK(), 16); for (var i = 0; i < 4; i++) cyl(g, .032, .032, .01, .29 + i * .045, .015, 0, STEEL(), 16);   // silencieux
    ext(g, [[.06, -.03], [.11, -.03], [.115, -.2], [.07, -.2]], .03, DARK(), 0, .006);   // chargeur
    ext(g, [[-.06, -.03], [-.01, -.03], [-.03, -.15], [-.09, -.15]], .045, POLY(), 0, .01);
    guard(g, .02, -.03, .024, POLY());
    [[.05, .02], [-.05, .02]].forEach(function () {}); cyl(g, .008, .008, .22, -.2, .02, .02, STEEL(), 8); cyl(g, .008, .008, .22, -.2, -.02, -.02, STEEL(), 8); boxm(g, .02, .09, .05, -.31, 0, 0, POLY());   // crosse repliable
    boxm(g, .05, .03, .03, .08, .085, 0, DARK()); cyl(g, .012, .012, .002, .105, .085, 0, M('#ff3355', { emissive: '#ff0030', emissiveIntensity: 1 }), 10);   // viseur point rouge
    accent(g, -.08, .2, .015, c, .055);
  };
  B.fusil = function (g, c) {
    var W = WOOD();
    ext(g, [[-.55, -.09], [-.3, -.03], [-.2, -.02], [-.2, .03], [-.3, .035], [-.55, .02], [-.57, -.06]], .05, W, 0, .01);   // crosse bois
    ext(g, [[-.22, -.03], [.15, -.03], [.15, .045], [-.22, .045]], .06, STEEL());   // carcasse
    ext(g, [[-.15, .045], [.12, .045], [.11, .065], [-.13, .065]], .056, STEEL(), 0, .006);   // couvercle
    ext(g, [[.15, -.025], [.42, -.02], [.42, .035], [.15, .04]], .062, W, 0, .01);   // garde-main bois
    cyl(g, .013, .013, .4, .6, .012, 0, DARK(), 10); cyl(g, .01, .01, .3, .5, .05, 0, STEEL(), 8);   // canon + tube à gaz
    boxm(g, .02, .045, .014, .74, .045, 0, DARK()); cyl(g, .018, .018, .05, .8, .012, 0, DARK(), 10);   // guidon + cache-flamme
    var mag = new T.Shape(); mag.moveTo(.02, -.03); mag.quadraticCurveTo(.03, -.14, .1, -.24); mag.lineTo(.16, -.22); mag.quadraticCurveTo(.09, -.12, .08, -.03); mag.closePath();   // chargeur courbé
    var mg = new T.ExtrudeGeometry(mag, { depth: .028, bevelEnabled: true, bevelThickness: .006, bevelSize: .006, bevelSegments: 2 }); mg.translate(0, 0, -.014); g.add(new T.Mesh(mg, STEEL()));
    ext(g, [[-.13, -.03], [-.08, -.03], [-.1, -.15], [-.16, -.14]], .045, W, 0, .01); guard(g, -.05, -.03, .025, STEEL());
    accent(g, -.2, .14, .01, c, .06);
  };
  B.scar = function (g, c) {
    var G = GOLD(), D = DARK();
    ext(g, [[-.58, -.08], [-.42, -.04], [-.24, -.02], [-.24, .05], [-.42, .05], [-.58, .03], [-.6, -.04]], .055, G, 0, .012);   // crosse
    ext(g, [[-.26, -.04], [.3, -.04], [.32, -.02], [.32, .06], [-.26, .06]], .066, G, 0, .01);   // carcasse
    rail(g, -.22, .3, .068, .036, D);
    cyl(g, .016, .016, .3, .46, .02, 0, D, 12); cyl(g, .022, .022, .07, .63, .02, 0, D, 12); for (var i = 0; i < 3; i++) boxm(g, .006, .046, .046, .61 + i * .02, .02, 0, M('#111'));   // canon + frein de bouche
    ext(g, [[.03, -.04], [.1, -.04], [.11, -.2], [.04, -.21]], .032, D, 0, .006);   // chargeur
    ext(g, [[-.1, -.04], [-.04, -.04], [-.06, -.17], [-.13, -.16]], .045, D, 0, .01); guard(g, -.01, -.04, .024, D);
    ext(g, [[.2, -.04], [.25, -.04], [.24, -.12], [.21, -.12]], .03, D, 0, .008);   // poignée avant
    boxm(g, .09, .045, .04, .02, .105, 0, D); cyl(g, .02, .02, .004, .068, .105, 0, M('#ff2b4a', { emissive: '#ff0020', emissiveIntensity: 1.2 }), 12);   // viseur
    accent(g, -.2, .28, .02, '#fff6c8', .066);
  };
  B.pompe = function (g, c) {
    var W = WOOD();
    ext(g, [[-.62, -.1], [-.36, -.03], [-.22, -.02], [-.22, .035], [-.36, .04], [-.62, .03], [-.64, -.07]], .05, W, 0, .012);
    ext(g, [[-.24, -.03], [.06, -.03], [.06, .05], [-.24, .05]], .06, STEEL());
    cyl(g, .02, .02, .62, .37, .03, 0, DARK(), 14); cyl(g, .017, .017, .5, .3, -.015, 0, STEEL(), 12);   // canon + tube magasin
    var fe = cyl(g, .028, .028, .2, .2, -.012, 0, W, 16); for (var i = 0; i < 6; i++) cyl(g, .03, .03, .008, .12 + i * .03, -.012, 0, M('#4a2a12'), 16);   // pompe rainurée
    cyl(g, .008, .008, .01, .67, .055, 0, M('#ffd23d', { emissive: '#aa7700', emissiveIntensity: .6 }), 8); boxm(g, .03, .008, .006, -.02, .055, 0, DARK());
    ext(g, [[-.17, -.03], [-.12, -.03], [-.14, -.14], [-.2, -.13]], .045, W, 0, .01); guard(g, -.08, -.03, .025, STEEL());
    for (var s = 0; s < 4; s++) cyl(g, .011, .011, .045, -.5 + s * .03, .0, .03, M('#c8202e'), 8, 'y');   // cartouches sur la crosse
    accent(g, -.22, .05, .01, c, .06);
  };
  B.sniper = function (g, c) {
    var V = M('#3a4a34', { shininess: 30 }), D = DARK();
    ext(g, [[-.75, -.1], [-.5, -.06], [-.3, -.03], [-.3, .04], [-.48, .04], [-.75, .045], [-.77, -.07]], .055, V, 0, .012, [[[-.5, -.04], [-.38, -.025], [-.38, .015], [-.5, .015]]]);   // crosse à trou de pouce
    ext(g, [[-.32, -.035], [.2, -.035], [.2, .045], [-.32, .045]], .06, V, 0, .01);
    var bar = cyl(g, .018, .016, .7, .55, .015, 0, STEEL(), 14); for (var f = 0; f < 6; f++) boxm(g, .5, .004, .004, .5, .015 + Math.cos(f) * .017, Math.sin(f) * .017, D);   // canon cannelé
    cyl(g, .026, .026, .08, .93, .015, 0, D, 12); for (var i = 0; i < 3; i++) boxm(g, .012, .03, .06, .91 + i * .025, .015, 0, M('#111'));   // frein de bouche
    cyl(g, .034, .034, .34, .02, .12, 0, D, 18); cyl(g, .046, .036, .08, .22, .12, 0, D, 18); cyl(g, .042, .034, .06, -.17, .12, 0, D, 18);   // lunette
    cyl(g, .04, .04, .004, .262, .12, 0, M('#4ab8ff', { emissive: '#1a6aff', emissiveIntensity: .9, shininess: 140, specular: '#fff' }), 18);
    cyl(g, .02, .02, .04, .04, .17, 0, D, 10, 'y'); cyl(g, .02, .02, .04, .04, .12, .045, D, 10); [-.1, .1].forEach(function (x) { boxm(g, .03, .05, .03, x, .07, 0, D); });
    var bolt = cyl(g, .008, .008, .07, -.12, .03, .05, STEEL(), 8, 'y'); bolt.rotation.x = Math.PI / 2; var kn = new T.Mesh(new T.SphereGeometry(.016, 10, 8), STEEL()); kn.position.set(-.12, .03, .085); g.add(kn);
    ext(g, [[.05, -.035], [.1, -.035], [.1, -.1], [.05, -.1]], .03, D, 0, .006);
    ext(g, [[-.24, -.035], [-.18, -.035], [-.2, -.15], [-.26, -.14]], .045, V, 0, .01); guard(g, -.14, -.035, .024, STEEL());
    [-1, 1].forEach(function (s) { var leg = cyl(g, .007, .007, .25, .3, -.05, s * .02, D, 6); leg.rotation.y = s * .08; });   // bipied replié
    accent(g, -.3, .18, .005, c, .06);
  };

  window.buildGun = function (THREE, k, rc) { T = THREE; var g = new THREE.Group(); (B[k] || B.pistolet)(g, rc || '#ffffff'); g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; } }); return g; };

  /* ---------- planeur : aile delta tendue sur une armature, barre de contrôle ---------- */
  var GT = {};
  function wingTex(col) {
    if (GT[col]) return GT[col]; var c = document.createElement('canvas'); c.width = 512; c.height = 256; var g = c.getContext('2d');
    var gr = g.createLinearGradient(0, 0, 512, 0); gr.addColorStop(0, '#16081f'); gr.addColorStop(.5, col); gr.addColorStop(1, '#16081f'); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
    g.fillStyle = '#7a1fff'; g.fillRect(0, 0, 512, 34); g.fillStyle = '#ff1f4b'; g.fillRect(0, 34, 512, 10);
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; for (var x = 32; x < 512; x += 48) { g.beginPath(); g.moveTo(x, 44); g.lineTo(x, 256); g.stroke(); }   // lattes
    g.fillStyle = '#fff'; g.font = '900 76px Arial Black, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = '#ff2bd6'; g.shadowBlur = 18; g.fillText('W', 256, 150);
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; GT[col] = t; return t;
  }
  /* planeurs gonflables : on se tient à une barre (y ≈ 0), le gonflable flotte au-dessus */
  function ropes(g, pts, top) { var dk = M('#22252c'); pts.forEach(function (p) { var A = new T.Vector3(p[0], p[1], p[2]), B = new T.Vector3(.15, .02, p[2] > 0 ? .7 : -.7), d = B.clone().sub(A), m = new T.Mesh(new T.CylinderGeometry(.012, .012, d.length(), 4), dk); m.position.copy(A).add(B).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); g.add(m); });
    var bar = new T.Mesh(new T.CylinderGeometry(.03, .03, 1.5, 8), dk); bar.rotation.x = Math.PI / 2; bar.position.set(.15, .02, 0); g.add(bar);
    [-.7, .7].forEach(function (z) { var gp = new T.Mesh(new T.CylinderGeometry(.045, .045, .18, 10), M('#ffd23d')); gp.rotation.x = Math.PI / 2; gp.position.set(.15, .02, z * .85); g.add(gp); }); }
  function S(g, m, x, y, z, sx, sy, sz) { var o = new T.Mesh(new T.SphereGeometry(1, 24, 16), m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); g.add(o); return o; }
  function duck(THREE) { var g = new THREE.Group(), Y = 2.6, yel = M('#ffd21f', { shininess: 120, specular: '#ffffff', emissive: '#3a2a00' }), org = M('#ff7a12', { shininess: 120, specular: '#ffffff' }), wh = M('#ffffff', { shininess: 90 }), bk = M('#111114', { shininess: 140, specular: '#ffffff' });
    S(g, yel, -.2, Y, 0, 1.55, 1.0, 1.25);   // corps
    S(g, yel, -1.55, Y + .45, 0, .45, .55, .5).rotation.z = .6;   // queue
    S(g, yel, .95, Y + 1.05, 0, .72, .7, .68);   // tête
    S(g, org, 1.62, Y + .95, 0, .42, .12, .32);   // bec
    [-1, 1].forEach(function (sd) { S(g, wh, 1.43, Y + 1.25, sd * .3, .16, .18, .12); S(g, bk, 1.55, Y + 1.27, sd * .32, .08, .1, .06); S(g, yel, -.25, Y + .2, sd * 1.25, .9, .35, .32).rotation.x = sd * -.4; });
    var ring = new T.Mesh(new T.TorusGeometry(.95, .06, 8, 32), M('#ff2bd6', { emissive: '#7a0060' })); ring.rotation.x = Math.PI / 2; ring.position.set(-.2, Y - .3, 0); ring.scale.set(1.5, 1.2, 1); g.add(ring);
    ropes(g, [[.6, Y - .6, .6], [.6, Y - .6, -.6], [-.9, Y - .6, .6], [-.9, Y - .6, -.6]]); g.traverse(function (o) { if (o.isMesh) o.castShadow = true; }); return g; }
  function waldcar(THREE) { var g = new THREE.Group(), Y = 2.5, body = M('#16161c', { shininess: 160, specular: '#ffffff', emissive: '#08040e' }), red = M('#ff1f3a', { emissive: '#ff0020', emissiveIntensity: .7 }), gl = M('#9fd8ff', { shininess: 160, specular: '#ffffff', transparent: true, opacity: .75 }), pink = M('#ff2bd6', { emissive: '#7a0060' }), tyre = M('#26262c', { shininess: 80 }), chrome = M('#e8ecf2', { shininess: 160, specular: '#ffffff' });
    S(g, body, 0, Y, 0, 2.1, .62, 1.05);   // caisse gonflée
    S(g, body, -.25, Y + .55, 0, 1.15, .48, .9);   // habitacle
    S(g, gl, .5, Y + .62, 0, .5, .36, .78); S(g, gl, -1.0, Y + .62, 0, .35, .3, .74);   // pare-brise / lunette
    [[1.25, .78], [1.25, -.78], [-1.25, .78], [-1.25, -.78]].forEach(function (q) { var w = new T.Mesh(new T.TorusGeometry(.32, .17, 10, 20), tyre); w.position.set(q[0], Y - .45, q[1] * 1.12); g.add(w); var hub = new T.Mesh(new T.SphereGeometry(.17, 12, 8), chrome); hub.position.copy(w.position); hub.scale.z = .5; g.add(hub); });
    [-1, 1].forEach(function (sd) { S(g, M('#fff8d0', { emissive: '#fff0a0', emissiveIntensity: .8 }), 2.0, Y + .1, sd * .6, .12, .14, .2); S(g, red, -2.05, Y + .15, sd * .62, .08, .12, .22); });
    var stripe = new T.Mesh(new T.TorusGeometry(1.02, .04, 6, 40), pink); stripe.rotation.x = Math.PI / 2; stripe.scale.set(2.06, 1.02, 1); stripe.position.y = Y + .05; g.add(stripe);
    var c = document.createElement('canvas'); c.width = 256; c.height = 128; var x = c.getContext('2d'); x.font = '900 70px Arial Black, Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff'; x.shadowColor = '#ff2bd6'; x.shadowBlur = 16; x.fillText('WALD', 128, 66);
    var tx = new T.CanvasTexture(c); tx.encoding = T.sRGBEncoding; [-1, 1].forEach(function (sd) { var pl = new T.Mesh(new T.PlaneGeometry(1.4, .7), new T.MeshBasicMaterial({ map: tx, transparent: true })); pl.position.set(0, Y + .05, sd * 1.06); if (sd < 0) pl.rotation.y = Math.PI; g.add(pl); });
    var valve = new T.Mesh(new T.CylinderGeometry(.06, .06, .2, 8), M('#ffd23d')); valve.position.set(-.3, Y + 1.05, 0); g.add(valve);
    ropes(g, [[.9, Y - .5, .7], [.9, Y - .5, -.7], [-.9, Y - .5, .7], [-.9, Y - .5, -.7]]); g.traverse(function (o) { if (o.isMesh) o.castShadow = true; }); return g; }
  window.buildGlider = function (THREE, col, type) {
    T = THREE; if (type === 'canard') return duck(THREE); if (type === 'waldcar') return waldcar(THREE); var g = new THREE.Group(), span = 3.1, chord = 2.3, NU = 16, NV = 8, pos = [], uv = [], idx = [];
    for (var i = 0; i <= NU; i++) for (var j = 0; j <= NV; j++) { var u = i / NU * 2 - 1, v = j / NV, au = Math.abs(u), x = .9 - v * chord * (1 - au * .55) - au * 1.25, z = u * span, y = Math.sin(v * Math.PI) * .22 * (1 - au * .7) + au * .3;
      pos.push(x, y, z); uv.push(i / NU, 1 - v); }
    for (i = 0; i < NU; i++) for (j = 0; j < NV; j++) { var a = i * (NV + 1) + j, b = a + NV + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    var sail = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ map: wingTex(col || '#ff2bd6'), side: THREE.DoubleSide, shininess: 30, specular: '#444', emissive: '#1a0820' })); sail.position.y = 2.15; g.add(sail);
    var tube = M('#d8dde6', { shininess: 110, specular: '#ffffff' }), dk = M('#22252c');
    function bar(a, b, r, mt) { var A = new THREE.Vector3().fromArray(a), Bv = new THREE.Vector3().fromArray(b), d = Bv.clone().sub(A), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 8), mt); m.position.copy(A).add(Bv).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.add(m); return m; }
    var Y = 2.15, nose = [.92, Y + .02, 0], tipL = [.9 - 1.25 - chord * .45 * .0, Y + .3, -span], tipR = [tipL[0], Y + .3, span];
    tipL[0] = .9 - 1.25; tipR[0] = tipL[0];
    bar(nose, tipL, .028, tube); bar(nose, tipR, .028, tube);   // bords d'attaque
    bar(nose, [.9 - chord, Y + .05, 0], .03, tube);   // quille
    bar([.15, Y + .02, -1.6], [.15, Y + .02, 1.6], .022, tube);   // traverse
    bar([.2, Y, 0], [.15, .02, -.7], .022, tube); bar([.2, Y, 0], [.15, .02, .7], .022, tube); bar([.15, .02, -.7], [.15, .02, .7], .03, dk);   // trapèze + barre
    [[-.7], [.7]].forEach(function (q) { var gp = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .16, 10), M('#ff2bd6', { emissive: '#7a0060', emissiveIntensity: .5 })); gp.rotation.x = Math.PI / 2; gp.position.set(.15, .02, q[0] * .82); g.add(gp); });
    bar([.15, .02, -.7], tipL, .005, dk); bar([.15, .02, .7], tipR, .005, dk); bar([.15, .02, 0], nose, .005, dk); bar([.15, .02, 0], [.9 - chord, Y + .05, 0], .005, dk);   // câbles
    [tipL, tipR].forEach(function (t) { var l = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), M('#ff2bd6', { emissive: '#ff2bd6', emissiveIntensity: 1.2 })); l.position.fromArray(t); g.add(l); });   // feux de bout d'aile
    g.traverse(function (o) { if (o.isMesh) o.castShadow = true; }); return g;
  };
})();
