# <img src="https://github.com/Nowalon/v-saver/blob/dev/assets/img/videoscreensaver-gradient-icon.png?raw=true" width="60px" align="center" alt="Electron API Demos icon">   v-saver

Electron + vue.js based desktop videoscreensaver (linux(ubuntu)-first)


### Linux Requirements

[desktop-idle](https://github.com/bithavoc/node-desktop-idle) package requires:

X server development package and pkg-config are required:

`apt install libxss-dev pkg-config`

`npm install`



### Video formats support

MP4 works, AVI does not. In reason of Electron uses native Chromium browser window, the browsers and Chromium don't support the AVI container format.

### Multiscreen support

Multiscreen support implemented as 2 screens support: Primary and Secondary if connected, with simplified clock-saver window for Secondary/External display.
