"use strict";

const Waterline = require('waterline');

const joi = require('joi');

class OrmHandler {

  constructor() {
    this.waterline = new Waterline();
    this.collections = {};
  }

  initialize(conf, path) {
    let conf = {
      adapters: {
        'memory': require('sails-memory')
      },
      connections: {
        default: {
          adapter: 'memory'
        }
      }
    };

    // loop load waterline models
    this.waterline.loadCollection(
      Waterline.Collection.extend(
        require('../../app/orm/user.js').register()
      )
    );

    return new Promise((resolve, reject) => {
      this.waterline.initialize(conf, (err, instance) => {
        if (err) {
          reject(err);
        } else {
          this.collections = instance.collections;
          resolve(instance);
        }
      })
    });
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