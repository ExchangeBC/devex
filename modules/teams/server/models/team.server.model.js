'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Team Schema
 */
var TeamSchema = new Schema({
  code        : {type: String, default: ''},
  name: {
    type: String,
    default: '',
    required: 'Please fill the team name',
    trim: true
  },
  short: {
    type: String,
    default: '',
    required: 'Please complete the team short description',
    trim: true
  },
  description: {
    type: String,
    default: '',
    required: 'Please complete the team description',
    trim: true
  },
  github: {
    type: String,
    default: '',
    trim: true
  },
  isPublished  : {type: Boolean, default: false},
  wasPublished : {type: Boolean, default: false},
  created: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: 'ObjectId',
    ref: 'User',
    default: null
  },
  updated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: 'ObjectId',
    ref: 'User',
    default: null
  },
  program: {
    type: Schema.ObjectId,
    ref: 'Program',
    required: 'Please select a program'
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  activity: {type: Number, default:1},
  tags: [String]
});

TeamSchema.statics.findUniqueCode = function (title, suffix, callback) {
  var _this = this;
  var possible = 'prj-' + (title.toLowerCase().replace(/\W/g,'-').replace(/-+/,'-')) + (suffix || '');

  _this.findOne({
    code: possible
  }, function (err, user) {
    if (!err) {
      if (!user) {
        callback(possible);
      } else {
        return _this.findUniqueCode(title, (suffix || 0) + 1, callback);
      }
    } else {
      callback(null);
    }
  });
};

mongoose.model('Team', TeamSchema);
