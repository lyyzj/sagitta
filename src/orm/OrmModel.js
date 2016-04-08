"use strict";

const cache = require('../cache/Cache.js');

class OrmModel {

  constructor() {
    this.schema = {};
  }

  register() {
    return this.schema;
  }
  
  find() {
    
  }

}

module.exports = OrmModel;