"use strict";

const libFsp  = require('fs-promise');
const libPath = require('path');

const joi         = require('joi');
const joiValidate = require('./utility/JoiValidate');
const debug       = require('debug')('sagitta');

const cacheInstance     = require('./cache/Cache');
const configInstance    = require('./config/Config');
const loggerInstance    = require('./logger/Logger');
const ormInstance       = require('./orm/OrmHandler');
const routerInstance    = require('./router/Router');
const templateInstance  = require('./template/Handlebars');

const koa             = require('koa');
const koaInstance     = koa();
const koaServe        = require('koa-static');
const koaBodyParser   = require('koa-bodyparser');
const koaQueryString  = require('koa-qs');

const koaMidNotFoundHandler   = require('./middleware/NotFoundHandler');
const koaMidRequestIdHandler  = require('./middleware/RequestIdHandler');
const koaMidRequestTimer      = require('./middleware/RequestTimer');
const koaMidErrorHandler      = require('./middleware/ErrorHandler');

class App {

  constructor() {
    this.cache    = cacheInstance;
    this.config   = configInstance;
    this.logger   = loggerInstance;
    this.orm      = ormInstance;
    this.router   = routerInstance;
    this.template = templateInstance;

    this.app = koaInstance;

    this.conf = {};
    this.initialized = false;
  }

  init(conf) {
    debug('[Sagitta] Start to initialize app ...');

    this.conf = conf;

    // schema definition
    let confSchema = joi.object().keys({
      cache:    this.cache.schema,
      config:   this.config.schema,
      logger:   this.logger.schema,
      orm:      this.orm.schema,
      router:   this.router.schema,
      template: this.template.schema,
      app:      joi.object().keys({
        host:       joi.string().ip().optional(),
        port:       joi.number().integer().min(1).max(65535).optional().default(3000),
        staticPath: joi.string().required()
      }).required()
    });

    // initialization
    return new Promise((resolve, reject) => {
      joiValidate(conf, confSchema).then((_) => {
        let initQueue = [
          this.cache.initialize(conf.cache),
          this.config.initialize(conf.config),
          this.logger.initialize(conf.logger),
          this.orm.initialize(conf.orm),
          this.router.initialize(conf.router),
          this.template.initialize(conf.template)
        ];
        return Promise.all(initQueue);
      }).then((_) => {
        return this.initialize();
      }).then((_) => {
        this.initialized = true;
        debug('[Sagitta] Initialization done!');
        resolve(_);
      }).catch((err) => {
        debug('[Sagitta] Initialization failed: %j', err);
        reject(err);
      });
    });
  }

  initialize() {
    return new Promise((resolve, reject) => {
      libFsp.stat(this.conf.app.staticPath).then((stats) => {
        if (!stats.isDirectory()) {
          throw new Error('[App] conf.app.staticPath have to be a valid path!');
        } else if (!libPath.isAbsolute(this.conf.app.staticPath)) {
          throw new Error('[App] conf.app.staticPath have to be an absolute path!');
        }

        koaQueryString(this.app, 'extended');             // add query string parser
        this.app.use(koaMidErrorHandler.register());      // error
        this.app.use(koaServe(this.conf.app.staticPath)); // static files serving
        this.app.use(koaMidRequestIdHandler.register());  // add request id in app
        this.app.use(koaMidRequestTimer.register());      // request timer
        this.app.use(koaBodyParser());                    // post body parser
        this.app.use(this.router.instance.routes());      // router
        this.app.use(koaMidNotFoundHandler.register());   // 404 handler

        resolve();
      }).catch((err) => reject(err));
    });
  }

  start() {
    if (!this.initialized) {
      debug('[Sagitta] Initialization not done yet!');
      return;
    }

    if (this.conf.app.hasOwnProperty('host')) {
      this.app.listen(this.conf.app.port, this.conf.app.host);
      debug(`[Sagitta] App listening on: ${this.conf.app.host}:${this.conf.app.port}`);
    } else {
      this.app.listen(this.conf.app.port);
      debug(`[Sagitta] App listening on: ${this.conf.app.port}`);
    }
  }

}

module.exports = new App();
