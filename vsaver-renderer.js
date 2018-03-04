// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

'use strict';

// * TODO: hotkeys helper;
// * TODO: check video on-load: check if no video loaded; set duration 0;
// ** TODO:SEEMS FIXED  fix video src error (trigger timout- temp fixed loadeddata/loadedmetadata, message width);
// * TODO: settings>changeAfter: videoend - interval;
// * TODO: fix checkInternetConnection behavior;
// ? TODO: check pointer behavior issue;
// * TODO: handle/change the tray icon if suspended;
// * TODO: change/optimize the tray icon;
// * TODO: app version check/notify;
// * TODO: showFileName count/total info ===> * change every 30 min  behavior;
// * TODO: reset isSuspendSaver after ~ 2h idle;
// * TODO: clock am/pm text/size/position => use if clockAMPMValue do decrease left margin value;
// * TODO: check/try to use tray badge to indicate connection;
// TODO: check multiscreen;


const ipc = require('electron').ipcRenderer

const Vue = require('vue/dist/vue.min.js')

Vue.config.devtools = true


var messageTimeout = 0;

var settingFilesWrapNode, fileListNode, logoImg;




var last_diff = null;
//var isConnectedFlag = true;
var videoPlayer = null;
var clockTimeNode = null;
//var currentTimeEl = null;
//var internetConnectionIcoElem = null;


var currentTimeGoTo = 0;
var svt = 0;
var stt = 0;
var shvf = 0;
var hgvf = 0;
//
//var mainPlayTimeOut = 0;
var mainPlayInterval = 0;
var mainPlayIntervalId = 0;
var mainPlayFrameSec = 0;
//var nextByIntervalTimeOut = 0;
var nextByIntervalTrsholdFlag = false;
//
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
//    svt: 0,
//    stt: 0,
//    shvf: 0,
//    hgvf: 0,
//    currentTimeEl: null,
//    videoPlayer: null,

    activeVideoIndex: -1, // 0 index -1
    activeVideoSource: null,
    isVideoLoaded: false,
    showVideoLoadingError: false,
    nextVideoErrorTimeoutSec: 15,
    nextVideoErrorCountDownSec: 0,
//    isVideoFadeOutClass: true,
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
    showHotkeysHelp: false,

//    message: '',
//    showMessage: false,
//    activeTab: 'tab1',
//    initLoadedOrReset: false,

//    defaultSettings: {
//      files: [],
//      runInterval: 10,
//      lockSystemOnExit: true,
//      changeAfter: 'videoends',
//      changeInterval: 5,
//      randomizeVideo: true,
//      showSystemClockTime: true,
//      use24TimeFormat: true,
//      showVideoRemainingTime: true,
//      showVideoFileName: true,
//      showInternetConnectionLostIndicator: true,
//      showTrayIcon: true
//    },
    settings: {},
    files: [],
    filesRandom: [],


size: {width: 0, height: 768},

/*
    settings: {
      files: [],
      runInterval: 10,
      lockSystemOnExit: true,
      changeAfter: 'videoends',
      changeInterval: 5,
      randomizeVideo: true,

      showSystemClockTime: true,
      use24TimeFormat: true,
      clockTimeFormat
      showVideoRemainingTime: true,
      showVideoFileName: true,
      showInternetConnectionLostIndicator: true,

      showTrayIcon: true,
    },
*/
//    maxRunInterval: 30,
//    maxVideoChangeInterval: 30,

//    showfileListScroll: false
    checkConnectionExternalSource: 'https://assets.ubuntu.com/v1/e1bba201-external-link-cool-grey.svg'
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

/*
    filesCount () {
      return this.settings.files.length;
    },
*/

  },

  mounted () {
    var self = this;

    videoPlayer = document.getElementById('videoPlayer');
//    currentTimeEl = document.getElementById('currentTime');

//    clockTimeNode = document.getElementById('clockTime');
//    internetConnectionIcoElem = document.getElementById('internetConnectionIco');
//    videoPlayer.removeEventListener('timeupdate', this.handleVideoTimeupdate);
//    videoPlayer.addEventListener('durationchange', () => {

    videoPlayer.addEventListener('loadedmetadata', () => {
//console.warn("  loadedmetadata    !!!! ");
      self.isVideoLoaded = true;
      setTimeout(() => {
        videoPlayer.currentTime = 0;
        mainPlayFrameSec = 0;
      }, 10);
    }, false);

    videoPlayer.addEventListener('loadeddata', () => {
//console.warn(" ---- loadeddata");
      self.isVideoLoaded = true;
      setTimeout(() => {
        videoPlayer.currentTime = 0;
        mainPlayFrameSec = 0;
      }, 10);
    }, false);

    self.loadSettings();


/*
    ipc.on('selected-files-reply', function (event, paths) {
      if (paths && paths.length) {
        self.setUpdateFiles(paths);
      }
    })
*/

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

/*
    ipc.on('reset-settings-reply', function (event, arg) {
      self.initLoadedOrReset = false;
      self.settings = self.defaultSettings;
      self.handleShowMessage(arg);
      setTimeout(() => {
        self.initLoadedOrReset = true;
      }, 100);
    })
*/

//    settingFilesWrapNode = document.getElementById('settingFilesWrapNode');
//    fileListNode = document.getElementById('fileListNode');
//    logoImg = document.getElementById('logoImg');

/*
    logoImg.addEventListener('click', () => {
      ipc.send('open-about-dialog');
    }, false);
*/


    if (navigator.vendor === "Apple Computer, Inc."){
        var overlay = document.querySelector('.overlay');
        overlay.style.width = '1920px';
        overlay.style.height = '1080px';
    }


    document.addEventListener('keydown', function(e){
//            e.preventDefault();
//console.warn("keydown videoPlayer.currentTime: ", videoPlayer.currentTime);
console.warn("keydown e.keyCode: ", e.keyCode);

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
//        goNextTresholdTimeOut && clearTimeout(goNextTresholdTimeOut);
//        if (goNextTresholdTimeOut) {
//          clearTimeout(goNextTresholdTimeOut);
//          return false;
//        }
//        goNextTresholdTimeOut && clearTimeout(goNextTresholdTimeOut);

        if (!goNextAvailable) {
          return false;
        }
        showVideoLoadingErrorTimeOut && clearTimeout(showVideoLoadingErrorTimeOut);
        this.showVideoLoadingError = false;
        self.goPlayer();
        nextVideoErrorCountDownTimeOut && clearInterval(nextVideoErrorCountDownTimeOut);
        isVideoLoadedTimeOut && clearInterval(isVideoLoadedTimeOut);
        goNextAvailable = false;
        goNextTresholdTimeOut = setTimeout(() => {
          goNextAvailable = true;
//          goNextTresholdTimeOut && clearTimeout(goNextTresholdTimeOut);
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
      //self.isVideoFadeOutClass = true;
      //self.isVideoFadeInClass = false;
      self.handleCloseExitSaverWindow(e);

//console.log("E: ", e);
//console.log("E.keyCode: ", e.keyCode);
//                keyCode:72 = "h"
//                keyCode:78 = "n"
//                keyCode:77 = "m"
//                keyCode:66 = "b"
//                keyCode:67 = "c"
//                keyCode:122 = "F11"
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
//        this.size = { width: bodyNode.offsetWidth, height:  bodyNode.offsetHeight };
        this.size.width = bodyNode.offsetWidth;
        this.size.height = bodyNode.offsetHeight;
    }, 300);


  },

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
//        if (this.settings.randomizeVideo) {
//          this.filesRandom = this.shuffleArray(this.settings.files);
//        }
console.log("Settings loaded...: ", this.settings); //return true;
        cb && cb();
//        this.handleShowMessage('Settings loaded...', 1500);
      } /**!!! CAREFUL !!! **/
      /* else {
        this.handleSaveSettings();
      }*/
/*
      setTimeout(() => {
        this.initLoadedOrReset = true;
      }, 100);
*/
    },

    goPlayer(){

      //add all array of videos here !!
//        var videoStorage = this.settings.files;
      var videoStorage = this.settings.randomizeVideo && this.filesRandom.length ? this.filesRandom : this.files;
//var videoStorage = [];

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

        // choose one random url from our storage as the active video
//        var activeVideoSource = videoStorage[Math.round(Math.random() * (videoStorage.length - 1))];
/*
        if (this.settings.randomizeVideo) {
          this.activeVideoSource = videoStorage[Math.round(Math.random() * (videoStorage.length - 1))];
        } else {
          this.activeVideoIndex++;
          this.activeVideoSource = videoStorage[this.activeVideoIndex];
        }
*/

      this.activeVideoIndex++;
      if (this.activeVideoIndex >= (videoStorage.length)) {
        this.updateRandomizeFiles();
        this.activeVideoIndex = 0;
      }
//console.warn("this.activeVideoIndex of LENGHT: ", this.activeVideoIndex, '/', videoStorage.length);

      this.activeVideoSource = videoStorage[this.activeVideoIndex];

      setTimeout(() => {
        videoPlayer.currentTime = 0;
        mainPlayFrameSec = 0;
      }, 50);

//          this.activeVideoSource = this.activeVideoSource.replace('.avi', '.mp4');

    //    videoPlayer.removeEventListener('durationchange', handleVideoInit());
    //    videoPlayer.removeEventListener('loadedmetadata', handleVideoInit);
    //    videoPlayer.removeEventListener('durationchange', handleVideoInit);
      videoPlayer.removeEventListener('timeupdate', this.handleVideoTimeupdate);

      setTimeout(() => {
      this.settings.showVideoFileName && this.showVideoFileName(this.activeVideoSource);
      setTimeout(() => {
//        this.isVideoFadeOutClass = false;
        this.isVideoFadeInClass = true;
        setTimeout(() => {
          this.checkIsVideoLoaded();
        }, 1000);
      }, 200);

          //    videoPlayer.addEventListener('durationchange', handleVideoInit(videoPlayer), false);
          //    videoPlayer.addEventListener('loadedmetadata', handleVideoInit, false);
          //    videoPlayer.addEventListener('durationchange', handleVideoInit, false);
      //        videoPlayer.addEventListener('timeupdate', this.handleVideoTimeupdate(videoPlayer, currentTimeEl) , false);
      videoPlayer.addEventListener('timeupdate', this.handleVideoTimeupdate(videoPlayer) , false);
      this.startVideiIntervalTimer();
          //setTimeout(function(){
          ////videoPlayer.currentTime = 170;
          //videoPlayer.currentTime = 60*3-6;
          //}, 700);
      //        videoPlayer.classList.remove('video-fade-out');
      //        videoPlayer.classList.remove('video-fade-out');
      //  this.isVideoFadeOutClass = false;
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

    handleVideoTimeupdate(video/*, _currentTimeEl*/){
      var self = this;
        return function(){
//console.warn("mainPlayFrameSec: ", mainPlayFrameSec);
          if (self.settings && self.settings.changeAfter && self.settings.changeAfter === 'interval') {
//mainPlayInterval = 10;
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
    //        var currentTimeEl = _currentTimeEl;
            var diff = video.duration - video.currentTime;

    //console.warn("video.duration: ", video.duration);
    //console.warn("video.currentTime: ", video.currentTime);
    //console.warn("diff: ", diff);

            if (last_diff !== Math.floor(diff)){

                var s_diff = Math.floor(diff) % 60;
    //console.log("diff: ",  Math.floor(diff));
    //console.log("s_diff: ", s_diff);
    //            var remain = "-" + parseInt(diff / 60) + ":" + ( s_diff < 10 ? "0" + s_diff : s_diff );
                var remain = ( isNaN(parseInt(diff / 60)) || isNaN(s_diff) ) ? "0:00" : "-" + parseInt(diff / 60) + ":" + ( s_diff < 10 ? "0" + s_diff : s_diff );

                var total_s = Math.floor(video.duration) % 60;
                var totalDurationMin = ( isNaN(parseInt(video.duration / 60)) || isNaN(total_s) ) ? "0:00" : parseInt(video.duration / 60) + ":" + ( total_s < 10 ? "0" + total_s : total_s );
    //console.warn("totalDurationMin: ", totalDurationMin);
              self.currentFileDuration = totalDurationMin;
    //console.warn("this.currentFileDuration: ", self.currentFileDuration);
              //currentTimeEl.innerHTML = remain;

                self.currentVideoTimeValue = remain;
                //self.currentVideoTimeValue = totalDurationMin + ' / ' + remain;
    //console.warn("self.currentVideoTimeValue: ", self.currentVideoTimeValue);
    //            currentTimeEl.innerHTML = Math.floor(video.duration) + ' : ' + Math.floor(diff) + ' : ' + remain;

    /*
            if (Math.floor(diff) === 3){
                currentTimeEl.style.fontSize = '950px';
                currentTimeEl.style.opacity = '0';
            }
    */
                if (Math.floor(diff) <= 3){
        //            currentTimeEl.style.fontSize = '950px';
        //            currentTimeEl.style.opacity = '0';
                    //currentTimeEl.classList.add('current-time-endtime');
                    self.animateCurrentTime();
                    if (Math.floor(diff) === 1){
    //                    videoPlayer.classList.add('video-fade-out');
                      //self.isVideoFadeOutClass = true;
                      self.isVideoFadeInClass = false;
                    }
                    if (Math.floor(diff) === 0){
    //                  self.activeVideoIndex++;
                      self.isVideoFadeInClass = false;
                      self.goPlayer();
                    }
                } else {
                  //self.isVideoFadeOutClass = false;
    //              self.isVideoFadeInClass = true;
                }

                last_diff = Math.floor(diff);
            }

        }
    },

    startVideiIntervalTimer () {
      mainPlayIntervalId && clearInterval(mainPlayIntervalId);
      mainPlayIntervalId = setInterval(() => {
        mainPlayFrameSec = mainPlayFrameSec + 1;
      }, 1000);

    },

    handleCloseExitSaverWindow (event) {

//return;

//console.warn("event.type: ", event.type);
//console.warn("event", event);

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

// !!!       if ((s % 30 === 0) && this.settings.showSystemClockTime){
        if ((s % 10 === 0) && this.settings.showSystemClockTime){
          this.clockTimeStylePosition = `margin-top: ${this.getRandomIntMinMax(80, (this.size.height - 160))}px`;
        }
        if (s % 10 === 0){
          if (this.settings.showInternetConnectionLostIndicator) {
            this.isConnectedFlag && this.checkConnection();
          }
        }
        if ((m % 30 === 0) && this.settings.showSystemClockTime){
          // ??? this.updateRandomizeFiles();   ??? showSystemClockTime ???
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
//        var className = 'current-time-go';
//        currentTimeEl.classList.add(className);
        this.isCurrentVideoTimeGo = true;
        currentTimeGoTo && clearTimeout(currentTimeGoTo);
        var currentTimeGoTo = setTimeout(() => {
//            currentTimeEl.classList.remove(className);
          this.isCurrentVideoTimeGo = false;
        }, 620);
    },

    showVideoFileName(activeVideoSource) { // TODO: rework with vue.js
        var filenameStr = this.getFileNameFromSrcLink(activeVideoSource);
//        var fileNameElem = document.getElementById('videoFileName');
//        fileNameElem.classList.remove('show-file-name');
//        videoFileName
//        showAnimateFileName
console.warn("filenameStr: ", filenameStr);

        this.showAnimateFileName = false;
        shvf && clearTimeout(shvf);
        hgvf && clearTimeout(hgvf);
        shvf = setTimeout(() => {
            var durationStr = this.currentFileDuration.length ? ' : ' + this.currentFileDuration : '';
            this.videoFileName = filenameStr + durationStr;
//            fileNameElem.classList.add('show-file-name');
            this.showAnimateFileName = true;
            hgvf = setTimeout(() => {
//                fileNameElem.classList.remove('show-file-name');
              this.showAnimateFileName = false;
//            }, 6000);
            }, 8000);
//            }, 58000);
        }, 1000);
    },

    updateRandomizeFiles() {
/*
      if (this.settings
          && this.settings.randomizeVideo
          && this.settings.files
          && this.settings.files.length > 1) {
        this.filesRandom = this.shuffleArray(this.settings.files);
      }
*/
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



  },


  watch: {

/*
    'settings' : {
      handler: function (newValue, oldValue) {
console.warn("settings newValue: ", newValue);
        this.initLoadedOrReset && this.handleSaveSettings()
      },
      deep: true
    },
*/

/*
    'settings.files' : {
      handler: function (newValue, oldValue) {
        this.handleFileListSize();
      },
    }
*/

  }

});








