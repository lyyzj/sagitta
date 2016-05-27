"use strict";

const libFsp  = require('fs-promise');
const libPath = require('path');

process.env.DEBUG = '*';

const debug       = require('debug')('api-flush');
const handlebars  = require('handlebars');

const joi         = require('joi');
const joiValidate = require('../src/utility/JoiValidate');

class ApiGenerator {

  constructor() {
    this.schema = joi.object().keys({
      name:       joi.string().required().regex(/^[a-z\-0-9]+$/),
      method:     joi.string().required().valid(['get', 'post', 'put', 'delete', 'patch']),
      uri:        joi.string().required(),
      type:       joi.string().optional().default('application/json; charset=utf-8'),
      enableJWT:  joi.boolean().optional().default(false),
      schema:     joi.string().required()
    });

    this.template = handlebars.compile(TemplateStr);
  }

  run(path, targetApis) {
    debug('[ApiGenerator] Start to process api skeleton generation ...');

    // ensure path
    if (!libFsp.statSync(path).isDirectory()) {
      debug('[ApiGenerator] Path specified shall be a valid path: %s', path); return;
    } else if (!libPath.isAbsolute(path)) {
      debug('[ApiGenerator] Path specified shall be an absolute path: %s', path); return;
    }

    // load api spec
    let spec = require(libPath.join(path, 'spec.js'));

    // validate target apis
    if (typeof targetApis === 'string') {
      targetApis = [targetApis];
    } else if (Array.isArray(targetApis)) {
      // do nothing
    } else {
      targetApis = [];
    }

    while (true) {
      let apiSpec = spec.shift();
      if (!apiSpec) {
        break;
      }

      if (targetApis.length > 0 && targetApis.indexOf(apiSpec.name) === -1) {
        continue; // has target apis & not included, skip it
      }

      this.process(path, apiSpec);
    }
  }

  process(path, spec) {
    Promise.resolve(debug('[ApiGenerator] Processing %s ...', spec.name)).then(() => {
      return joiValidate(spec, this.schema, { allowUnknown: true });
    }).then((validatedSpec) => {
      // define api file name
      let fileNamePrefix = validatedSpec.method + "-" + validatedSpec.name;
      // check enableJWT property
      if (validatedSpec['enableJWT'] === true) {
        validatedSpec['checkJWT'] = `
  if (api.enableJWT === true) {
    let jwtSecret = require('sagitta').Instance.app.conf.app.jwtSecret || undefined;
    let authorizations = ctx.headers.authorization.split(" ");
    let decodeToken = require('sagitta').Utility.JWT.verify(authorizations[1], jwtSecret);
    if (decodeToken === false) {
      ctx.throw("no access", 403);
    }
  }
`;
      }
      validatedSpec['camelCaseName'] = ApiGenerator.camelCase(validatedSpec.name);
      let _this = this;
      libFsp.readFile(libPath.join(path, fileNamePrefix + '.js'), 'utf8'). then(function(contents) {
        let contentsArr = contents.split("\n");
        let writeFlag = 1;
        for (var i in contentsArr) {
          if (contentsArr[i].indexOf('noCompile')>0) {
            writeFlag = 0;
          }
        }
        if (writeFlag === 1) {
          return libFsp.writeFile(libPath.join(path, fileNamePrefix + '.js'), _this.template(validatedSpec));
        }
      })
      .catch(function(err) {
        // if file not exist
        if (err.errno == -2) {
          return libFsp.writeFile(libPath.join(path, fileNamePrefix + '.js'), _this.template(validatedSpec));
        }
      });
    }).catch((err) => {
      debug('[ApiGenerator] Failed in processing %s: %j', spec.name, err);
    });
  }

  static camelCase(s) {
    return (s||'').toLowerCase().replace(/(\b|-)\w/g, (m) => {
      return m.toUpperCase().replace(/-/,'');
    });
  }

}

const TemplateStr = `'use strict';

const joi         = require('sagitta').Utility.joi;
const joiValidate = require('sagitta').Utility.joiValidate;

class {{{camelCaseName}}} {

  constructor() {
    this.method     = '{{{method}}}';
    this.uri        = '{{{uri}}}';
    this.type       = '{{{type}}}';
    this.enableJWT  = {{{enableJWT}}}; 
    this.schema     = {{{schema}}};
  }

  register() {
    return [this.uri, validate, execute];
  }

}

function *validate(next) {
  let aggregatedParams = Object.assign({}, this.params, this.query, this.request.body);
  {{{checkJWT}}}
  yield joiValidate(aggregatedParams, api.schema, { allowUnknown: true });
  yield next;
}

function *execute(next) {
}

const api = new {{{camelCaseName}}}();

module.exports = api;`;

const generator = new ApiGenerator();

module.exports = generator;
