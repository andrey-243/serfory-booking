import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Connexion | Serfory' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error: errorCode } = await searchParams

  const errorMessages: Record<string, string> = {
    unauthorized: 'This account is not authorized to access this platform.',
    oauth_failed: 'Google sign-in failed. Please try again.',
    invalid_callback: 'Invalid sign-in parameters.',
    no_id_token: 'Could not retrieve Google account information.',
  }

  const error = errorCode ? errorMessages[errorCode] : null

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#EEF2FF' }}>
      <div
        className="flex flex-col items-center gap-6 p-10 bg-white rounded-2xl"
        style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.08)', minWidth: 340 }}
      >
        <span className="text-2xl font-bold tracking-tight text-gray-900">Serfory</span>

        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900">Teacher portal</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in with your Google account</p>
        </div>

        {error && (
          <div className="w-full px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <a
          href="/api/auth/google"
          className="flex items-center gap-3 w-full justify-center px-5 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        >
          <GoogleIcon />
          Sign in with Google
        </a>

        <p className="text-xs text-gray-400 text-center">
          Access reserved for Serfory teachers and administrators.
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
