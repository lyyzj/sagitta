"use strict";

const libFsp  = require('fs-promise');
const libPath = require('path');

process.env.DEBUG = '*';

const debug       = require('debug')('server-flush');
const handlebars  = require('handlebars');

const joi         = require('joi');
const joiValidate = require('../src/utility/JoiValidate');

const exec = require('eval');

class ServerApiGenerator {

  constructor() {
    this.schema = joi.object().keys({
      rootPath:  joi.string().required(),
    });
    this.output = TemplateHead; // output client code aggregation
    this.options = {};
  }

  run(path, outputPath, options) {
    debug('[ServerApiGenerator] Start to process client api skeleton generation ...');

    // ensure path
    if (!libFsp.statSync(path).isDirectory()) {
      debug('[ServerApiGenerator] Path specified shall be a valid path: %s', path); return;
    } else if (!libPath.isAbsolute(path)) {
      debug('[ServerApiGenerator] Path specified shall be an absolute path: %s', path); return;
    } else if (!libFsp.statSync(outputPath).isDirectory()) {
      debug('[ServerApiGenerator] OutputPath specified shall be a valid path: %s', path); return;
    } else if (!libPath.isAbsolute(outputPath)) {
      debug('[ServerApiGenerator] OutputPath specified shall be an absolute path: %s', path); return;
    }

    new Promise((resolve, reject) => {
      Promise.resolve(debug('[ServerApiGenerator] Validate client generation options ...')).then(() => {
        return joiValidate(options, this.schema, { allowUnknown: true });
      }).then((validatedOptioins) => {
        this.options = validatedOptioins;
        return this.process(path);
      }).then((results) => {
        results.forEach((result) => {
          this.output += result;
        });
        libFsp.writeFile(libPath.join(outputPath, 'sagitta-server.js'), this.output + TemplateTail);
      }).then(() => {
        debug('[ServerApiGenerator] All done ...');
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
    debug('[ServerApiGenerator] Processing: %s', spec.name);
    return new Promise((resolve) => {
      let funcName = ServerApiGenerator.lcFirst(ServerApiGenerator.camelCase(spec.name));
      let fileName = "'" + libPath.join(this.options['rootPath'], "app", "api", spec.method + "-" + spec.name) + "'";

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
      // enable JWT
      let enableJWT = spec.enableJWT || false;
      // add token param
      if (enableJWT === true) {
        if (funcParamsStr != '') {
          funcParamsStr += ", token";
        } else {
          funcParamsStr = "token";
        }
        if (aggParamsStr == "''") {
          aggParamsStr  = "'token'";
        } else {
          aggParamsStr  += ", 'token'";
        }
      }

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
        enableJWT:enableJWT,
        fileName:fileName,
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

var SagittaServer = function() {};

SagittaServer.prototype.callFunc = function (options) {
  var class = require(options.fileName);
  var params = options.data;
  var res = {
    response: {}, 
    statusText: "", 
    statusCode: 200
  };

  return new Promise(function (resolve, reject){
    class.server(params)
    .then(function(data) {
      res.response = data;
      resolve(res);
    })
    .catch(function(err) {
      res.statusCode = 500;
      reject(res);
    }); 
  });
};

SagittaServer.prototype.handleParams = function (params, aggParams, requiredParams) {
  var data = {};

  // replace ":param" in uri
  aggParams.forEach(function(key, index) {
    var value = params[index];
    if (typeof value === 'undefined') {
      return;
    }
    if (requiredParams.indexOf(key) >= 0 && (value === '' || value === undefined)) {
      throw new Error('Param ' + key + ' is required!');
    }
    // pass object
    data[key] = value;
  });

  return data;
}
`;

const TemplateGet = `SagittaServer.prototype.{{{funcName}}} = function({{{funcParamsStr}}}) {
  var _this = this;
  var aggParams = [{{{aggParamsStr}}}];
  var requiredParams = [{{{requiredParamsStr}}}];

  var data = null;
  try {
    data = _this.handleParams(arguments, aggParams, requiredParams)
  } catch (err) {
    return Promise.reject(err);
  }

  return new Promise(function(resolve, reject) {
    _this.callFunc({
      fileName:     {{{fileName}}},
      data:         data
    }).then(function(res) {
      resolve(res);
    }).catch(function(err) {
      reject(err);
    }); 
  });
};

`;
const TemplatePost  = `SagittaServer.prototype.{{{funcName}}} = function({{{funcParamsStr}}}) {
};

`;
const TemplatePut  = `SagittaServer.prototype.{{{funcName}}} = function({{{funcParamsStr}}}) {
};

`;
const TemplateDelete  = `SagittaServer.prototype.{{{funcName}}} = function({{{funcParamsStr}}}) {
};

`;
const TemplatePatch   = `SagittaServer.prototype.{{{funcName}}} = function({{{funcParamsStr}}}) {
};

`;
const TemplateTail = `module.exports = new SagittaServer();`;

const generator = new ServerApiGenerator();

module.exports = generator;
