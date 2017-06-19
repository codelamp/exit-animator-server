
/**
 * Mongoose Helper
 * 
 * @module helpers/mongoose
 */

var mongoose = require('mongoose');

exports.config = {};

/**
 * 
 */
exports.configure = function(config){
  var instance = Object.create(this);
  instance.config = config;
  return instance;
};

/**
 *
 */
exports.init = function(app, callback){
  if ( !this.config || !this.config.uri ) {
    console.log('Configuration required!');
    return;
  }
  var m = mongoose.connect(this.config.uri);
  m.connection.on('connected', function(e){
    if ( e ) {
      console.log(e);
    }
    else {
      console.log('Mongoose default connection open');
    }
    callback(null);
  });
  m.connection.on('error', function(e){
    callback(e)
  });
  
};