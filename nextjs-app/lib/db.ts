import { Pool } from 'pg'
import { createClient } from '@supabase/supabase-js'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
})

export const query = async (text: string, params?: any[]) => {
  const start = Date.now()
  const res = await pool.query(text, params)
  const duration = Date.now() - start
  console.log('Executed query', { text: text.substring(0, 100), duration, rows: res.rowCount })
  return res
}

export const getClient = async () => {
  const client = await pool.connect()
  return client
}

// Supabase client for storage
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export default pool
