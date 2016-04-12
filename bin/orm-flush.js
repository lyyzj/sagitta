"use strict";

const libFsp  = require('fs-promise');
const libPath = require('path');

process.env.DEBUG = '*';

const debug       = require('debug')('orm-flush');
const handlebars  = require('handlebars');

const joi         = require('joi');
const joiValidate = require('../src/utility/JoiValidate');

class OrmGenerator {

  constructor() {
    this.schema = joi.object().keys({
      identity:   joi.string().required(),
      connection: joi.string().required(),
      shardKey:   joi.string().required(),
      attributes: joi.object().required()
    });

    this.template = handlebars.compile(TemplateStr);
  }

  run(path, targetOrms) {
    debug('[OrmGenerator] Start to process orm skeleton generation ...');

    // ensure path
    if (!libFsp.statSync(path).isDirectory()) {
      debug('[OrmGenerator] Path specified shall be a valid path: %s', path); return;
    } else if (!libPath.isAbsolute(path)) {
      debug('[OrmGenerator] Path specified shall be an absolute path: %s', path); return;
    }

    // load api spec
    let spec = require(libPath.join(path, 'spec.js'));

    // validate target apis
    if (typeof targetOrms === 'string') {
      targetOrms = [targetOrms];
    } else if (Array.isArray(targetOrms)) {
      // do nothing
    } else {
      targetOrms = [];
    }

    while (true) {
      let ormSpec = spec.shift();
      if (!ormSpec) {
        break;
      }

      if (targetOrms.length > 0 && targetOrms.indexOf(ormSpec.identity) === -1) {
        continue; // has target orms & not included, skip it
      }

      this.process(path, ormSpec);
    }
  }

  process(path, spec) {
    Promise.resolve(debug('[OrmGenerator] Processing %s ...', spec.identity)).then(() => {
      return joiValidate(spec, this.schema);
    }).then((validatedSpec) => {
      let params = {
        name:           validatedSpec.identity,
        shardKey:       validatedSpec.shardKey,
        camelCaseName:  OrmGenerator.camelCase(validatedSpec.identity)
      };

      let specCopy = Object.assign({}, validatedSpec);
      delete specCopy['shardKey'];
      params['schema'] = JSON.stringify(specCopy, null, 2);

      return libFsp.writeFile(libPath.join(path, validatedSpec.identity + '-model.js'), this.template(params));
    }).catch((err) => {
      debug('[OrmGenerator] Failed in processing %s: %j', spec.identity, err);
    });
  }

  static camelCase(s) {
    return (s||'').toLowerCase().replace(/(\b|-)\w/g, (m) => {
      return m.toUpperCase().replace(/-/,'');
    });
  }

}

const TemplateStr = `"use strict";

const ormInstance = require('sagitta').Instance.orm;
const OrmModel    = require('sagitta').Orm.OrmModel;

class {{{camelCaseName}}}Model extends OrmModel {

  constructor() {
    this.name        = '{{{name}}}';
    this.instance    = ormInstance.getWaterlineModel(this.name);
    this.identifyKey = '{{{shardKey}}}';
    this.schema      = {{{schema}}};
  }

}

const model = new {{{camelCaseName}}}Model();

module.exports = model;`;

const generator = new OrmGenerator();

module.exports = generator;
