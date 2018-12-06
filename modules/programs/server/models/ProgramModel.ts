'use strict';

import { model, Model, Schema } from 'mongoose';
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

ProgramSchema.statics.findUniqueCode = (title, suffix, callback) => {
	const possible =
		'pro-' +
		title
			.toLowerCase()
			.replace(/\W/g, '-')
			.replace(/-+/, '-') +
		(suffix || '');

	this.findOne(
		{
			code: possible
		},
		(err, user) => {
			if (!err) {
				if (!user) {
					callback(possible);
				} else {
					return this.findUniqueCode(title, (suffix || 0) + 1, callback);
				}
			} else {
				callback(null);
			}
		}
	);
};

const ProgramModel: IProgramModel = model<IProgramDocument, IProgramModel>('Program', ProgramSchema);

export default ProgramModel;
