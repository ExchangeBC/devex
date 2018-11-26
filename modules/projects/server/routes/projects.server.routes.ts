'use strict';

import { ProjectsController } from '../controllers/projects.server.controller';
import { ProjectsPolicy } from '../policies/projects.server.policy';

export class ProjectsRouter {
	private projectsPolicy = new ProjectsPolicy();
	private projectController = new ProjectsController();

	public setupRoutes = app => {
		// Projects Routes
		app.route('/api/projects')
			.all(this.projectsPolicy.isAllowed)
			.get(this.projectController.list)
			.post(this.projectController.create);

		app.route('/api/projects/:projectId')
			.all(this.projectsPolicy.isAllowed)
			.get(this.projectController.read)
			.put(this.projectController.update)
			.delete(this.projectController.delete);

		app.route('/api/my/projects')
			.all(this.projectsPolicy.isAllowed)
			.get(this.projectController.my);
		app.route('/api/myadmin/projects')
			.all(this.projectsPolicy.isAllowed)
			.get(this.projectController.myadmin);

		//
		// projects for program
		//
		app.route('/api/projects/for/program/:programId').get(this.projectController.getProjectForPrograms);

		//
		// get lists of users
		//
		app.route('/api/projects/members/:projectId').get(this.projectController.listMembers);
		app.route('/api/projects/requests/:projectId')
			.all(this.projectsPolicy.isAllowed)
			.get(this.projectController.listRequests);

		//
		// modify users
		//
		app.route('/api/projects/requests/confirm/:projectId/:userId')
			.all(this.projectsPolicy.isAllowed)
			.get(this.projectController.confirmMember);
		app.route('/api/projects/requests/deny/:projectId/:userId')
			.all(this.projectsPolicy.isAllowed)
			.get(this.projectController.denyMember);

		app.route('/api/new/project').get(this.projectController.new);

		app.route('/api/request/project/:projectId').get(this.projectController.request);

		// Finish by binding the Project middleware
		app.param('projectId', this.projectController.projectByID);
	};
}
