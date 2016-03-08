"use strict";

const libPath = require('path');

const env = require(libPath.join(__dirname, '..', 'config', 'env.json'))['env'];
const conf = require(libPath.join(__dirname, '..', 'config', 'config.' + env + '.json'));

const koa = require('koa');
const app = koa();

const serve = require('koa-static');
require('koa-trace')(app);

const logLoader = require(libPath.join(__dirname, 'logger', 'Logger.js'));
const handlbarsRegister = require(libPath.join(__dirname, 'template', 'Handlebars.js'));
const requestTimer = require(libPath.join(__dirname, 'middleware', 'RequestTimer.js'));
const routerLoader = require(libPath.join(__dirname, 'router', 'Router.js'));
const notFoundHandler = require(libPath.join(__dirname, 'middleware', 'NotFoundHandler.js'));

// middleware
app.use(serve(libPath.join(__dirname, '..', 'public')));
app.use(logLoader.register());
app.use(handlbarsRegister.register());
app.use(requestTimer.register());
app.use(routerLoader.router.routes());
app.use(notFoundHandler.register());

// start
app.debug();
app.listen(conf['port']);