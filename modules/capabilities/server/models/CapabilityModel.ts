'use strict';

import { model, Model, Schema } from 'mongoose';
import CoreServerHelpers from '../../../core/server/controllers/CoreServerHelpers';
import ICapabilityDocument from '../interfaces/ICapabilityDocument';

interface ICapabilityModel extends Model<ICapabilityDocument> {
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

CapabilitySchema.statics.findUniqueCode = function(title, suffix, callback) {
	return CoreServerHelpers.modelFindUniqueCode(this, 'capability', title, suffix, callback);
};

const CapabilityModel: ICapabilityModel = model<ICapabilityDocument, ICapabilityModel>('Capability', CapabilitySchema);

export default CapabilityModel;
