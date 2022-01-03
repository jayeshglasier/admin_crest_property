const crypto = require('crypto');

const algorithm = 'aes-256-ctr'; // aes-256-ctr or aes-256-cbc
const secretKey = process.env.SECRET_KEY2; // 32 character
const iv = crypto.randomBytes(16);

const encrypt = (id) => {
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(id), cipher.final()]);
    return {
        key: iv.toString('hex'),
        id: encrypted.toString('hex')
    };
};

const decrypt = (key, id) => {
    const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(key, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(id, 'hex')), decipher.final()]);
    return decrypted.toString();
};

module.exports = {
    encrypt,
    decrypt
};
