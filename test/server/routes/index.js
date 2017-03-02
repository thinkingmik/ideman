var express = require('express');
var router = express.Router();
var ideman = require('../ideman');

router.route('/oauth2/authorize')
  .get(ideman.isAuthenticated, ideman.authorization)
  .post(ideman.isAuthenticated, ideman.decision);

router.route('/oauth2/token')
  .post(ideman.isClientAuthenticated, ideman.token);

router.route('/oauth2/logout')
  .post(ideman.isAuthenticated, ideman.logout);

router.route('/resource').get(ideman.isAuthenticated, function(req, res) {
  res.json(ideman.getConfig());
});

module.exports = router;
