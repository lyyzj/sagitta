"use strict";

const Redis = require('ioredis');

const msgpack = require('msgpack-lite');

class Cache {

  constructor() {
    this.instance = null;

    this.variance = 10;
    this.expires = 18000; // 5 hours = 5 * 60 * 60 seconds
  }

  initialize(conf) {
    this.instance = new Redis(conf);
  }

  setModelHash(modelName, identify, queryString, data, expires) {
    let key = this.genModelKey(modelName, identify);
    return new Promise((resolve, reject) => {
      this.instance.pipeline()
        .hset(key, queryString, msgpack.encode(data))
        .expire(key, this.genExpire(expires))
        .exec()
        .then((results) => { // results: [[null, 1], [null, 1]]
          results.forEach((result) => { // result: [null, 1]
            if (result[0]) {
              reject(result[0]); // err
            }
          });
          resolve(data); // data itself resolved
        });
    });
  }

  getModelHash(modelName, identify, queryString) {
    return new Promise((resolve, reject) => {
      this.instance.hgetBuffer(this.genModelKey(modelName, identify), queryString).then((data) => {
        resolve(msgpack.decode(data));
      }).catch((err) => {
        reject(err);
      });
    });
  }
  
  removeModelHash(modelName, identify) {
    return this.instance.del(this.genModelKey(modelName, identify));
  }

  setExpire(key, expires) {
    return this.instance.expire(key, this.genExpire(expires));
  }

  genModelKey(modelName, identify) {
    return `${modelName}:${identify}`;
  }

  genExpire(expires) {
    expires = expires || this.expires;

    let varianceMin = 0;
    let varianceMax = expires * 0.02 * this.variance;
    let varianceMinus = expires * 0.01 * this.variance;

    return Math.floor(expires + this.getRandomArbitrary(varianceMin, varianceMax) - varianceMinus);
  }

  getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
  }

}

const cache = new Cache();

module.exports = cache;