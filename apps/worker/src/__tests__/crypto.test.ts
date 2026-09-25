import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { encryptAuthHeader, decryptAuthHeader } from '../crypto.js'

describe('Worker Auth Header Crypto', () => {
  const originalKey = process.env['ENCRYPTION_KEY']

  beforeEach(() => {
    // 32 zero-bytes in base64: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
    process.env['ENCRYPTION_KEY'] = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
  })

  afterEach(() => {
    if (originalKey !== undefined) {
      process.env['ENCRYPTION_KEY'] = originalKey
    } else {
      delete process.env['ENCRYPTION_KEY']
    }
  })

  it('successfully encrypts and decrypts auth headers (round-trip)', async () => {
    const secret = 'Bearer pyra_super_secret_token_12345'
    const encrypted = encryptAuthHeader(secret)

    expect(encrypted).not.toBe(secret)
    expect(typeof encrypted).toBe('string')

    const decrypted = await decryptAuthHeader(encrypted)
    expect(decrypted).toBe(secret)
  })

  it('produces unique ciphertexts for identical plaintext due to random IVs', async () => {
    const secret = 'Bearer my_token'
    const enc1 = encryptAuthHeader(secret)
    const enc2 = encryptAuthHeader(secret)

    expect(enc1).not.toBe(enc2)

    expect(await decryptAuthHeader(enc1)).toBe(secret)
    expect(await decryptAuthHeader(enc2)).toBe(secret)
  })

  it('rejects tampered ciphertexts with authentication tag failure', async () => {
    const secret = 'Bearer valid_token'
    const encrypted = encryptAuthHeader(secret)

    const buf = Buffer.from(encrypted, 'base64')
    // Flip a bit in the ciphertext portion
    const lastByte = buf[buf.length - 1] ?? 0
    buf[buf.length - 1] = lastByte ^ 0x01
    const tampered = buf.toString('base64')

    await expect(decryptAuthHeader(tampered)).rejects.toThrow()
  })

  it('rejects malformed payloads that are too short to contain IV and Tag', async () => {
    const tooShort = Buffer.from('short').toString('base64')
    await expect(decryptAuthHeader(tooShort)).rejects.toThrow(/too short/i)
  })
})
