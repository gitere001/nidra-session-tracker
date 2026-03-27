'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

type TimeUnit = 's' | 'm' | 'h'

function formatSeconds(s: number): string {
  if (s < 60) return `${s}s`
  if (s < 3600) return `${(s / 60).toFixed(1)}m`
  return `${(s / 3600).toFixed(1)}h`
}

function toSeconds(value: number, unit: TimeUnit): number {
  if (unit === 's') return Math.round(value)
  if (unit === 'm') return Math.round(value * 60)
  return Math.round(value * 3600)
}

export default function EndSession() {
  const router = useRouter()
  const { id } = useParams()
  const [session, setSession] = useState<any>(null)
  const [endTasks, setEndTasks] = useState('')
  const [endTime, setEndTime] = useState('')
  const [endTimeUnit, setEndTimeUnit] = useState<TimeUnit>('h')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/session/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { router.push('/dashboard'); return }
        setSession(d.session)
      })
  }, [id, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const endSeconds = toSeconds(parseFloat(endTime), endTimeUnit)
    if (endSeconds < session.start_time_seconds) {
      setError('End time cannot be less than start time')
      return
    }
    if (parseInt(endTasks) < session.start_tasks) {
      setError('End tasks cannot be less than start tasks')
      return
    }
    const confirmed = window.confirm(
      `Are you sure these values are correct?\n\nTasks: ${endTasks}\nTime: ${endTime}${endTimeUnit}\n\nThis will calculate your hours worked.`
    )
    if (!confirmed) return

    setLoading(true)
    try {
      const res = await fetch('/api/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: Number(id),
          end_tasks: parseInt(endTasks),
          end_time: parseFloat(endTime),
          end_time_unit: endTimeUnit,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setLoading(false); return }
      router.push('/dashboard')
    } catch {
      setError('Something went wrong.')
      setLoading(false)
    }
  }

  const previewTasks = endTasks && session ? parseInt(endTasks) - session.start_tasks : null
  const previewHours = endTime && session
    ? ((toSeconds(parseFloat(endTime), endTimeUnit) - session.start_time_seconds) / 3600).toFixed(2)
    : null

  if (!session) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#888' }}>Loading...</p>
    </div>
  )

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <div style={{ paddingTop: 24, marginBottom: 20 }}>
        <Link href="/dashboard" style={{ color: '#888', textDecoration: 'none', fontSize: 14 }}>
          ← Back
        </Link>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>End Session</h2>
        <p style={{ fontSize: 14, color: '#888', marginBottom: 20 }}>
          Open Ice Cow and enter your current values to close this session.
        </p>

        {/* Start values summary */}
        <div style={{ background: '#f8f9fa', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Session started with</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>
            {session.start_tasks} tasks · {formatSeconds(session.start_time_seconds)}
          </div>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Current Tasks Labeled (on Ice Cow now)</label>
            <input
              type="number"
              placeholder="e.g. 611"
              value={endTasks}
              onChange={e => setEndTasks(e.target.value)}
              required
              min={session.start_tasks}
            />
          </div>

          <div className="form-group">
            <label>Current Total Time (on Ice Cow now)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 4.6"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                required
                min={0}
                style={{ flex: 1 }}
              />
              <select
                value={endTimeUnit}
                onChange={e => setEndTimeUnit(e.target.value as TimeUnit)}
                style={{
                  padding: '14px 12px',
                  border: '2px solid #e8e8e8',
                  borderRadius: 10,
                  fontSize: 16,
                  fontWeight: 700,
                  outline: 'none',
                  cursor: 'pointer',
                  minWidth: 70,
                }}
              >
                <option value="s">s</option>
                <option value="m">m</option>
                <option value="h">h</option>
              </select>
            </div>
            <div className="hint">Match exactly what Ice Cow shows — e.g. 2s, 3.9m, 4.6h</div>
          </div>

          {/* Live preview */}
          {previewTasks !== null && previewHours !== null && Number(previewHours) >= 0 && (
            <div style={{ background: '#d4edda', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: '#155724', marginBottom: 4 }}>Session summary</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#155724' }}>
                {previewTasks.toLocaleString()} tasks · {previewHours} hrs
              </div>
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'End Session'}
          </button>
        </form>
      </div>
    </div>
  )
}