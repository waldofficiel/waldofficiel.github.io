/* Wald Royal : FAUNE du mode SURVIE (window.FAUNE) — animaux, viande, loups à apprivoiser, événements.
   - Animaux en vrais modèles 3D animés : loup, taureau, vache, lama, renard, biche, cerf. Ils se promènent, fuient ou attaquent.
   - Viande (seulement en Survie) : on la récupère sur les animaux, on la mange (V ou bouton 🍖) = +20 PV.
   - LOUP : donne-lui de la viande (touche Interagir près de lui) → 1 chance sur 3 qu'il devienne TON loup :
     il te suit, attaque les créatures autour de toi, s'assoit / te suit quand tu interagis avec lui. Sauvegardé.
   - Événements : Lune des loups, Pluie d'étoiles filantes (métal), Troupeau migrateur, Ravitaillement du ciel. */
(function () {
  var T, C, X, ON = false, L = [], MAT = {}, GB = null, SAVE = { meat: 0, tamed: 0, names: [] }, SPAWNT = 0, EVT = null, EVTT = 90, UI = null, LAST = 0;
  /* modèles 3D animés Quaternius « Ultimate Animated Animals » (CC0) dans models/animaux/ : arrondis, 12 animations chacun */
  var K = {
    loup: { n: 'Loup', f: 'Wolf', hgt: .95, hp: 70, walk: 1.6, run: 7.2, dmg: 9, meat: 1, mode: 'neutre', fur: .05 },
    taureau: { n: 'Taureau', f: 'Bull', hgt: 1.55, hp: 120, walk: 1.2, run: 6.5, dmg: 14, meat: 3, mode: 'hostile', fur: .018 },
    vache: { n: 'Vache', f: 'Cow', hgt: 1.45, hp: 60, walk: 1, run: 4.2, meat: 3, mode: 'passif', fur: .014 },
    lama: { n: 'Lama', f: 'Alpaca', hgt: 1.7, hp: 45, walk: 1.1, run: 5, meat: 2, mode: 'passif', fur: .06 },
    renard: { n: 'Renard', f: 'Fox', hgt: .55, hp: 20, walk: 1.5, run: 7.5, meat: 1, mode: 'passif', fur: .055 },
    biche: { n: 'Biche', f: 'Deer', hgt: 1.35, hp: 45, walk: 1.3, run: 8.5, meat: 2, mode: 'passif', fur: .022 },
    cerf: { n: 'Cerf', f: 'Stag', hgt: 1.9, hp: 70, walk: 1.4, run: 8.5, meat: 3, mode: 'passif', fur: .022 }
  };
  var WEIGHT = [['renard', 3], ['vache', 3], ['lama', 2], ['biche', 3], ['cerf', 2], ['loup', 3], ['taureau', 2]];
  var TPLS = {}, LOADQ = false;
  function mat(c) { return MAT[c] || (MAT[c] = new T.MeshLambertMaterial({ color: c })); }
  function box(par, w, h, d, x, y, z, c) { var m = new T.Mesh(GB, mat(c)); m.scale.set(w, h, d); m.position.set(x, y, z); m.castShadow = true; par.add(m); return m; }
  /* ===== FOURRURE (animaux plus beaux) : normales lissées, couleur nuancée, et couches de poils (« shells ») qui suivent les os ===== */
  var FURV = 'uniform float uSh;\nvarying vec3 vB;\n', FURF = 'uniform float uLv,uFq,uBase;\nvarying vec3 vB;\nfloat fh(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}\nfloat fn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(fh(i),fh(i+vec3(1,0,0)),f.x),mix(fh(i+vec3(0,1,0)),fh(i+vec3(1,1,0)),f.x),f.y),mix(mix(fh(i+vec3(0,0,1)),fh(i+vec3(1,0,1)),f.x),mix(fh(i+vec3(0,1,1)),fh(i+vec3(1,1,1)),f.x),f.y),f.z);}\n';
  function smoothN(g) { var p = g.attributes.position, n = g.attributes.normal; if (!n) { g.computeVertexNormals(); n = g.attributes.normal; } var map = {}, i, k;
    for (i = 0; i < p.count; i++) { k = Math.round(p.getX(i) * 2000) + '_' + Math.round(p.getY(i) * 2000) + '_' + Math.round(p.getZ(i) * 2000); var a = map[k] || (map[k] = [0, 0, 0, []]); a[0] += n.getX(i); a[1] += n.getY(i); a[2] += n.getZ(i); a[3].push(i); }
    Object.keys(map).forEach(function (kk) { var a = map[kk], l = Math.hypot(a[0], a[1], a[2]) || 1; a[3].forEach(function (j) { n.setXYZ(j, a[0] / l, a[1] / l, a[2] / l); }); }); n.needsUpdate = true; }
  function furBase(m, hb) { var nm = new T.MeshStandardMaterial({ color: m.color.clone(), roughness: .92, metalness: 0, skinning: true }); nm.name = m.name;
    if (/Eye/i.test(m.name)) { nm.roughness = .08; nm.color.setRGB(.01, .01, .012); return nm; } if (/Nose|Horn|Hoof|Antler/i.test(m.name)) { nm.roughness = .55; return nm; }
    var fq = 1 / (hb * .05); nm.onBeforeCompile = function (sh) { sh.uniforms.uLv = { value: 0 }; sh.uniforms.uFq = { value: fq }; sh.uniforms.uBase = { value: 1 };
      sh.vertexShader = FURV + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvB = position;');
      sh.fragmentShader = FURF + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\nfloat q1=fn(vB*uFq),q2=fn(vB*uFq*4.7);diffuseColor.rgb*=.78+.3*q1+.14*q2;'); };
    nm.customProgramCacheKey = function () { return 'furB'; }; return nm; }
  function hbL(q) { if (!q.geometry.boundingBox) q.geometry.computeBoundingBox(); var b = q.geometry.boundingBox; return Math.max(b.max.y - b.min.y, b.max.z - b.min.z, b.max.x - b.min.x) * .6; }
  function prepFur(o, hb) { o.traverse(function (q) { if (!q.isSkinnedMesh) return; smoothN(q.geometry); hb = hbL(q); var ms = Array.isArray(q.material) ? q.material : [q.material]; ms = ms.map(function (m) { return furBase(m, hb); }); q.material = Array.isArray(q.material) ? ms : ms[0]; }); }
  var HIDEM = null;
  function furShells(o, D, hb) { var N = window.SET && SET.gfx >= 2 ? 7 : window.SET && SET.gfx === 0 ? 0 : 4; if (!N || !D.fur) return; if (!HIDEM) { HIDEM = new T.MeshBasicMaterial({ skinning: true }); HIDEM.visible = false; }
    var list = []; o.traverse(function (q) { if (q.isSkinnedMesh && !q.userData.shell) list.push(q); });
    list.forEach(function (q) { var hb = hbL(q), ms = Array.isArray(q.material) ? q.material : [q.material], fq = 1 / (hb * .016), len = hb * D.fur;
      for (var i = 1; i <= N; i++) { var lv = i / N, sm = ms.map(function (m) { if (/Eye|Nose|Horn|Hoof|Antler/i.test(m.name)) return HIDEM; var nm = new T.MeshStandardMaterial({ color: m.color.clone(), roughness: 1, metalness: 0, skinning: true });
          nm.onBeforeCompile = function (sh) { sh.uniforms.uSh = { value: len * lv }; sh.uniforms.uLv = { value: lv }; sh.uniforms.uFq = { value: fq }; sh.uniforms.uBase = { value: 0 };
            sh.vertexShader = FURV + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvB = position;').replace('#include <skinning_vertex>', '#include <skinning_vertex>\ntransformed += normalize(objectNormal) * uSh;');
            sh.fragmentShader = FURF + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\nvec3 cp=vB*uFq; vec3 ce=floor(cp); float hr=fh(ce); vec3 fc=fract(cp)-.5; float rd=length(fc.xz+fc.y*.2); if(hr<uLv*.8||rd>.62*(1.-uLv*.55)) discard; float q1=fn(vB*uFq*.13); diffuseColor.rgb*=(.55+.5*uLv)*(.8+.35*q1);'); };
          nm.customProgramCacheKey = function () { return 'furS'; }; return nm; });
        var sh2 = new T.SkinnedMesh(q.geometry, Array.isArray(q.material) ? sm : sm[0]); sh2.userData.shell = 1; sh2.castShadow = false; sh2.frustumCulled = false; q.parent.add(sh2); sh2.position.copy(q.position); sh2.quaternion.copy(q.quaternion); sh2.scale.copy(q.scale); sh2.bind(q.skeleton, q.bindMatrix); } }); }
  function loadAll() { if (LOADQ || !T.GLTFLoader) return; LOADQ = true; var L = new T.GLTFLoader(), keys = Object.keys(K), i = 0;
    (function next() { if (i >= keys.length) return; var k = keys[i++], D = K[k]; L.load('models/animaux/' + D.f + '.glb', function (g) { var o = g.scene; o.updateMatrixWorld(true); var bb = new T.Box3();
        o.traverse(function (q) { if (q.isMesh) { q.geometry.computeBoundingBox(); bb.union(q.geometry.boundingBox.clone().applyMatrix4(q.matrixWorld)); q.castShadow = true; q.frustumCulled = false; } });
        var sz = bb.getSize(new T.Vector3()), sc = D.hgt / Math.max(.01, sz.y); var A = {}; g.animations.forEach(function (c) { A[c.name.split('|').pop()] = c; });
        prepFur(o, sz.y); TPLS[k] = { scene: o, sc: sc, hb: sz.y, r: Math.max(sz.x, sz.z) * sc * .33, len: sz.z * sc, A: A }; next(); }, undefined, function () { next(); }); })(); }
  function model(k, tame) { var tp = TPLS[k]; if (!tp || !window.THREE.SkeletonUtils) return null; var D = K[k], o = THREE.SkeletonUtils.clone(tp.scene), R = new T.Group(); o.scale.setScalar(tp.sc); R.add(o);
    var mx = new T.AnimationMixer(o), act = {}; ['Walk', 'Gallop', 'Idle', 'Idle_2', 'Eating', 'Attack', 'Attack_Headbutt', 'Death', 'Idle_2_HeadLow', 'Idle_Headlow', 'Idle_HitReact1'].forEach(function (n) { if (tp.A[n]) act[n] = mx.clipAction(tp.A[n]); });
    if (act.Death) { act.Death.setLoop(T.LoopOnce); act.Death.clampWhenFinished = true; } ['Attack', 'Attack_Headbutt', 'Idle_HitReact1'].forEach(function (n) { if (act[n]) { act[n].setLoop(T.LoopOnce); act[n].clampWhenFinished = false; } });
    if (tame) { var nb = null; o.traverse(function (b) { if (b.isBone && /^Neck2$|^Neck$/.test(b.name)) nb = b; }); if (nb) { o.updateMatrixWorld(true); var ws = nb.getWorldScale(new T.Vector3()).x || 1, col = new T.Mesh(new T.TorusGeometry(.13, .03, 6, 14), mat('#e0202a')); col.scale.setScalar(1 / ws); col.rotation.y = Math.PI / 2; nb.add(col);
        var tag = new T.Mesh(new T.SphereGeometry(.035, 8, 6), mat('#ffd23d')); tag.position.set(0, -.14, 0); col.add(tag); } }
    C.scene.add(R); var m = { root: R, mx: mx, act: act, cur: null, h: D.hgt, r: tp.r, len: tp.len }; play(m, 'Idle'); return m; }
  function play(m, n, fade) { var a = m.act[n] || (n === 'Attack' ? m.act.Attack_Headbutt : n === 'Idle_2_HeadLow' ? m.act.Idle_Headlow : null) || m.act.Idle; if (!a || m.cur === a) return; a.reset().fadeIn(fade || .2).play(); if (m.cur) m.cur.fadeOut(fade || .2); m.cur = a; }
  function free(a) { if (a.m) { C.scene.remove(a.m.root); a.m = null; } }
  function pick() { var night = C.isNight && C.isNight(), tot = 0; WEIGHT.forEach(function (w) { tot += w[1] * (night && w[0] === 'loup' ? 2.5 : 1); }); var r = Math.random() * tot;
    for (var i = 0; i < WEIGHT.length; i++) { r -= WEIGHT[i][1] * (night && WEIGHT[i][0] === 'loup' ? 2.5 : 1); if (r <= 0) return WEIGHT[i][0]; } return 'lapin'; }
  function spot(P, d0, d1) { for (var t = 0; t < 8; t++) { var a = Math.random() * 6.283, d = d0 + Math.random() * (d1 - d0), x = P.x + Math.cos(a) * d, z = P.z + Math.sin(a) * d;
      if (C.inLake && C.inLake(x, z, 0)) continue; if (C.onLand && !C.onLand(x, z)) continue; var y = C.hgt(x, z); if (y < -.5) continue; return { x: x, z: z, y: y }; } return null; }
  function spawn(k, x, z, o) { var D = K[k]; var a = { k: k, x: x, z: z, y: C.hgt(x, z), a: Math.random() * 6.283, hp: D.hp, st: 'idle', t: 0, wx: x, wz: z, ph: Math.random() * 6, atk: 0, m: null, tame: false, sit: false, ang: 0, flash: 0 };
    if (o) Object.assign(a, o); L.push(a); return a; }
  function gy(x, z, y) { var g = C.hgt(x, z); if (X.groundAt) g = Math.max(g, X.groundAt(x, z, y + .6)); return g; }
  function save() { try { localStorage.setItem('wr_faune', JSON.stringify(SAVE)); } catch (e) {} uiDraw(); }
  function load() { try { var s = JSON.parse(localStorage.getItem('wr_faune') || 'null'); if (s) SAVE = Object.assign(SAVE, s); } catch (e) {} }
  function tamedSpawn() { var P = C.me(); L.filter(function (a) { return a.tame; }).forEach(function (a) { free(a); a.dead = true; }); L = L.filter(function (a) { return !a.dead; });
    for (var i = 0; i < Math.min(6, SAVE.tamed); i++) spawn('loup', P.x + Math.cos(i * 1.7) * 3, P.z + Math.sin(i * 1.7) * 3, { tame: true, name: SAVE.names[i] || 'Loup ' + (i + 1) }); }
  function hearts(x, y, z, ok) { C.burst(x, y, z, ok ? 14 : 8, ok ? ['#ff3a6a', '#ff7a9a', '#ffd0dc'] : ['#bbbbbb', '#888888', '#eeeeee'], ok ? 3 : 2, .18, .8); }
  function uiInit() { var b = document.createElement('button'); b.type = 'button'; b.id = 'fMeat'; b.style.cssText = 'position:fixed;left:calc(10px + env(safe-area-inset-left,0px));bottom:calc(150px + env(safe-area-inset-bottom,0px));z-index:22;font:900 13px Inter,system-ui,sans-serif;color:#fff;background:linear-gradient(180deg,#7a2a1a,#3a1208);border:2px solid #ff9a5a;border-radius:12px;padding:7px 10px;box-shadow:0 0 14px rgba(255,120,60,.45);cursor:pointer';
    b.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); eat(); }); document.body.appendChild(b); UI = b; uiDraw(); }
  function uiDraw() { if (!UI) return; UI.hidden = !ON; UI.innerHTML = '🍖 ' + SAVE.meat + (C.isTouch ? '' : ' <small style="opacity:.7">(N)</small>') + (SAVE.tamed ? ' · 🐺 ' + SAVE.tamed : ''); UI.style.opacity = SAVE.meat ? 1 : .6; }
  function eat() { var P = C.me(); if (!ON || !P.alive) return; if (!SAVE.meat) { C.toast('🍖 PAS DE VIANDE · chasse des animaux'); return; } if (P.hp >= 100) { C.toast('❤️ TU AS DÉJÀ TOUTE TA VIE'); return; }
    SAVE.meat--; P.hp = Math.min(100, P.hp + 20); C.tone('triangle', 300, 520, .12, .07); C.toast('🍖 MIAM · +20 PV'); if (C.hudRefresh) C.hudRefresh(); save(); }
  function die(a, by) { a.dead = true; a.dtT = 0; var D = K[a.k]; if (a.tame) { SAVE.tamed = Math.max(0, SAVE.tamed - 1); var ni = SAVE.names.indexOf(a.name); if (ni >= 0) SAVE.names.splice(ni, 1); C.toast('💔 ' + a.name.toUpperCase() + ' EST MORT'); save(); return; }
    if (by === C.me()) { SAVE.meat = Math.min(99, SAVE.meat + D.meat); C.toast('🍖 +' + D.meat + ' VIANDE (' + D.n + ')'); C.tone('triangle', 520, 780, .1, .06); save(); } }
  function nearestZ(x, z, r) { if (!window.ZOMB || !ZOMB.on) return null; var n = ZOMB.nearest(x, z); return n && n.d < r ? n.z : null; }
  function event(kind) { var P = C.me(); EVT = { k: kind, t: 0 };
    if (kind === 'lune') { C.toast('🌕🐺 LUNE DES LOUPS · une meute te chasse cette nuit !'); for (var i = 0; i < 5; i++) { var s = spot(P, 30, 45); if (s) spawn('loup', s.x, s.z, { st: 'chase', angry: 40 }); } C.tone('sawtooth', 220, 440, 1.4, .08); }
    if (kind === 'etoiles') { C.toast('🌠 PLUIE D\'ÉTOILES FILANTES · va ramasser le métal où elles tombent !'); EVT.n = 6; EVT.next = 0; }
    if (kind === 'troupeau') { C.toast('🦌 UN TROUPEAU DE CERFS PASSE PRÈS DE TOI · de la viande en vue !'); var s2 = spot(P, 35, 50); if (s2) for (var j = 0; j < 7; j++) spawn(j % 3 ? 'biche' : 'cerf', s2.x + (Math.random() - .5) * 8, s2.z + (Math.random() - .5) * 8, { herd: { x: P.x * 2 - s2.x, z: P.z * 2 - s2.z } }); }
    if (kind === 'ravito') { var s3 = spot(P, 18, 30); if (!s3) return; C.toast('📦 RAVITAILLEMENT DU CIEL · il tombe à ' + Math.round(Math.hypot(s3.x - P.x, s3.z - P.z)) + ' m !'); EVT.box = s3; EVT.y = s3.y + 60;
      var g = new T.Group(); box(g, 1.2, 1.2, 1.2, 0, .6, 0, '#3a8aff'); box(g, 1.25, .2, 1.25, 0, .6, 0, '#ffd23d'); box(g, .2, 1.25, 1.25, 0, .6, 0, '#ffd23d'); var para = new T.Mesh(new T.SphereGeometry(1.6, 12, 6, 0, 6.283, 0, 1.4), mat('#ff3a8a')); para.position.y = 3.4; g.add(para); EVT.para = para; g.position.set(s3.x, EVT.y, s3.z); C.scene.add(g); EVT.g = g; } }
  function eventTick(dt) { var P = C.me(); EVTT -= dt;
    if (!EVT && EVTT <= 0) { EVTT = 150 + Math.random() * 120; var night = C.isNight && C.isNight(), L2 = night ? ['lune', 'etoiles', 'ravito'] : ['troupeau', 'ravito', 'troupeau']; event(L2[Math.random() * L2.length | 0]); return; }
    if (!EVT) return; EVT.t += dt;
    if (EVT.k === 'etoiles') { EVT.next -= dt; if (EVT.next <= 0 && EVT.n > 0) { EVT.n--; EVT.next = 4 + Math.random() * 4; var s = spot(P, 12, 40); if (s) { C.burst(s.x, s.y + 1, s.z, 26, ['#ffffff', '#9ad8ff', '#ffd23d'], 7, .3, 1.2); C.noise(.6, .3, 200); C.tone('sawtooth', 900, 120, .8, .07); if (X.give) X.give('metal', 12 + (Math.random() * 10 | 0), s.x, s.y, s.z, true); } } if (EVT.n <= 0 && EVT.next <= 0) EVT = null; }
    else if (EVT.k === 'ravito') { if (EVT.g) { EVT.y = Math.max(EVT.box.y, EVT.y - dt * 4); EVT.g.position.y = EVT.y; EVT.g.rotation.y += dt * .4; if (EVT.y <= EVT.box.y + .01 && EVT.para) { EVT.g.remove(EVT.para); EVT.para = null; C.noise(.3, .2, 300); }
        if (!EVT.para && Math.hypot(P.x - EVT.box.x, P.z - EVT.box.z) < 2.2) { C.scene.remove(EVT.g); EVT.g = null; SAVE.meat += 4; save(); if (C.dropItem && C.randWeapon) { for (var i = 0; i < 2; i++) C.dropItem(EVT.box.x + i - .5, EVT.box.z + .8, C.randWeapon()); } if (X.give) { X.give('metal', 30, EVT.box.x, EVT.box.y, EVT.box.z, true); X.give('pierre', 30, EVT.box.x, EVT.box.y, EVT.box.z, true); } C.toast('📦 RAVITAILLEMENT : armes, 4 viandes, métal et pierre !'); C.tone('triangle', 520, 1040, .3, .08); EVT = null; } } else EVT = null;
      if (EVT && EVT.t > 240) { if (EVT.g) C.scene.remove(EVT.g); EVT = null; } }
    else if (EVT.t > 60) EVT = null; }
  function tick(a, dt, P, now, night) { var D = K[a.k], d = Math.hypot(a.x - P.x, a.z - P.z), spd = 0, tx = a.x, tz = a.z;
    if (a.dead) { if (a.m) { a.dtT += dt; play(a.m, 'Death', .1); a.m.mx.update(dt); a.m.root.position.y = a.y - Math.max(0, a.dtT - 3) * .4; if (a.dtT > 5) free(a); } return; }
    if (!a.tame && d > 170) { free(a); a.gone = true; return; }
    if (a.atk > 0) a.atk -= dt; if (a.angry > 0) a.angry -= dt; if (a.flee > 0) a.flee -= dt; a.t -= dt;
    if (a.tame) { var z = nearestZ(P.x, P.z, 16);
      if (d > 45) { a.x = P.x - Math.cos(P.a || 0) * 2; a.z = P.z - Math.sin(P.a || 0) * 2; a.y = gy(a.x, a.z, P.y); }
      if (z && !a.sit) { tx = z.x; tz = z.z; var dz2 = Math.hypot(z.x - a.x, z.z - a.z); spd = dz2 > 1.4 ? D.run : 0; if (dz2 < 1.8 && a.atk <= 0) { a.atk = .8; ZOMB.hurt(z, 16, null); C.tone('square', 260, 140, .08, .05); a.bite = .25; } }
      else if (!a.sit && d > 4) { tx = P.x; tz = P.z; spd = d > 9 ? D.run : D.walk * 2; } }
    else if (a.angry > 0 || (D.mode === 'hostile' && d < 9 && P.alive) || a.st === 'chase') { if (!P.alive || d > 40) { a.st = 'idle'; a.angry = 0; } else { tx = P.x; tz = P.z; spd = d < 1.3 ? 0 : D.run * (night ? 1.1 : 1);
        if (d < 1.7 && Math.abs(P.y - a.y) < 1.6 && a.atk <= 0) { a.atk = 1; a.bite = .25; C.hurt(P, D.dmg || 8); C.tone('square', 200, 110, .1, .06); } } }
    else if (a.flee > 0) { var fx = a.x - P.x, fz = a.z - P.z, fl = Math.hypot(fx, fz) || 1; tx = a.x + fx / fl * 10; tz = a.z + fz / fl * 10; spd = D.run; }
    else if (a.herd) { tx = a.herd.x; tz = a.herd.z; spd = D.walk * 2.2; if (Math.hypot(tx - a.x, tz - a.z) < 4) a.herd = null; }
    else { if (a.t <= 0) { a.t = 2 + Math.random() * 5; if (Math.random() < .6) { var ra = Math.random() * 6.283, rr = 3 + Math.random() * 9; a.wx = a.x + Math.cos(ra) * rr; a.wz = a.z + Math.sin(ra) * rr; } else { a.wx = a.x; a.wz = a.z; } }
      tx = a.wx; tz = a.wz; spd = Math.hypot(tx - a.x, tz - a.z) > .6 ? D.walk : 0; }
    if (spd > 0) { var dx = tx - a.x, dz = tz - a.z, l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; var ta = Math.atan2(dz, dx), da = ((ta - a.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI; a.a += da * Math.min(1, dt * 7);
      var nx = a.x + Math.cos(a.a) * spd * dt, nz = a.z + Math.sin(a.a) * spd * dt; if (!(C.inLake && C.inLake(nx, nz, 0))) { a.x = nx; a.z = nz; if (d < 60 && C.pushCircle) { var o = { x: a.x, z: a.z, y: a.y, vx: 0, vz: 0 }; C.pushCircle(o, .35); a.x = o.x; a.z = o.z; } } else a.t = 0; }
    a.spd = spd; var g = gy(a.x, a.z, a.y); a.y += (g - a.y) * Math.min(1, dt * 12);
    if (d < 95 && !a.m) a.m = model(a.k, a.tame); else if (d > 110 && a.m && !a.tame) free(a);
    if (a.m) { var m = a.m; m.root.position.set(a.x, a.y, a.z); m.root.rotation.set(0, Math.PI / 2 - a.a, 0);
      if (a.bite > 0) { a.bite -= dt; play(m, 'Attack', .1); } else if (a.sit) play(m, 'Idle_2_HeadLow'); else if (spd > D.walk * 1.6) play(m, 'Gallop'); else if (spd > 0) play(m, 'Walk'); else if (a.graze) play(m, 'Eating', .4); else play(m, 'Idle', .4);
      if (spd === 0 && a.t > 0 && !a.tame && D.mode === 'passif' && a.grazeT !== a.t) { a.grazeT = a.t; a.graze = Math.random() < .5; } if (spd > 0) a.graze = false;
      if (m.cur) m.cur.timeScale = spd > D.walk * 1.6 ? Math.min(1.6, spd / D.run * 1.2) : spd > 0 ? Math.max(.6, spd / D.walk * .9) : 1;
      if (d < 70 || a.tame) m.mx.update(dt); else if ((a.lod = (a.lod || 0) + dt) > .2) { m.mx.update(a.lod); a.lod = 0; }
      if (a.flash > 0) { a.flash -= dt; m.root.visible = Math.sin(now * 60) > -.3; } else m.root.visible = true; } }
  window.FAUNE = {
    _demo: function (TT, sc) { if (!T) T = TT; loadAll(); var keys = Object.keys(K); if (!keys.every(function (k) { return TPLS[k]; })) return null; var c0 = C; C = { scene: sc }; var out = keys.map(function (k) { var m = model(k); m.k = k; return m; }); C = c0; return out; },
    on: false,
    init: function (THREE, ctx, extra) { T = THREE; C = ctx; X = extra || {}; GB = new T.BoxGeometry(1, 1, 1); load(); loadAll(); ON = this.on = true; uiInit(); setTimeout(tamedSpawn, 1500);
      addEventListener('keydown', function (e) { if (e.code === 'KeyN' && !e.repeat && C.state() === 'play' && !(e.target && /INPUT|TEXTAREA/.test(e.target.tagName))) eat(); }); },
    update: function (dt) { if (!ON) return; var P = C.me(); if (!P) return; var now = performance.now() / 1000, night = C.isNight && C.isNight();
      if ((SPAWNT -= dt) <= 0) { SPAWNT = 2; var wild = L.filter(function (a) { return !a.tame && !a.dead; }).length; if (wild < (night ? 18 : 14)) { var s = spot(P, 45, 110); if (s) { var k = pick(), n = k === 'loup' ? 2 + (Math.random() * 2 | 0) : k === 'vache' || k === 'lama' || k === 'biche' ? 2 : 1;
          for (var i = 0; i < n; i++) spawn(k, s.x + (Math.random() - .5) * 5, s.z + (Math.random() - .5) * 5, { pack: k === 'loup' ? s : null }); } } L = L.filter(function (a) { return !a.gone && !(a.dead && !a.m); }); }
      for (var i = 0; i < L.length; i++) tick(L[i], dt, P, now, night);
      if (C.state() === 'play') eventTick(dt);
      if (now - LAST > 1) { LAST = now; uiDraw(); } },
    ray: function (ox, oy, oz, dx, dy, dz, maxT, fat) { var best = null, bt = maxT, f = fat || 0;
      for (var i = 0; i < L.length; i++) { var a = L[i]; if (a.dead || !a.m || a.tame || Math.abs(a.x - ox) > maxT + 2 || Math.abs(a.z - oz) > maxT + 2) continue; var r = a.m.r + f, h = a.m.h;
        var t = C.rayBox(ox, oy, oz, dx, dy, dz, a.x - r, a.y, a.z - r, a.x + r, a.y + h + f * .5, a.z + r); if (t < bt) { bt = t; best = { t: t, kind: 'faune', o: a, head: false }; } }
      return best; },
    hurt: function (a, d, by) { if (a.dead || a.tame) return; a.hp -= d; a.flash = .2; var D = K[a.k];
      if (a.m) play(a.m, 'Idle_HitReact1', .05); if (D.mode === 'passif') a.flee = 6; else { a.angry = 25; a.st = 'chase'; if (a.k === 'loup') L.forEach(function (b) { if (b.k === 'loup' && !b.tame && !b.dead && Math.hypot(b.x - a.x, b.z - a.z) < 15) { b.angry = 25; b.st = 'chase'; } }); }   /* toute la meute s'énerve */
      if (a.hp <= 0) die(a, by); else C.tone('square', 420, 300, .05, .04); },
    melee: function (x, y, z0, fx, fz, range, dmg) { var best = null, bd = range; L.forEach(function (a) { if (a.dead || a.tame) return; var dx = a.x - x, dz = a.z - z0, d = Math.hypot(dx, dz); if (d > bd || Math.abs(a.y - y) > 2) return; if ((dx * fx + dz * fz) / (d || 1) < .3) return; bd = d; best = a; });
      if (best) { this.hurt(best, dmg, C.me()); C.burst(best.x, best.y + .6, best.z, 6, ['#c8202a', '#7a1010'], 3, .12, .4); C.dmgNum(best.x, best.y + 1, best.z, dmg, false, false); } return best; },
    act: function () { var P = C.me(), best = null, bd = 3.2; L.forEach(function (a) { if (a.dead || a.k !== 'loup') return; var d = Math.hypot(a.x - P.x, a.z - P.z); if (d < bd) { bd = d; best = a; } }); if (!best) return false;
      if (best.tame) { best.sit = !best.sit; C.toast(best.sit ? '🐺 ' + best.name.toUpperCase() + ' S\'ASSOIT ET T\'ATTEND' : '🐺 ' + best.name.toUpperCase() + ' TE SUIT'); return true; }
      if (best.angry > 0) { C.toast('🐺 IL EST EN COLÈRE · calme-le d\'abord (éloigne-toi)'); return true; }
      if (!SAVE.meat) { C.toast('🐺 DONNE-LUI DE LA VIANDE POUR L\'APPRIVOISER · chasse des animaux'); return true; }
      SAVE.meat--; if (Math.random() < .34) { free(best); best.tame = true; best.sit = false; best.name = 'Loup ' + (SAVE.tamed + 1); SAVE.tamed++; SAVE.names.push(best.name); hearts(best.x, best.y + 1, best.z, true); C.tone('triangle', 600, 1200, .4, .08); C.toast('❤️ ' + best.name.toUpperCase() + ' EST À TOI ! Il te suit et te défend · Interagir = assis / suis-moi'); }
      else { hearts(best.x, best.y + 1, best.z, false); C.toast('🍖 IL A MANGÉ… réessaie (il te reste ' + SAVE.meat + ' viande' + (SAVE.meat > 1 ? 's' : '') + ')'); }
      save(); return true; },
    meat: function () { return SAVE.meat; }, eat: eat, list: function () { return L; }, event: event
  };
})();
