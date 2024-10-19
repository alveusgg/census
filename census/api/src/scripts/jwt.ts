import { HMAC } from 'oslo/crypto';

const key = Buffer.from(await new HMAC('SHA-256').generateKey()).toString('hex');
console.log(`Add this to your .env file:\nJWT_SECRET=${key}`);
