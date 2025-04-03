const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const url = require('url');
const path = require('path');

let mainWindow;
let loginWindow;

autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'debug';

// Broadcast update status to splash and login window (if open)
function broadcastUpdateStatus(msg) {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('update-status', msg);
  }
  if (loginWindow && loginWindow.webContents) {
    loginWindow.webContents.send('update-status', msg);
  }
}

// Create the main window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    show: true,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.setMenu(null);

  // Load splash screen
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'splash.html'),
      protocol: 'file:',
      slashes: true,
    })
  );

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const child = new BrowserWindow({
      parent: mainWindow,
      modal: false,
      show: true,
      webPreferences: {
        nodeIntegration: true,
      },
    });

    child.setMenu(null);
    child.loadURL(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Create the login window
function showLoginWindow() {
  loginWindow = new BrowserWindow({
    width: 400,
    height: 300,
    parent: mainWindow,
    modal: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  loginWindow.setMenu(null);

  loginWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'dist/electron-template/browser/login.html'),
      protocol: 'file:',
      slashes: true,
    })
  );

  loginWindow.on('closed', () => {
    loginWindow = null;
  });
}

// Check login status and load login or main app
function checkLoginAndShowWindow() {
  console.log('checkLoginAndShowWindow triggered');
  const isLoggedIn = false; // TODO
  if (!isLoggedIn) {
    console.log('Not logged in, showing login modal...');
    showLoginWindow();
  } else {
    console.log('Already logged in, loading main app...');
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, 'dist/electron-template/browser/index.html'),
        protocol: 'file:',
        slashes: true,
      })
    );
  }
}

// Handle login success
ipcMain.on('login-success', () => {
  if (loginWindow) {
    loginWindow.close();
  }

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'dist/electron-template/browser/index.html'),
      protocol: 'file:',
      slashes: true,
    })
  );
});

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for update...');
  broadcastUpdateStatus('Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info);
  broadcastUpdateStatus('Update available. Downloading...');
  dialog.showMessageBox({
    type: 'info',
    buttons: ['Ok'],
    title: 'Application Update',
    message: 'A new version is available!',
    detail: 'Downloading update...',
  }).then(() => {
    checkLoginAndShowWindow();
  });
});

autoUpdater.on('update-not-available', (info) => {
  console.log('Update not available:', info);
  broadcastUpdateStatus('You have the latest version.');
  checkLoginAndShowWindow();
});

autoUpdater.on('error', (err) => {
  console.log('Error in auto-updater:', err);
  broadcastUpdateStatus('Update check failed. Continuing...');
  checkLoginAndShowWindow();
});

autoUpdater.on('download-progress', (progressObj) => {
  const progressMsg = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${Math.round(progressObj.percent)}%`;
  console.log(progressMsg);
  broadcastUpdateStatus(progressMsg);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded');
  broadcastUpdateStatus('Update downloaded. Ready to install.');
  dialog
    .showMessageBox({
      type: 'info',
      buttons: ['Restart', 'Later'],
      title: 'Application Update',
      message: 'Update Ready',
      detail: 'Restart the app to apply the update.',
    })
    .then((returnValue) => {
      if (returnValue.response === 0) autoUpdater.quitAndInstall();
    });
});

// App ready
app.on('ready', () => {
  createMainWindow();
  autoUpdater.checkForUpdatesAndNotify();

  setTimeout(() => {
    if (!loginWindow) {
      console.log('Fallback: update check timeout, showing login window.');
      broadcastUpdateStatus('Update check timeout. Proceeding to login...');
      checkLoginAndShowWindow();
    }
  }, 5000);
});

app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
