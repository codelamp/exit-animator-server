'use strict';

var express = require('express');
var explain = require('mongoose-explain');
var path = require('path');

// pull in .env vars
require('dotenv').config();

// create the app
var app = express();
var handlers = {};

app.set('handlers', handlers);

handlers.errors = require('./api/helpers/errors');

if ( !process.env.MONGO_URI ) {
  console.log('The environment var MONGO_URI is required.');
  process.exit()
}

if ( !process.env.PORT ) {
  console.log('The environment var PORT is required.');
  process.exit()
}

// set-up our interface with Swagger
handlers.mongoose = require('./api/helpers/mongoose');
handlers.swagger = require('./api/helpers/swagger')
  .configure({
    mongoose: process.env.MONGO_URI,
    port: process.env.PORT,
    appRoot: __dirname
  })
  .on('loaded', function(spec){
    console.log('Listening on ' + this.config.port);
  })
  .on('schema', function(schema, name){
    // when testing, don't debug
    if ( process.env.TEST ) return;
    console.log('Extending schema ' + name + ' with .plugin(explain)');
    schema.plugin(explain);
  })
  .on('schemas', function(schemas){
    // enable timestamping
    schemas.animation.set('timestamps', true);
    schemas.keyframe.set('timestamps', true);
    app.set('schemas', schemas);
  })
  .on('models', function(models){
    app.set('models', models);
  })
  .init(app, function(err){
    if ( err ) {
      return console.log(err);
    }
    console.log('Swagger API activated and entangled with Mongoose');
    app.use('/swagger-ui', express.static(path.join(__dirname, 'swagger-ui')));
    app.use('/docs', express.static(path.join(__dirname, 'docs')));
    app.emit('ready:swangoose');
  })
;

/*
curl -X POST -H 'Host: localhost:8842' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:46.0) Gecko/20100101 Firefox/46.0' -H 'Accept: application/json' -H 'Accept-Language: en-US,en;q=0.8,fa;q=0.6,sv;q=0.4' -H 'Accept-Encoding: gzip, deflate' -H 'Content-Type: application/json' -H 'Referer: http://editor.swagger.io/' -H 'Origin: http://editor.swagger.io' -H 'Connection: keep-alive' --data @/Users/codelamp/exitdata/a.json 'http://localhost:8842/api/keyframe'

 curl -X PUT -H 'Host: localhost:8842' -H 'Accept: application/json' -H 'Accept-Language: en-US,en;q=0.8,fa;q=0.6,sv;q=0.4' -H 'Accept-Encoding: gzip, deflate' -H 'Content-Type: application/json' -H 'Origin: http://editor.swagger.io' -H 'Connection: keep-alive' --data @/Users/codelamp/exitdata/a.json 'http://localhost:8842/api/keyframe/565d024c1c67c5d05787909f'
*/

// export the app (for when testing)
module.exports = app;