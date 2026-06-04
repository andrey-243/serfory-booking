import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('session')?.value
  if (!token) return NextResponse.json({ user: null }, { status: 401 })

  const session = await verifySession(token)
  if (!session) return NextResponse.json({ user: null }, { status: 401 })

  return NextResponse.json({ user: session })
}
