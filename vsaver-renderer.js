// This file is required by the vsaver.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

'use strict';

const ipc = require('electron').ipcRenderer

const Vue = require('vue/dist/vue.min.js')

Vue.config.devtools = true

var messageTimeout = 0;
var settingFilesWrapNode, fileListNode, logoImg;
var last_diff = null;
var videoPlayer = null;
var clockTimeNode = null;
var currentTimeGoTo = 0;
var stt = 0;
var shvf = 0;
var hgvf = 0;
var mainPlayInterval = 0;
var mainPlayIntervalId = 0;
var mainPlayFrameSec = 0;
var nextByIntervalTrsholdFlag = false;
var exitSaverTimeOut = 0;
var mouseMoveTresholdTimeOut = 0;
var mouseMoveTresholdArr = [];
var mouseMoveTresholdLimit = 20;
var showVideoLoadingErrorTimeOut = 0;
var goNextTresholdTimeOut = 0;
var goNextAvailable = true;
var nextVideoErrorCountDownTimeOut = 0;
var isVideoLoadedTimeOut = 0;


var saverApp = new Vue({
  el: '#vSaver',
  data: {
    activeVideoIndex: -1, // 0 index -1
    activeVideoSource: null,
    isVideoLoaded: false,
    showVideoLoadingError: false,
    nextVideoErrorTimeoutSec: 15,
    nextVideoErrorCountDownSec: 0,
    isVideoFadeInClass: false,
    isOverlayfadeOut: false,
    isConnectedFlag: true,
    clockAMPMValue: null,
    clockTimeValue: null,
    clockTimeStylePosition: null,
    currentVideoTimeValue: '0:00',
    currentFileDuration: '0:00',
    isNoVideoClass: false,
    isCurrentVideoTimeGo: false, // 'current-time-go'
    videoFileName: '',
    showAnimateFileName: false,
    showFullPathFileName: false,
    showHotkeysHelp: false,
    settings: {},
    files: [],
    filesRandom: [],
    size: {width: 0, height: 768}
  },


  computed: {
    videoStorage () {
      return this.settings.files;
    },
    activeVideoNumber () {
      return this.activeVideoIndex + 1
    },
    totalVideoCount () {
      if (this.filesRandom && this.filesRandom.length) {
        return this.filesRandom.length
      } else if (this.files && this.files.length) {
        return this.files.length
      } else {
        return 0
      }
    }
  },


  mounted () {
    var self = this;

    videoPlayer = document.getElementById('videoPlayer');
    videoPlayer.addEventListener('loadedmetadata', () => {
      self.isVideoLoaded = true;
      setTimeout(() => {
        videoPlayer.currentTime = 0;
        mainPlayFrameSec = 0;
      }, 10);
    }, false);

    videoPlayer.addEventListener('loadeddata', () => {
      self.isVideoLoaded = true;
      setTimeout(() => {
        videoPlayer.currentTime = 0;
        mainPlayFrameSec = 0;
      }, 10);
    }, false);

    self.loadSettings();

    ipc.on('load-settings-reply', function (event, arg) {
      self.updateLoadedSettings(arg, () => {
        self.startClockTime();

        setTimeout(() => {
          self.goPlayer();
        }, 50);

      });
    });

    ipc.on('check-internet-connection-reply', function (event, arg) {
      self.isConnectedFlag = arg ? true : false;
      if (!self.isConnectedFlag) {
        setTimeout(self.checkConnection, 5000);
      }
    });

    if (navigator.vendor === "Apple Computer, Inc."){
        var overlay = document.querySelector('.overlay');
        overlay.style.width = '1920px';
        overlay.style.height = '1080px';
    }

    document.addEventListener('keydown', function(e){
      if(e.keyCode === 72){ // 'h'
        if (self.showHotkeysHelp) {
          return false;
        }
        self.showHotkeysHelp = true;
        setTimeout(() => {
          self.showHotkeysHelp = false;
        }, 5000);
        return;
      }

      if(e.keyCode === 78){ // 'n'
        if (!goNextAvailable) {
          return false;
        }
        self.showFullPathFileName = false;
        showVideoLoadingErrorTimeOut && clearTimeout(showVideoLoadingErrorTimeOut);
        this.showVideoLoadingError = false;
        self.goPlayer();
        nextVideoErrorCountDownTimeOut && clearInterval(nextVideoErrorCountDownTimeOut);
        isVideoLoadedTimeOut && clearInterval(isVideoLoadedTimeOut);
        goNextAvailable = false;
        goNextTresholdTimeOut = setTimeout(() => {
          goNextAvailable = true;
        }, 1000);
        return;
      }

      if(e.keyCode === 77){ // 'm'
        if (isNaN(videoPlayer.duration)){
          return false;
        }
        videoPlayer.currentTime = (videoPlayer.currentTime + 10 < videoPlayer.duration) ? videoPlayer.currentTime + 10 : videoPlayer.duration - 3;
        return;
      }
      if(e.keyCode === 66){ // 'b'
        videoPlayer.currentTime = (videoPlayer.currentTime - 10 < 0) ? 0 : videoPlayer.currentTime - 10;
        self.isVideoFadeInClass = true;
        return;
      }
      if(e.keyCode === 67){
        self.checkConnection();
        return;
      }
      if(e.keyCode === 70){ // 'f'
        if (self.showAnimateFileName) {
          self.showFullPathFileName = true;
        }
        self.showVideoFileName(self.activeVideoSource, 10);
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
        this.size.width = bodyNode.offsetWidth;
        this.size.height = bodyNode.offsetHeight;
    }, 300);

  }, // mounted

  updated: function () {},


  methods: {

    loadSettings () {
      ipc.send('load-settings', 'load')
    },


    updateLoadedSettings (settingsdata, cb) {
      if (settingsdata) {
        this.settings = settingsdata;
        this.files = this.settings.files;
        this.updateRandomizeFiles();
        mainPlayInterval = (this.settings.changeAfter === 'interval') ? this.settings.changeInterval * 1 * 60 : 0;
        cb && cb();
      }
    },


    goPlayer(){
      //add all array of videos here
      var videoStorage = this.settings.randomizeVideo && this.filesRandom.length ? this.filesRandom : this.files;
      if (!videoStorage.length) {
        this.currentVideoTimeValue = '';
        this.currentFileDuration = '';
        this.isNoVideoClass = true;
        this.showVideoFileName('*/NO VIDEO AVAILABLE');
        return false;
      }
      this.isNoVideoClass = false;
      this.isVideoLoaded = false;
      this.showVideoLoadingError = false;
      this.nextVideoErrorCountDownSec = this.nextVideoErrorTimeoutSec;
      nextVideoErrorCountDownTimeOut && clearInterval(nextVideoErrorCountDownTimeOut);
      isVideoLoadedTimeOut && clearInterval(isVideoLoadedTimeOut);

      this.activeVideoIndex++;
      if (this.activeVideoIndex >= (videoStorage.length)) {
        this.updateRandomizeFiles();
        this.activeVideoIndex = 0;
      }
      this.activeVideoSource = videoStorage[this.activeVideoIndex];
      setTimeout(() => {
        videoPlayer.currentTime = 0;
        mainPlayFrameSec = 0;
      }, 50);

      videoPlayer.removeEventListener('timeupdate', this.handleVideoTimeupdate);

      setTimeout(() => {
        this.settings.showVideoFileName && this.showVideoFileName(this.activeVideoSource);
        setTimeout(() => {
          this.isVideoFadeInClass = true;
          setTimeout(() => {
            this.checkIsVideoLoaded();
          }, 1000);
        }, 200);

        videoPlayer.addEventListener('timeupdate', this.handleVideoTimeupdate(videoPlayer) , false);
        this.startVideoIntervalTimer();
      }, 100);
    },


    checkIsVideoLoaded () {
      nextVideoErrorCountDownTimeOut && clearInterval(nextVideoErrorCountDownTimeOut);
      isVideoLoadedTimeOut && clearInterval(isVideoLoadedTimeOut);
      isVideoLoadedTimeOut = setTimeout(() => {
        if (!this.isVideoLoaded && isNaN(videoPlayer.duration)) {
          this.showVideoLoadingError = true;
          nextVideoErrorCountDownTimeOut = setInterval(() => {
            this.nextVideoErrorCountDownSec = this.nextVideoErrorCountDownSec - 1;
          }, 1000);
          showVideoLoadingErrorTimeOut && clearTimeout(showVideoLoadingErrorTimeOut);
          showVideoLoadingErrorTimeOut = setTimeout(() => {
            this.goPlayer();
            this.showVideoLoadingError = false;

          }, this.nextVideoErrorTimeoutSec * 1000);
        }
      }, 1500);
    },


    handleVideoTimeupdate(video){
      var self = this;
        return function(){
          if (self.settings && self.settings.changeAfter && self.settings.changeAfter === 'interval') {
            if (mainPlayFrameSec >= mainPlayInterval) {
              if (nextByIntervalTrsholdFlag) { return; }
              self.isVideoFadeInClass = false;
              nextByIntervalTrsholdFlag = true;
              setTimeout(() => {
                self.goPlayer();
                setTimeout(() => {
                  nextByIntervalTrsholdFlag = false;
                }, 2000);
              }, 1200);
            }
          }
          var diff = video.duration - video.currentTime;
          if (last_diff !== Math.floor(diff)){
            var s_diff = Math.floor(diff) % 60;
            var remain = ( isNaN(parseInt(diff / 60)) || isNaN(s_diff) ) ? "0:00" : "-" + parseInt(diff / 60) + ":" + ( s_diff < 10 ? "0" + s_diff : s_diff );
            var total_s = Math.floor(video.duration) % 60;
            var totalDurationMin = ( isNaN(parseInt(video.duration / 60)) || isNaN(total_s) ) ? "0:00" : parseInt(video.duration / 60) + ":" + ( total_s < 10 ? "0" + total_s : total_s );
            self.currentFileDuration = totalDurationMin;
            self.currentVideoTimeValue = remain;
            if (Math.floor(diff) <= 3){
                if (Math.floor(diff) === 1){
                  self.isVideoFadeInClass = false;
                }
                if (Math.floor(diff) === 0){
                  self.isVideoFadeInClass = false;
                  self.goPlayer();
                }
                if (Math.floor(diff) !== 0){
                  self.animateCurrentTime();
                }
            } else {
              //
            }
            last_diff = Math.floor(diff);
          }
        }
    },


    startVideoIntervalTimer () {
      mainPlayIntervalId && clearInterval(mainPlayIntervalId);
      mainPlayIntervalId = setInterval(() => {
        mainPlayFrameSec = mainPlayFrameSec + 1;
      }, 1000);
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


    getFileNameFromSrcLink (srcLink) {
        var self = this;
        if (self.showFullPathFileName) {
          return srcLink;
        }
        var srcParts_arr = [];
        srcParts_arr = srcLink.split('/');
        return srcParts_arr[srcParts_arr.length-1];
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
        if ((s % 30 === 0) && this.settings.showSystemClockTime){
          this.clockTimeStylePosition = `margin-top: ${this.getRandomIntMinMax(80, (this.size.height - 160))}px`;
        }
        if (s % 10 === 0){
          if (this.settings.showInternetConnectionLostIndicator) {
            this.isConnectedFlag && this.checkConnection();
          }
        }
        stt && clearTimeout(stt);
        stt = setTimeout(() => {
          this.startClockTime();
        }, 1000);
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


    animateCurrentTime() { // current video time
        this.isCurrentVideoTimeGo = true;
        currentTimeGoTo && clearTimeout(currentTimeGoTo);
        var currentTimeGoTo = setTimeout(() => {
          this.isCurrentVideoTimeGo = false;
        }, 620);
    },


    showVideoFileName(activeVideoSource, delay) {
        var filenameStr = this.getFileNameFromSrcLink(activeVideoSource);
        this.showAnimateFileName = false;
        var _delay = delay || 1000;
        shvf && clearTimeout(shvf);
        hgvf && clearTimeout(hgvf);
        shvf = setTimeout(() => {
            var durationStr = this.currentFileDuration.length ? ' : ' + this.currentFileDuration : '';
            this.videoFileName = filenameStr + durationStr;
            this.showAnimateFileName = true;
            hgvf = setTimeout(() => {
              this.showAnimateFileName = false;
              this.showFullPathFileName = false;
            }, 8000);
        }, _delay);
    },


    updateRandomizeFiles() {
      if (this.settings
          && this.settings.randomizeVideo
          && this.files
          && this.files.length > 1) {
        this.filesRandom = this.shuffleArray(this.files);
      }
    },


    shuffleArray(arr) {
      var a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },


    getRandomIntMinMax (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

  }

});








