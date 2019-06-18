'use strict';

import ProgramsServerController from '../controllers/ProgramsServerController';
import ProgramsPolicy from '../policies/ProgramsPolicy';

class ProgramsRouter {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: ProgramsRouter;

	private constructor() {
		ProgramsPolicy.invokeRolesPolicies();
	}

	public setupRoutes = app => {
		// Programs collection routes
		app.route('/api/programs')
			.all(ProgramsPolicy.isAllowed)
			.get(ProgramsServerController.list)
			.post(ProgramsServerController.create);

		// Single program routes
		app.route('/api/programs/:programId')
			.all(ProgramsPolicy.isAllowed)
			.get(ProgramsServerController.read)
			.put(ProgramsServerController.update)
			.delete(ProgramsServerController.delete);

		app.route('/api/myadmin/programs')
			.all(ProgramsPolicy.isAllowed)
			.get(ProgramsServerController.getMyAdminPrograms);

		//
		// get lists of users
		//
		app.route('/api/programs/members/:programId').get(ProgramsServerController.listMembers);
		app.route('/api/programs/requests/:programId')
			.all(ProgramsPolicy.isAllowed)
			.get(ProgramsServerController.listRequests);

		//
		// modify users
		//
		app.route('/api/programs/requests/confirm/:programId/:userId')
			.all(ProgramsPolicy.isAllowed)
			.get(ProgramsServerController.confirmMember);
		app.route('/api/programs/requests/deny/:programId/:userId')
			.all(ProgramsPolicy.isAllowed)
			.get(ProgramsServerController.denyMember);

		app.route('/api/new/program').get(ProgramsServerController.new);

		app.route('/api/request/program/:programId').get(ProgramsServerController.request);

		//
		// upload logo
		//
		app.route('/api/upload/logo/program/:programId')
			.all(ProgramsPolicy.isAllowed)
			.post(ProgramsServerController.logo);

		// Finish by binding the program middleware
		app.param('programId', ProgramsServerController.programByID);
	};
}

export default ProgramsRouter.getInstance();
