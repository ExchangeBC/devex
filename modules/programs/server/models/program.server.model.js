'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Program Schema
 */
var ProgramSchema = new Schema({
  code        : {type: String, default: ''},
  title       : {type: String, default: '', required: 'Title cannot be blank'},
  short       : {type: String, default: ''},
  description : {type: String, default: ''},
  owner       : {type: String, default: ''},
  website     : {type: String, default: ''},
  logo        : {type: String, default: ''},
  tags        : [String],
  isPublished : {type: Boolean, default: false},
  created     : {type: Date, default: null},
  createdBy   : {type: 'ObjectId', ref: 'User', default: null },
  updated     : {type: Date, default: null },
  updatedBy   : {type: 'ObjectId', ref: 'User', default: null }
});

ProgramSchema.statics.findUniqueCode = function (title, suffix, callback) {
  var _this = this;
  var possible = 'pro-' + (title.toLowerCase().replace(/\W/g,'-').replace(/-+/,'-')) + (suffix || '');

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

mongoose.model('Program', ProgramSchema);
