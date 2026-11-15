// Wald Royal pour PC : fenêtre plein écran, le jeu tourne depuis les fichiers installés (hors ligne).
// MISE À JOUR AUTOMATIQUE : à chaque lancement on lit version.json sur le site ; si le numéro a changé, on télécharge
// seulement les fichiers modifiés dans le dossier de l'appli (userData/game) et on lance le jeu depuis là.
const { app, BrowserWindow, protocol, net, Menu } = require('electron');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');   // musique du salon dès l'ouverture
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const SITE = 'https://waldofficiel.github.io/jeu/';
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }]);
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('force_high_performance_gpu');

const BUNDLED = path.join(__dirname, 'game');
let GAME = null, ROOT = BUNDLED, ONLINE = null;   // dossier servi par app://jeu/

const SCREEN = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
html,body{margin:0;height:100%;background:radial-gradient(circle at 50% 35%,#3a0f5e,#0b0418 70%);color:#fff;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;overflow:hidden}
.b{width:min(520px,80vw);text-align:center}h1{margin:0 0 8px;font-size:54px;font-weight:900;letter-spacing:.04em;background:linear-gradient(180deg,#fff,#ffc4ec 55%,#ff2bd6);-webkit-background-clip:text;color:transparent;filter:drop-shadow(0 0 18px rgba(255,43,214,.6))}
p{margin:0 0 18px;color:#d9c8f0;font-weight:700;font-size:17px}.t{height:14px;border-radius:9px;background:rgba(255,255,255,.12);overflow:hidden}
.t i{display:block;height:100%;width:3%;border-radius:9px;background:linear-gradient(90deg,#ff2bd6,#8a3dff,#3dd6ff);box-shadow:0 0 16px #ff2bd6;transition:width .2s}
small{display:block;margin-top:12px;color:#9a86b8;font-weight:700}</style></head><body><div class="b"><h1>WALD GAME</h1><p id="m">Recherche de mises à jour…</p><div class="t"><i id="i"></i></div><small id="v"></small></div>
<script>function setP(p,m,v){document.getElementById('i').style.width=Math.max(3,p)+'%';if(m)document.getElementById('m').textContent=m;if(v)document.getElementById('v').textContent=v;}</script></body></html>`;

function readJSON(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return null; } }
async function get(url, ms) {
  const ac = new AbortController(), to = setTimeout(() => ac.abort(), ms);
  try { const r = await net.fetch(url, { signal: ac.signal, cache: 'no-store' }); if (!r.ok) throw new Error('HTTP ' + r.status); return Buffer.from(await r.arrayBuffer()); }
  finally { clearTimeout(to); }
}
function rm(p) { try { fs.rmSync(p, { recursive: true, force: true }); } catch (e) {} }

async function update(ui) {
  const game = GAME, tmp = game + '_tmp', old = game + '_old';
  let base = fs.existsSync(path.join(game, 'version.json')) ? game : BUNDLED;
  ROOT = base;
  const cur = readJSON(path.join(base, 'version.json'));
  let nw;
  try { nw = JSON.parse((await get(SITE + 'version.json?t=' + Date.now(), 5000)).toString('utf8')); } catch (e) { return; }   // pas d'internet : on joue avec ce qu'on a
  const vNew = nw.v, vCur = cur ? cur.v : -1;
  ONLINE = 'https://waldofficiel.github.io/launcher/?app=1&v=' + vNew;   // écran du LAUNCHER (façon Epic Games), bouton JOUER   // LAUNCHER : avec internet on ouvre le jeu du site (toujours à jour)
  if (vNew === vCur) return;
  rm(tmp); fs.mkdirSync(tmp, { recursive: true });
  try {
    const files = nw.files || {}, oldF = (cur && cur.files) || {};
    let total = 0, done = 0;
    for (const k in files) if (!oldF[k] || oldF[k][0] !== files[k][0]) total += files[k][1];
    ui(4, 'Mise à jour vers la version ' + vNew + '…', 'v' + (vCur < 0 ? '?' : vCur) + ' → v' + vNew);
    for (const k in files) {
      const out = path.join(tmp, ...k.split('/')); fs.mkdirSync(path.dirname(out), { recursive: true });
      let data = null;
      if (oldF[k] && oldF[k][0] === files[k][0]) { try { data = fs.readFileSync(path.join(base, ...k.split('/'))); } catch (e) { data = null; } }   // inchangé : on le recopie
      if (!data) {
        data = await get(SITE + k.split('/').map(encodeURIComponent).join('/') + '?v=' + vNew, 30000); done += files[k][1];
        ui(4 + 94 * (total ? done / total : 1), 'Téléchargement de la mise à jour… ' + Math.round(done * 100 / Math.max(1, total)) + ' %');
      }
      fs.writeFileSync(out, data);
    }
    fs.writeFileSync(path.join(tmp, 'version.json'), JSON.stringify(nw));
    rm(old); if (fs.existsSync(game)) fs.renameSync(game, old); fs.renameSync(tmp, game); rm(old);
    ROOT = game;
    ui(100, 'Mise à jour terminée !', 'v' + vNew);
    await new Promise((r) => setTimeout(r, 350));
  } catch (e) { rm(tmp); ROOT = fs.existsSync(path.join(game, 'version.json')) ? game : BUNDLED; }
}

app.whenReady().then(async () => {
  GAME = path.join(app.getPath('userData'), 'game');
  protocol.handle('app', (req) => {
    let p = decodeURIComponent(new URL(req.url).pathname);
    if (p === '/' || p === '') p = '/index.html';
    return net.fetch(pathToFileURL(path.join(ROOT, p)).toString());
  });
  Menu.setApplicationMenu(null);
  const win = new BrowserWindow({
    width: 1600, height: 900, fullscreen: true, backgroundColor: '#0b0418', title: 'Wald Game',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: { backgroundThrottling: false }
  });
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') win.setFullScreen(!win.isFullScreen());
    if (input.type === 'keyDown' && input.key === 'F4' && input.alt) app.quit();
  });
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(SCREEN));
  const ui = (p, m, v) => { win.webContents.executeJavaScript(`setP(${Math.round(p)},${JSON.stringify(m || '')},${JSON.stringify(v || '')})`).catch(() => {}); };
  const upd = update(ui).catch(() => {});
  let done = false; upd.then(() => { done = true; });
  for (let i = 0; i < 60 && !ONLINE && !done; i++) await new Promise((r) => setTimeout(r, 100));   // le site répond vite ; la copie hors ligne finit en arrière-plan
  if (ONLINE) { win.loadURL(ONLINE).catch(() => win.loadURL('app://jeu/index.html?jouer')); }
  else { await upd; win.loadURL('app://jeu/index.html?jouer'); }
});
app.on('window-all-closed', () => app.quit());
