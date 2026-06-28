import { NextRequest, NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'
import { verifyToken } from '../../../lib/auth'

const VALUE_FIELDS = ['name', 'cubicInchRate', 'volumetricWeightRate', 'airSurchargePercent', 'seaSurchargePercent']

function errorResponse(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status })
}

function requireAdmin(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'ADMIN') return null
  return payload
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value
    const payload = token ? verifyToken(token) : null
    if (!payload) return NextResponse.json({ values: [] })

    const values = await prisma.valueRate.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ values })
  } catch (error) {
    console.error('GET /api/values error:', error)
    return errorResponse('Internal server error')
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!requireAdmin(req)) return errorResponse('unauthorized', 401)

    const body = await req.json()
    const payload: Record<string, unknown> = {}
    for (const field of VALUE_FIELDS) {
      if (body[field] !== undefined) payload[field] = body[field]
    }

    const value = await prisma.valueRate.create({ data: payload as any })
    return NextResponse.json({ value })
  } catch (error) {
    console.error('POST /api/values error:', error)
    return errorResponse('Internal server error')
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!requireAdmin(req)) return errorResponse('unauthorized', 401)

    const body = await req.json()
    const id = Number(body.id)
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const payload: Record<string, unknown> = {}
    for (const field of VALUE_FIELDS) {
      if (body[field] !== undefined) payload[field] = body[field]
    }

    const value = await prisma.valueRate.update({
      where: { id },
      data: payload as any,
    })

    return NextResponse.json({ value })
  } catch (error) {
    console.error('PATCH /api/values error:', error)
    return errorResponse('Internal server error')
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!requireAdmin(req)) return errorResponse('unauthorized', 401)

    const body = await req.json()
    const id = Number(body.id)
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    await prisma.valueRate.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/values error:', error)
    return errorResponse('Internal server error')
  }
}
