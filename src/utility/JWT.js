'use strict'
const jwt = require('koa-jwt');

function createToken(obj, jwtSecret) {
  if (jwtSecret === undefined) {
    throw new Error("undefined JWT secret");
  }
  let token = jwt.sign(obj, jwtSecret);
  return token;
}

function verify(token, jwtSecret) {
  try {
    let decodeToken = jwt.verify(token, jwtSecret);
    return decodeToken;
  } catch (e) {
    return false;
  }
}

module.exports = {
  createToken: createToken,
  verify:      verify
};
