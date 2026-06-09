/**
 * BACKUP: Applications ("Candidatures") tab — removed from app/admin/page.tsx on 2026-06-10
 *
 * To restore:
 * - Add `AppSortCol` type back to the types block
 * - Add T translations keys: viewApps, appStatus, appCols, accept, reject, emptyApps (both fr and en)
 * - Add state: appSortCol, appSortDir, acceptedOpen, rejectedOpen
 * - Add functions: handleAppSort, handleAppStatus, handleUpdateTgUsername
 * - Add 'applications' to the view type union
 * - Restore the tab button with badge in the tab bar
 * - Restore the {view === 'applications' && ...} JSX block
 *
 * NOTE: applications state + fetch + Application type are still present (used by CRM section)
 */

// ── Type ──────────────────────────────────────────────────────────────────────

type AppSortCol = 'date' | 'name' | 'subject' | 'status'

// ── T translations additions (fr and en objects) ──────────────────────────────

// fr:
//   viewApps: 'Candidatures',
//   appStatus: { pending: 'En attente', accepted: 'Accepté', rejected: 'Refusé' },
//   appCols: { date: 'Date', name: 'Candidat', subject: 'Matière', grade: 'Niveau', contact: 'Contact', channel: 'Canal', status: 'Statut' },
//   accept: 'Accepter', reject: 'Refuser',
//   emptyApps: 'Aucune candidature.',

// en:
//   viewApps: 'Applications',
//   appStatus: { pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected' },
//   appCols: { date: 'Date', name: 'Applicant', subject: 'Subject', grade: 'Grade', contact: 'Contact', channel: 'Channel', status: 'Status' },
//   accept: 'Accept', reject: 'Reject',
//   emptyApps: 'No applications.',

// ── State declarations ────────────────────────────────────────────────────────

// const [appSortCol, setAppSortCol] = useState<AppSortCol>('date')
// const [appSortDir, setAppSortDir] = useState<'asc' | 'desc'>('desc')
// const [acceptedOpen, setAcceptedOpen] = useState(false)
// const [rejectedOpen, setRejectedOpen] = useState(false)

// ── View type addition ────────────────────────────────────────────────────────

// const [view, setView] = useState<'bookings' | 'crm' | 'applications' | 'invoices'>('bookings')

// ── Functions ─────────────────────────────────────────────────────────────────

function handleAppSort(col: AppSortCol) {
  // appSortCol, appSortDir, setAppSortCol, setAppSortDir needed from state
  // if (appSortCol === col) setAppSortDir(d => d === 'asc' ? 'desc' : 'asc')
  // else { setAppSortCol(col); setAppSortDir(col === 'date' ? 'desc' : 'asc') }
}

async function handleAppStatus(id: string, status: string) {
  await fetch('/api/applications', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status }),
  })
  // setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a))
}

async function handleUpdateTgUsername(id: string, username: string) {
  const val = username.replace(/^@/, '').trim() || null
  await fetch('/api/applications', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, telegram_username: val }),
  })
  // setApplications(prev => prev.map(a => a.id === id ? { ...a, telegram_username: val } : a))
}

// ── Tab button (inside the tab bar map, replaces the else branch for 'applications') ──

const TabButtonApplications = () => (
  <span className="flex items-center gap-1.5">
    {/* t.viewApps */}
    {/* applications.filter(a => a.status === 'pending').length > 0 && */}
    <span className="bg-orange-400 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
      {/* applications.filter(a => a.status === 'pending').length */}
    </span>
  </span>
)

// ── Full JSX block ({view === 'applications' && ...}) ─────────────────────────

/*
{view === 'applications' && (() => {
  const sortApps = (list: Application[]) => [...list].sort((a, b) => {
    let cmp = 0
    if (appSortCol === 'date') cmp = a.created_at.localeCompare(b.created_at)
    else if (appSortCol === 'name') cmp = a.name.localeCompare(b.name)
    else if (appSortCol === 'subject') cmp = a.subject.localeCompare(b.subject)
    return appSortDir === 'asc' ? cmp : -cmp
  })
  const pendingApps  = sortApps(applications.filter(a => a.status === 'pending'))
  const acceptedApps = sortApps(applications.filter(a => a.status === 'accepted'))
  const rejectedApps = sortApps(applications.filter(a => a.status === 'rejected'))

  const AppRow = ({ a }: { a: Application }) => {
    const canAccept = a.status === 'pending'
    return (
      <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <td className="px-3 py-3" />
        <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
          {format(new Date(a.created_at), "d MMM", { locale: t.locale })}
        </td>
        <td className="px-4 py-3">
          <p className="font-semibold text-gray-900">{a.name}</p>
        </td>
        <td className="px-4 py-3 text-gray-700">{a.subject}</td>
        <td className="px-4 py-3 text-xs text-gray-500">{normalizeGrade(a.grade)}</td>
        <td className="px-4 py-3">
          <p className="text-xs text-gray-400">{a.email}</p>
          <p className="text-xs text-gray-400 mt-0.5">{a.phone}</p>
          {a.contact_pref === 'telegram' && (
            <input
              id={`tg-app-${a.id}`}
              className="mt-1.5 w-32 text-xs px-1.5 py-0.5 border border-gray-200 rounded text-gray-500 placeholder-gray-300 focus:outline-none focus:border-sky-400"
              defaultValue={a.telegram_username ? `@${a.telegram_username}` : ''}
              placeholder="@student"
              onBlur={e => { if (e.target.value !== (a.telegram_username ? `@${a.telegram_username}` : '')) handleUpdateTgUsername(a.id, e.target.value) }}
              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
            />
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-col gap-1">
            {a.contact_pref === 'telegram' ? (
              <button onClick={() => {
                  const input = document.getElementById(`tg-app-${a.id}`) as HTMLInputElement | null
                  const username = (input?.value ?? '').replace(/^@/, '').trim() || (a.telegram_username ?? '')
                  const BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'serforybot'
                  const msgs: Record<string, string> = {
                    en: `Hi ${a.name}! We received your application for ${a.subject} at Serfory.\n\nTap the link below to connect with our assistant and receive your booking link:\nt.me/${BOT}?start=s_${a.id}`,
                    et: `Tere ${a.name}! Saime teie ${a.subject} avalduse kätte Serfory's.\n\nVajutage lingil meie assistendiga ühenduse loomiseks:\nt.me/${BOT}?start=s_${a.id}`,
                    ru: `Привет, ${a.name}! Мы получили вашу заявку на ${a.subject} в Serfory.\n\nНажмите на ссылку для связи с ботом:\nt.me/${BOT}?start=s_${a.id}`,
                  }
                  const msgLang = (a.learning_lang && msgs[a.learning_lang]) ? a.learning_lang : (msgs[a.lang] ? a.lang : 'en')
                  const url = username
                    ? `https://t.me/${username}?text=${encodeURIComponent(msgs[msgLang])}`
                    : `https://t.me/+${a.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msgs[msgLang])}`
                  window.open(url, '_blank', 'noopener,noreferrer')
                }}
                className="flex items-center gap-1.5 text-xs text-white bg-sky-500 hover:bg-sky-600 px-2.5 py-1 rounded-full font-medium w-fit">
                <TgIcon /> Telegram
              </button>
            ) : (
              <a href={`mailto:${a.email}`}
                className="flex items-center gap-1.5 text-xs text-white bg-violet-500 hover:bg-violet-600 px-2.5 py-1 rounded-full font-medium w-fit">
                <EmailIcon /> Email
              </a>
            )}
          </div>
        </td>
        <td className="px-3 py-3">
          {a.status === 'pending' ? (
            <div className="flex items-center gap-1.5">
              <button onClick={() => handleAppStatus(a.id, 'accepted')}
                disabled={!canAccept}
                title={t.accept}
                className="flex items-center justify-center w-7 h-7 rounded-full border-2 border-green-300 text-green-600 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M20 6 9 17l-5-5"/></svg>
              </button>
              <button onClick={() => handleAppStatus(a.id, 'rejected')}
                title={t.reject}
                className="flex items-center justify-center w-7 h-7 rounded-full border-2 border-red-200 text-red-500 bg-red-50 hover:bg-red-100 transition-colors shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
          ) : (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              a.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
            }`}>
              {t.appStatus[a.status as keyof typeof t.appStatus] ?? a.status}
            </span>
          )}
        </td>
      </tr>
    )
  }

  const AppTable = ({ rows }: { rows: Application[] }) => (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
          <th className="w-6 px-3 py-3" />
          <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-gray-600 select-none whitespace-nowrap" onClick={() => handleAppSort('date')}>{t.appCols.date}<SortIndicator active={appSortCol === 'date'} dir={appSortDir} /></th>
          <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-gray-600 select-none whitespace-nowrap" onClick={() => handleAppSort('name')}>{t.appCols.name}<SortIndicator active={appSortCol === 'name'} dir={appSortDir} /></th>
          <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-gray-600 select-none whitespace-nowrap" onClick={() => handleAppSort('subject')}>{t.appCols.subject}<SortIndicator active={appSortCol === 'subject'} dir={appSortDir} /></th>
          <th className="text-left px-4 py-3 font-medium">{t.appCols.grade}</th>
          <th className="text-left px-4 py-3 font-medium">{t.appCols.contact}</th>
          <th className="text-left px-4 py-3 font-medium">{t.appCols.channel}</th>
          <th className="px-3 py-3" />
        </tr>
      </thead>
      <tbody>
        {rows.map(a => <AppRow key={a.id} a={a} />)}
      </tbody>
    </table>
  )

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loadingApps ? (
          <p className="p-6 text-sm text-gray-400">{t.loading}</p>
        ) : pendingApps.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">{t.emptyApps}</p>
        ) : (
          <AppTable rows={pendingApps} />
        )}
      </div>

      {acceptedApps.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setAcceptedOpen(v => !v)}
            className="w-full flex items-center gap-2 px-5 py-3 text-sm font-medium text-green-700 hover:bg-green-50 transition-colors select-none">
            <span className={`text-xs transition-transform ${acceptedOpen ? 'rotate-90' : ''}`}>▶</span>
            {acceptedApps.length} {lang === 'fr' ? 'accepté' : 'accepted'}{acceptedApps.length > 1 ? 's' : ''}
          </button>
          {acceptedOpen && <AppTable rows={acceptedApps} />}
        </div>
      )}

      {rejectedApps.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setRejectedOpen(v => !v)}
            className="w-full flex items-center gap-2 px-5 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors select-none">
            <span className={`text-xs transition-transform ${rejectedOpen ? 'rotate-90' : ''}`}>▶</span>
            {rejectedApps.length} {lang === 'fr' ? 'refusé' : 'rejected'}{rejectedApps.length > 1 ? 's' : ''}
          </button>
          {rejectedOpen && <AppTable rows={rejectedApps} />}
        </div>
      )}
    </div>
  )
})()}
*/
