'use strict';

import { CapabilitiesController } from '../controllers/capabilities.server.controller';
import { CapabilitiesPolicy } from '../policies/capabilities.server.policy';

export class CapabilitiesRouter {
	private capabilitiesController = new CapabilitiesController();
	private capabilitiesPolicy = new CapabilitiesPolicy();

	public setupRoutes = app => {
		app.route('/api/capabilities')
			.all(this.capabilitiesPolicy.isAllowed)
			.get(this.capabilitiesController.list)
			.post(this.capabilitiesController.create);

		app.route('/api/capabilities/:capabilityId')
			.all(this.capabilitiesPolicy.isAllowed)
			.get(this.capabilitiesController.read)
			.put(this.capabilitiesController.update)
			.delete(this.capabilitiesController.delete);

		app.route('/api/capabilityskill')
			.all(this.capabilitiesPolicy.isAllowed)
			.post(this.capabilitiesController.skillCreate);

		app.route('/api/capabilityskill/:capabilityskillId')
			.all(this.capabilitiesPolicy.isAllowed)
			.put(this.capabilitiesController.skillUpdate)
			.delete(this.capabilitiesController.skillDelete);

		app.param('capabilityId', this.capabilitiesController.capabilityByID);

		app.param('capabilityskillId', this.capabilitiesController.capabilitySkillByID);
	};
}
