"use strict";

const libPath = require('path');
const libFsp  = require('fs-promise');
const async   = require('async'); 

const Router = require('koa-router');

const joi         = require('joi');
const joiValidate = require('../utility/JoiValidate');

class RouterLoader {

  constructor() {
    this.instance = null;
    this.schema = joi.array().min(1).required();
    this.subSchema = joi.object().keys({
      path:   joi.string().required(),
      prefix: joi.string().optional()
    });
  }

  initialize(conf) {
    let _this = this;
    return new Promise((resolve, reject) => {
      _this.instance = new Router();
      for (var i in conf) {
        let subConf = conf[i];
        joiValidate(subConf, _this.subSchema, { allowUnknown: true }).then((_) => {
          return libFsp.stat(subConf.path);
        }).then((stats) => {
          if (!stats.isDirectory()) {
            throw new Error('[RouterLoader] conf.path have to be a valid path!');
          } else if (!libPath.isAbsolute(subConf.path)) {
            throw new Error('[RouterLoader] conf.path have to be an absolute path!');
          }
          return libFsp.readdir(subConf.path);
        }).then((files) => {
          for (let file of files) {
            if (file === 'spec.js') {
              continue; // spec definition, skip it
            }
            let scriptPath = libPath.join(subConf.path, file);
            let api = require(libPath.join(subConf.path, file));
            let funcs = api.register();
            if (subConf.prefix === undefined) {
              subConf.prefix = "";
            }
            funcs[0] = subConf.prefix + funcs[0];
            _this.instance[api.method].apply(_this.instance, funcs);
          }
        }).catch(err => {
            console.log(err);
            reject(err)
        });
      }
      resolve();
    });
  }

}

const router = new RouterLoader();

module.exports = router;
