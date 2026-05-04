const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

const email = "zaini.hafid@gmail.com";
const password = "YourPassword123"; // Ganti dengan password yang diinginkan
const role = "HC";

const hashedPassword = bcrypt.hashSync(password, 10);

const mongoUrl = 'mongodb://chat-mongodb:27017/LibreChat';

async function addUser() {
  const client = new MongoClient(mongoUrl);
  
  try {
    await client.connect();
    const db = client.db('LibreChat');
    
    const result = await db.collection('users').insertOne({
      email: email,
      password: hashedPassword,
      role: role,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✓ User created successfully with ID:', result.insertedId);
    process.exit(0);
  } catch (error) {
    console.error('Error creating user:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

addUser();