// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

'use strict';


const ipc = require('electron').ipcRenderer

const Vue = require('vue/dist/vue.min.js')

Vue.config.devtools = true

var messageTimeout = 0;


var settingsApp = new Vue({
  el: '#settings',

  data: {
    message: '',
    showMessage: false,
    activeTab: 'tab1',
    initLoadedOrReset: false,

    //files: [],
    defaultSettings: {
      files: [],
      runInterval: 10,
      lockSystemOnExit: true,
      changeAfter: 'videoends',
      changeInterval: 5,
      randomizeVideo: true,
      showSystemClockTime: true,
      showVideoRemainingTime: true,
      showVideoFileName: true,
      showInternetConnectionLostIndicator: true,
      showTrayIcon: true
    },
    settings: {
      files: [],
      runInterval: 10,
      lockSystemOnExit: true,
      changeAfter: 'videoends',
      changeInterval: 5,
      randomizeVideo: true,

      showSystemClockTime: true,
      showVideoRemainingTime: true,
      showVideoFileName: true,
      showInternetConnectionLostIndicator: true,

      showTrayIcon: true,
    },
    maxRunInterval: 30,
    maxVideoChangeInterval: 30,


    checkTest: false,
    radioTest: null
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

    changeIntervalDisabled () {
      return !this.settings.changeAfter || this.settings.changeAfter !== 'interval'
    }
  },

  mounted () {
    var self = this;

    self.loadSettings();

    ipc.on('load-settings-reply', function (event, arg) {
console.log("load-settings-reply -> arg: ", arg);
      self.updateLoadedSettings(arg);
    })

    ipc.on('save-settings-reply', function (event, arg) {
console.log("save-settings-reply -> arg: ", arg);
      self.handleShowMessage(arg);
    })

    ipc.on('reset-settings-reply', function (event, arg) {
console.log("reset-settings-reply -> arg: ", arg);
      self.initLoadedOrReset = false;
      self.settings = self.defaultSettings;
      self.handleShowMessage(arg);
      setTimeout(() => {
        self.initLoadedOrReset = true;
      }, 100);
    })
  },

  updated: function () {},

  methods: {
    handleTabSwitch (tab) {
      this.activeTab = tab;
      // this.message = 'Good Bye!';
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
/*
    handleShowMessage (message, timeout) {
      var _timeout = timeout || 3000;
      if (messageTimeout) {
        clearTimeout(messageTimeout);
      }
      this.message = message;
      this.showMessage = true;
      messageTimeout = setTimeout(() => {
        this.showMessage = false;
      }, _timeout);
    },
*/

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
      }, 100);
    },

    handleResetSettings () {
      ipc.send('reset-settings', this.defaultSettings)
    },



    handleDeleteSettings () {
      ipc.send('delete-settings', 'delete')
    }

  },

  watch: {
/*
        handler: function (val, oldVal) {
            console.log('watch 1', 'newval: ', val, '   oldVal:', oldVal)
        },
        deep: true
*/

    'settings' : {
      handler: function (newValue, oldValue) {
console.warn("newValue: ", newValue);
//console.warn("newValue.runInterval: ", newValue.runInterval);
console.warn("oldValue: ", oldValue);
//console.warn("oldValue.runInterval: ", oldValue.runInterval);

        this.initLoadedOrReset && this.handleSaveSettings()
      },
      deep: true
    }
  }

});




















