/**
 * Script untuk setup model restrictions via npm run command
 * Jalankan dari dalam LibreChat container
 */
const { MongoClient } = require('mongodb');

// Gunakan connection string dari environment atau default
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/LibreChat';

async function setupModelRestrictions() {
  let client;
  
  try {
    console.log('📝 Connecting to MongoDB...');
    console.log(`   URI: ${MONGO_URI}`);
    
    client = new MongoClient(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    
    await client.connect();
    console.log('✓ Connected to MongoDB\n');
    
    const db = client.db('LibreChat');
    
    // Step 1: Verify user exists
    console.log('📋 Step 1: Verifying user...');
    const userEmail = "zaini.hafid@gmail.com";
    const user = await db.collection('users').findOne({ email: userEmail });
    
    if (!user) {
      console.error(`✗ User not found: ${userEmail}`);
      process.exit(1);
    }
    
    console.log(`✓ Found user: ${user.name} (${user.email})`);
    console.log(`  Current role: ${user.role}\n`);
    
    // Step 2: Create/Update modelRoles collection
    console.log('📋 Step 2: Configuring model restrictions...');
    
    const roleRestriction = {
      role: user.role,
      allowedModels: ["financial"],
      disabledModels: ["risk", "LenO Bot"],
      description: `Model restrictions for ${user.role} role - zaini.hafid@gmail.com`,
      endpoints: ["custom"],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const modelRoleResult = await db.collection('modelRoles').updateOne(
      { role: user.role },
      { $set: roleRestriction },
      { upsert: true }
    );
    
    console.log(`✓ Model restriction configured`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Allowed Models: ${roleRestriction.allowedModels.join(', ')}`);
    console.log(`  Disabled Models: ${roleRestriction.disabledModels.join(', ')}\n`);
    
    // Step 3: Verify the configuration
    console.log('📋 Step 3: Verifying configuration...');
    const verification = await db.collection('modelRoles').findOne({ role: user.role });
    
    if (verification) {
      console.log(`✓ Configuration saved successfully!`);
      console.log(`  Allowed Models: ${verification.allowedModels.join(', ')}`);
      console.log(`  Description: ${verification.description}`);
    }
    
    console.log(`\n✨ Setup complete!`);
    console.log(`   User ${userEmail} can now only access: financial model`);
    console.log(`   Other models (risk, LenO Bot) are restricted`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    if (error.name === 'MongoServerSelectionError') {
      console.error('\n⚠️  MongoDB is not accessible from host.');
      console.error('   This script must be run from within the LibreChat container.');
      console.error('\n   Run this command instead:');
      console.error('   docker-compose exec api node setup_model_restrictions_docker.js');
    }
    process.exit(1);
    
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run setup
setupModelRestrictions();
