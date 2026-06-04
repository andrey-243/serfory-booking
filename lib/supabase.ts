import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error('SUPABASE_URL is not set')
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

export type Teacher = {
  id: string
  name: string
  email: string
  subjects: string[]
  photo_url: string | null
  google_refresh_token: string | null
  google_calendar_id: string | null
  google_photo_url: string | null
  title: string | null
  teaching_languages: string[]
  levels: string | null
  experience_years: number | null
  created_at: string
}

export type Booking = {
  id: string
  teacher_id: string
  subject: string
  slot_start: string
  slot_end: string
  student_name: string
  student_email: string
  student_phone: string
  contact_pref: 'whatsapp' | 'telegram'
  is_minor: boolean
  parent_name: string | null
  parent_contact: string | null
  status: 'pending' | 'confirmed' | 'cancelled'
  google_event_id: string | null
  created_at: string
}

export type TeacherAvailability = {
  id: string
  teacher_id: string
  day_of_week: number  // 0=dim, 1=lun, 2=mar, 3=mer, 4=jeu, 5=ven, 6=sam
  start_time: string   // 'HH:MM:SS'
  end_time: string     // 'HH:MM:SS'
}
