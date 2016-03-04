"use strict";

const libPath = require('path');
const libFsp = require('fs-promise');
const libUtil = require('util');
const configRoot = libPath.join(__dirname, '..', '..', 'config');
const env = require(libPath.join(configRoot, 'env.json'));

class Config {

  suffix = '.json';
  cache = {};

  constructor() {
    if (env && typeof env === 'object' && env.hasOwnProperty('env')) {
      this.suffix = '.' + env.env + this.suffix;
    }
  }

  /**
   * Load config of one key from config file
   * @param fileName file name could be specified with sub dir: 'game/data'
   * @param key
   * @returns {String|null|Object}
   */
  loadKey(fileName, key) {
    this.loadJson(fileName).then((conf) => {
      if (conf.hasOwnProperty(key)) {
        return Promise.resolve(conf[key]);
      } else {
        return Promise.reject(new Error(libUtil.format('Config: Key not found: %s - %s', fileName, key)));
      }
    }).catch((err) => {
      return Promise.reject(err);
    })
  }

  /**
   * Load whole config file into json
   * @param fileName file name could be specified with sub dir: 'game/data'
   * @returns {Promise<Object>}
   */
  loadJson(fileName) {
    // exists in cache
    if (this.cache.hasOwnProperty(fileName)) {
      return Promise.resolve(this.cache[fileName]);
    }

    // check file exists
    let filePath = libPath.join(configRoot, fileName);
    libFsp.stat(filePath).then((stats) => {
      if (!stats.isFile()) {
        return Promise.reject(new Error(libUtil.format('Config: File not found: %s', fileName)));
      }
    });

    // read & parse file
    libFsp.readFile(filePath).then((content) => {
      try {
        let jsonData = JSON.parse(content);
        this.cache[fileName] = jsonData;
        return Promise.resolve(jsonData);
      } catch (err) {
        return Promise.reject(err);
      }
    }).catch((err) => {
      return Promise.reject(err);
    });
  }

}

const confLoader = new Config();

module.exports = confLoader;