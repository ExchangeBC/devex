'use strict';

import * as projects from '../controllers/projects.server.controller';
import { ProjectsPolicy } from '../policies/projects.server.policy';

export class ProjectsRouter {
	private projectsPolicy = new ProjectsPolicy();

	constructor(app) {
		this.init(app);
	}

	private init = app => {
		// Projects Routes
		app.route('/api/projects')
			.all(this.projectsPolicy.isAllowed)
			.get(projects.list)
			.post(projects.create);

		app.route('/api/projects/:projectId')
			.all(this.projectsPolicy.isAllowed)
			.get(projects.read)
			.put(projects.update)
			.delete(projects.delete);

		app.route('/api/my/projects')
			.all(this.projectsPolicy.isAllowed)
			.get(projects.my);
		app.route('/api/myadmin/projects')
			.all(this.projectsPolicy.isAllowed)
			.get(projects.myadmin);

		//
		// projects for program
		//
		app.route('/api/projects/for/program/:programId').get(
			projects.forProgram
		);

		//
		// get lists of users
		//
		app.route('/api/projects/members/:projectId').get(projects.listMembers);
		app.route('/api/projects/requests/:projectId')
			.all(this.projectsPolicy.isAllowed)
			.get(projects.listRequests);

		//
		// modify users
		//
		app.route('/api/projects/requests/confirm/:projectId/:userId')
			.all(this.projectsPolicy.isAllowed)
			.get(projects.confirmMember);
		app.route('/api/projects/requests/deny/:projectId/:userId')
			.all(this.projectsPolicy.isAllowed)
			.get(projects.denyMember);

		app.route('/api/new/project').get(projects.new);

		app.route('/api/request/project/:projectId').get(projects.request);

		// Finish by binding the Project middleware
		app.param('projectId', projects.projectByID);
	}
}
