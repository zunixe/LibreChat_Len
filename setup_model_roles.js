const { MongoClient } = require('mongodb');

const mongoUrl = 'mongodb://chat-mongodb:27017/LibreChat';

async function setupModelRoles() {
  const client = new MongoClient(mongoUrl);
  
  try {
    await client.connect();
    const db = client.db('LibreChat');
    
    // Create the HC role
    const hcRole = {
      name: 'HC',
      permissions: {
        BOOKMARKS: { USE: true },
        PROMPTS: { USE: false },
        MEMORIES: { USE: false },
        AGENTS: { USE: false },
        MULTI_CONVO: { USE: false },
        TEMPORARY_CHAT: { USE: true },
        RUN_CODE: { USE: false },
        WEB_SEARCH: { USE: false },
        PEOPLE_PICKER: { VIEW_USERS: false, VIEW_GROUPS: false, VIEW_ROLES: false },
        MARKETPLACE: { USE: false },
        FILE_SEARCH: { USE: false },
        FILE_CITATIONS: { USE: false },
        MCP_SERVERS: { USE: false },
        REMOTE_AGENTS: { USE: false }
      },
      description: 'Health Check role - can only access financial models'
    };
    
    const roleResult = await db.collection('roles').updateOne(
      { name: 'HC' },
      { $set: hcRole },
      { upsert: true }
    );
    
    console.log('✓ HC role created/updated');
    
    // Create model-role mapping
    const modelRoleMapping = {
      role: 'HC',
      allowedModels: ['financial'],
      description: 'HC role can only access financial model'
    };
    
    const mappingResult = await db.collection('modelRoles').updateOne(
      { role: 'HC' },
      { $set: modelRoleMapping },
      { upsert: true }
    );
    
    console.log('✓ Model-role mapping created/updated');
    
    // Verify user has correct role
    const user = await db.collection('users').findOne({ email: 'zaini.hafid@gmail.com' });
    console.log('✓ User role:', user?.role);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

setupModelRoles();
