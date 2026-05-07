const express = require('express');
const users = require('./users');
const roles = require('./roles');

const router = express.Router();

router.use('/users', users);
router.use('/roles', roles);

module.exports = router;
