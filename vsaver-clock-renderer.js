// This file is required by the vsaver-clock.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

'use strict';

const ipc = require('electron').ipcRenderer

const Vue = require('vue/dist/vue.min.js')

Vue.config.devtools = true

var messageTimeout = 0;
var settingFilesWrapNode, fileListNode, logoImg;
var clockTimeNode = null;
var stt = 0;
var exitSaverTimeOut = 0;
var mouseMoveTresholdTimeOut = 0;
var mouseMoveTresholdArr = [];
var mouseMoveTresholdLimit = 20;


var saverApp = new Vue({
  el: '#vSaver',
  data: {
    isOverlayfadeOut: false,
    isConnectedFlag: true,
    clockAMPMValue: null,
    clockTimeValue: null,
    clockTimeStylePosition: null,
    settings: {},
    size: {width: 0, height: 768}
  },


  mounted () {
    var self = this;

    self.loadSettings();

    ipc.on('load-settings-reply', function (event, arg) {
      self.updateLoadedSettings(arg, () => {
        self.startClockTime();
      });
    });

    ipc.on('check-internet-connection-reply', function (event, arg) {
      self.isConnectedFlag = arg ? true : false;
      if (!self.isConnectedFlag) {
        setTimeout(self.checkConnection, 6000); // +1s of main saver window value
      }
    });

    if (navigator.vendor === "Apple Computer, Inc."){
        var overlay = document.querySelector('.overlay');
        overlay.style.width = '1920px';
        overlay.style.height = '1080px';
    }

    document.addEventListener('keydown', function(e){
      if(e.keyCode === 67){
        self.checkConnection();
        return;
      }
      self.handleCloseExitSaverWindow(e);
    }, false);

    document.addEventListener('mousedown', self.handleCloseExitSaverWindow, false);
    document.addEventListener('click', self.handleCloseExitSaverWindow, false);
    document.addEventListener('mousemove', (e) => {
      mouseMoveTresholdArr.push(e.type);
      if (mouseMoveTresholdArr.length > mouseMoveTresholdLimit) {
        self.handleCloseExitSaverWindow(e);
      }
      mouseMoveTresholdTimeOut && clearTimeout(mouseMoveTresholdTimeOut);
      mouseMoveTresholdTimeOut = setTimeout(() => {
        mouseMoveTresholdArr = [];
      }, 600);
    }, false);

    var bodyNode = document.getElementsByTagName('body')[0];
    setTimeout(() => {
        self.size.width = bodyNode.offsetWidth;
        self.size.height = bodyNode.offsetHeight;
    }, 300);

  },


  methods: {

    loadSettings () {
      ipc.send('load-settings', 'load')
    },


    updateLoadedSettings (settingsdata, cb) {
      if (settingsdata) {
        this.settings = settingsdata;
        this.settings.showSystemClockTime = true; // show always for clock-saver
        cb && cb();
      }
    },


    handleCloseExitSaverWindow (event) {
      if (exitSaverTimeOut) {
        return false;
      }
      exitSaverTimeOut = setTimeout(() => {
        this.isVideoFadeInClass = false;
        this.isOverlayfadeOut = true;
        ipc.send('close-vsaver-window', event);
        mouseMoveTresholdArr = [];
      }, 10);
    },


    startClockTime () { // clock time
        var today = new Date();
        var timeValueStr = '';
        var h = today.getHours();
        var m = today.getMinutes();
        var s = today.getSeconds();
        if (this.settings.clockTimeFormat == 24) {
          timeValueStr = h + ":" + this.checkTime(m) + ":" + this.checkTime(s);
          this.clockAMPMValue = null;
        } else {
          timeValueStr = this.formatAMPMTime(today);
        }
        if (this.settings.showSystemClockTime) {
          this.clockTimeValue = timeValueStr;
        }

        if ((s % 10 === 0) && this.settings.showSystemClockTime){
          this.setClockTymePosition();
        }
        if (s % 15 === 0){ // +5s of main saver window value
          if (this.settings.showInternetConnectionLostIndicator) {
            this.isConnectedFlag && this.checkConnection();
          }
        }
        stt && clearTimeout(stt);
        stt = setTimeout(() => {
          this.startClockTime();
        }, 1000);
    },


    setClockTymePosition () {
      var verticalValue = this.getRandomIntMinMax(8, (this.size.height - 110));
      var horizontalValue = this.getRandomIntMinMax(20, (this.size.width - 220));
      this.clockTimeStylePosition = `transform: translate(${horizontalValue}px, ${verticalValue}px)`;
    },


    formatAMPMTime(date) {
      var hours = date.getHours();
      var minutes = date.getMinutes();
      var seconds = date.getSeconds();
      this.clockAMPMValue = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      minutes = this.checkTime(minutes);
      seconds = this.checkTime(seconds);
      var strTime = hours + ':' + minutes + ':' + seconds;
      return strTime;
    },


    checkTime(i) { // add a zero in front of numbers<10
        if (i < 10) {
            i = "0" + i;
        }
        return i;
    },


    checkConnection () {
      ipc.send('check-internet-connection');
    },


    getRandomIntMinMax (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

  }

});

