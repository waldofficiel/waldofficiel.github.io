// WALD GAME pour PC : le launcher de Wald Off (appli légère, sans le jeu dedans).
// Avec internet : on ouvre la page du launcher. De là, le joueur INSTALLE Wald Royal (fichiers téléchargés
// dans userData/game, servis par app://jeu/), puis JOUER lance le jeu installé. Mises à jour = fichiers changés seulement.
// Le pont « WG » (preload.js) donne : installed(), install(), play(q), uninstall(), profil partagé.
const { app, BrowserWindow, protocol, net, Menu, ipcMain } = require('electron');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const SITE = 'https://waldofficiel.github.io/jeu/';
const LAUNCHER = 'https://waldofficiel.github.io/launcher/?app=2';
const GAMEURL = 'app://jeu/index.html?jouer&from=launcher';
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }]);
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('force_high_performance_gpu');

let GAME = null, win = null, busy = false;

function screen(msg) {
  return 'data:text/html;charset=utf-8,' + encodeURIComponent(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
html,body{margin:0;height:100%;background:radial-gradient(circle at 50% 35%,#3a0f5e,#0b0418 70%);color:#fff;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;overflow:hidden}
.b{width:min(520px,80vw);text-align:center}h1{margin:0 0 12px;font-size:54px;font-weight:900;letter-spacing:.04em;background:linear-gradient(180deg,#fff,#ffc4ec 55%,#ff2bd6);-webkit-background-clip:text;color:transparent;filter:drop-shadow(0 0 18px rgba(255,43,214,.6))}
p{margin:0;color:#d9c8f0;font-weight:700;font-size:17px;line-height:1.4}</style></head><body><div class="b"><h1>WALD GAME</h1><p>${msg}</p></div></body></html>`);
}
function readJSON(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return null; } }
function installed() { const j = readJSON(path.join(GAME, 'version.json')); return j ? j.v : -1; }
async function get(url, ms) {
  const ac = new AbortController(), to = setTimeout(() => ac.abort(), ms);
  try { const r = await net.fetch(url, { signal: ac.signal, cache: 'no-store' }); if (!r.ok) throw new Error('HTTP ' + r.status); return Buffer.from(await r.arrayBuffer()); }
  finally { clearTimeout(to); }
}
function rm(p) { try { fs.rmSync(p, { recursive: true, force: true }); } catch (e) {} }
function js(code) { if (win && !win.isDestroyed()) win.webContents.executeJavaScript(code).catch(() => {}); }

async function download() {
  const game = GAME, tmp = game + '_tmp', old = game + '_old';
  const cur = readJSON(path.join(game, 'version.json'));
  const nw = JSON.parse((await get(SITE + 'version.json?t=' + Date.now(), 8000)).toString('utf8'));
  if (cur && cur.v === nw.v) { js('window.WGprog&&WGprog(100,"À jour")'); return; }
  rm(tmp); fs.mkdirSync(tmp, { recursive: true });
  try {
    const files = nw.files || {}, oldF = (cur && cur.files) || {};
    let total = 0, done = 0, lastP = -1;
    for (const k in files) if (!oldF[k] || oldF[k][0] !== files[k][0]) total += files[k][1];
    for (const k in files) {
      const out = path.join(tmp, ...k.split('/')); fs.mkdirSync(path.dirname(out), { recursive: true });
      let data = null;
      if (oldF[k] && oldF[k][0] === files[k][0]) { try { data = fs.readFileSync(path.join(game, ...k.split('/'))); } catch (e) { data = null; } }
      if (!data) {
        data = await get(SITE + k.split('/').map(encodeURIComponent).join('/') + '?v=' + nw.v, 30000); done += files[k][1];
        const p = Math.round(done * 100 / Math.max(1, total));
        if (p !== lastP) { lastP = p; js(`window.WGprog&&WGprog(${p},${JSON.stringify((done / 1048576).toFixed(1) + ' / ' + (total / 1048576).toFixed(1) + ' Mo')})`); }
      }
      fs.writeFileSync(out, data);
    }
    fs.writeFileSync(path.join(tmp, 'version.json'), JSON.stringify(nw));
    rm(old); if (fs.existsSync(game)) fs.renameSync(game, old); fs.renameSync(tmp, game); rm(old);
  } catch (e) { rm(tmp); throw e; }
}

// pont « WG » : seulement pour nos pages (site du launcher et jeu installé)
function ours(e) { const u = (e.senderFrame && e.senderFrame.url) || ''; return u.startsWith('https://waldofficiel.github.io/') || u.startsWith('app://jeu/'); }
ipcMain.on('wg-installed', (e) => { e.returnValue = ours(e) ? installed() : -1; });
ipcMain.on('wg-busy', (e) => { e.returnValue = busy; });
ipcMain.on('wg-install', (e) => {
  if (!ours(e) || busy) return; busy = true;
  download().then(() => js(`window.WGdone&&WGdone(${installed()})`)).catch((err) => js(`window.WGfail&&WGfail(${JSON.stringify(String(err && err.message))})`)).finally(() => { busy = false; });
});
ipcMain.on('wg-play', (e, q) => { if (ours(e) && installed() >= 0) win.loadURL(GAMEURL + (typeof q === 'string' ? q : '')); });
ipcMain.on('wg-launcher', (e) => { if (ours(e)) win.loadURL(LAUNCHER).catch(() => {}); });
ipcMain.on('wg-uninstall', (e) => { if (ours(e) && !busy) rm(GAME); });
ipcMain.on('wg-profile', (e) => { let s = ''; if (ours(e)) { try { s = fs.readFileSync(path.join(app.getPath('userData'), 'profile.json'), 'utf8'); } catch (err) {} } e.returnValue = s; });
ipcMain.on('wg-saveProfile', (e, s) => { if (ours(e) && typeof s === 'string') { try { fs.writeFileSync(path.join(app.getPath('userData'), 'profile.json'), s); } catch (err) {} } });

app.whenReady().then(async () => {
  GAME = path.join(app.getPath('userData'), 'game');
  protocol.handle('app', (req) => {
    let p = decodeURIComponent(new URL(req.url).pathname);
    if (p === '/' || p === '') p = '/index.html';
    return net.fetch(pathToFileURL(path.join(GAME, p)).toString());
  });
  Menu.setApplicationMenu(null);
  win = new BrowserWindow({
    width: 1600, height: 900, fullscreen: true, backgroundColor: '#0b0418', title: 'Wald Game',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: { backgroundThrottling: false, preload: path.join(__dirname, 'preload.js'), contextIsolation: true }
  });
  win.webContents.setUserAgent(win.webContents.getUserAgent() + ' WaldGame/2');
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') win.setFullScreen(!win.isFullScreen());
    if (input.type === 'keyDown' && input.key === 'F4' && input.alt) app.quit();
  });
  await win.loadURL(screen('Connexion…'));
  let online = false;
  try { await get(SITE + 'version.json?t=' + Date.now(), 6000); online = true; } catch (e) { online = false; }
  if (online) win.loadURL(LAUNCHER).catch(() => {});
  else if (installed() >= 0) win.loadURL(GAMEURL + '&off=1');
  else win.loadURL(screen('Pas de connexion internet. Connecte-toi pour installer Wald Royal, puis relance Wald Game.'));
});
app.on('window-all-closed', () => app.quit());
