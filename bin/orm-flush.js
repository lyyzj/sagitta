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
      identify:   joi.string().required(),
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

      if (targetOrms.length > 0 && targetOrms.indexOf(ormSpec.identify) === -1) {
        continue; // has target orms & not included, skip it
      }

      this.process(path, ormSpec);
    }
  }

  process(path, spec) {
    Promise.resolve(debug('[OrmGenerator] Processing %s ...', spec.identify)).then(() => {
      return joiValidate(spec, this.schema);
    }).then((validatedSpec) => {
      let params = {
        name:           validatedSpec.identify,
        shardKey:       validatedSpec.shardKey,
        camelCaseName:  OrmGenerator.camelCase(validatedSpec.identify)
      };

      let specCopy = Object.assign({}, validatedSpec);
      delete specCopy['shardKey'];
      params['schema'] = JSON.stringify(specCopy);

      console.log(params);

      return libFsp.writeFile(libPath.join(path, validatedSpec.identify + '-model.js'), this.template(params));
    }).catch((err) => {
      debug('[OrmGenerator] Failed in processing %s: %j', spec.identify, err);
    });
  }

  static camelCase(s) {
    return (s||'').toLowerCase().replace(/(\b|-)\w/g, (m) => {
      return m.toUpperCase().replace(/-/,'');
    });
  }

}

const TemplateStr = `"use strict";

const OrmHandler = require('sagitta').Instance.orm;
const OrmModel = require('sagitta').Orm.OrmModel;

class {{{camelCaseName}}}Model extends OrmModel {

  constructor() {
    this.name        = '{{{name}}}';
    this.instance    = OrmHandler.getWaterlineModel(this.name);
    this.identifyKey = '{{{shardKey}}}';
    this.schema      = {{{schema}}};
  }

}

const model = new UserModel();

module.exports = model;`;

const generator = new OrmGenerator();

module.exports = generator;
