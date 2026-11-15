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
  window.NET = {
    join: function (r, myId, fn, st) { NET.leave(); room = String(r).toLowerCase().replace(/[^a-z0-9_-]/g, ''); base = 'wr4/' + room + '/'; id = myId; onMsg = fn; onState = st; bi = 0; connect(); },
    leave: function () { room = ''; clearTimeout(retry); clearInterval(ping); if (ws) { try { send(new Uint8Array([0xE0, 0])); ws.close(); } catch (e) {} } ws = null; up = false; },
    pub: function (m) { if (!up) return false; m.id = id; send(pkt(0x30, str(base + (m.t || 'x')).concat(Array.from(enc.encode(JSON.stringify(m)))))); return true; },
    up: function () { return up; }, room: function () { return room; }
  };
})();
