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

  setModelHash(modelName, shardId, queryString, data, expires) {
    let key = this.genModelKey(modelName, shardId);
    return this.instance.pipeline()
      .hset(key, queryString, msgpack.encode(data))
      .expire(key, this.genExpire(expires))
      .exec();
  }

  getModelHash(modelName, shardId, queryString) {
    return new Promise((resolve, reject) => {
      this.instance.hgetBuffer(this.genModelKey(modelName, shardId), queryString).then((data) => {
        resolve(msgpack.decode(data));
      }).catch((err) => {
        reject(err);
      });
    });
  }

  setExpire(key, expires) {
    return this.instance.expire(key, this.genExpire(expires));
  }

  genModelKey(modelName, shardId) {
    return `${modelName}:${shardId}`;
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