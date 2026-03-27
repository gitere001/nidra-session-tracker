import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { getSession } from '@/lib/auth'

function toSeconds(value: number, unit: 's' | 'm' | 'h'): number {
  if (unit === 's') return Math.round(value)
  if (unit === 'm') return Math.round(value * 60)
  return Math.round(value * 3600)
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, end_tasks, end_time, end_time_unit } = await req.json()

    if (!id || end_tasks === undefined || end_time === undefined || !end_time_unit)
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })

    // Get the session and verify ownership
    const rows = await sql`
      SELECT * FROM work_sessions WHERE id = ${id} AND user_id = ${user.id} LIMIT 1
    `
    const session = rows[0]
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (session.status === 'closed') return NextResponse.json({ error: 'Session already closed' }, { status: 400 })

    const end_time_seconds = toSeconds(parseFloat(end_time), end_time_unit)

    if (end_time_seconds < session.start_time_seconds)
      return NextResponse.json({ error: 'End time cannot be less than start time' }, { status: 400 })

    const tasks_done = end_tasks - session.start_tasks
    const hours_worked = (end_time_seconds - session.start_time_seconds) / 3600

    await sql`
      UPDATE work_sessions SET
        end_tasks = ${end_tasks},
        end_time_seconds = ${end_time_seconds},
        tasks_done = ${tasks_done},
        hours_worked = ${hours_worked},
        status = 'closed'
      WHERE id = ${id}
    `
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}