'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function EndSession() {
  const router = useRouter()
  const { id } = useParams()
  const [session, setSession] = useState<any>(null)
  const [endTasks, setEndTasks] = useState('')
  const [endTime, setEndTime] = useState('')
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
    if (parseFloat(endTime) < session.start_time_min) {
      setError('End time cannot be less than start time')
      return
    }
    if (parseInt(endTasks) < session.start_tasks) {
      setError('End tasks cannot be less than start tasks')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: Number(id),
          end_tasks: parseInt(endTasks),
          end_time_min: parseFloat(endTime),
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
  const previewHours = endTime && session ? ((parseFloat(endTime) - session.start_time_min) / 60).toFixed(2) : null

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
            {session.start_tasks} tasks · {session.start_time_min} min
          </div>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Current Tasks Labeled (on Ice Cow now)</label>
            <input
              type="number"
              placeholder="e.g. 250"
              value={endTasks}
              onChange={e => setEndTasks(e.target.value)}
              required
              min={session.start_tasks}
            />
          </div>

          <div className="form-group">
            <label>Current Total Time in Minutes (on Ice Cow now)</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 65"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              required
              min={session.start_time_min}
            />
          </div>

          {/* Live preview */}
          {previewTasks !== null && previewHours !== null && (
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