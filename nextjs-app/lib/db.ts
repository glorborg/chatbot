import { createClient } from '@supabase/supabase-js'

// Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
)

// Execute raw SQL via Supabase RPC
export const query = async (text: string, params?: any[]) => {
  const start = Date.now()
  try {
    // Replace $1, $2, etc. with actual values for Supabase
    let finalQuery = text
    if (params && params.length > 0) {
      params.forEach((param, index) => {
        const value = typeof param === 'string' ? `'${param.replace(/'/g, "''")}'` : param
        finalQuery = finalQuery.replace(new RegExp(`\\$${index + 1}`, 'g'), String(value))
      })
    }
    
    console.log('Executing SQL:', finalQuery.substring(0, 150))
    
    // Use Supabase's RPC to execute raw SQL
    const { data, error } = await supabase.rpc('exec_sql', { query: finalQuery })
    
    if (error) {
      console.error('SQL Error:', error)
      throw error
    }
    
    const duration = Date.now() - start
    console.log('Query executed', { duration, rows: data?.length || 0 })
    
    return { 
      rows: Array.isArray(data) ? data : (data ? [data] : []), 
      rowCount: Array.isArray(data) ? data.length : (data ? 1 : 0)
    }
  } catch (error: any) {
    console.error('Query error:', error.message || error)
    throw error
  }
}

export const getClient = async () => {
  return {
    query,
    release: () => {},
  }
}

export default { query, supabase }
