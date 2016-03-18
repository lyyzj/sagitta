"use strict";

const Joi = require('joi');
const bluebird = require('bluebird');

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
}

const api = new UserFetchSingle();

module.exports = api;