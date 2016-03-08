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