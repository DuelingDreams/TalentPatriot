import crypto from 'crypto';

/**
 * Encryption utilities for storing sensitive OAuth tokens
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits for GCM
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits

/**
 * Derive encryption key from APP_JWT_SECRET
 */
function deriveKey(secret: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(secret, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt a string value (like refresh_token)
 * Returns base64-encoded string with format: salt.iv.tag.ciphertext
 */
export function encryptToken(plaintext: string): string {
  if (!process.env.APP_JWT_SECRET) {
    throw new Error('APP_JWT_SECRET environment variable is required for encryption');
  }

  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Derive encryption key from secret
  const key = deriveKey(process.env.APP_JWT_SECRET, salt);
  
  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  // Encrypt
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  // Get auth tag
  const tag = cipher.getAuthTag();
  
  // Return format: salt.iv.tag.ciphertext (all base64)
  return [
    salt.toString('base64'),
    iv.toString('base64'),
    tag.toString('base64'),
    encrypted
  ].join('.');
}

/**
 * Decrypt an encrypted token string
 * Expects format: salt.iv.tag.ciphertext
 */
export function decryptToken(encrypted: string): string {
  if (!process.env.APP_JWT_SECRET) {
    throw new Error('APP_JWT_SECRET environment variable is required for decryption');
  }

  try {
    // Parse encrypted string
    const parts = encrypted.split('.');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted token format');
    }

    const [saltB64, ivB64, tagB64, ciphertext] = parts;
    
    const salt = Buffer.from(saltB64, 'base64');
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    
    // Derive decryption key
    const key = deriveKey(process.env.APP_JWT_SECRET, salt);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt
    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error: any) {
    console.error('Decryption error:', error.message);
    throw new Error('Failed to decrypt token');
  }
}

/**
 * Validate that encryption is properly configured
 */
export function validateEncryptionConfig(): void {
  if (!process.env.APP_JWT_SECRET) {
    throw new Error('APP_JWT_SECRET must be set for token encryption');
  }
  
  if (process.env.APP_JWT_SECRET.length < 32) {
    throw new Error('APP_JWT_SECRET must be at least 32 characters for secure encryption');
  }
}
