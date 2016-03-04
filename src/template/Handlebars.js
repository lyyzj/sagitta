"use strict";

const libPath = require('path');

const handlebars = require('handlebars');
const templatePath = libPath.join(__dirname, '..', '..', 'public', 'templates');

class Handlebars {

  register() {
    return function *handlbarsRegister(next) {

    };
  }

}

module.exports = new Handlebars();