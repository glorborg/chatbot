import { createClient } from '@supabase/supabase-js'

// Supabase client - using REST API instead of direct PostgreSQL
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

// Query wrapper that uses Supabase API
export const query = async (text: string, params?: any[]) => {
  const start = Date.now()
  try {
    // Parse SQL to use Supabase API
    // This is a simplified adapter - for complex queries, we'd need more logic
    console.log('Executing via Supabase API:', text.substring(0, 100))
    
    // For SELECT queries
    if (text.trim().toUpperCase().startsWith('SELECT')) {
      // Extract table name from SQL (basic parsing)
      const tableMatch = text.match(/FROM\s+(\w+)/i)
      if (tableMatch) {
        const table = tableMatch[1]
        const { data, error } = await supabase.from(table).select('*')
        if (error) throw error
        
        const duration = Date.now() - start
        console.log('Query executed', { duration, rows: data?.length || 0 })
        return { rows: data || [], rowCount: data?.length || 0 }
      }
    }
    
    // For INSERT queries - will be handled by individual routes
    // For now, return empty result for unsupported queries
    return { rows: [], rowCount: 0 }
    
  } catch (error) {
    console.error('Query error:', error)
    throw error
  }
}

export const getClient = async () => {
  // Return a mock client since we're using Supabase API
  return {
    query,
    release: () => {},
  }
}

export default { query }
