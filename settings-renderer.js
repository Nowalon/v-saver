// This file is required by the settings.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

'use strict';

const ipc = require('electron').ipcRenderer
const shell = require('electron').shell;

const Vue = require('vue/dist/vue.min.js')

const vDropdown = require('./components/v-dropdown')

Vue.config.devtools = true

var messageTimeout = 0;
var changeSettingsThresholdTimeout = 0;
var settingFilesWrapNode, fileListNode, logoImg;

var settingsApp = new Vue({
  el: '#settings',
  data: {
    message: '',
    showMessage: false,
    activeTab: 'tab1',
    initLoadedOrReset: false,
    repoUrl: 'https://github.com/Nowalon/v-saver',
    isNewVersionavailable: false,
    newVersionValue: '0.0.0',
    resetSuspendIntervalItems: [
      {label: '30 min', value: 30},
      {label: '1 h', value: 60},
      {label: '1 h 30 m', value: 90},
      {label: '2 h', value: 120},
      {label: '2 h 30 m', value: 150},
      {label: '3 h', value: 180},
      {label: '4 h', value: 240},
      {label: '5 h', value: 300},
      {label: '6 h', value: 360}
    ],

    defaultSettings: {
      files: [
        './assets/video/Starman - SpaceX.mp4',
        './assets/video/Orion Nebula - 360 Video.mp4'
      ],
      runInterval: 10,
      lockSystemOnExit: false,
      changeAfter: 'videoends',
      changeInterval: 5,
      randomizeVideo: true,
      showSystemClockTime: true,
      clockTimeFormat: 24,
      showVideoRemainingTime: true,
      showVideoFileName: true,
      showInternetConnectionLostIndicator: true,
      showTrayIcon: true,
      resetSuspendInterval: 120,
      devDebugMode: false // !!! devDebugMode
    },
    settings: {},
    showDevDebugOption: false, // !!! devDebugMode
    unlockResetToDefault: false,
    maxRunInterval: 60,
    maxVideoChangeInterval: 30,
    showfileListScroll: false
  },

  computed: {
    sectionsSliderClass () {
      if (this.activeTab) {
        return `slider-${this.activeTab}`;
      }
      return '';
    },
    tab1ActiveClass () {
      return this.activeTab === 'tab1' ? 'active' : '';
    },
    tab2ActiveClass () {
      return this.activeTab === 'tab2' ? 'active' : '';
    },

    filesCount () {
      return (this.settings && this.settings.files) ? this.settings.files.length : 0;
    },

    changeIntervalDisabled () {
      return !this.settings.changeAfter || this.settings.changeAfter !== 'interval'
    },

    changeTimeFormatDisabled () {
      return !this.settings.showSystemClockTime
    }
  },

  mounted () {
    var self = this;

    self.settings = self.defaultSettings;

    self.loadSettings();

    ipc.on('selected-files-reply', function (event, paths) {
      if (paths && paths.length) {
        self.setUpdateFiles(paths);
      }
    })

    ipc.on('load-settings-reply', function (event, arg) {
      self.updateLoadedSettings(arg);
    })

    ipc.on('save-settings-reply', function (event, arg) {
      self.handleShowMessage(arg);
      self.unlockResetToDefault = false;
    })

    ipc.on('reset-settings-reply', function (event, arg) {
      self.initLoadedOrReset = false;
      self.settings = self.defaultSettings;
      self.handleShowMessage(arg);
      self.unlockResetToDefault = false;
      setTimeout(() => {
        self.initLoadedOrReset = true;
      }, 100);
    })

    ipc.on('check-app-version-reply', function (event, arg) {
      if (arg && arg.length) {
        self.isNewVersionavailable = true;
        self.newVersionValue = arg;
      } else {
        self.isNewVersionavailable = false;
      }
    });

    settingFilesWrapNode = document.getElementById('settingFilesWrapNode');
    fileListNode = document.getElementById('fileListNode');
    logoImg = document.getElementById('logoImg');

    logoImg.addEventListener('click', () => {
      ipc.send('open-about-dialog');
    }, false);

    this.checkAppVersion();

  },

  updated: function () {},

  methods: {
    handleTabSwitch (tab) {
      this.activeTab = tab;
    },

    handleShowMessage (message, timeout) {
      var _timeout = timeout || 3000;
      if (this.showMessage && messageTimeout) {
        this.showMessage = false;
        clearTimeout(messageTimeout);
        setTimeout(() => {
          this.handleShowMessage (message, timeout);
        }, 300)
      } else {
        if (messageTimeout) {
          clearTimeout(messageTimeout);
        }
        this.message = message;
        this.showMessage = true;
        messageTimeout = setTimeout(() => {
          this.showMessage = false;
        }, _timeout);
      }
    },

    handleAddFiles () {
      ipc.send('open-file-dialog')
    },

    setUpdateFiles (pathsArr) {
      var settingsFilesArray = [...this.settings.files];
      pathsArr.forEach((path, pathIndex) => {
        if (settingsFilesArray.indexOf(path) < 0) {
          settingsFilesArray.push(path);
        }
      });
      this.settings.files = settingsFilesArray;
    },

    handleMoveFilePathUp (path, pathIndex) {
      var allowed = pathIndex > 0;
      if (allowed && pathIndex > -1) {
        var settingsFilesArray = [...this.settings.files];
        settingsFilesArray.splice(pathIndex, 1);
        var newPathIndex = (pathIndex - 1 < 0) ? 0 : pathIndex - 1;
        settingsFilesArray.splice(newPathIndex, 0, path);
        this.settings.files = settingsFilesArray;
      }
    },

    handleMoveFilePathDown (path, pathIndex) {
      var allowed = pathIndex < this.settings.files.length;
      var settingsFilesArray = [...this.settings.files];
      if (allowed && pathIndex > -1) {
        settingsFilesArray.splice(pathIndex, 1);
        var newPathIndex = pathIndex + 1;
        settingsFilesArray.splice(newPathIndex, 0, path);
        this.settings.files = settingsFilesArray;
      }
    },

    handleRemoveFilePath (path, pathIndex) {
      var settingsFilesArray = [...this.settings.files];
      if (pathIndex > -1) {
        settingsFilesArray.splice(pathIndex, 1);
        this.settings.files = settingsFilesArray;
      }
    },

    handleLoadDemoFiles () {
      this.setUpdateFiles(this.defaultSettings.files);
    },

    handleClearFiles () {
      this.settings.files = [];
    },

    handleFileListSize () {
      if (settingFilesWrapNode && fileListNode) {
        setTimeout(() => {
          this.showfileListScroll = fileListNode.offsetHeight > settingFilesWrapNode.offsetHeight;
        }, 300);
      }
    },


    handleSaveSettings () {
      ipc.send('save-settings', this.settings)
    },

    loadSettings () {
      ipc.send('load-settings', 'load')
    },

    updateLoadedSettings (settingsdata) {
      if (settingsdata) {
        this.settings = settingsdata;
        this.handleShowMessage('Settings loaded...', 1500);
      } else {
        this.handleSaveSettings();
      }
      setTimeout(() => {
        this.initLoadedOrReset = true;
      }, 650);
    },

    handleResetSettings () {
      ipc.send('reset-settings', this.defaultSettings)
      this.unlockResetToDefault = false;
    },

    handleDeleteSettings () {
      ipc.send('delete-settings', 'delete')
    },

    handleCloseSettings () {
      ipc.send('close-settings')
    },

    handleRunTestSaverWindow () {
      ipc.send('run-vsaver-window');
    },

    checkAppVersion () {
      ipc.send('check-app-version');
    },

    handleOpenVersion () {
      shell.openExternal(this.repoUrl);
    }

  },

  watch: {

    'settings' : {
      handler: function (newValue, oldValue) {
        changeSettingsThresholdTimeout && clearTimeout(changeSettingsThresholdTimeout);
        changeSettingsThresholdTimeout = setTimeout(() => {
          this.initLoadedOrReset && this.handleSaveSettings();
        }, 600);
      },
      deep: true
    },

    'settings.files' : {
      handler: function (newValue, oldValue) {
        this.handleFileListSize();
      },
    }

  }

});



var noteTip = Vue.component('note-tip', {
  template: '#noteTip',
  name: 'note-tip',
  props: {
    text: {
      type: String,
      default: null,
    },
    imgSrc: {
      type: String,
      default: null,
    }
  }
});



