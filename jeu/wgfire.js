/* Wald Game : comptes en ligne + amis + salons en temps réel avec Firebase (projet « wald-game »).
   Utilisé par le launcher et par le jeu (même origine sur le site → même session).
   La config ci-dessous n'est PAS secrète (c'est normal qu'elle soit dans le code) : la sécurité est dans les règles de la base.
   Données : users/<uid> {pseudo}, pseudos/<pseudo-normalisé> {uid, n}, presence/<uid> {n, on, m, s, g, t},
   friends/<uid>/<autre> {n, st: 'ok'|'req'|'sent'}, inbox/<uid>/<id> {from, n, k: 'inv', ...}, parties/<chef>/{m/<uid>, go}. */
(function () {
  var CFG = { apiKey: 'AIzaSyBK-zqzVAdXn3KgeL_593Ts0W-xypXk91s', authDomain: 'wald-game.firebaseapp.com', databaseURL: 'https://wald-game-default-rtdb.europe-west1.firebasedatabase.app', projectId: 'wald-game', storageBucket: 'wald-game.firebasestorage.app', messagingSenderId: '551407062628', appId: '1:551407062628:web:8e6d7457c288ee985c1971' };
  var V = '10.12.2', SRC = ['app', 'auth', 'database'].map(function (k) { return 'https://www.gstatic.com/firebasejs/' + V + '/firebase-' + k + '-compat.js'; });
  var W = window.WGF = { ready: false, user: null, pseudo: '', friends: {}, pres: {}, on: {}, fail: false };
  var LIS = [], fb = null, db = null, au = null, partyRef = null, presRef = null, PRES = {};
  function emit(ev, a) { (W.on[ev] || []).forEach(function (f) { try { f(a); } catch (e) { console.warn(e); } }); }
  W.sub = function (ev, f) { (W.on[ev] = W.on[ev] || []).push(f); if (ev === 'auth' && W.ready) f(W.user); };
  W.norm = function (n) { return String(n || '').trim().toLowerCase().replace(/[^a-z0-9_\-]/g, '').slice(0, 16); };
  function load(i, cb) { if (i >= SRC.length) return cb(); var s = document.createElement('script'); s.src = SRC[i]; s.onload = function () { load(i + 1, cb); }; s.onerror = function () { W.fail = true; emit('fail'); }; document.head.appendChild(s); }
  function off() { LIS.forEach(function (r) { try { r.off(); } catch (e) {} }); LIS = []; W.friends = {}; W.pres = {}; PRES = {}; }
  function listen(ref, ev, f) { ref.on(ev, f); LIS.push(ref); return ref; }
  /* même compte dans le jeu installé (autre origine) : la session voyage dans le profil partagé (clé wr_fbu) */
  var UK = 'firebase:authUser:' + CFG.apiKey + ':[DEFAULT]';
  function lsg(k) { try { return localStorage.getItem(k); } catch (e) { return null; } } function lss(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function keep(u) { lss('wr_fbu', u ? JSON.stringify(u.toJSON()) : '0'); if (window.WGsyncOut) window.WGsyncOut(); }
  function started(u) { off();
    if (u && lsg('wr_fbu') === '0' && !W.fresh) { au.signOut(); return; }   // déconnecté ailleurs (launcher)
    W.user = u; W.ready = true; W.fresh = false;
    if (!u) { W.pseudo = ''; emit('auth', null); return; } keep(u);
    db.ref('users/' + u.uid).once('value').then(function (s) { var d = s.val() || {}; W.pseudo = d.pseudo || (u.email || 'Joueur').split('@')[0]; if (!(W.signing && !d.pseudo)) emit('auth', u);
      presRef = db.ref('presence/' + u.uid); listen(db.ref('.info/connected'), 'value', function (c) { if (!c.val()) return; presRef.onDisconnect().update({ on: false, t: firebase.database.ServerValue.TIMESTAMP }); W.presence(PRES); });
      listen(db.ref('friends/' + u.uid), 'value', function (s2) { W.friends = s2.val() || {}; Object.keys(W.friends).forEach(function (f) { if (W.friends[f].st === 'ok' && !W.pres[f] && !W.pres['_' + f]) { W.pres['_' + f] = 1; listen(db.ref('presence/' + f), 'value', function (p) { W.pres[f] = p.val(); emit('friends', W.friends); }); } }); emit('friends', W.friends);
        Object.keys(W.friends).forEach(function (f) { if (W.friends[f].st === 'req') emit('request', { uid: f, n: W.friends[f].n }); }); });
      listen(db.ref('inbox/' + u.uid), 'child_added', function (s3) { var m = s3.val(); s3.ref.remove(); if (m && Date.now() - (m.ts || 0) < 180000) emit('inbox', m); });
    }); }
  W.init = function () { if (fb || W.fail) return; fb = 1; var fu = lsg('wr_fbu'); if (fu && fu !== '0' && !lsg(UK)) lss(UK, fu); load(0, function () { try { fb = firebase.initializeApp(CFG); au = firebase.auth(); db = firebase.database(); try { db.ref('.info/serverTimeOffset').on('value', function (q) { var v = +q.val(); if (isFinite(v) && window.SRVSET) window.SRVSET(v, 'fb'); }); } catch (e2) {} au.useDeviceLanguage(); au.onAuthStateChanged(started); } catch (e) { W.fail = true; emit('fail'); } }); };
  function err(e) { var c = (e && e.code) || ''; return { 'auth/email-already-in-use': 'Cette adresse e-mail a déjà un compte : connecte-toi.', 'auth/invalid-email': 'Adresse e-mail invalide.', 'auth/weak-password': 'Mot de passe trop faible (8 caractères minimum).', 'auth/wrong-password': 'Mot de passe incorrect.', 'auth/invalid-credential': 'E-mail ou mot de passe incorrect.', 'auth/invalid-login-credentials': 'E-mail ou mot de passe incorrect.', 'auth/user-not-found': 'Aucun compte avec cette adresse.', 'auth/too-many-requests': 'Trop d\'essais : attends un peu.', 'auth/network-request-failed': 'Pas de connexion internet.' }[c] || (e && e.message) || 'Erreur'; }
  W.signUp = function (pseudo, email, pw) { W.fresh = true; W.signing = true; var k = W.norm(pseudo); if (k.length < 3) return Promise.reject('Pseudo : 3 caractères minimum (lettres, chiffres, _ ou -).');
    return au.createUserWithEmailAndPassword(email, pw).catch(function (e) { throw err(e); }).then(function (cr) { var uid = cr.user.uid;
      return db.ref('pseudos/' + k).transaction(function (cur) { return cur ? undefined : { uid: uid, n: pseudo }; }).then(function (r) {
        if (!r.committed) { W.signing = false; return cr.user.delete().then(function () { throw 'Ce pseudo est déjà pris, choisis-en un autre.'; }); }
        return db.ref('users/' + uid).set({ pseudo: pseudo, t: Date.now() }).then(function () { W.signing = false; W.pseudo = pseudo; W.presence({}); emit('auth', cr.user); return cr.user; }); }); }).catch(function (e) { W.signing = false; throw e; }); };
  W.signIn = function (email, pw) { W.fresh = true; return au.signInWithEmailAndPassword(email, pw).catch(function (e) { throw err(e); }); };
  W.reset = function (email) { return au.sendPasswordResetEmail(email).catch(function (e) { throw err(e); }); };
  W.signOut = function () { if (presRef) presRef.update({ on: false }); keep(null); try { localStorage.removeItem(UK); } catch (e) {} return au.signOut(); };
  /* présence : mode, état, chef du groupe */
  W.presence = function (o) { PRES = Object.assign(PRES, o || {}); if (!W.user || !presRef) return; presRef.set(Object.assign({ n: W.pseudo, on: true, t: firebase.database.ServerValue.TIMESTAMP }, PRES)); };
  W.presOf = function (uid) { return db.ref('presence/' + uid).once('value').then(function (s) { return s.val(); }); };
  W.findPseudo = function (ps) { return db.ref('pseudos/' + W.norm(ps)).once('value').then(function (s) { return s.val(); }); };
  W.addFriend = function (ps) { if (!W.user) return Promise.reject('Connecte-toi d\'abord'); return W.findPseudo(ps).then(function (o) { if (!o) throw 'Pseudo introuvable.'; if (o.uid === W.user.uid) throw 'C\'est ton pseudo 😄';
      var me = W.user.uid, cur = W.friends[o.uid]; if (cur && cur.st === 'ok') throw o.n + ' est déjà ton ami.';
      if (cur && cur.st === 'req') return W.accept(o.uid).then(function () { return 'ok'; });
      return Promise.all([db.ref('friends/' + me + '/' + o.uid).set({ n: o.n, st: 'sent' }), db.ref('friends/' + o.uid + '/' + me).set({ n: W.pseudo, st: 'req' })]).then(function () { return o.n; }); }); };
  W.accept = function (uid) { var me = W.user.uid, n = (W.friends[uid] || {}).n || 'Ami'; return Promise.all([db.ref('friends/' + me + '/' + uid).set({ n: n, st: 'ok' }), db.ref('friends/' + uid + '/' + me).set({ n: W.pseudo, st: 'ok' })]); };
  W.remove = function (uid) { var me = W.user.uid; return Promise.all([db.ref('friends/' + me + '/' + uid).remove(), db.ref('friends/' + uid + '/' + me).remove()]); };
  W.send = function (uid, msg) { if (!W.user) return Promise.reject('no'); return db.ref('inbox/' + uid).push(Object.assign({ from: W.user.uid, n: W.pseudo, ts: Date.now() }, msg)); };
  /* salon (groupe de 4) en temps réel */
  W.party = function (lead, cb) { if (partyRef) { partyRef.off(); partyRef = null; } if (!W.user) return; partyRef = db.ref('parties/' + lead); partyRef.on('value', function (s) { cb(s.val() || {}); }); };
  W.partyJoin = function (lead) { if (!W.user) return Promise.reject('no'); var r = db.ref('parties/' + lead + '/m/' + W.user.uid); r.onDisconnect().remove(); return r.set({ n: W.pseudo, t: Date.now() }); };
  W.partyLeave = function (lead) { if (!W.user) return; return db.ref('parties/' + lead + '/m/' + W.user.uid).remove(); };
  W.partyKick = function (uid) { if (!W.user) return; return db.ref('parties/' + W.user.uid + '/m/' + uid).remove(); };
  W.partyGo = function (go) { if (!W.user) return; return db.ref('parties/' + W.user.uid + '/go').set(go); };
})();
