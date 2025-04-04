const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const url = require('url');
const path = require('path');

let mainWindow;
let loginWindow;
let splashWindow;
let updateTimeout;

autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'debug';

const log = require('electron-log');

log.info('App is starting up');  // This will force the log file to be created
console.log('Log file location:', log.transports.file.getFile().path);


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
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.setMenu(null);

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'blank.html'),
      protocol: 'file:',
      slashes: true,
    })
  );

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

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

function checkLoginAndShowWindow() {
  console.log('checkLoginAndShowWindow triggered');
  const isLoggedIn = false; // TODO: Replace with real login check

  if (splashWindow) {
    splashWindow.close();
    splashWindow = null;
  }

  if (!isLoggedIn) {
    console.log('Not logged in, showing login modal...');
    showLoginWindow();
  } else {
    console.log('Already logged in, loading app...');
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, 'dist/electron-template/browser/index.html'),
        protocol: 'file:',
        slashes: true,
      })
    );
    mainWindow.show(); // Show only after loading real content
  }
}


// Handle login success
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



// Auto-updater events
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for update...');
  broadcastUpdateStatus('Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  clearTimeout(updateTimeout);
  console.log('Update available:', info);
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
  console.log('Update not available:', info);
  broadcastUpdateStatus('You have the latest version.');
  checkLoginAndShowWindow();
});

autoUpdater.on('error', (err) => {
  clearTimeout(updateTimeout);
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
      else checkLoginAndShowWindow(); // fallback if user clicks 'Later'
    });
});

// App ready
app.on('ready', () => {
  createSplashWindow();

  autoUpdater.checkForUpdatesAndNotify();

  // Fallback in case updater hangs
  updateTimeout = setTimeout(() => {
    if (splashWindow) {
      broadcastUpdateStatus('Update timeout. Proceeding...');
      splashWindow.close();
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
  app.quit();
  });
