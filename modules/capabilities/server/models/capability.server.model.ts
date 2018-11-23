'use strict';

import { model, Model, Schema } from 'mongoose';
import { CoreHelpers } from '../../../core/server/controllers/core.server.helpers';
import { ICapabilityDocument } from '../interfaces/ICapabilityDocument';
import { ICapabilitySkillDocument } from '../interfaces/ICapabilitySkillDocument';

const helpers = new CoreHelpers();

export interface ICapabilitySkillModel extends Model<ICapabilitySkillDocument> {
	findUniqueCode(title: string, suffix: string, callback: any): string;
}

const CapabilitySkillSchema = new Schema(
	{
		code: { type: String, default: '' },
		name: { type: String, required: 'Capability Skill Name Is Required' }
	},
	{ usePushEach: true }
);

export interface ICapabilityModel extends Model<ICapabilityDocument> {
	findUniqueCode(title: string, suffix: string, callback: any): string;
}

const CapabilitySchema = new Schema(
	{
		code: { type: String, default: '' },
		name: { type: String, required: 'Capability Name Is Required' },
		description: { type: String, default: '' },
		skills: {
			type: [{ type: Schema.Types.ObjectId, ref: 'CapabilitySkill' }],
			default: []
		},
		isRequired: { type: Boolean, default: true },
		isInception: { type: Boolean, default: true },
		isPrototype: { type: Boolean, default: true },
		isImplementation: { type: Boolean, default: true },
		//
		// for UI purposes
		//
		labelClass: { type: String, default: '' }
	},
	{ usePushEach: true }
);

CapabilitySchema.statics.findUniqueCode = function(title, suffix, callback) {
	return helpers.modelFindUniqueCode(
		this,
		'capability',
		title,
		suffix,
		callback
	);
};
CapabilitySkillSchema.statics.findUniqueCode = function(
	title,
	suffix,
	callback
) {
	return helpers.modelFindUniqueCode(
		this,
		'capabilityskill',
		title,
		suffix,
		callback
	);
};

model('Capability', CapabilitySchema);
model('CapabilitySkill', CapabilitySkillSchema);

export const Capability: ICapabilityModel =
	model<ICapabilityDocument, ICapabilityModel>('Capability', CapabilitySchema);

export const CapabilitySkill: ICapabilitySkillModel =
	model<ICapabilitySkillDocument, ICapabilitySkillModel>('CapabilitySkill', CapabilitySkillSchema);
