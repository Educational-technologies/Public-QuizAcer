const path = require('path'); // path 
const fs = require('fs'); // fs allows for file opening 
const crypto = require('crypto'); // api for encyrpting 

var encryptionKey = null; // key == null

function getEncryptionKey() { // gets the key from the files
  return new Promise((resolve, reject) => { // makes a new promiss (just like calllback)
    if (encryptionKey == null) {
      fs.readFile(path.join(__dirname, '..', '..', '..', 'EncryptionKey.key'), 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading file:', err);
          reject(err);
          return;
        }
        encryptionKey = data;
        resolve(encryptionKey);
      });
    } else {
      resolve(encryptionKey);
    }
  });
} // this doesn't matter 

function encryptData(text, key) {  // encyrpts data 
  return "Redacted";
}

function decryptData(encryptedData, key) { // decrypts data 
  return "Redacted"; 
}

module.exports = { // exports the functions 
  getEncryptionKey,
  encryptData,
  decryptData
};
