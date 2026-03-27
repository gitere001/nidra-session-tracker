'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Session = {
  id: number
  date: string
  start_tasks: number
  start_time_seconds: number
  end_tasks: number | null
  end_time_seconds: number | null
  tasks_done: number | null
  hours_worked: number | null
  status: 'open' | 'closed'
}

type Totals = {
  total_tasks: number
  total_hours: number
  total_days: number
}

// function formatSeconds(s: number): string {
//   if (s < 60) return `${s}s`
//   if (s < 3600) return `${(s / 60).toFixed(1)}m`
//   return `${(s / 3600).toFixed(1)}h`
// }

function formatSeconds(s: number): string {
  if (s < 60) return `${s}s`
  if (s < 3600) {
    const mins = s / 60
    return mins % 1 === 0 ? `${mins}m` : `${mins.toFixed(1)}m`
  }
  const hrs = s / 3600
  return hrs % 1 === 0 ? `${hrs}h` : `${hrs.toFixed(1)}h`
}

export default function Dashboard() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [totals, setTotals] = useState<Totals>({ total_tasks: 0, total_hours: 0, total_days: 0 })
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/session/list')
      .then(r => {
        if (r.status === 401) { router.push('/'); return null }
        return r.json()
      })
      .then(data => {
        if (!data) return
        setSessions(data.sessions)
        setTotals(data.totals)
        setLoading(false)
      })

    fetch('/api/auth/me').then(r => r.json()).then(d => setName(d.name || ''))
  }, [router])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const openSession = sessions.find(s => s.status === 'open')

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#888' }}>Loading...</p>
    </div>
  )

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <div>
          <h1>Hello, {name.split(' ')[0]} 👋</h1>
          <div className="subtitle">Nidra WF11 Tracker</div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="value">{Number(totals.total_tasks).toLocaleString()}</div>
          <div className="label">Total Tasks</div>
        </div>
        <div className="stat-card">
          <div className="value">{Number(totals.total_hours).toFixed(2)}</div>
          <div className="label">Hours Worked</div>
        </div>
        <div className="stat-card">
          <div className="value">{totals.total_days}</div>
          <div className="label">Days Done</div>
        </div>
      </div>

      {/* Open session alert */}
      {openSession && (
        <div style={{ background: '#fff3cd', borderRadius: 14, padding: '16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Session in progress</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
              {formatDate(openSession.date)} — Started at {openSession.start_tasks} tasks · {formatSeconds(openSession.start_time_seconds)}
            </div>
          </div>
          <Link href={`/session/end/${openSession.id}`} className="btn btn-danger btn-sm">
            Log End
          </Link>
        </div>
      )}

      {/* Action Button */}
      {!openSession && (
        <Link href="/session/start" className="btn btn-success" style={{ marginBottom: 16, display: 'block' }}>
          + Start New Session
        </Link>
      )}

      {/* Sessions List */}
      <div className="card" style={{ padding: '20px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Your Sessions</h2>
        {sessions.length === 0 ? (
          <div className="empty">
            <h3>No sessions yet</h3>
            <p>Tap the button above to log your first session</p>
          </div>
        ) : (
          <div className="session-list">
            {sessions.map(s => (
              <div className="session-item" key={s.id}>
                <div>
                  <div className="date">{formatDate(s.date)}</div>
                  <div className="meta">
                    {s.status === 'closed'
                      ? `${s.tasks_done?.toLocaleString()} tasks · ${Number(s.hours_worked).toFixed(2)} hrs`
                      : `Started: ${s.start_tasks} tasks · ${formatSeconds(s.start_time_seconds)}`}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`badge ${s.status === 'open' ? 'badge-open' : 'badge-closed'}`}>
                    {s.status === 'open' ? 'In Progress' : 'Done'}
                  </span>
                  {s.status === 'open' && (
                    <Link href={`/session/end/${s.id}`} className="btn btn-danger btn-sm">
                      Log End
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}