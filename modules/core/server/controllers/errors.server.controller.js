'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  config = require(path.resolve('./config/config'));

/**
 * Get unique error field name
 */
var getUniqueErrorMessage = function (err) {
  var output;

  try {
    var begin;
    if (err.errmsg.lastIndexOf('.$') !== -1) {
      begin = err.errmsg.lastIndexOf('.$') + 2;
    } else {
      begin = err.errmsg.lastIndexOf('index: ') + 7;
    }
    var fieldName = err.errmsg.substring(begin, err.errmsg.lastIndexOf('_1'));
    output = fieldName.charAt(0).toUpperCase() + fieldName.slice(1) + ' already exists';

  } catch (ex) {
    output = 'Unique field already exists';
  }

  return output;
};

/**
 * Get the error message from error object
 */
exports.getErrorMessage = function (err) {
  var message = '';

  if (err.code) {
    switch (err.code) {
      case 11000:
      case 11001:
        message = getUniqueErrorMessage(err);
        break;
      case 'LIMIT_FILE_SIZE':
        message = 'Image too big. Please maximum ' + (config.uploads.profileUpload.limits.fileSize / (1024 * 1024)).toFixed(2) + ' Mb files.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Missing `newProfilePicture` field';
        break;
      default:
        message = 'Something went wrong';
    }
  } else if (err.message && !err.errors) {
    message = err.message;
  } else {
    for (var errName in err.errors) {
      if (err.errors[errName].message) {
        message = err.errors[errName].message;
      }
    }
  }

  return message;
};
