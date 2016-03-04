"use strict";

const libUtil = require('util');

class NotFoundHandler {

  register() {
    return function *NotFoundHandler(next) {
      yield next;
      if (404 != this.status) {
        return;
      }

      this.status = 404;

      //console.log(this.render('404.html', { title: 'arrow' }));

      switch (this.accepts('html', 'json')) {
        case 'html':
          this.type = 'html';
          this.body = yield *this.render('404.html', { title: 'arrow' });
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