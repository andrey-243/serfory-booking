import type { TeacherAvailability } from '@/lib/supabase'

const SLOT_DURATION_MS = 60 * 60 * 1000

const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`

async function makeOAuthClient() {
  const { google } = await import('googleapis')
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  )
}

export async function getAuthUrl() {
  const client = await makeOAuthClient()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/calendar',
    ],
  })
}

export async function getGoogleUserInfo(accessToken: string): Promise<{ email: string; name: string; picture?: string }> {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Failed to fetch Google user info')
  return res.json()
}

export async function exchangeCodeForTokens(code: string) {
  const client = await makeOAuthClient()
  const { tokens } = await client.getToken(code)
  return tokens
}

export type CalendarSlot = {
  start: string
  end: string
}

// Retourne les créneaux libres de 1h pour un prof sur une semaine.
// Pour chaque fenêtre teacher_availability, on propose des créneaux de 1h
// en retirant ceux qui chevauchent un événement existant dans Google Calendar.
// Fallback : 8h-20h tous les jours si aucune dispo n'est définie.
export async function getAvailableSlots(
  refreshToken: string,
  calendarId: string,
  weekStart: Date,
  availabilities: TeacherAvailability[]
): Promise<CalendarSlot[]> {
  const { google } = await import('googleapis')
  const client = await makeOAuthClient()
  client.setCredentials({ refresh_token: refreshToken })
  const calendar = google.calendar({ version: 'v3', auth: client })

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const res = await calendar.events.list({
    calendarId: calendarId || 'primary',
    timeMin: weekStart.toISOString(),
    timeMax: weekEnd.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  })

  const busyIntervals = (res.data.items || [])
    .filter(e => e.start?.dateTime && e.end?.dateTime)
    .map(e => ({
      start: new Date(e.start!.dateTime!).getTime(),
      end: new Date(e.end!.dateTime!).getTime(),
    }))

  const slots: CalendarSlot[] = []

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const day = new Date(weekStart)
    day.setDate(day.getDate() + dayOffset)
    const dayOfWeek = day.getDay()

    const windows = availabilities.length > 0
      ? availabilities.filter(a => a.day_of_week === dayOfWeek)
      : [{ start_time: '08:00:00', end_time: '20:00:00' }]

    for (const window of windows) {
      const [startH, startM] = window.start_time.split(':').map(Number)
      const [endH, endM] = window.end_time.split(':').map(Number)

      const windowStart = new Date(day)
      windowStart.setHours(startH, startM, 0, 0)
      const windowEnd = new Date(day)
      windowEnd.setHours(endH, endM, 0, 0)

      let cursor = windowStart.getTime()
      while (cursor + SLOT_DURATION_MS <= windowEnd.getTime()) {
        const slotEnd = cursor + SLOT_DURATION_MS
        const overlaps = busyIntervals.some(b => cursor < b.end && slotEnd > b.start)
        if (!overlaps) {
          slots.push({
            start: new Date(cursor).toISOString(),
            end: new Date(slotEnd).toISOString(),
          })
        }
        cursor += SLOT_DURATION_MS
      }
    }
  }

  return slots
}

// Blank calendar fallback: generate slots from availability only, no busy intervals
export function getAvailableSlotsNoCalendar(
  weekStart: Date,
  availabilities: TeacherAvailability[]
): CalendarSlot[] {
  const slots: CalendarSlot[] = []
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const day = new Date(weekStart)
    day.setDate(day.getDate() + dayOffset)
    const dayOfWeek = day.getDay()
    const windows = availabilities.length > 0
      ? availabilities.filter(a => a.day_of_week === dayOfWeek)
      : [{ start_time: '08:00:00', end_time: '20:00:00' }]
    for (const window of windows) {
      const [startH, startM] = window.start_time.split(':').map(Number)
      const [endH, endM] = window.end_time.split(':').map(Number)
      const windowStart = new Date(day)
      windowStart.setHours(startH, startM, 0, 0)
      const windowEnd = new Date(day)
      windowEnd.setHours(endH, endM, 0, 0)
      let cursor = windowStart.getTime()
      while (cursor + SLOT_DURATION_MS <= windowEnd.getTime()) {
        slots.push({ start: new Date(cursor).toISOString(), end: new Date(cursor + SLOT_DURATION_MS).toISOString() })
        cursor += SLOT_DURATION_MS
      }
    }
  }
  return slots
}

export async function getCalendarEventStatus(
  refreshToken: string,
  calendarId: string,
  eventId: string,
  teacherEmail: string
): Promise<'accepted' | 'declined' | 'needsAction' | null> {
  const { google } = await import('googleapis')
  const client = await makeOAuthClient()
  client.setCredentials({ refresh_token: refreshToken })
  const calendar = google.calendar({ version: 'v3', auth: client })

  const res = await calendar.events.get({
    calendarId: calendarId || 'primary',
    eventId,
  })

  const attendee = (res.data.attendees || []).find(
    a => a.email?.toLowerCase() === teacherEmail.toLowerCase()
  )
  return (attendee?.responseStatus as 'accepted' | 'declined' | 'needsAction') ?? null
}

export async function acceptCalendarEvent(
  refreshToken: string,
  calendarId: string,
  eventId: string,
  teacherEmail: string
): Promise<void> {
  const { google } = await import('googleapis')
  const client = await makeOAuthClient()
  client.setCredentials({ refresh_token: refreshToken })
  const calendar = google.calendar({ version: 'v3', auth: client })

  const existing = await calendar.events.get({ calendarId: calendarId || 'primary', eventId })

  const attendees = (existing.data.attendees || []).map(a =>
    a.email?.toLowerCase() === teacherEmail.toLowerCase()
      ? { ...a, responseStatus: 'accepted' }
      : a
  )

  await calendar.events.patch({
    calendarId: calendarId || 'primary',
    eventId,
    sendUpdates: 'none',
    requestBody: { attendees },
  })
}

export async function watchCalendar(
  refreshToken: string,
  calendarId: string,
  channelId: string
): Promise<{ expiration: number }> {
  const { google } = await import('googleapis')
  const client = await makeOAuthClient()
  client.setCredentials({ refresh_token: refreshToken })
  const calendar = google.calendar({ version: 'v3', auth: client })

  const res = await calendar.events.watch({
    calendarId: calendarId || 'primary',
    requestBody: {
      id: channelId,
      type: 'web_hook',
      address: `${process.env.NEXT_PUBLIC_BASE_URL}/api/calendar-webhook`,
    },
  })

  return { expiration: Number(res.data.expiration) }
}

export async function addAttendeeToEvent(
  refreshToken: string,
  calendarId: string,
  eventId: string,
  attendeeEmail: string
): Promise<void> {
  const { google } = await import('googleapis')
  const client = await makeOAuthClient()
  client.setCredentials({ refresh_token: refreshToken })
  const calendar = google.calendar({ version: 'v3', auth: client })

  const existing = await calendar.events.get({ calendarId: calendarId || 'primary', eventId })
  const attendees = existing.data.attendees || []
  if (attendees.some(a => a.email?.toLowerCase() === attendeeEmail.toLowerCase())) return

  await calendar.events.patch({
    calendarId: calendarId || 'primary',
    eventId,
    sendUpdates: 'all',
    requestBody: { attendees: [...attendees, { email: attendeeEmail }] },
  })
}

export async function createGroupSessionEvent(
  refreshToken: string,
  calendarId: string,
  { subject, teacherName, sessionDate, startTime, durationMinutes, sessionId }: {
    subject: string
    teacherName: string
    sessionDate: string   // YYYY-MM-DD
    startTime: string     // HH:MM
    durationMinutes: number
    sessionId: string     // used as idempotency key
  }
): Promise<string | null> {
  const { google } = await import('googleapis')
  const client = await makeOAuthClient()
  client.setCredentials({ refresh_token: refreshToken })
  const calendar = google.calendar({ version: 'v3', auth: client })

  const startDt = new Date(`${sessionDate}T${startTime}:00`)
  const endDt = new Date(startDt.getTime() + durationMinutes * 60 * 1000)

  const res = await calendar.events.insert({
    calendarId: calendarId || 'primary',
    sendUpdates: 'none',
    conferenceDataVersion: 1,
    requestBody: {
      summary: `${subject} group · Serfory`,
      description: `👩‍🏫 ${teacherName}\n📚 ${subject} — Group lesson`,
      start: { dateTime: startDt.toISOString() },
      end: { dateTime: endDt.toISOString() },
      conferenceData: { createRequest: { requestId: `group-${sessionId}` } },
    },
  })

  return res.data.id ?? null
}

export async function deleteCalendarEvent(
  refreshToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const { google } = await import('googleapis')
  const client = await makeOAuthClient()
  client.setCredentials({ refresh_token: refreshToken })
  const calendar = google.calendar({ version: 'v3', auth: client })

  await calendar.events.delete({
    calendarId: calendarId || 'primary',
    eventId,
    sendUpdates: 'all',
  })
}

export async function createPremadeSessionEvent(
  refreshToken: string,
  calendarId: string,
  { batchName, sessionName, subject, teacherName, sessionDate, startTime, durationMinutes, sessionId }: {
    batchName: string
    sessionName: string
    subject: string
    teacherName: string
    sessionDate: string   // YYYY-MM-DD
    startTime: string     // HH:MM
    durationMinutes: number
    sessionId: string
  }
): Promise<string | null> {
  const { google } = await import('googleapis')
  const client = await makeOAuthClient()
  client.setCredentials({ refresh_token: refreshToken })
  const calendar = google.calendar({ version: 'v3', auth: client })

  const startDt = new Date(`${sessionDate}T${startTime}:00`)
  const endDt = new Date(startDt.getTime() + durationMinutes * 60 * 1000)

  const res = await calendar.events.insert({
    calendarId: calendarId || 'primary',
    sendUpdates: 'none',
    conferenceDataVersion: 1,
    requestBody: {
      summary: `${batchName} — ${sessionName} · Serfory`,
      description: `👩‍🏫 ${teacherName}\n📚 ${subject} — Premade course\n📖 ${sessionName}`,
      start: { dateTime: startDt.toISOString() },
      end: { dateTime: endDt.toISOString() },
      conferenceData: { createRequest: { requestId: `premade-${sessionId}` } },
    },
  })

  return res.data.id ?? null
}

export async function createCalendarEvent(
  refreshToken: string,
  calendarId: string,
  {
    summary,
    start,
    end,
    description,
    teacherEmail,
    studentEmail,
  }: { summary: string; start: string; end: string; description: string; teacherEmail?: string; studentEmail?: string }
) {
  const { google } = await import('googleapis')
  const client = await makeOAuthClient()
  client.setCredentials({ refresh_token: refreshToken })
  const calendar = google.calendar({ version: 'v3', auth: client })

  const attendees = [
    teacherEmail ? { email: teacherEmail } : null,
    studentEmail ? { email: studentEmail } : null,
  ].filter((a): a is { email: string } => a !== null)

  const res = await calendar.events.insert({
    calendarId: calendarId || 'primary',
    sendUpdates: 'all',
    conferenceDataVersion: 1,
    requestBody: {
      summary,
      description,
      start: { dateTime: start },
      end: { dateTime: end },
      attendees: attendees.length > 0 ? attendees : undefined,
      conferenceData: {
        createRequest: { requestId: crypto.randomUUID() },
      },
    },
  })

  const meetLink = res.data.conferenceData?.entryPoints
    ?.find(ep => ep.entryPointType === 'video')?.uri ?? null

  return { id: res.data.id ?? null, meetLink }
}
