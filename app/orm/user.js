"use strict";

const OrmHandler = require('../../src/orm/OrmHandler.js');
const OrmModel = require('../../src/orm/OrmModel.js');

class UserModel extends OrmModel {

  constructor() {
    this.name = 'user';
    this.instance = OrmHandler.getWaterlineModel(this.name);

    this.schema = {
      identity: 'user',
      connection: 'default',
      attributes: {
        firstName: 'string',
        lastName: 'string'
      }
    };
  }

}

const model = new UserModel();

module.exports = model;