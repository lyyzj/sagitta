"use strict";

const Waterline = require('waterline');

const joi = require('joi');

class OrmHandler {

  constructor() {
    this.waterline = new Waterline();
    this.collections = {};

    this.confSchema = joi.object().keys({
      id: joi.number().required()
    });
  }

  initialize(conf) {
    
  }

  getWaterlineModel(modelName) {
    if (this.collections.hasOwnProperty(modelName)) {
      return this.collections[modelName];
    } else {
      throw new Error(`Unknown waterline model: ${modelName}`);
    }
  }

}

const orm = new OrmHandler();

module.exports = orm;