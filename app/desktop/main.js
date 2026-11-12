// Wald Royal pour PC : fenêtre plein écran, le jeu tourne depuis les fichiers installés (hors ligne)
const { app, BrowserWindow, protocol, net, Menu } = require('electron');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');   // musique du salon dès l'ouverture
const path = require('path');
const { pathToFileURL } = require('url');

protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }]);
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('force_high_performance_gpu');

app.whenReady().then(() => {
  protocol.handle('app', (req) => {
    let p = decodeURIComponent(new URL(req.url).pathname);
    if (p === '/' || p === '') p = '/index.html';
    return net.fetch(pathToFileURL(path.join(__dirname, 'game', p)).toString());
  });
  Menu.setApplicationMenu(null);
  const win = new BrowserWindow({
    width: 1600, height: 900, fullscreen: true, backgroundColor: '#0b0418', title: 'Wald Royal',
    icon: path.join(__dirname, 'game', 'icons', 'icon-512.png'),
    webPreferences: { backgroundThrottling: false }
  });
  win.loadURL('app://jeu/index.html?jouer');
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') win.setFullScreen(!win.isFullScreen());
    if (input.type === 'keyDown' && input.key === 'F4' && input.alt) app.quit();
  });
});
app.on('window-all-closed', () => app.quit());
