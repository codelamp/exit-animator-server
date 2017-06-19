'use strict';

/**
 * Keyframe Controller - Expose the api calls for this controller
 * 
 * @module controllers/keyframe
 */

var util = require('util');
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
function cloneKeyframe(req, res){
  res.json({});
}

/**
 * Add a new keyframe, to an unknown id
 *
 * @param {req} req - Express request object
 * @param {req} res - Express response object
 */
function postKeyframe(req, res){
  methods.getLocals && methods.getLocals(req.app);
  var keyframe = new models.keyframe(req.body);
  keyframe.save(function(err){
    res.json(keyframe);
  });
};

/**
 * Update an existing keyframe
 *
 * @param {req} req - Express request object
 * @param {req} res - Express response object
 */
function putKeyframe(req, res){
  methods.getLocals && methods.getLocals(req.app);
  res.json(req.body);
};

/**
 * Controller method to get a keyframe by id
 *
 * @param {req} req - Express request object
 * @param {req} res - Express response object
 */
function getKeyframe(req, res) {
  methods.getLocals && methods.getLocals(req.app);
  // variables defined in the Swagger document can be referenced using req.swagger.params.{parameter_name}
  var keyframe_id = req.swagger.params.keyframe_id.value;
  models.keyframe.findById(keyframe_id, function(err, keyframe) {
    if (err) res.send(err);
    handlers.swagger.object(keyframe, defs.keyframe, defs);
    res.json(keyframe);
  });
}

/**
 * Controller method to list keyframe ids for the current animation
 *
 * @param {req} req - Express request object
 * @param {req} res - Express response object
 */
function getKeyframes(req, res) {
  methods.getLocals && methods.getLocals(req.app);
  res.json(['12', '13']);
}


module.exports = {
  postKeyframe: postKeyframe,
  putKeyframe: putKeyframe,
  getKeyframe: getKeyframe,
  getKeyframes: getKeyframes,
  cloneKeyframe: cloneKeyframe
};