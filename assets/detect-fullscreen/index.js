const util = require('util');
const execFile = util.promisify(require('child_process').execFile);
const path = require('path');
const testFullscreenShPath = path.join(__dirname, './test_fullscreen.sh');

async function execdetectFullscreenShell() {
  let status = null;
  try {
    const { error, stdout, stderr } = await execFile(testFullscreenShPath, []);
    if (stderr) {
      throw new Error(stderr);
      return status;
    }
    if (error) {
      throw new Error(error);
      return status;
    }
    try {
      if (stdout) {
        const parsed = JSON.parse(stdout);
        status = parsed && parsed.hasOwnProperty('isFullscreen') ? parsed.isFullscreen : status;
      }
      return status;
    } catch(e) {
      console.log('detect-fullscreen parse error: ', e);
      return status;
    }
  } catch(e) {
    console.log('detect-fullscreen exec error: ', e);
    return status;
  }
}

module.exports = execdetectFullscreenShell;
