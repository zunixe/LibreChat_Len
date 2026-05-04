#!/bin/bash
# Script untuk setup model restrictions via mongosh dalam Docker container

docker exec chat-mongodb mongosh --eval "
db = db.getSiblingDB('LibreChat');

// Update atau buat entry modelRoles untuk role HC
const result = db.modelRoles.updateOne(
  { role: 'HC' },
  {
    \$set: {
      role: 'HC',
      allowedModels: ['financial'],
      description: 'Restricted to financial model only',
      endpoints: ['custom:LEN-AI'],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  },
  { upsert: true }
);

print('✓ Model restriction configured for HC role');
print('  Allowed Models: financial');
print('  User: zaini.hafid@gmail.com');
print('  Action: ' + (result.upsertedId ? 'Created' : 'Updated'));

// Verify
const verification = db.modelRoles.findOne({ role: 'HC' });
if (verification) {
  print('✓ Verification successful!');
  print('  Configuration:');
  print('  - Role: ' + verification.role);
  print('  - Allowed Models: ' + verification.allowedModels.join(', '));
}
"
