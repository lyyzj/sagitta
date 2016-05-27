'use strict';

class CorsHandler {

  register() {
    return function *CorsHandler(next) {
      this.set('Access-Control-Allow-Origin', '*');
      yield next;
    };
  }

}

const handler = new CorsHandler();

module.exports = handler;
