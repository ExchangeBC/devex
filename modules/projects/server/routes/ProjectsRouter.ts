'use strict';

import ProjectsController from '../controllers/ProjectsServerController';
import ProjectsPolicy from '../policies/ProjectsPolicy';

class ProjectsRouter {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: ProjectsRouter;

	private constructor() {
		ProjectsPolicy.invokeRolesPolicies();
	}

	public setupRoutes = app => {
		// Projects Routes
		app.route('/api/projects')
			.all(ProjectsPolicy.isAllowed)
			.get(ProjectsController.list)
			.post(ProjectsController.create);

		app.route('/api/projects/:projectId')
			.all(ProjectsPolicy.isAllowed)
			.get(ProjectsController.read)
			.put(ProjectsController.update)
			.delete(ProjectsController.delete);

		app.route('/api/myadmin/projects')
			.all(ProjectsPolicy.isAllowed)
			.get(ProjectsController.getMyAdminProjects);

		//
		// projects for program
		//
		app.route('/api/projects/for/program/:programId').get(ProjectsController.getProjectForPrograms);

		//
		// get lists of users
		//
		app.route('/api/projects/members/:projectId').get(ProjectsController.listMembers);
		app.route('/api/projects/requests/:projectId')
			.all(ProjectsPolicy.isAllowed)
			.get(ProjectsController.listRequests);

		//
		// modify users
		//
		app.route('/api/projects/requests/confirm/:projectId/:userId')
			.all(ProjectsPolicy.isAllowed)
			.get(ProjectsController.confirmMember);
		app.route('/api/projects/requests/deny/:projectId/:userId')
			.all(ProjectsPolicy.isAllowed)
			.get(ProjectsController.denyMember);

		app.route('/api/new/project').get(ProjectsController.new);

		app.route('/api/request/project/:projectId').get(ProjectsController.request);

		// Finish by binding the Project middleware
		app.param('projectId', ProjectsController.projectByID);
	};
}

export default ProjectsRouter.getInstance();
