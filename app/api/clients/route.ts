import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import prisma from '../../../lib/prisma'
import { verifyToken } from '../../../lib/auth'

const STATUS_VALUES = ['PENDING', 'DISPATCHED', 'DELIVERED'] as const

type Status = (typeof STATUS_VALUES)[number]

function parseStatus(value: unknown): Status {
  if (typeof value === 'string' && STATUS_VALUES.includes(value as Status)) {
    return value as Status
  }
  return 'PENDING'
}

function errorResponse(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value
    const payload = token ? verifyToken(token) : null
    if (!payload) return NextResponse.json({ clients: [] })

    if (payload.role === 'ADMIN') {
      const clients = await prisma.client.findMany({
        orderBy: { createdAt: 'desc' },
        include: { items: { select: { id: true } } },
      })

      return NextResponse.json({
        clients: clients.map((client) => ({
          id: client.id,
          email: client.email,
          name: client.name,
          guideNumber: client.guideNumber,
          lockerDate: client.lockerDate.toISOString(),
          status: client.status,
          itemsCount: client.items.length,
          createdAt: client.createdAt.toISOString(),
        })),
      })
    }

    const client = await prisma.client.findUnique({
      where: { email: payload.email },
      include: { items: { select: { id: true } } },
    })

    if (!client) return NextResponse.json({ clients: [] })

    return NextResponse.json({
      clients: [{
        id: client.id,
        email: client.email,
        name: client.name,
        guideNumber: client.guideNumber,
        lockerDate: client.lockerDate.toISOString(),
        status: client.status,
        itemsCount: client.items.length,
        createdAt: client.createdAt.toISOString(),
      }],
    })
  } catch (error) {
    console.error('GET /api/clients error:', error)
    return errorResponse('Internal server error')
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value
    const payload = token ? verifyToken(token) : null
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const body = await req.json()
    const email = body.email?.toString().trim()
    const guideNumber = body.guideNumber?.toString().trim()
    const lockerDateValue = body.lockerDate?.toString().trim()
    const status = parseStatus(body.status)

    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })
    if (!guideNumber) return NextResponse.json({ error: 'guide number required' }, { status: 400 })

    const lockerDate = lockerDateValue ? new Date(lockerDateValue) : new Date()
    if (Number.isNaN(lockerDate.getTime())) {
      return NextResponse.json({ error: 'lockerDate must be a valid date' }, { status: 400 })
    }

    try {
      const client = await prisma.client.create({
        data: {
          email,
          name: body.name?.toString().trim() || null,
          guideNumber,
          lockerDate,
          status,
        },
      })

      return NextResponse.json({
        client: {
          id: client.id,
          email: client.email,
          name: client.name,
          guideNumber: client.guideNumber,
          lockerDate: client.lockerDate.toISOString(),
          status: client.status,
          itemsCount: 0,
          createdAt: client.createdAt.toISOString(),
        },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return NextResponse.json({ error: 'El email ya existe' }, { status: 409 })
        }
      }
      console.error('POST /api/clients error:', error)
      return errorResponse('Internal server error')
    }
  } catch (error) {
    console.error('POST /api/clients error:', error)
    return errorResponse('Internal server error')
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value
    const payload = token ? verifyToken(token) : null
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const body = await req.json()
    const id = Number(body.id)
    if (!id) return NextResponse.json({ error: 'client id required' }, { status: 400 })

    const updateData: Record<string, unknown> = {}
    if (body.email) updateData.email = body.email.toString().trim()
    if (body.name !== undefined) updateData.name = body.name?.toString().trim() || null
    if (body.guideNumber) updateData.guideNumber = body.guideNumber.toString().trim()
    if (body.lockerDate) {
      const lockerDate = new Date(body.lockerDate.toString().trim())
      if (Number.isNaN(lockerDate.getTime())) {
        return NextResponse.json({ error: 'lockerDate must be a valid date' }, { status: 400 })
      }
      updateData.lockerDate = lockerDate
    }
    if (body.status) updateData.status = parseStatus(body.status)

    const client = await prisma.client.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      client: {
        id: client.id,
        email: client.email,
        name: client.name,
        guideNumber: client.guideNumber,
        lockerDate: client.lockerDate.toISOString(),
        status: client.status,
        itemsCount: await prisma.item.count({ where: { clientId: client.id } }),
        createdAt: client.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('PATCH /api/clients error:', error)
    return errorResponse('Internal server error')
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value
    const payload = token ? verifyToken(token) : null
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const body = await req.json()
    const id = Number(body.id)
    if (!id) return NextResponse.json({ error: 'client id required' }, { status: 400 })

    await prisma.client.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/clients error:', error)
    return errorResponse('Internal server error')
  }
}
