const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/librechat';

async function setupModelRoles() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Setup 1: Create modelRoles collection with role config
    const modelRolesCollection = db.collection('modelRoles');

    // Example: financial role can only access financial and risk models from LEN-AI endpoint
    const financialRoleConfig = {
      role: 'financial_user',
      allowedEndpoints: ['custom', 'LEN-AI'],
      allowedModels: ['financial', 'risk'],
      modelMapping: {
        'custom': ['financial', 'risk'],
        'LEN-AI': ['financial', 'risk'],
      },
    };

    // Upsert the financial role config
    await modelRolesCollection.updateOne(
      { role: 'financial_user' },
      { $set: financialRoleConfig },
      { upsert: true }
    );
    console.log('✓ Created modelRoles config for financial_user');

    // Setup 2: Update user with zaini.hafid@gmail.com to have financial_user role
    const usersCollection = db.collection('users');
    const result = await usersCollection.updateOne(
      { email: 'zaini.hafid@gmail.com' },
      { $set: { role: 'financial_user' } }
    );

    if (result.matchedCount === 0) {
      console.log('⚠ User zaini.hafid@gmail.com not found');
      console.log('  Create user first or check email');
    } else {
      console.log('✓ Updated user zaini.hafid@gmail.com with financial_user role');
    }

    // Verify
    const user = await usersCollection.findOne({ email: 'zaini.hafid@gmail.com' });
    console.log('\n=== User (zaini.hafid@gmail.com) ===');
    console.log(JSON.stringify(user, null, 2));

    const roleConfig = await modelRolesCollection.findOne({ role: 'financial_user' });
    console.log('\n=== Role Config (financial_user) ===');
    console.log(JSON.stringify(roleConfig, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

setupModelRoles();
