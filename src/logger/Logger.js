"use strict";

const libPath = require('path');
const libCrypto = require('crypto');
const conf = require(libPath.join(__dirname, '..', '..', 'config', 'logger.json'));

class Logger {

  conf;
  level;

  levels = { error: 0, warn: 1, notice: 3, info: 2, debug: 3, verbose: 4 };

  constructor() {
    this.conf = conf;
    this.level = this.conf['level'];
  }

  error() {
    if (this.checkLevel('error')) {
      this.trace(arguments);
    }
  }

  warn() {
    if (this.checkLevel('warn')) {
      this.trace(arguments);
    }
  }

  notice() {
    if (this.checkLevel('notice')) {
      this.trace(arguments);
    }
  }

  info() {
    if (this.checkLevel('info')) {
      this.trace(arguments);
    }
  }

  debug() {
    if (this.checkLevel('debug')) {
      this.trace(arguments);
    }
  }

  verbose() {
    if (this.checkLevel('verbose')) {
      this.trace(arguments);
    }
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
    return function *middleware(next) {
      this.id = libCrypto.randomBytes(12);
      this.logger = self;
      self.trace = this.trace;
    };
  }

}

const logLoader = new Logger();

module.exports = logLoader;