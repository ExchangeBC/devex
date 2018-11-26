'use strict';

import { Model, model, Schema } from 'mongoose';
import { IProjectDocument } from '../interfaces/IProjectDocument';

export interface IProjectModel extends Model<IProjectDocument> {
	findUniqueCode(title: string, suffix: string, callback: any): string;
}

const ProjectSchema = new Schema(
	{
		code: { type: String, default: '' },
		name: {
			type: String,
			default: '',
			required: 'Please fill the project name',
			trim: true
		},
		short: {
			type: String,
			default: '',
			required: 'Please complete the project short description',
			trim: true
		},
		description: {
			type: String,
			default: '',
			required: 'Please complete the project description',
			trim: true
		},
		github: {
			type: String,
			default: '',
			trim: true
		},
		isPublished: { type: Boolean, default: false },
		wasPublished: { type: Boolean, default: false },
		created: {
			type: Date,
			default: Date.now
		},
		createdBy: {
			type: 'ObjectId',
			ref: 'User',
			default: null
		},
		updated: {
			type: Date,
			default: Date.now
		},
		updatedBy: {
			type: 'ObjectId',
			ref: 'User',
			default: null
		},
		program: {
			type: Schema.Types.ObjectId,
			ref: 'Program',
			required: 'Please select a program'
		},
		user: {
			type: Schema.Types.ObjectId,
			ref: 'User'
		},
		activity: { type: Number, default: 1 },
		tags: [String]
	},
	{ usePushEach: true }
);

ProjectSchema.statics.findUniqueCode = (title, suffix, callback) => {
	const possible =
		'prj-' +
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

export const Project: IProjectModel = model<IProjectDocument, IProjectModel>('Project', ProjectSchema);

export default Project;
