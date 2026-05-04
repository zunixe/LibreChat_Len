const { MongoClient } = require('mongodb');

const mongoUrl = process.env.MONGO_URI || 'mongodb://localhost:27017/LibreChat';
const userEmail = "zaini.hafid@gmail.com";
const userRole = "HC";
const allowedModels = ["financial"]; // Only financial model

async function setupModelRestrictions() {
  const client = new MongoClient(mongoUrl);
  
  try {
    await client.connect();
    const db = client.db('LibreChat');
    
    // Create/update the modelRoles collection entry for HC role
    const result = await db.collection('modelRoles').updateOne(
      { role: userRole },
      {
        $set: {
          role: userRole,
          allowedModels: allowedModels,
          description: `Model restrictions for ${userRole} role`,
          updatedAt: new Date()
        }
      },
      { upsert: true } // Create if doesn't exist
    );
    
    console.log('✓ Model restriction configured');
    console.log(`✓ Role: ${userRole}`);
    console.log(`✓ Allowed Models: ${allowedModels.join(', ')}`);
    console.log(`✓ User Email: ${userEmail}`);
    console.log(`✓ Matched: ${result.matchedCount}`);
    console.log(`✓ Modified/Upserted: ${result.upsertedId ? 'Created' : 'Updated'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Error setting up model restrictions:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

setupModelRestrictions();
