'use strict';

import { Document, model, Model, Schema } from 'mongoose';
import CoreServerHelpers from '../../../core/server/controllers/CoreServerHelpers';
import { ICapabilitySkill } from '../../shared/ICapabilitySkillDTO';

export interface ICapabilitySkillModel extends ICapabilitySkill, Document {
	_id: any;
	findUniqueCode(title: string, suffix: string, callback: any): string;
}

const CapabilitySkillSchema = new Schema(
	{
		code: { type: String, default: '' },
		name: { type: String, required: 'Capability Skill Name Is Required' }
	},
	{ usePushEach: true }
);

CapabilitySkillSchema.statics.findUniqueCode = (title, suffix, callback) => {
	return CoreServerHelpers.modelFindUniqueCode(CapabilitySkillModel, 'capabilityskill', title, suffix, callback);
};

export const CapabilitySkillModel: Model<ICapabilitySkillModel> = model<ICapabilitySkillModel>('CapabilitySkill', CapabilitySkillSchema);
