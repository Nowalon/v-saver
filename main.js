const electron = require('electron')
// Module to control application life.
const app = electron.app
const ipc = electron.ipcMain
const settings = require('electron-settings');
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
// const {Menu, Tray} = require('electron')
const Menu = electron.Menu
const Tray = electron.Tray
const dialog = electron.dialog


const path = require('path')
const url = require('url')
const lockSystem = require('lock-system');

const { default: installExtension, VUEJS_DEVTOOLS } = require('electron-devtools-installer');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let settingsWindow

let appIcon = null
let appSettings = null
let aboutDialog = null

if (process.mas) app.setName('V-W-Saver')

function createSettingsWindow () {

  var windowOptions = {
    //width: 800,
    width: 1500,
    minWidth: 800,
    height: 600,
    title: app.getName()
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
  settingsWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  settingsWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    settingsWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  installExtension(VUEJS_DEVTOOLS)
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((err) => console.log('An error occurred: ', err));

  const iconName = process.platform === 'win32' ? 'videoscreensaver-black-icon.png' : 'assets/img/videoscreensaver-white-icon.png'
  const iconPath = path.join(__dirname, iconName)
console.log("__dirname: ", __dirname); //return true;
  appIcon = new Tray(iconPath)
  const contextMenu = Menu.buildFromTemplate([
//    {label: 'Item2', type: 'radio'},
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
      label: 'Remove',
      click: function () {
        /*if (appIcon) appIcon.destroy()*/
      }
    },
    {
      label: 'Lock',
      click: () => {
        lockSystem();
      }
    },
    {
      label: 'Exit',
      click: function () {
        if (appIcon) appIcon.destroy()
        app.exit()
      }
    }
  ])
  appIcon.setToolTip('V-Screensaver')
  appIcon.setContextMenu(contextMenu)

  if (settings.has('settings')) {
    appSettings = settings.get('settings')
  } else {
    createSettingsWindow()
  }
//console.log("settings.has('settings'): ", settings.has('settings'));
//console.log("settings.get('settings'): ", settings.get('settings'));
//console.log("appSettings: ", appSettings);
//createSettingsWindow()

})

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
//  aboutDialog
    settingsWindow = null;
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
      {name: 'Movies', extensions: ['webm', 'avi', 'mp4']}
    ]
  }, function (filePaths) {
    if (filePaths) event.sender.send('selected-files-reply', filePaths)
  })
})

ipc.on('save-settings', function (event, settingsData) {
  settings.set('settings', settingsData);
  appSettings = settings.get('settings');
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
  var aboutDialogMessage = `${app.getName().toUpperCase()}: version ${app.getVersion()} \n \n using Node.js ${process.versions.node}, Chromium ${process.versions.chrome}, and Electron ${process.versions.electron}`;
  aboutDialog = dialog.showMessageBox({
    type: 'info',
    title: 'V-Screensaver - About',
    icon: path.join(__dirname, '/assets/img/videoscreensaver-gradient-icon.png'),
    detail: aboutDialogMessage,
    buttons: ['Ok'],
  })
})

ipc.on('close-settings', function (event, settingsData) {
  settingsWindow.close();
})





ipc.on('delete-settings', function (event, msg) {
  settings.deleteAll();
  appSettings = settings.get('settings');
  event.sender.send('delete-settings-reply', appSettings)
})



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








// ??? CHECK SYSTEM IDLE ???


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



