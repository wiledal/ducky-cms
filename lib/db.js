const nedb = require('nedb-promise');
const helpers = require('./helpers.js');
const crypto = require('crypto');

function encrypt(s, pass) {
  var cipher = crypto.createCipher('aes-256-ctr', pass)
  var crypted = cipher.update(s,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
function decrypt(s, pass) {
  var decipher = crypto.createDecipher('aes-256-ctr', pass)
  var dec = decipher.update(s, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
}

module.exports = (path) => {
  return new nedb({
    filename: `${path}/.duckycms/content.db`,
    autoload: true,
    // afterSerialization(s) {
    //   return encrypt(s, 'pass');
    // },
    // beforeDeserialization(s) {
    //   return decrypt(s, 'pass');
    // }
  });
}
