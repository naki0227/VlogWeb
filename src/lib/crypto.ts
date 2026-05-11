// Web Crypto API でのパスフレーズハッシュ（bcryptの代わり、Edge Runtime対応）
// PBKDF2: ブルートフォース耐性あり、Edge Runtimeで動く

const ITERATIONS = 100_000
const SALT_LEN = 16

export async function hashPassphrase(passphrase: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN))
  const key = await deriveKey(passphrase, salt)
  const saltHex = Buffer.from(salt).toString('hex')
  const keyHex = Buffer.from(key).toString('hex')
  return `${saltHex}:${keyHex}`
}

export async function verifyPassphrase(passphrase: string, hash: string): Promise<boolean> {
  const [saltHex, keyHex] = hash.split(':')
  if (!saltHex || !keyHex) return false
  const salt = new Uint8Array(Buffer.from(saltHex, 'hex'))
  const key = await deriveKey(passphrase, salt)
  return Buffer.from(key).toString('hex') === keyHex
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new Uint8Array(salt), iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  )
}
