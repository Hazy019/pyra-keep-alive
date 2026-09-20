/**
 * Crypto helpers for the web API layer — shared implementation with the worker.
 * Thin re-export so call-sites in Next.js route handlers use the same functions.
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
        '[crypto] WARNING: ENCRYPTION_KEY is not set in environment. Using fallback development key. Set ENCRYPTION_KEY in .env.local for production.',
      )
      keyB64 = DEV_FALLBACK_KEY_B64
    } else {
      throw new Error('ENCRYPTION_KEY environment variable is not set')
    }
  }
  const key = Buffer.from(keyB64, 'base64')
  if (key.length !== 32) throw new Error('ENCRYPTION_KEY must be exactly 32 bytes (base64-encoded)')
  return key
}

/** Encrypts a plaintext auth header string. Returns base64. */
export function encryptAuthHeader(plaintext: string): string {
  const key = getMasterKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

/** Decrypts a base64 blob back to the plaintext auth header. */
export function decryptAuthHeader(encryptedB64: string): string {
  const key = getMasterKey()
  const buf = Buffer.from(encryptedB64, 'base64')
  if (buf.length < IV_LENGTH + AUTH_TAG_LENGTH) throw new Error('Invalid encrypted blob')
  const iv = buf.subarray(0, IV_LENGTH)
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const ciphertext = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH)
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}
