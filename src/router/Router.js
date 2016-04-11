"use strict";

const libPath = require('path');
const libFsp  = require('fs-promise');

const Router = require('koa-router');

const joi         = require('joi');
const joiValidate = require('../utility/JoiValidate');

class RouterLoader {

  constructor() {
    this.instance = null;

    this.schema = joi.object().keys({
      path:   joi.string().required(),
      apiVer: joi.string().required()
    });
  }

  initialize(conf) {
    let validated = {};
    return new Promise((resolve, reject) => {
      joiValidate(conf, this.schema).then((_) => {
        validated = _;
        return libFsp.stat(validated.path);
      }).then((stats) => {
        if (!stats.isDirectory()) {
          throw new Error('[RouterLoader] conf.path have to be a valid path!');
        } else if (!libPath.isAbsolute(validated.path)) {
          throw new Error('[RouterLoader] conf.path have to be an absolute path!');
        }
        return libFsp.readdir(validated.path);
      }).then((files) => {
        this.instance = new Router({
          prefix: '/api/' + validated.apiVer
        });
        for (let file of files) {
          if (file === 'spec.js') {
            continue; // spec definition, skip it
          }
          let api = require(libPath.join(validated.path, file));
          this.instance[api.method].apply(this.instance, api.register());
        }
        resolve();
      }).catch(err => reject(err));
    });
  }

}

const router = new RouterLoader();

module.exports = router;