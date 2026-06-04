export type SessionPayload = {
  email: string
  role: 'admin' | 'teacher'
  teacherId: string | null
  name: string
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is not set')
  return secret
}

async function hmac(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await globalThis.crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await globalThis.crypto.subtle.sign('HMAC', key, enc.encode(data))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function b64url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function fromB64url(str: string): string {
  return atob(str.replace(/-/g, '+').replace(/_/g, '/'))
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
  const body = b64url(JSON.stringify({ ...payload, exp }))
  const sig = await hmac(getSecret(), `${header}.${body}`)
  return `${header}.${body}.${sig}`
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const [header, body, sig] = token.split('.')
    if (!header || !body || !sig) return null

    const expected = await hmac(getSecret(), `${header}.${body}`)
    if (sig !== expected) return null

    const payload = JSON.parse(fromB64url(body))
    if (payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload as SessionPayload
  } catch {
    return null
  }
}
