"use strict";

const libPath = require('path');
const libFsp = require('fs-promise');

const Router = require('koa-router');

const env = require(libPath.join(__dirname, '..', '..', 'config', 'env.json'))['env'];
const appConf = require(libPath.join(__dirname, '..', '..', 'config', 'app.' + env + '.json'));

class RouterLoader {

  constructor() {
    this.router = new Router({
      prefix: '/api/' + appConf['api']
    });

    this.apiPath = libPath.join(__dirname, '..', '..', 'app', 'api', appConf['api']);

    let files = libFsp.readdirSync(this.apiPath);
    for (let file of files) {
      if (file === 'spec.js') {
        continue; // spec definition, skip it
      }
      let api = require(libPath.join(this.apiPath, file));
      this.router[api.method].apply(this.router, api.register());
    }
  }

}

module.exports = new RouterLoader();