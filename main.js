const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const url = require('url');
const path = require('path');

let mainWindow;
let loginWindow;

autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'debug';

//Create the main window
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

  //show a blank splash page
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
      contextIsolation: false
    }
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

//On login success — close login modal, load Angular app
ipcMain.on('login-success', () => {
  if (loginWindow) {
    loginWindow.close();
  }

  // Now load the Angular app into the main window
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'dist/electron-template/browser/index.html'),
      protocol: 'file:',
      slashes: true
    })
  );

});

//Auto-updater hooks
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info);
  dialog.showMessageBox({
    type: 'info',
    buttons: ['Ok'],
    title: 'Application Update',
    message: 'A new version is available!',
    detail: 'Downloading update...',
  });
});

autoUpdater.on('update-not-available', (info) => {
  console.log('Update not available:', info);
});

autoUpdater.on('error', (err) => {
  console.log('Error in auto-updater:', err);
});

autoUpdater.on('download-progress', (progressObj) => {
  console.log(
    `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`
  );
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded');
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

app.on('ready', () => {
  createMainWindow();
  autoUpdater.checkForUpdatesAndNotify();

  // After short delay (to allow splash/update check), show login
  setTimeout(() => {
    const isLoggedIn = false; // TODO: Replace with actual login state check
    if (!isLoggedIn) {
      showLoginWindow();
    } else {
      // If already logged in, load main app directly
      mainWindow.loadURL(
        url.format({
          pathname: path.join(__dirname, 'dist/electron-template/browser/index.html'),
          protocol: 'file:',
          slashes: true,
        })
      );
    }
  }, 1500);
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
