const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/LibreChat';

async function deleteUser() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    const userId = '69e984e3349d87204aad28e7';

    const result = await usersCollection.deleteOne({
      _id: new mongoose.Types.ObjectId(userId)
    });

    if (result.deletedCount === 0) {
      console.log('❌ User not found or already deleted');
    } else {
      console.log('✓ User deleted successfully');
      console.log('  Email: zaini.hafid@gmail.com');
      console.log('  Role: HC');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

deleteUser();
