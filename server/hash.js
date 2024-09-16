'use strict';

const crypto = require('crypto');

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    
    const salt = crypto.randomBytes(16).toString('hex');  // Generate a salt (16 bytes is a common length)

    // Hash the password with the generated salt
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);

      // Convert the derived key to a hex string for storage
      const hashedPassword = derivedKey.toString('hex');

      // Return the salt and hashed password
      resolve({ salt, hashedPassword });
    });
  });
}

// Create hashed password
hashPassword('pwd')
  .then(({ salt, hashedPassword }) => {
    console.log('Salt:', salt);
    console.log('Hashed Password:', hashedPassword);
  })
  .catch(err => console.error('Error during hashing:', err));
