'use strict';
// =========================================================================
//
// models for the entire messaging system
//
// this includes email notifications and archives and records of send/receive
// read/etc and which actions were taken on message results
//
// =========================================================================
import { Model, model, Schema } from 'mongoose';
import { IMessageArchiveDocument } from '../interfaces/IMessageArchiveDocument';
import { IMessageDocument } from '../interfaces/IMessageDocument';
import { IMessageTemplateDocument } from '../interfaces/IMessageTemplateDocument';
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
export interface IMessageTemplateModel extends Model<IMessageTemplateDocument> {}
export interface IMessageArchiveModel extends Model<IMessageArchiveDocument> {}
export interface IMessageModel extends Model<IMessageDocument> {}

export const MessageTemplate: IMessageTemplateModel = model<IMessageTemplateDocument, IMessageTemplateModel>(
	'MessageTemplate',
	new Schema({
		messageCd: { type: String, default: '', unique: true },
		description: { type: String, default: '' },
		isSubscriptionType: { type: Boolean, default: false },
		messageBodyTemplate: { type: String, default: '' },
		messageShortTemplate: { type: String, default: '' },
		messageTitleTemplate: { type: String, default: '' },
		emailBodyTemplate: { type: String, default: '' },
		emailSubjectTemplate: { type: String, default: '' },
		modelsRequired: { type: [String], default: [] },
		daysToArchive: { type: Number, default: 14 },
		linkTemplate: { type: String, default: '' },
		actions: [
			{
				actionCd: { type: String, default: '' },
				linkTitleTemplate: { type: String, default: '' },
				isDefault: { type: Boolean, default: false }
			}
		]
	})
);
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
// email is attempted some number of times - incrementing the retries each
// time. the last error is stored
//
// -------------------------------------------------------------------------
export const Message: IMessageModel = model<IMessageDocument, IMessageModel>(
	'Message',
	new Schema({
		messageCd: { type: String, default: '' },
		messageLevel: { type: String, default: 'info', enum: ['info', 'request', 'alert'] },
		user: { type: 'ObjectId', default: null, ref: 'User' },
		userEmail: { type: String, default: '' },
		messageBody: { type: String, default: '' },
		messageShort: { type: String, default: '' },
		messageTitle: { type: String, default: '' },
		emailBody: { type: String, default: '' },
		emailSubject: { type: String, default: '' },
		link: { type: String, default: '' },
		actions: [
			{
				actionCd: { type: String, default: '' },
				linkTitle: { type: String, default: '' },
				isDefault: { type: Boolean, default: false }
			}
		],
		emails: [
			{
				dateSent: { type: Date, default: null },
				isOk: { type: Boolean, default: false },
				error: {}
			}
		],
		emailSent: { type: Boolean, default: false },
		emailRetries: { type: Number, default: 0 },
		datePosted: { type: Date, default: null },
		date2Archive: { type: Date, default: null },
		dateArchived: { type: Date, default: null },
		dateViewed: { type: Date, default: null },
		dateActioned: { type: Date, default: null },
		actionTaken: { type: String, default: '' },
		isOpen: { type: Boolean, default: true }
	})
);
// -------------------------------------------------------------------------
//
// the message archive
//
// for purposes of audit etc
//
// -------------------------------------------------------------------------
export const MessageArchive: IMessageArchiveModel = model<IMessageArchiveDocument, IMessageArchiveModel>(
	'MessageArchive',
	new Schema({
		messageCd: { type: String },
		user: { type: 'ObjectId', ref: 'User' },
		userEmail: { type: String },
		messageBody: { type: String },
		messageShort: { type: String },
		messageTitle: { type: String },
		emailBody: { type: String },
		emailSubject: { type: String },
		link: { type: String },
		actions: [
			{
				actionCd: { type: String },
				linkTitle: { type: String, default: '' },
				isDefault: { type: Boolean }
			}
		],
		emails: [
			{
				dateSent: { type: Date, default: null },
				isOk: { type: Boolean, default: false },
				error: {}
			}
		],
		emailSent: { type: Boolean, default: false },
		emailRetries: { type: Number, default: 0 },
		datePosted: { type: Date, default: null },
		date2Archive: { type: Date },
		dateArchived: { type: Date },
		dateViewed: { type: Date },
		dateActioned: { type: Date },
		actionTaken: { type: String },
		isArchived: { type: Boolean, default: true }
	})
);
