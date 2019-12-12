'use strict';

import crypto from 'crypto';
import _ from 'lodash';
import { Document, Model, Schema } from 'mongoose';
import MongooseController from '../../../../config/lib/MongooseController';
import owasp from 'owasp-password-strength-test';
import validator from 'validator';
import config from '../../../../config/ApplicationConfig';
import { ICapabilityModel } from '../../../capabilities/server/models/CapabilityModel';
import { ICapabilitySkillModel } from '../../../capabilities/server/models/CapabilitySkillModel';
import CoreServerHelpers from '../../../core/server/controllers/CoreServerHelpers';
import { IUser } from '../../shared/IUserDTO';

export interface IUserModel extends IUser, Document {
	_id: string;
	id: string;
	capabilities: ICapabilityModel[];
	capabilitySkills: ICapabilitySkillModel[];
	findUniqueUsername(username: string, suffix: string, callback: any): string;
	hashPassword(password: string): string;
	authenticate(password: string): boolean;
	addRoles(roles: [string]): void;
	removeRoles(roles: [string]): void;
}

owasp.config(config.shared.owasp);

const EndorsementSchema = new Schema(
	{
		content: { type: String, default: '' },
		link: { type: String, default: '' },
		projectName: { type: String, default: '' },
		created: { type: Date, default: null },
		createdBy: { type: 'ObjectId', ref: 'User', default: null },
		updated: { type: Date, default: null },
		updatedBy: { type: 'ObjectId', ref: 'User', default: null }
	},
	{ usePushEach: true }
);

const UserCapabilitiesSchema = new Schema(
	{
		code: { type: String, default: '' },
		experience: { type: String, default: '' },
		years: { type: Number, default: 0 }
	},
	{ usePushEach: true }
);

const validateLocalStrategyEmail = function(email) {
	return (
		(this.provider !== 'local' && !this.updated) ||
		validator.isEmpty(email) ||
		validator.isEmail(email, { require_tld: false })
	);
};

// export interface IUser extends IUserDocument {
// 	hashPassword(password: string): string;
// 	authenticate(password: string): boolean;
// 	addRoles(roles: [string]): void;
// 	removeRoles(roles: [string]): void;
// }

export const UserSchema = new Schema(
	{
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
		displayName: { type: String, trim: true },
		email: {
			type: String,
			index: {
				unique: true,
				// For this to work on a previously indexed field, the index must be dropped & the application restarted.
				sparse: true
			},
			lowercase: true,
			trim: true,
			default: '',
			validate: [
				validateLocalStrategyEmail,
				'Please fill a valid email address'
			]
		},
		username: {
			type: String,
			unique: 'Username already exists',
			required: 'Please fill in a username',
			lowercase: true,
			trim: true
		},
		orgsAdmin: {
			type: [{ type: Schema.Types.ObjectId, ref: 'Org' }],
			default: [],
			index: true
		},
		orgsMember: {
			type: [{ type: Schema.Types.ObjectId, ref: 'Org' }],
			default: [],
			index: true
		},
		orgsPending: {
			type: [{ type: Schema.Types.ObjectId, ref: 'Org' }],
			default: [],
			index: true
		},
		password: { type: String, default: '' },
		salt: { type: String },
		profileImageURL: { type: String, default: 'img/default.png' },
		provider: { type: String, required: 'Provider is required' },
		government: { type: String, default: '' },
		isDisplayEmail: { type: Boolean, default: false },
		notifyOpportunities: { type: Boolean, default: false },
		subscribeOpportunitiesId: { type: String, default: null },
		convertedNotifications: { type: Boolean, default: false },
		notifyEvents: { type: Boolean, default: false },
		notifyBlogs: { type: Boolean, default: false },
		userTitle: { type: String, default: '' },
		providerData: {},
		additionalProvidersData: {},
		roles: {
			type: [{ type: String }],
			default: ['user'],
			required: 'Please provide at least one role'
		},
		updated: { type: Date },
		created: { type: Date, default: Date.now },
		/* For reset password */
		resetPasswordToken: { type: String },
		resetPasswordExpires: { type: Date },
		//
		// this is where we put the payment preferences for users who are developers
		// all of these need to be added to the field whitelists
		//
		isDeveloper: { type: Boolean, default: false },
		paymentMethod: {
			type: String,
			default: 'Cheque',
			enum: ['Cheque', 'Direct Deposit', 'PayPal']
		},
		businessName: { type: String, default: '' },
		businessAddress: { type: String, default: '' },
		businessAddress2: { type: String, default: '' },
		businessCity: { type: String, default: '' },
		businessProvince: {
			type: String,
			default: 'BC',
			enum: [
				'AB',
				'BC',
				'MB',
				'NB',
				'NL',
				'NT',
				'NS',
				'NU',
				'ON',
				'PE',
				'QC',
				'SK',
				'YT'
			]
		},
		businessCode: { type: String, default: '' },
		businessContactName: { type: String, default: '' },
		businessContactEmail: {
			type: String,
			default: '',
			trim: true,
			lowercase: true,
			validate: [
				validateLocalStrategyEmail,
				'Please fill a valid email address'
			]
		},
		businessContactPhone: { type: String, default: '' },
		address: { type: String, default: '' },
		phone: { type: String, default: '' },
		//
		// notifications based upon events
		//
		notifications: {
			update: { type: Schema.Types.ObjectId, ref: 'Notification' }
		},
		location: { type: String, default: '' },
		description: { type: String, default: '' },
		website: { type: String, default: '' },
		skills: [String],
		skillsData: {},
		badges: [String],
		endorsements: { type: [EndorsementSchema], default: [] },
		github: { type: String, default: '' },
		stackOverflow: { type: String, default: '' },
		stackExchange: { type: String, default: '' },
		linkedIn: { type: String, default: '' },
		isPublicProfile: { type: Boolean, default: false },
		isAutoAdd: { type: Boolean, default: true },
		capabilities: {
			type: [{ type: Schema.Types.ObjectId, ref: 'Capability' }],
			default: []
		},
		capabilitySkills: {
			type: [{ type: Schema.Types.ObjectId, ref: 'CapabilitySkill' }],
			default: []
		},
		capabilityDetails: { type: [UserCapabilitiesSchema], default: [] }
	},
	{ usePushEach: true }
);

/**
 * Hook a pre save method to hash the password
 */
UserSchema.pre('save', function(next) {
	const userSchema = this as IUserModel;
	if (userSchema.password && userSchema.isModified('password')) {
		userSchema.salt = crypto.randomBytes(16).toString('base64');
		userSchema.password = userSchema.hashPassword(userSchema.password);
	}

	next();
});

/**
 * Hook a pre validate method to test the local password
 */
UserSchema.pre('validate', function(next) {
	const userSchema = this as IUserModel;
	const devexProd = config.devexProd === 'true';
	if (
		userSchema.provider === 'local' &&
		userSchema.password &&
		userSchema.isModified('password') &&
		devexProd
	) {
		const result = owasp.test(userSchema.password);
		if (result.errors.length) {
			const error = result.errors.join(' ');
			userSchema.invalidate('password', error, null);
		}
	}

	next();
});

/**
 * Create instance method for hashing a password
 */
UserSchema.methods.hashPassword = function(password) {
	if (this.salt && password) {
		return crypto
			.pbkdf2Sync(
				password,
				Buffer.from(this.salt, 'base64'),
				10000,
				64,
				'SHA1'
			)
			.toString('base64');
	} else {
		return password;
	}
};

/**
 * Create instance method for authenticating user
 */
UserSchema.methods.authenticate = function(password) {
	return this.password === this.hashPassword(password);
};

// -------------------------------------------------------------------------
//
// add roles to a user, ensure unique
//
// -------------------------------------------------------------------------
UserSchema.methods.addRoles = function(roles) {
	this.roles = _.union(this.roles, roles);
	this.markModified('roles');
};
UserSchema.methods.removeRoles = function(roles) {
	_.each(roles, (role) => {
		roles = _.remove(this.roles, (v) => {
			return v === role;
		});
	});
	this.markModified('roles');
};

/**
 * Find possible not used username
 */
UserSchema.statics.findUniqueUsername = (username, suffix, callback) => {
	const possibleUsername = username.toLowerCase() + (suffix || '');

	UserModel.findOne(
		{
			username: possibleUsername
		},
		(err, user) => {
			if (!err) {
				if (!user) {
					callback(possibleUsername);
				} else {
					return UserModel.schema.statics.findUniqueUsername(
						username,
						(suffix || 0) + 1,
						callback
					);
				}
			} else {
				callback(null);
			}
		}
	);
};

export const UserModel: Model<IUserModel> = MongooseController.mongoose.model<IUserModel>('User', UserSchema);
