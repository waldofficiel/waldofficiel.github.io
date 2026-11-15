// Pont « WG » entre la page (launcher ou jeu installé) et l'appli Wald Game.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('WG', {
  installed: () => ipcRenderer.sendSync('wg-installed'),
  busy: () => ipcRenderer.sendSync('wg-busy'),
  install: () => ipcRenderer.send('wg-install'),
  play: (q) => ipcRenderer.send('wg-play', String(q || '')),
  launcher: () => ipcRenderer.send('wg-launcher'),
  uninstall: () => ipcRenderer.send('wg-uninstall'),
  profile: () => ipcRenderer.sendSync('wg-profile'),
  saveProfile: (s) => ipcRenderer.send('wg-saveProfile', String(s || ''))
});
