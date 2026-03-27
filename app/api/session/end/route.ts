import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, end_tasks, end_time_min } = await req.json()
    if (!id || end_tasks === undefined || end_time_min === undefined)
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })

    // Get the session and verify ownership
    const rows = await sql`
      SELECT * FROM work_sessions WHERE id = ${id} AND user_id = ${user.id} LIMIT 1
    `
    const session = rows[0]
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (session.status === 'closed') return NextResponse.json({ error: 'Session already closed' }, { status: 400 })

    const tasks_done = end_tasks - session.start_tasks
    const hours_worked = (end_time_min - session.start_time_min) / 60

    await sql`
      UPDATE work_sessions SET
        end_tasks = ${end_tasks},
        end_time_min = ${end_time_min},
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