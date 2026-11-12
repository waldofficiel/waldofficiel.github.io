/* La Polo cabriolet de Wald Off en 3D (three.js r128).
   Avant de la voiture = +x, droite = +z, sol = y 0. Longueur ≈ 4,1 m.
   Utilisée par le jeu (carModel) et par la page polo3d.html. */
(function () {
  'use strict';
  function buildPolo(THREE, opt) {
    opt = opt || {};
    var lite = !!opt.lite, M = lite ? THREE.MeshLambertMaterial : THREE.MeshStandardMaterial;
    var car = new THREE.Group();

    /* ---------- matières ---------- */
    function canvasTex(w, h, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; }
    // peinture bleu nuit, sale en bas (boue des champs)
    var dirt = canvasTex(512, 256, function (g, w, h) {
      g.fillStyle = '#1e2638'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 1400; i++) { var y = h - Math.pow(Math.random(), 1.8) * h * .75, x = Math.random() * w, r = 1 + Math.random() * 6 * (y / h);
        g.fillStyle = 'rgba(' + (95 + Math.random() * 40 | 0) + ',' + (75 + Math.random() * 30 | 0) + ',' + (55 + Math.random() * 20 | 0) + ',' + (.08 + Math.random() * .35 * (y / h)) + ')'; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill(); }
      for (i = 0; i < 260; i++) { g.fillStyle = 'rgba(200,205,215,' + Math.random() * .06 + ')'; g.fillRect(Math.random() * w, Math.random() * h * .6, 1 + Math.random() * 30, 1); }   // micro-rayures
    });
    dirt.wrapS = dirt.wrapT = THREE.RepeatWrapping; dirt.repeat.set(1 / 4.3, 1 / 1.1); dirt.offset.set(.5, -.25);
    var paint = new M(lite ? { map: dirt } : { map: dirt, metalness: .35, roughness: .55 });
    var plastic = new M(lite ? { color: '#141519' } : { color: '#141519', roughness: .85 });
    var steel = new M(lite ? { color: '#1d1f24' } : { color: '#1d1f24', metalness: .6, roughness: .5 });
    var chrome = new M(lite ? { color: '#d7dbe2' } : { color: '#d7dbe2', metalness: 1, roughness: .2 });
    var rubber = new M(lite ? { color: '#0d0d0f' } : { color: '#0d0d0f', roughness: .95 });
    var seatM = new M(lite ? { color: '#2c4ea8' } : { color: '#2c4ea8', roughness: .8 });
    var seatD = new M(lite ? { color: '#1d2f66' } : { color: '#1d2f66', roughness: .8 });
    var glass = new THREE.MeshStandardMaterial({ color: '#9fc9ff', transparent: true, opacity: .28, metalness: .1, roughness: .05, side: THREE.DoubleSide, depthWrite: false });
    var lens = new THREE.MeshStandardMaterial({ color: '#e9f2ff', emissive: '#c9dcff', emissiveIntensity: opt.lights ? 1.2 : .15, transparent: true, opacity: .9, roughness: .1 });
    var red = new THREE.MeshStandardMaterial({ color: '#b3121a', emissive: '#ff1a1a', emissiveIntensity: opt.lights ? .9 : .12, roughness: .3 });
    var rust = new M(lite ? { color: '#7a4422' } : { color: '#7a4422', roughness: 1 });
    var pipeM = new M(lite ? { color: '#a3a7ae' } : { color: '#a3a7ae', metalness: .7, roughness: .45 });
    function add(geo, mat, x, y, z, rx, ry, rz, par) { var m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, rz || 0); (par || car).add(m); return m; }
    function bx(w, h, d, mat, x, y, z, rx, ry, rz, par) { return add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, rx, ry, rz, par); }

    /* ---------- caisse : profil latéral extrudé, avec les passages de roue ---------- */
    var WF = 1.25, WR = -1.27, RW = .43;
    var s = new THREE.Shape();
    s.moveTo(-2.06, .34);
    s.lineTo(WR - RW - .02, .34); s.absarc(WR, .34, RW + .02, Math.PI, 0, true);
    s.lineTo(WF - RW - .02, .34); s.absarc(WF, .34, RW + .02, Math.PI, 0, true);
    s.lineTo(1.98, .34); s.quadraticCurveTo(2.1, .36, 2.1, .5); s.lineTo(2.1, .72); s.quadraticCurveTo(2.08, .82, 1.96, .85);   // nez
    s.lineTo(.74, .99);                                   // capot jusqu'au pare-brise
    s.lineTo(.7, .66); s.lineTo(-1.18, .66);              // creux de l'habitacle
    s.lineTo(-1.24, .98); s.lineTo(-1.9, .99);            // couvre-capote / coffre
    s.quadraticCurveTo(-2.07, .98, -2.09, .84); s.lineTo(-2.1, .5); s.quadraticCurveTo(-2.1, .36, -2.06, .34);
    var depth = 1.56, body = new THREE.ExtrudeGeometry(s, { depth: depth, bevelEnabled: true, bevelThickness: .07, bevelSize: .06, bevelSegments: lite ? 2 : 4, curveSegments: lite ? 10 : 24 });
    body.translate(0, 0, -depth / 2); add(body, paint, 0, 0, 0);
    // flancs des portières (le haut de la caisse autour de l'habitacle)
    var d = new THREE.Shape(); d.moveTo(.72, .6); d.lineTo(.74, .99); d.lineTo(-1.24, .98); d.lineTo(-1.2, .6); d.lineTo(.72, .6);
    [-1, 1].forEach(function (side) {
      var g = new THREE.ExtrudeGeometry(d, { depth: .08, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 2 }); g.translate(0, 0, -.04);
      add(g, paint, 0, 0, side * (depth / 2 + .02));
      bx(1.75, .04, .03, plastic, -.25, 1.0, side * (depth / 2 + .07));                       // joint noir du haut de portière
      bx(.012, .62, .02, plastic, -.42, .66, side * (depth / 2 + .1));                        // ligne de portière
      bx(.012, .62, .02, plastic, .66, .66, side * (depth / 2 + .1));
      bx(.16, .04, .03, plastic, .3, .82, side * (depth / 2 + .1));                           // poignée
      bx(.04, .5, .03, plastic, -1.0, .72, side * (depth / 2 + .1), 0, 0, -.1);                // joint de custode
      bx(1.2, .08, .02, plastic, -.25, .45, side * (depth / 2 + .1));                         // baguette de protection
      var mir = new THREE.Group(); mir.position.set(.6, 1.02, side * (depth / 2 + .12)); car.add(mir);   // rétro
      bx(.06, .06, .14, plastic, 0, 0, side * -.04, 0, 0, 0, mir); bx(.1, .13, .2, plastic, -.03, .02, side * .1, 0, 0, 0, mir);
    });
    // dessous / passages de roue sombres
    bx(3.6, .2, depth - .1, plastic, 0, .32, 0);

    /* ---------- avant ---------- */
    bx(.22, .24, 1.74, plastic, 2.14, .45, 0);                 // pare-chocs
    bx(.06, .06, 1.2, plastic, 2.25, .38, 0);
    bx(.05, .17, .86, plastic, 2.17, .69, 0);                  // calandre
    for (var gy = 0; gy < 3; gy++) bx(.02, .02, .84, steel, 2.2, .63 + gy * .055, 0);
    add(new THREE.CylinderGeometry(.075, .075, .03, 24), chrome, 2.205, .69, 0, 0, 0, Math.PI / 2);   // logo rond
    add(new THREE.TorusGeometry(.06, .01, 6, 24), plastic, 2.222, .69, 0, 0, Math.PI / 2, 0);
    [-1, 1].forEach(function (side) {                          // phares rectangulaires
      bx(.06, .17, .36, plastic, 2.15, .7, side * .63);
      bx(.03, .14, .33, lens, 2.18, .7, side * .63);
      bx(.03, .05, .1, new THREE.MeshStandardMaterial({ color: '#ffa53a', emissive: '#ff8a00', emissiveIntensity: .2 }), 2.255, .48, side * .74);   // clignotants
    });
    plate(2.258, .45, 0, 0);                                     // plaque avant
    bx(.12, .02, .5, plastic, 1.15, .955, 0, 0, 0, .12);       // ligne du capot

    /* ---------- arrière ---------- */
    bx(.22, .24, 1.74, plastic, -2.14, .46, 0);
    [-1, 1].forEach(function (side) { bx(.05, .2, .36, red, -2.16, .8, side * .6); bx(.05, .06, .36, new THREE.MeshStandardMaterial({ color: '#ddd', emissive: '#555', emissiveIntensity: .2 }), -2.165, .68, side * .6); });
    add(new THREE.CylinderGeometry(.07, .07, .03, 24), chrome, -2.175, .8, 0, 0, 0, Math.PI / 2);
    plate(-2.258, .46, 0, Math.PI);
    var polo = canvasTex(256, 64, function (g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = '#d9dde4'; g.font = '700 46px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('POLO', w / 2, h / 2 + 2); });
    add(new THREE.PlaneGeometry(.3, .075), new THREE.MeshBasicMaterial({ map: polo, transparent: true }), -2.175, .92, .42, 0, -Math.PI / 2, 0);
    add(new THREE.CylinderGeometry(.035, .035, .2, 12), steel, -2.2, .3, -.45, 0, 0, Math.PI / 2);   // sortie d'échappement d'origine

    /* ---------- pare-brise ---------- */
    var ws = new THREE.Group(); ws.position.set(.74, .99, 0); ws.rotation.z = .72; car.add(ws);
    [-1, 1].forEach(function (side) { bx(.05, .62, .06, plastic, 0, .31, side * .74, 0, 0, 0, ws); });
    bx(.07, .06, 1.54, plastic, 0, .62, 0, 0, 0, 0, ws);
    bx(.01, .58, 1.42, glass, 0, .31, 0, 0, 0, 0, ws);
    bx(.02, .02, .45, plastic, .03, .06, -.25, 0, .3, 0, ws); bx(.02, .02, .45, plastic, .03, .06, .25, 0, .3, 0, ws);   // essuie-glaces
    bx(.06, .08, .22, plastic, -.04, .57, .1, 0, 0, 0, ws);   // rétro intérieur

    /* ---------- intérieur ---------- */
    bx(.4, .26, 1.48, plastic, .5, .86, 0);                   // tableau de bord
    bx(1.85, .05, 1.46, new M({ color: '#24252b' }), -.25, .66, 0);   // moquette
    var wheel = new THREE.Group(); wheel.position.set(.3, .98, -.36); wheel.rotation.z = 1.1; car.add(wheel);
    add(new THREE.TorusGeometry(.17, .022, 8, 28), plastic, 0, 0, 0, Math.PI / 2, 0, 0, wheel); bx(.02, .04, .3, plastic, 0, 0, 0, 0, 0, 0, wheel);
    add(new THREE.CylinderGeometry(.03, .03, .3, 8), plastic, .1, .9, -.36, 0, 0, 1.1);
    function seat(x, z) { var g = new THREE.Group(); g.position.set(x, .68, z); car.add(g);
      bx(.5, .14, .5, seatM, 0, .07, 0, 0, 0, 0, g); bx(.12, .6, .5, seatM, -.27, .36, 0, 0, 0, .12, g); bx(.1, .2, .3, seatM, -.31, .76, 0, 0, 0, .12, g);
      bx(.5, .06, .06, seatD, 0, .16, .23, 0, 0, 0, g); bx(.5, .06, .06, seatD, 0, .16, -.23, 0, 0, 0, g); }
    seat(-.12, -.36); seat(-.12, .36);
    bx(.44, .14, 1.3, seatM, -.92, .75, 0); bx(.12, .44, 1.3, seatM, -1.12, .96, 0, 0, 0, .15);   // banquette
    bx(.2, .3, .08, plastic, .02, .78, 0);                     // levier / console
    // arceau de sécurité (comme le vrai cabriolet)
    var arch = new THREE.CatmullRomCurve3([new THREE.Vector3(-.55, .98, -.8), new THREE.Vector3(-.58, 1.42, -.72), new THREE.Vector3(-.6, 1.5, 0), new THREE.Vector3(-.58, 1.42, .72), new THREE.Vector3(-.55, .98, .8)]);
    add(new THREE.TubeGeometry(arch, 32, .055, 8, false), plastic, 0, 0, 0);
    // capote repliée
    bx(.42, .16, 1.4, new M({ color: '#111216' }), -1.5, 1.05, 0);

    /* ---------- le pot d'échappement qui sort du capot ---------- */
    var px = 1.32, pz = .3, py = .93;
    bx(.22, .03, .2, rust, px, py + .015, pz);                       // platine rouillée
    add(new THREE.CylinderGeometry(.075, .075, .38, 18), pipeM, px, py + .22, pz);   // silencieux
    add(new THREE.CylinderGeometry(.08, .08, .03, 18), rust, px, py + .41, pz); add(new THREE.CylinderGeometry(.08, .08, .03, 18), rust, px, py + .04, pz);
    add(new THREE.CylinderGeometry(.036, .036, .78, 12), pipeM, px, py + .8, pz);    // tube
    var bend = add(new THREE.TorusGeometry(.12, .036, 10, 16, Math.PI / 2), pipeM, px + .12, py + 1.19, pz, 0, 0, Math.PI / 2);   // coude vers l'avant
    add(new THREE.CylinderGeometry(.036, .036, .12, 12), pipeM, px + .18, py + 1.31, pz, 0, 0, Math.PI / 2);
    var can = canvasTex(128, 64, function (g, w, h) { g.fillStyle = '#7f9bb5'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8eef4'; g.fillRect(0, 18, w, 24); g.fillStyle = '#2a3a55'; g.font = '700 14px Arial'; g.fillText('WALD', 40, 35); });
    add(new THREE.CylinderGeometry(.065, .065, .16, 18), new M(lite ? { map: can } : { map: can, metalness: .5, roughness: .4 }), px + .3, py + 1.31, pz, 0, 0, Math.PI / 2);   // la canette au bout

    /* ---------- roues (jantes tôle noires) ---------- */
    car.userData.wheels = [];
    [[WF, 1], [WF, -1], [WR, 1], [WR, -1]].forEach(function (w) {
      var g = new THREE.Group(); g.position.set(w[0], .33, w[1] * (depth / 2 - .02)); car.add(g); car.userData.wheels.push(g);
      add(new THREE.CylinderGeometry(.33, .33, .21, lite ? 16 : 28), rubber, 0, 0, 0, Math.PI / 2, 0, 0, g);
      add(new THREE.TorusGeometry(.29, .045, 8, lite ? 16 : 28), rubber, 0, 0, w[1] * .1, 0, 0, 0, g);
      add(new THREE.CylinderGeometry(.21, .21, .22, lite ? 14 : 24), steel, 0, 0, w[1] * .005, Math.PI / 2, 0, 0, g);
      add(new THREE.CylinderGeometry(.075, .075, .23, 12), chrome, 0, 0, w[1] * .01, Math.PI / 2, 0, 0, g);
      if (!lite) for (var k = 0; k < 6; k++) { var a = k / 6 * Math.PI * 2; add(new THREE.CylinderGeometry(.03, .03, .225, 8), plastic, Math.cos(a) * .14, Math.sin(a) * .14, w[1] * .006, Math.PI / 2, 0, 0, g); }
    });

    function plate(x, y, z, ry) {
      var t = canvasTex(256, 56, function (g, w, h) { g.fillStyle = '#f4f4f4'; g.fillRect(0, 0, w, h); g.fillStyle = '#1d3fa8'; g.fillRect(0, 0, 26, h); g.fillStyle = '#ffd23d'; g.font = '700 10px Arial'; g.fillText('F', 9, 46);
        g.fillStyle = '#111'; g.font = '700 34px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('WA-LD-OF', 140, 30); g.strokeStyle = '#111'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2); });
      add(new THREE.PlaneGeometry(.52, .11), new THREE.MeshBasicMaterial({ map: t }), x, y, z, 0, ry + Math.PI / 2, 0);
    }
    car.traverse(function (o) { if (o.isMesh) { o.castShadow = !lite; o.receiveShadow = !lite; } });
    return car;
  }
  window.buildPolo = buildPolo;
})();
