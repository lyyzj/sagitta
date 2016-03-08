"use strict";

const validator = require('validator');

class UserFetch {

  constructor() {
    this.method = 'get';
    this.uri = '/user/:id';
    this.type = 'application/json; charset=utf-8';
  }

  register() {
    return [this.uri, validate, execute];
  }

}

function *validate(next) {
  console.log(this.params);
  if (!validator.isNumeric(this.params.id)) {
    throw new Error('Invalid input: id shall be number!');
  }
  yield next;
}

function *execute(next) {
  this.body = {name: "john", age:32};
}

const api = new UserFetch();

module.exports = api;