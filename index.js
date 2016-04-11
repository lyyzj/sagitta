"use strict";

const app = require('./src/app');

module.exports = {
  Instance: {
    app:      app,
    cache:    app.cache,
    config:   app.config,
    logger:   app.logger,
    orm:      app.orm,
    router:   app.router,
    template: app.template
  },
  Utility: {
    joiValidate:  require('./src/utility/JoiValidate'),
    promiseRetry: require('./src/utility/PromiseRetry')
  },
  Orm: {
    OrmModel: require('./src/orm/OrmModel')
  }
};