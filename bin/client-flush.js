"use strict";

const libFsp  = require('fs-promise');
const libPath = require('path');

process.env.DEBUG = '*';

const debug       = require('debug')('orm-flush');
const handlebars  = require('handlebars');

const joi         = require('joi');
const joiValidate = require('../src/utility/JoiValidate');

const exec = require('eval');

class ClientApiGenerator {

  constructor() {
    this.schema = joi.object().keys({
      host:     joi.string().required(),
      apiVer:   joi.string().required(),
      protocol: joi.string().optional().valid(['http', 'https']).default('http'),
      timeout:  joi.number().integer().optional().default(5000) // 5s
    });
    this.output = TemplateHead; // output client code aggregation
    this.options = {};
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

    new Promise((resolve, reject) => {
      Promise.resolve(debug('[ClientApiGenerator] Validate client generation options ...')).then(() => {
        return joiValidate(options, this.schema);
      }).then((validatedOptioins) => {
        this.options = validatedOptioins;
        return this.process(path);
      }).then((results) => {
        results.forEach((result) => {
          this.output += result;
        });
        libFsp.writeFile(libPath.join(outputPath, 'sagitta-client.js'), this.output + TemplateTail);
      }).then(() => {
        debug('[ClientApiGenerator] All done ...');
      }).catch((err) => {
        console.log(err.stack);
        reject(reject);
      });
    });
  }

  process(path) {
    let spec = require(libPath.join(path, 'spec.js'));
    let queue = [];

    while (true) {
      let ormSpec = spec.shift();
      if (!ormSpec) {
        break;
      }

      queue.push(this.processSingle(ormSpec));
    }

    return Promise.all(queue);
  }

  processSingle(spec) {
    debug('[ClientApiGenerator] Processing: %s', spec.name);
    return new Promise((resolve) => {
      let funcName = ClientApiGenerator.lcFirst(ClientApiGenerator.camelCase(spec.name));

      // parse joi schema, get params info
      let requiredParams = []; // [ paramName, ... ]
      let optionalParams = []; // [ paramName, ... ]
      let schema = exec(handlebars.compile(TemplateJoiSchema)({ schema: spec.schema }), true);
      schema._inner.children.forEach((obj) => {
        let key = obj.key;
        let isRequired = obj.schema._flags.hasOwnProperty('presence') && obj.schema._flags.presence === 'required';
        if (isRequired) {
          requiredParams.push(key);
        } else {
          optionalParams.push(key);
        }
      });

      // generate function params string
      let funcParamsStr = requiredParams.concat(optionalParams).join(', ');

      // generate aggregation params array string
      let aggParamsStr = '';
      let aggParamNames = [];
      requiredParams.concat(optionalParams).forEach((key) => {
        aggParamNames.push(`'${key}'`);
      });
      aggParamsStr = aggParamNames.join(', ');

      let template = '';
      switch (spec.method) {
        case 'get':
          template = TemplateGet;
          break;
        case 'post':
          template = TemplatePost;
          break;
        case 'put':
          template = TemplatePut;
          break;
        case 'delete':
          template = TemplateDelete;
          break;
        case 'patch':
          template = TemplatePatch;
          break;
      }

      resolve(handlebars.compile(template)(Object.assign({
        funcName: funcName,
        requiredParams: requiredParams,
        optionalParams: optionalParams,
        aggParamsStr: aggParamsStr,
        funcParamsStr: funcParamsStr,
        baseUrl: `${this.options.protocol}://${this.options.host}/api/${this.options.apiVer}`
      }, spec, this.options)));
    });
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

const TemplateJoiSchema = `"use strict";
const joi = require('joi');
module.exports = {{{schema}}};
`;
const TemplateHead = `"use strict";

const request = require('sagitta').Utility.promisedRequest;
const SagittaClient = function() {};

`;
const TemplateGet = `SagittaClient.prototype.{{{funcName}}} = function({{{funcParamsStr}}}) {
  var uri = '{{{uri}}}';
  var aggParams = [{{{aggParamsStr}}}];
  aggParams.forEach(function(key, index) {
    var value = arguments[index];
    uri = uri.replace(':' + key, value);
  });
  var url = '{{{baseUrl}}}' + uri;
  return request.getAsync({
    url: url,
    timeout: {{{timeout}}}
  });
};

`;
const TemplatePost = ``;
const TemplatePut = ``;
const TemplateDelete = ``;
const TemplatePatch = ``;
const TemplateTail = `module.exports = new SagittaClient();`;

const generator = new ClientApiGenerator();

generator.run(libPath.join(__dirname, '../app/api/1.0'), __dirname, {
  host: '127.0.0.1:3089',
  apiVer: '1.0'
});

// module.exports = generator;
