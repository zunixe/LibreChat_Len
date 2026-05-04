const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

const mongoUrl = process.env.MONGO_URI || 'mongodb://localhost:27017/LibreChat';
const email = "zaini.hafid@gmail.com";
const password = "YourPassword123";
const role = "HC";

async function updateUser() {
  const client = new MongoClient(mongoUrl);
  
  try {
    await client.connect();
    const db = client.db('LibreChat');
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const result = await db.collection('users').updateOne(
      { email: email },
      {
        $set: {
          name: 'Zaini Hafid',
          username: email,
          emailVerified: true,
          password: hashedPassword,
          provider: 'local',
          role: role,
          plugins: [],
          twoFactorEnabled: false,
          termsAccepted: false,
          personalization: { memories: true },
          backupCodes: [],
          refreshToken: [],
          favorites: [],
          updatedAt: new Date()
        }
      }
    );
    
    console.log('✓ User updated successfully');
    console.log('Modified:', result.modifiedCount);
    process.exit(0);
  } catch (error) {
    console.error('Error updating user:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

updateUser();
