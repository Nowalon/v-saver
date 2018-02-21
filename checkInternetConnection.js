
var cb_rej_timeout = 0;
var img_load_timeout = 0;

    /**
     * Creates and loads an image element by url.
     * @param  {String} url
     */
    function request_image(url, cb_img_res, cb_img_rej) {
//    request_image (url, cb_img_res, cb_img_rej) {
//        return new Promise(function(resolve, reject) {
            var img = new Image();
            img.onload = function() {
//                resolve(img);
//console.log("resolve(img);: ", typeof img, img); //return true;
                img_load_timeout && clearTimeout(img_load_timeout);
                cb_img_res && cb_img_res(img);
            };
//            img.onerror = function() { reject(url);
            img.onerror = function() {
//console.log("reject(img);"); //return true;
//                stop();
                cb_img_rej && cb_img_rej(false);
//                reject(false);
            };
            img.src = url + '?random-no-cache=' + Math.floor((1 + Math.random()) * 0x10000).toString(16);
        img_load_timeout && clearTimeout(img_load_timeout);
        img_load_timeout = setTimeout(function(){
            img.src = '';
//            img = null;
        }, 5000);
//        });

    }

    /**
     * Pings a url.
     * @param  {String} url
     * @param  {Number} multiplier - optional, factor to adjust the ping by.  0.3 works well for HTTP servers.
     */
    function ping(url, multiplier, cb_res, cb_rej) {
//    const ping = function ping(url, multiplier, cb_res, cb_rej) {
//        return new Promise(function(resolve, reject) {});
//        return new Promise(function(resolve, reject) {
            cb_rej_timeout && clearTimeout(cb_rej_timeout);
            var start = (new Date()).getTime();
            var response = function(imgRes) {
//console.log("imgRes: ", imgRes); //return true;

                var delta = ((new Date()).getTime() - start);
                delta *= (multiplier || 1);
                cb_rej_timeout && clearTimeout(cb_rej_timeout);
                imgRes && cb_res && cb_res(delta);
                !imgRes && cb_rej && cb_rej('Error');
//                imgRes && resolve(delta);
            };

            cb_rej_timeout = setTimeout(function() {
//                cb_rej && cb_rej('Timeout');
//                reject('Timeout');
            }, 5000);

//            request_image(url).then(response).catch(response);
            request_image(url, response, response);

            // Set a timeout for max-pings, 5s.
//            setTimeout(function() { reject(Error('Timeout')); }, 5000);
//        });
    }

//    return ping;
//}));


// function stop(){
//    if(window.stop !== undefined)
//     {
//        window.stop();
//     }
//     else if(document.execCommand !== undefined)
//     {
//     document.execCommand("Stop", false);
//     }
// }

module.exports = {ping};
