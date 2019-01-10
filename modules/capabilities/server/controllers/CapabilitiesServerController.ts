'use strict';

import { NextFunction, Request, Response } from 'express';
import _ from 'lodash';
import { Document, Types } from 'mongoose';
import CoreServerErrors from '../../../core/server/controllers/CoreServerErrors';
import { CapabilityModel, ICapabilityModel } from '../models/CapabilityModel';
import { CapabilitySkillModel, ICapabilitySkillModel } from '../models/CapabilitySkillModel';

class CapabilitiesServerController {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: CapabilitiesServerController;

	private constructor() {
		this.create = this.create.bind(this);
		this.delete = this.delete.bind(this);
		this.skillCreate = this.skillCreate.bind(this);
		this.skillDelete = this.skillDelete.bind(this);
	}

	// Create a new capability.
	public create(req: Request, res: Response): void {
		const capability = new CapabilityModel(req.body);

		// set the code, this is used for setting roles and other stuff
		CapabilityModel.schema.statics.findUniqueCode(capability.name, null, (newcode: string) => {
			capability.code = newcode;

			// save
			this.saveDocument(capability, res);
		});
	};

	// Create a new capability skill.
	public skillCreate(req: Request, res: Response): void {
		const capabilitySkill = new CapabilitySkillModel(req.body);

		// set the code, this is used for setting roles and other stuff
		CapabilitySkillModel.schema.statics.findUniqueCode(capabilitySkill.name, null, (newcode: string) => {
			capabilitySkill.code = newcode;

			// save
			this.saveDocument(capabilitySkill, res);
		});
	};

	// This just takes the already queried object and pass it back
	public read(req: Request, res: Response) {
		res.json(req.capability);
	};

	// Update a capability
	public async update(req: Request, res: Response): Promise<void> {
		try {
			const capInfo = req.body;
			let updatedCapability = await CapabilityModel.findOneAndUpdate({ code: capInfo.code }, capInfo, { new: true });
			updatedCapability = await updatedCapability.populate('skills').execPopulate();
			res.json(updatedCapability);
		} catch (error) {
			res.status(422).send({
				message: CoreServerErrors.getErrorMessage(error)
			});
		}
	};

	// Update a skill
	public async skillUpdate(req: Request, res: Response): Promise<void> {
		try {
			const skillInfo = req.body;
			const updatedSkill = await CapabilitySkillModel.findOneAndUpdate({ code: skillInfo.code }, skillInfo, { new: true });
			res.json(updatedSkill);
		} catch (error) {
			res.status(422).send({
				message: CoreServerErrors.getErrorMessage(error)
			});
		}
	};

	// Delete a capability
	public async delete(req: Request, res: Response): Promise<void> {
		const capability = req.capability;
		this.deleteDocument(capability, res);
	};

	// Delete a skill
	public async skillDelete(req: Request, res: Response): Promise<void> {
		const capabilitySkill = req.capabilitySkill;
		this.deleteDocument(capabilitySkill, res);
	};

	// Return a list of all capabilities
	public async list(req: Request, res: Response): Promise<void> {
		try {
			const capabilities = await CapabilityModel.find({})
				.populate('skills')
				.exec();
			res.json(capabilities);
		} catch (error) {
			res.status(422).send({
				message: CoreServerErrors.getErrorMessage(error)
			});
		}
	}

	// Return a capability by id
	public async capabilityByID(req: Request, res: Response, next: NextFunction, id: string): Promise<void> {
		try {
			let capability: ICapabilityModel;
			if (Types.ObjectId.isValid(id)) {
				capability = await CapabilityModel.findById(id)
					.populate('skills')
					.exec();
			} else {
				capability = await CapabilityModel.findOne({ code: id })
					.populate('skills')
					.exec();
			}

			if (!capability) {
				res.status(404).send({
					message: 'No capability with that identifier has been found'
				});
			} else {
				req.capability = capability;
				next();
			}
		} catch (error) {
			next(error);
		}
	}

	// Get a skill by id
	public async capabilitySkillByID(req: Request, res: Response, next: NextFunction, id: string): Promise<void> {
		try {
			let capabilitySkill: ICapabilitySkillModel;
			if (Types.ObjectId.isValid(id)) {
				capabilitySkill = await CapabilitySkillModel.findById(id).exec();
			} else {
				capabilitySkill = await CapabilitySkillModel.findOne({ code: id }).exec();
			}

			if (!capabilitySkill) {
				res.status(404).send({
					message: 'No capabilitySkill with that identifier has been found'
				});
			} else {
				req.capabilitySkill = capabilitySkill;
				next();
			}
		} catch (error) {
			next(error);
		}
	}

	private async saveDocument(document: Document, res: Response): Promise<void> {
		try {
			const savedDocument = await document.save();
			res.json(savedDocument);
		} catch (error) {
			res.status(422).send({
				message: CoreServerErrors.getErrorMessage(error)
			});
		}
	}

	private async deleteDocument(document: Document, res: Response): Promise<void> {
		try {
			const removedDocument = await document.remove();
			res.json(removedDocument);
		} catch (error) {
			res.status(422).send({
				message: CoreServerErrors.getErrorMessage(error)
			});
		}
	}
}

export default CapabilitiesServerController.getInstance();
