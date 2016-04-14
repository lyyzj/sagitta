"use strict";

const orm     = require('./OrmHandler');
const cache   = require('../cache/Cache');
const logger  = require('../logger/Logger');

class OrmModel {

  constructor() {
    this.name         = '';   // model name
    this.cacheKey     = '';   // model identity attribute name
    this.schema       = {};   // waterline model definition schema object
  }

  get instance() {
    return orm.getWaterlineModel(this.name);
  }

  register() {
    this.checkAfterChangeEventDefinition('afterCreate');
    this.checkAfterChangeEventDefinition('afterUpdate');
    this.checkAfterChangeEventDefinition('afterDestroy');

    return this.schema;
  }

  find(identity, query) {
    let cacheHit = false;
    let queryString = JSON.stringify(query);

    return new Promise((resolve, reject) => {
      cache.getModelHash(this.name, identity, queryString).then((data) => {
        if (data) {
          cacheHit = true;
          return Promise.resolve(data);
        } else {
          return this.instance.find(query);
        }
      }).then((data) => {
        if (data && !cacheHit) {
          return cache.setModelHash(this.name, identity, queryString, data);
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

  getCacheKeyVal(values) {
    if (Array.isArray(values)) {
      return values[0][this.cacheKey];
    } else {
      return values[this.cacheKey];
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
    cache.removeModelHash(this.name, this.getCacheKeyVal(data))
      .then(_ => next())
      .catch((err) => {
        logger.error(err);
        next();
      });
  }

}

module.exports = OrmModel;
