/* Wald Royal : JOUER ENTRE POTES dans les maps du mode Créatif.
   Pas de serveur à nous : on passe par un relais MQTT public gratuit (WebSocket sécurisé). Chaque map + code = un « salon »
   (sujet wr4/<salon>/...). Sans code, tous ceux qui lancent la même map tombent ensemble (salon public).
   Petit client MQTT 3.1.1 fait maison (CONNECT, SUBSCRIBE, PUBLISH QoS 0, PING). */
(function () {
  var BROKERS = ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt', 'wss://test.mosquitto.org:8081/mqtt'];
  var ws = null, bi = 0, up = false, room = '', base = '', id = '', onMsg = null, onState = null, ping = null, retry = null, buf = new Uint8Array(0), enc = new TextEncoder(), dec = new TextDecoder();
  function str(s) { var b = enc.encode(s); return [b.length >> 8, b.length & 255].concat(Array.from(b)); }
  function remLen(n) { var o = []; do { var d = n % 128; n = Math.floor(n / 128); if (n > 0) d |= 128; o.push(d); } while (n > 0); return o; }
  function pkt(type, body) { return new Uint8Array([type].concat(remLen(body.length), body)); }
  function send(u8) { if (ws && ws.readyState === 1) try { ws.send(u8); } catch (e) {} }
  function connect() {
    if (!room) return; try { ws = new WebSocket(BROKERS[bi % BROKERS.length], 'mqtt'); } catch (e) { fail(); return; }
    ws.binaryType = 'arraybuffer'; var t0 = setTimeout(function () { if (!up) { try { ws.close(); } catch (e) {} } }, 6000);
    ws.onopen = function () { var body = str('MQTT').concat([4, 2, 0, 60], str(id)); send(pkt(0x10, body)); };
    ws.onmessage = function (e) { var d = new Uint8Array(e.data), nb = new Uint8Array(buf.length + d.length); nb.set(buf); nb.set(d, buf.length); buf = nb; parse(); };
    ws.onclose = function () { clearTimeout(t0); var was = up; up = false; clearInterval(ping); if (onState) onState(false); if (room) { if (!was) bi++; retry = setTimeout(connect, was ? 1000 : 1500); } };
    ws.onerror = function () {};
  }
  function fail() { bi++; retry = setTimeout(connect, 1500); }
  function parse() {
    while (buf.length >= 2) {
      var mul = 1, len = 0, i = 1, b; do { if (i >= buf.length) return; b = buf[i++]; len += (b & 127) * mul; mul *= 128; } while (b & 128);
      if (buf.length < i + len) return; var type = buf[0] >> 4, body = buf.subarray(i, i + len); buf = buf.slice(i + len);
      if (type === 2) { up = true; send(pkt(0x82, [0, 1].concat(str(base + '#'), [0]))); ping = setInterval(function () { send(new Uint8Array([0xC0, 0])); }, 25000); if (onState) onState(true); }
      else if (type === 3) { var tl = (body[0] << 8) | body[1], topic = dec.decode(body.subarray(2, 2 + tl)); try { var m = JSON.parse(dec.decode(body.subarray(2 + tl))); if (m && m.id !== id && onMsg) onMsg(m, topic); } catch (e) {} }
    }
  }
  /* JEUX PUBLIÉS (Créatif) : stockés en messages « retenus » sur le relais (sujet wr4pub/v1/...), lus par une connexion courte à part */
  var PUBT = 'wr4pub/v1/';
  function shot(onUp, onPub, ms, done) { var w, b = new Uint8Array(0), fin = false, cid = 'wrp' + Math.random().toString(36).slice(2, 9), to;
    function end(ok) { if (fin) return; fin = true; clearTimeout(to); try { w.send(new Uint8Array([0xE0, 0])); w.close(); } catch (e) {} if (done) done(ok); }
    try { w = new WebSocket(BROKERS[0], 'mqtt'); } catch (e) { if (done) done(false); return; } w.binaryType = 'arraybuffer'; to = setTimeout(function () { end(true); }, ms || 6000);
    w.onopen = function () { w.send(pkt(0x10, str('MQTT').concat([4, 2, 0, 60], str(cid)))); };
    w.onerror = function () { end(false); }; w.onclose = function () { end(false); };
    w.onmessage = function (e) { var d = new Uint8Array(e.data), nb = new Uint8Array(b.length + d.length); nb.set(b); nb.set(d, b.length); b = nb;
      while (b.length >= 2) { var mul = 1, len = 0, i = 1, x; do { if (i >= b.length) return; x = b[i++]; len += (x & 127) * mul; mul *= 128; } while (x & 128); if (b.length < i + len) return;
        var ty = b[0] >> 4, body = b.subarray(i, i + len); b = b.slice(i + len);
        if (ty === 2) onUp(w, end); else if (ty === 3) { var tl = (body[0] << 8) | body[1], tp = dec.decode(body.subarray(2, 2 + tl)); try { onPub(tp, JSON.parse(dec.decode(body.subarray(2 + tl))), end); } catch (er) {} } } }; }
  function sub(w, topic) { w.send(pkt(0x82, [0, 1].concat(str(topic), [0]))); }
  window.NET = {
    join: function (r, myId, fn, st) { NET.leave(); room = String(r).toLowerCase().replace(/[^a-z0-9_-]/g, ''); base = 'wr4/' + room + '/'; id = myId; onMsg = fn; onState = st; bi = 0; connect(); },
    leave: function () { room = ''; clearTimeout(retry); clearInterval(ping); if (ws) { try { send(new Uint8Array([0xE0, 0])); ws.close(); } catch (e) {} } ws = null; up = false; },
    pub: function (m) { if (!up) return false; m.id = id; send(pkt(0x30, str(base + (m.t || 'x')).concat(Array.from(enc.encode(JSON.stringify(m)))))); return true; },
    up: function () { return up; }, room: function () { return room; },
    store: function (key, obj, cb) { shot(function (w, end) { w.send(pkt(0x31, str(PUBT + key).concat(Array.from(enc.encode(JSON.stringify(obj)))))); setTimeout(function () { end(true); }, 900); }, function () {}, 8000, cb); },
    list: function (prefix, cb) { var L = []; shot(function (w) { sub(w, PUBT + prefix + '+'); }, function (tp, o) { L.push(o); }, 3500, function () { cb(L); }); },
    fetch: function (key, cb) { var got = false; shot(function (w) { sub(w, PUBT + key); }, function (tp, o, end) { if (!got) { got = true; cb(o); end(true); } }, 6000, function () { if (!got) cb(null); }); }
  };
})();
