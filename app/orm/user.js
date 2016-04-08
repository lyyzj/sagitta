"use strict";

const OrmHandler = require('../../src/orm/OrmHandler.js');
const OrmModel = require('../../src/orm/OrmModel.js');

class UserModel extends OrmModel {

  constructor() {
    this.name = 'user';
    this.handle = OrmHandler.getWaterlineModel(this.name);

    this.schema = {};
  }

}

const model = new UserModel();

module.exports = model;