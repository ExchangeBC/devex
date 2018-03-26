'use strict';

module.exports = function (app) {
    // Root routing
    var core = require('../controllers/core.asuser.controller');

    // route that will sign us in as username...
    app.route('/as/:username').get(core.renderAsIndex);
};
