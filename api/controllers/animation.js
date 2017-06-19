'use strict';

/**
 * Animation Controller - Expose the api calls for this controller
 * 
 * @module controllers/animation
 */

var util = require('util');
var is = require('../helpers/is');
var handlers;
var swagger;
var models;
var defs;

/**
 * @namespace
 * @private
 */
var methods = {};

/**
 * At point of request, set some local vars to make code easier to read.
 *
 * This method defines the models, handlers, defs, and swagger local vars.
 *
 * @param {express} app - an instance of the express app
 */
methods.getLocals = function(app){
  models = app.get('models');
  handlers = app.get('handlers');
  swagger = app.get('swagger');
  defs = swagger.definitions;
  methods.getLocals = null;
};

/**
 * Controller method to clone an animation
 *
 * @todo requires implementation
 *
 * @param {req} req - Express request object
 * @param {req} res - Express response object
 */
function cloneAnimation(req, res){
  res.json({});
}

/**
 * Add a new animation, to an unknown id
 *
 * @param {req} req - Express request object
 * @param {req} res - Express response object
 */
function postAnimation(req, res){
  methods.getLocals && methods.getLocals(req.app);
  var animation = new models.animation(req.body);
  animation.save(function(err){
    res.json(animation);
  });
};

/**
 * Update an existing animation
 *
 * @param {req} req - Express request object
 * @param {req} res - Express response object
 */
function putAnimation(req, res){
  var animation_id = req.swagger.params.animation_id.value;
  methods.getLocals && methods.getLocals(req.app);
  models.animation.findByIdAndUpdate(animation_id, { $set: req.body }, function (err, animation) {
    if ( err ) {
      res.json({
        message: String(err)
      });
    }
    else if ( animation ) {
      res.json(animation);
    }
  });
};

/**
 * The exposed api call for deleting a specific animation by id
 *
 * @param {req} req - Express request object
 * @param {req} res - Express response object
 */
function deleteAnimation(req, res){
  var animation_id = req.swagger.params.animation_id.value;
  methods.getLocals && methods.getLocals(req.app);
  methods.getAnimationByID(animation_id, function(err, animation){
    if ( err ) {
      res.json({
        message: String(err)
      });
    }
    else if ( animation ) {
      animation.remove(function(err, animation){
        res.json({
          success: true
        });
      });
    }
    else {
      res.json({
        success: false
      });
    }
  });
};

/**
 * The exposed api call for getting a specific animation by id.
 *
 * @param {req} req - Express request object
 * @param {req} res - Express response object
 */
function getAnimation(req, res) {
  // variables defined in the Swagger document can be referenced using req.swagger.params.{parameter_name}
  var animation_id = req.swagger.params.animation_id.value;
  methods.getLocals && methods.getLocals(req.app);
  if ( !animation_id ) {
    return handlers.errors.forRetrieval([400, 'Missing ID.'], req, res, 'Animation');
  }
  methods.getAnimationByID(animation_id, function(err, animation){
    if ( err ) {
      return handlers.errors.forRetrieval(err, req, res, 'Animation');
    }
    else if ( animation ) {
      res.json(animation);
    }
    else {
      res.json(null);
    }
  });
};

/**
 * The exposed api call for getting a list of animation ids.
 *
 * @param {req} req - Express request object
 * @param {req} res - Express response object
 */
function getAnimations(req, res) {
  methods.getLocals && methods.getLocals(req.app);
  methods.getAnimationIDs(function(err, list){
    if ( err ) {
      return handlers.errors.forRetrieval(err, req, res, 'Animation');
    }
    else if ( list ) {
      res.json(list);
    }
    else {
      res.json(null);
    }
  });
};

/**
 * List all animation ids available, from mongo
 *
 * @todo add paging to API
 *
 * @param {Function} callback - once the animation ids have been retrieved, pass them to this callback
 */
methods.getAnimationIDs = function(callback){
  models.animation.find({}).lean().distinct('_id').exec(function(err, list) {
    if ( err ) {
      callback(err);
    }
    else if ( list ) {
      console.log(list);
      callback(null, list);
    }
  });
};

/**
 * Get an animation by id, from mongo
 * 
 * @param {String} animation_id - the id of the animation, correlates to the mongo id
 * @param {Function} callback - send the found animation object to the callback
 */
methods.getAnimationByID = function(animation_id, callback){
  models.animation.findById(animation_id, function(err, animation) {
    if ( err ) {
      callback(err);
    }
    else if ( animation ) {
      animation.populate('keyframes', function(err){
        handlers.swagger.object(animation, defs.animation, defs);
        callback(null, animation);
      });
    }
  });
};

/**
 * Merge objects with template
 *
 * @param {object} a - original object
 * @param {object} b - object with properties being merged over
 * @param {object} c - template of allowed properties in the form { attr1: 'string', attr2: 'boolean' }
 *
 * @todo needs support for arrays
 */
methods.mergeDocuments = function(a, b, c){
  if ( Array.isArray(c) ) {
    for ( var i=0, l=c.length; i<l; i++ ) {
      // @TODO: methods.mergeDocuments()
    }
  }
  else {
    for ( var key in b ) {
      if ( c && (c[key] !== undefined) ) {
        if ( is.primitiveObject(b[key]) ) {
          a[key] = b[key];
          methods.mergeDocuments(a[key], b[key], c[key]);
        }
        else if ( is.primitive(b[key]) ) {
          a[key] = b[key];
        }
        else {
          methods.mergeDocuments(a[key], b[key], c[key]);
        }
      }
    }
  }
};

module.exports = {
  postAnimation: postAnimation,
  putAnimation: putAnimation,
  getAnimation: getAnimation,
  getAnimations: getAnimations,
  deleteAnimation: deleteAnimation,
  cloneAnimation: cloneAnimation
};
