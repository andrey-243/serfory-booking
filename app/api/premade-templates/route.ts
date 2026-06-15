import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifySession } from '@/lib/session'

// GET /api/premade-templates?teacherId=<id>
export async function GET(req: NextRequest) {
  const teacherId = req.nextUrl.searchParams.get('teacherId')
  if (!teacherId) return NextResponse.json({ error: 'teacherId required' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('premade_templates')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  return NextResponse.json({ templates: data || [] })
}

// POST /api/premade-templates
// Body: { name, subject, teaching_language, target_levels, duration_min, session_names, session_default_time }
export async function POST(req: NextRequest) {
  const session = await verifySession(req.cookies.get('session')?.value ?? '')
  if (!session || session.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, subject, teaching_language, target_levels = [], duration_min = 60, session_names = [], session_default_time = '14:00' } = body

  if (!name?.trim() || !subject || !session_names.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('premade_templates')
    .insert({
      teacher_id: session.teacherId,
      name: name.trim(),
      subject,
      teaching_language,
      target_levels,
      duration_min,
      session_names,
      session_default_time,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to save template' }, { status: 500 })
  return NextResponse.json({ template: data }, { status: 201 })
}

// DELETE /api/premade-templates?id=<id>
export async function DELETE(req: NextRequest) {
  const session = await verifySession(req.cookies.get('session')?.value ?? '')
  if (!session || session.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('premade_templates')
    .delete()
    .eq('id', id)
    .eq('teacher_id', session.teacherId)

  if (error) return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
