/* ===== SKINS DÉTAILLÉS v2 : vrais persos aux proportions humaines, textures 1024, 14 000 à 40 000 triangles chacun.
   Modèles : Quaternius « Universal Base Characters » + « Modular Character Outfits » + « Universal Animation Library » (CC0,
   models/u/LICENSE.txt). 21 tenues × 3 couleurs (originale, NÉON, OR) = 63 skins, ids q<n>_<v> (les anciens achats sont gardés).
   Une tenue = corps de base (tête, peau) + tenue modulaire (ranger / paysan, recolorée dans le shader) OU combinaison peinte
   dans le shader sur le corps (motifs : coupe, dégradé, panneaux, costume, haute visibilité, néon) + cheveux + accessoires
   (casque à visière, casque de chantier, couronne, masque). Animations motion capture : repos, marche, footing, sprint,
   accroupi, saut, nage, conduite, glissade, mort, pistolet visé (haut / milieu / bas mélangés selon la visée, jambes séparées
   du buste). Les poses sans animation (planeur, escalade, danses, KO, outils) copient le squelette simple du jeu (anim.js).
   QS.apply(c, id) accroche (charge à la demande), QS.drive(c, st, dt, pitch) anime. ===== */
(function () {
  var T = null, F = {}, FB = {}, AN = null, ABUSY = 0, CL = {}, GEO = {}, MATC = {};
  var DIR = 'models/u/';
  /* [clé, sexe, nom, rareté] : même ordre et mêmes noms qu'avant (achats gardés) */
  var BASES = [
    ['punk', 'm', 'Punk', 0], ['explo', 'm', 'Explorateur', 1], ['surf', 'm', 'Surfeur', 0], ['chill', 'm', 'Chill', 0], ['sweat', 'm', 'Sweat Violet', 0],
    ['fermier', 'm', 'Fermier', 0], ['roi', 'm', 'Le Roi', 2], ['astro', 'm', 'Astronaute', 2], ['agent', 'm', 'Agent Secret', 1], ['swat', 'm', 'Intervention', 1], ['chantier', 'm', 'Chantier', 0],
    ['punkette', 'f', 'Punkette', 0], ['aventuriere', 'f', 'Aventurière', 1], ['cool', 'f', 'Cool', 0], ['gala', 'f', 'Gala', 1], ['chevaliere', 'f', 'Chevalière', 2],
    ['pilote', 'f', 'Pilote Stellaire', 2], ['commando', 'f', 'Commando', 1], ['boss', 'f', 'La Boss', 1], ['sorciere', 'f', 'Sorcière', 2], ['cheffe', 'f', 'Cheffe de Chantier', 0]];
  /* recettes : o = tenue (suit = combinaison peinte, ranger, peasant) ; pat = motif ; c1/c2/c3 = couleurs ; A/B = nouvelles couleurs
     des tissus de la tenue ; hair / hc = cheveux ; tone = teint ; add = morceaux de la tenue ranger posés sur la combinaison ;
     acc = accessoire ; mask = masque sur le bas du visage ; beard = barbe */
  var RC0 = {
    punk: { o: 'suit', pat: 0, c1: '#15151c', c2: '#ff2bd6', c3: '#d8d8e0', hair: 'simpleparted', hc: '#ff3fbf', tone: 1, add: ['Feet_Boots', 'Belt'], B: '#22222a' },
    explo: { o: 'ranger', A: '#b08a4e', hair: 'simpleparted', hc: '#5a3a1e', tone: .85, hide: ['Hood', 'Pauldron'] },
    surf: { o: 'suit', pat: 1, c1: '#0fb4c8', c2: '#0b2a6e', c3: '#ffd23d', hair: 'buzzed', hc: '#f2d27a', tone: .8 },
    chill: { o: 'peasant', A: '#9fd0ff', B: '#2b3f66', hair: 'simpleparted', hc: '#1c140e', tone: .55 },
    sweat: { o: 'suit', pat: 2, c1: '#7a2bd9', c2: '#2a1050', c3: '#f2f2f2', hair: 'buzzed', hc: '#2a1a10', tone: .7, add: ['Feet_Boots'], B: '#f0f0f4' },
    fermier: { o: 'peasant', A: '#d8c49a', B: '#5a3416', hair: 'simpleparted', hc: '#7a4a22', tone: .95, beard: 1 },
    roi: { o: 'suit', pat: 1, c1: '#b0142c', c2: '#3a0610', c3: '#ffcc33', hair: 'simpleparted', hc: '#d9d2c8', tone: .9, beard: 1, add: ['Feet_Boots', 'Belt', 'Pauldron', 'Bracer'], acc: 'couronne', B: '#4a1408' },
    astro: { o: 'suit', pat: 2, c1: '#f2f2f4', c2: '#ff7a1a', c3: '#9aa3b0', hair: 'buzzed', hc: '#3a2a1a', tone: .9, add: ['Feet_Boots', 'Belt'], acc: 'casque', B: '#d8dce2' },
    agent: { o: 'suit', pat: 3, c1: '#111216', c2: '#f4f4f4', c3: '#c0102a', hair: 'simpleparted', hc: '#0e0b08', tone: .6, add: ['Feet_Boots'], B: '#101014' },
    swat: { o: 'suit', pat: 2, c1: '#1b2440', c2: '#0c1020', c3: '#3a3f4a', hair: 'buzzed', hc: '#111', tone: .75, add: ['Feet_Boots', 'Belt', 'Pauldron', 'Bracer'], mask: 1, acc: 'casque', vis: '#1a1a22', B: '#16181e' },
    chantier: { o: 'suit', pat: 4, c1: '#ff7a00', c2: '#20335a', c3: '#e8eef2', hair: 'buzzed', hc: '#4a3018', tone: .65, add: ['Feet_Boots'], acc: 'chantier' },
    punkette: { o: 'suit', pat: 0, c1: '#101014', c2: '#39ff6a', c3: '#ff2bd6', hair: 'long', hc: '#39ff6a', tone: 1, add: ['Feet', 'Belt'], B: '#18181c' },
    aventuriere: { o: 'ranger', hair: 'buns', hc: '#6a3a1a', tone: .9 },
    cool: { o: 'peasant', A: '#ff8fc8', B: '#2a2a3a', hair: 'buns', hc: '#3a2414', tone: .7 },
    gala: { o: 'suit', pat: 1, c1: '#d0103a', c2: '#14040a', c3: '#ffcc33', hair: 'long', hc: '#f0d080', tone: .95, add: ['Feet'], B: '#1a0608' },
    chevaliere: { o: 'ranger', A: '#8fa6c8', B: '#4a4f5a', hair: 'buns', hc: '#c8c8d0', tone: .85, hide: ['Hood'] },
    pilote: { o: 'suit', pat: 5, c1: '#f4f6fa', c2: '#25d8ff', c3: '#2a3040', hair: 'long', hc: '#1a1a1a', tone: .8, add: ['Feet'], acc: 'casque', vis: '#25d8ff', B: '#e8ecf2' },
    commando: { o: 'ranger', A: '#4a5530', B: '#2a2418', hair: 'buzzedfemale', hc: '#2a1a10', tone: .6, mask: 1, hide: ['Hood'] },
    boss: { o: 'suit', pat: 3, c1: '#121014', c2: '#f4f0ea', c3: '#ffcc33', hair: 'long', hc: '#120c08', tone: .45, add: ['Feet'], B: '#121014' },
    sorciere: { o: 'ranger', A: '#6a1fb0', B: '#24102e', hair: 'long', hc: '#c03aff', tone: 1 },
    cheffe: { o: 'suit', pat: 4, c1: '#ffd400', c2: '#20335a', c3: '#e8eef2', hair: 'buzzedfemale', hc: '#5a3a1a', tone: .75, add: ['Feet'], acc: 'chantier' } };
  var VAR = [['', null], [' Néon', 'neon'], [' Or', 'or']], TAGS = ['Rare', 'Épique', 'Légendaire'], RCOL = ['#3d8bff', '#b44dff', '#ffa21f'], PRICE = [500, 900, 1500];
  var LIST = {}; BASES.forEach(function (b, bi) { VAR.forEach(function (v, vi) { var r = Math.min(2, b[3] + (vi === 2 ? 2 : vi)); LIST['q' + bi + '_' + vi] = { name: b[2] + v[0], base: b[0], sex: b[1], v: v[1], rar: r, tag: TAGS[r], rc: RCOL[r], price: PRICE[r] + vi * 100 }; }); });
  var NEON = ['#ff2bd6', '#25d8ff', '#39ff6a', '#ffd400', '#b44dff', '#ff5a1f'];
  /* hauteurs du corps au repos (T-pose, mètres) */
  var BODY = { m: { neck: 1.52, head: [0, 1.715, .005], hr: .125 }, f: { neck: 1.485, head: [0, 1.675, .01], hr: .118 } };
  /* clés d'animation du jeu → clips */
  var ALIAS = { Idle: 'Idle_Loop', Walk: 'Walk_Loop', Run: 'Jog_Fwd_Loop', Sprint: 'Sprint_Loop', Death: 'Death01', Idle_Gun_Pointing: 'Pistol_Aim_Neutral' };
  var LEGS = /^(pelvis|thigh_|calf_|foot_|ball_)/;

  function C(h) { return new T.Color(h); }
  function load(f, cb) { if (F[f]) return cb && cb(); if (FB[f]) return; FB[f] = 1; new T.GLTFLoader().load(DIR + f, function (g) { F[f] = g; delete FB[f]; }, null, function () { F[f] = null; delete FB[f]; }); }
  function loadAnims() { if (AN || ABUSY) return; ABUSY = 1; new T.FileLoader().load(DIR + 'anims.json', function (txt) { try { var J = JSON.parse(txt), A = {}; Object.keys(J).forEach(function (k) { A[k] = T.AnimationClip.parse(J[k]); }); AN = A; } catch (e) { AN = {}; } }, null, function () { AN = {}; }); }
  function files(d) { var R = RC0[d.base], s = d.sex, f = [s + '_base.glb']; if (R.o === 'ranger' || R.add) f.push(s + '_ranger.glb'); if (R.o === 'peasant') f.push(s + '_peasant.glb'); if (R.hair) f.push('h_' + R.hair + '.glb'); if (R.beard) f.push('h_beard.glb'); return f; }
  function ready(d) { return AN && files(d).every(function (f) { return F[f] !== undefined && F[f] !== null; }); }
  function need(d) { loadAnims(); files(d).forEach(function (f) { if (F[f] === undefined) load(f); }); }
  /* clips par sexe : bassin remis à la bonne hauteur, et versions JAMBES / BUSTE séparées (on vise avec le buste en marchant) */
  function clips(sex) { if (CL[sex]) return CL[sex]; var r = sex === 'm' ? .949 / .917 : .932 / .917, out = {};
    Object.keys(AN).forEach(function (k) { var c = AN[k], tr = c.tracks.map(function (t) { if (t.name === 'pelvis.position') { var n = t.clone(); for (var i = 0; i < n.values.length; i++) n.values[i] *= r; return n; } return t; });
      out[k] = new T.AnimationClip(k, c.duration, tr);
      out['L:' + k] = new T.AnimationClip('L:' + k, c.duration, tr.filter(function (t) { return LEGS.test(t.name); }));
      out['U:' + k] = new T.AnimationClip('U:' + k, c.duration, tr.filter(function (t) { return !LEGS.test(t.name); })); });
    return (CL[sex] = out); }

  /* ---------- shaders ---------- */
  var HSV = 'vec3 qHsv(vec3 c){vec4 K=vec4(0.,-1./3.,2./3.,-1.);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);float e=1.0e-10;return vec3(abs(q.z+(q.w-q.y)/(6.*d+e)),d/(q.x+e),q.x);}\n';
  /* combinaison peinte sur le corps de base (coordonnées du corps au repos : vB) */
  function suitMat(m, U) { m.onBeforeCompile = function (s) { Object.assign(s.uniforms, U);
      s.vertexShader = 'varying vec3 vB;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvB = position;');
      s.fragmentShader = 'varying vec3 vB;\nuniform vec3 uC1,uC2,uC3,uTone;uniform float uPat,uNeck,uMet,uRgh,uMask,uEm,uAll,uNoFeet;\n' + HSV + s.fragmentShader
        .replace('#include <map_fragment>', [
          '#include <map_fragment>',
          'vec3 tx=diffuseColor.rgb; float lum=dot(tx,vec3(.2126,.7152,.0722)); float sh=clamp(lum/.30,.62,1.28);',
          'float X=abs(vB.x), Y=vB.y, Zf=step(.0,vB.z);',
          'float head=max(uAll,step(uNeck+.03,Y)*step(X,.2));',
          'float hand=step(.665,X), foot=1.-step(.135,Y), leg=1.-step(.93,Y), arm=step(.19,X)*step(1.25,Y); if(uNoFeet>.5&&Y<.3&&X<.3) discard;',
          'vec3 col=uC1; float gl=0.;',
          'if(uPat<.5){ col=mix(uC1,uC2,leg); col=mix(col,uC3,step(.035,abs(vB.z+.01))*0.+ (1.-step(.02,abs(X-.16)))*leg); col=mix(col,uC2,arm*step(.42,X)); }',
          'else if(uPat<1.5){ col=mix(uC2,uC1,smoothstep(.15,1.45,Y)); float em=1.-smoothstep(.055,.065,length(vec2(vB.x,Y-1.33))); col=mix(col,uC3,em*Zf); gl=em*Zf; col=mix(col,uC3,(1.-step(.012,abs(Y-.97)))); }',
          'else if(uPat<2.5){ col=uC1; col=mix(col,uC2,step(.17,X)*step(X,.44)*step(1.3,Y)); col=mix(col,uC2,step(.2,Y)*(1.-step(.55,Y))); col=mix(col,uC3,step(.93,Y)*(1.-step(1.,Y))); col=mix(col,uC2,step(1.05,Y)*(1.-step(1.13,Y))*(1.-arm)); }',
          'else if(uPat<3.5){ col=uC1; float v=step(1.08,Y)*step(Y,uNeck+.03)*step(X,(Y-1.08)*.42)*Zf; col=mix(col,uC2,v); float tie=v*(1.-step(.014,X))*step(Y,uNeck-.02); col=mix(col,uC3,tie); col=mix(col,uC2,hand*0.); }',
          'else if(uPat<4.5){ col=mix(uC1,uC2,leg*step(Y,.55)); float b=(1.-step(.025,abs(Y-1.16)))+(1.-step(.025,abs(Y-1.30)))*(1.-arm)+(1.-step(.022,abs(Y-.42)))+(1.-step(.022,abs(X-.5)))*arm; b=clamp(b,0.,1.); col=mix(col,uC3,b); gl=b*.35; }',
          'else { col=uC1; float l=(1.-step(.007,abs(X-.075)))*step(.2,Y)*(1.-arm)+(1.-step(.007,abs(Y-.98)))+(1.-step(.007,abs(Y-1.42)))*arm+(1.-step(.007,abs(Y-.5)))*leg+(1.-step(.008,abs(X-.4)))*arm; l=clamp(l,0.,1.); col=mix(col,uC2,l); gl=l; col=mix(col,uC3,step(.17,X)*step(X,.3)*step(1.3,Y)); }',
          'col=mix(col,uC3,max(hand,foot));',
          'float mk=uMask*step(uNeck-.01,Y)*step(Y,uNeck+.155)*step(X,.2)*step(-.02,vB.z);',
          'vec3 skin=tx*uTone; diffuseColor.rgb=mix(col*sh, skin, head*(1.-mk));',
          'float qS=1.-head*(1.-mk); vec3 qGlow=col*gl*uEm*qS;'
        ].join('\n'))
        .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor=mix(metalnessFactor,uMet,qS);')
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,uRgh,qS);')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=qGlow;'); };
    m.customProgramCacheKey = function () { return 'qsuit2'; }; }
  /* tissus d'une tenue recolorés (A = tissu principal, B = cuir / bas) ; peau des bras au bon teint */
  function clothMat(m, U, kind) { m.onBeforeCompile = function (s) { Object.assign(s.uniforms, U);
      s.fragmentShader = 'uniform vec3 uA,uB,uTone;uniform float uOnA,uOnB,uMet,uEm,uKind,uSkin;\n' + HSV + s.fragmentShader
        .replace('#include <map_fragment>', [
          '#include <map_fragment>',
          'vec3 tx=diffuseColor.rgb; vec3 h=qHsv(tx); float mA=0.,mB=0.; vec3 qGlow=vec3(0.);',
          'if(uSkin>.5){ diffuseColor.rgb=tx*uTone; }',
          'else { if(uKind<.5){ mA=(1.-smoothstep(.09,.13,abs(h.x-.33)))*step(.2,h.y); mB=step(h.x,.17)*step(.25,h.y)*(1.-mA); }',
          '  else { mA=smoothstep(.13,.22,h.z); mB=(1.-mA)*step(.2,h.y); }',
          '  vec3 rA=min(uA*h.z/(uKind<.5?.064:.36),vec3(1.)), rB=min(uB*h.z/(uKind<.5?.105:.07),vec3(1.));',
          '  diffuseColor.rgb=mix(tx,rA,mA*uOnA); diffuseColor.rgb=mix(diffuseColor.rgb,rB,mB*uOnB); qGlow=rA*mA*uOnA*uEm; }'
        ].join('\n'))
        .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor=mix(metalnessFactor,uMet,max(mA*uOnA,mB*uOnB*.6));')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=qGlow;'); };
    m.customProgramCacheKey = function () { return 'qcloth2'; }; }

  /* couleurs finales d'un skin (variante néon / or) */
  function pal(id) { var d = LIST[id], R = RC0[d.base], bi = +id.slice(1).split('_')[0], P = { c1: R.c1, c2: R.c2, c3: R.c3, A: R.A, B: R.B, met: 0, rgh: .55, em: 0, hc: R.hc };
    if (d.v === 'neon') { var n1 = NEON[bi % NEON.length], n2 = NEON[(bi + 2) % NEON.length]; P.c1 = '#121018'; P.c2 = n1; P.c3 = n2; P.A = n1; P.B = '#141018'; P.em = 1.1; P.rgh = .35; P.hc = n2; }
    else if (d.v === 'or') { P.c1 = '#e8b33a'; P.c2 = '#7a5410'; P.c3 = '#fff1b0'; P.A = '#f0c040'; P.B = '#6a4a12'; P.met = .9; P.rgh = .28; P.em = .12; }
    return P; }
  function U3(h) { return { value: C(h || '#808080') }; }
  function tone(t) { return new T.Color().setRGB(.26 + .74 * t, .17 + .83 * t, .13 + .87 * t); }
  function boneMap(o) { var B = {}; o.traverse(function (q) { if (q.isBone) B[q.name] = q; }); return B; }
  /* corps de base : seulement la tête et le cou (sous une tenue) */
  function headOnly(g, sex) { var k = sex + g.uuid; if (GEO[k]) return GEO[k]; var p = g.attributes.position, ix = g.index, out = [], ny = BODY[sex].neck - .015;
    for (var i = 0; i < ix.count; i += 3) { var ok = true; for (var j = 0; j < 3 && ok; j++) { var v = ix.getX(i + j); if (p.getY(v) < ny || Math.abs(p.getX(v)) > .2) ok = false; } if (ok) out.push(ix.getX(i), ix.getX(i + 1), ix.getX(i + 2)); }
    var n = g.clone(); n.setIndex(out); n.groups = []; return (GEO[k] = n); }
  /* colle les morceaux d'une tenue sur le squelette du perso */
  function graft(o, file, pick) { var B = boneMap(o), host = null; o.traverse(function (q) { if (q.isSkinnedMesh && !host) host = q; });
    var src = T.SkeletonUtils.clone(F[file].scene), list = []; src.updateMatrixWorld(true); src.traverse(function (m) { if (m.isSkinnedMesh && pick(m.name)) list.push(m); });
    list.forEach(function (m) { var bones = m.skeleton.bones.map(function (b) { return B[b.name]; }); if (bones.some(function (b) { return !b; })) return; var sk = new T.Skeleton(bones, m.skeleton.boneInverses.map(function (x) { return x.clone(); }));
      host.parent.add(m); m.position.set(0, 0, 0); m.quaternion.identity(); m.scale.set(1, 1, 1); m.updateMatrixWorld(true); m.bind(sk, m.matrixWorld.clone()); });
    return list; }
  function std(m) { var n = m.clone(); n.skinning = true; if (n.metalness == null || n.metalness > .9) n.metalness = 0; return n; }
  /* accessoires accrochés à l'os de la tête (posés dans le repère du corps au repos) */
  function attach(B, obj, sex) { var hb = B.Head; hb.updateMatrixWorld(true); obj.updateMatrixWorld(true); var m = new T.Matrix4().copy(hb.matrixWorld).invert().multiply(obj.matrixWorld); m.decompose(obj.position, obj.quaternion, obj.scale); hb.add(obj); }
  function accessory(kind, sex, P, R) { var H = BODY[sex], g = new T.Group(), hr = H.hr; g.position.set(H.head[0], H.head[1], H.head[2]);
    var gold = new T.MeshStandardMaterial({ color: C('#ffc93a'), metalness: .9, roughness: .25, emissive: C('#5a3a00'), emissiveIntensity: .3 });
    if (kind === 'casque') { var shell = new T.MeshStandardMaterial({ color: C(P.c1 === '#121018' ? '#20202a' : P.c1), metalness: P.met, roughness: .3 }), vis = new T.MeshStandardMaterial({ color: C(R.vis || '#ff9a3a'), metalness: .9, roughness: .05, emissive: C(R.vis || '#ff7a1a'), emissiveIntensity: P.em ? .9 : .35 });
      var s = new T.Mesh(new T.SphereGeometry(hr * 1.32, 40, 28), shell); s.scale.set(1, 1.08, 1.06); s.position.y = .01; g.add(s);
      var v = new T.Mesh(new T.SphereGeometry(hr * 1.36, 40, 20, Math.PI * .18, Math.PI * .64, Math.PI * .3, Math.PI * .32), vis); v.rotation.y = 0; v.scale.set(1, 1.05, 1.1); v.position.set(0, .0, .004); g.add(v);
      var ring = new T.Mesh(new T.TorusGeometry(hr * 1.02, .018, 10, 40), shell); ring.rotation.x = Math.PI / 2; ring.position.y = -hr * 1.15; g.add(ring); }
    else if (kind === 'chantier') { var hm = new T.MeshStandardMaterial({ color: C(P.v === 'or' ? '#f0c040' : '#ffd400'), metalness: P.met, roughness: .35, emissive: C('#3a2a00'), emissiveIntensity: P.em ? .5 : .05 });
      var d = new T.Mesh(new T.SphereGeometry(hr * 1.12, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2), hm); d.scale.set(1, .95, 1.12); d.position.y = hr * .3; g.add(d);
      var br = new T.Mesh(new T.CylinderGeometry(hr * 1.3, hr * 1.32, .012, 36), hm); br.scale.z = 1.2; br.position.set(0, hr * .3, .02); g.add(br);
      var rid = new T.Mesh(new T.BoxGeometry(.03, .025, hr * 2.3), hm); rid.position.y = hr * 1.35; g.add(rid); }
    else if (kind === 'couronne') { var base = new T.Mesh(new T.CylinderGeometry(hr * 1.02, hr * .98, .05, 32, 1, true), gold); base.position.y = hr * .95; g.add(base);
      for (var i = 0; i < 8; i++) { var a = i / 8 * Math.PI * 2, sp = new T.Mesh(new T.ConeGeometry(.018, .07, 6), gold); sp.position.set(Math.sin(a) * hr, hr * .95 + .055, Math.cos(a) * hr); g.add(sp);
        var gem = new T.Mesh(new T.SphereGeometry(.011, 10, 8), new T.MeshStandardMaterial({ color: C(i % 2 ? '#e0103a' : '#1a6aff'), roughness: .1, metalness: .2, emissive: C(i % 2 ? '#600010' : '#0a2060'), emissiveIntensity: .6 })); gem.position.set(Math.sin(a) * hr * 1.02, hr * .95, Math.cos(a) * hr * 1.02); g.add(gem); } }
    g.traverse(function (q) { if (q.isMesh) { q.castShadow = true; q.frustumCulled = false; } }); return g; }

  /* construit le modèle complet d'un skin */
  function build(id) { var d = LIST[id], R = RC0[d.base], s = d.sex, P = pal(id); P.v = d.v;
    var o = T.SkeletonUtils.clone(F[s + '_base.glb'].scene); o.updateMatrixWorld(true); var B = boneMap(o), body = null, tn = tone(R.tone == null ? 1 : R.tone);
    o.traverse(function (q) { if (q.isSkinnedMesh && /Superhero/i.test(q.name)) body = q; });
    var hairMat = null; o.traverse(function (q) { if (!q.isMesh) return; var mt = std(q.material); if (/Hair/.test(q.material.name)) { mt.color = C(P.hc).lerp(C('#2a1a10'), .6); mt.side = T.DoubleSide; hairMat = mt; } q.material = mt; });
    var suit = R.o === 'suit';
    var bu = { uC1: U3(P.c1), uC2: U3(P.c2), uC3: U3(P.c3), uTone: { value: tn }, uPat: { value: suit ? R.pat : 0 }, uNeck: { value: BODY[s].neck }, uMet: { value: P.met }, uRgh: { value: P.rgh }, uMask: { value: R.mask ? 1 : 0 }, uEm: { value: P.em }, uAll: { value: suit ? 0 : 1 }, uNoFeet: { value: suit && R.add && R.add.some(function (a) { return /Feet/.test(a); }) ? 1 : 0 } };
    if (body) { if (!suit) body.geometry = headOnly(body.geometry, s); suitMat(body.material, bu); }
    var cu = function (kind, skin) { return { uA: U3(P.A || '#808080'), uB: U3(P.B || '#808080'), uTone: { value: tn }, uOnA: { value: P.A ? 1 : 0 }, uOnB: { value: P.B ? 1 : 0 }, uMet: { value: P.met }, uEm: { value: P.em }, uKind: { value: kind }, uSkin: { value: skin ? 1 : 0 } }; };
    var dress = function (list, kind) { list.forEach(function (m) { var mt = std(m.material), skin = /Regular/.test(m.material.name); clothMat(mt, cu(kind, skin)); m.material = mt; }); };
    var hood = R.o === 'ranger' && !(R.hide || []).some(function (h) { return h === 'Hood'; });
    if (R.o === 'ranger') dress(graft(o, s + '_ranger.glb', function (n) { return !(R.hide || []).some(function (h) { return n.indexOf(h) >= 0; }); }), 0);
    else if (R.o === 'peasant') dress(graft(o, s + '_peasant.glb', function () { return true; }), 1);
    else if (R.add) dress(graft(o, s + '_ranger.glb', function (n) { return R.add.some(function (h) { return n.indexOf(h) >= 0; }) && !/Head_Hood/.test(n); }), 0);
    var bare = R.acc !== 'casque' && !hood;
    var hairM = new T.MeshStandardMaterial({ color: C(P.hc), roughness: .62, metalness: P.met * .5, skinning: true, emissive: C(P.hc), emissiveIntensity: P.em ? .35 : 0 }), hairUse = function (m) { m.material = hairM; };
    if (R.hair && bare && F['h_' + R.hair + '.glb']) graft(o, 'h_' + R.hair + '.glb', function () { return true; }).forEach(hairUse);
    if (R.beard && R.acc !== 'casque' && F['h_beard.glb']) graft(o, 'h_beard.glb', function () { return true; }).forEach(hairUse);
    if (R.acc) attach(B, accessory(R.acc, s, P, R), s);
    o.traverse(function (q) { if (q.isMesh) { q.castShadow = true; q.receiveShadow = false; q.frustumCulled = false; } });
    return o; }

  var V = function () { return new T.Vector3(); }, Qn = function () { return new T.Quaternion(); };
  var LIMBS = [['upperarm_l', 'lowerarm_l', 'aL'], ['lowerarm_l', 'hand_l', 'eL'], ['upperarm_r', 'lowerarm_r', 'aR'], ['lowerarm_r', 'hand_r', 'eR'], ['thigh_l', 'calf_l', 'lL'], ['calf_l', 'foot_l', 'kL'], ['thigh_r', 'calf_r', 'lR'], ['calf_r', 'foot_r', 'kR']];
  var POSE = ['pelvis', 'spine_01', 'spine_02', 'spine_03', 'neck_01', 'Head', 'clavicle_l', 'upperarm_l', 'lowerarm_l', 'hand_l', 'clavicle_r', 'upperarm_r', 'lowerarm_r', 'hand_r', 'thigh_l', 'calf_l', 'foot_l', 'ball_l', 'thigh_r', 'calf_r', 'foot_r', 'ball_r'];
  var QS = window.QS = {
    LIST: LIST, BASES: BASES, V2: 1,
    load: function (TT) { T = TT; },
    has: function (id) { var d = LIST[id]; return !!(d && ready(d)); },
    prefetch: function (id) { var d = LIST[id]; if (d && T) need(d); },
    apply: function (c, id) { if (!T || !c || c.qs === id) return !!c.qs; var d = LIST[id]; if (!d) return false; if (!ready(d)) { need(d); return false; }
      if (c.qs) QS.remove(c); var o = build(id), g = new T.Group(); g.add(o);
      o.updateMatrixWorld(true); var bb = new T.Box3(); o.traverse(function (q) { if (q.isSkinnedMesh && q.geometry.boundingBox == null) q.geometry.computeBoundingBox(); }); bb.setFromObject(o); var h = Math.max(bb.max.y - bb.min.y, .5);
      if (h > 2.4) h = d.sex === 'm' ? 1.81 : 1.77;
      var B = boneMap(o), s = 1.9 / .9 / h; o.scale.setScalar(s); o.position.y = -Math.min(0, bb.min.y) * s; g.rotation.y = Math.PI / 2; c.root.add(g);
      c.root.traverse(function (q) { if ((q.isMesh || q.isSkinnedMesh) && !q.userData.keep && q !== c.shadow && !(c.glider && isChild(q, c.glider)) && !(c.gunHold && isChild(q, c.gunHold)) && !isChild(q, g)) { q.userData.qHid = true; q.visible = false; } });
      var mix = new T.AnimationMixer(o), CLP = clips(d.sex), A = {}; Object.keys(CLP).forEach(function (k) { A[k] = mix.clipAction(CLP[k]); A[k].w = 0; });
      ['Death01', 'Jump_Start', 'Jump_Land', 'Pistol_Shoot', 'Roll', 'Punch_Cross', 'Interact', 'Hit_Chest', 'Chest_Open'].forEach(function (k) { [k, 'L:' + k, 'U:' + k].forEach(function (kk) { if (A[kk]) { A[kk].setLoop(T.LoopOnce); A[kk].clampWhenFinished = true; } }); });
      c.qs = id; c.qg = g; c.qo = o; c.qB = B; c.qMix = mix; c.qA = A; c.qCur = null; c.qSnap = null; c.qMode = 'clip'; c.qOut = null; c.qBones = []; o.traverse(function (q) { if (q.isBone) c.qBones.push(q); });
      c.root.updateMatrixWorld(true); var rq = Qn(); c.root.getWorldQuaternion(rq); rq.invert(); c.qRest = {}; c.qRestL = {}; c.qRestP = {};
      POSE.forEach(function (n) { var b = B[n]; if (!b) return; c.qRestL[n] = b.quaternion.clone(); c.qRestP[n] = b.position.clone(); c.qRest[n] = rq.clone().multiply(b.getWorldQuaternion(Qn())); });
      /* arme dans la vraie main droite : orientation prise sur la pose « pistolet visé » */
      var aim = A.Pistol_Aim_Neutral;
      if (aim && B.hand_r && c.gunHold) { aim.play(); aim.setEffectiveWeight(1); mix.update(.05); o.updateMatrixWorld(true); var wq = B.hand_r.getWorldQuaternion(Qn()), cq = c.root.getWorldQuaternion(Qn()), ws = B.hand_r.getWorldScale(V()).x;
        c.qGunQ = wq.clone().invert().multiply(cq); c.qGunS = .9 / ws; aim.stop(); mix.update(0);
        c.qGunP = c.gunHold.parent; c.qGunPos = c.gunHold.position.clone(); c.qGunRot = c.gunHold.quaternion.clone();
        B.hand_r.add(c.gunHold); c.gunHold.position.set(.02 / ws, .085 / ws, .03 / ws); c.gunHold.quaternion.copy(c.qGunQ); c.gunHold.scale.setScalar(c.qGunS); }
      POSE.forEach(function (n) { if (B[n]) { B[n].quaternion.copy(c.qRestL[n]); B[n].position.copy(c.qRestP[n]); } });
      return true; },
    remove: function (c) { if (!c || !c.qs) return; if (c.qGunP && c.gunHold) { c.qGunP.add(c.gunHold); c.gunHold.position.copy(c.qGunPos); c.gunHold.quaternion.copy(c.qGunRot); c.gunHold.scale.setScalar(1); }
      if (c.qMix) c.qMix.stopAllAction(); c.root.remove(c.qg); c.qs = null; c.qg = c.qo = c.qMix = null; c.root.traverse(function (q) { if (q.userData.qHid) { q.visible = true; q.userData.qHid = false; } }); },
    /* st : { pose: true } (copie la pose du jeu) ou { clip, ts, up, legs, aim (-1..1) } */
    drive: function (c, st, dt, pitch) { if (!c.qs || !c.qMix) return; var B = c.qB, A = c.qA, mode = st.pose ? 'pose' : 'clip';
      if (mode !== c.qMode) { c.qSnap = {}; POSE.forEach(function (n) { if (B[n]) c.qSnap[n] = [B[n].quaternion.clone(), B[n].position.clone()]; }); c.qSnT = 0; c.qMode = mode;
        if (mode === 'pose') { Object.keys(A).forEach(function (k) { if (A[k].w) { A[k].w = 0; A[k].stop(); } }); c.qOut = null; } }
      if (mode === 'clip') {
        /* poids voulus : soit le clip entier, soit jambes (L:) + buste (U:) */
        var want = {}, cl = ALIAS[st.clip] || st.clip; if (!A[cl]) cl = 'Idle_Loop';
        if (st.up) { var lg = ALIAS[st.legs] || st.legs || cl; if (!A['L:' + lg]) lg = 'Idle_Loop'; want['L:' + lg] = 1; var ap = Math.max(-1, Math.min(1, (pitch || 0) / .8));
          want['U:Pistol_Aim_Neutral'] = 1 - Math.abs(ap); if (ap > 0) want['U:Pistol_Aim_Up'] = ap; else if (ap < 0) want['U:Pistol_Aim_Down'] = -ap; }
        else want[cl] = 1;
        var fade = dt / .16;
        if (c.qOut) for (var i = 0; i < c.qBones.length; i++) { var b = c.qBones[i], o2 = c.qOut[i]; if (o2) { b.quaternion.copy(o2[0]); b.position.copy(o2[1]); } }
        Object.keys(A).forEach(function (k) { var a = A[k], tw = want[k] || 0; if (!a.w && !tw) return;
          if (tw && !a.isRunning()) { if (!a.w || a.getClip().duration && a.loop === T.LoopOnce && !a.w) a.reset(); a.play(); }
          var aimK = /^U:Pistol_Aim/.test(k); a.w = aimK && a.w && tw ? tw : (tw > a.w ? Math.min(tw, a.w + fade) : Math.max(tw, a.w - fade));
          a.setEffectiveWeight(a.w); if (k.indexOf(':') < 0 || k.indexOf('L:') === 0) a.timeScale = st.ts || 1; else a.timeScale = 1;
          if (!a.w && !tw) a.stop(); });
        /* phases alignées : jambes seules et clip entier restent synchronisés */
        c.qMix.update(dt);
        c.qOut = c.qOut || []; for (var j = 0; j < c.qBones.length; j++) { var bb2 = c.qBones[j], q2 = c.qOut[j] || (c.qOut[j] = [Qn(), V()]); q2[0].copy(bb2.quaternion); q2[1].copy(bb2.position); } }
      else QS.copyPose(c);
      if (c.qSnap) { c.qSnT += dt / .2; var k2 = Math.min(1, c.qSnT), e = k2 * k2 * (3 - 2 * k2); POSE.forEach(function (n) { var b = B[n], s = c.qSnap[n]; if (!b || !s) return; b.quaternion.copy(s[0].clone().slerp(b.quaternion, e)); b.position.lerpVectors(s[1], b.position.clone(), e); }); if (k2 >= 1) c.qSnap = null; } },
    /* copie la pose du squelette simple (anim.js) sur le modèle détaillé */
    copyPose: function (c) { var B = c.qB, R = c.qRest; c.root.updateMatrixWorld(true);
      POSE.forEach(function (n) { if (B[n] && c.qRestL[n]) { B[n].quaternion.copy(c.qRestL[n]); B[n].position.copy(c.qRestP[n]); } });
      var setW = function (b, wq) { var pq = b.parent.getWorldQuaternion(Qn()); b.quaternion.copy(pq.invert().multiply(wq)); b.updateMatrixWorld(true); };
      if (B.pelvis && c.body) { setW(B.pelvis, c.body.getWorldQuaternion(Qn()).multiply(R.pelvis)); var d = c.body.position.y; if (d) { var bw = B.pelvis.getWorldPosition(V()); bw.y += d * .9 * c.root.scale.y; B.pelvis.position.copy(B.pelvis.parent.worldToLocal(bw)); B.pelvis.updateMatrixWorld(true); } }
      if (B.spine_01 && c.body) ['spine_01', 'spine_02', 'spine_03'].forEach(function (n) { setW(B[n], c.body.getWorldQuaternion(Qn()).multiply(R[n])); });
      if (B.Head && c.head) { setW(B.neck_01, c.head.getWorldQuaternion(Qn()).slerp(c.body.getWorldQuaternion(Qn()), .5).multiply(R.neck_01)); setW(B.Head, c.head.getWorldQuaternion(Qn()).multiply(R.Head)); }
      var rq = c.root.getWorldQuaternion(Qn());
      LIMBS.forEach(function (L) { var b = B[L[0]], ch = B[L[1]], src = c[L[2]]; if (!b || !ch || !src) return; b.updateMatrixWorld(true);
        var cur = ch.getWorldPosition(V()).sub(b.getWorldPosition(V())).normalize(), tgt = V().set(0, -1, 0).applyQuaternion(src.getWorldQuaternion(Qn())).normalize();
        setW(b, b.getWorldQuaternion(Qn()).premultiply(Qn().setFromUnitVectors(cur, tgt)));
        if (L[1] === 'foot_l' || L[1] === 'foot_r') setW(ch, rq.clone().multiply(R[L[1]])); }); },
    /* état du perso → animation */
    pick: function (o) { if (o.pose) return { pose: true }; if (o.dead) return { clip: 'Death01' };
      var sp = o.sp || 0, loco;
      if (o.veh) loco = { clip: 'Driving_Loop' };
      else if (o.swim) loco = { clip: sp > .5 ? 'Swim_Fwd_Loop' : 'Swim_Idle_Loop', ts: Math.max(.7, Math.min(1.4, sp / 3)) };
      else if (o.slide) loco = { clip: 'Slide_Loop' };
      else if (o.air) loco = { clip: 'Jump_Loop' };
      else if (o.crouch) loco = sp > .4 ? { clip: 'Crouch_Fwd_Loop', ts: Math.max(.7, Math.min(1.6, sp / 2.2)) } : { clip: 'Crouch_Idle_Loop' };
      else if (sp > 6.2) loco = { clip: 'Sprint_Loop', ts: Math.max(.8, Math.min(1.35, sp / 7.5)) };
      else if (sp > 2.6) loco = { clip: 'Jog_Fwd_Loop', ts: Math.max(.75, Math.min(1.45, sp / 4.6)) };
      else if (sp > .45) loco = { clip: 'Walk_Loop', ts: Math.max(.7, Math.min(1.6, sp / 1.5)) };
      else loco = { clip: 'Idle_Loop' };
      if (o.armed && !o.veh && !o.swim) return { up: true, legs: loco.clip, clip: loco.clip, ts: loco.ts };
      return loco; }
  };
  function isChild(q, p) { while (q) { if (q === p) return true; q = q.parent; } return false; }
  QS.poseNow = function (c) { if (c.qs !== c.qWant) QS.apply(c, c.qWant); if (!c.qs) return; var now = performance.now(), dt = Math.min(.1, (now - (c.qT || now)) / 1000) || .016; c.qT = now; QS.drive(c, { pose: true }, dt); };
  if (window.ANIM) { var oa = ANIM.apply; ANIM.apply = function (c, o, g) { oa(c, o, g); if (c && c.qWant && !c.qSelf && T) QS.poseNow(c); }; }
  if (window.THREE) T = window.THREE;
})();
