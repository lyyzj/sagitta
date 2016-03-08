#!/usr/bin/env node
"use strict";

const libFsp = require('fs-promise');
const libPath = require('path');
const libUtil = require('util');

const env = require(libPath.join(__dirname, '..', 'config', 'env.json'))['env'];
const appConf = require(libPath.join(__dirname, '..', 'config', 'app.' + env + '.json'));

const apiPath = libPath.join(__dirname, '..', 'app', 'api', appConf['api']);
const spec = require(libPath.join(apiPath, 'spec.js'));

process.env.DEBUG = '*';

const debug = require('debug')('api-flush');
const validator = require('validator');
const handlebars = require('handlebars');

class Generator {

  constructor() {
    this.requiredKeys = [
      'name', 'method', 'uri'
    ];
    this.optionalKeys = [
      { name: 'type', default: 'application/json; charset=utf-8' }
    ];
    this.template = handlebars.compile(templateStr);
    this.targetApis = process.argv.slice(2); // just flush target apis
  }

  run() {
    debug('Start to process api skeleton generation ...');
    for (let apiSpec of spec) {
      if (this.targetApis.length > 0 && this.targetApis.indexOf(apiSpec.name) === -1) {
        continue; // has target apis & not included, skip it
      }

      debug('Processing %s ...', apiSpec.name);
      let checkedSpec = this.check(apiSpec);
      checkedSpec['camelCaseName'] = this.camelCase(checkedSpec.name);
      let outputSkeleton = this.template(checkedSpec);
      libFsp.writeFileSync(libPath.join(apiPath, checkedSpec.name + '.js'), outputSkeleton);
    }
  }

  check(spec) {
    if (typeof spec !== 'object') {
      throw new Error('Spec check: Invalid spec data ...');
    }
    for (let requiredKey of this.requiredKeys) {
      if (!spec.hasOwnProperty(requiredKey)) {
        throw new Error(libUtil.format('Spec check: Missing required key: %s', requiredKey));
      }
    }
    for (let optionalKey of this.optionalKeys) {
      if (!spec.hasOwnProperty(optionalKey.name) || spec[optionalKey.name] === '' || spec[optionalKey.name] === null) {
        spec[optionalKey.name] = optionalKey.default; // set default value
      }
    }

    return spec;
  }

  camelCase(s) {
    return (s||'').toLowerCase().replace(/(\b|-)\w/g, (m) => {
      return m.toUpperCase().replace(/-/,'');
    });
  }

}

const templateStr = `"use strict";

const validator = require('validator');

class {{{camelCaseName}}} {

  constructor() {
    this.method = '{{{method}}}';
    this.uri    = '{{{uri}}}';
    this.type   = '{{{type}}}';
  }

  register() {
    return [this.uri, validate, execute];
  }

}

function *validate(next) {
  yield next;
}

function *execute(next) {
}

const api = new {{{camelCaseName}}}();

module.exports = api;`;

const generator = new Generator();

generator.run();