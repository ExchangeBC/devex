'use strict';

import { model, Model, Schema } from 'mongoose';
import CoreServerHelpers from '../../../core/server/controllers/CoreServerHelpers';
import ICapabilitySkillDocument from '../interfaces/ICapabilitySkillDocument';

interface ICapabilitySkillModel extends Model<ICapabilitySkillDocument> {
	findUniqueCode(title: string, suffix: string, callback: any): string;
}

const CapabilitySkillSchema = new Schema(
	{
		code: { type: String, default: '' },
		name: { type: String, required: 'Capability Skill Name Is Required' }
	},
	{ usePushEach: true }
);

CapabilitySkillSchema.statics.findUniqueCode = function(title, suffix, callback) {
	return CoreServerHelpers.modelFindUniqueCode(this, 'capabilityskill', title, suffix, callback);
};

const CapabilitySkillModel: ICapabilitySkillModel = model<ICapabilitySkillDocument, ICapabilitySkillModel>('CapabilitySkill', CapabilitySkillSchema);

export default CapabilitySkillModel;
