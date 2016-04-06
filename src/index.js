"use strict";

const libPath = require('path');

const env = require(libPath.join(__dirname, '..', 'config', 'env.json'))['env'];
const conf = require(libPath.join(__dirname, '..', 'config', 'config.' + env + '.json'));

const koa = require('koa');
const app = koa();

const serve = require('koa-static');
const bodyParser = require('koa-bodyparser');

const logLoader = require(libPath.join(__dirname, 'logger', 'Logger.js'));
const handlbarsRegister = require(libPath.join(__dirname, 'template', 'Handlebars.js'));
const requestTimer = require(libPath.join(__dirname, 'middleware', 'RequestTimer.js'));
const routerLoader = require(libPath.join(__dirname, 'router', 'Router.js'));
const notFoundHandler = require(libPath.join(__dirname, 'middleware', 'NotFoundHandler.js'));

// middleware
require('koa-qs')(app, 'extended'); // add query string parser
app.use(serve(libPath.join(__dirname, '..', 'public'))); // static files
app.use(logLoader.register()); // log
app.use(handlbarsRegister.register()); // handlebars template
app.use(requestTimer.register()); // request timer
app.use(bodyParser()); // post body parser
app.use(routerLoader.router.routes()); // router
app.use(notFoundHandler.register()); // 404 handler

// other components
logLoader.initialize({
  level: 'verbose',
  filename: libPath.join(__dirname, '..', 'log', 'arrow-web.log')
});

// start
app.listen(conf['port']);