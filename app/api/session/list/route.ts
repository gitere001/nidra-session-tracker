import { NextResponse } from 'next/server'
import sql from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sessions = await sql`
      SELECT * FROM work_sessions
      WHERE user_id = ${user.id}
      ORDER BY date DESC, created_at DESC
    `

    const totals = await sql`
      SELECT
        COALESCE(SUM(tasks_done), 0) AS total_tasks,
        COALESCE(SUM(hours_worked), 0) AS total_hours,
        COUNT(*) FILTER (WHERE status = 'closed') AS total_days
      FROM work_sessions
      WHERE user_id = ${user.id}
    `

    return NextResponse.json({ sessions, totals: totals[0] })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}