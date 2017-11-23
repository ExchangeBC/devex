'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  path = require('path'),
  config = require(path.resolve('./config/config')),
  Schema = mongoose.Schema,
  crypto = require('crypto'),
  validator = require('validator'),
  generatePassword = require('generate-password'),
  owasp = require('owasp-password-strength-test'),
  _ = require ('lodash');

owasp.config(config.shared.owasp);

// -------------------------------------------------------------------------
//
// endorsement
//
// -------------------------------------------------------------------------
var Endorsement = new Schema ({
  content     : {type: String, default: ''},
  link        : {type: String, default: ''},
  projectName : {type: String, default: ''},
  created     : {type: Date, default: null},
  createdBy   : {type: 'ObjectId', ref: 'User', default: null },
  updated     : {type: Date, default: null },
  updatedBy   : {type: 'ObjectId', ref: 'User', default: null }
});


/**
 * A Validation function for local strategy properties
 */
var validateLocalStrategyProperty = function (property) {
  return ((this.provider !== 'local' && !this.updated) || property.length);
};

/**
 * A Validation function for local strategy email
 */
var validateLocalStrategyEmail = function (email) {
  return ((this.provider !== 'local' && !this.updated) || validator.isEmpty(email) || validator.isEmail(email, { require_tld: false }));
};

/**
 * User Schema
 */
var UserSchema = new Schema({
  firstName: {
    type: String,
    trim: true,
    default: ''
    // validate: [validateLocalStrategyProperty, 'Please fill in your first name']
  },
  lastName: {
    type: String,
    trim: true,
    default: ''
    // validate: [validateLocalStrategyProperty, 'Please fill in your last name']
  },
  displayName: {type: String, trim: true },
  email: {
    type: String,
    index: {
      unique: true,
      sparse: true // For this to work on a previously indexed field, the index must be dropped & the application restarted.
    },
    lowercase: true,
    trim: true,
    default: '',
    validate: [validateLocalStrategyEmail, 'Please fill a valid email address']
  },
  username: {
    type: String,
    unique: 'Username already exists',
    required: 'Please fill in a username',
    lowercase: true,
    trim: true
  },
  password                 : {type: String, default: ''},
  salt                     : {type: String },
  profileImageURL          : {type: String, default: 'img/default.png'},
  provider                 : {type: String, required: 'Provider is required'},
  government               : {type: String, default: ''},
  isDisplayEmail           : {type: Boolean, default:true},
  notifyOpportunities      : {type: Boolean, default:false},
  subscribeOpportunitiesId : {type: String, default: null},
  convertedNotifications   : {type: Boolean, default:false},
  notifyEvents             : {type: Boolean, default:false},
  notifyBlogs              : {type: Boolean, default:false},
  userTitle                : {type: String, default: ''},
  providerData             : {},
  additionalProvidersData  : {},
  roles                    : {type: [{type: String }], default: ['user'], required: 'Please provide at least one role'},
  updated                  : {type: Date },
  created                  : {type: Date, default: Date.now },
  /* For reset password */
  resetPasswordToken       : {type: String },
  resetPasswordExpires     : {type: Date },
  //
  // this is where we put the payment preferences for users who are developers
  // all of these need to be added to the field whitelists
  //
  isDeveloper      : {type: Boolean, default: false},
  paymentMethod    : {type: String, default:'Cheque', enum:['Cheque', 'Direct Deposit', 'PayPal']},
  businessName     : {type: String, default: ''},
  businessAddress  : {type: String, default: ''},
  businessAddress2 : {type: String, default: ''},
  businessCity     : {type: String, default: ''},
  businessProvince : {type: String, default: 'BC', enum: ['AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT']},
  businessCode     : {type: String, default: ''},
  businessContactName     : {type: String, default: ''},
  businessContactEmail     : {type: String, default: '', trim:true, lowercase:true, validate: [validateLocalStrategyEmail, 'Please fill a valid email address']},
  businessContactPhone     : {type: String, default: ''},
  address  : {type: String, default: ''},
  phone  : {type: String, default: ''},
  //
  // notifications based upon events
  //
  notifications: {
    update : { type: Schema.ObjectId, ref: 'Notification' }
  },
  location      : {type: String, default: ''},
  description   : {type: String, default: ''},
  website       : {type: String, default: ''},
  skills        : [String],
  badges        : [String],
  capabilities  : [String],
  endorsements  : [Endorsement],
  github        : {type: String, default: ''},
  stackOverflow : {type: String, default: ''},
  stackExchange : {type: String, default: ''},
  linkedIn      : {type: String, default: ''},
  isPublicProfile : {type: Boolean, default:false},
  isAutoAdd : {type: Boolean, default:true}
});

/**
 * Hook a pre save method to hash the password
 */
UserSchema.pre('save', function (next) {
  if (this.password && this.isModified('password')) {
    this.salt = crypto.randomBytes(16).toString('base64');
    this.password = this.hashPassword(this.password);
  }

  next();
});

/**
 * Hook a pre validate method to test the local password
 */
UserSchema.pre('validate', function (next) {
  if (this.provider === 'local' && this.password && this.isModified('password')) {
    var result = owasp.test(this.password);
    if (result.errors.length) {
      var error = result.errors.join(' ');
      this.invalidate('password', error);
    }
  }

  next();
});

/**
 * Create instance method for hashing a password
 */
UserSchema.methods.hashPassword = function (password) {
  if (this.salt && password) {
    return crypto.pbkdf2Sync(password, new Buffer(this.salt, 'base64'), 10000, 64, 'SHA1').toString('base64');
  } else {
    return password;
  }
};

/**
 * Create instance method for authenticating user
 */
UserSchema.methods.authenticate = function (password) {
  return this.password === this.hashPassword(password);
};

// -------------------------------------------------------------------------
//
// add roles to a user, ensure unique
//
// -------------------------------------------------------------------------
UserSchema.methods.addRoles = function (roles) {
  this.roles = _.union (this.roles, roles);
  this.markModified ('roles');
};
UserSchema.methods.removeRoles = function (roles) {
  var _this = this;
  _.each (roles, function (role) {
    roles = _.remove (_this.roles, function (v) {return v === role;});
  });
  this.markModified ('roles');
};


/**
 * Find possible not used username
 */
UserSchema.statics.findUniqueUsername = function (username, suffix, callback) {
  var _this = this;
  var possibleUsername = username.toLowerCase() + (suffix || '');

  _this.findOne({
    username: possibleUsername
  }, function (err, user) {
    if (!err) {
      if (!user) {
        callback(possibleUsername);
      } else {
        return _this.findUniqueUsername(username, (suffix || 0) + 1, callback);
      }
    } else {
      callback(null);
    }
  });
};

/**
* Generates a random passphrase that passes the owasp test
* Returns a promise that resolves with the generated passphrase, or rejects with an error if something goes wrong.
* NOTE: Passphrases are only tested against the required owasp strength tests, and not the optional tests.
*/
UserSchema.statics.generateRandomPassphrase = function () {
  return new Promise(function (resolve, reject) {
    var password = '';
    var repeatingCharacters = new RegExp('(.)\\1{2,}', 'g');

    // iterate until the we have a valid passphrase
    // NOTE: Should rarely iterate more than once, but we need this to ensure no repeating characters are present
    while (password.length < 20 || repeatingCharacters.test(password)) {
      // build the random password
      password = generatePassword.generate({
        length: Math.floor(Math.random() * (20)) + 20, // randomize length between 20 and 40 characters
        numbers: true,
        symbols: false,
        uppercase: true,
        excludeSimilarCharacters: true
      });

      // check if we need to remove any repeating characters
      password = password.replace(repeatingCharacters, '');
    }

    // Send the rejection back if the passphrase fails to pass the strength test
    if (owasp.test(password).errors.length) {
      reject(new Error('An unexpected problem occured while generating the random passphrase'));
    } else {
      // resolve with the validated passphrase
      resolve(password);
    }
  });
};

mongoose.model('User', UserSchema);
