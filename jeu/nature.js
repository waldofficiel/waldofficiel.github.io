/* Wald Royal : nature façon Valheim.
   - NATURE.groundTextures(THREE, des) : textures du sol tuilables (herbe x2, terre, roche, sable), dessinées au chargement
   - NATURE.tree(THREE, kind, seed)    : géométrie d'arbre ('oak', 'pine', 'birch') avec couleurs par sommet + attribut aSway (vent)
   - NATURE.rock(THREE, seed, mossy, des), NATURE.bush(THREE, seed, des), NATURE.flower(THREE, seed)
   Les couleurs passent par THREE.Color (déjà converties en linéaire par le jeu). */
(function () {
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ---------- textures tuilables ---------- */
  function tex(THREE, sz, draw) {
    var c = document.createElement('canvas'); c.width = c.height = sz; var g = c.getContext('2d');
    // wrap(fn) : dessine aussi l'élément de l'autre côté du bord pour que la texture se raccorde sans couture
    function wrap(x, y, m, fn) { for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) { var X = x + dx * sz, Y = y + dy * sz; if (X > -m && X < sz + m && Y > -m && Y < sz + m) fn(X, Y); } }
    draw(g, sz, wrap);
    var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t;
  }
  function hsl(h, s, l, a) { return 'hsla(' + h + ',' + s + '%,' + l + '%,' + (a == null ? 1 : a) + ')'; }
  function blotches(g, sz, wrap, r, n, h, s, l, dl, a, rmin, rmax) {
    for (var i = 0; i < n; i++) { var x = r() * sz, y = r() * sz, rad = rmin + r() * (rmax - rmin), col = hsl(h + (r() - .5) * 8, s, l + (r() - .5) * dl, a);
      wrap(x, y, rad, function (X, Y) { var gr = g.createRadialGradient(X, Y, 0, X, Y, rad); gr.addColorStop(0, col); gr.addColorStop(1, hsl(h, s, l, 0)); g.fillStyle = gr; g.fillRect(X - rad, Y - rad, rad * 2, rad * 2); }); }
  }
  function grassTex(THREE, seed, h0, s0, l0) {
    return tex(THREE, 512, function (g, sz, wrap) { var r = rng(seed);
      g.fillStyle = hsl(h0, s0, l0); g.fillRect(0, 0, sz, sz);
      blotches(g, sz, wrap, r, 60, h0, s0, l0, 14, .45, 20, 70);
      for (var i = 0; i < 9000; i++) { var x = r() * sz, y = r() * sz, len = 4 + r() * 9, ang = -Math.PI / 2 + (r() - .5) * .9, w = .8 + r() * 1.4, lt = l0 + (r() - .45) * 22, hh = h0 + (r() - .5) * 18;
        wrap(x, y, 14, function (X, Y) { g.strokeStyle = hsl(hh, s0 + 5, lt, .85); g.lineWidth = w; g.beginPath(); g.moveTo(X, Y); g.lineTo(X + Math.cos(ang) * len, Y + Math.sin(ang) * len); g.stroke(); }); }
      for (i = 0; i < 260; i++) { var fx = r() * sz, fy = r() * sz, fc = r() < .5 ? hsl(55, 70, 72) : hsl(h0 - 10, 30, 30); wrap(fx, fy, 3, function (X, Y) { g.fillStyle = fc; g.fillRect(X, Y, 1.6, 1.6); }); }
    });
  }
  function dirtTex(THREE, seed, des) {
    return tex(THREE, 512, function (g, sz, wrap) { var r = rng(seed), h = des ? 22 : 28;
      g.fillStyle = hsl(h, des ? 45 : 32, des ? 38 : 30); g.fillRect(0, 0, sz, sz);
      blotches(g, sz, wrap, r, 120, h, 30, 30, 18, .5, 10, 45);
      for (var i = 0; i < 14000; i++) { var x = r() * sz, y = r() * sz, l = 20 + r() * 30; g.fillStyle = hsl(h, 25, l, .5); g.fillRect(x, y, 1 + r() * 2, 1 + r() * 2); }
      for (i = 0; i < 420; i++) { var px = r() * sz, py = r() * sz, pr = 1.5 + r() * 5, pl = 35 + r() * 30;
        wrap(px, py, pr + 2, function (X, Y) { g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(X + 1, Y + 1.5, pr, pr * .7, 0, 0, 6.283); g.fill(); g.fillStyle = hsl(h + 5, 10, pl); g.beginPath(); g.ellipse(X, Y, pr, pr * .7, 0, 0, 6.283); g.fill(); g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(X - pr * .3, Y - pr * .3, pr * .4, pr * .25, 0, 0, 6.283); g.fill(); }); }
      if (des) for (i = 0; i < 60; i++) { var cx = r() * sz, cy = r() * sz; g.strokeStyle = 'rgba(40,15,5,.5)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx, cy); for (var k = 0; k < 5; k++) { cx += (r() - .5) * 40; cy += (r() - .5) * 40; g.lineTo(cx, cy); } g.stroke(); }
    });
  }
  function rockTex(THREE, seed, des) {
    return tex(THREE, 512, function (g, sz, wrap) { var r = rng(seed), h = des ? 14 : 30, s = des ? 45 : 6, l = des ? 40 : 46;
      g.fillStyle = hsl(h, s, l); g.fillRect(0, 0, sz, sz);
      blotches(g, sz, wrap, r, 140, h, s, l, 26, .5, 12, 80);
      for (var i = 0; i < 16000; i++) { g.fillStyle = hsl(h, s, l + (r() - .5) * 40, .35); g.fillRect(r() * sz, r() * sz, 1 + r() * 2, 1 + r() * 2); }
      for (i = 0; i < 70; i++) { var x = r() * sz, y = r() * sz, pts = [[x, y]]; for (var k = 0; k < 7; k++) { x += (r() - .5) * 50; y += (r() - .2) * 40; pts.push([x, y]); }
        [['rgba(0,0,0,.55)', 2.2, 0], ['rgba(255,255,255,.22)', 1, -1.5]].forEach(function (st) { g.strokeStyle = st[0]; g.lineWidth = st[1]; g.beginPath(); pts.forEach(function (p, j) { if (j) g.lineTo(p[0] + st[2], p[1] + st[2]); else g.moveTo(p[0] + st[2], p[1] + st[2]); }); g.stroke(); }); }
      if (!des) blotches(g, sz, wrap, r, 50, 78, 35, 38, 10, .35, 6, 26);   // lichen
    });
  }
  function sandTex(THREE, seed, des) {
    return tex(THREE, 512, function (g, sz, wrap) { var r = rng(seed), h = des ? 30 : 42, s = des ? 62 : 48, l = des ? 62 : 74;
      g.fillStyle = hsl(h, s, l); g.fillRect(0, 0, sz, sz);
      blotches(g, sz, wrap, r, 60, h, s, l, 10, .45, 20, 80);
      for (var y = 0; y < sz; y += 9) { g.strokeStyle = hsl(h, s, l - 5, .12); g.lineWidth = 3; g.beginPath(); for (var x = 0; x <= sz; x += 8) { var yy = y + Math.sin(x / sz * Math.PI * 4 + y * .3) * 3 + Math.sin(x / sz * Math.PI * 10 + y) * 1.2; if (x) g.lineTo(x, yy); else g.moveTo(x, yy); } g.stroke(); }
      for (var i = 0; i < 20000; i++) { g.fillStyle = hsl(h, s - 10, l + (r() - .5) * 30, .45); g.fillRect(r() * sz, r() * sz, 1, 1); }
    });
  }

  /* ---------- géométries avec couleurs par sommet ---------- */
  function Builder(THREE) { this.T = THREE; this.pos = []; this.nor = []; this.col = []; this.sw = []; }
  Builder.prototype.add = function (geo, mtx, colFn, sway) {
    var g = geo.index ? geo.toNonIndexed() : geo; g.applyMatrix4(mtx); g.computeVertexNormals();
    var p = g.attributes.position, n = g.attributes.normal, c = new this.T.Color();
    for (var i = 0; i < p.count; i++) { var x = p.getX(i), y = p.getY(i), z = p.getZ(i); this.pos.push(x, y, z); this.nor.push(n.getX(i), n.getY(i), n.getZ(i)); colFn(c, x, y, z, n.getY(i)); this.col.push(c.r, c.g, c.b); this.sw.push(typeof sway === 'function' ? sway(y) : sway); }
  };
  Builder.prototype.geo = function () { var T = this.T, g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(this.pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(this.nor, 3)); g.setAttribute('color', new T.Float32BufferAttribute(this.col, 3)); g.setAttribute('aSway', new T.Float32BufferAttribute(this.sw, 1)); g.computeBoundingSphere(); return g; };
  function hpos(x, y, z, sd) { var n = Math.sin(Math.round(x * 997) * 12.9898 + Math.round(y * 997) * 78.233 + Math.round(z * 997) * 37.719 + sd) * 43758.5453; return n - Math.floor(n); }
  // déformation selon la position du sommet : deux sommets au même endroit bougent pareil, donc pas de fentes
  function jitter(geo, r, amt, flatBottom) { var p = geo.attributes.position, sd = r() * 100; for (var i = 0; i < p.count; i++) { var x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + (hpos(x, y, z, sd) - .5) * amt, ky = 1 + (hpos(z, x, y, sd + 7) - .5) * amt * .6; if (flatBottom && y < 0) y *= .5; p.setXYZ(i, x * k, y * ky, z * k); } return geo; }
  function M4(THREE, x, y, z, sx, sy, sz, rx, ry, rz) { var o = new THREE.Object3D(); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.rotation.set(rx || 0, ry || 0, rz || 0); o.updateMatrix(); return o.matrix; }

  var N = {};
  N.groundTextures = function (THREE, des) {
    return des ? { grass: sandTex(THREE, 11, true), grass2: sandTex(THREE, 12, true), dirt: dirtTex(THREE, 13, true), rock: rockTex(THREE, 14, true), sand: sandTex(THREE, 15, false) }
      : { grass: grassTex(THREE, 21, 108, 40, 27), grass2: grassTex(THREE, 22, 90, 42, 31), dirt: dirtTex(THREE, 23, false), rock: rockTex(THREE, 24, false), sand: sandTex(THREE, 25, false) };
  };
  N.tree = function (THREE, kind, seed) {
    var r = rng(seed), B = new Builder(THREE), bark = new THREE.Color(kind === 'birch' ? '#e8e2d6' : kind === 'pine' ? '#5a3e2a' : '#6b4a30'), barkD = new THREE.Color(kind === 'birch' ? '#2a2420' : '#3a2818');
    var H = kind === 'pine' ? 7.5 + r() * 2 : kind === 'birch' ? 6.5 + r() * 1.5 : 5.5 + r() * 1.5, lean = (r() - .5) * .12;
    var trunk = new THREE.CylinderGeometry(kind === 'birch' ? .14 : .2, kind === 'birch' ? .2 : .38, H * (kind === 'pine' ? .95 : .7), 8, 4);
    jitter(trunk, r, .12); B.add(trunk, M4(THREE, 0, H * (kind === 'pine' ? .475 : .35), 0, 1, 1, 1, lean, 0, lean * .6), function (c, x, y, z) { c.copy(bark); if (kind === 'birch' && Math.sin(y * 9 + Math.atan2(z, x) * 2) > .7) c.copy(barkD); else c.multiplyScalar(.75 + (Math.sin(Math.atan2(z, x) * 7 + y * 3) * .5 + .5) * .35); }, 0);
    for (var rt = 0; rt < 4; rt++) { var ra = rt / 4 * 6.283 + r(), root = new THREE.CylinderGeometry(.04, .16, .9, 5); B.add(root, M4(THREE, Math.cos(ra) * .32, .12, Math.sin(ra) * .32, 1, 1, 1, Math.sin(ra) * 1.2, 0, -Math.cos(ra) * 1.2), function (c) { c.copy(bark).multiplyScalar(.7); }, 0); }
    if (kind === 'pine') {
      var lv = 5; for (var i = 0; i < lv; i++) { var t = i / (lv - 1), rad = 2.4 * (1 - t * .75) + r() * .3, hh = 2.6 - t * .9, yy = 2 + t * (H - 2.6), cone = jitter(new THREE.ConeGeometry(rad, hh, 9, 2), r, .25, true);
        B.add(cone, M4(THREE, lean * yy, yy, 0, 1, 1, 1, 0, r() * 6.28, 0), function (c, x, y, z, ny) { c.setHSL(.37 + r() * .03, .42, .25 + Math.max(0, ny) * .1 + (y - yy) / hh * .06 + r() * .03); }, function (y) { return Math.min(1, Math.max(0, (y - 2) / H)); }); }
    } else {
      var n = kind === 'birch' ? 6 : 8, base = kind === 'birch' ? H * .55 : H * .6;
      for (var k = 0; k < n; k++) { var a = k / n * 6.283 + r(), d = k === 0 ? 0 : 1 + r() * 1.1, sz = (kind === 'birch' ? 1.1 : 1.6) + r() * .7, y0 = base + (k === 0 ? 1.4 : r() * 1.8), ball = jitter(new THREE.IcosahedronGeometry(1, 1), r, .35);
        B.add(ball, M4(THREE, Math.cos(a) * d + lean * y0, y0, Math.sin(a) * d, sz, sz * .85, sz, 0, r() * 6.28, 0), function (c, x, y, z, ny) { var hue = kind === 'birch' ? .2 : .26; c.setHSL(hue + r() * .04, kind === 'birch' ? .5 : .45, .3 + Math.max(0, ny) * .16 + r() * .05); }, function (y) { return Math.min(1, Math.max(0, (y - 1.5) / H)); });
        if (k > 0) { var br = new THREE.CylinderGeometry(.05, .1, d + .4, 5); B.add(br, M4(THREE, Math.cos(a) * d * .5 + lean * y0, y0 - .5, Math.sin(a) * d * .5, 1, 1, 1, Math.sin(a) * 1.0, 0, -Math.cos(a) * 1.0), function (c) { c.copy(bark).multiplyScalar(.8); }, .3); } }
    }
    return B.geo();
  };
  N.rock = function (THREE, seed, mossy, des) {
    var r = rng(seed), B = new Builder(THREE), g = new THREE.IcosahedronGeometry(1, seed >= 900 ? 0 : 2), p = g.attributes.position;
    for (var i = 0; i < p.count; i++) { var x = p.getX(i), y = p.getY(i), z = p.getZ(i), f = 1 + Math.sin(x * 3.1 + seed) * .12 + Math.sin(z * 4.3 + y * 2 + seed) * .1 + (r() - .5) * .08; if (y < -.2) y = -.2 + (y + .2) * .3; p.setXYZ(i, x * f, y * f * .8, z * f); }
    var base = new THREE.Color(des ? '#b0583a' : '#8a8a86'), moss = new THREE.Color('#4a6a26');
    B.add(g, M4(THREE, 0, 0, 0, 1, 1, 1, 0, 0, 0), function (c, x, y, z, ny) { c.copy(base).multiplyScalar(.7 + Math.sin(x * 9 + z * 7) * .08 + Math.sin(y * 15) * .06 + .2 * Math.max(0, ny)); if (des) c.lerp(new THREE.Color('#d48a5a'), Math.max(0, Math.sin(y * 10)) * .35); if (mossy && ny > .55) c.lerp(moss, Math.min(1, (ny - .55) * 3)); }, 0);
    return B.geo();
  };
  N.bush = function (THREE, seed, des) {
    var r = rng(seed), B = new Builder(THREE), n = 4 + (r() * 3 | 0);
    for (var k = 0; k < n; k++) { var a = r() * 6.28, d = r() * .5, s = .45 + r() * .4, ball = jitter(new THREE.IcosahedronGeometry(1, 1), r, .35);
      B.add(ball, M4(THREE, Math.cos(a) * d, s * .7, Math.sin(a) * d, s, s * .8, s, 0, r() * 6, 0), function (c, x, y, z, ny) { if (des) c.setHSL(.12 + r() * .03, .35, .32 + Math.max(0, ny) * .1); else c.setHSL(.27 + r() * .05, .45, .27 + Math.max(0, ny) * .14 + r() * .04); }, function (y) { return Math.min(1, y / 1.2); }); }
    if (!des && r() < .55) { var bc = r() < .5 ? '#d8344a' : '#f2e05a'; for (var b = 0; b < 7; b++) { var aa = r() * 6.28, dd = .35 + r() * .35; B.add(new THREE.IcosahedronGeometry(.06, 0), M4(THREE, Math.cos(aa) * dd, .55 + r() * .35, Math.sin(aa) * dd, 1, 1, 1), function (c) { c.set(bc); }, .8); } }
    return B.geo();
  };
  N.flower = function (THREE, seed) {
    var r = rng(seed), B = new Builder(THREE), cols = ['#ffffff', '#ffd83a', '#c77dff', '#ff6a9a', '#7ab8ff'];
    for (var k = 0; k < 5; k++) { var a = r() * 6.28, d = r() * .25, h = .18 + r() * .2, x = Math.cos(a) * d, z = Math.sin(a) * d, cc = cols[(r() * cols.length) | 0];
      B.add(new THREE.CylinderGeometry(.008, .012, h, 3), M4(THREE, x, h / 2, z, 1, 1, 1), function (c) { c.set('#3d7a26'); }, function (y) { return y / .4; });
      B.add(new THREE.IcosahedronGeometry(.045, 0), M4(THREE, x, h + .02, z, 1, .55, 1), function (c) { c.set(cc); }, 1); }
    return B.geo();
  };
  window.NATURE = N;
})();
