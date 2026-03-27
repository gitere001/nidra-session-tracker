'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function StartSession() {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [startTasks, setStartTasks] = useState('')
  const [startTime, setStartTime] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          start_tasks: parseInt(startTasks),
          start_time_min: parseFloat(startTime),
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

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <div style={{ paddingTop: 24, marginBottom: 20 }}>
        <Link href="/dashboard" style={{ color: '#888', textDecoration: 'none', fontSize: 14 }}>
          ← Back
        </Link>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Start Session</h2>
        <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>
          Open Ice Cow and note the current values before you begin working.
        </p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Current Tasks Labeled (on Ice Cow)</label>
            <input
              type="number"
              placeholder="e.g. 10"
              value={startTasks}
              onChange={e => setStartTasks(e.target.value)}
              required
              min={0}
            />
            <div className="hint">The number shown under "Tasks Labeled" right now</div>
          </div>

          <div className="form-group">
            <label>Current Total Time in Minutes (on Ice Cow)</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 3.9"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              required
              min={0}
            />
            <div className="hint">The number shown under "Total Time" right now</div>
          </div>

          <button className="btn btn-success" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Start Session'}
          </button>
        </form>
      </div>
    </div>
  )
}