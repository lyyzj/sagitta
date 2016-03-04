"use strict";

class PromiseRetry {

  retry(fn, context, args, retryLeft = 3) {
    return fn.apply(context, args).catch((err) => {
      //Logger.instance.warn('[PromiseRetry][%s] Fn "%s" failed with %s, retry left: %d', process.pid, fn.name, err.message, retryLeft);
      if (retryLeft <= 0) {
        //Logger.instance.error('[PromiseRetry][%s] Fn "%s" failed with %s, no retry left', process.pid, fn.name, err.message);
        throw err;
      }
      return this.retry(fn, context, args, retryLeft - 1);
    });
  }

}

module.exports = new PromiseRetry();