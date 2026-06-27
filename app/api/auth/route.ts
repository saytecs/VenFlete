import { NextRequest, NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'
import { signToken, verifyToken } from '../../../lib/auth'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const email = body?.email
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  // determine role
  const role = email === 'nestormachado70@gmail.com' ? 'ADMIN' : 'CLIENT'

  // upsert user
  const user = await prisma.user.upsert({
    where: { email },
    update: { name: body.name || undefined },
    create: { email, name: body.name || '', role }
  })

  const token = signToken({ id: user.id, email: user.email, role: user.role })

  const res = NextResponse.json({ user: { id: user.id, email: user.email, role: user.role } })
  res.cookies.set('token', token, { httpOnly: true, path: '/' })
  return res
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  if (!token) return NextResponse.json({ user: null })
  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ user: null })
  const user = await prisma.user.findUnique({ where: { id: payload.id } })
  return NextResponse.json({ user: user ? { id: user.id, email: user.email, role: user.role } : null })
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('token')
  return res
}
