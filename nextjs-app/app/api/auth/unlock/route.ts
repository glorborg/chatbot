import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/lib/config'
import { createSession, checkBruteForce, recordFailedAttempt, clearFailedAttempts } from '@/lib/auth'
import { getClientIp } from '@/lib/utils'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()
    const ip = getClientIp(request)

    // Check brute force
    const bruteCheck = await checkBruteForce(ip)
    
    if (!bruteCheck.allowed) {
      return NextResponse.json(
        { error: `Locked for ${bruteCheck.lockout} seconds. Please wait.` },
        { status: 429 }
      )
    }

    // Apply delay if needed
    if (bruteCheck.delay) {
      await new Promise(resolve => setTimeout(resolve, bruteCheck.delay))
    }

    // Random delay (200-600ms) for timing attack protection
    const randomDelay = Math.floor(Math.random() * 400) + 200
    await new Promise(resolve => setTimeout(resolve, randomDelay))

    // Check code
    if (code !== config.app.accessCode) {
      await recordFailedAttempt(ip)
      
      const attemptsResult = await query(
        'SELECT attempts FROM auth_attempts WHERE ip_address = $1',
        [ip]
      )
      
      const attempts = attemptsResult.rows[0]?.attempts || 0
      const remaining = 5 - attempts
      
      return NextResponse.json(
        { error: `Access code incorrect. You have ${remaining} tries left.` },
        { status: 401 }
      )
    }

    // Clear failed attempts on success
    await clearFailedAttempts(ip)

    // Get default account
    const accountResult = await query(
      'SELECT * FROM accounts LIMIT 1'
    )

    if (accountResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'No account found' },
        { status: 500 }
      )
    }

    const account = accountResult.rows[0]
    
    // Create session
    await createSession(account.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unlock error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
