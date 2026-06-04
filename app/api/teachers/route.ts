import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const subject = searchParams.get('subject')
  const teachingLang = searchParams.get('teachingLang')

  let query = getSupabaseAdmin()
    .from('teachers')
    .select('id, name, email, subjects, photo_url, google_photo_url, google_calendar_id, title, teaching_languages, levels, experience_years, created_at')
    .order('name')

  if (subject) {
    query = query.contains('subjects', [subject])
  }
  if (teachingLang) {
    query = query.contains('teaching_languages', [teachingLang])
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 })
  }

  return NextResponse.json({ teachers: data })
}
