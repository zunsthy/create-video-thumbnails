const scale = (sw, sh, dw, dh) => {
  let ow, oh;
  if (!dw && !dh) {
    ow = sw;
    oh = sh;
  } else if (dw) {
    ow = dw;
    oh = Math.floor(dw / sw * sh);
  } else if (dh) {
    oh = dh;
    ow = Math.floor(dh / sh * sw);
  } else {
    oh = dw;
    ow = dh;
  }
  return { width: ow, height: oh };
};

const once = (fn) => {
  let flag = false;
  let result;
  return (...args) => {
    if (flag) {
      return result;
    }
    return result = fn(...args);
  };
};

/**
 * Create thumbnails of the video
 * @param {string} videoSrc video source url
 * @param {number} n the number of thumbnails
 * @param {object} options some options
 */
export const createVideoThumbnails = (videoSrc, options = {}) => {
  const video = document.createElement('video');
  if (options.width) {
    video.width = options.width;
  }
  if (options.height) {
    video.height = options.height;
  }

  let duration = 0;
  let hasError = false;
  let loaded = false;
  let destoryed = false;

  const seek = (time) => {
    if (video.fastSeek) {
      video.fastSeek(time);
    } else {
      video.currentTime = time;
    }
  };

  const init = () => {
    video.src = videoSrc;
  };

  const handleInit = () => {
    duration = video.duration;
    loaded = true;
  };
  const handleFailed = () => {
    hasError = true;
    loaded = true;
  };
  video.addEventListener('loadedmetadata', handleInit);
  video.addEventListener('error', handleFailed);

  return {
    make: (n, cb) => {
      if (destoryed) {
        return;
      }

      const callback = once(cb);

      const result = [];

      result.destory = () => {
        result.forEach(({ url }) => {
          URL.revokeObjectURL(url);
        });
      };

      let step = 0;
      let current = 0;
      let iw = 0;
      let ih = 0;
      let canvas;
      let context;

      const next = () => {
        current += step;
        if (current < duration) {
          seek(current);
        } else {
          end();
          callback(null, result);
        }
      };

      const handleSeek = () => {
        context.drawImage(video, 0, 0, iw, ih);
        canvas.convertToBlob().then((blob) => {
          result.push({
            time: current,
            url: URL.createObjectURL(blob),
          });
          next();
        });
      };

      const handleLoad = () => {
        step = video.duration / n;
        const s = scale(video.videoWidth, video.videoHeight, options.width, options.height);
        iw = s.width;
        ih = s.height;
        canvas = new OffscreenCanvas(iw, ih);
        context = canvas.getContext('2d');
        video.removeEventListener('loadedmetadata', handleLoad);
        seek(0);
      };

      const handleError = () => {
        video.removeEventListener('error', handleError);
        const error = new Error(video.error.message);
        error.code = video.error.code;
        callback(error);
      };

      const start = () => {
        video.addEventListener('seeked', handleSeek);
        if (hasError) {
          handleError();
        } else {
          video.addEventListener('error', handleError);
        }
        if (loaded) {
          handleLoad();
        } else {
          video.addEventListener('loadedmetadata', handleLoad);
          init();
        }
      };

      const end = () => {
        video.removeEventListener('seeked', handleSeek);
      };

      start();
    },

    destory: () => {
      video.removeEventListener('loadedmetadata', handleInit);
      video.removeAttribute('src');
      video.load();
      destoryed = true;
    },
  };
};

export default createVideoThumbnails;
