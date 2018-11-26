/** based on https://github.com/caffco/get-video-duration/blob/master/index.js by caffco **/

const { exec } = require('child_process');

const ffprobe = (input) => {
  const params = ['-v', 'error', '-show_format', '-show_streams'];

  return new Promise((res, rej) => {
    exec('ffprobe ' + [...params].join(' ') + ` '${input}'`, (error, stdout, stderr) => {
      if (error) {
        rej(error)
      }
      res(stdout);
    });
  });

};

/**
 * Returns a promise that will be resolved with duration of given video, as a
 * float.
 *
 * @param  {Stream|String} input Stream or URL or path to file to be used as
 * input for ffprobe.
 *
 * @return {Promise} Promise that will be resolved with given video duration, as
 * a float.
 */
module.exports = input => ffprobe(input).then((out) => {
  const stdout = out;
  const matched = stdout.match(/duration="?(\d*\.\d*)"?/);
 if (matched && matched[1]) {
   return parseFloat(matched[1]);
 } else {
   return null;
 }
});














