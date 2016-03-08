"use strict";

const validator = require('validator');

class UserFetch {

  constructor() {
    this.method = 'get';
    this.uri    = '/user/:id';
    this.type   = 'application/json; charset=utf-8';
  }

  register() {
    return [this.uri, validate, execute];
  }

}

/**
 * Data input:
 * 1. url params: "/user/:id" => this.params.id
 * 2. url query string: "/user/search?name=jonathan&age=27" => this.query.name & this.query.age
 * 3. post body: curl -H "Content-Type: application/json" -X POST -d '{"username":"xyz","password":"xyz"}' http://localhost:3001/api/1.0/login => this.request.body.username & ...
 */

function *validate(next) {
  if (!validator.isNumeric(this.params.id)) {
    throw new Error('Invalid input: id shall be number!');
  }
  yield next;
}

function *execute(next) {
  this.type = api.type;
  this.body = { id: this.params.id, name: "name: " + this.params.id, age: this.params.id };
}

const api = new UserFetch();

module.exports = api;