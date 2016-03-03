"use strict";

const koa = require('koa');
const app = koa();

// x-response-time

app.use(function *(next){
  console.log('M1 S1');
  var start = new Date;
  yield next;
  console.log('M1 S2');
  var ms = new Date - start;
  this.set('X-Response-Time', ms + 'ms');
});

// logger

app.use(function *(next){
  console.log('M2 S1');
  var start = new Date;
  yield next;
  console.log('M2 S2');
  var ms = new Date - start;
  console.log('%s %s - %s', this.method, this.url, ms);
});

// response

app.use(function *(){
  console.log('hello');
  this.body = 'Hello World';
});

app.listen(3000);