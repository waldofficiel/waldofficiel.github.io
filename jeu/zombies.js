/* Wald Royal : ZOMBIES du mode survie (window.ZOMB).
   ~90 zombies répartis dans le monde (camps en ruine, forêts sombres, partout). 4 sortes : rôdeur, brute, coureur, « bizarre » (grosse tête).
   Ils dorment loin du joueur, errent, puis foncent sur lui quand ils le voient (plus loin la nuit) ; ils tapent les murs qui les bloquent
   (constructions comprises) et montent les rampes. Le but : tous les tuer. Les morts sont gardés dans la sauvegarde (survie.js).
   Modèles : le squelette commun des persos (skins.js, skin « zombie »), 16 modèles réutilisés pour les zombies les plus proches. */
(function () {
  var T, C, Z = [], POOL = [], NPOOL = 16, built = 0, onKill = null, A;
  /* CRÉATURES : 32 espèces de la Brume Violette, plus ou moins rares (w = poids d'apparition), certaines seulement la nuit.
     Elles réapparaissent à l'infini loin du joueur (population POP). Chaque espèce a sa fiche dans le LIVRE DES CRÉATURES (survie.js). */
  var KIND = [
    { id: 'rodeur', name: 'Rôdeur', hp: 100, walk: 1.1, run: 3.5, dmg: 12, sc: 1, m: 0, w: 30, rar: 'Commun' },
    { id: 'brute', name: 'Brute', hp: 280, walk: .9, run: 2.7, dmg: 26, sc: 1.32, m: 1, w: 12, rar: 'Peu commun' },
    { id: 'coureur', name: 'Coureur', hp: 70, walk: 1.4, run: 5.6, dmg: 9, sc: .93, m: 2, w: 22, rar: 'Commun' },
    { id: 'bizarre', name: 'Bizarre', hp: 150, walk: 1, run: 3.9, dmg: 15, sc: 1.05, m: 3, w: 12, rar: 'Peu commun' },
    { id: 'hurleur', name: 'Hurleur', hp: 160, walk: 1.2, run: 4.6, dmg: 16, sc: 1.08, m: 3, w: 5, rar: 'Rare', o: { SK: '#d89ad0', SH: '#5a2a5a', eye: '#ff2bd6', spikes: 1 } },
    { id: 'colosse', name: 'Colosse de mousse', hp: 650, walk: .7, run: 2.1, dmg: 38, sc: 1.75, m: 1, w: 3, rar: 'Rare', o: { SK: '#6a8a4a', SH: '#3a5a2a', PA: '#2a3a1a', eye: '#c8ff2a', moss: 1 } },
    { id: 'spectre', name: 'Spectre des brumes', hp: 120, walk: 1.6, run: 6.4, dmg: 20, sc: 1, m: 2, w: 3, rar: 'Épique', night: 1, o: { SK: '#c8e0ff', SH: '#6a88c8', PA: '#3a4a7a', eye: '#3dd6ff' } },
    { id: 'roi', name: 'Roi Violet', hp: 1200, walk: .9, run: 3.2, dmg: 45, sc: 1.55, m: 1, w: .6, rar: 'Légendaire', o: { SK: '#9a5ac8', SH: '#2a0a4a', PA: '#1a0630', eye: '#ffd23d', crown: 1 } },
    /* ---- 24 nouvelles espèces : an = façon de bouger (crawl rampe, hop saute, sway titube, charge fonce, float flotte, stomp lourd, claw griffes levées, twitch saccades, flail moulinets) ---- */
    { id: 'noye', name: 'Noyé', hp: 110, walk: 1, run: 3.4, dmg: 12, sc: 1, m: 0, w: 16, rar: 'Commun', an: 'sway', o: { SK: '#7aa0a8', SH: '#2a4a5a', PA: '#1a2a3a', eye: '#3dd6ff', fins: '#3a6a7a' }, d: "Repêché par la Brume au fond du lac. Il titube, trempé, et laisse des flaques derrière lui. On l'entend respirer comme sous l'eau." },
    { id: 'rampant', name: 'Rampant', hp: 60, walk: 1.2, run: 4.4, dmg: 10, sc: .92, m: 2, w: 16, rar: 'Commun', an: 'crawl', o: { SK: '#9aa88a', SH: '#4a4a3a', eye: '#e8ff4a' }, d: "Il a perdu l'envie de marcher. À quatre pattes dans les hautes herbes, il surgit au dernier moment. Regarde toujours où tu mets les pieds." },
    { id: 'fermier', name: 'Fermier pourri', hp: 140, walk: .9, run: 3, dmg: 15, sc: 1.08, m: 0, w: 14, rar: 'Commun', an: 'stomp', o: { SK: '#a8b07a', SH: '#8a6a3a', PA: '#3a4a7a' }, d: "Il garde encore ses champs. La nuit, il arrose des citrouilles qui n'existent plus. Ne marche pas sur ses plants." },
    { id: 'momie', name: 'Momie des sables', hp: 170, walk: .8, run: 2.8, dmg: 16, sc: 1.05, m: 0, w: 10, rar: 'Commun', an: 'stomp', o: { SK: '#c8b48a', SH: '#a89870', PA: '#8a7a5a', eye: '#ffb52e', wrap: 1 }, d: "Le vent du sud-est aride l'a enroulée dans des bandelettes. Lente, mais elle ne lâche jamais une piste." },
    { id: 'osdur', name: 'Os-Sec', hp: 90, walk: 1.3, run: 4.8, dmg: 13, sc: .98, m: 2, w: 12, rar: 'Commun', an: 'twitch', o: { SK: '#e8e0c8', SH: '#3a3a3a', PA: '#2a2a2a', eye: '#ff3a3a', bones: 1 }, d: "Il ne reste presque que les os. Il claque des dents et avance par à-coups. Un bon coup de pioche le démonte." },
    { id: 'sauteur', name: 'Sauteur', hp: 80, walk: 1.4, run: 5.2, dmg: 12, sc: .86, m: 3, w: 12, rar: 'Commun', an: 'hop', o: { SK: '#b0d080', SH: '#3a6a2a', eye: '#c8ff2a' }, d: "Il bondit comme une grenouille et retombe sur ses proies. Vise-le au sommet de son saut." },
    { id: 'champi', name: 'Champignard', hp: 180, walk: .9, run: 3.2, dmg: 17, sc: 1.05, m: 0, w: 9, rar: 'Peu commun', an: 'sway', o: { SK: '#b8a888', SH: '#6a4a3a', shroom: '#d83a3a', eye: '#ffd23d' }, d: "Des champignons rouges ont poussé sur sa tête et son dos. Quand il tombe, les spores s'envolent. Surtout dans les forêts sombres." },
    { id: 'cornu', name: 'Cornu', hp: 220, walk: 1, run: 5, dmg: 24, sc: 1.12, m: 1, w: 8, rar: 'Peu commun', an: 'charge', o: { SK: '#a87a6a', SH: '#4a2a2a', horns: 1, eye: '#ff6a2a' }, d: "Deux cornes lui ont poussé sur le front. Il baisse la tête et charge en ligne droite : écarte-toi au dernier moment." },
    { id: 'gele', name: 'Gelé', hp: 240, walk: .8, run: 2.6, dmg: 20, sc: 1.1, m: 0, w: 8, rar: 'Peu commun', an: 'stomp', o: { SK: '#c8e8f0', SH: '#6a8aa8', PA: '#3a5a7a', crystal: '#9ae8ff', eye: '#ffffff' }, d: "Il vit sur les montagnes enneigées. Des cristaux de glace lui sortent du dos. Ses coups te glacent jusqu'aux os." },
    { id: 'braise', name: 'Braise', hp: 200, walk: 1.1, run: 4, dmg: 22, sc: 1.05, m: 0, w: 7, rar: 'Peu commun', an: 'flail', o: { SK: '#5a3a3a', SH: '#2a1a1a', PA: '#1a1010', lava: 1, eye: '#ff8a2a' }, d: "Sa peau craque et laisse voir des braises. Il moulinette des bras en fumant. Ne le laisse pas approcher de ta base en bois." },
    { id: 'cultiste', name: 'Cultiste violet', hp: 160, walk: 1, run: 4.2, dmg: 18, sc: 1, m: 0, w: 7, rar: 'Peu commun', an: 'claw', o: { SK: '#b0a0c0', SH: '#2a0a3a', PA: '#1a0628', hood: '#3a0a5a', eye: '#ff2bd6' }, d: "Ils vénèrent la Brume Violette, capuche sur la tête, bras levés. Là où il y en a un, le Roi n'est jamais très loin." },
    { id: 'mineur', name: 'Mineur cristallin', hp: 260, walk: .9, run: 3, dmg: 21, sc: 1.15, m: 1, w: 6, rar: 'Peu commun', an: 'stomp', o: { SK: '#9a9aa8', SH: '#4a4a3a', crystal: '#7a5aff', eye: '#7a5aff' }, d: "Il est resté trop longtemps près du minerai bleu. Les cristaux violets ont poussé dans sa chair. Il en lâche parfois en mourant." },
    { id: 'bossu', name: 'Bossu', hp: 190, walk: .8, run: 3.4, dmg: 18, sc: 1.02, m: 3, w: 7, rar: 'Peu commun', an: 'stomp', o: { SK: '#a8b090', SH: '#5a4a3a', hump: 1, hs: 1.1, eye: '#e8ff4a' }, d: "Une énorme bosse dans le dos le force à marcher plié en deux. Il renifle le sol pour suivre ta trace." },
    { id: 'pleureur', name: 'Pleureur', hp: 120, walk: 1, run: 3.6, dmg: 14, sc: 1, m: 0, w: 6, rar: 'Peu commun', an: 'sway', o: { SK: '#d8d8e0', SH: '#5a5a6a', PA: '#3a3a4a', eye: '#ffffff' }, d: "Il pleure sans arrêt, et ses sanglots attirent les autres créatures. Fais-le taire vite." },
    { id: 'cerf', name: 'Cerf maudit', hp: 420, walk: 1.2, run: 5.4, dmg: 30, sc: 1.32, m: 1, w: 3, rar: 'Rare', an: 'charge', o: { SK: '#8a6a4a', SH: '#3a2a1a', PA: '#2a1a0a', antlers: 1, eye: '#c8ff2a' }, d: "Un garde-forestier changé en bête, avec des bois de cerf sur la tête. Il défend la forêt sombre et charge tout ce qui bouge." },
    { id: 'tisseuse', name: 'Tisseuse', hp: 200, walk: 1.5, run: 6, dmg: 19, sc: .95, m: 2, w: 3, rar: 'Rare', an: 'crawl', o: { SK: '#4a3a4a', SH: '#1a1020', PA: '#100a14', spikes: 1, eyes3: 1, eye: '#ff3a3a' }, d: "Elle court à quatre pattes plus vite qu'un coureur et a trois yeux rouges. Elle vit dans les ruines et les grottes." },
    { id: 'trioeil', name: 'Trioeil', hp: 260, walk: 1, run: 4, dmg: 20, sc: 1.08, m: 3, w: 3, rar: 'Rare', an: 'twitch', o: { SK: '#c8a0d8', SH: '#4a2a5a', eyes3: 1, hs: 1.15, eye: '#3dd6ff' }, d: "Un troisième œil s'est ouvert sur son front. Il voit à travers la brume et ne se laisse jamais surprendre." },
    { id: 'sanguin', name: 'Rôdeur sanguin', hp: 180, walk: 1.4, run: 6.2, dmg: 24, sc: 1.02, m: 2, w: 3, rar: 'Rare', night: 1, an: 'charge', o: { SK: '#a83a3a', SH: '#3a0a0a', PA: '#1a0606', eye: '#ff2020', tusks: 1 }, d: "Rouge sang, avec des crocs. Il ne sort que la nuit et suit l'odeur des blessés. Soigne-toi avant le coucher du soleil." },
    { id: 'capitaine', name: 'Capitaine naufragé', hp: 380, walk: .9, run: 3.4, dmg: 28, sc: 1.2, m: 1, w: 2.5, rar: 'Rare', an: 'stomp', o: { SK: '#7aa0a0', SH: '#1a2a5a', PA: '#1a1a2a', fins: '#2a5a6a', eye: '#3dd6ff', tusks: 1 }, d: "Le capitaine du bateau échoué à la Plage des Naufragés. Il cherche encore son équipage… qui marche derrière lui." },
    { id: 'ombre', name: 'Ombre', hp: 220, walk: 1.8, run: 7, dmg: 26, sc: 1.05, m: 2, w: 1.8, rar: 'Épique', night: 1, an: 'float', o: { SK: '#1a1020', SH: '#0a0610', PA: '#06040a', hood: '#0a0610', eye: '#ff2bd6' }, d: "Une silhouette noire qui flotte au-dessus du sol, seuls ses yeux roses brillent. Elle disparaît dès que le jour se lève." },
    { id: 'reine', name: 'Reine des spores', hp: 700, walk: .8, run: 2.8, dmg: 32, sc: 1.45, m: 3, w: 1.2, rar: 'Épique', an: 'float', o: { SK: '#c8a0b8', SH: '#5a2a4a', shroom: '#ff2bd6', eye: '#ff2bd6' }, d: "La mère de tous les Champignards. Des champignons roses géants couvrent son corps, et elle flotte dans un nuage de spores." },
    { id: 'brasier', name: 'Seigneur Brasier', hp: 1000, walk: .9, run: 3.4, dmg: 42, sc: 1.6, m: 1, w: .9, rar: 'Épique', an: 'stomp', o: { SK: '#3a2020', SH: '#1a0a0a', PA: '#100606', lava: 1, horns: '#e8a060', eye: '#ff8a2a' }, d: "Un géant de lave et de cornes noires. Le sol fume là où il passe. Seuls le métal et la pierre lui résistent." },
    { id: 'titan', name: 'Titan de givre', hp: 1100, walk: .7, run: 2.4, dmg: 44, sc: 1.85, m: 1, w: .8, rar: 'Épique', an: 'stomp', o: { SK: '#b8d8e8', SH: '#4a6a8a', PA: '#2a3a5a', crystal: '#bff4ff', eye: '#ffffff' }, d: "Il dort sous la neige des plus hautes montagnes. Quand il se réveille, la tempête de neige se lève avec lui." },
    { id: 'devoreur', name: 'Dévoreur des cimes', hp: 1600, walk: 1, run: 4.4, dmg: 50, sc: 2.05, m: 1, w: .4, rar: 'Légendaire', night: 1, an: 'stomp', o: { SK: '#d8d0c0', SH: '#2a2020', PA: '#1a1414', antlers: 1, bones: 1, eye: '#3dd6ff' }, d: "Une légende des montagnes : un squelette géant avec des bois immenses, qui ne descend des cimes que les nuits sans lune." }];
  var POP = 110, RESP = [], NID = 0;
  function pickKind(night) { var tot = 0, ws = KIND.map(function (k) { var w = k.night && !night ? 0 : k.w * (night && k.w < 6 ? 2 : 1); tot += w; return w; }), r = Math.random() * tot; for (var i = 0; i < ws.length; i++) { r -= ws[i]; if (r <= 0) return i; } return 0; }
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function gen() {
    var r = rng(9090), id = 0;
    function add(x, z) { if (!C.onLand(x, z) || C.inLake(x, z, 3) || C.hgt(x, z) > 70) return false; var k = pickKind(false); Z.push({ id: id++, k: k, x: x, z: z, y: C.hgt(x, z), a: r() * 6.28, hp: KIND[k].hp, st: 'idle', t: r() * 4, wx: x, wz: z, hx: x, hz: z, step: 0, atk: 0, m: null, dead: false, dt0: 0, groan: r() * 8 }); return true; }
    C.TOWNS.forEach(function (t, ti) { if (t[4] === 'arena') return; for (var n = 0, k = 0; n < (ti === 0 ? 4 : 8) && k < 60; k++) { var a = r() * 6.283, d = 6 + r() * t[3] * 1.1; if (add(t[1] + Math.cos(a) * d, t[2] + Math.sin(a) * d)) n++; } });
    C.DARKFS.forEach(function (F) { for (var n = 0, k = 0; n < 9 && k < 60; k++) { var a = r() * 6.283, d = Math.sqrt(r()) * F[2] * .9; if (add(F[0] + Math.cos(a) * d, F[1] + Math.sin(a) * d)) n++; } });
    for (var n = 0, k = 0; n < 26 && k < 400; k++) { var a = r() * 6.283, d = 120 + r() * (C.ISLM - 140); if (add(Math.cos(a) * d, Math.sin(a) * d)) n++; }
    var T0 = C.TOWNS[0]; Z = Z.filter(function (z) { return Math.hypot(z.x - T0[1], z.z - T0[2]) > 30; });   // jamais collés au point de départ
    NID = id; }
  function spawnOne(night) { var P = C.me(); for (var tries = 0; tries < 40; tries++) { var x, z, q = Math.random();   // réapparition loin du joueur (60 à 260 m), près des lieux ou au hasard
      if (q < .5) { var t = C.TOWNS[Math.random() * C.TOWNS.length | 0]; if (t[4] === 'arena') continue; var a = Math.random() * 6.283, d = 8 + Math.random() * t[3] * 1.3; x = t[1] + Math.cos(a) * d; z = t[2] + Math.sin(a) * d; }
      else { var a2 = Math.random() * 6.283, d2 = 60 + Math.random() * 200; x = P.x + Math.cos(a2) * d2; z = P.z + Math.sin(a2) * d2; }
      var dp = Math.hypot(x - P.x, z - P.z); if (dp < 60 || !C.onLand(x, z) || C.inLake(x, z, 3) || C.hgt(x, z) > 70) continue;
      var k = pickKind(night); Z.push({ id: NID++, k: k, x: x, z: z, y: C.hgt(x, z), a: Math.random() * 6.28, hp: KIND[k].hp, st: 'idle', t: Math.random() * 3, hx: x, hz: z, step: 0, groan: 3, atk: 0 }); return; } }
  function makeModel(k) { var K = KIND[k], c = C.makeChar(Object.assign({ sk: 'zombie', zv: K.m, v: (POOL.length * 3 + 1) }, K.o || {})); c.root.visible = false; c.root.scale.setScalar(K.sc); C.scene.add(c.root); c.root.traverse(function (o) { o.frustumCulled = false; }); var e = { k: k, c: c, z: null }; POOL.push(e); return e; }
  function grab(z) { for (var i = 0; i < POOL.length; i++) { var p = POOL[i]; if (!p.z && p.k === z.k) { p.z = z; z.m = p; p.c.root.visible = true; return; } }
    if (built < 90 && POOL.filter(function (q) { return q.k === z.k; }).length < (KIND[z.k].w >= 10 ? 5 : 2)) { built++; var e = makeModel(z.k); e.z = z; z.m = e; e.c.root.visible = true; } }
  function release(z) { if (!z.m) return; z.m.c.root.visible = false; z.m.z = null; z.m = null; }
  function blockWall(z, dx, dz) {   // un mur juste devant (dans la direction de la marche) ?
    var best = null, bt = 1.3; for (var i = 0; i < C.WALLS.length; i++) { var w = C.WALLS[i]; if (!w.alive || Math.abs(w.x - z.x) > 6 || Math.abs(w.z - z.z) > 6) continue;
      var t = C.rayBox(z.x, z.y + 1, z.z, dx, 0, dz, w.x - w.hw, w.y0, w.z - w.hd, w.x + w.hw, w.y0 + w.h, w.z + w.hd); if (t < bt) { bt = t; best = w; } } return best; }
  function die(z, by) {
    z.dead = true; z.st = 'dead'; z.dt0 = 0; C.burst(z.x, z.y + 1.2, z.z, 24, ['#7aff4a', '#3a8a2a', '#5a4a3a', '#1a3a12'], 7, .3, 1.2); C.tone('sawtooth', 160, 50, .5, .06); C.noise(.3, .12, 400);
    if (Math.random() < .35) C.dropItem(z.x + .8, z.z, Math.random() < .5 ? 'ammo' : ['mini', 'heal', 'shield'][Math.random() * 3 | 0]);
    RESP.push(20 + Math.random() * 25);   // une autre créature apparaîtra ailleurs
    if (onKill) onKill(z, KIND[z.k]);
  }
  function pose(z, dt, now) {
    var c = z.m.c, k = KIND[z.k], sp = z.spd || 0, amp = Math.min(1, sp / 3), T2;
    z.step += dt * sp * 1.5;
    T2 = amp > .05 ? A.walk(z.step, amp * .85, sp > 4) : A.idle(now + z.id);
    var sw = Math.sin(now * 2 + z.id), at = z.atk > 0 ? Math.sin((1 - z.atk / 1.1) * Math.PI) : 0;
    T2.la = 1.25 + sw * .12 + at * .9; T2.ra = 1.35 - sw * .12 + at * 1.1; T2.lb = .18; T2.rb = .12; T2.le = .25 + at * .5; T2.re = .2 + at * .6; T2.lw = .2; T2.rw = .2;   // bras tendus en avant
    T2.bp = (T2.bp || 0) + .28 + at * .2; T2.hp = .25 + Math.sin(now * 1.3 + z.id) * .12; T2.hr = Math.sin(now * .9 + z.id * 2) * .3; T2.hy = Math.sin(now * .7 + z.id) * .2;   // dos voûté, tête qui ballotte
    if (KIND[z.k].m === 2) { T2.hr += Math.sin(now * 9) * .1; } if (KIND[z.k].m === 3) { T2.hr = Math.sin(now * 3 + z.id) * .55; }
    var an = k.an, ph = z.step * 2 + z.id;
    if (an === 'crawl') { T2.bp = 1.15 + at * .2; T2.hp = -.75; T2.la = 1.55 + Math.sin(ph) * .5 * amp + at; T2.ra = 1.55 - Math.sin(ph) * .5 * amp + at; T2.le = T2.re = .3; T2.lk = (T2.lk || 0) + .7; T2.rk = (T2.rk || 0) + .7; T2.lt = (T2.lt || 0) + .55; T2.rt = (T2.rt || 0) + .55; T2.by = -.35; }
    else if (an === 'hop') { var hp2 = Math.abs(Math.sin(ph * .7)); T2.by = hp2 * .55 * Math.max(.3, amp); T2.lk = T2.rk = (1 - hp2) * .9; T2.lt = T2.rt = (1 - hp2) * .6; T2.bp = .45; T2.la = T2.ra = .4 + hp2 * 1.6; }
    else if (an === 'sway') { T2.br = Math.sin(now * 1.6 + z.id) * .22; T2.byw = Math.sin(now * 1.1 + z.id) * .3; T2.la = .3 + Math.sin(now * 1.6) * .2 + at * 1.8; T2.ra = .25 - Math.sin(now * 1.6) * .2 + at * 1.8; T2.hr = Math.sin(now * 1.6 + z.id) * .5; T2.hp = .45; }
    else if (an === 'charge') { T2.bp = .7; T2.hp = -.1; T2.la = -.55 + at * 2; T2.ra = -.55 + at * 2; T2.lb = T2.rb = .35; T2.le = T2.re = .3; }
    else if (an === 'float') { T2.by = .35 + Math.sin(now * 2 + z.id) * .12; T2.lt = T2.rt = .15; T2.lk = T2.rk = .55; T2.la = .9 + Math.sin(now * 1.4) * .25 + at; T2.ra = .9 - Math.sin(now * 1.4) * .25 + at; T2.lb = T2.rb = .5; T2.bp = .15; T2.hp = .1; }
    else if (an === 'stomp') { T2.br = Math.sin(z.step * Math.PI) * .12 * amp; T2.la = .25 + at * 2.2; T2.ra = .3 + at * 2.4; T2.lb = T2.rb = .3; T2.bp = .18; T2.hp = .1; }
    else if (an === 'claw') { T2.la = 2.6 + Math.sin(now * 3 + z.id) * .25 - at * 1.4; T2.ra = 2.6 - Math.sin(now * 3 + z.id) * .25 - at * 1.4; T2.lb = T2.rb = .45; T2.le = T2.re = .7; T2.bp = .05; T2.hp = -.2; }
    else if (an === 'twitch') { var j = Math.sin(now * 23 + z.id) > .85 ? 1 : 0; T2.hr = j * .7 - .2; T2.hy = j * .5; T2.br = j * .15; T2.la += j * .6; }
    else if (an === 'flail') { T2.la = (now * 7 + z.id) % 6.283; T2.ra = (now * 7 + z.id + 3.14) % 6.283; T2.lb = T2.rb = .4; T2.le = T2.re = .2; }
    A.apply(c, A.blend(c, T2, dt, 10), true);
  }
  window.ZOMB = {
    on: false,
    init: function (THREE, ctx, kill) { T = THREE; C = ctx; A = C.ANIM; onKill = kill; gen(); this.on = true; }, kinds: function () { return KIND; }, demo: function (k, c, now, spd) { if (!A) A = window.ANIM; var z = { m: { c: c }, k: k, spd: spd == null ? 1.2 : spd, step: now * 1.6, id: k * 3, atk: 0 }; pose(z, 1, now); },
    total: function () { return Z.length; }, left: function () { return Z.filter(function (z) { return !z.dead; }).length; },
    deadIds: function () { return Z.filter(function (z) { return z.dead; }).map(function (z) { return z.id; }); },
    reset: function (dead) { var D = {}; RESP = []; Z.forEach(function (z) { release(z); z.dead = !!D[z.id]; z.x = z.hx; z.z = z.hz; z.y = C.hgt(z.x, z.z); z.hp = KIND[z.k].hp; z.st = 'idle'; z.atk = 0; z.spd = 0; }); },
    list: function () { return Z; }, prebuild: function () { for (var k = 0; k < 4; k++) { makeModel(k); built++; } },
    update: function (dt, night) {
      if (!this.on) return; var P = C.me(), now = performance.now() / 1000;
      if (built < 8) { makeModel(built % 4); built++; return; }   // premiers modèles construits un par image (pas de gel au chargement)
      for (var ri = RESP.length - 1; ri >= 0; ri--) { RESP[ri] -= dt; if (RESP[ri] <= 0) { RESP.splice(ri, 1); spawnOne(night); } }   // réapparition à l'infini
      if (Math.random() < .002) { Z = Z.filter(function (q) { return !q.dead || q.m; }); var al = Z.filter(function (q) { return !q.dead; }).length; if (al + RESP.length < POP) RESP.push(5); }
      var sense = night ? 48 : 26, pAlive = P.alive && C.state() === 'play';
      for (var i = 0; i < Z.length; i++) { var z = Z[i], d = Math.hypot(z.x - P.x, z.z - P.z);
        if (z.dead) { if (z.m) { z.dt0 += dt; var c = z.m.c, f = Math.min(1, z.dt0 / .6); c.root.rotation.set(0, -z.a, -f * 1.45); c.root.position.y = z.y - Math.max(0, z.dt0 - 2.5) * .8; if (z.dt0 > 4) release(z); } continue; }
        if (d > 170) { if (z.m) release(z); continue; }   // endormi loin du joueur
        var k = KIND[z.k], tx = null, tz = null, spd = 0; z.t -= dt; if (z.atk > 0) z.atk -= dt;
        if (pAlive && (d < sense || (z.st === 'chase' && d < sense * 2.2))) { if (z.st !== 'chase') { z.st = 'chase'; if (d < 40) C.tone('sawtooth', 110 + z.k * 25, 70, .5, .05); } }
        else if (z.st === 'chase') { z.st = 'idle'; z.t = 2; }
        if (z.st === 'chase') { tx = P.x; tz = P.z; spd = d < 1.4 ? 0 : k.run * (night ? 1.15 : 1);
          if (d < 1.55 && Math.abs(P.y - z.y) < 1.8 && z.atk <= 0) { z.atk = 1.1; z.hitAt = .5; }
          if (z.atk > 0 && z.hitAt > 0 && 1.1 - z.atk >= z.hitAt) { z.hitAt = 0; if (d < 2 && Math.abs(P.y - z.y) < 2) { C.hurt(P, k.dmg); C.noise(.12, .2, 700); } }
          if ((z.groan -= dt) < 0 && d < 30) { z.groan = 4 + Math.random() * 6; C.tone('sawtooth', 80 + Math.random() * 50, 55, .7, .045); } }
        else { if (z.t <= 0) { z.t = 3 + Math.random() * 6; if (Math.random() < .55) { var a = Math.random() * 6.283, rr = 4 + Math.random() * 12; z.wx = z.hx + Math.cos(a) * rr; z.wz = z.hz + Math.sin(a) * rr; } else { z.wx = z.x; z.wz = z.z; } }
          tx = z.wx; tz = z.wz; spd = Math.hypot(tx - z.x, tz - z.z) > 1 ? k.walk : 0; }
        if (spd > 0) { var dx = tx - z.x, dz = tz - z.z, l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; var ta = Math.atan2(dz, dx), da = ((ta - z.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI; z.a += da * Math.min(1, dt * 6);
          var w = d < 70 ? blockWall(z, dx, dz) : null;
          if (w && z.st === 'chase') { spd = 0; if (z.atk <= 0) { z.atk = 1.1; C.hitWall(w, k.dmg * 1.4, null); C.noise(.1, .15, 500); } }   // il tape le mur
          else { z.x += dx * spd * dt; z.z += dz * spd * dt; if (d < 80) { var o = { x: z.x, z: z.z, y: z.y, vx: dx * spd, vz: dz * spd }; C.pushCircle(o, .42 * k.sc); z.x = o.x; z.z = o.z; } } }
        z.spd = spd; var gy = C.hgt(z.x, z.z); if (C.groundAt) gy = Math.max(gy, C.groundAt(z.x, z.z, z.y)); z.y += (gy - z.y) * Math.min(1, dt * 12);
        if (d < 95 && !z.m) grab(z); else if (d > 110 && z.m) release(z);
        if (z.m) { var c2 = z.m.c; c2.root.position.set(z.x, z.y, z.z); c2.root.rotation.set(0, -z.a, 0); if (z.flash > 0) z.flash -= dt; pose(z, dt, now); } }
    },
    ray: function (ox, oy, oz, dx, dy, dz, maxT, fat) { var best = null, bt = maxT, f = fat || 0;
      for (var i = 0; i < Z.length; i++) { var z = Z[i]; if (z.dead || Math.abs(z.x - ox) > maxT + 2 || Math.abs(z.z - oz) > maxT + 2) continue; var s = KIND[z.k].sc, hh = 2.05 * s, r = .45 * s + f;
        var t = C.rayBox(ox, oy, oz, dx, dy, dz, z.x - r, z.y, z.z - r, z.x + r, z.y + hh + f * .5, z.z + r); if (t < bt) { bt = t; best = { t: t, kind: 'zomb', o: z, head: oy + dy * t - z.y > hh - .55 * s }; } }
      return best; },
    hurt: function (z, d, by) { if (z.dead) return; z.hp -= d; z.st = 'chase'; z.flash = .15; if (z.hp <= 0) die(z, by); else C.noise(.06, .08, 1200); },
    melee: function (x, y, z0, fx, fz, range, dmg) { var best = null, bd = range; Z.forEach(function (z) { if (z.dead) return; var dx = z.x - x, dz = z.z - z0, d = Math.hypot(dx, dz); if (d > bd || Math.abs(z.y - y) > 2.2) return; if ((dx * fx + dz * fz) / (d || 1) < .2 && d > .8) return; bd = d; best = z; });
      if (best) { this.hurt(best, dmg, C.me()); C.burst(best.x, best.y + 1.3, best.z, 8, ['#7aff4a', '#3a8a2a'], 4, .15, .5); C.dmgNum(best.x, best.y + 1.8, best.z, dmg, false, false); } return best; },
    nearest: function (x, z) { var b = null, bd = 1e9; Z.forEach(function (q) { if (q.dead) return; var d = Math.hypot(q.x - x, q.z - z); if (d < bd) { bd = d; b = q; } }); return b ? { z: b, d: bd } : null; }
  };
})();
