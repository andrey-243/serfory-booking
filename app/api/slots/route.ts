import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAvailableSlots } from '@/lib/google-calendar'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const teacherId = searchParams.get('teacherId')
  const weekStart = searchParams.get('weekStart')

  if (!teacherId || !weekStart) {
    return NextResponse.json({ error: 'teacherId and weekStart are required' }, { status: 400 })
  }

  const { data: teacher, error } = await supabaseAdmin
    .from('teachers')
    .select('google_refresh_token, google_calendar_id')
    .eq('id', teacherId)
    .single()

  if (error || !teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
  }

  if (!teacher.google_refresh_token) {
    return NextResponse.json({ slots: [] })
  }

  const { data: availabilities } = await supabaseAdmin
    .from('teacher_availability')
    .select('*')
    .eq('teacher_id', teacherId)

  try {
    const slots = await getAvailableSlots(
      teacher.google_refresh_token,
      teacher.google_calendar_id || 'primary',
      new Date(weekStart),
      availabilities ?? []
    )
    return NextResponse.json({ slots })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 })
  }
}
