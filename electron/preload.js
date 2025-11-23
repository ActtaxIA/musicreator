const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al renderer process
contextBridge.exposeInMainWorld('electron', {
  // Información de la app
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  getVersion: () => ipcRenderer.invoke('get-version'),

  // Listeners
  onNewSong: (callback) => {
    ipcRenderer.on('new-song', callback);
  },
  onOpenSettings: (callback) => {
    ipcRenderer.on('open-settings', callback);
  },

  // Remover listeners
  removeListener: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
});
