// This file is required by the settings.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

'use strict';

const ipc = require('electron').ipcRenderer;
const shell = require('electron').shell;

const getVideoDuration = require('./get-video-duration.js');

const Vue = require('vue/dist/vue.min.js');
window.Vue = Vue;

const vDropdown = require('./components/v-dropdown');
const vConfirmActionStateButton = require('./components/v-confirm-action-button');

Vue.config.devtools = false;

var messageTimeout = 0;
var changeSettingsThresholdTimeout = 0;
var showDropHolderThresholdTimeout = 0;
var settingFilesWrapNode, fileListNode, logoImg;

var settingsApp = new Vue({
  el: '#settings',
  data: {
    message: '',
    showMessage: false,
    isErrorMessage: false,
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
      {label: '6 h', value: 360},
      {label: '12 h', value: 720}
    ],
    resetFullScreenIntervalItems: [
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
      durations: [],
      runInterval: 10,
      lockSystemOnExit: false,
      saverTypeMain: 'video',
      saverTypeExternal: 'clock',
      externalDisplay: false,
      changeAfter: 'videoends',
      changeInterval: 5,
      randomizeVideo: true,
      showSystemClockTime: true,
      clockTimeFormat: 24,
      showVideoRemainingTime: true,
      showVideoFileName: true,
      showInternetConnectionLostIndicator: true,
      showInternetConnectionNotification: true,
      showTrayIcon: true,
      resetSuspendInterval: 120,
      resetFullScreenInterval: 120,
      devDebugMode: false // !!! devDebugMode
    },
    settings: {},
    durationsArr: [],
    showDevDebugOption: false, // !!! devDebugMode
    maxRunInterval: 60,
    maxVideoChangeInterval: 30,
    showfileListScroll: false,
    showFileDropHolder: false,
    isFileDropHolderGreeted: false
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

    filesWithDurations () {
      let resArr = [];
      const _durationsArr = (this.settings.durations && this.settings.durations.length) ? this.settings.durations : [];
      this.settings && this.settings.files && this.settings.files.forEach(filePath => {
        let fileWithDuration = _durationsArr.find(fileObj => {
          return fileObj.path === filePath;
        });
        if (fileWithDuration) {
          resArr.push({filePath: filePath, duration: fileWithDuration.duration});
        } else {
          resArr.push({filePath: filePath, duration: '--:--'});
        }
      });
      return resArr;
    },

    videoOptionsDisabled () {
      return (this.settings.saverTypeMain !== 'video' && !this.settings.externalDisplay) || (this.settings.externalDisplay && (this.settings.saverTypeMain !== 'video' && this.settings.saverTypeExternal !== 'video'));
    },

    changeIntervalDisabled () {
      return this.videoOptionsDisabled || !this.settings.changeAfter || this.settings.changeAfter !== 'interval';
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
    });

    ipc.on('load-settings-reply', function (event, arg) {
      self.updateLoadedSettings(arg);
    });

    ipc.on('save-settings-reply', function (event, arg) {
      self.handleShowMessage(arg);
    });

    ipc.on('reset-settings-reply', function (event, arg) {
      self.initLoadedOrReset = false;
      self.settings = arg;
      self.handleShowMessage('Default settings restored...');
      setTimeout(() => {
        self.initLoadedOrReset = true;
      }, 100);
    });

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
      if (this.activeTab === 'tab2' && !this.isFileDropHolderGreeted) {
        this.showFileDropHolder = true;
        setTimeout(() => {
          this.showFileDropHolder = false;
        }, 2000);
        this.isFileDropHolderGreeted = true;
      }
    },

    handleShowMessage (message, timeout, isError) {
      var _timeout = timeout || 3000;
      var _isError = isError || false;
      if (this.showMessage && messageTimeout) {
        this.showMessage = false;
        clearTimeout(messageTimeout);
        setTimeout(() => {
          this.handleShowMessage (message, timeout, _isError);
        }, 300)
      } else {
        if (messageTimeout) {
          clearTimeout(messageTimeout);
        }
        this.message = message;
        this.showMessage = true;
        this.isErrorMessage = _isError;
        messageTimeout = setTimeout(() => {
          this.showMessage = false;
        }, _timeout);
      }
    },

    handleAddFiles () {
      ipc.send('open-file-dialog');
    },

    setUpdateFiles (pathsArr) {
      var settingsFilesArray = [...this.settings.files];
      pathsArr.forEach((path, pathIndex) => {
        if (settingsFilesArray.indexOf(path) < 0) {
          settingsFilesArray.push(path);
        }
      });
      this.settings.files = settingsFilesArray;
      setTimeout(this.updateFileListScroll, 400);
      this.compareDurations();
    },

    handlePlayFileByIndex(filePath, filePathindex) {
      var filtered = this.settings.files.filter(item => {
        return item === filePath;
      });
      ipc.send('play-by-index', {filePath, filePathindex});
    },

/*
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
*/

    handleMoveFilePathUp (path, pathIndex) {
      var allowed = pathIndex > 0;
      var settingsFilesArray = [...this.settings.files];
      if (pathIndex > -1) {
        settingsFilesArray.splice(pathIndex, 1);
        var newPathIndex = (pathIndex - 1 < 0) ? (this.settings.files.length - 1) : pathIndex - 1;
        settingsFilesArray.splice(newPathIndex, 0, path);
        this.settings.files = settingsFilesArray;
      }
    },

    handleMoveFilePathDown (path, pathIndex) {
      var settingsFilesArray = [...this.settings.files];
      if (pathIndex > -1) {
        settingsFilesArray.splice(pathIndex, 1);
        var newPathIndex = (pathIndex + 1 >= this.settings.files.length) ? 0 : pathIndex + 1;
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
      this.cleanupDurations();
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
      ipc.send('save-settings', this.settings);
    },

    loadSettings () {
      ipc.send('load-settings', 'load');
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
      this.compareDurations();
    },

    handleResetSettings () {
      ipc.send('reset-settings', this.defaultSettings);
    },

    handleDeleteSettings () {
      ipc.send('delete-settings', 'delete');
    },

    handleCloseSettings () {
      ipc.send('close-settings');
    },

    handleRunTestSaverWindow () {
      ipc.send('run-vsaver-window');
    },

    checkAppVersion () {
      ipc.send('check-app-version');
    },

    handleOpenVersion () {
      shell.openExternal(this.repoUrl);
    },

    handleFileDragover (e) {
      this.showFileDropHolder = true;
    },

    handleFileDragleave (e) {
      showDropHolderThresholdTimeout && clearTimeout(showDropHolderThresholdTimeout);
      showDropHolderThresholdTimeout = setTimeout(() => {
        this.showFileDropHolder = false;
      }, 300);

    },

    handleFileDrop (e) {
      let filesToAdd = [];
      let notAllowedTimeout = 0;
      const allowedTypes = ['video/webm', 'video/mp4'];
      let notAllowedTypes = [];
      for (let f of e.dataTransfer.files) {
        if (allowedTypes.indexOf(f.type) >= 0) {
          filesToAdd.push(f.path);
        } else {
          notAllowedTypes.push(f.type);
        }
      }
      this.showFileDropHolder = false;
      if (filesToAdd.length) {
        this.setUpdateFiles(filesToAdd);
        notAllowedTimeout = 3000;
      }
      if (notAllowedTypes.length) {
        setTimeout(() => {
          this.handleShowMessage('webm, mp4 types only are allowed', null, true);
        }, notAllowedTimeout);
      }
    },

    updateFileListScroll(){
      var element = document.getElementById("settingFilesWrapNode");
      element.scrollTop = element.scrollHeight;
    },

    compareDurations() {
      let arrToLoadDuration = [];
      if (this.settings && this.settings.files && this.settings.files.length) {

        if (!this.settings.durations || !this.settings.durations.length) {
          this.settings.durations = [];
          setTimeout(() => {
            this.getCalculateDurations(this.settings.files);
          }, 1000);
          return;
        }

        arrToLoadDuration = this.settings.files.filter(filePath => {
          const fileWithDuration = this.settings.durations.find(fileObj => {
            return fileObj.path === filePath;
          });
          if (fileWithDuration) {
            return false;
          } else {
            return true;
          }
        });
      } else {
        this.cleanupDurations();
      }
      this.getCalculateDurations(arrToLoadDuration);
    },

    getCalculateDurations(videoFiles) {
      var self = this;
      let resultArr = [];
      let _settings = {...this.settings};
      videoFiles.forEach((file, fi) => {
        getVideoDuration(file).then((duration) => {
          const total_s = Math.floor(duration) % 60;
          var totalDurationMin = ( isNaN(parseInt(duration / 60)) || isNaN(total_s) ) ? "0:00" : parseInt(duration / 60) + ":" + ( total_s < 10 ? "0" + total_s : total_s );
          resultArr.push({path: file, duration: totalDurationMin});
          if(resultArr.length === videoFiles.length) {
            _settings.durations = [..._settings.durations, ...resultArr];
            self.settings = _settings;
          }
        }).catch(e => {
          console.log('ERROR: ', e);
          resultArr.push({path: file, duration: 'error'});
          if(resultArr.length === videoFiles.length) {
            _settings.durations = [..._settings.durations, ...resultArr];
            self.settings = _settings;
          }
        });
      });
    },

    cleanupDurations () {
      let _settings = {...this.settings};
      const updSettingsDurations = _settings.durations.filter(durObj => {
        return _settings.files.indexOf(durObj.path) > -1;
      });
      _settings.durations = updSettingsDurations;
      this.settings = _settings;
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


document.getElementById("closeBtnTitle").addEventListener('click', (e) => {
  e.preventDefault();
  ipc.send('close-settings');
});

document.getElementById("minimizeBtnTitle").addEventListener('click', (e) => {
  e.preventDefault();
  ipc.send('minimize-settings');
});



document.addEventListener('drop', function (e) {
  e.preventDefault();
  e.stopPropagation();
  return false;
});

document.addEventListener('dragover', function (e) {
  e.preventDefault();
  e.stopPropagation();
  return false;
});

document.addEventListener('dragleave', function (e) {
  e.preventDefault();
  e.stopPropagation();
  return false;
});
