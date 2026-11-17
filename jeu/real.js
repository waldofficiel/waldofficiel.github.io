/* ===== PERSONNAGES RÉALISTES (Wald City, CS WILD GO, PNJ du Créatif) =====
   Modèles humains réalistes animés (Mixamo, Adobe : utilisation libre dans un projet, voir models/real/LICENSE.txt) :
   soldier.glb (combattant en tenue tactique, animations Idle / Walk / Run) et michelle.glb (civile ; elle prend les animations du soldat,
   même squelette « mixamorig »). À partir de ces 2 corps, REAL.VARS fabrique 10 PERSONNES différentes du même style :
   couleur des vêtements, couleur de peau, taille / carrure, casquette, lunettes de soleil (textures recolorées pixel par pixel).
   REAL.apply(c, 'v3') = personne n°3 ; REAL.add('perso', gltf) = modèle importé par un joueur (PNJ du Créatif).
   Pendant le téléchargement : petite barre « ⬇ TÉLÉCHARGEMENT » en haut de l'écran, comme les contenus en plus des gros jeux. */
(function () {
  var T = null, G = {}, WAIT = [], LOADING = false, PROG = {}, VTEX = {};
  function ui(p) { var d = document.getElementById('realDL'); if (p >= 1) { if (d) d.remove(); return; }
    if (!d) { d = document.createElement('div'); d.id = 'realDL'; d.style.cssText = 'position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:90;background:rgba(14,6,28,.88);border:1px solid #ff2bd6;border-radius:12px;padding:8px 16px;color:#fff;font:700 13px system-ui,sans-serif;min-width:300px;text-align:center;pointer-events:none;box-shadow:0 0 18px rgba(255,43,214,.35)';
      d.innerHTML = '⬇ TÉLÉCHARGEMENT · persos réalistes <span id="realDLp">0 %</span><div style="height:6px;background:#2a1a40;border-radius:4px;margin-top:6px;overflow:hidden"><i id="realDLb" style="display:block;height:100%;width:0;background:linear-gradient(90deg,#ff2bd6,#8a5cff,#2de2ff)"></i></div>'; document.body.appendChild(d); }
    document.getElementById('realDLp').textContent = Math.round(p * 100) + ' %'; document.getElementById('realDLb').style.width = (p * 100).toFixed(1) + '%'; }
  function prog() { var a = 0, b = 0; Object.keys(PROG).forEach(function (k) { a += PROG[k][0]; b += PROG[k][1] || 1; }); return b ? a / b : 0; }
  var SIZE = { soldier: 2160468, michelle: 3276888 }, SRC = { soldier: 'models/real/soldier.glb', michelle: 'models/real/michelle.glb' }, BUSY = {}, ANIMS = null, ANIMB = false;
  /* CITADINS : Microsoft Rocketbox Avatar Library (licence MIT, models/rb/LICENSE.txt) : 16 vraies personnes texturées (squelette Biped « Bip01 »),
     animations motion capture partagées (models/rb/anims.json : idle / walk / run hommes « m » et femmes « f ») */
  var RB = [
    ['male_adult_01', 'm', 'Lucas', 2018288], ['female_adult_01', 'f', 'Emma', 2124848], ['male_adult_04', 'm', 'Karim', 2171900], ['female_adult_03', 'f', 'Inès', 2522112],
    ['male_adult_06', 'm', 'Hugo', 2054340], ['female_adult_08', 'f', 'Sofia', 2070568], ['male_adult_08', 'm', 'Théo', 1944480], ['female_adult_12', 'f', 'Chloé', 2136520],
    ['male_adult_12', 'm', 'Marco', 1559600], ['female_adult_17', 'f', 'Léa', 2129088], ['male_adult_16', 'm', 'Diego', 1562428], ['female_party_01', 'f', 'Maya', 2535320],
    ['male_adult_17', 'm', 'Yanis', 1562248], ['female_party_02', 'f', 'Nina', 2463928], ['business_male_02', 'm', 'Tony', 1811828], ['business_female_01', 'f', 'Clara', 2133276]];
  RB.forEach(function (r, i) { SRC['c' + i] = 'models/rb/' + r[0] + '.glb'; SIZE['c' + i] = r[3]; });
  function prep(g) { g.scene.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; o.frustumCulled = false; if (o.material && o.material.roughness != null) o.material.roughness = Math.max(.45, o.material.roughness || .6); } }); }
  function busyEnd(k) { delete BUSY[k]; if (!Object.keys(BUSY).length) { PROG = {}; ui(1); } else ui(Math.min(.99, prog())); }
  /* téléchargement À LA DEMANDE : chaque modèle est chargé la première fois qu'un perso en a besoin (barre « ⬇ TÉLÉCHARGEMENT ») */
  function need(k) { if (G[k] || BUSY[k] || !SRC[k] || !T || !T.GLTFLoader) return; BUSY[k] = 1; PROG[k] = [0, SIZE[k] || 2e6]; ui(prog());
    new T.GLTFLoader().load(SRC[k], function (g) { G[k] = g; prep(g); PROG[k][0] = PROG[k][1]; busyEnd(k); WAIT.splice(0).forEach(function (f) { try { f(); } catch (e) {} }); },
      function (e) { PROG[k] = [e.loaded, e.total || SIZE[k]]; ui(Math.min(.99, prog())); },
      function (e) { console.warn('REAL ' + k, e && (e.message || e)); G[k] = null; busyEnd(k); }); }
  function needAnims() { if (ANIMS || ANIMB || !T) return; ANIMB = true; BUSY.anims = 1; PROG.anims = [0, 910963];
    new T.FileLoader().load('models/rb/anims.json', function (txt) { try { var J = JSON.parse(txt); ANIMS = {}; Object.keys(J).forEach(function (g) { ANIMS[g] = {}; J[g].forEach(function (c) { ANIMS[g][c.name] = T.AnimationClip.parse(c); }); }); } catch (e) { console.warn('REAL anims', e); ANIMS = {}; } PROG.anims[0] = PROG.anims[1]; busyEnd('anims'); },
      function (e) { PROG.anims = [e.loaded, e.total || 910963]; ui(Math.min(.99, prog())); }, function () { ANIMS = {}; busyEnd('anims'); }); }
  function load(T0) { T = T0; REAL.ready = true; }
  function clipsOf(k) { if (/^c\d+$/.test(k)) { var A = ANIMS && ANIMS[RB[+k.slice(1)][1]] || {}; return { idle: A.idle, walk: A.walk, run: A.run }; }
    var own = G[k] && G[k].animations || [], S = G.soldier && G.soldier.animations || [], pick = function (L, re) { return L.filter(function (c) { return re.test(c.name); })[0]; };
    var r = { idle: pick(own, /idle|stand|wait/i), walk: pick(own, /walk/i), run: pick(own, /run|jog|sprint/i) };
    if (!r.walk) { r.idle = pick(S, /^Idle$/); r.walk = pick(S, /^Walk$/); r.run = pick(S, /^Run$/); r.borrow = k !== 'soldier'; } return r; }
  var NOPOS = {};   // animations du soldat sur un autre corps : sans les pistes de position (tailles différentes)
  function hipsParentQ(k) { var sc = G[k].scene, h = null; sc.updateMatrixWorld(true); sc.traverse(function (q) { if (!h && q.isBone && /Hips$/.test(q.name)) h = q; }); var Q = new T.Quaternion(); if (h && h.parent) h.parent.getWorldQuaternion(Q); return Q; }
  /* même squelette Mixamo mais repère différent au-dessus des hanches (Michelle : « Character » tourné de 90°) : on corrige la rotation des hanches
     qm = inv(Pm) · Ps · qs, et on enlève les pistes de position (tailles différentes) */
  function noPos(c, k) { if (!c) return c; var key = c.uuid + k; if (NOPOS[key]) return NOPOS[key]; var corr = hipsParentQ(k).invert().multiply(hipsParentQ('soldier')), tmp = new T.Quaternion();
    var tr = c.tracks.filter(function (t) { return !/\.position$/.test(t.name); }).map(function (t) { if (!/Hips\.quaternion$/.test(t.name)) return t; var t2 = t.clone(), v = t2.values;
      for (var i = 0; i < v.length; i += 4) { tmp.set(v[i], v[i + 1], v[i + 2], v[i + 3]).premultiply(corr); v[i] = tmp.x; v[i + 1] = tmp.y; v[i + 2] = tmp.z; v[i + 3] = tmp.w; } return t2; });
    var c2 = new T.AnimationClip(c.name, c.duration, tr); NOPOS[key] = c2; return c2; }
  /* ---- 10 PERSONNES ---- oh/os/ol = teinte/saturation/lumière des vêtements, sk = clarté de la peau, ah = teinte des détails, dk = couleur du haut noir,
     fh/fl = tissu (soldat), sy/sw = taille/carrure, cap = casquette, gl = lunettes de soleil */
  var VARS = [
    { b: 'michelle', n: 'Léna' },
    { b: 'michelle', n: 'Inès', oh: 355, os: .9, ol: .85, sk: 1.95, ah: 210, gl: '#111', sy: 1.02 },
    { b: 'michelle', n: 'Sofia', oh: 175, os: .8, ol: .8, sk: 1.45, ah: 330, cap: '#1d4fa8', sy: .97, sw: 1.04 },
    { b: 'michelle', n: 'Maya', oh: 275, os: .7, ol: .75, sk: .8, ah: 45, dk: '#3a2a50', sy: 1.04 },
    { b: 'michelle', n: 'Chloé', oh: 40, os: .08, ol: 1.25, sk: 2.1, ah: 0, cap: '#c8202a', sy: .95 },
    { b: 'michelle', n: 'Nina', oh: 320, os: .75, ol: .95, sk: 1.6, ah: 190, gl: '#3a2a10', dk: '#5a1a3a' },
    { b: 'michelle', n: 'Yasmine', oh: 120, os: .6, ol: .7, sk: 1.2, ah: 30, cap: '#111', gl: '#111', sy: .98, sw: 1.06 },
    { b: 'soldier', n: 'Marco', oh: 220, os: .15, ol: .38, fh: 220, fl: .6, sy: 1.03, sw: 1.06 },
    { b: 'soldier', n: 'Tony', oh: 30, os: .05, ol: 1.25, fh: 215, fl: .7, sy: .98 },
    { b: 'soldier', n: 'Diego', oh: 5, os: .55, ol: .7, fh: 30, fl: .8, sy: 1.05, sw: 1.1 }];
  function rgb2hsl(r, g, b) { var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0; if (mx !== mn) { var d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s, l]; }
  function hsl2rgb(h, s, l) { h = ((h % 360) + 360) % 360 / 360; s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l)); if (!s) return [l, l, l]; var q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; function f(t) { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; } return [f(h + 1 / 3), f(h), f(h - 1 / 3)]; }
  function hex(cs) { var c = parseInt(cs.slice(1), 16); return [(c >> 16 & 255) / 255, (c >> 8 & 255) / 255, (c & 255) / 255]; }
  function recolor(img, v, base) { var W = img.width, H = img.height, c = document.createElement('canvas'); c.width = W; c.height = H; var g = c.getContext('2d'); g.drawImage(img, 0, 0); var D = g.getImageData(0, 0, W, H), d = D.data, dkc = v.dk ? hex(v.dk) : null;
    for (var i = 0; i < d.length; i += 4) { var q = rgb2hsl(d[i] / 255, d[i + 1] / 255, d[i + 2] / 255), h = q[0], s = q[1], l = q[2], o = null;
      if (base === 'michelle') {
        if (h >= 36 && h <= 72 && s > .42 && l > .28) { if (v.oh != null) o = hsl2rgb(v.oh, s * (v.os != null ? v.os : 1), l * (v.ol || 1)); }   // vêtements jaunes
        else if (h >= 8 && h < 36 && s > .18 && s < .8 && l > .08 && l < .62) { if (v.sk) o = hsl2rgb(h + (v.sk > 1.6 ? 4 : 0), s * (v.sk > 1.6 ? .78 : 1), Math.min(.8, l * v.sk)); }   // peau
        else if ((h < 8 || h > 340) && s > .5) { if (v.ah != null) o = hsl2rgb(v.ah, s, l); }   // détails rouges
        else if (l < .16 && dkc) { var k = l / .16 * 1.4; o = [dkc[0] * k, dkc[1] * k, dkc[2] * k]; } }   // haut noir
      else {
        if (h >= 18 && h <= 48 && s > .15 && s < .75 && l > .4) { if (v.oh != null) o = hsl2rgb(v.oh, s * (v.os != null ? v.os : 1), l * (v.ol || 1)); }   // plaques beiges
        else if (h > 55 && h < 150 && v.fh != null) o = hsl2rgb(v.fh, s * .8, l * (v.fl || 1)); }   // tissu vert
      if (o) { d[i] = o[0] * 255; d[i + 1] = o[1] * 255; d[i + 2] = o[2] * 255; } }
    g.putImageData(D, 0, 0); var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.flipY = false; t.anisotropy = 4; return t; }
  function varMat(m, v, vi, base) { if (!m || !m.map || !m.map.image) return m; var key = vi + '|' + m.uuid; if (VTEX[key]) return VTEX[key]; var m2 = m.clone();
    try { m2.map = recolor(m.map.image, v, base); m2.map.wrapS = m.map.wrapS; m2.map.wrapT = m.map.wrapT; } catch (e) {} VTEX[key] = m2; return m2; }
  function headBone(o) { var h = null; o.traverse(function (q) { if (!h && q.isBone && /Head$/.test(q.name)) h = q; }); return h; }
  function accessories(o, v) { if (!v.cap && !v.gl) return; var hb = headBone(o); if (!hb) return; o.updateMatrixWorld(true); var ws = hb.getWorldScale(new T.Vector3()).x || 1, gr = new T.Group(); gr.scale.setScalar(1 / ws); hb.add(gr);
    if (v.cap) { var cm = new T.MeshStandardMaterial({ color: v.cap, roughness: .8 }), dome = new T.Mesh(new T.SphereGeometry(.112, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), cm); dome.position.set(0, .1, .005); dome.scale.set(1, .72, 1.08);
      var brim = new T.Mesh(new T.CylinderGeometry(.1, .1, .012, 16, 1, false, -Math.PI / 2, Math.PI), cm); brim.position.set(0, .1, .06); brim.scale.set(1, 1, 1.2); gr.add(dome, brim); }
    if (v.gl) { var gm = new T.MeshStandardMaterial({ color: v.gl, roughness: .15, metalness: .6 }); [-1, 1].forEach(function (sd) { var l = new T.Mesh(new T.BoxGeometry(.055, .03, .008), gm); l.position.set(sd * .034, .045, .1); gr.add(l); });
      var br = new T.Mesh(new T.BoxGeometry(.14, .008, .006), gm); br.position.set(0, .058, .1); gr.add(br); }
    gr.traverse(function (q) { if (q.isMesh) q.castShadow = true; }); }
  window.REAL = {
    ready: false, load: load, VARS: VARS,
    has: function (k) { return !!G[k]; }, RB: RB, need: need,
    add: function (k, gltf, TT) { if (TT) T = TT; prep(gltf); G[k] = gltf; },
    /* c = perso (makeChar), k = 'soldier' | 'michelle' | 'perso' (importé) | 'vN' (personne n°N), tint = [r,g,b] (équipes de CS) */
    apply: function (c, k, tint) { var vi = -1; if (/^v\d+$/.test(k)) k = 'c' + (+k.slice(1) % RB.length);   // anciennes personnes vN = citadins
      if (!c || c.cm) return false; var civ = /^c\d+$/.test(k); if (!G[k]) { need(k); if (civ) needAnims(); return false; } if (civ && !ANIMS) { needAnims(); return false; } var v = civ ? { sy: .96 + (+k.slice(1) * 37 % 9) / 100 } : null;
      var src = G[k].scene, o = T.SkeletonUtils ? T.SkeletonUtils.clone(src) : src.clone(true), g = new T.Group(); g.add(o);
      o.traverse(function (q) { if (q.isMesh && q.material) { if (v && vi >= 0) q.material = varMat(q.material, v, vi, k); if (tint) { q.material = q.material.clone(); q.material.color.setRGB(tint[0], tint[1], tint[2]); } } });
      var ext = function () { o.updateMatrixWorld(true); var bs = [], w = new T.Vector3(), r = null; o.traverse(function (q) { if (q.isBone) bs.push(q); });   // taille mesurée sur les OS (la boîte de la géométrie d'un SkinnedMesh peut être fausse : Michelle = couchée en cm)
          if (bs.length > 5) { r = { y0: 1e9, y1: -1e9, cx: 0, cz: 0 }; bs.forEach(function (b) { b.getWorldPosition(w); if (w.y < r.y0) r.y0 = w.y; if (w.y > r.y1) r.y1 = w.y; if (/(Hips|Pelvis)$/.test(b.name)) { r.cx = w.x; r.cz = w.z; } }); r.y1 += (r.y1 - r.y0) * .02; }
          else { var bb = new T.Box3().setFromObject(o), ce = bb.getCenter(w); r = { y0: bb.min.y, y1: bb.max.y, cx: ce.x, cz: ce.z }; } return r; };
      var E = ext(), h0 = Math.max(.01, E.y1 - E.y0), s = 1.86 / .9 / h0 * (v && v.sy || 1); o.scale.multiplyScalar(s); if (v && v.sw) { o.scale.x *= v.sw; o.scale.z *= v.sw; }
      E = ext(); o.position.x -= E.cx; o.position.z -= E.cz; o.position.y -= E.y0 - .03;
      if (v && v.cap) accessories(o, v);
      g.rotation.y = Math.PI / 2; c.root.traverse(function (q) { if ((q.isMesh || q.isSkinnedMesh) && !q.userData.keep) { q.userData.cmHid = true; q.visible = false; } });
      if (c.gunHold) c.gunHold.traverse(function (q) { if (q.isMesh) q.visible = true; }); c.root.add(g); c.cm = g; c.real = k; c.civ = civ;
      var C = clipsOf(k), fix = C.borrow ? function (x) { return noPos(x, k); } : function (x) { return x; }; c.cmMix = new T.AnimationMixer(o); c.cmA = {};
      ['idle', 'walk', 'run'].forEach(function (a) { if (C[a]) c.cmA[a] = c.cmMix.clipAction(fix(C[a])); }); if (c.cmA.idle) { c.cmA.idle.time = Math.random() * 3; c.cmA.idle.play(); c.cmCur = 'idle'; } return true; },
    unapply: function (c) { if (!c || !c.cm || !c.real) return; c.root.remove(c.cm); c.cm = null; c.cmMix = null; c.real = null; c.root.traverse(function (q) { if (q.userData.cmHid) { q.visible = true; q.userData.cmHid = false; } }); },
    when: function (f) { if (REAL.ready) f(); else WAIT.push(f); }
  };
})();
