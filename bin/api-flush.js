"use strict";

const libFsp  = require('fs-promise');
const libPath = require('path');

process.env.DEBUG = '*';

const debug       = require('debug')('script-flush');
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
      service:    joi.string().optional(),
      schema:     joi.string().required(),
      render:     joi.string().optional(),
    });

    this.template = handlebars.compile(TemplateStr);
  }

  run(path, runType, targets) {
    // runType in  api or page
    runType = runType || 'api';
    if (runType !== 'api' && runType !== 'page') {
      throw new Error('Only automatically generated api or page script!');
    }
    this.actionStr = this.ucFirst(runType) + 'Generator';
    this.runType = runType;
    if (runType === 'page') {
      this.template = handlebars.compile(TemplatePageStr);
    }
    debug('[' + this.actionStr+ '] Start to process '+ runType +' skeleton generation ...');

    // ensure path
    if (!libFsp.statSync(path).isDirectory()) {
      debug('[' + this.actionStr + '] Path specified shall be a valid path: %s', path); return;
    } else if (!libPath.isAbsolute(path)) {
      debug('[' + this.actionStr + '] Path specified shall be an absolute path: %s', path); return;
    }

    // load spec
    let spec = require(libPath.join(path, 'spec.js'));

    // validate target apis
    if (typeof targets === 'string') {
      targets = [targets];
    } else if (Array.isArray(targets)) {
      // do nothing
    } else {
      targets = [];
    }

    while (true) {
      let correspondSpec = spec.shift();
      if (!correspondSpec) {
        break;
      }

      if (targets.length > 0 && targets.indexOf(correspondSpec.name) === -1) {
        continue; // has target  & not included, skip it
      }

      this.process(path, correspondSpec);
    }
  }

  process(path, spec) {
    Promise.resolve(debug('[' + this.actionStr + '] Processing %s ...', spec.name)).then(() => {
      return joiValidate(spec, this.schema, { allowUnknown: true });
    }).then((validatedSpec) => {
      // define api file name
      let fileNamePrefix = validatedSpec.method + "-" + validatedSpec.name;
      // get service object
      let serviceStr = '';
      if (validatedSpec.service !== undefined && validatedSpec.service.length > 0) {
        let serviceObj =  JSON.parse(validatedSpec.service);
        for(let key in serviceObj) {
          let  singleService = " = require('../services/" + key + "/service')";
          // if have one, output one service str
          if (serviceObj[key].length == 1) {
            serviceStr += 'const ' + ApiGenerator.camelCase(serviceObj[key][0]) + 'Service' + singleService;
          } else {
            for(let i in serviceObj[key]) {
              serviceStr += 'const ' + ApiGenerator.camelCase(serviceObj[key][i]) + 'Service' + singleService + '.' + serviceObj[key][i] + '\n';
            }
          }
        }
      }
      validatedSpec['service'] = serviceStr;
      // if runtype is page
      if (this.runType == 'page' && validatedSpec.render === undefined) {
        throw new Error(spec + 'no render schema');
      }
      if (validatedSpec.render !== undefined) {
        validatedSpec['renderStr'] = 'const serverRender = require("' + validatedSpec.render  + '")';
      }
      // when runtype is page and type is default, change type is html
      if (this.runType == 'page' && validatedSpec.type == 'application/json; charset=utf-8') {
        validatedSpec['type'] = 'text/html; charset=utf-8';
      }
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
      debug('[' + this.actionStr + '] Failed in processing %s: %s', spec.name, err);
    });
  }

  ucFirst(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
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
{{{service}}}

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

  // use by server render
  server(params) {
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

const TemplatePageStr = `'use strict';

const joi         = require('sagitta').Utility.joi;
const joiValidate = require('sagitta').Utility.joiValidate;

{{{renderStr}}}

class {{{camelCaseName}}} {

  constructor() {
    this.method     = '{{{method}}}';
    this.uri        = '{{{uri}}}';
    this.type       = '{{{type}}}';
    this.schema     = {{{schema}}};
  }

  register() {
    return [this.uri, validate, execute];
  }

}

function *validate(next) {
  let aggregatedParams = Object.assign({}, this.params, this.query, this.request.body);
  yield joiValidate(aggregatedParams, page.schema, { allowUnknown: true });
  yield next;
}

function *execute(next) {
  let params = Object.assign({}, this.params, this.query, this.request.body);
  serverRender(this, params);
}

const page = new {{{camelCaseName}}}();

module.exports = page;`;

const generator = new ApiGenerator();

module.exports = generator;
