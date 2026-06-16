import type { TeacherAvailability } from '@/lib/supabase'

const SLOT_DURATION_MS = 60 * 60 * 1000

function localToUtc(dateStr: string, timeStr: string, tz: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number)
    const [hour, minute] = timeStr.split(':').map(Number)
    const refUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0)
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    })
    const parts = formatter.formatToParts(new Date(refUtcMs))
    const get = (type: string) => parts.find(p => p.type === type)?.value ?? '0'
    const tzH = get('hour') === '24' ? 0 : Number(get('hour'))
    const tzMs = Date.UTC(Number(get('year')), Number(get('month')) - 1, Number(get('day')), tzH, Number(get('minute')), 0)
    return new Date(refUtcMs - (tzMs - refUtcMs)).toISOString()
  } catch {
    return new Date(`${dateStr}T${timeStr}:00Z`).toISOString()
  }
}

function windowBoundsUtc(day: Date, timeStr: string, teacherTimezone: string | null | undefined): Date {
  if (teacherTimezone) {
    const dayStr = day.toISOString().slice(0, 10)
    const t = timeStr.slice(0, 5)
    return new Date(localToUtc(dayStr, t, teacherTimezone))
  }
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date(day)
  d.setUTCHours(h, m, 0, 0)
  return d
}

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
  availabilities: TeacherAvailability[],
  teacherTimezone?: string | null
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

    const windows = availabilities.filter(a => a.day_of_week === dayOfWeek)

    for (const window of windows) {
      const windowStart = windowBoundsUtc(day, window.start_time, teacherTimezone)
      const windowEnd = windowBoundsUtc(day, window.end_time, teacherTimezone)

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
  availabilities: TeacherAvailability[],
  teacherTimezone?: string | null
): CalendarSlot[] {
  const slots: CalendarSlot[] = []
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const day = new Date(weekStart)
    day.setDate(day.getDate() + dayOffset)
    const dayOfWeek = day.getDay()
    const windows = availabilities.filter(a => a.day_of_week === dayOfWeek)
    for (const window of windows) {
      const windowStart = windowBoundsUtc(day, window.start_time, teacherTimezone)
      const windowEnd = windowBoundsUtc(day, window.end_time, teacherTimezone)
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
  { subject, teacherName, sessionStartUtc, durationMinutes, sessionId }: {
    subject: string
    teacherName: string
    sessionStartUtc: string  // ISO UTC
    durationMinutes: number
    sessionId: string
  }
): Promise<string | null> {
  const { google } = await import('googleapis')
  const client = await makeOAuthClient()
  client.setCredentials({ refresh_token: refreshToken })
  const calendar = google.calendar({ version: 'v3', auth: client })

  const endUtc = new Date(new Date(sessionStartUtc).getTime() + durationMinutes * 60000).toISOString()

  const res = await calendar.events.insert({
    calendarId: calendarId || 'primary',
    sendUpdates: 'none',
    conferenceDataVersion: 1,
    requestBody: {
      summary: `${subject} group · Serfory`,
      description: `👩‍🏫 ${teacherName}\n📚 ${subject}: Group lesson`,
      start: { dateTime: sessionStartUtc },
      end: { dateTime: endUtc },
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

export async function patchCalendarEventSummary(
  refreshToken: string,
  calendarId: string,
  eventId: string,
  summary: string
): Promise<void> {
  const { google } = await import('googleapis')
  const client = await makeOAuthClient()
  client.setCredentials({ refresh_token: refreshToken })
  const calendar = google.calendar({ version: 'v3', auth: client })
  await calendar.events.patch({
    calendarId: calendarId || 'primary',
    eventId,
    sendUpdates: 'none',
    requestBody: { summary },
  })
}

export async function createPremadeSessionEvent(
  refreshToken: string,
  calendarId: string,
  { batchName, sessionName, subject, teacherName, sessionStartUtc, durationMinutes, sessionId }: {
    batchName: string
    sessionName: string
    subject: string
    teacherName: string
    sessionStartUtc: string  // ISO UTC
    durationMinutes: number
    sessionId: string
  }
): Promise<string | null> {
  const { google } = await import('googleapis')
  const client = await makeOAuthClient()
  client.setCredentials({ refresh_token: refreshToken })
  const calendar = google.calendar({ version: 'v3', auth: client })

  const endUtc = new Date(new Date(sessionStartUtc).getTime() + durationMinutes * 60000).toISOString()

  const res = await calendar.events.insert({
    calendarId: calendarId || 'primary',
    sendUpdates: 'none',
    conferenceDataVersion: 1,
    requestBody: {
      summary: `${batchName}: ${sessionName} · Serfory`,
      description: `👩‍🏫 ${teacherName}\n📚 ${subject}: Premade course\n📖 ${sessionName}`,
      start: { dateTime: sessionStartUtc },
      end: { dateTime: endUtc },
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
    studentEmail,
  }: { summary: string; start: string; end: string; description: string; studentEmail?: string }
) {
  const { google } = await import('googleapis')
  const client = await makeOAuthClient()
  client.setCredentials({ refresh_token: refreshToken })
  const calendar = google.calendar({ version: 'v3', auth: client })

  const attendees = [
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
