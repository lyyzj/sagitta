"use strict";

const Joi = require('joi');
const bluebird = require('bluebird');

const logger = require('../../../src/logger/Logger.js');

class UserFetchSingle {

  constructor() {
    this.method = 'get';
    this.uri    = '/user/:id';
    this.type   = 'application/json; charset=utf-8';
    this.schema = Joi.object().keys({
      id: Joi.number().required()
    });
    
    this.validate = bluebird.promisify(Joi.validate);
  }

  register() {
    return [this.uri, validate, execute];
  }

}

function *validate(next) {
  let aggregatedParams = Object.assign({}, this.params, this.query, this.request.body);
  yield api.validate(aggregatedParams, api.schema);
  yield next;
}

function *execute(next) {
  this.body = this.params.id;
  logger.verbose(this.reqId, 'verbose');
  logger.debug(this.reqId, 'debug');
  logger.info(this.reqId, 'info');
  logger.notice(this.reqId, 'notice');
  logger.warn(this.reqId, 'warn');
  logger.error(this.reqId, 'error');
}

const api = new UserFetchSingle();

module.exports = api;