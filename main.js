const electron = require('electron');
// Module to control application life.
const app = electron.app;
const ipc = electron.ipcMain;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const Tray = electron.Tray;
const dialog = electron.dialog;
const Notification = electron.Notification;
const shell = electron.shell;

const settings = require('electron-settings');

const path = require('path');
const url = require('url');
const dns = require('dns');
const request = require('request');
const childProcess = require('child_process');

const lockSystem = require('lock-system');
const desktopIdle = require('desktop-idle');
const detectFullscreen = require('./assets/detect-fullscreen');
// const Utils = require('./assets/utils');


/*const { default: installExtension, VUEJS_DEVTOOLS } = require('electron-devtools-installer');*/

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let primaryWorkArea;
let settingsWindow;
let saverWindow;
let saverExternalWindow;

let settingsWindowX = 1920/2;
let settingsWindowY = 1080/2;
let settingsWindowWidth = 800;
let settingsWindowHeight = 600;

let saverWindowX = 0;
let saverWindowY = 0;
let saverWindowWidth = 1920;
let saverWindowHeight = 1080;

let externalDisplay = null;
let saverExternalWindowX = 1920 + 20;
let saverExternalWindowY = 0;
let saverExternalWindowWidth = 1920;
let saverExternalWindowHeight = 1080;

let appIcon = null;
let showTrayIcon = true;
let iconPathNorm;
let iconPathSusp;
let iconPathConnected;
let iconPathDisconnected;
let notification = null;
let appSettings = null;
let aboutDialog = null;
let trayWarnDialog = null;
let isSuspendSaver = false;
// let idleTimer = 0;
let idleTimeOut = 0;
let resetIdleValue = 8640; // ~2.4h
let resetFullScreenValue = 8640; // ~2.4h
let checkDnsLookUpTimeOut = 0;
let checkDnsLookUpAttempt = 0;
let afterRunSaverWindowTimeOut = 0;
let notificationTimeOut = 0;
let isConnectedFlag = true;
let isRunByIdleTimer = false;
let newAppVersionValue = null;
var checkConnectionStatusChanged;
let isShowSettingsOnLoad = false;


const mainAppName = 'V-Saver';
const mainRepoUrl = 'https://github.com/Nowalon/v-saver';
const checkVersionUrl='https://raw.githubusercontent.com/Nowalon/v-saver/master/package.json';

/* devDebugMode ONLY */ var isDevDebugMode = false;

app.setName(mainAppName);

var shouldQuit = makeSingleInstance();
if (shouldQuit) return app.quit();

function createSettingsWindow () {
  checkSetSettingsWindowPosition();
  var windowOptions = {
    width: settingsWindowWidth,
    minWidth: settingsWindowWidth,
    height: settingsWindowHeight,
    x: settingsWindowX,
    y: settingsWindowY,
    resizable: false,
    titleBarStyle: 'hidden',
    frame: false,
    opacity: 0.8,
    title: app.getName(),
    backgroundColor: '#2f3241',
    webPreferences: {}
  };
  if(isDevDebugMode) {
    windowOptions.width = 1500;
  }
  if (process.platform === 'linux') {
    windowOptions.icon = path.join(__dirname, '/assets/img/videoscreensaver-gradient-icon.png');
  }
  // Create the browser window.
  settingsWindow = new BrowserWindow(windowOptions);

  // and load the settings.html of the app.
  settingsWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'settings.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Open the DevTools.
  isDevDebugMode && settingsWindow.webContents.openDevTools();
// settingsWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  settingsWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    settingsWindow = null;
  });

  settingsWindow.on('close', () => {
    var settingsWindowPositionOnClose = settingsWindow.getPosition();
    settings.set('settingswindowposition', {x: settingsWindowPositionOnClose[0], y: settingsWindowPositionOnClose[1]});
  });
}


function createSaverWindow (playOpts) {
  const _playOpts = playOpts || null;
  let addArgsArr = [];
  let forceVideoMode = false;
  if (_playOpts && _playOpts.filePath) {
    addArgsArr = [`--filepathindex=${_playOpts.filePathindex}`, `--filepath=${_playOpts.filePath}`];
    forceVideoMode = true;
  }

  var windowOptions = {
    width: saverWindowWidth,
    minWidth: saverWindowWidth,
    height: saverWindowHeight,
    x: saverWindowX,
    y: saverWindowY,
    alwaysOnTop: true,
    fullscreen: true,
    skipTaskbar: true,
    frame: false,
    title: app.getName(),
    backgroundColor: '#000000',
    webPreferences: {
      additionArguments: addArgsArr, // some fallback for https://github.com/electron/electron/issues/12420
      additionalArguments: addArgsArr
    }
  };
  if (process.platform === 'linux') {
    windowOptions.icon = path.join(__dirname, '/assets/img/videoscreensaver-gradient-icon.png');
  }
  
  var saverTypeMain = appSettings && appSettings.hasOwnProperty('saverTypeMain') ? appSettings.saverTypeMain : 'video';
  var saverWindowPath = saverTypeMain === 'video' || forceVideoMode ? 'vsaver.html' : 'vsaver-clock.html';

  saverWindow = new BrowserWindow(windowOptions);
  saverWindow.loadURL(url.format({
    pathname: path.join(__dirname, saverWindowPath),
    protocol: 'file:',
    slashes: true
  }));

  if(!isDevDebugMode) {
    saverWindow.setFullScreen(true);
  }
  // Open the DevTools.
  isDevDebugMode && saverWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  saverWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    saverWindow = null;
  });

  saverWindow.on('blur', (e) => {
    saverWindow && runSaverWindow();
  });
  saverWindow.on('move', (e) => {
    saverWindow && runSaverWindow();
  });
  saverWindow.on('leave-full-screen', (e) => {
    saverWindow && runSaverWindow();
  });

  setTimeout(() => {
    /* some hack fix for cursor hiding */
    saverWindow.setFullScreen(false);
  }, 300);

  /* strange, but it looks as it works ... */
  setTimeout(() => {
    const eventObj = {
      type: 'mouseMove',
      x: 10,
      y: 10,
      globalX: 10,
      globalY: 10,
      movementX: 10,
      movementY: 10
    };
    saverWindow && saverWindow.webContents.sendInputEvent(eventObj);
  }, 3000);
}


function createSaverExternalWindow () {
  var windowOptions = {
    width: saverExternalWindowWidth,
    minWidth: saverExternalWindowWidth,
    height: saverExternalWindowHeight,
    x: saverExternalWindowX,
    y: saverExternalWindowY,
    alwaysOnTop: true,
    fullscreen: true,
    skipTaskbar: true,
    frame: false,
    title: app.getName(),
    backgroundColor: '#000000'
  };
  if (process.platform === 'linux') {
    windowOptions.icon = path.join(__dirname, '/assets/img/videoscreensaver-gradient-icon.png');
  }

  var saverTypeExternal = appSettings && appSettings.hasOwnProperty('saverTypeExternal') ? appSettings.saverTypeExternal : 'clock';
  var saverWindowPath = saverTypeExternal === 'clock' ? 'vsaver-clock.html' : 'vsaver.html';

  // Create the browser window.
  saverExternalWindow = new BrowserWindow(windowOptions);
  saverExternalWindow.loadURL(url.format({
    pathname: path.join(__dirname, saverWindowPath),
    protocol: 'file:',
    slashes: true
  }));
  if(!isDevDebugMode) {
    saverExternalWindow.setFullScreen(true);
  }
  // Open the DevTools.
  isDevDebugMode && saverExternalWindow.webContents.openDevTools();
  // Emitted when the window is closed.
  saverExternalWindow.on('closed', function () {
    saverExternalWindow = null;
  });
  setTimeout(() => {
    const eventObj = {
      type: 'mouseMove',
      x: 10,
      y: 10,
      globalX: 10,
      globalY: 10,
      movementX: 10,
      movementY: 10
    };
    saverExternalWindow.webContents.sendInputEvent(eventObj)
  }, 3000);
}

function runSaverExternalWindow () {
  if (appSettings && saverExternalWindow) {
    saverExternalWindow.show();
    saverExternalWindow.setFullScreen(true);
  } else {
    if (appSettings) {
      createSaverExternalWindow();
    }
  }
}


function runSaverWindow (playParams) {
  const _playParams = playParams || null;
  if (appSettings && saverWindow) {
    saverWindow.show();
    saverWindow.focus();
    saverWindow.setFullScreen(true);
  } else {
    if (appSettings) {
      createSaverWindow(_playParams);
    }
  }
  if (externalDisplay) {
    runSaverExternalWindow();
  }
  afterRunSaverWindowTimeOut && clearTimeout(afterRunSaverWindowTimeOut);
  afterRunSaverWindowTimeOut = setTimeout(() => {
    clearTimeout(afterRunSaverWindowTimeOut);
    afterRunSaverWindowTimeOut = 0;
  }, 10000);
}


async function checkSystemIdle () { // call after app.on('ready') and settings loaded only!
  idleTimeOut && clearTimeout(idleTimeOut);
  var idleTimerSec = appSettings.runInterval * 1 * 60;
  var idleTimeOutValue = 10000; // 10000~20000 ?
  resetIdleValue = appSettings && appSettings.hasOwnProperty('resetSuspendInterval') ? appSettings.resetSuspendInterval * 1 * 60 : resetIdleValue;
  resetFullScreenValue = appSettings && appSettings.hasOwnProperty('resetFullScreenInterval') ?
    appSettings.resetFullScreenInterval * 1 * 60 : resetFullScreenValue;
  var showInternetConnectionNotification = (appSettings && appSettings.showInternetConnectionNotification) || false;

  if(isDevDebugMode){
    idleTimerSec = 99999999;
    idleTimeOutValue = 2000;
  }

  let isSomeFullscreenExists = await detectFullscreen();
  if (isSomeFullscreenExists === null) isSomeFullscreenExists = false;

  idleTimeOut = setTimeout(() => {
    const isSystemLocked = checkIsGnomeScreenLocked();
    var desktopIdleSec = desktopIdle.getIdleTime();
    if (desktopIdleSec >= idleTimerSec) {
      if (!isSuspendSaver && (!isSomeFullscreenExists || (desktopIdleSec >= resetFullScreenValue))) {
        if (!isRunByIdleTimer){
          isRunByIdleTimer = true;
          if (!isSystemLocked) {
            runSaverWindow();
          }
        }
      }
      if(desktopIdleSec >= resetIdleValue) {
        isSuspendSaver = false;
        showTrayIcon && handleChangeContextMenuTemplate();
      }
    } else {
      isRunByIdleTimer = false;
    }

    if (!saverWindow && showTrayIcon) {
      var connecNotifParams = {
        title: `${mainAppName} - Internet connection`
      };
      checkConnection().then(res => {
        if (checkConnectionStatusChanged()) {
          handleChangeContextMenuTemplate();
          connecNotifParams.body = 'Internet connection established';
          connecNotifParams.icon = iconPathConnected;
          showInternetConnectionNotification && showNotification(connecNotifParams);
        }
      }).catch(err => {
        if (checkConnectionStatusChanged()) {
          handleChangeContextMenuTemplate();
          connecNotifParams.body = 'Internet connection lost';
          connecNotifParams.icon = iconPathDisconnected;
          showInternetConnectionNotification && showNotification(connecNotifParams);
          console.log(err);
        }
      });
    }

    checkSystemIdle();
  }, idleTimeOutValue);
}


function connectionSwitched() {
  var connected = true;
  return function () {
    if (connected !== isConnectedFlag) {
      connected = isConnectedFlag;
      return true;
    } else {
      return false;
    }
  }
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  // process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
  // process.env['ELECTRON_ENABLE_SECURITY_WARNINGS'] = 'false';
  primaryWorkArea = electron.screen.getPrimaryDisplay().workArea;
  if (settings.has('settings')) {
    appSettings = settings.get('settings');
    isShowSettingsOnLoad = appSettings && appSettings.hasOwnProperty('showSettingsOnLoad') ? appSettings.showSettingsOnLoad : false;
    showTrayIcon = appSettings && appSettings.hasOwnProperty('showTrayIcon') ? appSettings.showTrayIcon : false;
    /* devDebugMode */ isDevDebugMode = appSettings && appSettings.hasOwnProperty('devDebugMode') ? appSettings.devDebugMode : false;
  } else {
    setTimeout(() => {
      createSettingsWindow();
    }, 300);
  }

/*
  isDevDebugMode && installExtension(VUEJS_DEVTOOLS)
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((err) => console.log('An error occurred: ', err));
*/

  iconPathConnected = path.join(__dirname, '/assets/img/v-saver__icon.png');
  iconPathDisconnected = path.join(__dirname, '/assets/img/cloud-connection.png');

  if (appSettings && appSettings.runInterval) {
    checkSystemIdle();
  }

  electron.screen.on('display-metrics-changed', (event) => {
    checkDisplays();
  });
  electron.screen.on('display-added', (event) => {
    checkDisplays();
  });
  electron.screen.on('display-removed', (event) => {
    checkDisplays();
  });
  checkDisplays();
  const primaryDisplaySize = electron.screen.getPrimaryDisplay().size;
  saverWindowWidth = primaryDisplaySize.width;
  saverWindowHeight = primaryDisplaySize.height;
  showTrayIcon && setTrayIconMenu();

  if (isShowSettingsOnLoad && process.argv.indexOf('--relaunch') >=0) {
    createSettingsWindow();
  }

  process
    .on('unhandledRejection', (reason, p) => console.error(reason, 'Unhandled Rejection at Promise', p))
    .on('uncaughtException', err => {
      console.error(err, 'Uncaught Exception thrown');
      process.exit(1);
    });

}); // ready



// Force app keep in background when all windows are closed.
app.on('window-all-closed', function () {
  return false;
});

app.on('quit', function () {
    if (appIcon) appIcon.destroy();
    settingsWindow = null;
    saverWindow = null;
    aboutDialog = null;
    app.quit();
});

app.on('activate', function () {
  if (settingsWindow === null) {
    createSettingsWindow();
  }
});


ipc.on('open-file-dialog', function (event) {
  dialog.showOpenDialog({
    title: 'Select video files - mp4 preferred (required for WEB)',
    properties: ['openFile', 'multiSelections', 'showHiddenFiles'],
    filters: [
      {name: 'Movies', extensions: ['webm', /*'avi',*/ 'mp4']}
    ]
  }, function (filePaths) {
    if (filePaths) event.sender.send('selected-files-reply', filePaths)
  })
});

ipc.on('save-settings', function (event, settingsData) {
  var isFirstNoSettingsRun;
  if (settings.has('settings')) {
    appSettings = settings.get('settings');
    isFirstNoSettingsRun = false;
  } else {
    isFirstNoSettingsRun = true;
  }
  settings.set('settings', settingsData);
  appSettings = settings.get('settings');
  if (settingsData && settingsData.hasOwnProperty('showTrayIcon')) {
    if (settingsData.showTrayIcon !== showTrayIcon) {
      changeTrayIconVisible(settingsData.showTrayIcon);
      if (!settingsData.showTrayIcon) {
        relaunch(true);
      }
    }
  }
  /* devDebugMode */ isDevDebugMode = appSettings && appSettings.hasOwnProperty('devDebugMode') ? appSettings.devDebugMode : false;
  event.sender.send('save-settings-reply', 'Settings saved!');
  isFirstNoSettingsRun && checkSystemIdle();
});

ipc.on('load-settings', function (event, msg) {
  if (settings.has('settings')) {
    appSettings = settings.get('settings')
  }
  if (appSettings) {
    appSettings.externalDisplay = externalDisplay ? true : false;
  }
  event.sender.send('load-settings-reply', appSettings);
});

ipc.on('reset-settings', function (event, settingsData) {
  settings.set('settings', settingsData);
  appSettings = settings.get('settings');
  if (appSettings) {
    appSettings.externalDisplay = externalDisplay ? true : false;
  }
  event.sender.send('reset-settings-reply', appSettings);
});

ipc.on('open-about-dialog', function (event, arg) {
  showAboutDialogMessage();
});

ipc.on('close-settings', function (event, settingsData) {
  settingsWindow.close();
});

ipc.on('minimize-settings', function (event) {
  settingsWindow.minimize();
});

ipc.on('run-vsaver-window', function (event) {
  runSaverWindow();
});

ipc.on('play-by-index', function (event, playData) {
  const _playData = playData || null;
  runSaverWindow (_playData);
});

ipc.on('close-vsaver-window', function (event) {
  if (appSettings && appSettings.lockSystemOnExit) {
    if (afterRunSaverWindowTimeOut === 0) {
      lockSystem();
    }
  }
  setTimeout(() => {
    saverWindow && saverWindow.close();
    saverExternalWindow && saverExternalWindow.close();
  }, 1600); // 1800
});

ipc.on('check-internet-connection', function (event) {
  checkConnection().then(res => {
    event.sender.send('check-internet-connection-reply', true);
  }).catch(err => {
    event.sender.send('check-internet-connection-reply', false);
  });
});

ipc.on('check-app-version', function (event) {
  checkConnection().then(res => {
    checkVersion().then(isewVersionResult => {
      event.sender.send('check-app-version-reply', isewVersionResult);
    }).catch(versionErr => {
      event.sender.send('check-app-version-reply', false);
    });
  }).catch(err => {
    event.sender.send('check-app-version-reply', false);
  });
});

ipc.on('delete-settings', function (event, msg) {
  settings.deleteAll();
  appSettings = settings.get('settings');
  event.sender.send('delete-settings-reply', appSettings);
});

ipc.on('show-notification', function (event, arg) {
  showNotification(arg);
});

// ipc.on('check-test-send', function (event, arg) {
//   console.log(' ------------ check-test-send data: ', arg)
// });


function setTrayIconMenu() {
  const iconNameNormal = process.platform === 'win32' ? '/assets/img/v-saver.ico' : '/assets/img/v-saver__icon.png';
  const iconNameSuspended = process.platform === 'win32' ? '/assets/img/v-saver-suspended.ico' : '/assets/img/v-saver-suspended__icon.png';
  const iconNameNormalDisconected = process.platform === 'win32' ? '/assets/img/disconnected__v-saver.ico' : '/assets/img/disconnected__v-saver__icon.png';
  const iconNameSuspendedDisconected = process.platform === 'win32' ? '/assets/img/disconnected__v-saver-suspended.ico' : '/assets/img/disconnected__v-saver-suspended__icon.png';
  iconPathNorm = path.join(__dirname, iconNameNormal);
  iconPathSusp = path.join(__dirname, iconNameSuspended);
  iconPathNormNoConnect = path.join(__dirname, iconNameNormalDisconected);
  iconPathSuspNoConnect = path.join(__dirname, iconNameSuspendedDisconected);
  if (!appIcon) {
    appIcon = new Tray(iconPathNorm);
  }
  var contextMenuTemplate = getContextMenuTemplate(true);
  let contextMenu = Menu.buildFromTemplate(contextMenuTemplate);

  appIcon.setToolTip(mainAppName);
  appIcon.setTitle(mainAppName);
  appIcon.setContextMenu(contextMenu);

  checkConnectionStatusChanged = connectionSwitched();
  checkConnection().then(res => {
    checkVersion().then(isewVersionResult => {
      newAppVersionValue = isewVersionResult ? isewVersionResult : null;
      handleChangeContextMenuTemplate();
    }).catch(versionErr => { /**/ });
  }).catch(err => {
    /**/
  });

}


function getContextMenuTemplate(suspend) {
  var contextMenuTemplate = [
    {
      label: 'Suspend saver',
      click: function () {
        // just the template array item to be conditionally replaced
      }
    },
    {
      label: 'Run screensaver',
      click: function () {
        runSaverWindow();
      }
    },
    {
      label: 'Settings',
      click: function () {
        if (settingsWindow) {
          settingsWindow.show();
          settingsWindow.focus();
        } else {
          createSettingsWindow();
        }
      }
    },
    /* TODO: check/remove */
/*
    {
      label: 'Remove tray icon',
      click: function () {
        changeTrayIconVisible(false);
        // relaunch(); /!* TODO: check/remove *!/
      }
    },
*/
    {
      label: 'Lock system',
      click: () => {
        lockSystem();
      }
    },
    {
      label: 'About',
      click: () => {
        showAboutDialogMessage();
      }
    },
    {
      label: 'Exit',
      click: function () {
        if (appIcon) appIcon.destroy();
        app.exit()
      }
    }
  ];
  var isNewVersionStr = newAppVersionValue ? '* New version ' + newAppVersionValue + ' is available' : '';
  const newVersionItem = {
      label: isNewVersionStr,
      click: function () {
      shell.openExternal(mainRepoUrl);
    }
  };
  const suspendItem = {
      label: 'Suspend screensaver running',
      click: function () {
        isSuspendSaver = true;
        handleChangeContextMenuTemplate();
    }
  };
  const resumeItem = {
      label: 'Resume screensaver running',
      click: function () {
        isSuspendSaver = false;
        handleChangeContextMenuTemplate();
    }
  };
  const noConnectionItem = {
      label: '!!  No Internet connection  !!',
      click: function () {
        checkConnection();
    }
  };

  contextMenuTemplate[0] = suspend ? suspendItem : resumeItem;

  if (!isConnectedFlag) {
    contextMenuTemplate.splice(0, 0, noConnectionItem);
  }

  if (newAppVersionValue) {
    contextMenuTemplate.splice(contextMenuTemplate.length-2, 0, newVersionItem);
  }
  return contextMenuTemplate;
}


function handleChangeContextMenuTemplate(){
  var contextMenuTemplate = getContextMenuTemplate(!isSuspendSaver);
  contextMenu = Menu.buildFromTemplate(contextMenuTemplate);
  appIcon.setContextMenu(contextMenu);
  if (isSuspendSaver) {
    if (isConnectedFlag) {
      appIcon.setImage(iconPathSusp);
    } else {
      appIcon.setImage(iconPathSuspNoConnect);
    }
  } else {
    if (isConnectedFlag) {
      appIcon.setImage(iconPathNorm);
    } else {
      appIcon.setImage(iconPathNormNoConnect);
    }
  }
}


function showNotification(params) {
  if (notification) {
    notification.close();
  }
  
  params.title = params.title ? params.title : mainAppName;
  params.icon = params.icon ? params.icon : iconPathConnected;
  // TODO check notification icon (GNOME)
  if (Notification.isSupported()){
    notification = new Notification(params);
    notification.show();
    notificationTimeOut && clearTimeout(notificationTimeOut);
    notificationTimeOut = setTimeout(() => {
      notification.close();
      notification = null;
    }, 5000);
  }
}


function showAboutDialogMessage() {
  var isNewVersionStr = newAppVersionValue ? '\n\n A new version ' + newAppVersionValue + ' is available' : '';
  var aboutDialogMessage = `${app.getName().toUpperCase()}: version ${app.getVersion()} ${isNewVersionStr} \n \n
    using Node.js ${process.versions.node},
    Chromium ${process.versions.chrome},
    and Electron ${process.versions.electron}
    \n
    Electron based videoscreensaver`;
  aboutDialog = dialog.showMessageBox({
    type: 'info',
    title: `${mainAppName} - About`,
    icon: path.join(__dirname, '/assets/img/videoscreensaver-gradient-icon.png'),
    message: aboutDialogMessage,
    detail: 'github.com/Nowalon/v-saver',
    buttons: ['Ok'],
  }, () => {
    /* https://electronjs.org/docs/api/dialog  :  If a callback is passed, the dialog will not block the process. The API call will be asynchronous and the result will be passed via callback(response) */
  });
}


function checkConnection() {
  return new Promise(function(resolve, reject) {
    var done = false;
    var start = (new Date()).getTime();
    checkDnsLookUpTimeOut && clearTimeout(checkDnsLookUpTimeOut);
    checkDnsLookUpTimeOut = setTimeout(() => {
      if (done) { return false; }
      done = true;
      checkDnsLookUpAttempt++;
      if (checkDnsLookUpAttempt === 1) {
        checkConnection();
      } else {
        isConnectedFlag = false;
        reject(new Error('DNS lookup timout error'));
        return false;
      }
    }, 4500);
    dns.lookupService('8.8.8.8', 53, function(error, hostname, service){
      // google-public-dns-a.google.com domain
      if (error) {
        console.log('dns.lookup ERROR: ', error);
        if (done) { return false; }
        done = true;

        checkDnsLookUpAttempt++;
        if (checkDnsLookUpAttempt === 1) {
          checkConnection();
        } else {
          isConnectedFlag = false;
          reject(error);
        }
      } else {
        if (done) { return false; }
        var delta = ((new Date()).getTime() - start);
        done = true;
        isConnectedFlag = true;
        checkDnsLookUpAttempt = 0;
        resolve({hostname: hostname, time: delta});
      }
    });
  });
}


function checkSetSettingsWindowPosition() {
  var positionObj = {x: 0, y: 0}
  var padding = 4;
  if (settings.has('settingswindowposition')) {
    positionObj = settings.get('settingswindowposition');
    if (positionObj.x <= primaryWorkArea.x) {
      settingsWindowX = parseInt(primaryWorkArea.x + padding);
    } else if (positionObj.x >= (primaryWorkArea.width - settingsWindowWidth + primaryWorkArea.x)) {
      settingsWindowX = parseInt(primaryWorkArea.width - settingsWindowWidth + primaryWorkArea.x - padding);
    } else {
      settingsWindowX = parseInt(positionObj.x);
    }
    if (positionObj.y <= primaryWorkArea.y) {
      settingsWindowY = parseInt(primaryWorkArea.y + padding);
    } else if (positionObj.y >= primaryWorkArea.height - settingsWindowHeight) {
      settingsWindowY = parseInt(primaryWorkArea.height - settingsWindowHeight);
    } else {
      settingsWindowY = parseInt(positionObj.y);
    }
  } else {
    settingsWindowX = parseInt((primaryWorkArea.width - settingsWindowWidth) / 2);
    settingsWindowY = parseInt((primaryWorkArea.height - settingsWindowHeight) / 2);
  }
}


function checkDisplays() {
  let displays = electron.screen.getAllDisplays();
  let primaryDisplay = {};
  if (displays.length > 1) {
    primaryDisplay = displays.find((display) => {
      return (primaryWorkArea.x == display.workArea.x && primaryWorkArea.y == display.workArea.y);
    });
    externalDisplay = displays.find((display) => {
      return (primaryWorkArea.x !== display.workArea.x && primaryWorkArea.y !== display.workArea.y);
    });

    if (primaryDisplay && primaryDisplay.workArea) {
      saverWindowX = primaryDisplay.workArea.x;
      saverWindowY = primaryDisplay.workArea.y;
    }

    if (externalDisplay && externalDisplay.bounds) {
      saverExternalWindowX = externalDisplay.bounds.x + 30;
      saverExternalWindowY = externalDisplay.bounds.y + 30;
      saverExternalWindowWidth = externalDisplay.size.width;
      saverExternalWindowHeight = externalDisplay.size.height;
    } else {
      externalDisplay = null;
    }
  } else {
    externalDisplay = null;
  }
}


function checkIsGnomeScreenLocked() {
  const commandName = 'gnome-screensaver-command';
  try {
    const result = childProcess.execFileSync('which', [commandName], {encoding: 'utf8'});
    if (result && result.length > 0) {
      let execGnomeScreensaverCommand = childProcess.execFileSync(commandName, ['-t']).toString('utf8');
      return (/\d/g).test(execGnomeScreensaverCommand);
    }
  } catch (err) {
    return false;
  }
}


function checkVersion() {
  var repVersion;
  return new Promise((resolve, reject) => {
    var appVersion = app.getVersion();
    request.get(checkVersionUrl, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var docJSONparsed = JSON.parse(body);
          repVersion = docJSONparsed.version;
          if (repVersion > appVersion) {
            resolve(repVersion);
          } else {
            resolve(false);
          }
        } else {
          reject(error);
        }
    });
  });
}


function changeTrayIconVisible(show) {
  if (show) {
    showTrayIcon = true;
    setTrayIconMenu();
  } else {
    showTrayIconWarnDialogMessage();
    if (appIcon) {
      showTrayIcon = false;
      appIcon.destroy();
      appIcon = null;
    }
  }
}


function showTrayIconWarnDialogMessage() {
  trayWarnDialog = dialog.showMessageBox({
    type: 'warning',
    title: `${mainAppName} - Warning`,
    message: 'Warning',
    detail: `Run another ${mainAppName} instance to show settings and restore temporarily the tray icon`,
    buttons: ['Ok'],
  }
  // , () => {
  //   /* https://electronjs.org/docs/api/dialog  :  If a callback is passed, the dialog will not block the process. The API call will be asynchronous and the result will be passed via callback(response) */
  // }
  );
}


function relaunch(showSettings) {
  showSettings = settingsWindow ? true : false;

  let argsArr = process.argv.slice(1);
  let args = argsArr.filter(arg => { return arg !== '--relaunch'});
  if (appSettings) {
    appSettings.showSettingsOnLoad = showSettings;
    settings.set('settings', appSettings);
  }
  setTimeout(() => {
    if (showSettings) {
      app.relaunch({args: args.concat(['--relaunch'])});
    } else {
      app.relaunch();
    }
    app.exit(0);
  }, 300);
}


// Make this app a single instance app.
//
// The main window will be restored and focused instead of a second window
// opened when a person attempts to launch a second instance.
//
// Returns true if the current version of the app should quit instead of
// launching.
function makeSingleInstance () {
  if (process.mas) return false;
  return app.makeSingleInstance(() => {
    changeTrayIconVisible(true);
    if (settingsWindow) {
      settingsWindow.show();
      settingsWindow.focus();
    } else {
      createSettingsWindow();
    }
  });
}
