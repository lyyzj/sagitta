"use strict";

const libPath = require('path');
const libCrypto = require('crypto');

const WinstonTFile = require('winston').transports.File;
const WinstonTConsole = require('winston').transports.Console;
const WinstonLogger = require('winston').Logger;

class Logger {

  constructor() {
    this.conf = null;
    this.logger = null;

    this.levels = { error: 0, warn: 1, notice: 2, info: 3, debug: 4, verbose: 5 };
    this.colors = { error: 'red', warn: 'yellow', notice: 'cyan', info: 'green', debug: 'blue', verbose: 'grey' };
  }

  initialize(conf) {
    this.conf = conf;

    // check level
    let level = 'info';
    if (conf.hasOwnProperty('level') && this.levels.hasOwnProperty(conf.level)) {
      level = conf.level;
    }

    // check file info
    let file = libPath.join('tmp', 'arrow.log');
    if (conf.hasOwnProperty('filename')) {
      file = libPath.isAbsolute(conf.filename) ? conf.filename : libPath.join('tmp', libPath.normalize(conf.filename))
    }

    // create transports
    let fileTransport = new WinstonTFile({
      colorize: false,
      timestamp: true,
      showLevel: true,
      filename: file,
      maxsize: conf.maxsize || '10m',
      maxFiles: conf.maxFiles || 1000,
      json: conf.json || true,
      zippedArchive: conf.zippedArchive || true,
      tailable: conf.tailable || true
    });
    let consoleTransport = new WinstonTConsole({
      colorize: true,
      timestamp: true,
      showLevel: true
    });

    this.logger = new WinstonLogger({
      level: level,
      transports: [
        fileTransport,
        consoleTransport
      ],
      levels: this.levels,
      colors: this.colors
    });
  }

  error() {
    this.doLog('error', arguments);
  }

  warn() {
    this.doLog('warn', arguments);
  }

  notice() {
    this.doLog('notice', arguments);
  }

  info() {
    this.doLog('info', arguments);
  }

  debug() {
    this.doLog('debug', arguments);
  }

  verbose() {
    this.doLog('verbose', arguments);
  }

  /**
   * Called with first argument "this.reqId",
   * means unique session string reqId shall be added into log message.
   * The "this" in "this.reqId" is instance of koa.
   *
   * e.g logger.verbose(this.reqId, 'verbose');
   */
  doLog(level, parentArgs) {
    let args = Array.prototype.slice.call(parentArgs);
    if (Buffer.isBuffer(args[0])) { // the first argument is "reqId"
      let reqId = args.shift().toString('base64');
      args[0] = reqId + ': ' + args[0];
    }
    this.logger[level].apply(this.logger, args);
  }

  /**
   * Provide a koa middleware register function
   */
  register() {
    return function *cryptoIdRegister(next) {
      this.reqId = libCrypto.randomBytes(12);
      yield next;
    };
  }

}

const instance = new Logger();

module.exports = instance;