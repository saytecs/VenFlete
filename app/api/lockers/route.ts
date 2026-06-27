import { NextRequest, NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'
import { verifyToken } from '../../../lib/auth'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload) return NextResponse.json({ lockers: [] })

  if (payload.role === 'ADMIN') {
    const lockers = await prisma.item.findMany({
      orderBy: { createdAt: 'desc' },
      include: { client: { select: { id: true, email: true } } },
    })
    return NextResponse.json({ lockers })
  }

  const client = await prisma.client.findUnique({
    where: { email: payload.email },
  })

  if (!client) return NextResponse.json({ lockers: [] })

  const lockers = await prisma.item.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: 'desc' },
    include: { client: { select: { id: true, email: true } } },
  })
  return NextResponse.json({ lockers })
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json()
  const id = Number(body.id)
  if (!id) return NextResponse.json({ error: 'locker id required' }, { status: 400 })

  let clientId: number | undefined = body.clientId ? Number(body.clientId) : undefined
  if (!clientId && body.clientEmail) {
    const client = await prisma.client.findUnique({ where: { email: body.clientEmail.toString().trim() } })
    clientId = client?.id
  }

  if (!clientId) return NextResponse.json({ error: 'clientId or valid clientEmail required' }, { status: 400 })

  const locker = await prisma.item.update({
    where: { id },
    data: {
      trackingNumber: body.trackingNumber,
      description: body.description,
      length: body.length,
      width: body.width,
      height: body.height,
      weight: body.weight,
      volume: body.volume,
      isAir: body.isAir !== undefined ? !!body.isAir : undefined,
      isSea: body.isSea !== undefined ? !!body.isSea : undefined,
      clientId,
    },
  })

  return NextResponse.json({ locker })
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json()
  const id = Number(body.id)
  if (!id) return NextResponse.json({ error: 'locker id required' }, { status: 400 })

  await prisma.item.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json()
  let clientId: number | undefined = body.clientId ? Number(body.clientId) : undefined
  if (!clientId && body.clientEmail) {
    const client = await prisma.client.findUnique({ where: { email: body.clientEmail.toString().trim() } })
    clientId = client?.id
  }

  if (!clientId) return NextResponse.json({ error: 'clientId or valid clientEmail required' }, { status: 400 })

  const locker = await prisma.item.create({
    data: {
      trackingNumber: body.trackingNumber,
      description: body.description,
      length: body.length,
      width: body.width,
      height: body.height,
      weight: body.weight,
      volume: body.volume,
      isAir: !!body.isAir,
      isSea: !!body.isSea,
      clientId,
    },
  })

  return NextResponse.json({ locker })
}
