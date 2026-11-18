/* ===== SKINS « GROS JEU » : 21 persos stylisés détaillés et animés (Quaternius, Ultimate Modular Men / Women, CC0 : models/q/LICENSE.txt),
   chacun en 3 couleurs (originale, NÉON, OR) = 63 skins. Les animations motion capture (repos, marche, course, arme pointée, course en tirant,
   tir, mort, coup de poing, salut, roulade…) sont dans models/q/anims_m.json et anims_f.json (une fois pour tous les persos du même sexe).
   Fonctionnement : le perso du jeu (squelette simple de skins.js, posé par anim.js) reste là mais invisible ; le modèle détaillé est accroché
   dessus. Quand une vraie animation existe pour l'état du perso, elle est jouée (mixeur) ; sinon (planeur, nage, escalade, danses, accroupi,
   conduite, KO…) les os du modèle détaillé COPIENT la pose du squelette simple (bras, avant-bras, cuisses, tibias dans la même direction,
   corps et tête dans la même orientation) : toutes les poses du jeu marchent avec tous les skins. Passage d'un mode à l'autre en douceur.
   QS.apply(c, id) accroche (charge à la demande), QS.drive(c, st, dt) anime. Le pistolet est tenu dans la vraie main (os WristR). ===== */
(function () {
  var T = null, G = {}, BUSY = {}, ANIMS = {}, ABUSY = {}, MATC = {}, CLIPS = {};
  var BASES = [
    ['m_punk', 'm', 'Punk', 0], ['m_adventurer', 'm', 'Explorateur', 1], ['m_beach', 'm', 'Surfeur', 0], ['m_casual_2', 'm', 'Chill', 0], ['m_casual_hoodie', 'm', 'Sweat Violet', 0],
    ['m_farmer', 'm', 'Fermier', 0], ['m_king', 'm', 'Le Roi', 2], ['m_spacesuit', 'm', 'Astronaute', 2], ['m_suit', 'm', 'Agent Secret', 1], ['m_swat', 'm', 'Intervention', 1], ['m_worker', 'm', 'Chantier', 0],
    ['f_punk', 'f', 'Punkette', 0], ['f_adventurer', 'f', 'Aventurière', 1], ['f_casual', 'f', 'Cool', 0], ['f_formal', 'f', 'Gala', 1], ['f_medieval', 'f', 'Chevalière', 2],
    ['f_scifi', 'f', 'Pilote Stellaire', 2], ['f_soldier', 'f', 'Commando', 1], ['f_suit', 'f', 'La Boss', 1], ['f_witch', 'f', 'Sorcière', 2], ['f_worker', 'f', 'Cheffe de Chantier', 0]];
  var KEEP = /^(Skin|Skin_Darker|Eye|Eyebrows|Hair.*|Moustache|Visor)$/;   /* matières qui gardent leur couleur dans les variantes */
  var VAR = [['', null], [' Néon', 'neon'], [' Or', 'or']], TAGS = ['Rare', 'Épique', 'Légendaire'], RC = ['#3d8bff', '#b44dff', '#ffa21f'], PRICE = [500, 900, 1500];
  var LIST = {}; BASES.forEach(function (b, bi) { VAR.forEach(function (v, vi) { var r = Math.min(2, b[3] + (vi === 2 ? 2 : vi)); LIST['q' + bi + '_' + vi] = { name: b[2] + v[0], base: b[0], sex: b[1], v: v[1], rar: r, tag: TAGS[r], rc: RC[r], price: PRICE[r] + vi * 100 }; }); });
  function hsl(h, s, l) { return new T.Color().setHSL(((h % 1) + 1) % 1, s, l); }
  function recolor(m, mode, idx) { var c = m.color.clone(), H = { h: 0, s: 0, l: 0 }; c.convertLinearToSRGB().getHSL(H);
    if (mode === 'neon') { var hues = [.83, .52, .14, .33, .0, .62], h = hues[idx % hues.length]; if (H.l < .1) m.color = hsl(.75, .45, .1); else { m.color = hsl(h, .95, .55); m.emissive = hsl(h, 1, .35); m.emissiveIntensity = .55; } }
    else if (mode === 'or') { if (H.l < .1) m.color = hsl(.75, .1, .07); else { m.color = idx % 2 ? hsl(.12, .9, .55) : hsl(.11, .8, .42); m.metalness = .8; m.roughness = .3; m.emissive = hsl(.1, .9, .2); m.emissiveIntensity = .35; } } }
  function mats(id, sc) { var d = LIST[id]; sc.traverse(function (o) { if (!o.isMesh) return; var arr = Array.isArray(o.material) ? o.material : [o.material];
      var out = arr.map(function (m, i) { var key = id + '|' + m.name; if (MATC[key]) return MATC[key]; var n = m.clone(); n.skinning = true; if (d && d.v && !KEEP.test(m.name)) recolor(n, d.v, Object.keys(MATC).length + i); if (n.metalness == null || n.metalness > .9) n.metalness = 0; MATC[key] = n; return n; });
      o.material = Array.isArray(o.material) ? out : out[0]; o.castShadow = true; o.receiveShadow = false; o.frustumCulled = false; }); }
  function need(base, sex) {
    if (!G[base] && !BUSY[base] && T.GLTFLoader) { BUSY[base] = 1; new T.GLTFLoader().load('models/q/' + base + '.glb', function (g) { G[base] = g; delete BUSY[base]; }, null, function () { delete BUSY[base]; G[base] = null; }); }
    if (!ANIMS[sex] && !ABUSY[sex]) { ABUSY[sex] = 1; new T.FileLoader().load('models/q/anims_' + sex + '.json', function (txt) { try { var J = JSON.parse(txt), A = {}; Object.keys(J).forEach(function (k) { A[k] = T.AnimationClip.parse(J[k]); }); ANIMS[sex] = A; } catch (e) { ANIMS[sex] = {}; } }, null, function () { ANIMS[sex] = {}; }); } }
  var V = function () { return new T.Vector3(); }, Qn = function () { return new T.Quaternion(); };
  function boneMap(o) { var B = {}; o.traverse(function (q) { if (q.isBone) B[q.name] = q; }); return B; }
  var LIMBS = [['UpperArmL', 'LowerArmL', 'aL'], ['LowerArmL', 'WristL', 'eL'], ['UpperArmR', 'LowerArmR', 'aR'], ['LowerArmR', 'WristR', 'eR'], ['UpperLegL', 'LowerLegL', 'lL'], ['LowerLegL', 'FootL', 'kL'], ['UpperLegR', 'LowerLegR', 'lR'], ['LowerLegR', 'FootR', 'kR']];
  var POSE = ['Body', 'Hips', 'Abdomen', 'Torso', 'Chest', 'Neck', 'Head', 'UpperArmL', 'LowerArmL', 'WristL', 'UpperArmR', 'LowerArmR', 'WristR', 'UpperLegL', 'LowerLegL', 'UpperLegR', 'LowerLegR', 'FootL', 'FootR'];
  var QS = window.QS = {
    LIST: LIST, BASES: BASES,
    load: function (TT) { T = TT; },
    has: function (id) { var d = LIST[id]; return !!(d && G[d.base] && ANIMS[d.sex]); },
    prefetch: function (id) { var d = LIST[id]; if (d && T) need(d.base, d.sex); },
    /* accroche le modèle détaillé sur le perso c (renvoie false tant que ce n'est pas téléchargé) */
    apply: function (c, id) { if (!T || !c || c.qs === id) return !!c.qs; var d = LIST[id]; if (!d) return false; if (!G[d.base] || !ANIMS[d.sex]) { need(d.base, d.sex); return false; }
      if (c.qs) QS.remove(c); var src = G[d.base].scene, o = T.SkeletonUtils ? T.SkeletonUtils.clone(src) : src.clone(true), g = new T.Group(); g.add(o); mats(id, o);
      var bb = new T.Box3(); o.updateMatrixWorld(true); var B = boneMap(o), w = V(), y0 = 1e9, y1 = -1e9; Object.keys(B).forEach(function (k) { B[k].getWorldPosition(w); if (w.y < y0) y0 = w.y; if (w.y > y1) y1 = w.y; }); bb.setFromObject(o); var h = Math.max(bb.max.y - bb.min.y, .5);
      o.traverse(function (q) { if (/^(Pistol|Gun|Sword|Shield)/i.test(q.name || '')) q.visible = false; });   /* armes intégrées à certains modèles : on garde seulement celles du jeu */
      var s = 1.9 / .9 / h; o.scale.setScalar(s); o.position.y = -bb.min.y * s; g.rotation.y = Math.PI / 2; c.root.add(g);
      c.root.traverse(function (q) { if ((q.isMesh || q.isSkinnedMesh) && !q.userData.keep && q !== c.shadow && !(c.glider && isChild(q, c.glider)) && !(c.gunHold && isChild(q, c.gunHold)) && !isChild(q, g)) { q.userData.qHid = true; q.visible = false; } });
      var mix = new T.AnimationMixer(o), A = {}, CL = ANIMS[d.sex]; Object.keys(CL).forEach(function (k) { A[k] = mix.clipAction(CL[k]); });
      ['Death', 'Gun_Shoot', 'Idle_Gun_Shoot', 'Punch_Right', 'Kick_Right', 'Roll', 'Sword_Slash', 'Interact', 'HitRecieve'].forEach(function (k) { if (A[k]) { A[k].setLoop(T.LoopOnce); A[k].clampWhenFinished = true; } });
      c.qs = id; c.qg = g; c.qo = o; c.qB = B; c.qMix = mix; c.qA = A; c.qCur = null; c.qW = 0; c.qSnap = null; c.qMode = 'clip';
      /* repos : orientation de chaque os par rapport à la racine du perso, et longueurs des os (pour copier les poses) */
      c.root.updateMatrixWorld(true); var rq = Qn(); c.root.getWorldQuaternion(rq); rq.invert(); c.qRest = {}; c.qRestL = {};
      POSE.forEach(function (n) { var b = B[n]; if (!b) return; c.qRestL[n] = b.quaternion.clone(); c.qRest[n] = rq.clone().multiply(b.getWorldQuaternion(Qn())); });
      c.qLen = {}; LIMBS.forEach(function (L) { var a = B[L[0]], b = B[L[1]]; if (a && b) c.qLen[L[0]] = a.getWorldPosition(V()).distanceTo(b.getWorldPosition(V())); });
      c.qBodyP = B.Body ? B.Body.position.clone() : null;
      /* le pistolet passe dans la vraie main : offset calculé sur la pose « arme pointée » */
      if (A.Idle_Gun_Pointing && B.WristR && c.gunHold) { A.Idle_Gun_Pointing.play(); mix.update(.02); o.updateMatrixWorld(true); var wq = B.WristR.getWorldQuaternion(Qn()), cq = c.root.getWorldQuaternion(Qn()), ws = B.WristR.getWorldScale(V()).x;
        c.qGunQ = wq.invert().multiply(cq); c.qGunS = .9 / ws; A.Idle_Gun_Pointing.stop(); mix.update(0); c.qGunP = c.gunHold.parent; c.qGunPos = c.gunHold.position.clone(); c.qGunRot = c.gunHold.quaternion.clone();
        B.WristR.add(c.gunHold); c.gunHold.position.set(-.02 / ws, .09 / ws, .03 / ws); c.gunHold.quaternion.copy(c.qGunQ); c.gunHold.scale.setScalar(c.qGunS); }
      return true; },
    remove: function (c) { if (!c || !c.qs) return; if (c.qGunP && c.gunHold) { c.qGunP.add(c.gunHold); c.gunHold.position.copy(c.qGunPos); c.gunHold.quaternion.copy(c.qGunRot); c.gunHold.scale.setScalar(1); }
      c.root.remove(c.qg); c.qs = null; c.qg = c.qo = c.qMix = null; c.root.traverse(function (q) { if (q.userData.qHid) { q.visible = true; q.userData.qHid = false; } }); },
    /* st = { clip: 'Run', ts: 1 } (vraie animation) ou { pose: true } (copie la pose du squelette simple) ; pitch = visée haut/bas */
    drive: function (c, st, dt, pitch) { if (!c.qs || !c.qMix) return; var B = c.qB, A = c.qA, want = st.pose ? null : st.clip;
      if (want && !A[want]) want = 'Idle';
      var mode = want ? 'clip' : 'pose';
      if (mode !== c.qMode) { c.qSnap = {}; POSE.forEach(function (n) { if (B[n]) c.qSnap[n] = [B[n].quaternion.clone(), B[n].position.clone()]; }); c.qSnT = 0; c.qMode = mode; if (mode === 'pose') { if (c.qCur && A[c.qCur]) A[c.qCur].stop(); c.qCur = null; } }
      if (mode === 'clip') { if (want !== c.qCur) { var nx = A[want]; nx.reset(); nx.play(); if (c.qCur && A[c.qCur] && !c.qSnap) { A[c.qCur].crossFadeTo(nx, .18, false); } else if (c.qCur && A[c.qCur]) A[c.qCur].stop(); c.qCur = want; } A[want].timeScale = st.ts || 1;
        /* le mixeur de three ne réécrit pas une valeur qui n'a pas changé : on remet d'abord ce qu'il avait écrit (sinon la visée et les poses copiées s'accumulent) */
        if (c.qOut) POSE.forEach(function (n) { var o2 = c.qOut[n]; if (B[n] && o2) { B[n].quaternion.copy(o2[0]); B[n].position.copy(o2[1]); } });
        c.qMix.update(dt); c.qOut = c.qOut || {}; POSE.forEach(function (n) { if (!B[n]) return; var o2 = c.qOut[n] || (c.qOut[n] = [Qn(), V()]); o2[0].copy(B[n].quaternion); o2[1].copy(B[n].position); }); }
      else QS.copyPose(c);
      if (c.qSnap) { c.qSnT += dt / .2; var k = Math.min(1, c.qSnT), e = k * k * (3 - 2 * k); POSE.forEach(function (n) { var b = B[n], s = c.qSnap[n]; if (!b || !s) return; b.quaternion.copy(s[0].clone().slerp(b.quaternion, e)); b.position.lerpVectors(s[1], b.position.clone(), e); }); if (k >= 1) c.qSnap = null; }
      if (pitch && B.Chest && B.Torso) { c.root.updateMatrixWorld(true); var ax = V().set(0, 0, 1).applyQuaternion(c.root.getWorldQuaternion(Qn())).normalize(); [B.Torso, B.Chest].forEach(function (b) { var pq = b.parent.getWorldQuaternion(Qn()), wq = b.getWorldQuaternion(Qn()); wq.premultiply(Qn().setFromAxisAngle(ax, pitch * .5)); b.quaternion.copy(pq.invert().multiply(wq)); b.updateMatrixWorld(true); }); } },
    /* copie la pose du squelette simple (posé par anim.js) sur le modèle détaillé */
    copyPose: function (c) { var B = c.qB, R = c.qRest, rq = c.root.getWorldQuaternion(Qn()); c.root.updateMatrixWorld(true);
      POSE.forEach(function (n) { if (B[n] && c.qRestL[n]) B[n].quaternion.copy(c.qRestL[n]); }); if (B.Body && c.qBodyP) B.Body.position.copy(c.qBodyP);
      var setW = function (b, wq) { var pq = b.parent.getWorldQuaternion(Qn()); b.quaternion.copy(pq.invert().multiply(wq)); b.updateMatrixWorld(true); };
      /* corps : même orientation + même hauteur que le corps simple */
      if (B.Body && c.body) { setW(B.Body, c.body.getWorldQuaternion(Qn()).multiply(R.Body)); var d = c.body.position.y; if (d) { var bw = B.Body.getWorldPosition(V()); bw.y += d * .9 * c.root.scale.y; B.Body.position.copy(B.Body.parent.worldToLocal(bw)); B.Body.updateMatrixWorld(true); } }
      if (B.Head && c.head) setW(B.Head, c.head.getWorldQuaternion(Qn()).multiply(R.Head));
      LIMBS.forEach(function (L) { var b = B[L[0]], ch = B[L[1]], src = c[L[2]]; if (!b || !ch || !src) return; b.updateMatrixWorld(true);
        var cur = ch.getWorldPosition(V()).sub(b.getWorldPosition(V())).normalize(), tgt = V().set(0, -1, 0).applyQuaternion(src.getWorldQuaternion(Qn())).normalize();
        var dq = Qn().setFromUnitVectors(cur, tgt), wq = b.getWorldQuaternion(Qn()).premultiply(dq); setW(b, wq);
        if (L[1] === 'FootL' || L[1] === 'FootR') { var f = B[L[1]], end = b.getWorldPosition(V()).add(tgt.clone().multiplyScalar(c.qLen[L[0]] || .4)); f.position.copy(f.parent.worldToLocal(end)); setW(f, rq.clone().multiply(R[L[1]])); } }); },
    /* état du perso → animation (appelé par le jeu) */
    pick: function (o) { if (o.pose) return { pose: true }; if (o.dead) return { clip: 'Death' };
      if (o.armed) { if (o.sp > .6) return { clip: 'Run_Shoot', ts: Math.max(.7, Math.min(1.5, o.sp / 5)) }; return { clip: o.shoot ? 'Idle_Gun_Shoot' : 'Idle_Gun_Pointing' }; }
      if (o.sp > 3.2) return { clip: 'Run', ts: Math.max(.8, Math.min(1.5, o.sp / 5.2)) }; if (o.sp > .5) return { clip: 'Walk', ts: Math.max(.7, Math.min(1.6, o.sp / 1.6)) }; return { clip: 'Idle' }; }
  };
  function isChild(q, p) { while (q) { if (q === p) return true; q = q.parent; } return false; }
  /* toutes les poses du jeu (salon, aperçus, danses, conduite…) passent par ANIM.apply : le modèle détaillé les copie aussi */
  QS.poseNow = function (c) { if (c.qs !== c.qWant) QS.apply(c, c.qWant); if (!c.qs) return; var now = performance.now(), dt = Math.min(.1, (now - (c.qT || now)) / 1000) || .016; c.qT = now; QS.drive(c, { pose: true }, dt); };
  if (window.ANIM) { var oa = ANIM.apply; ANIM.apply = function (c, o, g) { oa(c, o, g); if (c && c.qWant && !c.qSelf && T) QS.poseNow(c); }; }
  if (window.THREE) T = window.THREE;
})();
