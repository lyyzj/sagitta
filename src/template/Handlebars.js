"use strict";

const libPath = require('path');

const handlebars = require('handlebars');
const templatePath = libPath.join(__dirname, '..', '..', 'public', 'templates');

class Handlebars {

  constructor() {
    this.cache = {};
  }

  render(fileName, args) {

  }

  register() {
    return function *handlbarsRegister(next) {
      const self = this;
      this.render = self.render;
      yield next;
    };
  }

}

const instance = new Handlebars();

module.exports = instance;