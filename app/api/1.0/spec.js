"use strict";

const joi = require('joi');

const ApiSpec = [
  {
    name:   'user-fetch-single',
    method: 'get',
    uri:    '/user/:id',
    schema: `joi.object().keys({
      id: joi.number().integer().required()
    })`
  }
];


module.exports = ApiSpec;