'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Program Schema
 */
var ProgramSchema = new Schema({
  name: {
    type: String,
    default: '',
    required: 'Please fill the program name',
    trim: true
  },
  description: {
    type: String,
    default: '',
    required: 'Please complete the program description',
    trim: true
  },
  created: {
    type: Date,
    default: Date.now
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  }
});

mongoose.model('Program', ProgramSchema);
