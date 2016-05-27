'use strict';

const debug       = require('debug')('jwt-use');
const jwt = require('koa-jwt');

class JWT {

  /**
   * Provide a koa middleware register function
   */
  register(jwtSecret) {
    return function *JWT(next) {
      debug("[jwt] koa init jwt", jwtSecret);
      jwt({secret: jwtSecret});
    };
  }

}

const instance = new JWT();

module.exports = instance;
