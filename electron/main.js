const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: 'Suno Music Generator',
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    backgroundColor: '#1a0033',
    show: false, // No mostrar hasta que esté listo
  });

  // En desarrollo, carga desde localhost:3000
  // En producción, carga desde archivos estáticos
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../out/index.html')}`;

  mainWindow.loadURL(startUrl);

  // Mostrar cuando esté listo
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Abrir DevTools solo en desarrollo
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Crear menú personalizado
  createMenu();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Manejar enlaces externos
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

function createMenu() {
  const template = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Nueva Canción',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('new-song');
          },
        },
        { type: 'separator' },
        {
          label: 'Configuración',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('open-settings');
          },
        },
        { type: 'separator' },
        {
          label: 'Salir',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Editar',
      submenu: [
        { label: 'Deshacer', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Rehacer', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cortar', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copiar', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Pegar', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Seleccionar Todo', accelerator: 'CmdOrCtrl+A', role: 'selectAll' },
      ],
    },
    {
      label: 'Vista',
      submenu: [
        { label: 'Recargar', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Forzar Recarga', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { type: 'separator' },
        { label: 'Zoom +', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Zoom -', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: 'Zoom Reset', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'Pantalla Completa', accelerator: 'F11', role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Documentación',
          click: () => {
            require('electron').shell.openExternal('https://github.com/tu-repo/docs');
          },
        },
        {
          label: 'Reportar Bug',
          click: () => {
            require('electron').shell.openExternal('https://github.com/tu-repo/issues');
          },
        },
        { type: 'separator' },
        {
          label: 'Acerca de',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Suno Music Generator',
              message: 'Suno Music Generator',
              detail: `Versión: ${app.getVersion()}\nDesarrollado por: Narciso Pardo\n\nGenerador de música con IA usando Suno API`,
              buttons: ['OK'],
            });
          },
        },
      ],
    },
  ];

  // En desarrollo, añadir menú de DevTools
  if (isDev) {
    template.push({
      label: 'Desarrollador',
      submenu: [
        { label: 'DevTools', accelerator: 'F12', role: 'toggleDevTools' },
        {
          label: 'Reiniciar App',
          accelerator: 'CmdOrCtrl+Alt+R',
          click: () => {
            app.relaunch();
            app.exit();
          },
        },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC Handlers
ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});

ipcMain.handle('get-version', () => {
  return app.getVersion();
});

// Inicialización de la app
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
