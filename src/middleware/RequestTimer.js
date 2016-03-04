"use strict";

const libUtil = require('util');

class RequestTimer {

  register() {
    return function *RequestTimer(next){
      var start = new Date;
      yield next;
      var ms = new Date - start;
      if (process.env.hasOwnProperty('DEBUG')) {
        this.set('X-Response-Time', ms + 'ms');
      }
      this.logger.info(libUtil.format('%s %s - %s ms', this.method, this.url, ms));
    }
  }

}

module.exports = new RequestTimer();