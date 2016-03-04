"use strict";

const libPath = require('path');
const libCrypto = require('crypto');
const env = require(libPath.join(__dirname, '..', '..', 'config', 'env.json'))['env'];
const conf = require(libPath.join(__dirname, '..', '..', 'config', 'logger.' + env + '.json'));

class Logger {

  constructor() {
    this.koa = null;
    this.levels = { error: 0, warn: 1, notice: 3, info: 2, debug: 3, verbose: 4 };
    this.conf = conf;
    this.setLevel(this.conf['level'] || 'info');
  }

  error() {
    if (this.checkLevel('error')) {
      this.doLog('error', arguments);
    }
  }

  warn() {
    if (this.checkLevel('warn')) {
      this.doLog('warn', arguments);
    }
  }

  notice() {
    if (this.checkLevel('notice')) {
      this.doLog('notice', arguments);
    }
  }

  info() {
    if (this.checkLevel('info')) {
      this.doLog('info', arguments);
    }
  }

  debug() {
    if (this.checkLevel('debug')) {
      this.doLog('debug', arguments);
    }
  }

  verbose() {
    if (this.checkLevel('verbose')) {
      this.doLog('verbose', arguments);
    }
  }

  doLog(level, parentArgs) {
    let args = Array.prototype.slice.call(parentArgs);
    args.unshift(level);
    this.koa.trace.apply(this.koa, args);
  }

  setLevel(level) {
    if (this.levels.hasOwnProperty(level)) {
      this.level = level;
    }
  }

  checkLevel(level) {
    let allowedLevel = this.levels[this.level];
    let executeLevel = this.levels[level];

    return executeLevel <= allowedLevel;
  }

  /**
   * Provide a koa middleware register function
   */
  register() {
    const self = this;
    return function *loggerRegister(next) {
      this.id = libCrypto.randomBytes(12);
      this.logger = self;
      self.koa = this;
      yield next;
    };
  }

}

const logLoader = new Logger();

module.exports = logLoader;