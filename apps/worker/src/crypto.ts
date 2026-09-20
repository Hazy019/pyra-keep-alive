/**
 * Envelope encryption for target auth headers.
 *
 * Algorithm: AES-256-GCM with a random 12-byte IV per encryption.
 * The master key is read from `ENCRYPTION_KEY` (base64-encoded 32 bytes).
 *
 * Format of encrypted blob: [12 bytes IV][16 bytes auth tag][N bytes ciphertext]
 * Stored as base64 in the database (bytea column, base64-encoded by the app).
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

// 32-byte deterministic fallback key for local development only
const DEV_FALLBACK_KEY_B64 = 'k7Vb+O6gB1E9YvL+X0u3p2W8y5N7r4T1c9Q6M2Z8v5I='

function getMasterKey(): Buffer {
  let keyB64 = process.env['ENCRYPTION_KEY']?.trim()
  if (!keyB64) {
    if (process.env['NODE_ENV'] !== 'production') {
      console.warn(
        '[crypto] WARNING: ENCRYPTION_KEY is not set in environment. Using fallback development key.',
      )
      keyB64 = DEV_FALLBACK_KEY_B64
    } else {
      throw new Error('ENCRYPTION_KEY environment variable is not set')
    }
  }
  const key = Buffer.from(keyB64, 'base64')
  if (key.length !== 32) {
    throw new Error(`ENCRYPTION_KEY must be 32 bytes (256 bits); got ${key.length} bytes`)
  }
  return key
}

/**
 * Encrypts a plaintext string (the auth header value).
 * Returns a base64-encoded blob containing IV + auth tag + ciphertext.
 */
export function encryptAuthHeader(plaintext: string): string {
  const key = getMasterKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

/**
 * Decrypts a base64-encoded blob (as stored in `targets.auth_header_encrypted`).
 * Returns the plaintext auth header value.
 */
export async function decryptAuthHeader(encryptedB64: string): Promise<string> {
  const key = getMasterKey()
  const buf = Buffer.from(encryptedB64, 'base64')

  if (buf.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Encrypted blob is too short to be valid')
  }

  const iv = buf.subarray(0, IV_LENGTH)
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const ciphertext = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return decrypted.toString('utf8')
}
