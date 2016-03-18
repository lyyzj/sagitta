#!/usr/bin/env node
"use strict";

const libFsp  = require('fs-promise');
const libPath = require('path');

const env     = require(libPath.join(__dirname, '..', 'config', 'env.json'))['env'];
const appConf = require(libPath.join(__dirname, '..', 'config', 'app.' + env + '.json'));

const apiPath = libPath.join(__dirname, '..', 'app', 'api', appConf['api']);
const spec    = require(libPath.join(apiPath, 'spec.js'));

process.env.DEBUG = '*';

const debug       = require('debug')('api-flush');
const handlebars  = require('handlebars');

const Joi       = require('joi');
const bluebird  = require('bluebird');

class Generator {

  constructor() {
    this.schema = Joi.object().keys({
      name:   Joi.string().required().regex(/^[a-z\-]+$/),
      method: Joi.string().required().valid(['get', 'post', 'put', 'delete', 'patch']),
      uri:    Joi.string().required(),
      type:   Joi.string().optional().default('application/json; charset=utf-8'),
      schema: Joi.string().required()
    });

    this.validate = bluebird.promisify(Joi.validate);

    this.template = handlebars.compile(templateStr);

    this.targetApis = process.argv.slice(2); // just flush target apis
  }

  run() {
    debug('Start to process api skeleton generation ...');

    while (true) {
      let apiSpec = spec.shift();
      if (!apiSpec) {
        break;
      }

      if (this.targetApis.length > 0 && this.targetApis.indexOf(apiSpec.name) === -1) {
        continue; // has target apis & not included, skip it
      }

      this.process(apiSpec);
    }
  }

  process(spec) {
    Promise.resolve(debug('Processing %s ...', spec.name)).then(() => {
      return this.validate(spec, this.schema);
    }).then((validatedSpec) => {
      validatedSpec['camelCaseName'] = this.camelCase(validatedSpec.name);
      let outputSkeleton = this.template(validatedSpec);
      return libFsp.writeFile(libPath.join(apiPath, validatedSpec.name + '.js'), outputSkeleton);
    }).catch((err) => {
      debug('Failed in processing %s: %j', spec.name, err);
    });
  }

  camelCase(s) {
    return (s||'').toLowerCase().replace(/(\b|-)\w/g, (m) => {
      return m.toUpperCase().replace(/-/,'');
    });
  }

}

const templateStr = `"use strict";

const Joi = require('joi');
const bluebird = require('bluebird');

class {{{camelCaseName}}} {

  constructor() {
    this.method = '{{{method}}}';
    this.uri    = '{{{uri}}}';
    this.type   = '{{{type}}}';
    this.schema = {{{schema}}};
    
    this.validate = bluebird.promisify(Joi.validate);
  }

  register() {
    return [this.uri, validate, execute];
  }

}

function *validate(next) {
  let aggregatedParams = Object.assign({}, this.params, this.query, this.request.body);
  yield api.validate(aggregatedParams, api.schema);
  yield next;
}

function *execute(next) {
}

const api = new {{{camelCaseName}}}();

module.exports = api;`;

const generator = new Generator();

generator.run();