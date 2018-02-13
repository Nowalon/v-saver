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


const path = require('path')
const url = require('url')

const { default: installExtension, VUEJS_DEVTOOLS } = require('electron-devtools-installer');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

let appIcon = null
let appSettings = null

if (process.mas) app.setName('V-W-Saver')

function createSettingsWindow () {

  var windowOptions = {
    width: 1500,
    minWidth: 800,
    height: 600,
    title: app.getName()
  }
  if (process.platform === 'linux') {
    windowOptions.icon = path.join(__dirname, '/assets/img/videoscreensaver-gradient-icon.png')
  }
  // Create the browser window.
  mainWindow = new BrowserWindow(windowOptions)

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'settings.html'),
    protocol: 'file:',
    slashes: true
  }))

//mainWindow.setFullScreen(!mainWindow.isFullScreen())


  // Open the DevTools.
  mainWindow.webContents.openDevTools()
//  mainWindow.addDevToolsExtension('node_modules/vue-devtools')
      //require('devtron').install()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
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
//        if (appIcon) appIcon.destroy()
console.log("mainWindow: ", mainWindow); //return true;
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
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
        /*if (appIcon) appIcon.destroy()*/
const lockSystem = require('lock-system');
        //setTimeout(() => {
lockSystem();
        //}, 5000);

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
console.log("settings.has('settings'): ", settings.has('settings'));
console.log("settings.get('settings'): ", settings.get('settings'));
console.log("appSettings: ", appSettings);

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
console.log("ON QUIT!!"); //return true;
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
    if (appIcon) appIcon.destroy()
    app.quit()
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createSettingsWindow()
  }
})

ipc.on('remove-tray', function () {
  appIcon.destroy()
})

ipc.on('save-settings', function (event, settingsData) {
console.log("on save-settings => settingsData: ", settingsData);
  settings.set('settings', settingsData);
  appSettings = settings.get('settings');
console.log("SAVE => GET=> appSettings: ", appSettings);
  event.sender.send('save-settings-reply', 'Settings saved!')
})

ipc.on('load-settings', function (event, msg) {
console.log("on load-settings => msg: ", msg);
  if (settings.has('settings')) {
    appSettings = settings.get('settings')
  }
console.log("LOAD => GET=> appSettings: ", appSettings);
  event.sender.send('load-settings-reply', appSettings)
})

ipc.on('reset-settings', function (event, settingsData) {
console.log("on reset-settings => settingsData: ", settingsData);
  settings.set('settings', settingsData);
  appSettings = settings.get('settings');
console.log("RESET => GET=> appSettings: ", appSettings);
  event.sender.send('reset-settings-reply', 'Default settings restored...')
})




ipc.on('delete-settings', function (event, msg) {
console.log("on delete-settings => msg: ", msg);
  settings.deleteAll();
  appSettings = settings.get('settings');
console.log("DELETE => GET=> appSettings: ", appSettings);
  event.sender.send('delete-settings-reply', appSettings)
})



setTimeout(function(){
//  app.quit()
//  mainWindow = null
//  mainWindow.close()
//  focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
//  mainWindow.setFullScreen(!mainWindow.isFullScreen())
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
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
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



