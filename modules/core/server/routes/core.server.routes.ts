'use strict';

import * as config from '../../../../config/config';
import * as fileStream from '../../../../config/lib/filestream';
import { CoreController } from '../controllers/core.server.controller';

export class CoreRouter {

	private core = new CoreController();

	public setupRoutes = (app) => {

		// Define error pages
		app.route('/server-error').get(this.core.renderServerError);

		// Return a 404 for all undefined api, module or lib routes
		app.route('/:url(api|modules|lib)/*').get(this.core.renderNotFound);

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
				return fileStream(res, home + '/' + fileobj.path, fileobj.name, fileobj.type);
			} else {
				res.status(401).send({ message: 'No terms file found' });
			}
		});

		// Define application route
		app.route('/*').get(this.core.renderIndex);
	}
}
