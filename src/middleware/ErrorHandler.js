"use strict";

class ErrorHandler {

  register() {
    return function *ErrorHandler(next) {
      try {
        yield next;
      } catch(e) {
        let status = e.status || 500;
        let message = e.message || '服务器错误';
        let logger  = require('../logger/Logger');
        logger.info('status: %s, message: %s', status, message);
        this.status = status;
        if (status == 500) {
          this.body = message;
          // 触发 koa 统一错误事件，可以打印出详细的错误堆栈 log
          this.app.emit('error', e, this);
        }

        if (status == 404) {
          this.body = '请求的资源不存在';
        }
      }
    };
  }

}

const handler = new ErrorHandler();

module.exports = handler;
