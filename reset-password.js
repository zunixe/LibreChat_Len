const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/LibreChat';

async function resetPassword() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Password hash for "@Zaini123"
    const passwordHash = '$2a$10$BC950vdj3cWsUYWD8dHS2ebrLWoaLhX2d5in5BlajZJ1R5gVb2kt.';

    const result = await usersCollection.updateOne(
      { email: 'zunixe@gmail.com' },
      { $set: { password: passwordHash } }
    );

    if (result.matchedCount === 0) {
      console.log('❌ User zunixe@gmail.com not found');
    } else if (result.modifiedCount === 0) {
      console.log('⚠ User found but password not modified (maybe same value)');
    } else {
      console.log('✓ Password reset successfully');
      console.log('  Email: zunixe@gmail.com');
      console.log('  New password: @Zaini123');
    }

    // Verify
    const user = await usersCollection.findOne({ email: 'zunixe@gmail.com' });
    console.log('\n=== User Info ===');
    console.log('Email:', user?.email);
    console.log('Role:', user?.role);
    console.log('Password hash set: ' + (user?.password ? '✓' : '✗'));

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

resetPassword();
