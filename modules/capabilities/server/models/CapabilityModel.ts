'use strict';

import { Document, Model, Schema } from 'mongoose';
import MongooseController from '../../../../config/lib/MongooseController';
import CoreServerHelpers from '../../../core/server/controllers/CoreServerHelpers';
import { ICapability } from '../../shared/ICapabilityDTO';

export interface ICapabilityModel extends ICapability, Document {
	_id: any;
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
		labelClass: { type: String, default: '' }
	},
	{ usePushEach: true }
);

CapabilitySchema.statics.findUniqueCode = (title, suffix, callback) => {
	return CoreServerHelpers.modelFindUniqueCode(CapabilityModel, 'capability', title, suffix, callback);
};

export const CapabilityModel: Model<ICapabilityModel> = MongooseController.mongoose.model<ICapabilityModel>('Capability', CapabilitySchema);
