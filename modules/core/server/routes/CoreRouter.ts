'use strict';

import config from '../../../../config/ApplicationConfig';
import FileStream from '../../../../config/lib/FileStream';
import CoreServerController from '../controllers/CoreServerController';

class CoreRouter {
	public static getInstance() {
		return this.instance || (this.instance = new this());
	}

	private static instance: CoreRouter;

	private fileStream: FileStream = new FileStream();

	private constructor() {}

	public setupRoutes = app => {
		// Define error pages
		app.route('/server-error').get(CoreServerController.renderServerError);

		// Return a 404 for all undefined api, module or lib routes
		app.route('/:url(api|modules|lib)/*').get(CoreServerController.renderNotFound);

		app.route('/home').get((req, res) => {
			res.set('location', 'https://bcdevexchange.org');
			res.status(301).send();
		});
		app.route('/developers').get((req, res) => {
			res.set('location', 'https://bcdevexchange.org/codewithus');
			res.status(301).send();
		});

		// Define route for downloading terms
		app.route('/terms/:version').get((req, res) => {
			const version = req.params.version;
			const fileobj = config.terms[version];
			const home = config.home;
			if (fileobj) {
				return this.fileStream.stream(res, home + '/' + fileobj.path, fileobj.name, fileobj.type);
			} else {
				res.status(401).send({ message: 'No terms file found' });
			}
		});

		// Define recaptcha verification route
		app.route('/newsletter/verify').post(CoreServerController.verifyNotABot);

		// Define newsletter registration route
		app.route('/newsletter/register')
			.post(CoreServerController.saveNewsletterEmail)
			.delete(CoreServerController.removeNewsletterSub);

		// Define application route
		app.route('/*').get(CoreServerController.renderIndex);
	};
}

export default CoreRouter.getInstance();
