// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

//'use strict';

//console.log("vue: ", vue); //return true;

//const Vue = require('vue')
//const Vue = require('vue/dist/vue.js');
const Vue = require('vue/dist/vue.min.js')
//import Vue from 'vue'
Vue.config.devtools = true

var messageTimeout = 0;

//(function() {

var settingsApp = new Vue({
  el: '#settings',

/*
  data () {
    return {
      message: 'Hello Vue!',
      activeTab: 'tab-1'
    }
  },
*/
  data: {
    message: '',
    showMessage: false,
//    message: 'Hello Vue! Hello Vue! Hello Vue! Hello Vue! Hello Vue!',
    activeTab: 'tab1',

    //files: [],
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
//console.warn("mounted self: ", self);
//console.warn("mounted $data: ", this.$data);
  },

  updated: function () {},

  methods: {
    handleTabSwitch (tab) {
      this.activeTab = tab;
      // this.message = 'Good Bye!';
    },

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

    handleSaveSettings () {
      this.handleShowMessage('Saved!')
    }

  },

  watch: {
//    'settings.showSystemClockTime' : function (newValue, oldValue) {
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

          this.handleShowMessage('Settings saved!')
      },
      deep: true
    }
  }

});


//})()


















