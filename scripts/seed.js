const { neon } = require('@neondatabase/serverless')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL)

async function seed() {
  // Create tables
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS work_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      start_tasks INTEGER NOT NULL,
      start_time_min NUMERIC(10,2) NOT NULL,
      end_tasks INTEGER,
      end_time_min NUMERIC(10,2),
      tasks_done INTEGER,
      hours_worked NUMERIC(10,2),
      status TEXT DEFAULT 'open',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // Seed users with default password: Nidra2026!
  const defaultPassword = await bcrypt.hash('Nidra2026!', 10)

  const users = [
    { name: 'Gladys Njoki', email: 'gladysnjoki565@gmail.com' },
    { name: 'Karish Paul', email: 'karishpaul18@gmail.com' },
    { name: 'James Gitere', email: 'gitereJames10@gmail.com' },
  ]

  for (const u of users) {
    await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${u.name}, ${u.email.toLowerCase()}, ${defaultPassword})
      ON CONFLICT (email) DO NOTHING
    `
    console.log(`Created user: ${u.name} (${u.email})`)
  }

  console.log('\nAll users created with default password: Nidra2026!')
  console.log('Done!')
  process.exit(0)
}

seed().catch(err => {
  console.error(err)
  process.exit(1)
})