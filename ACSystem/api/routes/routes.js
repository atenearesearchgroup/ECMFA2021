'use strict';
module.exports = function (app) {
  var ACControler = require('../controllers/acController');
  app.route('/acScript')
    .get(ACControler.get_script)

  app.route('/sendTemperature')
    .post(ACControler.sendTemperature)


};