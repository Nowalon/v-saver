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

Deb: [v-saver_0.9.2_amd64.deb](https://github.com/Nowalon/v-saver/raw/master/dist/v-saver_0.9.2_amd64.deb)

AppImage: [v-saver-0.9.2-x86_64.AppImage](https://github.com/Nowalon/v-saver/raw/master/dist/v-saver-0.9.2-x86_64.AppImage)


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

There's still no a normal solution to detect fullscreen running applications (at least I haven't found yet) for Ubuntu, even for XScreensaver.
In this reason v-saver has own suspend running mode as menu option with some reset timer.

##

### TODO

* make 'reset suspend mode during idle' inerval as settings option (now if system idle ~2.4 hardcoded hours it resets suspend status, e.g. if you finished watch movie the v-saver resumes its work after some time);
* localization/language settings;
* filelist ordering/sorting with mouse drag-n-drop (at the moment I think it is some extra);

##

### Changelog

0.9.2: Critical "initial no setting issue" fixed; * show-file-name hotkey;

0.9.1: RC release;
