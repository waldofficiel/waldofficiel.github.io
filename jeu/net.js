/* Wald Royal : JOUER ENTRE POTES dans les maps du mode Créatif.
   Pas de serveur à nous : on passe par un relais MQTT public gratuit (WebSocket sécurisé). Chaque map + code = un « salon »
   (sujet wr4/<salon>/...). Sans code, tous ceux qui lancent la même map tombent ensemble (salon public).
   Petit client MQTT 3.1.1 fait maison (CONNECT, SUBSCRIBE, PUBLISH QoS 0, PING). */
(function () {
  var BROKERS = ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt', 'wss://test.mosquitto.org:8081/mqtt'];
  /* DEUX RELAIS EN MÊME TEMPS (emqx + hivemq) : on publie sur les deux, on lit les deux et on enlève les doublons (n° de message q).
     Avant : si un joueur n'arrivait pas à joindre le 1er relais, il passait au 2e… et ne voyait plus ses potes restés sur le 1er. */
  var C = [], up = false, room = '', base = '', id = '', onMsg = null, onState = null, enc = new TextEncoder(), dec = new TextDecoder(), seq = 0, SEEN = {}, SEENN = 0;
  function str(s) { var b = enc.encode(s); return [b.length >> 8, b.length & 255].concat(Array.from(b)); }
  function remLen(n) { var o = []; do { var d = n % 128; n = Math.floor(n / 128); if (n > 0) d |= 128; o.push(d); } while (n > 0); return o; }
  function pkt(type, body) { return new Uint8Array([type].concat(remLen(body.length), body)); }
  function sendC(c, u8) { if (c.ws && c.ws.readyState === 1) try { c.ws.send(u8); } catch (e) {} }
  function anyUp() { return C.some(function (c) { return c.up; }); }
  function state() { var u = anyUp(); if (u !== up) { up = u; if (onState) onState(u); } }
  function connect(c) {
    if (!room || c.dead) return; var url = BROKERS[c.list[c.bi % c.list.length]]; try { c.ws = new WebSocket(url, 'mqtt'); } catch (e) { c.bi++; c.retry = setTimeout(function () { connect(c); }, 1500); return; }
    var ws = c.ws; ws.binaryType = 'arraybuffer'; c.buf = new Uint8Array(0); var t0 = setTimeout(function () { if (!c.up) { try { ws.close(); } catch (e) {} } }, 6000);
    ws.onopen = function () { sendC(c, pkt(0x10, str('MQTT').concat([4, 2, 0, 60], str(id + c.k)))); };
    ws.onmessage = function (e) { if (c.ws !== ws) return; var d = new Uint8Array(e.data), nb = new Uint8Array(c.buf.length + d.length); nb.set(c.buf); nb.set(d, c.buf.length); c.buf = nb; parse(c); };
    ws.onclose = function () { clearTimeout(t0); if (c.ws !== ws) return; var was = c.up; c.up = false; clearInterval(c.ping); state(); if (room && !c.dead) { if (!was) c.bi++; c.retry = setTimeout(function () { connect(c); }, was ? 800 : 1500); } };
    ws.onerror = function () {};
  }
  function seen(m) { if (m.q == null) return false; var k = m.id + ':' + m.r + ':' + m.q; if (SEEN[k]) return true; SEEN[k] = 1; if (++SEENN > 4000) { SEEN = {}; SEENN = 0; SEEN[k] = 1; } return false; }
  function parse(c) {
    while (c.buf.length >= 2) {
      var mul = 1, len = 0, i = 1, b; do { if (i >= c.buf.length) return; b = c.buf[i++]; len += (b & 127) * mul; mul *= 128; } while (b & 128);
      if (c.buf.length < i + len) return; var type = c.buf[0] >> 4, body = c.buf.subarray(i, i + len); c.buf = c.buf.slice(i + len);
      if (type === 2) { c.up = true; sendC(c, pkt(0x82, [0, 1].concat(str(base + '#'), [0]))); clearInterval(c.ping); c.ping = setInterval(function () { sendC(c, new Uint8Array([0xC0, 0])); }, 25000); state(); }
      else if (type === 3) { var tl = (body[0] << 8) | body[1], topic = dec.decode(body.subarray(2, 2 + tl)); try { var m = JSON.parse(dec.decode(body.subarray(2 + tl))); if (m && m.id !== id && onMsg && !seen(m)) onMsg(m, topic); } catch (e) {} }
    }
  }
  var RUN = Math.random().toString(36).slice(2, 6);
  /* JEUX PUBLIÉS (Créatif) : stockés en messages « retenus » sur le relais (sujet wr4pub/v1/...), lus par une connexion courte à part */
  var PUBT = 'wr4pub/v1/';
  function shot(onUp, onPub, ms, done, bk) { var w, b = new Uint8Array(0), fin = false, cid = 'wrp' + Math.random().toString(36).slice(2, 9), to;
    function end(ok) { if (fin) return; fin = true; clearTimeout(to); try { w.send(new Uint8Array([0xE0, 0])); w.close(); } catch (e) {} if (done) done(ok); }
    try { w = new WebSocket(BROKERS[bk || 0], 'mqtt'); } catch (e) { if (done) done(false); return; } w.binaryType = 'arraybuffer'; to = setTimeout(function () { end(true); }, ms || 6000);
    w.onopen = function () { w.send(pkt(0x10, str('MQTT').concat([4, 2, 0, 60], str(cid)))); };
    w.onerror = function () { end(false); }; w.onclose = function () { end(false); };
    w.onmessage = function (e) { var d = new Uint8Array(e.data), nb = new Uint8Array(b.length + d.length); nb.set(b); nb.set(d, b.length); b = nb;
      while (b.length >= 2) { var mul = 1, len = 0, i = 1, x; do { if (i >= b.length) return; x = b[i++]; len += (x & 127) * mul; mul *= 128; } while (x & 128); if (b.length < i + len) return;
        var ty = b[0] >> 4, body = b.subarray(i, i + len); b = b.slice(i + len);
        if (ty === 2) onUp(w, end); else if (ty === 3) { var tl = (body[0] << 8) | body[1], tp = dec.decode(body.subarray(2, 2 + tl)); try { onPub(tp, JSON.parse(dec.decode(body.subarray(2 + tl))), end); } catch (er) {} } } }; }
  function sub(w, topic) { w.send(pkt(0x82, [0, 1].concat(str(topic), [0]))); }
  window.NET = {
    join: function (r, myId, fn, st) { NET.leave(); room = String(r).toLowerCase().replace(/[^a-z0-9_-]/g, ''); base = 'wr4/' + room + '/'; id = myId; onMsg = fn; onState = st; up = false;
      C = [{ k: 'a', list: [0, 2], bi: 0 }, { k: 'b', list: [1, 2], bi: 0 }]; C.forEach(connect); },
    leave: function () { room = ''; C.forEach(function (c) { c.dead = true; clearTimeout(c.retry); clearInterval(c.ping); if (c.ws) { try { sendC(c, new Uint8Array([0xE0, 0])); c.ws.close(); } catch (e) {} } c.ws = null; c.up = false; }); C = []; up = false; },
    pub: function (m) { if (!anyUp()) return false; m.id = id; m.r = RUN; m.q = ++seq; var u8 = pkt(0x30, str(base + (m.t || 'x')).concat(Array.from(enc.encode(JSON.stringify(m))))); C.forEach(function (c) { if (c.up) sendC(c, u8); }); return true; },
    up: function () { return anyUp(); }, room: function () { return room; },
    /* messages retenus écrits sur les 2 relais, lus sur les 2 (le 1er qui répond gagne) */
    store: function (key, obj, cb) { var n = 0, ok0 = false; [0, 1].forEach(function (bk) { shot(function (w, end) { w.send(pkt(0x31, str(PUBT + key).concat(Array.from(enc.encode(JSON.stringify(obj)))))); setTimeout(function () { end(true); }, 900); }, function () {}, 8000, function (ok) { ok0 = ok0 || ok; if (++n === 2 && cb) cb(ok0); }, bk); }); },
    list: function (prefix, cb) { var L = [], K = {}, n = 0; [0, 1].forEach(function (bk) { shot(function (w) { sub(w, PUBT + prefix + '+'); }, function (tp, o) { var k = JSON.stringify(o); if (!K[k]) { K[k] = 1; L.push(o); } }, 3500, function () { if (++n === 2) cb(L); }, bk); }); },
    fetch: function (key, cb) { var got = false, n = 0; [0, 1].forEach(function (bk) { shot(function (w) { sub(w, PUBT + key); }, function (tp, o, end) { if (!got) { got = true; cb(o); } end(true); }, 6000, function () { if (++n === 2 && !got) { got = true; cb(null); } }, bk); }); }
  };
})();
