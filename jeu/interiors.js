/* Wald Royal — intérieurs des bâtiments
   - vraies fenêtres : vitre « interior mapping » (on voit une pièce meublée derrière, avec reflets), cadre, appui, vitre lumineuse côté intérieur
   - immeubles en blocs d'étages : planchers, escaliers (on monte vraiment), plafonds éclairés
   - meubles cartoon (Kenney Furniture Kit, CC0) chargés en .glb et fusionnés par quartier (1 appel de dessin par quartier)
   API : INTERIORS.build(THREE, ctx) ; INTERIORS.groundAt(x, z, y) ; INTERIORS.ceilAt(x, z, y) ; INTERIORS.setWall(w, on) ; INTERIORS.update(cam, fog)
*/
(function () {
  var T, ctx, K = 2.2, FIX = { winMat: null, clusters: [] };
  var MODELS = ['bedDouble', 'bedSingle', 'bedBunk', 'loungeSofa', 'loungeSofaLong', 'loungeChair', 'loungeDesignSofa', 'table', 'tableCoffee', 'tableRound', 'tableCross', 'chair', 'chairCushion', 'chairDesk', 'chairModernCushion', 'stoolBar',
    'kitchenFridge', 'kitchenFridgeLarge', 'kitchenCabinet', 'kitchenCabinetDrawer', 'kitchenSink', 'kitchenStove', 'kitchenStoveElectric', 'kitchenMicrowave', 'kitchenCabinetUpper', 'kitchenBar', 'kitchenCoffeeMachine',
    'televisionModern', 'televisionVintage', 'cabinetTelevision', 'bookcaseOpen', 'bookcaseClosedWide', 'books', 'desk', 'computerScreen', 'computerKeyboard', 'laptop', 'toilet', 'bathtub', 'bathroomSink', 'shower', 'washer',
    'pottedPlant', 'plantSmall1', 'plantSmall2', 'rugRectangle', 'rugRound', 'rugRounded', 'lampSquareCeiling', 'lampRoundFloor', 'lampSquareTable', 'sideTable', 'sideTableDrawers', 'coatRackStanding', 'speaker', 'radio', 'trashcan',
    'cardboardBoxClosed', 'cardboardBoxOpen', 'ceilingFan', 'pillow', 'bench', 'benchCushion'];
  // couleurs plus « cartoon » (les modèles Kenney sont pastel) : on sature un peu et on varie les canapés / lits
  var SOFA = ['#e8425a', '#3a7be8', '#f2a93a', '#52b86a', '#9b5de5', '#2fb6a8'];

  /* ---------- repère local d'une maison : la porte est devant (+v), u vers la droite ---------- */
  function frame(hs) {
    var f = { s: [0, 1], n: [0, -1], e: [1, 0], w: [-1, 0] }[hs.door] || [0, 1], r = [f[1], -f[0]], alongX = f[0] === 0;
    var W = (alongX ? hs.hx : hs.hz) * 2 - .34, D = (alongX ? hs.hz : hs.hx) * 2 - .34;
    return { f: f, r: r, W: W, D: D, w: function (u, v) { return [hs.x + r[0] * u + f[0] * v, hs.z + r[1] * u + f[1] * v]; },
      rot: function (dir) { var d = dir === 'f' ? f : dir === 'b' ? [-f[0], -f[1]] : dir === 'r' ? r : [-r[0], -r[1]]; return Math.atan2(d[0], d[1]); },
      box: function (u0, v0, u1, v1) { var a = this.w(u0, v0), b = this.w(u1, v1); return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])]; } };
  }

  /* ---------- étages + escaliers ---------- */
  var FLOORED = [];
  function makeFloors() {
    var slabs = [], steps = [];
    ctx.HOUSES.forEach(function (hs) {
      if (hs.barn || hs.m === 'metal' || hs.m === 'brique' || hs.m === 'grange') { hs.nf = 1; return; }
      var nf = hs.h >= 6 ? Math.max(2, Math.round(hs.h / 3.2)) : 1; hs.nf = nf; if (nf < 2) return;
      var F = frame(hs), FH = hs.h / nf, Lr = Math.min(F.W - 2.4, 7), sw = 1.35, vA = -F.D / 2 + .05, vB = vA + sw;
      if (Lr < 3.5 || F.D < 6) { hs.nf = 1; return; }
      hs.fl = { F: F, FH: FH, Lr: Lr, strips: [[vA, vA + sw], [vB, vB + sw]] }; FLOORED.push(hs);
      for (var k = 1; k < nf; k++) {   // plancher k, avec la trémie de l'escalier qui arrive (bande de l'escalier k-1)
        var st = hs.fl.strips[(k - 1) % 2], y = hs.y0 + k * FH, u0 = -Lr / 2, u1 = Lr / 2, W2 = F.W / 2, D2 = F.D / 2;
        [[-W2, st[1], W2, D2], [-W2, -D2, W2, st[0]], [-W2, st[0], u0, st[1]], [u1, st[0], W2, st[1]]].forEach(function (q) { if (q[2] - q[0] < .05 || q[3] - q[1] < .05) return; slabs.push({ b: F.box(q[0], q[1], q[2], q[3]), y: y }); });
      }
      for (k = 0; k < nf - 1; k++) {   // volée k : du niveau k au niveau k+1, alternée sur 2 bandes
        var s2 = hs.fl.strips[k % 2], dir = k % 2 ? -1 : 1, n = 13;
        for (var i = 0; i < n; i++) { var ua = -Lr / 2 + Lr * i / n, ub = ua + Lr / n, top = hs.y0 + k * FH + FH * (i + 1) / n; if (dir < 0) { var t0 = -ub; ub = -ua; ua = t0; }
          steps.push({ b: F.box(ua, s2[0], ub, s2[1]), y0: hs.y0 + k * FH, y1: top }); }
      }
    });
    var o = new T.Object3D();
    if (slabs.length) { var top = ctx.worldMat(ctx.TX.sol, .45, { lit: .3 }), under = new T.MeshLambertMaterial({ color: '#efede6', emissive: '#6a6862' }), sm = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), [under, under, top, under, under, under], slabs.length); slabs.forEach(function (s, i) { o.position.set((s.b[0] + s.b[2]) / 2, s.y - .07, (s.b[1] + s.b[3]) / 2); o.scale.set(s.b[2] - s.b[0], .14, s.b[3] - s.b[1]); o.updateMatrix(); sm.setMatrixAt(i, o.matrix); }); sm.receiveShadow = true; sm.frustumCulled = false; ctx.scene.add(sm); if (window.OPT) OPT.chunk(sm); }
    if (steps.length) { var stm = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), ctx.worldMat(ctx.TX.beton, .3, { lit: .3 }), steps.length); steps.forEach(function (s, i) { o.position.set((s.b[0] + s.b[2]) / 2, (s.y0 + s.y1) / 2, (s.b[1] + s.b[3]) / 2); o.scale.set(s.b[2] - s.b[0], s.y1 - s.y0, s.b[3] - s.b[1]); o.updateMatrix(); stm.setMatrixAt(i, o.matrix); }); stm.receiveShadow = stm.castShadow = true; stm.frustumCulled = false; ctx.scene.add(stm); if (window.OPT) OPT.chunk(stm); }
  }
  // hauteur du sol sous (x, z) pour quelqu'un à la hauteur y (planchers et marches compris)
  function groundAt(x, z, y) {
    var g = ctx.hgt(x, z);
    for (var i = 0; i < FLOORED.length; i++) { var hs = FLOORED[i]; if (Math.abs(x - hs.x) > hs.hx || Math.abs(z - hs.z) > hs.hz || hs.broken >= 2) continue;
      var fl = hs.fl, F = fl.F, dx = x - hs.x, dz = z - hs.z, u = dx * F.r[0] + dz * F.r[1], v = dx * F.f[0] + dz * F.f[1], best = hs.y0, lim = y + .7;
      for (var k = 1; k < hs.nf; k++) { var lv = hs.y0 + k * fl.FH; if (lv > lim) break; var st = fl.strips[(k - 1) % 2]; if (!(v > st[0] && v < st[1] && Math.abs(u) < fl.Lr / 2)) best = Math.max(best, lv); }
      for (k = 0; k < hs.nf - 1; k++) { var s2 = fl.strips[k % 2]; if (v < s2[0] || v > s2[1] || Math.abs(u) > fl.Lr / 2 + .05) continue; var t = (u + fl.Lr / 2) / fl.Lr; if (k % 2) t = 1 - t; var h = hs.y0 + k * fl.FH + fl.FH * Math.max(0, Math.min(1, t)); if (h <= lim) best = Math.max(best, h); }
      return Math.max(g, best); }
    return g;
  }
  function ceilAt(x, z, y) {
    for (var i = 0; i < ctx.HOUSES.length; i++) { var hs = ctx.HOUSES[i]; if (hs.broken >= 2 || Math.abs(x - hs.x) > hs.hx || Math.abs(z - hs.z) > hs.hz || y > hs.y0 + hs.h - .3 || y < hs.y0 - 1) continue;
      if (hs.fl) { var k = Math.floor((y - hs.y0 + .5) / hs.fl.FH); return Math.min(hs.y0 + hs.h, hs.y0 + (k + 1) * hs.fl.FH); } return hs.y0 + hs.h; }
    return null;
  }

  /* ---------- fenêtres ---------- */
  var WIN_VS = [
    'varying vec3 vP; varying vec3 vD; varying vec2 vS; varying float vSeed; varying float vDist;',
    'void main(){ mat4 M = modelMatrix * instanceMatrix; vec4 wp = M * vec4(position, 1.0);',
    ' vec3 ax = M[0].xyz, ay = M[1].xyz, az = M[2].xyz; float w = length(ax), h = length(ay); ax /= w; ay /= h; az = normalize(az);',
    ' vec3 V = wp.xyz - cameraPosition; vD = vec3(dot(V, ax), dot(V, ay), dot(V, az)); vP = vec3(position.x * w, position.y * h, 0.0); vS = vec2(w, h); vDist = length(V);',
    ' vSeed = fract(sin(dot(M[3].xyz, vec3(12.9898, 78.233, 37.719))) * 43758.5453);',
    ' gl_Position = projectionMatrix * viewMatrix * wp; }'].join('\n');
  var WIN_FS = [
    'uniform vec3 fogColor; uniform float fogNear; uniform float fogFar; uniform float uT;',
    'varying vec3 vP; varying vec3 vD; varying vec2 vS; varying float vSeed; varying float vDist;',
    'vec3 pal(float s){ s = fract(s) * 6.0; if (s < 1.) return vec3(.85,.62,.32); if (s < 2.) return vec3(.32,.58,.82); if (s < 3.) return vec3(.86,.42,.50); if (s < 4.) return vec3(.42,.72,.40); if (s < 5.) return vec3(.62,.45,.85); return vec3(.92,.80,.55); }',
    'vec3 sofa(float s){ s = fract(s * 7.31) * 5.0; if (s < 1.) return vec3(.85,.18,.24); if (s < 2.) return vec3(.18,.42,.86); if (s < 3.) return vec3(.95,.62,.15); if (s < 4.) return vec3(.25,.65,.38); return vec3(.55,.30,.82); }',
    'float boxHit(vec3 o, vec3 d, vec3 mn, vec3 mx){ vec3 i = 1.0 / d, t0 = (mn - o) * i, t1 = (mx - o) * i, a = min(t0, t1), b = max(t0, t1); float tn = max(max(a.x, a.y), a.z), tf = min(min(b.x, b.y), b.z); return (tf > max(tn, 0.0)) ? tn : 1e9; }',
    'void main(){',
    ' float hw = vS.x * .5, hh = vS.y * .5, RW = max(1.9, hw + 1.1), D = 3.6, fy = -hh - 0.95, cy = fy + 3.0;',
    ' vec3 o = vec3(vP.xy, 0.0), d = normalize(vD); if (d.z > -0.02) d.z = -0.02;',
    ' float tx = d.x > 0.0 ? (RW - o.x) / d.x : (-RW - o.x) / d.x, ty = d.y > 0.0 ? (cy - o.y) / d.y : (fy - o.y) / d.y, tz = (-D - o.z) / d.z, t = min(min(tx, ty), tz);',
    ' vec3 p = o + d * t, wallC = pal(vSeed), c;',
    ' if (t == tz) { c = wallC * (0.92 + 0.08 * step(0.5, fract(p.x * 2.5))); vec2 q = abs(p.xy - vec2(0.0, fy + 1.9)); if (vSeed > .35 && max(q.x / .55, q.y / .38) < 1.0) c = max(q.x / .55, q.y / .38) > .86 ? vec3(.35,.22,.12) : mix(vec3(.2,.5,.8), vec3(.95,.7,.3), fract(vSeed * 13.) ); }',
    ' else if (t == tx) c = wallC * .78;',
    ' else if (t == ty && d.y < 0.0) { c = mix(vec3(.62,.40,.22), vec3(.52,.32,.17), step(.5, fract(p.z * 2.2 + floor(p.x * .8) * .5))); if (length(p.xz - vec2(0.0, -1.6)) < 1.1) c = mix(c, sofa(vSeed + .5) * .9 + .1, .85); }',
    ' else { c = vec3(.93,.92,.88); }',
    // meubles : canapé ou lit contre le mur du fond, petite étagère sur le côté
    ' float kind = fract(vSeed * 17.3); vec3 mn = vec3(-1.15, fy, -D), mx = vec3(1.15, fy + (kind < .5 ? .85 : .55), -D + (kind < .5 ? .85 : 1.9));',
    ' float tb = boxHit(o, d, mn, mx); if (tb < t) { vec3 pb = o + d * tb; c = sofa(vSeed); if (pb.y > mx.y - .02) c *= kind < .5 ? .85 : 1.15; if (kind >= .5 && pb.z < -D + .5 && pb.y > mx.y - .15) c = vec3(.96); t = tb; p = pb; }',
    ' float tb2 = boxHit(o, d, vec3(RW - .55, fy, -D + .3), vec3(RW, fy + 1.9, -D + 1.6)); if (tb2 < t) { vec3 pb = o + d * tb2; c = vec3(.55,.36,.2); if (fract(pb.y * 2.0) < .12) c *= .6; else if (pb.x < RW - .5) c = mix(c, vec3(.8,.3,.25), step(.5, fract(pb.z * 3.0 + floor(pb.y * 2.0) * .37))); t = tb2; p = pb; }',
    // lumière de la pièce (allumée ou non) + lampe au plafond
    ' float lit = step(.55, fract(vSeed * 5.7)); vec3 L = mix(vec3(.42,.46,.56), vec3(1.05,.86,.62), lit); float lamp = exp(-length(p - vec3(0.0, cy, -D * .5)) * 1.1);',
    ' c *= L * (1.0 - .5 * clamp(-p.z / D, 0.0, 1.0)); c += vec3(1.0,.8,.5) * lamp * (.25 + .6 * lit);',
    // rideaux / stores
    ' float cu = fract(vSeed * 3.1); vec2 uv = vP.xy / vS + .5;',
    ' if (cu < .45) { float side = min(uv.x, 1.0 - uv.x); if (side < .2) c = sofa(vSeed * 3.0 + .2) * (.75 + .25 * sin(uv.x * 90.0)) * L; }',
    ' else if (cu < .6 && uv.y > .62) c = vec3(.92,.9,.84) * (.8 + .2 * step(.5, fract(uv.y * 22.0))) * L;',
    // vitre : reflet du ciel + trait de lumière
    ' float fr = .05 + .4 * pow(1.0 - abs(d.z), 3.0); vec3 sky = mix(vec3(.72,.82,.92), vec3(.4,.58,.82), uv.y);',
    ' float streak = smoothstep(.22, 0.0, abs(uv.x + uv.y * .6 - .55 - fract(vSeed) * .2)) * .1; c = mix(c * .9, sky, fr) + streak;',
    ' if (abs(vP.x) < .035 || abs(uv.y - .64) < .022 * 2.0 / vS.y) c = vec3(.95,.95,.92);',   // croisillons
    ' gl_FragColor = vec4(mix(c, fogColor, smoothstep(fogNear, fogFar, vDist)), 1.0);',
    ' gl_FragColor = linearToOutputTexel(gl_FragColor); }'].join('\n');

  function dayTex() { var c = document.createElement('canvas'); c.width = 64; c.height = 64; var g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, '#dff3ff'); gr.addColorStop(.6, '#a9d8f5'); gr.addColorStop(1, '#bfe6b0'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.ellipse(18, 18, 12, 5, 0, 0, 6.3); g.fill(); g.fillStyle = '#f4f2ea'; g.fillRect(30, 0, 4, 64); g.fillRect(0, 22, 64, 3); var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t; }

  function fract(v) { return v - Math.floor(v); }
  /* textures des murs vus de l'intérieur */
  function ctex(sz, fn) { var c = document.createElement('canvas'); c.width = c.height = sz; var g = c.getContext('2d'); fn(g, sz); var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.encoding = T.sRGBEncoding; t.anisotropy = 4; return t; }
  function srnd(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function intTex() {
    return {
      papier: ctex(256, function (g, s) { g.fillStyle = '#d8ebe2'; g.fillRect(0, 0, s, s); for (var x = 0; x < s; x += 32) { g.fillStyle = 'rgba(70,140,120,.18)'; g.fillRect(x, 0, 12, s); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(x + 12, 0, 2, s); }
        for (var k = 0; k < 24; k++) { var px = (k % 6) * 42 + 22 + (k % 2) * 8, py = Math.floor(k / 6) * 64 + 20; g.fillStyle = '#e88a9a'; for (var a = 0; a < 5; a++) { g.beginPath(); g.arc(px + Math.cos(a * 1.257) * 4, py + Math.sin(a * 1.257) * 4, 3, 0, 6.3); g.fill(); } g.fillStyle = '#ffd23d'; g.beginPath(); g.arc(px, py, 2.2, 0, 6.3); g.fill(); } }),
      lambris: ctex(256, function (g, s) { for (var x = 0; x < 8; x++) { var l = 70 + srnd(x) * 8; g.fillStyle = 'hsl(32,52%,' + l + '%)'; g.fillRect(x * 32, 0, 32, s); g.strokeStyle = 'hsla(28,45%,40%,.28)'; g.lineWidth = 1; for (var k = 0; k < 3; k++) { g.beginPath(); g.moveTo(x * 32 + 8 + k * 8, 0); for (var y = 0; y <= s; y += 16) g.lineTo(x * 32 + 8 + k * 8 + Math.sin(y * .05 + x + k) * 2, y); g.stroke(); }
        g.fillStyle = 'rgba(90,50,20,.55)'; g.fillRect(x * 32, 0, 2, s); g.fillStyle = 'rgba(255,240,210,.5)'; g.fillRect(x * 32 + 2, 0, 1.5, s); } }),
      platre: ctex(256, function (g, s) { g.fillStyle = '#f3eee4'; g.fillRect(0, 0, s, s); for (var k = 0; k < 900; k++) { g.fillStyle = 'rgba(' + (k % 2 ? '255,255,255' : '160,140,110') + ',' + (.05 + srnd(k) * .06) + ')'; var r = 2 + srnd(k + 3) * 7; g.beginPath(); g.arc(srnd(k + 1) * s, srnd(k + 2) * s, r, 0, 6.3); g.fill(); } }),
      blanc: ctex(256, function (g, s) { g.fillStyle = '#ece8e0'; g.fillRect(0, 0, s, s); g.strokeStyle = 'rgba(200,190,175,.4)'; g.lineWidth = 2; for (var y = 0; y < s; y += 128) { g.beginPath(); g.moveTo(0, y); g.lineTo(s, y); g.stroke(); } })
    };
  }
  var INTK = { bois: 'lambris', ferme: 'lambris', grange: 'lambris', brique: 'papier', peint: 'platre', facade: 'blanc', beton: 'platre', riche: 'blanc', metal: 'platre' };

  /* ---------- fenêtres : vrais trous dans les murs + vitre transparente ---------- */
  function makeWindows() {
    var list = [], byWall = new Map();
    ctx.WALLS.forEach(function (w) { var hs = w.house; if (!hs || w.lintel || w.m === 'verre' || hs.barn || w.bigWall) return;
      var alongX = w.hw > w.hd, len = (alongX ? w.hw : w.hd) * 2;
      var big = hs.m === 'facade' || hs.m === 'riche', fav = hs.m === 'peint', ww = big ? 1.9 : fav ? 1.0 : 1.3, wh = big ? 1.9 : fav ? 1.0 : 1.35, sp = big ? 2.7 : fav ? 3.2 : 3.1;
      if (hs.m === 'metal' && !hs.flat) { ww = 1.1; wh = .9; }
      var n = Math.floor((len - .5) / sp); if (n < 1) { if (len < ww + .8) return; n = 1; }
      var nf = hs.nf || 1, FH = hs.h / nf;
      for (var f = 0; f < nf; f++) for (var i = 0; i < n; i++) { var off = (i - (n - 1) / 2) * (len / n), cy = hs.y0 + f * FH + (fav ? 1.1 : big ? .75 : .95) + wh / 2;
        if (nf === 1 && hs.h > 4.6) cy = hs.y0 + hs.h * .55;
        if (cy + wh / 2 > hs.y0 + hs.h - .25) continue;
        var q = { w: w, off: off, y: cy, ww: ww, wh: wh, bal: f > 0 && (hs.m === 'facade' || hs.m === 'beton' || hs.m === 'riche') && fract(Math.sin(off * 12.9 + w.x * 7.7 + w.z * 3.3 + f * 3.1) * 43758.5) < .3 };
        list.push(q); if (!byWall.has(w)) byWall.set(w, []); byWall.get(w).push(q); } });
    var IT = intTex(), wallMeshes = {}, segs = {}, o = new T.Object3D(), tc = new T.Color();
    // tous les murs de maison sont redessinés en morceaux autour des ouvertures, avec la face intérieure texturée
    ctx.WALLS.forEach(function (w) { if (!w.house || w.m === 'verre' || !w.im) return;
      var hs = w.house, alongX = w.hw >= w.hd, L = (alongX ? w.hw : w.hd) * 2, th = (alongX ? w.hd : w.hw) * 2, yb = w.y0 + (w.lintel ? 2.6 : 0), yt = w.y0 + w.h;
      var nx = alongX ? 0 : (w.x > hs.x ? 1 : -1), nz = alongX ? (w.z > hs.z ? 1 : -1) : 0, ry = Math.atan2(nx, nz), ax = alongX ? [1, 0] : [0, 1];
      // le sens « +x local » après rotation : (cos ry, -sin ry) ; on exprime les décalages dans ce sens
      var lx = [Math.cos(ry), -Math.sin(ry)], sgn = lx[0] * ax[0] + lx[1] * ax[1];
      var wins = byWall.get(w) || [], cols = [];
      wins.forEach(function (q) { var c0 = q.off - q.ww / 2 - .12, c1 = q.off + q.ww / 2 + .12, col = cols.filter(function (c) { return Math.abs(c.c0 - c0) < .01; })[0]; if (!col) { col = { c0: c0, c1: c1, w: [] }; cols.push(col); } col.w.push(q); });
      cols.sort(function (a, b) { return a.c0 - b.c0; });
      var pieces = [], u = -L / 2;
      cols.forEach(function (c) { if (c.c0 > u + .01) pieces.push([u, c.c0, yb, yt]); var yy = yb; c.w.sort(function (a, b) { return a.y - b.y; }).forEach(function (q) { var b0 = q.y - q.wh / 2 - .12, b1 = q.y + q.wh / 2 + .12; if (b0 > yy + .01) pieces.push([c.c0, c.c1, yy, b0]); yy = b1; }); if (yt > yy + .01) pieces.push([c.c0, c.c1, yy, yt]); u = c.c1; });
      if (L / 2 > u + .01) pieces.push([u, L / 2, yb, yt]);
      var key = w.m; if (!segs[key]) segs[key] = []; w.segs = [];
      pieces.forEach(function (pc) { var mid = (pc[0] + pc[1]) / 2; segs[key].push({ w: w, x: w.x + ax[0] * mid, z: w.z + ax[1] * mid, y: (pc[2] + pc[3]) / 2, sx: pc[1] - pc[0], sy: pc[3] - pc[2], sz: th, ry: ry }); });
      w.cut = true; });
    Object.keys(segs).forEach(function (k) { var L = segs[k], wm = L[0].w.im.material, ik = INTK[k] || 'platre', im2 = ctx.worldMat(IT[ik], ik === 'lambris' ? .4 : ik === 'papier' ? .45 : .3, { lit: .22 });
      var M = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), [wm, wm, wm, wm, wm, im2], L.length); M.castShadow = true; M.receiveShadow = true; M.frustumCulled = false;
      L.forEach(function (sg, i) { o.position.set(sg.x, sg.y, sg.z); o.rotation.set(0, sg.ry, 0); o.scale.set(sg.sx, sg.sy, sg.sz); o.updateMatrix(); M.setMatrixAt(i, o.matrix); sg.w.segs.push([M, i, o.matrix.clone()]); if (k === 'peint') M.setColorAt(i, tc.set(sg.w.col || '#ffffff')); else if (k === 'facade' || k === 'beton' || k === 'riche') { var hh = sg.w.house, pal = k === 'riche' ? ['#ffffff', '#f6efe4'] : ['#ffffff', '#f2e6d6', '#dfeaf6', '#f3dede', '#e2eedb', '#e9e2f4', '#f6efcf']; M.setColorAt(i, tc.set(pal[Math.floor(fract(Math.sin(hh.x * 3.1 + hh.z * 7.7) * 9157.3) * pal.length)])); } });
      ctx.scene.add(M); wallMeshes[k] = M; });
    // le mur d'origine (bloc plein) n'est plus dessiné : il ne sert plus qu'aux collisions et aux dégâts
    ctx.WALLS.forEach(function (w) { if (w.cut) { w.im.setMatrixAt(w.ii, new T.Matrix4().makeScale(0, 0, 0)); w.im.instanceMatrix.needsUpdate = true; } });
    if (!list.length) return;
    var plane = new T.PlaneGeometry(1, 1), box = new T.BoxGeometry(1, 1, 1);
    var glass = new T.InstancedMesh(plane, new T.MeshPhongMaterial({ color: '#3d6f9c', emissive: '#0b1d33', transparent: true, opacity: .5, shininess: 220, specular: '#e8f4ff', depthWrite: false, side: T.DoubleSide }), list.length),
      fr = new T.InstancedMesh(box, new T.MeshLambertMaterial({ color: '#f6f3ec', emissive: '#3a3834' }), list.length * 6), sill = new T.InstancedMesh(box, new T.MeshLambertMaterial({ color: '#f2eee6', emissive: '#4a4640' }), list.length),
      bal = new T.InstancedMesh(box, new T.MeshLambertMaterial({ color: '#d9dde4', emissive: '#8a8d93' }), list.length), rail = new T.InstancedMesh(box, new T.MeshPhongMaterial({ color: '#bfe6ff', transparent: true, opacity: .4, shininess: 120, specular: '#ffffff' }), list.length),
      bar = new T.InstancedMesh(box, new T.MeshLambertMaterial({ color: '#3a3f48' }), list.length), Z1 = new T.Matrix4().makeScale(0, 0, 0);
    glass.renderOrder = 2;
    function S(m, i, x, y, z, ry, sx, sy, sz, q) { o.position.set(x, y, z); o.rotation.set(0, ry, 0); o.scale.set(sx, sy, sz); o.updateMatrix(); m.setMatrixAt(i, o.matrix); q.parts.push([m, i, o.matrix.clone()]); }
    list.forEach(function (q, i) { var w = q.w, hs = w.house, alongX = w.hw >= w.hd, th = (alongX ? w.hd : w.hw), nx = alongX ? 0 : (w.x > hs.x ? 1 : -1), nz = alongX ? (w.z > hs.z ? 1 : -1) : 0, ry = Math.atan2(nx, nz);
      var cx = w.x + (alongX ? q.off : 0), cz = w.z + (alongX ? 0 : q.off), ux = alongX ? 1 : 0, uz = alongX ? 0 : 1, hw = q.ww / 2 + .06, hh = q.wh / 2 + .06; q.parts = [];
      S(glass, i, cx, q.y, cz, ry, q.ww, q.wh, 1, q);
      // cadre (4 montants) + croisillon
      S(fr, i * 6, cx - ux * hw, q.y, cz - uz * hw, ry, .12, q.wh + .24, th * 2 + .06, q); S(fr, i * 6 + 1, cx + ux * hw, q.y, cz + uz * hw, ry, .12, q.wh + .24, th * 2 + .06, q);
      S(fr, i * 6 + 2, cx, q.y + hh, cz, ry, q.ww + .24, .12, th * 2 + .06, q); S(fr, i * 6 + 3, cx, q.y - hh, cz, ry, q.ww + .24, .12, th * 2 + .06, q);
      S(fr, i * 6 + 4, cx, q.y, cz, ry, .05, q.wh, .06, q); S(fr, i * 6 + 5, cx, q.y + q.wh * .14, cz, ry, q.ww, .05, .06, q);
      S(sill, i, cx + nx * (th + .1), q.y - hh - .04, cz + nz * (th + .1), ry, q.ww + .4, .08, .24, q);
      if (q.bal) { var by = q.y - q.wh / 2 - .1, bw = q.ww + 1.0;
        S(bal, i, cx + nx * (th + .55), by, cz + nz * (th + .55), ry, bw, .14, 1.1, q); S(rail, i, cx + nx * (th + 1.08), by + .5, cz + nz * (th + 1.08), ry, bw, .86, .04, q); S(bar, i, cx + nx * (th + 1.08), by + .95, cz + nz * (th + 1.08), ry, bw + .04, .06, .08, q); }
      else [bal, rail, bar].forEach(function (m) { m.setMatrixAt(i, Z1); });
      (w.wins = w.wins || []).push(i); });
    [glass, fr, sill, bal, rail, bar].forEach(function (m) { m.frustumCulled = false; ctx.scene.add(m); }); sill.castShadow = true; bal.castShadow = true;
    FIX.win = { list: list };
  }
  var Z0 = null;
  function setWall(w, on) { Z0 = Z0 || new T.Matrix4().makeScale(0, 0, 0); var touched = new Set();
    (w.segs || []).forEach(function (sg) { sg[0].setMatrixAt(sg[1], on ? sg[2] : Z0); touched.add(sg[0]); });
    if (w.wins && FIX.win) w.wins.forEach(function (i) { FIX.win.list[i].parts.forEach(function (pt) { pt[0].setMatrixAt(pt[1], on ? pt[2] : Z0); touched.add(pt[0]); }); });
    touched.forEach(function (m) { m.instanceMatrix.needsUpdate = true; }); }

  /* ---------- meubles ---------- */
  var TPL = {}, PLACED = [];
  function put(name, x, y, z, ry, col) { if (!TPL[name]) return; PLACED.push({ n: name, x: x, y: y, z: z, ry: ry, col: col }); }
  function sz(name, dir) { var t = TPL[name]; if (!t) return [0, 0, 0]; return (dir === 'r' || dir === 'l') ? [t.s.z, t.s.y, t.s.x] : [t.s.x, t.s.y, t.s.z]; }   // [largeur u, hauteur, profondeur v]

  function furnish(hs, rnd) {
    var F = frame(hs), nf = hs.nf || 1, FH = hs.h / nf, W2 = F.W / 2, D2 = F.D / 2;
    for (var lvl = 0; lvl < nf; lvl++) {
      var y = hs.y0 + lvl * FH + .02, occ = [];
      if (hs.fl) hs.fl.strips.forEach(function (s) { occ.push([-hs.fl.Lr / 2 - .4, s[0], hs.fl.Lr / 2 + .4, s[1] + .2]); });
      if (lvl === 0) occ.push([-1.6, D2 - 2.4, 1.6, D2 + 1]);   // passage de la porte
      function free(u0, v0, u1, v1) { if (u0 < -W2 - .01 || u1 > W2 + .01 || v0 < -D2 - .01 || v1 > D2 + .01) return false; for (var i = 0; i < occ.length; i++) { var q = occ[i]; if (u0 < q[2] && u1 > q[0] && v0 < q[3] && v1 > q[1]) return false; } return true; }
      // pose un meuble (dir = vers où il regarde), u/v = centre ; bloque la place ; collision si gros
      function P(name, u, v, dir, opt) { opt = opt || {}; var s = sz(name, dir), u0 = u - s[0] / 2, u1 = u + s[0] / 2, v0 = v - s[2] / 2, v1 = v + s[2] / 2;
        if (!opt.over && !free(u0, v0, u1, v1)) return false; if (!opt.over) occ.push([u0 - .15, v0 - .15, u1 + .15, v1 + .15]);
        var p = F.w(u, v); put(name, p[0], (opt.y != null ? opt.y : y), p[1], F.rot(dir), opt.col);
        if (opt.col2 !== false && s[1] > .7 && !opt.over) { var b = F.box(u0, v0, u1, v1); ctx.PCOL.push({ x: (b[0] + b[2]) / 2, z: (b[1] + b[3]) / 2, hw: (b[2] - b[0]) / 2, hd: (b[3] - b[1]) / 2, y0: y, h: s[1] }); }
        return true; }
      function back(name, u, opt) { var s = sz(name, 'f'); return P(name, u, -D2 + s[2] / 2 + .04, 'f', opt); }
      function left(name, v, opt) { var s = sz(name, 'r'); return P(name, -W2 + s[0] / 2 + .04, v, 'r', opt); }
      function right(name, v, opt) { var s = sz(name, 'l'); return P(name, W2 - s[0] / 2 - .04, v, 'l', opt); }
      function front(name, u, opt) { var s = sz(name, 'b'); return P(name, u, D2 - s[2] / 2 - .04, 'b', opt); }
      function onTop(name, under, u, v, dir) { var s = sz(under, dir); var p = F.w(u, v); put(name, p[0], y + s[1], p[1], F.rot(dir)); }
      function ceiling(name, u, v) { var s = sz(name, 'f'); var p = F.w(u, v); put(name, p[0], y + FH - .16 - s[1], p[1], 0); }
      var sofaC = SOFA[rnd() * SOFA.length | 0], type = hs.ty;
      if (type === 'bureau' && lvl > 0 || type === 'tour') {   // bureaux : rangées de postes de travail
        for (var bu = -W2 + 1.4; bu < W2 - 1.2; bu += 2.6) for (var bv = -D2 + (hs.fl ? 4.2 : 1.6); bv < D2 - 1.6; bv += 2.8) { if (P('desk', bu, bv, 'f')) { onTop('computerScreen', 'desk', bu - .2, bv - .1, 'f'); onTop('computerKeyboard', 'desk', bu - .2, bv + .25, 'f'); P('chairDesk', bu, bv + 1.0, 'b', { col2: false }); } }
        right('bookcaseClosedWide', 0); left('kitchenBar', 0) && onTop('kitchenCoffeeMachine', 'kitchenBar', -W2 + .5, 0, 'r'); back('pottedPlant', W2 - .6); back('pottedPlant', -W2 + .6); front('trashcan', W2 - .5); front('pottedPlant', -W2 + .6);
        ceiling('lampSquareCeiling', 0, 0); ceiling('lampSquareCeiling', -W2 / 2, D2 / 2);
      } else if (type === 'boutique' || type === 'bureau') {   // rez-de-chaussée : boutique / hall
        for (var su = -W2 + 1.0; su < W2 - .8; su += 1.1) back('bookcaseOpen', su);
        if (back('kitchenFridgeLarge', 0)) {} left('bookcaseOpen', 0); right('kitchenBar', D2 - 3.2) && onTop('radio', 'kitchenBar', W2 - .5, D2 - 3.2, 'l');
        P('cardboardBoxClosed', -W2 + 1.5, -D2 + 2.2, 'f'); P('cardboardBoxOpen', -W2 + 2.3, -D2 + 2.4, 'r'); P('rugRectangle', 0, .5, 'f', { col2: false }); P('loungeChair', 1.6, 1.0, 'l', { col: sofaC }); P('pottedPlant', -2.0, 1.4, 'f');
        front('pottedPlant', -2.2); front('pottedPlant', 2.2); ceiling('lampSquareCeiling', 0, 0);
      } else if (type === 'hangar') {   // hangars, garages, entrepôts : cartons, étagères
        for (var hu = -W2 + 1.2; hu < W2 - 1; hu += 1.15) back('bookcaseOpen', hu);
        for (var k = 0; k < 10; k++) P(rnd() < .5 ? 'cardboardBoxClosed' : 'cardboardBoxOpen', (rnd() - .5) * (F.W - 3), (rnd() - .5) * (F.D - 4), rnd() < .5 ? 'f' : 'r');
        left('bench', 0); right('washer', 0); front('trashcan', W2 - .6); ceiling('lampSquareCeiling', 0, 0);
      } else if (type === 'cabane') {   // favela / petites baraques
        back('bedSingle', -W2 + 1.1, { col: sofaC }); right('televisionVintage', -.5); left('chair', 1.0); P('tableRound', -.5, .6, 'f'); onTop('radio', 'tableRound', -.5, .6, 'f');
        back('pottedPlant', W2 - .5); front('plantSmall1', W2 - .5); ceiling('lampSquareCeiling', 0, 0);
      } else if (type === 'motel') {
        back('bedDouble', 0, { col: sofaC }); back('sideTable', -1.6) && onTop('lampSquareTable', 'sideTable', -1.6, -D2 + .4, 'f'); back('sideTable', 1.6);
        P('cabinetTelevision', 0, D2 - 2.6, 'b') && onTop('televisionModern', 'cabinetTelevision', 0, D2 - 2.6, 'b');
        left('toilet', D2 - 1.2); left('bathroomSink', D2 - 2.3); right('loungeChair', D2 - 2.0, { col: sofaC }); ceiling('lampSquareCeiling', 0, 0);
      } else {   // maison / appartement / villa
        var lux = hs.m === 'riche';
        back(F.W > 7 ? 'bedDouble' : 'bedSingle', -W2 + (F.W > 7 ? 1.3 : .9), { col: sofaC });
        back('sideTableDrawers', -W2 + (F.W > 7 ? 2.9 : 2.1)) && onTop('lampSquareTable', 'sideTableDrawers', -W2 + (F.W > 7 ? 2.9 : 2.1), -D2 + .35, 'f');
        back('bookcaseOpen', W2 - .6) && onTop('books', 'bookcaseOpen', W2 - .6, -D2 + .3, 'f');
        back('pottedPlant', W2 - 1.5);
        // cuisine sur le mur de droite
        var kv = -D2 + 2.6, row = ['kitchenFridge', 'kitchenCabinet', 'kitchenSink', 'kitchenStove', 'kitchenCabinetDrawer'];
        row.forEach(function (n2) { var s = sz(n2, 'l'); if (kv + s[2] / 2 < D2 - 2.2 && right(n2, kv + s[2] / 2)) { if (n2 === 'kitchenCabinet') onTop('kitchenMicrowave', 'kitchenCabinet', W2 - .4, kv + s[2] / 2, 'l'); kv += s[2] + .02; } });
        // salon sur le mur de gauche
        left(lux ? 'loungeDesignSofa' : F.D > 8 ? 'loungeSofaLong' : 'loungeSofa', .4, { col: sofaC }) || left('loungeChair', .4, { col: sofaC });
        P(lux ? 'rugRound' : 'rugRectangle', -W2 + 3.0, .4, 'r', { col2: false, over: true });
        P('tableCoffee', -W2 + 2.6, .4, 'r', { col2: false });
        P('cabinetTelevision', -W2 + 4.4, .4, 'l') && onTop('televisionModern', 'cabinetTelevision', -W2 + 4.4, .4, 'l');
        // table à manger près de l'entrée
        if (P('table', W2 - 2.6, D2 - 3.0, 'f', { col2: false })) { P('chair', W2 - 3.15, D2 - 2.1, 'b', { col2: false }); P('chair', W2 - 2.05, D2 - 2.1, 'b', { col2: false }); P('chair', W2 - 3.15, D2 - 3.9, 'f', { col2: false }); P('chair', W2 - 2.05, D2 - 3.9, 'f', { col2: false }); }
        // petit coin salle de bain
        if (F.W > 8 && F.D > 7) { front('toilet', -W2 + .7); front(lux ? 'bathtub' : 'shower', -W2 + 2.2); }
        front('coatRackStanding', 2.1); front('pottedPlant', -2.0); left('lampRoundFloor', -1.2);
        ceiling(lux || rnd() < .4 ? 'ceilingFan' : 'lampSquareCeiling', 0, 0);
        if (lux) { right('speaker', D2 - 1.3); back('plantSmall2', 0); }
      }
    }
  }
  function houseType(hs) {
    if (hs.barn) return 'grange'; if (hs.fav) return 'cabane'; if (hs.villa) return 'maison';
    if (hs.m === 'facade' && hs.h > 10) return 'tour'; if (hs.m === 'facade' || hs.m === 'beton') return 'bureau';
    if (hs.m === 'metal') return hs.hx * hs.hz > 120 ? 'boutique' : 'hangar'; if (hs.m === 'brique' && hs.hx * hs.hz > 100) return 'hangar';
    if (hs.m === 'brique' && Math.abs(hs.hx - 4.7) < .1) return 'motel'; return 'maison';
  }

  // fusionne tous les meubles d'un quartier en un seul mesh à couleurs de sommets
  function bake() {
    var groups = {}, o = new T.Object3D(), m4 = new T.Matrix4(), nm = new T.Matrix3(), v = new T.Vector3(), c = new T.Color();
    PLACED.forEach(function (p) { var key = Math.round(p.x / 70) + ',' + Math.round(p.z / 70); (groups[key] = groups[key] || []).push(p); });
    Object.keys(groups).forEach(function (key) { var L = groups[key], nV = 0;
      L.forEach(function (p) { TPL[p.n].parts.forEach(function (pt) { nV += pt.g.attributes.position.count; }); });
      var nI = 0; L.forEach(function (p) { TPL[p.n].parts.forEach(function (pt) { nI += pt.g.index ? pt.g.index.count : pt.g.attributes.position.count; }); });
      var pos = new Float32Array(nV * 3), nor = new Float32Array(nV * 3), col = new Float32Array(nV * 3), idx = nV > 65535 ? new Uint32Array(nI) : new Uint16Array(nI), k = 0, ki = 0, cx = 0, cz = 0;
      L.forEach(function (p) { o.position.set(p.x, p.y, p.z); o.rotation.set(0, p.ry, 0); o.scale.setScalar(1); o.updateMatrix(); cx += p.x; cz += p.z;
        TPL[p.n].parts.forEach(function (pt) { m4.multiplyMatrices(o.matrix, pt.m); nm.getNormalMatrix(m4); var P = pt.g.attributes.position, N = pt.g.attributes.normal, cc = pt.c;
          if (p.col && pt.main) cc = c.set(p.col).clone();
          var base = k, I = pt.g.index; if (I) for (var j = 0; j < I.count; j++) idx[ki++] = base + I.getX(j); else for (j = 0; j < P.count; j++) idx[ki++] = base + j;
          for (var i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(m4); pos[k * 3] = v.x; pos[k * 3 + 1] = v.y; pos[k * 3 + 2] = v.z;
            if (N) { v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor[k * 3] = v.x; nor[k * 3 + 1] = v.y; nor[k * 3 + 2] = v.z; }
            col[k * 3] = cc.r; col[k * 3 + 1] = cc.g; col[k * 3 + 2] = cc.b; k++; } }); });
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('normal', new T.BufferAttribute(nor, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3)); g.setIndex(new T.BufferAttribute(idx, 1)); g.computeBoundingSphere();
      var mesh = new T.Mesh(g, FIX.furnMat); mesh.receiveShadow = true; mesh.castShadow = false; ctx.scene.add(mesh); FIX.clusters.push({ m: mesh, x: cx / L.length, z: cz / L.length }); });
  }
  function loadModels(done) {
    if (!T.GLTFLoader) { done(); return; } var L = new T.GLTFLoader(), left = MODELS.length;
    MODELS.forEach(function (nm) { L.load('models/' + nm + '.glb', function (gl) {
        var s = gl.scene; s.scale.setScalar(K); s.updateMatrixWorld(true); var b = new T.Box3().setFromObject(s), ctr = b.getCenter(new T.Vector3()), size = b.getSize(new T.Vector3());
        var off = new T.Matrix4().makeTranslation(-ctr.x, -b.min.y, -ctr.z), parts = [], big = 0;
        s.traverse(function (o) { if (!o.isMesh) return; var g = o.geometry, mats = Array.isArray(o.material) ? o.material : [o.material];
          var m = new T.Matrix4().multiplyMatrices(off, o.matrixWorld);
          if (mats.length > 1 && g.groups.length) { var gn = g.index ? g.toNonIndexed() : g; gn.groups.forEach(function (gr) { var sub = new T.BufferGeometry(); ['position', 'normal'].forEach(function (a) { var A = gn.attributes[a]; if (A) sub.setAttribute(a, new T.BufferAttribute(A.array.slice(gr.start * 3, (gr.start + gr.count) * 3), 3)); }); parts.push({ g: sub, m: m, c: mats[gr.materialIndex].color.clone() }); }); }
          else parts.push({ g: g, m: m, c: mats[0].color.clone() }); });
        parts.forEach(function (p) { var c = p.c, l = (c.r + c.g + c.b) / 3; if (l < .97) { c.r = Math.pow(c.r, 1.7); c.g = Math.pow(c.g, 1.7); c.b = Math.pow(c.b, 1.7); } });   // couleurs plus franches (sauf le blanc)
        parts.forEach(function (p) { var n = p.g.attributes.position.count; if (n > big) { big = n; } }); parts.forEach(function (p) { p.main = p.g.attributes.position.count === big && /Sofa|loungeChair/.test(nm); });
        TPL[nm] = { parts: parts, s: size };
        if (--left === 0) done(); }, undefined, function () { if (--left === 0) done(); }); });
  }

  window.INTERIORS = {
    build: function (THREE, c) { T = THREE; ctx = c;
      ctx.HOUSES.forEach(function (hs) { hs.ty = houseType(hs); });
      makeFloors(); makeWindows();
      FIX.furnMat = new T.MeshLambertMaterial({ vertexColors: true });
      loadModels(function () { var r = (function (a) { return function () { a = (a * 16807) % 2147483647; return a / 2147483647; }; })(4242);
        ctx.HOUSES.forEach(function (hs) { if (hs.ty !== 'grange') try { furnish(hs, r); } catch (e) { console.warn('meubles', e); } });
        (window.EXT_FURN || []).forEach(function (q) { put(q[0], q[1], q[2], q[3], q[4], q[5]); });   // meubles d'extérieur (terrasses)
        bake(); FIX.ready = true; if (ctx.onReady) ctx.onReady(); });
    },
    groundAt: groundAt, ceilAt: ceilAt, setWall: setWall,
    update: function (cam, fog) { if (FIX.winMat && fog) { FIX.winMat.uniforms.fogColor.value.copy(fog.color); FIX.winMat.uniforms.fogNear.value = fog.near; FIX.winMat.uniforms.fogFar.value = fog.far; }
      var cx = cam.position.x, cz = cam.position.z; var R2 = cam.position.y > 60 ? 0 : (window.SET && SET.gfx === 2 ? 80 : 60); FIX.clusters.forEach(function (q) { q.m.visible = Math.hypot(q.x - cx, q.z - cz) < R2; }); },
    stats: function () { var nv = 0; FIX.clusters.forEach(function (q) { nv += q.m.geometry.attributes.position.count; }); return { verts: nv, windows: FIX.win ? FIX.win.list.length : 0, furniture: PLACED.length, clusters: FIX.clusters.length, floors: FLOORED.length, ready: !!FIX.ready }; }
  };
})();
