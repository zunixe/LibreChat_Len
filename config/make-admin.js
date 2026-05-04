const path = require('path');
require('module-alias')({ base: path.resolve(__dirname, '..', 'api') });
const mongoose = require('mongoose');
const { User } = require('@librechat/data-schemas').createModels(mongoose);
const connect = require('./connect');

const makeAdmin = async () => {
  try {
    const email = process.argv[2];
    if (!email) {
      console.log('Usage: node make-admin.js <email>');
      process.exit(1);
    }

    await connect();
    const user = await User.findOneAndUpdate(
      { email },
      { role: 'ADMIN' },
      { new: true }
    );

    if (user) {
      console.log(`User ${email} is now ADMIN`);
    } else {
      console.log(`User ${email} not found`);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

makeAdmin();
