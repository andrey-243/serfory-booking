const ZOOM_TOKEN_URL = 'https://zoom.us/oauth/token'
const ZOOM_API_BASE = 'https://api.zoom.us/v2'

async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch(
    `${ZOOM_TOKEN_URL}?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
    {
      method: 'POST',
      headers: { Authorization: `Basic ${credentials}` },
    }
  )

  if (!res.ok) {
    throw new Error(`Zoom token error: ${res.status} ${await res.text()}`)
  }

  const data = await res.json()
  return data.access_token as string
}

export async function createZoomMeeting(
  topic: string,
  startUtc: string,
  durationMinutes: number,
  alternativeHost?: string
): Promise<string | null> {
  try {
    const token = await getAccessToken()

    const res = await fetch(`${ZOOM_API_BASE}/users/serfory.learning@gmail.com/meetings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        type: 2,
        start_time: startUtc,
        duration: durationMinutes,
        settings: {
          join_before_host: true,
          waiting_room: false,
          auto_recording: 'none',
          ...(alternativeHost ? { alternative_hosts: alternativeHost } : {}),
        },
      }),
    })

    if (!res.ok) {
      console.error('Zoom meeting creation failed:', res.status, await res.text())
      return null
    }

    const data = await res.json()
    return data.join_url as string
  } catch (err) {
    console.error('createZoomMeeting error:', err)
    return null
  }
}
