/* Wald Royal : le bus volant façon Mad Max (window.buildBus(THREE)).
   Vieux bus scolaire jaune rouillé, blindé et soudé : capot avec compresseur chromé, pare-buffle à pointes, grilles sur les phares,
   plaques de tôle rivetées sur les vitres, galerie de toit (caisses, bidons, pneus), cheminées d'échappement, ailes rivetées avec
   2 moteurs à hélice, 2 réacteurs qui crachent du feu, drapeau en lambeaux. Pas de texte sur les vitres.
   Tout le décor fixe est ensuite fusionné (OPT.mergeLocal) : seuls les hélices et les flammes restent à part (userData.dyn). */
(function () {
  var T;
  function cv(w, h, f) { var c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4; return t; }
  function rnd(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function rust(g, x, y, r, k) {   // tache de rouille : halo orangé, cœur brun, petites cloques
    var gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(70,32,14,.95)'); gr.addColorStop(.45, 'rgba(140,62,22,.8)'); gr.addColorStop(.8, 'rgba(176,96,36,.35)'); gr.addColorStop(1, 'rgba(176,96,36,0)');
    g.fillStyle = gr; g.beginPath(); for (var i = 0; i <= 14; i++) { var a = i / 14 * 6.283, rr = r * (.7 + rnd(k + i) * .45); g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * .8); } g.fill();
    for (i = 0; i < 6; i++) { g.fillStyle = 'rgba(60,26,10,.6)'; g.beginPath(); g.arc(x + (rnd(k * 3 + i) - .5) * r, y + (rnd(k * 5 + i) - .5) * r * .7, 1 + rnd(k + i * 7) * 3, 0, 6.283); g.fill(); }
  }
  function rivets(g, x0, y0, x1, y1, n) { for (var i = 0; i <= n; i++) { var x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.arc(x + .8, y + .8, 2.6, 0, 6.283); g.fill(); g.fillStyle = '#b8b2a4'; g.beginPath(); g.arc(x, y, 2.2, 0, 6.283); g.fill(); } }
  function plate(g, x, y, w, h, k) {   // tôle soudée sur une vitre
    g.fillStyle = ['#6d6a62', '#7c7468', '#5d5a55', '#8a6a4a'][k % 4]; g.fillRect(x, y, w, h);
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x, y, w, 3); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x, y + h - 3, w, 3);
    rust(g, x + w * rnd(k), y + h * rnd(k + 1), Math.min(w, h) * .45, k * 9); rivets(g, x + 5, y + 5, x + w - 5, y + 5, 5); rivets(g, x + 5, y + h - 5, x + w - 5, y + h - 5, 5);
    g.strokeStyle = 'rgba(40,30,20,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 4, y + h * .3); g.lineTo(x + w * .6, y + h * .5); g.stroke();
  }
  function sideTex() {
    return cv(1024, 320, function (g, W, H) {
      var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#e2b23a'); gr.addColorStop(.6, '#d49c2a'); gr.addColorStop(1, '#8a6224'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,240,200,.18)'; g.fillRect(0, 0, W, 10);
      for (var i = 0; i < 260; i++) { g.fillStyle = 'rgba(90,60,20,' + (rnd(i) * .12) + ')'; g.fillRect(rnd(i * 2) * W, rnd(i * 3) * H, 2 + rnd(i * 4) * 30, 1 + rnd(i * 5) * 3); }   // éraflures
      g.fillStyle = '#1b1a18'; g.fillRect(0, 196, W, 16); g.fillRect(0, 226, W, 8);   // bandes noires
      for (var w = 0; w < 8; w++) { var x = 40 + w * 120, y = 46;   // vitres : verre sale, reflet, barreaux ou tôle
        g.fillStyle = '#2a2e34'; g.fillRect(x - 4, y - 4, 104, 128); g.fillStyle = '#3a4a58'; g.fillRect(x, y, 96, 120);
        var rg = g.createLinearGradient(x, y, x + 96, y + 120); rg.addColorStop(0, 'rgba(255,255,255,.28)'); rg.addColorStop(.35, 'rgba(255,255,255,0)'); rg.addColorStop(.6, 'rgba(255,255,255,.1)'); rg.addColorStop(1, 'rgba(0,0,0,.2)'); g.fillStyle = rg; g.fillRect(x, y, 96, 120);
        if (w % 3 === 1) plate(g, x - 6, y - 6, 108, 132, w);
        else if (w % 3 === 2) { plate(g, x - 6, y + 52, 108, 74, w + 3); for (var b = 0; b < 4; b++) { g.fillStyle = '#4a4a48'; g.fillRect(x + 8 + b * 24, y, 6, 52); } }
        else { for (b = 0; b < 4; b++) { g.fillStyle = '#3c3c3a'; g.fillRect(x + 8 + b * 24, y, 6, 120); } g.fillStyle = '#3c3c3a'; g.fillRect(x, y + 56, 96, 6); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x + 60, y + 20); g.lineTo(x + 74, y + 44); g.lineTo(x + 66, y + 70); g.moveTo(x + 74, y + 44); g.lineTo(x + 90, y + 38); g.stroke(); } }
      for (i = 0; i < 16; i++) rust(g, rnd(i * 11) * W, 170 + rnd(i * 13) * 140, 14 + rnd(i * 17) * 30, i);   // rouille en bas de caisse
      for (i = 0; i < 7; i++) rust(g, rnd(i * 23 + 5) * W, rnd(i * 29) * 40, 8 + rnd(i) * 14, i + 40);
      rivets(g, 4, 192, W - 4, 192, 60); rivets(g, 4, 238, W - 4, 238, 60);
      for (i = 0; i < 5; i++) { g.strokeStyle = 'rgba(70,40,15,.5)'; g.lineWidth = 2; var sx = rnd(i * 41) * W; g.beginPath(); g.moveTo(sx, 170); for (var k = 0; k < 6; k++) g.lineTo(sx + (rnd(i + k) - .5) * 8, 170 + k * 22); g.stroke(); }   // coulures
    });
  }
  function metalTex(base) {
    return cv(256, 256, function (g, W, H) { g.fillStyle = base; g.fillRect(0, 0, W, H);
      for (var i = 0; i < 300; i++) { g.fillStyle = 'rgba(' + (rnd(i) > .5 ? '255,255,255' : '0,0,0') + ',' + rnd(i * 3) * .08 + ')'; g.fillRect(rnd(i * 5) * W, rnd(i * 7) * H, 1 + rnd(i * 9) * 20, 1); }
      for (i = 0; i < 5; i++) rust(g, rnd(i * 13) * W, rnd(i * 17) * H, 8 + rnd(i * 19) * 34, i + 70);
      rivets(g, 6, 6, W - 6, 6, 10); rivets(g, 6, H - 6, W - 6, H - 6, 10); });
  }
  function flagTex() { return cv(256, 128, function (g, W, H) { ['#ff2b4a', '#b44dff', '#ff2bd6', '#141016'].forEach(function (c, i) { g.fillStyle = c; g.fillRect(0, i * 32, W, 32); });
    g.globalCompositeOperation = 'destination-out'; for (var i = 0; i < 9; i++) { g.beginPath(); g.moveTo(W, rnd(i) * H); g.lineTo(W - 30 - rnd(i * 3) * 70, rnd(i * 5) * H); g.lineTo(W, rnd(i * 7) * H + 10); g.fill(); } g.globalCompositeOperation = 'source-over';
    for (i = 0; i < 6; i++) rust(g, rnd(i * 31) * W, rnd(i * 37) * H, 14, i + 90); }); }

  window.buildBus = function (THREE) {
    T = THREE; var b = new T.Group(), MC = {};
    function M(c, o) { var k = c + JSON.stringify(o || {}); return MC[k] || (MC[k] = new T.MeshLambertMaterial(Object.assign({ color: c }, o || {}))); }
    function add(geo, m, x, y, z, rx, ry, rz) { var o = new T.Mesh(geo, m); o.position.set(x || 0, y || 0, z || 0); o.rotation.set(rx || 0, ry || 0, rz || 0); o.castShadow = true; b.add(o); return o; }
    function bx(w, h, d, m, x, y, z, rx, ry, rz) { return add(new T.BoxGeometry(w, h, d), m, x, y, z, rx, ry, rz); }
    function cy(r1, r2, h, m, x, y, z, rx, ry, rz, seg) { return add(new T.CylinderGeometry(r1, r2, h, seg || 16), m, x, y, z, rx, ry, rz); }
    var side = sideTex(), rustM = new T.MeshLambertMaterial({ map: metalTex('#7a6a58') }), yel = new T.MeshLambertMaterial({ map: metalTex('#d4a02c') }), chrome = new T.MeshPhongMaterial({ color: '#c9ccd2', shininess: 120, specular: '#ffffff' });
    var dark = M('#1c1c1e'), tire = M('#141416'), wood = M('#7a5532'), glow = new T.MeshBasicMaterial({ color: '#ffd27a' }), red = M('#b8322a');
    // caisse : côtés texturés (vitres, tôles, rouille), toit et arrière en tôle rouillée
    var sideM = new T.MeshLambertMaterial({ map: side }), sideM2 = new T.MeshLambertMaterial({ map: side.clone() }); sideM2.map.needsUpdate = true; sideM2.map.wrapS = T.RepeatWrapping; sideM2.map.repeat.x = -1;
    bx(7.8, 2.5, 2.6, [rustM, yel, rustM, dark, sideM, sideM2], -.6, 0, 0);
    var roof = add(new T.CylinderGeometry(1.3, 1.3, 7.8, 20, 1, false, 0, Math.PI), rustM, -.6, 1.25, 0, 0, 0, Math.PI / 2); roof.scale.set(1, 1, .28); roof.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    // nez : capot jaune, compresseur chromé, calandre, pare-buffle à pointes
    bx(1.9, 1.35, 2.3, yel, 4.1, -.55, 0); bx(1.9, .12, 2.36, rustM, 4.1, .14, 0);
    bx(.75, .42, .9, chrome, 4.0, .42, 0); bx(.5, .3, .7, dark, 4.0, .78, 0); cy(.09, .09, .5, chrome, 3.75, .55, .55, 0, 0, .3); cy(.09, .09, .5, chrome, 3.75, .55, -.55, 0, 0, .3);
    for (var i = 0; i < 6; i++) bx(.6, .05, .06, chrome, 4.0, .3 + i * .04, -.36 + i * .14, 0, 0, 0);
    bx(.12, 1.1, 2.1, dark, 5.08, -.6, 0); for (i = -4; i <= 4; i++) bx(.14, 1.0, .06, chrome, 5.12, -.6, i * .22);
    bx(.35, .45, 3.0, rustM, 5.35, -1.05, 0); for (i = -3; i <= 3; i++) { add(new T.ConeGeometry(.1, .75, 6), chrome, 5.85, -1.05, i * .42, 0, 0, -Math.PI / 2); add(new T.ConeGeometry(.08, .55, 6), chrome, 5.75, -.68, i * .42 + .21, 0, 0, -Math.PI / 2); }
    [1, -1].forEach(function (s) { cy(.2, .2, .14, chrome, 5.12, -.2, s * .85, 0, 0, Math.PI / 2); add(new T.CircleGeometry(.16, 16), glow, 5.2, -.2, s * .85, 0, Math.PI / 2, 0); for (var j = -1; j <= 1; j++) bx(.04, .4, .03, dark, 5.24, -.2, s * .85 + j * .1); });
    // pare-brise blindé et rétros
    bx(.06, 1.0, 2.3, M('#33414c'), 3.2, .65, 0); for (i = -3; i <= 3; i++) bx(.08, 1.0, .05, M('#3a3a38'), 3.23, .65, i * .32); bx(.08, .08, 2.3, M('#3a3a38'), 3.23, .65, 0);
    [1, -1].forEach(function (s) { bx(.08, .4, .25, chrome, 3.4, .7, s * 1.55); cy(.02, .02, .4, dark, 3.3, .7, s * 1.42, Math.PI / 2, 0, 0); });
    // roues tout-terrain (6)
    [[4.0, 1], [-1.6, 1], [-3.2, 1]].forEach(function (q) { [1, -1].forEach(function (s) { var z = s * 1.32; cy(.68, .68, .5, tire, q[0], -1.35, z, Math.PI / 2, 0, 0, 14); cy(.38, .38, .54, rustM, q[0], -1.35, z, Math.PI / 2, 0, 0, 10); cy(.12, .12, .58, chrome, q[0], -1.35, z, Math.PI / 2, 0, 0, 8);
      for (var k = 0; k < 10; k++) { var a = k / 10 * 6.283; bx(.16, .14, .54, tire, q[0] + Math.cos(a) * .69, -1.35 + Math.sin(a) * .69, z, 0, 0, a); } }); });
    bx(7.6, .3, 2.2, dark, -.6, -1.3, 0);
    // pointes sur les flancs, plaques soudées en bas
    [1, -1].forEach(function (s) { for (var k = 0; k < 7; k++) add(new T.ConeGeometry(.07, .45, 5), chrome, -4 + k * 1.1, -.95, s * 1.42, s * Math.PI / 2, 0, 0); bx(2.2, .5, .05, rustM, -2.9, -.85, s * 1.33, 0, 0, .04); bx(1.6, .55, .05, M('#5a5650'), .9, -.9, s * 1.33, 0, 0, -.05); });
    // cheminées d'échappement chromées
    [1, -1].forEach(function (s) { cy(.13, .15, 2.2, chrome, 2.7, 1.6, s * 1.4); cy(.17, .13, .25, dark, 2.7, 2.72, s * 1.4); bx(.1, .5, .1, chrome, 2.7, .55, s * 1.4); });
    // galerie de toit : rails, caisses, bidons, pneus, projecteurs
    [1, -1].forEach(function (s) { bx(6.8, .08, .08, dark, -.8, 1.95, s * 1.05); }); for (i = 0; i < 6; i++) bx(.08, .08, 2.18, dark, -3.9 + i * 1.25, 1.95, 0);
    for (i = 0; i < 6; i++) bx(.06, .45, .06, dark, -3.9 + i * 1.25, 1.75, (i % 2 ? 1 : -1) * 1.05);
    bx(1.1, .7, .8, wood, -3.2, 2.35, .4); bx(.8, .55, .8, wood, -2.1, 2.27, -.45); bx(1.0, .5, .9, M('#5f6b3a'), -.7, 2.25, .5);
    cy(.3, .3, .8, red, .4, 2.4, -.5); cy(.3, .3, .8, M('#2a5a9a'), 1.1, 2.4, -.45); cy(.3, .3, .8, red, .75, 2.4, .45, 0, 0, Math.PI / 2);
    add(new T.TorusGeometry(.45, .2, 8, 14), tire, 2.0, 2.2, .3, Math.PI / 2, 0, 0); add(new T.TorusGeometry(.45, .2, 8, 14), tire, 2.0, 2.55, .3, Math.PI / 2, 0, 0);
    bx(.15, .2, 2.0, dark, 3.05, 2.05, 0); for (i = -2; i <= 2; i++) { cy(.13, .13, .15, chrome, 3.12, 2.05, i * .42, 0, 0, Math.PI / 2); add(new T.CircleGeometry(.1, 12), glow, 3.2, 2.05, i * .42, 0, Math.PI / 2, 0); }
    // ailes rivetées avec moteurs à hélice
    var wingM = new T.MeshLambertMaterial({ map: metalTex('#8a8070') });
    [1, -1].forEach(function (s) {
      var w = bx(2.6, .16, 6.4, wingM, -.4, -.1, s * 4.6, s * -.06, 0, 0);
      for (var k = 0; k < 4; k++) bx(2.7, .06, .12, rustM, -.4, -.02 + Math.abs(s) * 0, s * (2.4 + k * 1.4), s * -.06, 0, 0);
      bx(1.0, 1.2, .1, rustM, -1.3, .45, s * 7.75, 0, 0, -.2);   // dérive au bout de l'aile
      cy(.55, .5, 2.3, rustM, .1, -.65, s * 4.3, 0, 0, Math.PI / 2, 14); cy(.6, .6, .25, chrome, 1.25, -.65, s * 4.3, 0, 0, Math.PI / 2, 14); add(new T.ConeGeometry(.22, .5, 12), chrome, 1.55, -.65, s * 4.3, 0, 0, -Math.PI / 2);
      for (k = 0; k < 4; k++) cy(.05, .05, .5, dark, -.6 + k * .4, -.25, s * 4.3, 0, 0, 0);
      cy(.08, .08, .9, dark, -1.05, -.5, s * 4.3 + .3, 0, 0, Math.PI / 2 + .3);
    });
    // réacteurs arrière + échelle + pare-chocs
    [1, -1].forEach(function (s) { cy(.48, .42, 1.6, rustM, -5.0, .2, s * .75, 0, 0, Math.PI / 2, 16); cy(.5, .5, .2, chrome, -5.8, .2, s * .75, 0, 0, Math.PI / 2, 16); });
    bx(.25, .35, 2.8, rustM, -4.65, -1.05, 0); for (i = 0; i < 5; i++) bx(.05, .05, .7, chrome, -4.55, -.8 + i * .4, -1.0);
    // drapeau en lambeaux
    cy(.04, .04, 2.2, dark, -4.2, 2.9, -1.1); var fl = add(new T.PlaneGeometry(1.4, .7, 6, 2), new T.MeshLambertMaterial({ map: flagTex(), side: T.DoubleSide, alphaTest: .5 }), -4.95, 3.55, -1.1);
    // pièces animées (restent à part) : hélices, flammes des réacteurs
    [1, -1].forEach(function (s) {
      var pr = new T.Group(); pr.position.set(1.62, -.65, s * 4.3); pr.userData.prop = 1; pr.userData.dyn = true; b.add(pr);
      for (var k = 0; k < 3; k++) { var bl = new T.Mesh(new T.BoxGeometry(.06, 2.5, .22), M('#3a3632')); bl.rotation.x = k / 3 * 6.283; bl.position.x = .05; pr.add(bl); }
      var fm = new T.Mesh(new T.ConeGeometry(.38, 1.6, 14, 1, true), new T.MeshBasicMaterial({ color: '#ff8a1e', transparent: true, opacity: .85, depthWrite: false, blending: T.AdditiveBlending }));
      fm.rotation.z = Math.PI / 2; fm.position.set(-6.65, .2, s * .75); fm.userData.dyn = true; fm.userData.flame = 1; b.add(fm);
      var fc = new T.Mesh(new T.CircleGeometry(.4, 16), new T.MeshBasicMaterial({ color: '#ffe8a0' })); fc.rotation.y = -Math.PI / 2; fc.position.set(-5.91, .2, s * .75); fc.userData.dyn = true; b.add(fc);
    });
    b.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
    return b;
  };
})();
