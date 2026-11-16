/* Wald Royal : armes en vraie 3D + planeur.
   window.buildGun(THREE, k, rarColor)  -> Group, canon vers +x, à l'échelle de la main (longueur 0,4 à 1 m)
   window.buildGlider(THREE, col)       -> Group, aile delta avec armature ; barre de contrôle à y ≈ 0 (mains du perso)
   Les silhouettes sont des profils 2D extrudés avec biseau. */
(function () {
  var MC = {}, T;
  function M(col, o) { var k = col + JSON.stringify(o || {}); if (MC[k]) return MC[k]; o = Object.assign({ shininess: 40 }, o || {}); var sh = o.shininess, q = { color: col, envMap: envTex(), metalness: o.metal != null ? o.metal : sh >= 80 ? .85 : sh >= 50 ? .35 : .08, roughness: o.rough != null ? o.rough : Math.max(.16, .8 - sh / 160), envMapIntensity: 1 };
    ['map', 'emissive', 'emissiveIntensity', 'transparent', 'opacity', 'side'].forEach(function (n) { if (o[n] != null) q[n] = o[n]; }); return MC[k] = new T.MeshStandardMaterial(q); }
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

  /* ---------- vraies armes 3D : Quaternius « Animated FPS Guns » (CC0), jeu/models/guns ----------
     Chaque arme est chargée une fois, chaque partie reçoit sa couleur (bois, acier, noir…), puis tout est fusionné en UN mesh
     à couleurs de sommets : un seul appel de dessin par arme. Canon vers +x, crosse vers -x, comme les anciens modèles. */
  var GUN3 = { pistolet: ['g_Pistol', .36, 0], smg: ['g_P90', .66, -1], pompeS: ['g_Shotgun', 1.04, -1, 'tac'], sniper: ['g_SniperRifle', 1.32, -1] };
  var GPAL = { LightWood: '#b9773e', DarkWood: '#6a3c1c', Wood: '#8a5428', Black: '#1d1f24', Metal: '#7d848e', DarkerMetal: '#3c4048', DarkMetal: '#3c4048', Barrels: '#2e3238', Barrel: '#2e3238', Magazine: '#26292f',
    Muzzle: '#1a1a1c', BulletYellow: '#e8b830', BulletOrange: '#d87a2a', BulletRed: '#c8302a', BulletTip: '#c8902a', Trigger: '#141414', Green: '#4d6a3a', 'Material.001': '#2b2f36', 'Material.002': '#43484f', 'Material.003': '#1c1e22', 'Material.004': '#4a515c' };
  var GOLDPAL = { LightWood: '#ffcf4a', DarkWood: '#f0aa30', Metal: '#fff0b0', Black: '#3a2c14', Barrels: '#d8a23a' };
  var TACPAL = { LightWood: '#2a2a30', DarkWood: '#17171b', Wood: '#202026', Metal: '#b08aff', DarkerMetal: '#7a4ad8', DarkMetal: '#8a5ae8', Black: '#1e1828', Barrels: '#2a2236', BulletRed: '#ff3a8a' };   // pompe spécialisé : noir et violet
  var AUTOPAL = { DarkMetal: '#a8b0bc', Black: '#3a2a1c', Barrels: '#5a606a', BulletRed: '#d83030' };   // pompe auto : acier clair + polymère brun
  var GUNT = {}, GREADY = false;
  window.GUNS3D = { ready: function () { return GREADY; }, onReady: null,
    load: function (THREE) { if (!THREE.GLTFLoader || GREADY) return; T = THREE; var L = new THREE.GLTFLoader(), names = ['g_Pistol', 'g_P90', 'g_Rifle', 'g_Shotgun', 'g_SniperRifle'], left = names.length, raw = {};
      names.forEach(function (n) { L.load('models/guns/' + n + '.glb', function (g) { raw[n] = g.scene; if (--left === 0) done(); }, null, function () { if (--left === 0) done(); }); });
      function done() { Object.keys(GUN3).forEach(function (k) { var q = GUN3[k], sc = raw[q[0]]; if (!sc) return; GUNT[k] = bake(sc, q[1], q[2], q[3] === 'gold' ? GOLDPAL : q[3] === 'tac' ? TACPAL : q[3] === 'auto' ? AUTOPAL : null); }); GREADY = true; if (window.GUNS3D.onReady) window.GUNS3D.onReady(); } } };
  /* Rendu « vraie arme » : chaque partie est rangée par matière (métal, bois, polymère, laiton, lunette) et dessinée en matériau PBR
     avec reflets d'un studio peint (ENV) : acier qui brille, bois mat, plastique satiné. Un mesh par matière (4-5 appels de dessin). */
  var CLS = { Metal: 'm', DarkerMetal: 'm', DarkMetal: 'm', Barrels: 'm', Barrel: 'm', Muzzle: 'm', Trigger: 'm', Magazine: 'm', 'Material.001': 'p', 'Material.002': 'm', 'Material.003': 'p', 'Material.004': 'm',
    LightWood: 'w', DarkWood: 'w', Wood: 'w', Black: 'p', Green: 'p', BulletYellow: 'b', BulletOrange: 'b', BulletRed: 'b', BulletTip: 'b' };
  var ENVT = null;
  function envTex() { if (ENVT) return ENVT; var c = document.createElement('canvas'); c.width = 512; c.height = 256; var g = c.getContext('2d');
    var gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.35, '#b9c3d6'); gr.addColorStop(.5, '#8a8f9e'); gr.addColorStop(.62, '#4a4552'); gr.addColorStop(1, '#2a2630'); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
    g.fillStyle = 'rgba(255,255,255,.95)'; g.fillRect(40, 40, 90, 46); g.fillRect(300, 30, 140, 30); g.fillStyle = 'rgba(255,120,200,.55)'; g.fillRect(200, 70, 60, 70); g.fillStyle = 'rgba(140,90,255,.5)'; g.fillRect(450, 80, 50, 60);
    ENVT = new T.CanvasTexture(c); ENVT.mapping = T.EquirectangularReflectionMapping; ENVT.encoding = T.sRGBEncoding; return ENVT; }
  function grainTex() { var c = document.createElement('canvas'); c.width = 256; c.height = 256; var g = c.getContext('2d'); g.fillStyle = '#808080'; g.fillRect(0, 0, 256, 256);
    for (var i = 0; i < 90; i++) { g.strokeStyle = 'rgba(' + (Math.random() < .5 ? '40,40,40' : '200,200,200') + ',' + (.08 + Math.random() * .18) + ')'; g.lineWidth = .6 + Math.random() * 2; g.beginPath(); var y = Math.random() * 256; g.moveTo(0, y); for (var x = 0; x <= 256; x += 16) g.lineTo(x, y + Math.sin(x * .04 + i) * 4); g.stroke(); }
    var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t; }
  var GRAIN = null, MATS = {};
  function gmat(cls, over) { var key = cls + (over === GOLDPAL ? 'G' : over === TACPAL ? 'T' : ''); if (MATS[key]) return MATS[key]; var env = envTex(), gold = over === GOLDPAL, tac = over === TACPAL, o = { vertexColors: true, envMap: env };
    if (cls === 'm') Object.assign(o, { metalness: gold ? 1 : .88, roughness: gold ? .2 : tac ? .38 : .3, envMapIntensity: 1.25 });
    else if (cls === 'w') { if (!GRAIN) GRAIN = grainTex(); Object.assign(o, gold ? { metalness: 1, roughness: .26, envMapIntensity: 1.2 } : { metalness: 0, roughness: .62, roughnessMap: GRAIN, envMapIntensity: .55 }); }
    else if (cls === 'b') Object.assign(o, { metalness: 1, roughness: .22, envMapIntensity: 1.3 });
    else Object.assign(o, { metalness: gold ? .9 : .15, roughness: gold ? .28 : .52, envMapIntensity: .8 });
    if (gold) { o.metalness = Math.min(o.metalness, .75); o.emissive = new T.Color('#8a5c00'); o.emissiveIntensity = .55; } return MATS[key] = new T.MeshStandardMaterial(o); }
  function bake(scene, len, rotY, over) {
    scene.updateMatrixWorld(true); var parts = {};
    scene.traverse(function (o) { if (!o.isMesh) return; var g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); g.applyMatrix4(o.matrixWorld); var nm = (o.material.name || o.name || '').replace(/\.\d+$/, ''), key = o.material.name || '';
      var c = new T.Color((over && over[nm]) || GPAL[key] || GPAL[nm] || '#555a62'), cls = CLS[key] || CLS[nm] || 'p'; (parts[cls] = parts[cls] || []).push([g, c]); });
    var all = new T.Box3(), groups = [];
    Object.keys(parts).forEach(function (cls) { var P = parts[cls], n = 0; P.forEach(function (p) { n += p[0].attributes.position.count; });
      var pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), uv = new Float32Array(n * 2), o2 = 0;
      P.forEach(function (p) { var g = p[0], c = g.attributes.position.count, a = g.attributes.position.array; pos.set(a, o2 * 3); nor.set(g.attributes.normal.array, o2 * 3);
        for (var i = 0; i < c; i++) { var j = (o2 + i) * 3, sh = .92 + .16 * ((Math.sin(a[i * 3] * 41.3 + a[i * 3 + 2] * 17.1) + 1) / 2); col[j] = p[1].r * sh; col[j + 1] = p[1].g * sh; col[j + 2] = p[1].b * sh; uv[(o2 + i) * 2] = a[i * 3] * 3 + a[i * 3 + 2] * 3; uv[(o2 + i) * 2 + 1] = a[i * 3 + 1] * 3; } o2 += c; });
      var G = new T.BufferGeometry(); G.setAttribute('position', new T.BufferAttribute(pos, 3)); G.setAttribute('normal', new T.BufferAttribute(nor, 3)); G.setAttribute('color', new T.BufferAttribute(col, 3)); G.setAttribute('uv', new T.BufferAttribute(uv, 2));
      if (rotY) G.rotateY(rotY * Math.PI / 2); G.computeBoundingBox(); all.union(G.boundingBox); groups.push([G, cls]); });
    var L = all.max.x - all.min.x, s = len / L, out = new T.Group(); all.min.multiplyScalar(s); all.max.multiplyScalar(s);
    var tx = -(all.min.x + all.max.x) / 2 + len * .12, ty = -(all.min.y + all.max.y) / 2 - (all.max.y - all.min.y) * .08, tz = -(all.min.z + all.max.z) / 2;
    groups.forEach(function (q) { q[0].scale(s, s, s); q[0].translate(tx, ty, tz); q[0].computeBoundingSphere(); var m = new T.Mesh(q[0], gmat(q[1], over)); m.castShadow = true; out.add(m); });
    return out;
  }
  /* ===== Nouveaux modèles faits main (PBR) ===== */
  function mag(g, x, y, w, h, curve, mt) { var s0 = new T.Shape(); s0.moveTo(x, y); s0.lineTo(x + w, y); s0.quadraticCurveTo(x + w + curve * .5, y - h * .5, x + w + curve, y - h); s0.lineTo(x + curve, y - h); s0.quadraticCurveTo(x + curve * .5, y - h * .5, x, y); var gg = new T.ExtrudeGeometry(s0, { depth: .022, bevelEnabled: true, bevelThickness: .005, bevelSize: .005, bevelSegments: 2 }); gg.translate(0, 0, -.011); var m = new T.Mesh(gg, mt); g.add(m); return m; }
  /* FUSIL D'ASSAUT : carabine moderne (crosse télescopique, carcasse à rail, poignée de transport, garde-main à rails, guidon triangle, chargeur courbé) */
  B.ar = function (g, c) {
    var PL = M('#2b2e34', { rough: .55, metal: .15, shininess: 30 }), BK = M('#17181c', { rough: .4, metal: .6, shininess: 70 }), GR = M('#4a4f58', { rough: .35, metal: .8, shininess: 90 });
    cyl(g, .018, .018, .24, -.33, .02, 0, GR, 12);   // tube de crosse
    ext(g, [[-.56, -.07], [-.43, -.04], [-.36, -.01], [-.36, .05], [-.48, .055], [-.56, .045], [-.58, -.05]], .05, PL, 0, .01);   // crosse télescopique
    boxm(g, .02, .12, .054, -.575, -.005, 0, BK);   // talon caoutchouc
    ext(g, [[-.2, -.04], [.1, -.04], [.12, -.02], [.12, .02], [-.2, .02]], .056, BK, 0, .008);   // carcasse basse
    ext(g, [[-.21, .02], [.15, .02], [.15, .072], [-.21, .072]], .052, GR, 0, .008);   // carcasse haute
    rail(g, -.2, .14, .078, .03, BK);
    ext(g, [[-.16, .09], [.05, .09], [.06, .15], [-.14, .15], [-.15, .12]], .022, BK, 0, .005, [[[-.12, .1], [.02, .1], [.02, .13], [-.12, .13]]]);   // poignée de transport
    boxm(g, .03, .02, .024, .03, .155, 0, BK);
    ext(g, [[.15, -.015], [.42, -.012], [.42, .07], [.15, .072]], .066, PL, 0, .012);   // garde-main
    for (var i = 0; i < 6; i++) boxm(g, .028, .012, .07, .18 + i * .042, .028, 0, BK);   // fentes d'aération
    cyl(g, .012, .012, .3, .55, .028, 0, BK, 12); ext(g, [[.6, .028], [.64, .028], [.63, .11], [.615, .11]], .016, BK, 0, .004);   // canon + guidon
    cyl(g, .018, .016, .06, .72, .028, 0, BK, 10); for (var j = 0; j < 4; j++) boxm(g, .04, .004, .038, .72, .028 + Math.sin(j * 1.57) * .016, Math.cos(j * 1.57) * .016, M('#050505'));   // cache-flamme
    mag(g, .03, -.03, .06, .2, .05, BK);   // chargeur courbé
    ext(g, [[-.1, -.04], [-.04, -.04], [-.065, -.16], [-.125, -.15]], .046, PL, 0, .01); guard(g, -.01, -.04, .024, BK);   // poignée
    boxm(g, .05, .014, .01, -.05, .045, .03, GR); cyl(g, .01, .01, .02, -.09, .05, .03, GR, 8); boxm(g, .04, .012, .02, -.2, .075, 0, BK);   // fenêtre d'éjection, assistance, levier d'armement
    accent(g, -.18, .1, .0, c, .056);
  };
  /* FUSIL DORÉ façon « SCAR » : carcasse haute monobloc anguleuse, rail sur toute la longueur, crosse pliante à appui-joue, canon court + frein de bouche, chargeur droit */
  B.scarx = function (g, c) {
    var G = M('#f5c445', { metal: .8, rough: .26, shininess: 120, emissive: '#5a3a00', emissiveIntensity: .45 }), BK = M('#1a1a1e', { rough: .5, metal: .25, shininess: 40 }), GR = M('#3a3d44', { metal: .8, rough: .3, shininess: 90 });
    ext(g, [[-.62, -.07], [-.5, -.05], [-.38, -.02], [-.25, -.02], [-.25, .06], [-.4, .07], [-.52, .085], [-.62, .07]], .052, G, 0, .012, [[[-.5, .0], [-.32, .01], [-.32, .04], [-.5, .045]]]);   // crosse pliante squelette
    boxm(g, .16, .03, .046, -.47, .095, 0, BK);   // appui-joue
    boxm(g, .025, .15, .056, -.625, .0, 0, BK);
    ext(g, [[-.26, -.045], [.12, -.045], [.14, -.025], [.14, .02], [-.26, .02]], .06, BK, 0, .008);   // carcasse basse polymère
    ext(g, [[-.27, .02], [.46, .02], [.48, .035], [.48, .08], [.4, .1], [-.27, .1]], .07, G, 0, .012);   // carcasse haute monobloc dorée
    rail(g, -.25, .45, .105, .032, BK); [-1, 1].forEach(function (sd) { rail(g, .2, .44, .05, .012, BK); boxm(g, .24, .012, .006, .32, .05, sd * .038, BK); });
    boxm(g, .03, .03, .012, -.08, .075, .042, GR);   // levier d'armement sur le côté
    cyl(g, .015, .015, .2, .57, .05, 0, GR, 12); cyl(g, .024, .024, .08, .7, .05, 0, BK, 12); for (var i = 0; i < 3; i++) boxm(g, .012, .05, .056, .68 + i * .025, .05, 0, M('#0a0a0a'));   // canon + frein de bouche
    ext(g, [[.02, -.045], [.1, -.045], [.105, -.2], [.03, -.205]], .03, BK, 0, .006);   // chargeur droit
    ext(g, [[-.11, -.045], [-.05, -.045], [-.075, -.17], [-.14, -.16]], .046, BK, 0, .01); guard(g, .0, -.045, .024, BK);
    ext(g, [[.28, .02], [.32, .02], [.31, -.08], [.28, -.08]], .03, BK, 0, .008);   // poignée avant
    boxm(g, .08, .045, .036, .05, .135, 0, BK); cyl(g, .02, .02, .004, .092, .135, 0, M('#ff2b4a', { emissive: '#ff0020', emissiveIntensity: 1.2 }), 12);   // viseur point rouge
    accent(g, -.24, .44, .062, '#fff3c0', .07);
  };
  /* POMPE AUTO, gros pompe à l'ancienne : crosse et pompe en bois, carcasse épaisse, gros canon + tube, porte-cartouches rouges, guidon perle */
  B.pump = function (g, c) {
    var W = WOOD(), ST2 = M('#5a606a', { metal: .85, rough: .32, shininess: 90 }), BK = M('#1c1d21', { metal: .6, rough: .4, shininess: 60 });
    ext(g, [[-.66, -.12], [-.4, -.045], [-.24, -.03], [-.24, .045], [-.4, .055], [-.66, .045], [-.68, -.09]], .064, W, 0, .015);   // crosse bois
    boxm(g, .03, .17, .068, -.68, -.035, 0, M('#141414', { rough: .9 }));   // plaque de couche
    ext(g, [[-.26, -.045], [.1, -.045], [.12, -.02], [.12, .065], [-.26, .065]], .078, ST2, 0, .012);   // grosse carcasse
    boxm(g, .1, .02, .01, -.06, .02, .042, BK);   // fenêtre d'éjection
    cyl(g, .028, .028, .66, .44, .04, 0, BK, 18); cyl(g, .034, .034, .03, .77, .04, 0, ST2, 18);   // gros canon
    cyl(g, .024, .024, .54, .38, -.018, 0, ST2, 16); cyl(g, .028, .028, .025, .66, -.018, 0, BK, 16);   // tube magasin
    var pm = cyl(g, .045, .045, .24, .26, -.008, 0, W, 20); for (var i = 0; i < 8; i++) cyl(g, .047, .047, .01, .16 + i * .028, -.008, 0, M('#4a2a12', { rough: .8 }), 20);   // pompe rainurée
    cyl(g, .009, .009, .012, .77, .075, 0, M('#ffd23d', { emissive: '#aa7700', emissiveIntensity: .7 }), 10);   // guidon perle
    ext(g, [[-.18, -.045], [-.11, -.045], [-.14, -.17], [-.21, -.16]], .052, W, 0, .012); guard(g, -.07, -.045, .028, BK);
    boxm(g, .12, .055, .012, -.5, .0, .036, BK); for (var s2 = 0; s2 < 4; s2++) cyl(g, .012, .012, .055, -.545 + s2 * .03, .0, .045, M('#d82a2a', { rough: .5 }), 10, 'y');   // porte-cartouches
    accent(g, -.24, .1, .02, c, .078);
  };
  /* PM FANTÔME (légendaire) : carcasse anguleuse en carbone noir, plaques dorées, lignes d'énergie violettes qui brillent, chargeur latéral transparent, canon à ailettes */
  B.pmx = function (g, c) {
    var CB = M('#16151b', { shininess: 70, rough: .35, metal: .4 }), GD = M('#ffc23a', { shininess: 120, metal: 1, rough: .22 }), GL = M('#b44bff', { emissive: '#9a2bff', emissiveIntensity: 1.6, shininess: 60 }),
      GL2 = M('#4ae0ff', { emissive: '#18b8ff', emissiveIntensity: 1.4, shininess: 60 }), ST = STEEL(), GLASS = M('#c9a3ff', { transparent: true, opacity: .45, shininess: 140, emissive: '#5a1a9a', emissiveIntensity: .5 });
    ext(g, [[-.16, -.035], [.2, -.035], [.26, -.005], [.26, .045], [.14, .07], [-.12, .07], [-.18, .04]], .06, CB, 0, .01);   // carcasse
    ext(g, [[-.1, .07], [.13, .07], [.1, .092], [-.08, .092]], .044, GD, 0, .006);   // capot doré
    rail(g, -.08, .1, .1, .026, DARK());
    ext(g, [[.26, .0], [.36, .006], [.36, .04], [.26, .045]], .05, CB, 0, .006);   // garde-main
    cyl(g, .014, .014, .14, .41, .022, 0, ST, 14); for (var i = 0; i < 5; i++) boxm(g, .006, .04, .04, .37 + i * .016, .022, 0, CB);   // canon à ailettes
    cyl(g, .019, .019, .03, .49, .022, 0, GD, 14);
    ext(g, [[.04, -.035], [.1, -.035], [.12, -.19], [.06, -.2]], .03, CB, 0, .006); ext(g, [[.055, -.06], [.09, -.06], [.105, -.17], [.07, -.175]], .034, GLASS, 0, .003);   // chargeur transparent
    for (var j = 0; j < 5; j++) cyl(g, .007, .007, .028, .07 + j * .006, -.08 - j * .018, 0, M('#ffd34a', { metal: 1, rough: .2, shininess: 120 }), 8, 'y');   // balles visibles
    ext(g, [[-.07, -.035], [-.02, -.035], [-.045, -.16], [-.1, -.155]], .044, CB, 0, .01); guard(g, .01, -.035, .022, GD);   // poignée
    ext(g, [[.18, -.035], [.22, -.035], [.21, -.11], [.18, -.11]], .03, CB, 0, .006);   // poignée avant
    ext(g, [[-.16, .03], [-.36, .05], [-.38, -.06], [-.32, -.07], [-.3, -.01], [-.16, -.01]], .04, CB, 0, .008, [[[-.33, .02], [-.22, .015], [-.22, .0], [-.33, -.03]]]);   // crosse squelette
    boxm(g, .1, .006, .004, -.27, .035, .022, GD); boxm(g, .1, .006, .004, -.27, .035, -.022, GD);
    boxm(g, .06, .036, .036, .0, .125, 0, CB); cyl(g, .016, .016, .003, .031, .125, 0, GL2, 12);   // viseur holo
    var ring = new T.Mesh(new T.TorusGeometry(.028, .004, 6, 20), GL); ring.position.set(.03, .148, 0); ring.rotation.y = Math.PI / 2; g.add(ring);
    [-1, 1].forEach(function (sd) { boxm(g, .3, .007, .003, .05, .03, sd * .032, GL); boxm(g, .12, .007, .003, .3, .024, sd * .027, GL); boxm(g, .05, .022, .003, -.12, .04, sd * .032, GD); });   // lignes d'énergie
    boxm(g, .02, .02, .07, .15, .045, 0, GL2);
  };
  /* LANCE-PATATE : tube orange en PVC, chambre de combustion rouge, scotch gris, crosse en bois, bouton d'allumage, une patate au bout */
  B.patate = function (g, c) {
    var pvc = M('#ff7a1a', { shininess: 70, specular: '#ffd0a0' }), red = M('#d82a2a', { shininess: 60 }), tape = M('#8a8f98', { shininess: 20 });
    cyl(g, .045, .045, .62, .2, .03, 0, pvc, 20); cyl(g, .052, .052, .04, .5, .03, 0, pvc, 20);
    cyl(g, .085, .085, .22, -.18, .03, 0, red, 22); cyl(g, .07, .045, .06, -.04, .03, 0, red, 22); cyl(g, .09, .09, .02, -.29, .03, 0, M('#222'), 22);
    [.02, .16, .33].forEach(function (x) { cyl(g, .049, .049, .03, x, .03, 0, tape, 20); });
    ext(g, [[-.33, -.03], [-.2, -.03], [-.16, -.16], [-.42, -.14], [-.44, -.06]], .05, WOOD(), 0, .01);   // crosse
    ext(g, [[-.04, -.04], [.02, -.04], [0, -.15], [-.06, -.15]], .045, POLY(), 0, .008); guard(g, .02, -.05, .025, POLY());
    cyl(g, .015, .015, .03, -.12, .12, 0, red, 10, 'y'); var bt = cyl(g, .012, .012, .015, -.12, .14, 0, M('#ffd23d', { emissive: '#7a5a00' }), 10, 'y');
    var pot = new T.Mesh(new T.SphereGeometry(.055, 14, 10), M('#b8864a', { shininess: 8 })); pot.scale.set(1.3, .9, .9); pot.position.set(.55, .03, 0); g.add(pot);
    boxm(g, .03, .03, .012, .45, .09, 0, DARK()); accent(g, -.25, -.1, .1, c, .17);
  };
  /* LANCE-ROQUETTE : gros tube kaki, pavillon arrière évasé, roquette rouge qui dépasse, poignée, viseur, bandes jaunes */
  B.roquette = function (g, c) {
    var olive = M('#4a5a32', { shininess: 30 }), dkO = M('#2e3820'), yel = M('#ffd23d', { shininess: 50 });
    cyl(g, .075, .075, .95, .02, .04, 0, olive, 22); cyl(g, .075, .11, .14, -.52, .04, 0, dkO, 22); cyl(g, .08, .08, .03, .48, .04, 0, dkO, 22);
    [.3, -.25].forEach(function (x) { cyl(g, .077, .077, .03, x, .04, 0, yel, 22); });
    var war = new T.Mesh(new T.ConeGeometry(.06, .2, 18), M('#d8302a', { shininess: 80 })); war.rotation.z = -Math.PI / 2; war.position.set(.6, .04, 0); g.add(war);
    cyl(g, .062, .062, .06, .5, .04, 0, M('#e8e0d0'), 18);
    ext(g, [[.02, -.03], [.08, -.03], [.06, -.17], [0, -.17]], .05, POLY(), 0, .01); guard(g, .08, -.04, .025, POLY());
    ext(g, [[-.18, -.03], [-.12, -.03], [-.13, -.13], [-.19, -.13]], .05, POLY(), 0, .01);
    boxm(g, .12, .05, .04, .05, .14, .05, DARK()); cyl(g, .02, .02, .06, .14, .14, .05, M('#3aa8ff', { emissive: '#0a3a6a', shininess: 120 }), 12);
    boxm(g, .22, .06, .02, -.3, .04, -.085, M('#3a2a1a'));   // appui d'épaule
    accent(g, -.1, .2, .12, c, .15);
  };
  /* LANCEUR LASER : coque blanche futuriste, anneaux d'émetteur roses qui brillent, batterie cyan, ailerons */
  B.laser = function (g, c) {
    var wh = M('#f2f0f8', { shininess: 110, specular: '#ffffff' }), pk = M('#ff2bd6', { emissive: '#ff2bd6', emissiveIntensity: 1, shininess: 90 }), cy = M('#3dd6ff', { emissive: '#1a8ab0', emissiveIntensity: .9, shininess: 120 });
    ext(g, [[-.22, -.02], [.14, -.03], [.3, 0], [.3, .05], [.1, .07], [-.18, .07], [-.24, .04]], .07, wh, 0, .015);
    ext(g, [[-.06, -.02], [0, -.02], [-.03, -.16], [-.09, -.16]], .05, POLY(), 0, .01); guard(g, .0, -.03, .025, POLY());
    cyl(g, .022, .022, .22, .38, .025, 0, DARK(), 16); [.3, .36, .42, .48].forEach(function (x) { cyl(g, .034, .034, .014, x, .025, 0, pk, 18); });
    cyl(g, .014, .014, .03, .505, .025, 0, M('#ffffff', { emissive: '#ffc0f0', emissiveIntensity: 1 }), 12);
    boxm(g, .14, .05, .074, -.1, .025, 0, cy);   // batterie
    [-1, 1].forEach(function (sd) { ext(g, [[-.2, .06], [-.08, .06], [-.16, .14]], .01, pk, sd * .03, .002); });
    rail(g, -.12, .08, .078, .03, DARK());
  };
  window.buildGun = function (THREE, k, rc) { T = THREE; var g = new THREE.Group();
    if (GUNT[k]) { var m = GUNT[k].clone(); g.add(m); g.userData.real = true; g.userData.gscale = 1; return g; }   // vraie arme 3D (déjà à la bonne taille)
    ({ fusil: B.ar, scar: B.scarx, pompe: B.pump }[k] || B[k] || (k === 'pompeS' ? B.pompe : B.pistolet))(g, rc || '#ffffff'); g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; } }); return g; };

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
  function waldcar(THREE) { if (window.buildPolo) return waldcarPolo(THREE); return waldcarOld(THREE); }
  // la vraie La Wald (polo3d.js) en version gonflable : plastique brillant, coutures roses, valve, cordes
  function waldcarPolo(THREE) { var g = new THREE.Group(), car = window.buildPolo(THREE, { lite: true }), Y = 2.25, S2 = 1.32;
    car.traverse(function (o) { if (!o.isMesh) return; var mats = Array.isArray(o.material) ? o.material : [o.material];
      var nm = mats.map(function (m) { var c = m.color ? m.color.clone() : new THREE.Color(1, 1, 1); return new THREE.MeshPhongMaterial({ color: c, map: m.map || null, shininess: 120, specular: new THREE.Color(.45, .45, .55), emissive: m.map ? new THREE.Color(.02, .05, .16) : c.clone().multiplyScalar(.08), transparent: m.transparent, opacity: m.opacity, side: m.side }); });
      o.material = Array.isArray(o.material) ? nm : nm[0]; o.castShadow = true; });
    car.scale.setScalar(S2); car.position.y = Y; g.add(car);
    var box = new THREE.Box3().setFromObject(car), mn = box.min, mx = box.max, cz = (mn.z + mx.z) / 2, cx = (mn.x + mx.x) / 2;
    // coutures roses de bouée tout autour de la caisse + valve jaune sur le capot
    var seam = M('#ff2bd6', { emissive: '#7a0060', emissiveIntensity: .6 });
    [.5, .95].forEach(function (yy, k) { var r = new THREE.Mesh(new THREE.TorusGeometry(1, .06, 6, 48), seam); r.rotation.x = Math.PI / 2; r.position.set(cx, Y + yy * S2, cz); r.scale.set(2.08 * S2 - k * .25, .92 * S2, 1); g.add(r); });   // coutures de bouée
    var valve = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .22, 10), M('#ffd23d', { shininess: 120 })); valve.position.set(cx + 1.2 * S2, Y + 1.0 * S2, cz); g.add(valve);
    var cap = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), M('#ffd23d')); cap.position.copy(valve.position).add(new THREE.Vector3(0, .13, 0)); g.add(cap);
    ropes(g, [[mx.x - .5, mn.y + .25, mx.z - .2], [mx.x - .5, mn.y + .25, mn.z + .2], [mn.x + .5, mn.y + .25, mx.z - .2], [mn.x + .5, mn.y + .25, mn.z + .2]]);
    g.traverse(function (o) { if (o.isMesh) o.castShadow = true; }); return g; }
  function waldcarOld(THREE) { var g = new THREE.Group(), Y = 2.5, body = M('#16161c', { shininess: 160, specular: '#ffffff', emissive: '#08040e' }), red = M('#ff1f3a', { emissive: '#ff0020', emissiveIntensity: .7 }), gl = M('#9fd8ff', { shininess: 160, specular: '#ffffff', transparent: true, opacity: .75 }), pink = M('#ff2bd6', { emissive: '#7a0060' }), tyre = M('#26262c', { shininess: 80 }), chrome = M('#e8ecf2', { shininess: 160, specular: '#ffffff' });
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
