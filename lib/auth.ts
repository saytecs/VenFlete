import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'dev_jwt_secret'

type AuthPayload = {
  id: number
  email: string
  role: 'ADMIN' | 'CLIENT'
}

export function signToken(payload: AuthPayload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, SECRET)
    if (!decoded || typeof decoded === 'string' || typeof decoded !== 'object') return null

    const idValue = (decoded as Record<string, unknown>).id
    const emailValue = (decoded as Record<string, unknown>).email
    const roleValue = (decoded as Record<string, unknown>).role

    const id = typeof idValue === 'number'
      ? idValue
      : typeof idValue === 'string' && /^\\d+$/.test(idValue)
        ? Number(idValue)
        : undefined

    if (!id || typeof emailValue !== 'string') return null
    if (roleValue !== 'ADMIN' && roleValue !== 'CLIENT') return null

    return { id, email: emailValue, role: roleValue }
  } catch {
    return null
  }
}
