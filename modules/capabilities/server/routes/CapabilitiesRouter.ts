'use strict';

import CapabilitiesController from '../controllers/CapabilitiesServerController';
import CapabilitiesPolicy from '../policies/CapabilitiesPolicy';

class CapabilitiesRouter {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: CapabilitiesRouter;

	private constructor() {
		CapabilitiesPolicy.invokeRolesPolicies();
	}

	public setupRoutes = app => {
		app.route('/api/capabilities')
			.all(CapabilitiesPolicy.isAllowed)
			.get(CapabilitiesController.list)
			.post(CapabilitiesController.create);

		app.route('/api/capabilities/:capabilityId')
			.all(CapabilitiesPolicy.isAllowed)
			.get(CapabilitiesController.read)
			.put(CapabilitiesController.update)
			.delete(CapabilitiesController.delete);

		app.route('/api/capabilityskill')
			.all(CapabilitiesPolicy.isAllowed)
			.post(CapabilitiesController.skillCreate);

		app.route('/api/capabilityskill/:capabilityskillId')
			.all(CapabilitiesPolicy.isAllowed)
			.put(CapabilitiesController.skillUpdate)
			.delete(CapabilitiesController.skillDelete);

		app.param('capabilityId', CapabilitiesController.capabilityByID);

		app.param('capabilityskillId', CapabilitiesController.capabilitySkillByID);
	};
}

export default CapabilitiesRouter.getInstance();
