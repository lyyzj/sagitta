"use strict";

const libUtil = require('util');
const libPath = require('path');
const libFsp = require('fs-promise');

class NotFoundHandler {

  register() {
    return function *NotFoundHandler(next) {
      yield next;
      if (404 != this.status) {
        return;
      }

      this.status = 404;

      switch (this.accepts('html', 'json')) {
        case 'html':
          this.type = 'html';
          this.body = yield libFsp.readFile(libPath.join(__dirname, '..', '..', 'public', 'templates', 'views', '404.html'));
          break;
        case 'json':
          this.body = {
            message: 'Page Not Found'
          };
          break;
        default:
          this.type = 'text';
          this.body = 'Page Not Found';
      }

      this.logger.warn(libUtil.format('%s %s 404 Not found', this.method, this.url));
    };
  }

}

module.exports = new NotFoundHandler();