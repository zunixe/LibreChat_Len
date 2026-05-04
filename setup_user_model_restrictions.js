const { MongoClient } = require('mongodb');

const mongoUrl = process.env.MONGO_URI || 'mongodb://localhost:27017/LibreChat';

async function setupUserModelRestrictions() {
  const client = new MongoClient(mongoUrl);
  
  try {
    await client.connect();
    const db = client.db('LibreChat');
    
    console.log('📝 Setting up model restrictions for zaini.hafid@gmail.com...\n');
    
    // Step 1: Update user's role to ensure consistency
    const userEmail = "zaini.hafid@gmail.com";
    const userResult = await db.collection('users').findOne({ email: userEmail });
    
    if (!userResult) {
      console.error('✗ User not found with email:', userEmail);
      process.exit(1);
    }
    
    console.log(`✓ Found user: ${userResult.name} (${userResult.email})`);
    console.log(`  Current role: ${userResult.role}`);
    
    // Step 2: Create/Update modelRoles restriction
    const roleRestriction = {
      role: "HC",
      allowedModels: ["financial"],
      description: "Restricted to financial model only",
      endpoints: ["custom:LEN-AI"],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const modelRoleResult = await db.collection('modelRoles').updateOne(
      { role: "HC" },
      { $set: roleRestriction },
      { upsert: true }
    );
    
    console.log(`\n✓ Model restriction configured for HC role`);
    console.log(`  Allowed Models: ${roleRestriction.allowedModels.join(', ')}`);
    console.log(`  Endpoints: ${roleRestriction.endpoints.join(', ')}`);
    console.log(`  Action: ${modelRoleResult.upsertedId ? 'Created' : 'Updated'}`);
    
    // Step 3: Verify the configuration
    const verification = await db.collection('modelRoles').findOne({ role: "HC" });
    
    if (verification) {
      console.log(`\n✓ Verification successful!`);
      console.log(`  Configuration in database:`);
      console.log(`  - Role: ${verification.role}`);
      console.log(`  - Allowed Models: ${verification.allowedModels.join(', ')}`);
    }
    
    console.log(`\n✨ Configuration complete! User restrictions applied.`);
    console.log(`   User ${userEmail} can now only access: financial model`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error setting up model restrictions:', error.message);
    console.error('Details:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

setupUserModelRestrictions();
