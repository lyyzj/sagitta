"use strict";

const Joi = require('joi');

const ApiSpec = [
  {
    name:   'user-fetch-single',
    method: 'get',
    uri:    '/user/:id',
    schema: `Joi.object().keys({
      id: Joi.number().required()
    })`
  }
];


module.exports = ApiSpec;