"use strict";

const libUtil = require('util');
const libPath = require('path');

const koa = require('koa');
const app = koa();

require('koa-trace')(app);

const logLoader = require(libPath.join(__dirname, 'logger', 'Logger.js'));

app.use(logLoader.register());

// x-response-time
app.use(function *(next){
  this.logger.info('A');
  var start = new Date;
  yield next;
  this.logger.debug('E');
  var ms = new Date - start;
  this.set('X-Response-Time', ms + 'ms');
});

// logger
app.use(function *(next){
  this.logger.info('B');
  var start = new Date;
  yield next;
  this.logger.debug('D');
  var ms = new Date - start;
  this.trace(libUtil.format('%s %s - %s', this.method, this.url, ms));
});

// response
app.use(function *(){
  this.logger.info('C');
  this.body = 'Hello World';
});

app.debug();

app.listen(3000);