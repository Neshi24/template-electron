const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const url = require('url');
const path = require('path');

let mainWindow;
let loginWindow;
let splashWindow;
let updateTimeout;

// Configure autoUpdater logging
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'debug';

const log = require('electron-log');

log.info('App is starting up');
console.log('Log file location:', log.transports.file.getFile().path);

//Broadcasts update status messages to both the main and login windows (if open).
function broadcastUpdateStatus(msg) {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('update-status', msg);
  }
  if (loginWindow && loginWindow.webContents) {
    loginWindow.webContents.send('update-status', msg);
  }
}

//Creates the main application window.
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.setMenu(null);
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

//Creates and displays the splash screen shown during updates.
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 250,
    modal: true,
    resizable: false,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  splashWindow.setMenu(null);

  splashWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'dist/electron-template/browser/splash.html'),
      protocol: 'file:',
      slashes: true,
    })
  );

  splashWindow.on('closed', function () {
    splashWindow = null;
  });
}

//Shows the login window if the user is not logged in.
function showLoginWindow() {
  loginWindow = new BrowserWindow({
    width: 400,
    height: 300,
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

//Determines whether the user is logged in and opens the appropriate window.
function checkLoginAndShowWindow() {
  log.info('checkLoginAndShowWindow triggered');
  const isLoggedIn = false; // TODO: Replace with real login check

  if (splashWindow) {
    splashWindow.close();
    splashWindow = null;
  }

  if (!isLoggedIn) {
    log.info('Not logged in, showing login modal...');
    showLoginWindow();
  } else {
    log.info('Already logged in, loading app...');
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, 'dist/electron-template/browser/index.html'),
        protocol: 'file:',
        slashes: true,
      })
    );
    mainWindow.show();
  }
}

// Listen for login success event
ipcMain.on('login-success', () => {
  if (loginWindow) {
    loginWindow.close();
    loginWindow = null;
  }

  createMainWindow();

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'dist/electron-template/browser/index.html'),
      protocol: 'file:',
      slashes: true,
    })
  );

  mainWindow.show();
});

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  log.info('Checking for update...');
  broadcastUpdateStatus('Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  clearTimeout(updateTimeout);
  log.info('Update available:', info);
  broadcastUpdateStatus('Update available. Downloading...');
  dialog.showMessageBox({
    type: 'info',
    buttons: ['Ok'],
    title: 'Application Update',
    message: 'A new version is available!',
    detail: 'Downloading update...',
  });
});

autoUpdater.on('update-not-available', (info) => {
  clearTimeout(updateTimeout);
  log.info('Update not available:', info);
  broadcastUpdateStatus('You have the latest version.');
  checkLoginAndShowWindow();
});

autoUpdater.on('error', (err) => {
  clearTimeout(updateTimeout);
  log.error('Error in auto-updater:', err);
  broadcastUpdateStatus('Update check failed. Continuing...');
  checkLoginAndShowWindow();
});

autoUpdater.on('download-progress', (progressObj) => {
  const progressMsg = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${Math.round(progressObj.percent)}%`;
  log.info(progressMsg);
  broadcastUpdateStatus(progressMsg);
});

autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded');
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
      if (returnValue.response === 0) {
        autoUpdater.quitAndInstall();
      } else {
        checkLoginAndShowWindow();
      }
    });
});

// Event: App is ready. Show splash screen and start checking for updates.
app.on('ready', () => {
  createSplashWindow();
  autoUpdater.checkForUpdatesAndNotify();

  updateTimeout = setTimeout(() => {
    if (splashWindow) {
      broadcastUpdateStatus('Update timeout. Proceeding...');
      splashWindow.close();
      checkLoginAndShowWindow();
    }
  }, 1500);
});

// macOS-specific behavior: Recreate window if app is reactivated
app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow();
  }
});

// Close the app when all windows are closed (default behavior for most OS)
app.on('window-all-closed', () => {
  app.quit();
});
