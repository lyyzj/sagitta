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
  Bin: {
    apiGenerator: require('./bin/api-flush'),
    ormGenerator: require('./bin/orm-flush')
  },
  Orm: {
    OrmModel: require('./src/orm/OrmModel')
  },
  Utility: {
    joiValidate:      require('./src/utility/JoiValidate'),
    promisedRequest:  require('./src/utility/PromisedRequest'),
    promiseRetry:     require('./src/utility/PromiseRetry')
  }
};