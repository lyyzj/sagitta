"use strict";

const Redis = require('ioredis');

class Cache {

  constructor() {
    this.handle = null;
  }

  initialize(conf) {
    this.handle = new Redis(conf);
  }

}

const instance = new Cache();

module.exports = instance;