/* MOTO de Wald City : une sportive ORIGINALE (aucune marque), faite à la main en formes 3D avec des matériaux réalistes
   (peinture métallisée nacrée, chrome, carbone, alu brossé, caoutchouc, LED) qui reflètent le ciel de la ville (scene.environment).
   window.buildMoto(THREE, palette) → groupe : avant de la moto vers +x, roues sur l'axe z (userData.wh = roues qui tournent),
   userData.seat = position de la selle (le pilote s'assoit là), userData.bars = guidon. Longueur ≈ 2,1 m, selle à 0,85 m. */
(function () {
  var PAL = [
    { p: '#d4145a', a: '#ffffff', r: '#111111', n: 'ROSE NÉON' }, { p: '#5a2bd8', a: '#2de2ff', r: '#111111', n: 'VIOLET' },
    { p: '#101014', a: '#ff2bd6', r: '#ff2bd6', n: 'NOIR & ROSE' }, { p: '#f2f2f5', a: '#d4145a', r: '#1a1a1a', n: 'BLANC NACRÉ' },
    { p: '#c81e1e', a: '#111111', r: '#ffd23d', n: 'ROUGE COURSE' }, { p: '#0e8fd8', a: '#ffd23d', r: '#111111', n: 'BLEU' }];
  window.MOTOPAL = PAL;
  window.buildMoto = function (THREE, pi) {
    var P = PAL[(pi || 0) % PAL.length], g = new THREE.Group(), WH = [];
    function std(c, m, r, e) { var o = { color: c, metalness: m, roughness: r }; if (e) { o.emissive = c; o.emissiveIntensity = e; } return new THREE.MeshStandardMaterial(o); }
    var paint = std(P.p, .55, .22), accent = std(P.a, .4, .3), chrome = std('#e8ecf2', 1, .08), alu = std('#b8bec8', .9, .35), dark = std('#1c1d22', .6, .45),
      rubber = new THREE.MeshStandardMaterial({ color: '#0b0b0d', metalness: 0, roughness: .95, envMapIntensity: .25 }), carbon = std('#202226', .3, .35), gold = std('#d8a93a', .95, .25), seatM = std('#18181b', 0, .85), glass = new THREE.MeshStandardMaterial({ color: '#1a2a3a', metalness: .2, roughness: .05, transparent: true, opacity: .55 }),
      rim = std(P.r === '#111111' ? '#c8ccd4' : P.r, .85, .25), led = std('#ffffff', 0, .3, 2.2), tail = std('#ff1a2a', 0, .3, 2.4), redC = std('#d81e1e', .5, .35);
    function mesh(geo, mat, x, y, z, rx, ry, rz, par) { var m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, rz || 0); m.castShadow = true; m.receiveShadow = true; (par || g).add(m); return m; }
    function tube(a, b, r, mat, par) { var A = new THREE.Vector3().fromArray(a), B = new THREE.Vector3().fromArray(b), L = A.distanceTo(B), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 12), mat); m.position.copy(A).add(B).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); m.castShadow = true; (par || g).add(m); return m; }
    function profile(pts, depth, mat, z, bevel) { var s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]); s.closePath(); var geo = new THREE.ExtrudeGeometry(s, { depth: depth, bevelEnabled: true, bevelThickness: bevel || .025, bevelSize: bevel || .025, bevelSegments: 3, curveSegments: 8 }); geo.translate(0, 0, -depth / 2); geo.computeVertexNormals(); return mesh(geo, mat, 0, 0, z); }
    /* ---- roues : pneu, jante 5 branches, disque de frein, étrier ---- */
    function wheel(x, front) { var w = new THREE.Group(); w.position.set(x, .33, 0); g.add(w);
      mesh(new THREE.TorusGeometry(.265, .072, 18, 48), rubber, 0, 0, 0, 0, 0, 0, w);
      mesh(new THREE.TorusGeometry(.268, .012, 6, 48), accent, 0, 0, .06, 0, 0, 0, w); mesh(new THREE.TorusGeometry(.268, .012, 6, 48), accent, 0, 0, -.06, 0, 0, 0, w);
      mesh(new THREE.TorusGeometry(.2, .022, 8, 40), rim, 0, 0, 0, 0, 0, 0, w);
      for (var k = 0; k < 5; k++) { var a = k / 5 * Math.PI * 2, sp = mesh(new THREE.BoxGeometry(.03, .19, .03), dark, Math.cos(a) * .1, Math.sin(a) * .1, 0, 0, 0, a - Math.PI / 2, w); sp.rotation.z = a + Math.PI / 2; }
      mesh(new THREE.CylinderGeometry(.045, .045, .14, 14), alu, 0, 0, 0, Math.PI / 2, 0, 0, w);
      var disc = mesh(new THREE.CylinderGeometry(front ? .16 : .11, front ? .16 : .11, .008, 32), std('#c8ccd2', .95, .18), 0, 0, .075, Math.PI / 2, 0, 0, w);
      for (var h = 0; h < 12; h++) { var ha = h / 12 * Math.PI * 2; mesh(new THREE.CylinderGeometry(.008, .008, .012, 6), dark, Math.cos(ha) * (front ? .12 : .085), Math.sin(ha) * (front ? .12 : .085), .075, Math.PI / 2, 0, 0, w); }
      WH.push(w); w.userData.r = .34; w.userData.dyn = true;
      var cal = mesh(new THREE.BoxGeometry(.1, .06, .05), redC, front ? -.06 : .05, front ? .13 : .09, .09); cal.position.x += x; cal.position.y += .33; return w; }
    wheel(.74, true); wheel(-.72, false);
    /* ---- fourche inversée dorée + tête de fourche ---- */
    [-1, 1].forEach(function (e) { tube([.74, .33, e * .1], [.6, .72, e * .1], .03, gold); tube([.6, .72, e * .1], [.5, 1.02, e * .1], .036, chrome); });
    mesh(new THREE.BoxGeometry(.08, .04, .26), alu, .52, .98, 0); mesh(new THREE.BoxGeometry(.08, .04, .26), alu, .49, 1.06, 0);
    /* garde-boue avant */
    var fg = mesh(new THREE.TorusGeometry(.32, .045, 6, 24, Math.PI * .55), paint, .74, .33, 0, 0, 0, Math.PI * .25); fg.scale.z = 2.4;
    /* ---- cadre alu périmétrique, bras oscillant, chaîne ---- */
    [-1, 1].forEach(function (e) { tube([.5, .96, e * .12], [.02, .76, e * .17], .03, dark); tube([.02, .76, e * .17], [-.18, .52, e * .15], .03, dark); tube([-.18, .52, e * .14], [-.72, .33, e * .1], .035, alu); tube([-.18, .7, e * .12], [-.58, .88, e * .08], .022, dark); });
    for (var c = 0; c < 22; c++) { var t = c / 21, cx = -.72 + t * .58, cy = .33 + t * .16; mesh(new THREE.BoxGeometry(.03, .012, .012), dark, cx, cy + .07, .14); mesh(new THREE.BoxGeometry(.03, .012, .012), dark, cx, cy - .07, .14); }
    mesh(new THREE.CylinderGeometry(.09, .09, .02, 20), alu, -.72, .33, .14, Math.PI / 2); mesh(new THREE.CylinderGeometry(.045, .045, .02, 14), alu, -.15, .5, .14, Math.PI / 2);
    /* ---- moteur 4 cylindres : bloc, ailettes, carters ---- */
    mesh(new THREE.BoxGeometry(.42, .34, .3), dark, .08, .5, 0); mesh(new THREE.BoxGeometry(.26, .16, .28), dark, .18, .7, 0, 0, 0, -.25);
    mesh(new THREE.CylinderGeometry(.1, .1, .04, 22), chrome, .02, .45, .17, Math.PI / 2); mesh(new THREE.CylinderGeometry(.08, .08, .04, 22), carbon, .2, .42, -.17, Math.PI / 2);
    mesh(new THREE.BoxGeometry(.3, .1, .28), carbon, .1, .3, 0);   // carter bas
    /* ---- échappement : collecteurs + silencieux titane relevé sous la selle ---- */
    for (var hx = 0; hx < 4; hx++) tube([.28, .62, -.09 + hx * .06], [.26, .26, -.06 + hx * .04], .016, std('#c89a6a', .9, .3));
    tube([.26, .26, 0], [-.05, .27, -.1], .032, std('#a8b0c0', .95, .2)); tube([-.05, .27, -.1], [-.2, .3, -.17], .034, std('#a8b0c0', .95, .2)); var muf = tube([-.2, .3, -.19], [-.52, .44, -.21], .068, std('#8fa6d0', .95, .16)); muf.scale.set(1, 1, 1.25); mesh(new THREE.CylinderGeometry(.06, .072, .06, 18), carbon, -.54, .45, -.21, 0, 0, Math.PI * .37); mesh(new THREE.CylinderGeometry(.035, .035, .07, 14), dark, -.57, .465, -.21, 0, 0, Math.PI * .37);   // silencieux court en titane bleui
    /* ---- CARROSSERIE d'un seul tenant (loft : nez → réservoir → coque arrière), section « superellipse », livrée peinte dans la texture ---- */
    var PR = [ // x, haut, bas, demi-largeur (carrosserie haute : nez, réservoir, coque arrière)
      [1.13, .97, .94, .02], [1.05, 1.05, .86, .1], [.93, 1.12, .8, .16], [.78, 1.16, .78, .2], [.64, 1.11, .79, .2], [.48, 1.07, .8, .2], [.3, 1.1, .81, .24],
      [.12, 1.08, .82, .22], [-.02, .99, .82, .17], [-.14, .92, .82, .14], [-.36, .92, .83, .12], [-.56, .97, .86, .095], [-.74, 1.02, .92, .07], [-.87, 1.01, .97, .02]],
      PR2 = [[.98, .92, .88, .1], [.9, .93, .74, .15], [.76, .9, .6, .175], [.6, .86, .47, .18], [.42, .83, .4, .18], [.26, .8, .4, .165], [.14, .74, .44, .13], [.06, .66, .5, .08]];   // flancs bas (ouverts : la roue avant tourne dedans)
    function spl(A, i, c, t) { var a = A[Math.max(0, i - 1)][c], b = A[i][c], d = A[Math.min(A.length - 1, i + 1)][c], e = A[Math.min(A.length - 1, i + 2)][c], t2 = t * t, t3 = t2 * t;
      return .5 * ((2 * b) + (-a + d) * t + (2 * a - 5 * b + 4 * d - e) * t2 + (-a + 3 * b - 3 * d + e) * t3); }
    function prof(A, x) { for (var i = 0; i < A.length - 1; i++) if (x <= A[i][0] && x >= A[i + 1][0]) { var t = (A[i][0] - x) / (A[i][0] - A[i + 1][0]); return [spl(A, i, 1, t), spl(A, i, 2, t), spl(A, i, 3, t)]; } return [1, 1, .01]; }
    function loft(A, x0, x1, nx, nr, fy, mat2, ex, th0, th1) { var pos = [], uv = [], idx = []; th0 = th0 == null ? -Math.PI / 2 : th0; th1 = th1 == null ? Math.PI * 1.5 : th1;
      for (var i = 0; i <= nx; i++) { var x = x0 + (x1 - x0) * i / nx, q = prof(A, x), top = q[0] + (fy ? fy(x, 1) : 0), bot = q[1] + (fy ? fy(x, 0) : 0), my = (top + bot) / 2, hh = (top - bot) / 2, w = Math.max(.004, q[2] + (ex || 0));
        for (var j = 0; j <= nr; j++) { var th = th0 + j / nr * (th1 - th0), s = Math.sin(th), c = Math.cos(th), pe = .62;
          pos.push(x, my + hh * Math.sign(s) * Math.pow(Math.abs(s), pe), w * Math.sign(c) * Math.pow(Math.abs(c), pe)); uv.push((x + .87) / 2.02, j / nr); } }
      for (i = 0; i < nx; i++) for (j = 0; j < nr; j++) { var a = i * (nr + 1) + j, b = a + nr + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
      var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals(); return mesh(geo, mat2, 0, 0, 0); }
    /* livrée : bande sur le dessus, liserés, W sur les flancs, numéro sur la coque arrière */
    var lc = document.createElement('canvas'); lc.width = 1024; lc.height = 512; var L2 = lc.getContext('2d'), U = function (x) { return (x + .87) / 2.02 * 1024; }, V = function (v) { return (1 - v) * 512; };
    L2.fillStyle = P.p; L2.fillRect(0, 0, 1024, 512);
    L2.fillStyle = P.a; L2.fillRect(0, V(.53), 1024, V(.47) - V(.53)); L2.fillStyle = P.r; L2.fillRect(0, V(.555), 1024, 6); L2.fillRect(0, V(.445) - 6, 1024, 6);
    [[.25, 1], [.75, -1]].forEach(function (sd) { var vy = V(sd[0]); L2.save(); L2.translate(U(.68), vy); if (sd[1] < 0) L2.scale(-1, 1);
      L2.fillStyle = P.a; L2.beginPath(); L2.moveTo(-170, 40); L2.lineTo(240, -6); L2.lineTo(260, 10); L2.lineTo(-150, 58); L2.fill();
      L2.fillStyle = P.r; L2.beginPath(); L2.moveTo(-160, 66); L2.lineTo(250, 18); L2.lineTo(256, 28); L2.lineTo(-150, 76); L2.fill();
      L2.font = '900 italic 92px Arial Black, Impact, sans-serif'; L2.fillStyle = '#000'; L2.globalAlpha = .35; L2.fillText('W', -36, 6); L2.globalAlpha = 1; L2.fillStyle = P.a; L2.fillText('W', -40, 0);
      L2.font = '900 italic 34px Arial Black, sans-serif'; L2.fillText('NEON  R', 34, -20); L2.restore();
      L2.save(); L2.translate(U(-.62), vy - 10); if (sd[1] < 0) L2.scale(-1, 1); L2.font = '900 italic 70px Arial Black, Impact, sans-serif'; L2.fillStyle = P.a; L2.fillText('77', -40, 24); L2.restore(); });
    var lt = new THREE.CanvasTexture(lc); lt.encoding = THREE.sRGBEncoding; lt.anisotropy = 8;
    var shellM = new THREE.MeshPhysicalMaterial({ map: lt, metalness: .45, roughness: .28, clearcoat: 1, clearcoatRoughness: .06 });
    loft(PR, 1.13, -.87, 64, 28, null, shellM);
    /* flancs bas : peinture + écopes carbone + liseré, ouverts dedans (la roue avant et le moteur restent visibles par-dessous) */
    var fc = document.createElement('canvas'); fc.width = 512; fc.height = 256; var F2 = fc.getContext('2d'), FU = function (x) { return (x + .87) / 2.02 * 512; };
    F2.fillStyle = P.p; F2.fillRect(0, 0, 512, 256); F2.fillStyle = '#1b1c20';
    [[.62, .42], [.5, .38], [.38, .34]].forEach(function (v, i) { F2.beginPath(); F2.moveTo(FU(v[0]), 70 + i * 34); F2.lineTo(FU(v[0]) + 60, 62 + i * 34); F2.lineTo(FU(v[0]) + 66, 78 + i * 34); F2.lineTo(FU(v[0]) + 4, 86 + i * 34); F2.fill(); });
    F2.fillStyle = P.a; F2.beginPath(); F2.moveTo(FU(.1), 200); F2.lineTo(FU(.95), 120); F2.lineTo(FU(.95), 134); F2.lineTo(FU(.12), 214); F2.fill();
    F2.fillStyle = P.r; F2.fillRect(0, 236, 512, 8);
    var ft = new THREE.CanvasTexture(fc); ft.encoding = THREE.sRGBEncoding; ft.anisotropy = 8; var sideM = new THREE.MeshPhysicalMaterial({ map: ft, metalness: .45, roughness: .28, clearcoat: 1, clearcoatRoughness: .06, side: THREE.DoubleSide });
    loft(PR2, .98, .06, 36, 14, null, sideM, 0, -1.25, 1.35); loft(PR2, .98, .06, 36, 14, null, sideM, 0, Math.PI - 1.35, Math.PI + 1.25);
    mesh(new THREE.BoxGeometry(.5, .025, .3), carbon, .36, .3, 0, 0, 0, .12);   // sabot carbone sous le moteur
    /* bulle teintée qui suit le nez */
    loft(PR, .95, .58, 24, 20, function (x, top) { return top ? .1 * Math.max(0, Math.min(1, (.97 - x) / .3)) : 0; }, glass, -.02).position.y = .012;
    /* double phare LED en amande + feux de jour en flèche */
    [-1, 1].forEach(function (e) { var hl = mesh(new THREE.SphereGeometry(.05, 16, 10), led, 1.055, .95, e * .065); hl.scale.set(.45, .55, 1.2); hl.rotation.y = e * .5;
      mesh(new THREE.BoxGeometry(.012, .012, .1), led, 1.03, .9, e * .1, 0, e * .55, -.2); mesh(new THREE.BoxGeometry(.015, .02, .03), std('#ff8a00', 0, .3, 1.5), .93, .92, e * .158); });
    /* tête de fourche + tableau de bord */
    mesh(new THREE.BoxGeometry(.07, .06, .12), dark, .55, 1.12, 0, 0, 0, -.6);
    /* guidons bracelets, poignées, rétros */
    [-1, 1].forEach(function (e) { tube([.5, 1.06, e * .1], [.42, 1.06, e * .3], .016, alu); tube([.42, 1.06, e * .29], [.4, 1.06, e * .41], .022, seatM); mesh(new THREE.CylinderGeometry(.012, .012, .1, 8), alu, .46, 1.09, e * .3, 0, 0, Math.PI / 2 - .3);   // levier
      tube([.78, 1.1, e * .19], [.75, 1.17, e * .26], .012, dark); var mr = mesh(new THREE.SphereGeometry(.07, 16, 10), paint, .74, 1.19, e * .29); mr.scale.set(.35, .42, 1.1); mesh(new THREE.PlaneGeometry(.12, .05), chrome, .713, 1.19, e * .29, 0, -Math.PI / 2, 0); });
    /* ---- selle biplace en cuir piqué ---- */
    loft(PR, .02, -.5, 20, 18, function (x, top) { return top ? .06 : .07; }, seatM, -.025);
    var tl = mesh(new THREE.BoxGeometry(.03, .025, .1), tail, -.875, .995, 0);
    tube([-.62, .84, 0], [-.85, .62, 0], .015, dark); mesh(new THREE.BoxGeometry(.01, .12, .2), dark, -.86, .58, 0, 0, 0, .3);
    /* garde-boue arrière / repose-pieds */
    var rg = mesh(new THREE.TorusGeometry(.33, .03, 6, 20, Math.PI * .35), carbon, -.72, .33, 0, 0, 0, Math.PI * .45); rg.scale.z = 3;
    [-1, 1].forEach(function (e) { tube([-.12, .5, e * .17], [-.12, .5, e * .26], .015, alu); tube([.18, .38, e * .14], [.18, .38, e * .22], .012, alu); });
    var sh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, .9), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .32, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.y = .02; g.add(sh);
    function mark(n, x, y, z) { var o = new THREE.Object3D(); o.position.set(x, y, z); o.userData.dyn = true; g.add(o); g.userData[n] = o; }
    mark('gA', .41, 1.06, .34); mark('gB', .41, 1.06, -.34); mark('pA', -.1, .5, .25); mark('pB', -.1, .5, -.25); mark('seatM', -.2, .95, 0);   // poignées, repose-pieds, selle (pour placer le pilote)
    g.userData.wh = WH; g.userData.seat = new THREE.Vector3(-.2, .92, 0); g.userData.pal = P; g.userData.moto = true;
    return g; };

  /* ---------- PILOTE : pose « vraie moto » (buste penché, mains sur les poignées, pieds sur les repose-pieds) ----------
     Pour les citadins réalistes (Rocketbox, os Bip01) : petite IK à 2 os calculée dans l'espace du perso, sur la vraie position des poignées.
     k = montée (0 = debout à côté, 1 = assis), lean = inclinaison du buste en plus (freinage / accélération). */
  var Q = {};
  function T3() { return window.THREE; }
  function rig(c) { if (c.rideR && c.rideR.cm === c.cm) return c.rideR; var T = T3(), sk = null; c.cm.traverse(function (o) { if (!sk && o.isSkinnedMesh && o.skeleton) sk = o.skeleton; }); if (!sk) return null;
    var B = {}; sk.bones.forEach(function (b) { var m = /Bip01_(Pelvis|Spine|Spine1|Spine2|Neck|Head|[LR]_(?:Thigh|Calf|Foot|Toe0|UpperArm|Forearm|Hand|Clavicle))$/.exec(b.name); if (m) B[m[1]] = b; });
    if (!B.Pelvis || !B.L_Thigh || !B.L_UpperArm || !B.Spine) return null;
    var L0 = sk.bones.map(function (b) { return [b.quaternion.clone(), b.position.clone()]; }); c.cm.updateMatrixWorld(true); var gi = new T.Quaternion(), gm = new T.Matrix4().copy(c.cm.matrixWorld).invert(); c.cm.getWorldQuaternion(gi); gi.invert();
    function P(b) { return b.getWorldPosition(new T.Vector3()).applyMatrix4(gm); }
    var R = { cm: c.cm, sk: sk, B: B, L0: L0, q0: {}, d0: {}, len: {} }, kids = { Spine: 'Neck', Spine1: 'Neck', Spine2: 'Neck', Neck: 'Head', L_Thigh: 'L_Calf', L_Calf: 'L_Foot', R_Thigh: 'R_Calf', R_Calf: 'R_Foot', L_UpperArm: 'L_Forearm', L_Forearm: 'L_Hand', R_UpperArm: 'R_Forearm', R_Forearm: 'R_Hand' };
    Object.keys(B).forEach(function (n) { R.q0[n] = gi.clone().multiply(B[n].getWorldQuaternion(new T.Quaternion())); if (kids[n] && B[kids[n]]) { var d = P(B[kids[n]]).sub(P(B[n])); R.len[n] = d.length(); R.d0[n] = d.normalize(); } });
    R.fz = 1;   /* l'avant du perso = +z dans son groupe (real.js le tourne de 90°) */ R.side = Math.sign(P(B.L_UpperArm).x) || 1; R.pelY = P(B.Pelvis).y; R.footY = Math.min(P(B.L_Foot).y, P(B.R_Foot).y); c.rideR = R; return R; }
  function setDir(R, n, dir, extra) { var T = T3(), b = R.B[n]; if (!b) return; var gq = new T.Quaternion(); R.cm.getWorldQuaternion(gq);
    var qt = dir ? new T.Quaternion().setFromUnitVectors(R.d0[n], dir.clone().normalize()).multiply(R.q0[n]) : (extra || new T.Quaternion()).clone().multiply(R.q0[n]);
    var pq = new T.Quaternion(); b.parent.getWorldQuaternion(pq); pq.premultiply(gq.invert()); b.quaternion.copy(pq.invert().multiply(qt)); b.updateMatrixWorld(true); }
  function ik(R, a, b2, c2, tgt, pole) { var T = T3(), gm = new T.Matrix4().copy(R.cm.matrixWorld).invert(), S = R.B[a].getWorldPosition(new T.Vector3()).applyMatrix4(gm), A = R.len[a], Bl = R.len[b2], d = tgt.clone().sub(S), L = Math.min(A + Bl - 1e-3, Math.max(.05, d.length())); d.normalize();
    var x = (A * A - Bl * Bl + L * L) / (2 * L), h = Math.sqrt(Math.max(0, A * A - x * x)), pp = pole.clone().sub(d.clone().multiplyScalar(pole.dot(d))).normalize(), E = S.clone().add(d.clone().multiplyScalar(x)).add(pp.multiplyScalar(h)), H = S.clone().add(d.clone().multiplyScalar(L));
    setDir(R, a, E.clone().sub(S)); setDir(R, b2, H.sub(E)); setDir(R, c2, null); }
  window.MOTORIDE = function (c, moto, k, lean, steer) { var T = T3(); if (!c.cm) return false; var R = rig(c); if (!R) return false;
    var mx = c.cmMix; if (mx) mx.stopAllAction(); c.cmMix = null; c.cmMixR = c.cmMixR || mx; R.sk.bones.forEach(function (b, i) { b.quaternion.copy(R.L0[i][0]); b.position.copy(R.L0[i][1]); });
    c.cm.updateMatrixWorld(true); var gm = new T.Matrix4().copy(c.cm.matrixWorld).invert(), loc = function (o) { return o.getWorldPosition(new T.Vector3()).applyMatrix4(gm); };
    var fz = R.fz, gA = loc(moto.userData.gA), gB = loc(moto.userData.gB), pA = loc(moto.userData.pA), pB = loc(moto.userData.pB), s = R.side, e = k * k * (3 - 2 * k);
    var hL = (gA.x * s > 0 ? gA : gB), hR = (gA.x * s > 0 ? gB : gA), fL = (pA.x * s > 0 ? pA : pB), fR = (pA.x * s > 0 ? pB : pA);
    var L = (.95 + (lean || 0)) * e; [['Spine', .45], ['Spine1', .3], ['Spine2', .25]].forEach(function (q) { setDir(R, q[0], new T.Vector3(0, Math.cos(L * (q[1] + .55)), fz * Math.sin(L * (q[1] + .55)))); });
    setDir(R, 'Neck', new T.Vector3(0, 1, fz * .25 * e)); setDir(R, 'Head', null, new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), -(steer || 0) * .35));
    var gq = new T.Quaternion(); R.cm.getWorldQuaternion(gq);
    /* montée : la jambe extérieure passe par-dessus la selle (arc), les mains vont aux poignées */
    var stand = function (sd) { return new T.Vector3(sd * .14, R.footY + .05, fz * .05); }, lift = Math.sin(Math.min(1, k * 1.25) * Math.PI) * .55;
    var tfL = stand(s).lerp(fL, e), tfR = stand(-s).lerp(fR, e); tfR.y += lift; tfR.x -= s * lift * .25;
    var hk = Math.min(1, k * 1.6), rest = function (sd) { return new T.Vector3(sd * .3, R.pelY - .05, fz * .08); };
    ik(R, 'L_UpperArm', 'L_Forearm', 'L_Hand', rest(s).lerp(hL, hk), new T.Vector3(s * .7, -.55, -fz * .35)); ik(R, 'R_UpperArm', 'R_Forearm', 'R_Hand', rest(-s).lerp(hR, hk), new T.Vector3(-s * .7, -.55, -fz * .35));
    ik(R, 'L_Thigh', 'L_Calf', 'L_Foot', tfL, new T.Vector3(s * .25, .2, fz)); ik(R, 'R_Thigh', 'R_Calf', 'R_Foot', tfR, new T.Vector3(-s * .25, .2, fz));
    return true; };
  /* CITADINS RÉALISTES ARMÉS (Wald City…) : les 2 bras viennent tenir l'arme devant la poitrine (IK sur les os Bip01) et l'arme est collée dans la main droite,
     tournée vers où le perso vise (pitch). Appelé après l'animation (mixer) à chaque image. */
  var QA = null;
  window.REALAIM = function (c, pitch) { var T = T3(); if (!c.cm || !c.gunHold) return false; var R = rig(c); if (!R || !R.B.R_Hand) return false;
    c.cm.updateMatrixWorld(true); var gm = new T.Matrix4().copy(c.cm.matrixWorld).invert(), P = function (b) { return b.getWorldPosition(new T.Vector3()).applyMatrix4(gm); };
    var sL = P(R.B.L_UpperArm), sR = P(R.B.R_UpperArm), C0 = sL.clone().add(sR).multiplyScalar(.5), side = Math.sign(sR.x - sL.x) || -1, pc = Math.max(-1.1, Math.min(1.1, pitch || 0));
    var fw = new T.Vector3(0, Math.sin(pc), Math.cos(pc)), up = new T.Vector3(0, Math.cos(pc), -Math.sin(pc));
    var hR = C0.clone().add(fw.clone().multiplyScalar(.36)).add(up.clone().multiplyScalar(-.1)).add(new T.Vector3(side * .07, 0, 0)), hL = C0.clone().add(fw.clone().multiplyScalar(.6)).add(up.clone().multiplyScalar(-.06)).add(new T.Vector3(-side * .02, 0, 0));
    ik(R, 'R_UpperArm', 'R_Forearm', 'R_Hand', hR, new T.Vector3(side * .8, -.6, -.2)); ik(R, 'L_UpperArm', 'L_Forearm', 'L_Hand', hL, new T.Vector3(-side * .8, -.6, -.2));
    /* l'arme : dans la main droite, canon vers l'avant du perso + pitch */
    var gh = c.gunHold; if (!gh.userData.par0) gh.userData.par0 = gh.parent; if (gh.parent !== c.root) c.root.add(gh);   /* l'arme était accrochée au squelette du perso du jeu (caché) → elle était invisible */
    var par = gh.parent; var wp = R.B.R_Hand.getWorldPosition(new T.Vector3()); par.updateMatrixWorld(true); gh.position.copy(par.worldToLocal(wp.clone()));
    var rq = new T.Quaternion(); c.root.getWorldQuaternion(rq); var qw = rq.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 0, 1), pc)), pq = new T.Quaternion(); par.getWorldQuaternion(pq); gh.quaternion.copy(pq.invert().multiply(qw));
    var ws = new T.Vector3(); par.getWorldScale(ws); var rs = new T.Vector3(); c.root.getWorldScale(rs); gh.scale.setScalar(rs.x / (ws.x || 1)); return true; };
  window.MOTOOFF = function (c) { if (!c || !c.cmMixR) return; c.cmMix = c.cmMixR; c.cmMixR = null; if (c.cmA) { c.cmCur = 'idle'; if (c.cmA.idle) c.cmA.idle.reset().play(); } if (c.cm) c.cm.position.set(0, 0, 0); };
})();
