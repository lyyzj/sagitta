"use strict";

const logger = require('../logger/Logger.js');

class RequestTimer {

  register() {
    return function *RequestTimer(next){
      var start = new Date;
      yield next;
      var consumed = new Date - start;
      if (process.env.hasOwnProperty('DEBUG')) {
        this.set('X-Response-Time', consumed + 'ms');
      }
      logger.info(this.reqId, '%s %s - %s ms', this.method, this.url, consumed);
    }
  }

}

const instance = new RequestTimer();

module.exports = instance;