const express = require('express');
const users = require('./users');
const roles = require('./roles');
const endpointDefinitions = require('./endpointDefinitions');

const router = express.Router();

router.use('/users', users);
router.use('/roles', roles);
router.use('/endpoint-definitions', endpointDefinitions);

module.exports = router;
