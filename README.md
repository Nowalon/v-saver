# <img src="https://github.com/Nowalon/v-saver/blob/master/assets/img/videoscreensaver-gradient-icon.png?raw=true" width="60px" align="center" alt="V-Saver icon">   v-saver

Electron + vue.js based desktop videoscreensaver (linux(ubuntu)-first)


### Linux Requirements

[desktop-idle](https://github.com/bithavoc/node-desktop-idle) package requires:

X server development package and pkg-config are required:

`apt install libxss-dev pkg-config`


##
###

### Video formats support

MP4 works, AVI does not. In reason of Electron uses native Chromium browser window, the browsers and Chromium don't support the AVI container format.

### Multiscreen support

Multiscreen support implemented as 2 screens support: Primary and Secondary if connected, with simplified clock-saver window for Secondary/External display.

### <img src="https://github.com/Nowalon/v-saver/blob/master/assets/img/screenshot01.jpg?raw=true" width="100%" align="center" alt="V-Saver screenshot">

##
###

### Download

Deb: [v-saver_0.9.5_amd64.deb](https://github.com/Nowalon/v-saver/raw/settings/dist/v-saver_0.9.5_amd64.deb)

AppImage: [V-Saver_0.9.5.AppImage](https://github.com/Nowalon/v-saver/raw/settings/dist/V-Saver_0.9.5.AppImage)


### Start application automatically on login

For Ubuntu I have used the following command in "Startup Applications" for starting v-saver in 15 seconds after login:

`sh -c "sleep 15; exec v-saver &"`

or make manually some autostart executable file for example "vsaver.sh.desktop" in `~/.config/autostart/` :

```[Desktop Entry]
Type=Application
Exec=sh -c "sleep 15; exec v-saver &"
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
Name[en]=v-saver
Name=v-saver
Comment[en]=v-saver
Comment=v-saver
```


##

### Issues

~~There's still no a normal solution to detect fullscreen running applications (at least I haven't found yet) for Ubuntu, even for XScreensaver.~~
~~In this reason~~ v-saver has own suspend running mode as menu option with some reset timer.

**UPDATED:**

The issue has been researched anew and finally solution for Xserver was discovered, reworked for node.js module using, no dependencies (e.g. wmctrl) required - 
by `xvinfo` - for X displays detection and `xprop` - windows properties in an X server - to check windows fullscreen state;

displays detection with flexible checking fix;

##

### TODO

* localization/language settings;
* ~~filelist ordering/sorting with mouse drag-n-drop (at the moment I think it is some extra);~~ done;

##

### Changelog

0.9.5:
* main: fullscreen detection based on X-server windows info;
* main,settings: saver type selection  - video or clock - for primary (and external if provided) displays;
* primary/secondary displays detection, position (GNOME/secondary display left position) fix/improvements;
* main: fullscreen (GNOME especial) behavior, cursor hiding fix/improvements;
* main,settings: eliminate fullscreen applications detection after 30m/1h/2h... timer;
* main: tray icon enabling/disabling for Ubuntu 18.04 GNOME issues reworked;
* main: GNOME screen lock (system is locked) detection;
* settings: drag and drop files upload to file list;
* settings: file list sorting by arrows is cycled;
* settings: file list items ordering with drag-n-drop;
* settings: file duration time with ffprobe fetching/storing, file-path/duration fetch errors handling;
* settings: wrong file path, format, duration, broken file error indication;
* settings: 'action-confirm' button for 'are you sure' actions;
* settings: 'play' button in the file list;
* videosaver: double 'F' press shows full file path;
* settings window: title close, minify buttons;
* main,settings: 'Internet connection lost' OS notification;
* electron, node updated;

0.9.4: electron, node updated;

0.9.3: Settings option as interval for switch off suspend mode after - resets the suspend mode after selected idle interval value; help note-tip styles, alignment update; settings options height increased;

0.9.2: Critical "initial no setting issue" fixed; * show-file-name hotkey;

0.9.1: RC release;
