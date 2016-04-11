"use strict";

const cacheInstance = require('./cache/Cache');
const configInstance = require('./config/Config');
const loggerInstance = require('./logger/Logger');
const ormInstance = require('./orm/OrmHandler');
const routerInstance = require('./router/Router');
const templateInstance = require('./template/Handlebars');

class App {

  constructor() {
    this.cache = cacheInstance;
    this.config = configInstance;
    this.logger = loggerInstance;
    this.orm = ormInstance;
    this.router = routerInstance;
    this.template = templateInstance;

    this.initialized = false;
  }

  initialize() {

  }

  start() {

  }

}

module.exports = new App();