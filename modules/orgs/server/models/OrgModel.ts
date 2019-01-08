'use strict';

import { Document, Model, model, Schema } from 'mongoose';
import { IOrg } from '../../shared/IOrgDTO';

export interface IOrgModel extends IOrg, Document {
	_id: any;
	capabilities: any[];
}

const InvitedNonUserSchema = new Schema({
	email: { type: String, default: '' }
});

const OrgSchema = new Schema(
	{
		name: { type: String, default: '', required: 'Name cannot be blank' },
		dba: { type: String, default: '' },
		address: { type: String, default: '' },
		address2: { type: String, default: '' },
		city: { type: String, default: '' },
		province: { type: String, default: 'BC' },
		postalcode: { type: String, default: '' },
		businessNumber: { type: String, default: '' },
		businessJurisdiction: { type: String, default: '' },
		fullAddress: { type: String, default: '' },
		contactName: { type: String, default: '' },
		contactEmail: {
			type: String,
			default: '',
			trim: true,
			lowercase: true
		},
		contactPhone: { type: String, default: '' },
		description: { type: String, default: '' },
		website: { type: String, default: '' },
		orgImageURL: { type: String, default: 'img/default.png' },
		skills: [String],
		badges: [String],
		capabilities: {
			type: [{ type: Schema.Types.ObjectId, ref: 'Capability' }],
			default: []
		},
		capabilitySkills: {
			type: [{ type: Schema.Types.ObjectId, ref: 'CapabilitySkill' }],
			default: []
		},
		metRFQ: { type: Boolean, default: false },
		isCapable: { type: Boolean, default: false },
		isAcceptedTerms: { type: Boolean, default: false },
		owner: { type: Schema.Types.ObjectId, ref: 'User', default: null },
		created: { type: Date, default: null },
		createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
		updated: { type: Date, default: null },
		updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
		members: {
			type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
			default: []
		},
		admins: {
			type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
			default: []
		},
		invited: [String],
		invitedUsers: {
			type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
			default: []
		},
		invitedNonUsers: { type: [InvitedNonUserSchema], default: [] }
	},
	{ usePushEach: true }
);

OrgSchema.pre('save', function(next) {
	const orgSchema = this as IOrgModel;
	orgSchema.fullAddress =
		orgSchema.address +
		(orgSchema.address2 ? ', ' + orgSchema.address2 : '') +
		', ' +
		orgSchema.city +
		', ' +
		orgSchema.province +
		', ' +
		orgSchema.postalcode;
	next();
});

export const OrgModel: Model<IOrgModel> = model<IOrgModel>('Org', OrgSchema);
