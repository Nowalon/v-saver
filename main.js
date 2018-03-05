const electron = require('electron')
// Module to control application life.
const app = electron.app
const ipc = electron.ipcMain
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
// const {Menu, Tray} = require('electron')
const Menu = electron.Menu
const Tray = electron.Tray
const dialog = electron.dialog

const settings = require('electron-settings');

//const globalShortcut = electron.globalShortcut
//const shell = electron.shell // ????
//const os = require('os')


const path = require('path');
const url = require('url');
const dns = require('dns');
const request = require('request');

const lockSystem = require('lock-system');
const desktopIdle = require('desktop-idle');


const { default: installExtension, VUEJS_DEVTOOLS } = require('electron-devtools-installer');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let settingsWindow
let saverWindow
let saverWindowWidth = 1920
let saverWindowHeight = 1080

let appIcon = null
let iconPathNorm
let iconPathSusp
let appSettings = null
let aboutDialog = null
let isSuspendSaver = false
let idleTimer = 0
let idleTimeOut = 0
const resetIdleValue = 8640 // ~2.4h
let checkDnsLookUpTimeOut = 0
let isConnectedFlag = true
let isRunByIdleTimer = false
let newAppVersionValue = null
var checkConnectionStatusChanged;


// test
// test


//const checkVersionUrl='https://raw.githubusercontent.com/Nowalon/v-saver/settings/package.json';
const checkVersionUrl='https://raw.githubusercontent.com/Nowalon/v-saver/dev/package.json';

/* devDebugMode ONLY */ var isDevDebugMode = false;

if (process.mas) app.setName('V-Saver')

function createSettingsWindow () {

  var windowOptions = {
    width: 800,
//    width: 1500,
    minWidth: 800,
    height: 600,
    resizable: false,
    titleBarStyle: 'hidden',
    frame: false,
    opacity: 0.8,
    title: app.getName()
  }
  if(isDevDebugMode) {
    windowOptions.width = 1500;
  }
  if (process.platform === 'linux') {
    windowOptions.icon = path.join(__dirname, '/assets/img/videoscreensaver-gradient-icon.png')
  }
  // Create the browser window.
  settingsWindow = new BrowserWindow(windowOptions)

  // and load the index.html of the app.
  settingsWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'settings.html'),
    protocol: 'file:',
    slashes: true
  }))

//settingsWindow.setFullScreen(!settingsWindow.isFullScreen())


  // Open the DevTools.
  isDevDebugMode && settingsWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  settingsWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    settingsWindow = null
  })
}


function createSaverWindow () {

  var windowOptions = {
    width: saverWindowWidth,
    minWidth: saverWindowWidth,
    height: saverWindowHeight,
    alwaysOnTop: true,
    frame: false,
    title: app.getName()
  }
  if (process.platform === 'linux') {
    windowOptions.icon = path.join(__dirname, '/assets/img/videoscreensaver-gradient-icon.png')
  }
  // Create the browser window.
  saverWindow = new BrowserWindow(windowOptions)

  // and load the index.html of the app.
  saverWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'vsaver.html'),
    protocol: 'file:',
    slashes: true
  }))

//  saverWindow.setFullScreen(!saverWindow.isFullScreen())
  if(!isDevDebugMode) {
    saverWindow.setFullScreen(true)
  }

  // Open the DevTools.
  isDevDebugMode && saverWindow.webContents.openDevTools()

//  saverWindow.focus();
//  saverWindow.focusOnWebView();

  // Emitted when the window is closed.
  saverWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    saverWindow = null
  })

  saverWindow.on('blur', (e) => {
//console.log("ON BLUR ::: E: ", new Date(), e); //return true;
    saverWindow && runSaverWindow();
  });
  saverWindow.on('move', (e) => {
//console.log("ON MOVE ::: E: ", new Date(), e); //return true;
    saverWindow && runSaverWindow();
  });
  saverWindow.on('leave-full-screen', (e) => {
//console.log("ON LEAVE-FULL-SCREEN ::: E: ", new Date(), e); //return true;
    saverWindow && runSaverWindow();
  });


setTimeout(() => {
  /* some hack fix for cursor hiding */
  saverWindow.setFullScreen(false);
}, 300);


}

function runSaverWindow () {
  if (appSettings && saverWindow) {
    saverWindow.show()
    saverWindow.focus()
    saverWindow.setFullScreen(true)
  } else {
    if (appSettings) {
      createSaverWindow()
    }
  }
}

function checkSystemIdle () { // call after app.on('ready') and settings loaded only!
  idleTimeOut && clearTimeout(idleTimeOut);
//  idleTimer = appSettings.runInterval * 1;
  var idleTimerSec = appSettings.runInterval * 1 * 60;
  var idleTimeOutValue = 10000; // 10000~20000 ?

//console.log("isDevDebugMode: ", isDevDebugMode, new Date()); //return true;

if(isDevDebugMode){
  idleTimerSec = 50000000;
  idleTimeOutValue = 2000;
}
  //setInterval(() => {
//console.log("---> check appSettings: ", appSettings);
//console.log("---> check appSettings.runInterval: ", typeof appSettings.runInterval, appSettings.runInterval);
//console.log("---> check idleTimer: ", typeof idleTimer, idleTimer);
//console.log("check idleTimerSec: ", /*typeof idleTimerSec,*/ idleTimerSec);
  idleTimeOut = setTimeout(() => {
    var desktopIdleSec = desktopIdle.getIdleTime();
//    console.log("isSuspendSaver: ", isSuspendSaver);
//    console.log("desktopIdleSec: ", /*typeof desktopIdleSec,*/ desktopIdleSec);
//    console.log("idleTimerSec: ", idleTimerSec);
    //console.log("screen.getCursorScreenPoint(): ", electron.screen.getCursorScreenPoint()); //return true;
//console.log("isRunByIdleTimer: ", isRunByIdleTimer);
    if (desktopIdleSec >= idleTimerSec) {
      if (!isSuspendSaver) {
        if (!isRunByIdleTimer){
          isRunByIdleTimer = true;
          runSaverWindow();
        }
      }
      if(desktopIdleSec >= resetIdleValue) {
        isSuspendSaver = false;
        handleChangeContextMenuTemplate();
      }
    } else {
      isRunByIdleTimer = false;
    }
    checkSystemIdle();
    if (!saverWindow) {
      checkConnection().then(res => {
        if (checkConnectionStatusChanged()) {
          handleChangeContextMenuTemplate();
        }
      }).catch(err => {
        if (checkConnectionStatusChanged()) {
          handleChangeContextMenuTemplate();
        }
      });
    }
  }, idleTimeOutValue); // set 10000
}

function connectionSwitched() {
    var connected = null;
  return function (_connected) {
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
  if (settings.has('settings')) {
    appSettings = settings.get('settings');
    /* devDebugMode */ isDevDebugMode = appSettings && appSettings.hasOwnProperty('devDebugMode') ? appSettings.devDebugMode : false;
  } else {
    createSettingsWindow()
  }

  isDevDebugMode && installExtension(VUEJS_DEVTOOLS)
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((err) => console.log('An error occurred: ', err));

  checkSystemIdle();


console.log(" ========================= v-saver ======================== "); //return true;


//const size = electron.screen.getPrimaryDisplay().size
//console.log("size: ", size);
//const bounds = electron.screen.getPrimaryDisplay().bounds
//const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize
//const {width, height} = electron.screen.getPrimaryDisplay().workArea
//console.log("width, height: ", width, height);
//console.log("bounds: ", bounds);
//console.log("electron.screen.getAllDisplays(): ", electron.screen.getAllDisplays());

setInterval(() => {
//console.log("screen.getCursorScreenPoint(): ", electron.screen.getCursorScreenPoint()); //return true;
//console.log(desktopIdle.getIdleTime());
}, 3000);

electron.screen.on('display-metrics-changed', (event) => {
console.warn("???????????????????? display-metrics-changed EVENT: ", event);
});


//console.log("process: ", process.timers); //return true;
//console.log("os: ", os); //return true;
//console.log("os.cpus: ", os.cpus() ); //return true;
//setInterval(() => {
//console.log("screen.getCursorScreenPoint(): ", electron.screen.getCursorScreenPoint()); //return true;
//}, 1000);



  const iconNameNormal = process.platform === 'win32' ? '/assets/img/v-saver.ico' : '/assets/img/v-saver__icon.png';
  const iconNameSuspended = process.platform === 'win32' ? '/assets/img/v-saver-suspended.ico' : '/assets/img/v-saver-suspended__icon.png';
  const iconNameNormalDisconected = process.platform === 'win32' ? '/assets/img/disconnected__v-saver.ico' : '/assets/img/disconnected__v-saver__icon.png';
  const iconNameSuspendedDisconected = process.platform === 'win32' ? '/assets/img/disconnected__v-saver-suspended.ico' : '/assets/img/disconnected__v-saver-suspended__icon.png';
  iconPathNorm = path.join(__dirname, iconNameNormal);
  iconPathSusp = path.join(__dirname, iconNameSuspended);
  iconPathNormNoConnect = path.join(__dirname, iconNameNormalDisconected);
  iconPathSuspNoConnect = path.join(__dirname, iconNameSuspendedDisconected);
  appIcon = new Tray(iconPathNorm);

  var contextMenuTemplate = getContextMenuTemplate(true);
  let contextMenu = Menu.buildFromTemplate(contextMenuTemplate);

  appIcon.setToolTip('V-Saver')
  appIcon.setTitle('V-Saver')
  appIcon.setContextMenu(contextMenu)

  checkConnectionStatusChanged = connectionSwitched();
  checkConnection().then(res => {
    checkVersion().then(isewVersionResult => {
      newAppVersionValue = isewVersionResult ? isewVersionResult : null;
    }).catch(versionErr => { /**/ });
  }).catch(err => {
    /**/
  });

  const primaryDisplaySize = electron.screen.getPrimaryDisplay().size;
  saverWindowWidth = primaryDisplaySize.width;
  saverWindowHeight = primaryDisplaySize.height;


//console.log("settings.has('settings'): ", settings.has('settings'));
//console.log("settings.get('settings'): ", settings.get('settings'));
//console.log("appSettings: ", appSettings);
//createSettingsWindow()
//createSaverWindow();


}) // ready





// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
//    if (appIcon) appIcon.destroy()
//    app.quit()
  }
})

app.on('quit', function () {
console.log("ON-QUIT!!"); //return true;
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
    if (appIcon) appIcon.destroy()
    settingsWindow = null;
    saverWindow = null;
    aboutDialog = null;
    app.quit()
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (settingsWindow === null) {
    createSettingsWindow()
  }
})

ipc.on('remove-tray', function () {
  appIcon.destroy()
})


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
})

ipc.on('save-settings', function (event, settingsData) {
  settings.set('settings', settingsData);
  appSettings = settings.get('settings');
  /* devDebugMode */ isDevDebugMode = appSettings && appSettings.hasOwnProperty('devDebugMode') ? appSettings.devDebugMode : false;
  event.sender.send('save-settings-reply', 'Settings saved!')
})

ipc.on('load-settings', function (event, msg) {
  if (settings.has('settings')) {
    appSettings = settings.get('settings')
  }
  event.sender.send('load-settings-reply', appSettings)
})

ipc.on('reset-settings', function (event, settingsData) {
  settings.set('settings', settingsData);
  appSettings = settings.get('settings');
  event.sender.send('reset-settings-reply', 'Default settings restored...')
})

ipc.on('open-about-dialog', function (event, arg) {
  showAboutDialogMessage();
})

ipc.on('close-settings', function (event, settingsData) {
  settingsWindow.close();
})

ipc.on('run-vsaver-window', function (event) {
  runSaverWindow();
});

ipc.on('close-vsaver-window', function (event) {
console.log("====> ON CLOSE vsaver-window"); //return true;
//console.log("appSettings.lockSystemOnExit: ", appSettings.lockSystemOnExit); //return true;
  if (appSettings && appSettings.lockSystemOnExit) {
    lockSystem();
  }
  setTimeout(() => {
    saverWindow && saverWindow.close();
  }, 1600); // 1800
})

ipc.on('check-internet-connection', function (event) {
  checkConnection().then(res => {
    event.sender.send('check-internet-connection-reply', true)
  }).catch(err => {
    event.sender.send('check-internet-connection-reply', false)
  });
});

ipc.on('check-app-version', function (event) {
  checkConnection().then(res => {
    checkVersion().then(isewVersionResult => {
      event.sender.send('check-app-version-reply', isewVersionResult)
    }).catch(versionErr => {
      event.sender.send('check-app-version-reply', false)
    });
  }).catch(err => {
    event.sender.send('check-app-version-reply', false)
  });
});



ipc.on('delete-settings', function (event, msg) {
  settings.deleteAll();
  appSettings = settings.get('settings');
  event.sender.send('delete-settings-reply', appSettings)
})



function getContextMenuTemplate(suspend) {
  var contextMenuTemplate = [
    {
      label: 'Suspend saver',
      click: function () {
        //
      }
    },
    {
      label: 'Run screensaver',
      click: function () {
        /*if (appSettings && saverWindow) {
          saverWindow.show()
          saverWindow.focus()
          saverWindow.setFullScreen(!saverWindow.isFullScreen())
        } else {
          if (appSettings) {
            createSaverWindow()
          }
        }*/
        runSaverWindow();
      }
    },
    {
      label: 'Settings',
      click: function () {
        if (settingsWindow) {
          settingsWindow.show()
          settingsWindow.focus()
        } else {
          createSettingsWindow()
        }
      }
    },
    {
      label: 'Remove?',
      click: function () {
        /*if (appIcon) appIcon.destroy()*/
      }
    },
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
        if (appIcon) appIcon.destroy()
        app.exit()
      }
    }
  ];

  const suspendItem = {
      label: 'Suspend screensaver running',
      click: function () {
        isSuspendSaver = true;
//        handleChangeContextMenuTemplate(true);
        handleChangeContextMenuTemplate();
    }
  }
  const resumeItem = {
      label: 'Resume screensaver running',
      click: function () {
        isSuspendSaver = false;
        handleChangeContextMenuTemplate();
    }
  }
  contextMenuTemplate[0] = suspend ? suspendItem : resumeItem;
  return contextMenuTemplate;
}


function handleChangeContextMenuTemplate(suspend){
  // isSuspendSaver = suspend ? true : false;
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
    title: 'V-Saver - About',
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
      isConnectedFlag = false;
      reject(new Error('DNS lookup timout error'));
      return false;
    }, 4500);
    dns.lookupService('8.8.8.8', 53, function(error, hostname, service){
      // google-public-dns-a.google.com domain
      //console.log("checkConnection: ", hostname, service, Date.now());
      if (error) {
        if (done) { return false; }
        done = true;
        isConnectedFlag = false;
        reject(error);
      } else {
        if (done) { return false; }
        var delta = ((new Date()).getTime() - start);
        done = true;
//console.log(" ++++++ checkConnection RES: ", {hostname: hostname, time: delta}); //return true;
        isConnectedFlag = true;
        resolve({hostname: hostname, time: delta});
      }
    });
  });
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




setTimeout(function(){
//  app.quit()
//  settingsWindow = null
//  settingsWindow.close()
//  focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
//  settingsWindow.setFullScreen(!settingsWindow.isFullScreen())
}, 5000);

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.











// ANOTHER EXAMPLES HERE


// Make this app a single instance app.
//
// The main window will be restored and focused instead of a second window
// opened when a person attempts to launch a second instance.
//
// Returns true if the current version of the app should quit instead of
// launching.
function makeSingleInstance () {
  if (process.mas) return false

  return app.makeSingleInstance(function () {
    if (settingsWindow) {
      if (settingsWindow.isMinimized()) settingsWindow.restore()
      settingsWindow.focus()
    }
  })
}










// TO USING

// powerSaveBlocker
// https://github.com/electron/electron/blob/master/docs/api/power-save-blocker.md
// https://electronjs.org/docs/api/power-save-blocker

// API to inhibit screensaver #1936
// https://github.com/electron/electron/issues/1936

// Is it possible to simulate keyboard/mouse event in NodeJS?
// https://stackoverflow.com/questions/11178372/is-it-possible-to-simulate-keyboard-mouse-event-in-nodejs

// node-key-sender
// https://www.npmjs.com/package/node-key-sender

// !!! lock-system
// https://github.com/sindresorhus/lock-system

// ??? CHECK SYSTEM IDLE ???
// desktop-idle dev requires:
// npm install --save-dev electron-rebuild
// ./node_modules/.bin/electron-rebuild


// MP4 works, AVI does not. The browsers don't support the AVI container format.



