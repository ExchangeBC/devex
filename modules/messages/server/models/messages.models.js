'use strict';
// =========================================================================
//
// models for the entire messaging system
//
// this includes email notifications and archives and records of send/receive
// read/etc and which actions were taken on message results
//
// =========================================================================
var mongoose = require ('mongoose');
// -------------------------------------------------------------------------
//
// the message template
//
// this indicates a type of message and its meta data. it has a unique code
// for human readable recognition and a description to display when seeing
// message types in a list.
// if it is a subscription type of message then it may have different processing
// and the remainder are all templates thaty get completed with data that
// creates the personalized message
// models required is a list of model names that are needed to properly build
// a message from the template - user is assumed
//
// -------------------------------------------------------------------------
mongoose.model ('MessageTemplate', new mongoose.Schema ({
	messageCd            : { type : String,   default : '', unique:true },
	description          : { type : String,   default : '' },
	isSubscriptionType   : { type : Boolean,  default : false },
	messageBodyTemplate  : { type : String,   default : '' },
	messageShortTemplate : { type : String,   default : '' },
	messageTitleTemplate : { type : String,   default : '' },
	emailBodyTemplate    : { type : String,   default : '' },
	emailSubjectTemplate : { type : String,   default : '' },
	modelsRequired       : { type : [String], default : [] },
	daysToArchive        : { type: Number,    default : 14 },
	actions              : [{
		actionCd      : { type : String,   default : '' },
		linkTemplate  : { type : String,   default : '' },
		isDefault     : { type : Boolean,  default : false }
	}]
}));
// -------------------------------------------------------------------------
//
// the message itself
//
// the messageCd indicates the type and templates, user is the recipient
// and the other fields are the results of merging the supplied data with
// the templates as they were at the time of the merge
//
// when a message is archived either by the user or automatically it moves
// into the archive table
//
// -------------------------------------------------------------------------
mongoose.model ('Message', new mongoose.Schema ({
	messageCd    : { type : String,     default : ''},
	user         : { type : 'ObjectId', default: null, ref: 'User' },
	messageBody  : { type : String,     default : '' },
	messageShort : { type : String,     default : '' },
	messageTitle : { type : String,     default : '' },
	emailBody    : { type : String,     default : '' },
	emailSubject : { type : String,     default : '' },
	actions              : [{
		actionCd    : { type : String,  default : '' },
		link        : { type : String,  default : '' },
		isDefault   : { type : Boolean, default : false }
	}],
	dateSent     : { type : Date,   default : null },
	emailError   : {},
	date2Archive : { type : Date,   default : null },
	dateArchived : { type : Date,   default : null },
	dateViewed   : { type : Date,   default : null },
	dateActioned : { type : Date,   default : null },
	actionTaken  : { type : String, default : '' }
}));
// -------------------------------------------------------------------------
//
// the message archive
//
// for purposes of audit etc
//
// -------------------------------------------------------------------------
mongoose.model ('MessageArchive', new mongoose.Schema ({
	messageCd    : { type : String },
	user         : { type : 'ObjectId', ref: 'User' },
	messageBody  : { type : String },
	messageShort : { type : String },
	messageTitle : { type : String },
	emailBody    : { type : String },
	emailSubject : { type : String },
	actions              : [{
		actionCd    : { type : String },
		link        : { type : String },
		isDefault   : { type : Boolean }
	}],
	dateSent     : { type : Date },
	emailError   : {},
	date2Archive : { type : Date },
	dateArchived : { type : Date },
	dateViewed   : { type : Date },
	dateActioned : { type : Date },
	actionTaken  : { type : String }
}));
