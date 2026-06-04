import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const teacherId = searchParams.get('teacherId')

  if (!teacherId) {
    return NextResponse.json({ error: 'teacherId is required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('teacher_availability')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('day_of_week')
    .order('start_time')

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 })
  }

  return NextResponse.json({ availability: data })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { teacher_id, availability } = body

  if (!teacher_id || !Array.isArray(availability)) {
    return NextResponse.json({ error: 'teacher_id and availability[] are required' }, { status: 400 })
  }

  // Remplace toutes les dispos du prof d'un coup
  const { error: deleteError } = await supabaseAdmin
    .from('teacher_availability')
    .delete()
    .eq('teacher_id', teacher_id)

  if (deleteError) {
    return NextResponse.json({ error: 'Failed to reset availability' }, { status: 500 })
  }

  if (availability.length === 0) {
    return NextResponse.json({ availability: [] })
  }

  const rows = availability.map((a: { day_of_week: number; start_time: string; end_time: string }) => ({
    teacher_id,
    day_of_week: a.day_of_week,
    start_time: a.start_time,
    end_time: a.end_time,
  }))

  const { data, error } = await supabaseAdmin
    .from('teacher_availability')
    .insert(rows)
    .select()

  if (error) {
    return NextResponse.json({ error: 'Failed to save availability' }, { status: 500 })
  }

  return NextResponse.json({ availability: data }, { status: 201 })
}
