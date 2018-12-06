'use strict';

import _ from 'lodash';
import mongoose from 'mongoose';
import CoreServerErrors from '../../../core/server/controllers/CoreServerErrors';
import CapabilityModel from '../models/CapabilityModel';
import CapabilitySkillModel from '../models/CapabilitySkillModel';

class CapabilitiesServerController {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: CapabilitiesServerController;

	private constructor() {}

	// Create a new capability.
	public create = (req, res) => {
		const capability = new CapabilityModel(req.body);
		//
		// set the code, this is used for setting roles and other stuff
		//
		CapabilityModel.findUniqueCode(capability.name, null, newcode => {
			capability.code = newcode;
			//
			// save and return
			//
			capability.save(err => {
				if (err) {
					return res.status(422).send({
						message: CoreServerErrors.getErrorMessage(err)
					});
				} else {
					res.json(capability);
				}
			});
		});
	};

	// Create a new capability skill.
	public skillCreate = (req, res) => {
		const capabilitySkill = new CapabilitySkillModel(req.body);
		//
		// set the code, this is used for setting roles and other stuff
		//
		CapabilitySkillModel.findUniqueCode(capabilitySkill.name, null, newcode => {
			capabilitySkill.code = newcode;
			//
			// save and return
			//
			capabilitySkill.save(err => {
				if (err) {
					return res.status(422).send({
						message: CoreServerErrors.getErrorMessage(err)
					});
				} else {
					res.json(capabilitySkill);
				}
			});
		});
	};

	// This just takes the already queried object and pass it back
	public read = (req, res) => {
		res.json(req.capability);
	};

	// Update a capability
	public update = (req, res) => {
		// copy over everything passed in. This will overwrite the
		// audit fields, but they get updated in the following step
		const capability = _.assign(req.capability, req.body);
		capability.markModified('skills');

		capability.save(err => {
			if (err) {
				return res.status(422).send({
					message: CoreServerErrors.getErrorMessage(err)
				});
			} else {
				res.json(capability);
			}
		});
	};

	// Update a skill
	public skillUpdate = (req, res) => {
		//
		// copy over everything passed in. This will overwrite the
		// audit fields, but they get updated in the following step
		//
		const capabilitySkill = _.assign(req.capabilitySkill, req.body);
		//
		// save
		//
		capabilitySkill.save(err => {
			if (err) {
				return res.status(422).send({
					message: CoreServerErrors.getErrorMessage(err)
				});
			} else {
				res.json(capabilitySkill);
			}
		});
	};

	// Delete a capability
	public delete = (req, res) => {
		const capability = req.capability;
		capability.remove(err => {
			if (err) {
				return res.status(422).send({
					message: CoreServerErrors.getErrorMessage(err)
				});
			} else {
				res.json(capability);
			}
		});
	};

	// Delete a skill
	public skillDelete = (req, res) => {
		const capabilitySkill = req.capabilitySkill;
		capabilitySkill.remove(err => {
			if (err) {
				return res.status(422).send({
					message: CoreServerErrors.getErrorMessage(err)
				});
			} else {
				res.json(capabilitySkill);
			}
		});
	};

	// Return a list of all capabilities
	public list = (req, res) => {
		CapabilityModel.find({})
			.populate('skills')
			.exec((err, capabilities) => {
				if (err) {
					return res.status(422).send({
						message: CoreServerErrors.getErrorMessage(err)
					});
				} else {
					res.json(capabilities);
				}
			});
	};

	// Return a capability by id
	public capabilityByID = (req, res, next, id) => {
		const callback = (err, capability) => {
			if (err) {
				return next(err);
			} else if (!capability) {
				return res.status(404).send({
					message: 'No capability with that identifier has been found'
				});
			} else {
				req.capability = capability;
				return next();
			}
		};
		if (mongoose.Types.ObjectId.isValid(id)) {
			CapabilityModel.findById(id)
				.populate('skills')
				.exec(callback);
		} else {
			CapabilityModel.findOne({ code: id })
				.populate('skills')
				.exec(callback);
		}
	};

	// Get a skill by id
	public capabilitySkillByID = (req, res, next, id) => {
		const callback = (err, capabilitySkill) => {
			if (err) {
				return next(err);
			} else if (!capabilitySkill) {
				return res.status(404).send({
					message: 'No capabilitySkill with that identifier has been found'
				});
			} else {
				req.capabilitySkill = capabilitySkill;
				return next();
			}
		};
		if (mongoose.Types.ObjectId.isValid(id)) {
			CapabilitySkillModel.findById(id).exec(callback);
		} else {
			CapabilitySkillModel.findOne({ code: id }).exec(callback);
		}
	};
}

export default CapabilitiesServerController.getInstance();
