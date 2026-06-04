import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const subject = searchParams.get('subject')

  let query = getSupabaseAdmin()
    .from('teachers')
    .select('id, name, email, subjects, photo_url, google_calendar_id, created_at')
    .order('name')

  if (subject) {
    query = query.contains('subjects', [subject])
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 })
  }

  return NextResponse.json({ teachers: data })
}
