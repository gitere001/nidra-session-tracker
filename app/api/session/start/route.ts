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

    const { date, start_tasks, start_time, start_time_unit } = await req.json()

    if (!date || start_tasks === undefined || start_time === undefined || !start_time_unit)
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })

    const start_time_seconds = toSeconds(parseFloat(start_time), start_time_unit)

    // Check if open session already exists for this date
    const existing = await sql`
      SELECT id FROM work_sessions
      WHERE user_id = ${user.id} AND date = ${date} AND status = 'open'
      LIMIT 1
    `
    if (existing.length > 0)
      return NextResponse.json({ error: 'You already have an open session for this date' }, { status: 400 })

    const rows = await sql`
      INSERT INTO work_sessions (user_id, date, start_tasks, start_time_seconds, status)
      VALUES (${user.id}, ${date}, ${start_tasks}, ${start_time_seconds}, 'open')
      RETURNING id
    `
    return NextResponse.json({ ok: true, id: rows[0].id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}