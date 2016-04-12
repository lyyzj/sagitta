"use strict";

const libFsp  = require('fs-promise');
const libPath = require('path');

process.env.DEBUG = '*';

const debug       = require('debug')('orm-flush');
const handlebars  = require('handlebars');

const joi         = require('joi');
const joiValidate = require('../src/utility/JoiValidate');

class ClientApiGenerator {

  constructor() {
    this.schema = joi.object().keys({
      host: joi.string().required(),
      protocol: joi.string().required().valid(['http', 'https'])
    });
    this.output = TemplateHead; // output client code aggregation
    this.template = handlebars.compile(TemplateStr);
  }

  run(path, outputPath, options) {
    debug('[ClientApiGenerator] Start to process orm skeleton generation ...');

    // ensure path
    if (!libFsp.statSync(path).isDirectory()) {
      debug('[ClientApiGenerator] Path specified shall be a valid path: %s', path); return;
    } else if (!libPath.isAbsolute(path)) {
      debug('[ClientApiGenerator] Path specified shall be an absolute path: %s', path); return;
    } else if (!libFsp.statSync(outputPath).isDirectory()) {
      debug('[ClientApiGenerator] OutputPath specified shall be a valid path: %s', path); return;
    } else if (!libPath.isAbsolute(outputPath)) {
      debug('[ClientApiGenerator] OutputPath specified shall be an absolute path: %s', path); return;
    }

    // load api spec
    libFsp.writeFileSync(libPath.join(outputPath, 'sagitta-client.js'), output);
  }

  process(path, options) {
    // load api spec
    let spec = require(libPath.join(path, 'spec.js'));

    while (true) {
      let ormSpec = spec.shift();
      if (!ormSpec) {
        break;
      }

      output += this.process(host, ormSpec);
    }

    return new Promise((resolve, reject) => {
      Promise.resolve(debug('[ClientApiGenerator] Validate client generation options ...')).then(() => {
        return joiValidate(options, this.schema);
      }).then((validatedOptioins) => {

      }).catch((err) => {
        console.log(err.stack);
        reject(reject);
      });
    });
  }

  processSingle(spec, options) {

  }

  static camelCase(s) {
    return (s||'').toLowerCase().replace(/(\b|-)\w/g, (m) => {
      return m.toUpperCase().replace(/-/,'');
    });
  }

  static lcFirst(s) {
    return s.charAt(0).toLowerCase() + s.slice(1);
  }

}

function test() {

}

const TemplateHead = `"use strict";

const bluebird = require('bluebird');
const request = blurbird.promisifyAll(require('request'));

`;

const TemplateStr = ``;

const generator = new ClientApiGenerator();

module.exports = generator;
