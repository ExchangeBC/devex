'use strict';

import { model, Model, Schema } from 'mongoose';
import CoreServerHelpers from '../../../core/server/controllers/CoreServerHelpers';
import IProgramDocument from '../interfaces/IProgramDocument';

interface IProgramModel extends Model<IProgramDocument> {
	findUniqueCode(title: string, suffix: string, callback: any): string;
}

const ProgramSchema = new Schema(
	{
		code: { type: String, default: '' },
		title: { type: String, default: '', required: 'Title cannot be blank' },
		short: { type: String, default: '', required: 'Short description cannot be blank' },
		description: { type: String, default: '' },
		owner: { type: String, default: '' },
		website: { type: String, default: '' },
		logo: { type: String, default: 'modules/core/client/img/logo/avatar-2.png' },
		tags: [String],
		isPublished: { type: Boolean, default: false },
		created: { type: Date, default: null },
		createdBy: { type: 'ObjectId', ref: 'User', default: null },
		updated: { type: Date, default: null },
		updatedBy: { type: 'ObjectId', ref: 'User', default: null }
	},
	{ usePushEach: true }
);

ProgramSchema.statics.findUniqueCode = function(title, suffix, callback) {
	return CoreServerHelpers.modelFindUniqueCode(this, 'pro', title, suffix, callback);
}

const ProgramModel: IProgramModel = model<IProgramDocument, IProgramModel>('Program', ProgramSchema);

export default ProgramModel;
