"use strict";

const cache   = require('../cache/Cache.js');
const logger  = require('../logger/Logger.js');

class OrmModel {

  constructor() {
    this.name         = '';   // model name
    this.instance     = null; // waterline model instance
    this.identifyKey  = '';   // model identify attribute name
    this.schema       = {};   // waterline model definition schema object
  }

  register() {
    this.checkAfterChangeEventDefinition('afterCreate');
    this.checkAfterChangeEventDefinition('afterUpdate');
    this.checkAfterChangeEventDefinition('afterDestroy');

    return this.schema;
  }

  find(identify, query) {
    let cacheHit = false;
    let queryString = JSON.encode(query);

    return new Promise((resolve, reject) => {
      cache.getModelHash(this.name, identify, queryString).then((data) => {
        if (data) {
          cacheHit = true;
          return Promise.resolve(data);
        } else {
          return this.instance.find(query);
        }
      }).then((data) => {
        if (data && !cacheHit) {
          return cache.setModelHash(this.name, identify, queryString);
        } else {
          return Promise.resolve(data);
        }
      }).then((data) => {
        resolve(data);
      }).catch((err) => {
        reject(err);
      });
    });
  }

  getIdentify(values) {
    if (Array.isArray(values)) {
      return values[0][this.identifyKey];
    } else {
      return values[this.identifyKey];
    }
  }

  checkAfterChangeEventDefinition(eventName) {
    if (!this.schema.hasOwnProperty(eventName)) {
      this.schema[eventName] = this[eventName];
    }
  }

  afterCreate(createdValues, next) {
    this.removeCacheAfterRecordChanged(createdValues, next);
  }

  afterUpdate(updatedRecord, next) {
    this.removeCacheAfterRecordChanged(updatedRecord, next);
  }

  afterDestroy(deletedRecord, next) {
    this.removeCacheAfterRecordChanged(deletedRecord, next);
  }

  removeCacheAfterRecordChanged(data, next) {
    cache.removeModelHash(this.name, this.getIdentify(data))
      .then(_ => next())
      .catch((err) => {
        logger.error(err);
        next();
      });
  }

}

module.exports = OrmModel;