import { google } from 'googleapis'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`
)

export function getAuthUrl(teacherEmail: string) {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar'],
    state: teacherEmail,
  })
}

export async function exchangeCodeForTokens(code: string) {
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

export type CalendarSlot = {
  start: string
  end: string
  summary: string
}

export async function getAvailableSlots(
  refreshToken: string,
  calendarId: string,
  weekStart: Date
): Promise<CalendarSlot[]> {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`
  )
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
    q: 'AVAILABLE',
  })

  return (res.data.items || [])
    .filter(e => e.start?.dateTime && e.end?.dateTime)
    .map(e => ({
      start: e.start!.dateTime!,
      end: e.end!.dateTime!,
      summary: e.summary || '',
    }))
}

export async function createCalendarEvent(
  refreshToken: string,
  calendarId: string,
  {
    summary,
    start,
    end,
    description,
  }: { summary: string; start: string; end: string; description: string }
) {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`
  )
  client.setCredentials({ refresh_token: refreshToken })

  const calendar = google.calendar({ version: 'v3', auth: client })

  const res = await calendar.events.insert({
    calendarId: calendarId || 'primary',
    requestBody: {
      summary,
      description,
      start: { dateTime: start },
      end: { dateTime: end },
    },
  })

  return res.data.id
}
