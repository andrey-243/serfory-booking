import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient(supabaseUrl, supabaseAnonKey, {
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
  })
}

export type Teacher = {
  id: string
  name: string
  email: string
  subjects: string[]
  photo_url: string | null
  google_refresh_token: string | null
  google_calendar_id: string | null
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
