/* ===== PERSONNAGES RÉALISTES (Wald City, CS WILD GO) =====
   Modèles humains réalistes animés (Mixamo, Adobe : utilisation libre dans un projet, voir models/real/LICENSE.txt) :
   soldier.glb (combattant en tenue tactique, animations Idle / Walk / Run) et michelle.glb (civile ; on lui met les animations du soldat,
   même squelette « mixamorig »). REAL.apply(c, clé, teinte) remplace l'apparence d'un perso (comme un perso importé du Créatif). */
(function () {
  var T = null, G = {}, WAIT = [], LOADING = false;
  function load(T0) { T = T0; if (LOADING || !T.GLTFLoader) return; LOADING = true; var L = new T.GLTFLoader(), n = 0;
    ['soldier', 'michelle'].forEach(function (k) { L.load('models/real/' + k + '.glb', function (g) { G[k] = g; g.scene.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; o.frustumCulled = false; if (o.material) { o.material.roughness = Math.max(.45, o.material.roughness || .6); } } });
      if (++n === 2) { REAL.ready = true; WAIT.splice(0).forEach(function (f) { f(); }); } }, null, function (e) { console.warn('REAL ' + k, e && (e.message || e)); if (++n === 2) { REAL.ready = !!G.soldier; WAIT.splice(0).forEach(function (f) { f(); }); } }); }); }
  function clips() { var S = G.soldier && G.soldier.animations || []; return { idle: S.filter(function (c) { return c.name === 'Idle'; })[0], walk: S.filter(function (c) { return c.name === 'Walk'; })[0], run: S.filter(function (c) { return c.name === 'Run'; })[0] }; }
  var NOPOS = {};   // pour Michelle : animations du soldat sans les pistes de position (tailles différentes)
  function noPos(c) { if (!c) return c; if (NOPOS[c.uuid]) return NOPOS[c.uuid]; var c2 = new T.AnimationClip(c.name, c.duration, c.tracks.filter(function (t) { return !/\.position$/.test(t.name) || /Hips\.position$/.test(t.name) && false; })); NOPOS[c.uuid] = c2; return c2; }
  window.REAL = {
    ready: false, load: load,
    has: function (k) { return !!G[k]; },
    /* remplace l'apparence du perso c (makeChar) par le modèle réaliste k ; tint = [r,g,b] multiplie les couleurs (équipes de CS) */
    apply: function (c, k, tint) { if (!c || !G[k] || c.cm) return false; var src = G[k].scene, o = T.SkeletonUtils ? T.SkeletonUtils.clone(src) : src.clone(true), g = new T.Group(); g.add(o);
      if (tint) o.traverse(function (q) { if (q.isMesh && q.material) { q.material = q.material.clone(); q.material.color.setRGB(tint[0], tint[1], tint[2]); } });
      o.updateMatrixWorld(true); var bb = new T.Box3().setFromObject(o), h0 = Math.max(.01, bb.max.y - bb.min.y), s = 1.86 / .9 / h0; o.scale.multiplyScalar(s); o.updateMatrixWorld(true); bb.setFromObject(o); var ce = bb.getCenter(new T.Vector3()); o.position.x -= ce.x; o.position.z -= ce.z; o.position.y -= bb.min.y;
      g.rotation.y = Math.PI / 2; c.root.traverse(function (q) { if ((q.isMesh || q.isSkinnedMesh) && !q.userData.keep) { q.userData.cmHid = true; q.visible = false; } });
      if (c.gunHold) c.gunHold.traverse(function (q) { if (q.isMesh) q.visible = true; }); c.root.add(g); c.cm = g; c.real = k;
      var C = clips(), fix = k === 'soldier' ? function (x) { return x; } : noPos; c.cmMix = new T.AnimationMixer(o); c.cmA = {};
      ['idle', 'walk', 'run'].forEach(function (a) { if (C[a]) c.cmA[a] = c.cmMix.clipAction(fix(C[a])); }); if (c.cmA.idle) { c.cmA.idle.time = Math.random() * 3; c.cmA.idle.play(); c.cmCur = 'idle'; } return true; },
    unapply: function (c) { if (!c || !c.cm || !c.real) return; c.root.remove(c.cm); c.cm = null; c.cmMix = null; c.real = null; c.root.traverse(function (q) { if (q.userData.cmHid) { q.visible = true; q.userData.cmHid = false; } }); },
    when: function (f) { if (REAL.ready) f(); else WAIT.push(f); }
  };
})();
