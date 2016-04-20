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
    debug('[ClientApiGenerator] Start to process client api skeleton generation ...');

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
        return joiValidate(options, this.schema, { allowUnknown: true });
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
      let aggParamsStr = "'" + requiredParams.concat(optionalParams).join("', '") + "'";

      let requiredParamsStr = "'" + requiredParams.join("', '") + "'";

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
        requiredParamsStr: requiredParamsStr,
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

var request = require('sagitta').Utility.promisedRequest;
var _ = require('sagitta').Utility.underscore;
var SagittaClient = function() {};

function handleParams(uri, params, aggParams, requiredParams) {
  //define return param
  var formData = {};
  var retData = {};
  var diffStr = '';
  var collectRequire = [];
  aggParams.forEach(function(key, index) {
    var value = params[index];
    if (typeof value !== 'undefined') {
        if (_.indexOf(requiredParams,key) >= 0 && value != '') {
          collectRequire.push(key);
        }
        // if in uri 
        if (uri.match(':' + key) !== null) {
            uri = uri.replace(':' + key, value);
        } else {
            Object.defineProperty(formData, key, {
                value: value,
                writable: true,
                enumerable: true,
                configurable: true
            }); 
        }
    }
  });
  diffStr = diffParams(requiredParams, collectRequire);
  Object.defineProperties(retData, {
        "formData" : {
            value: formData,
            writable:true,
            enumerable:true,
            configurable:true
        }, 
        "uri" : {
            value: uri,
            writable:true,
            enumerable:true,
            configurable:true
        }, 
        "diffStr" : {
            value: diffStr,
            writable:true,
            enumerable:true,
            configurable:true
        }
    });

  return retData;
}

function diffParams(requiredParams, compareParams) {
  var diffParams = _.difference(requiredParams, compareParams);
  var missingStr = "";
  if (diffParams.length > 0) { 
    for(var i in diffParams) {
        missingStr += diffParams[i] + ",";
    }
  }

  return missingStr;
}

`;
const TemplateGet = `SagittaClient.prototype.{{{funcName}}} = function({{{funcParamsStr}}}) {
  var uri = '{{{uri}}}';
  var aggParams = [{{{aggParamsStr}}}];
  var params = arguments;
  //add check required param
  var requiredParams = [{{{requiredParamsStr}}}];
  var retData = handleParams(uri,params, aggParams, requiredParams);

  if (retData.diffStr != ''){
    return Promise.reject(retData.diffStr + " params is missing");
  }

  var url = '{{{baseUrl}}}' + retData.uri;
  return request.getAsync({
    url: url,
    timeout: {{{timeout}}}
  });
};

`;
const TemplatePost  = `SagittaClient.prototype.{{{funcName}}} = function({{{funcParamsStr}}}) {
  var uri = '{{{uri}}}';
  var aggParams = [{{{aggParamsStr}}}];
  var params = arguments;
  //add check required param
  var requiredParams = [{{{requiredParamsStr}}}];
  var retData = handleParams(uri,params, aggParams, requiredParams);

  if (retData.diffStr != ''){
    return Promise.reject(retData.diffStr + " params is missing");
  }

  var url = '{{{baseUrl}}}' + retData.uri;

  return request.postAsync({
    url: url,
    body: retData.formData,
    json: true,
    timeout: {{{timeout}}}
  });
};

`;
const TemplatePut  = `SagittaClient.prototype.{{{funcName}}} = function({{{funcParamsStr}}}) {
  var uri = '{{{uri}}}';
  var aggParams = [{{{aggParamsStr}}}];
  var params = arguments;
  //add check required param
  var requiredParams = [{{{requiredParamsStr}}}];
  var retData = handleParams(uri,params, aggParams, requiredParams);

  if (retData.diffStr != ''){
    return Promise.reject(retData.diffStr + " params is missing");
  }

  var url = '{{{baseUrl}}}' + retData.uri;
  return request.putAsync({
    url: url,
    body: retData.formData,
    json: true,
    timeout: {{{timeout}}}
  });
};

`;
const TemplateDelete  = `SagittaClient.prototype.{{{funcName}}} = function({{{funcParamsStr}}}) {
  var uri = '{{{uri}}}';
  var aggParams = [{{{aggParamsStr}}}];
  var params = arguments;
  //add check required param
  var requiredParams = [{{{requiredParamsStr}}}];
  var retData = handleParams(uri,params, aggParams, requiredParams);

  if (retData.diffStr != ''){
    return Promise.reject(retData.diffStr + " params is missing");
  }

  var url = '{{{baseUrl}}}' + retData.uri;
  return request.delAsync({
    url: url,
    timeout: {{{timeout}}}
  });
};

`;
const TemplatePatch   = `SagittaClient.prototype.{{{funcName}}} = function({{{funcParamsStr}}}) {
  var uri = '{{{uri}}}';
  var aggParams = [{{{aggParamsStr}}}];
  var params = arguments;
  //add check required param
  var requiredParams = [{{{requiredParamsStr}}}];
  var retData = handleParams(uri,params, aggParams, requiredParams);

  var formData = retData.formData;
  //如果第二个参数为json对象
  if (params.length == 2 && typeof params[1] === 'object') {
     formData = params[1];
  }

  if (retData.diffStr != ''){
    return Promise.reject(retData.diffStr + " params is missing");
  }

  var url = '{{{baseUrl}}}' + retData.uri;
  return request.patchAsync({
    url: url,
    body: formData,
    json: true,
    timeout: {{{timeout}}}
  });
};

`;
const TemplateTail = `module.exports = new SagittaClient();`;

const generator = new ClientApiGenerator();

module.exports = generator;
