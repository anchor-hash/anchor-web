import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, source } = body

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { ok: false, error: 'A valid email address is required.' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase
      .from('waitlist')
      .insert({
        email: email.toLowerCase().trim(),
        ...(typeof source === 'string' ? { source } : {}),
      })

    // A duplicate signup (unique violation, code 23505) isn't an error —
    // they're already on the list. Tell the client so it can show a
    // distinct message instead of the generic success one.
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ ok: true, duplicate: true })
      }
      console.error('[Waitlist] insert failed:', error.message)
      return NextResponse.json(
        { ok: false, error: 'Something went wrong. Please try again.' },
        { status: 500 }
      )
    }

    // Trigger the welcome email on the anchor backend (separate deployment,
    // shared-secret auth — see anchor/app/api/waitlist-welcome-email).
    // Awaited (serverless functions can be frozen/killed right after the
    // response is sent, so a true fire-and-forget fetch risks never actually
    // going out) but its result never affects the signup response itself —
    // the row is already safely in the waitlist table either way.
    if (process.env.WAITLIST_EMAIL_SECRET) {
      await fetch('https://app.getanchorhealth.app/api/waitlist-welcome-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.WAITLIST_EMAIL_SECRET}`,
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      }).catch((err) => console.error('[Waitlist] welcome email trigger failed:', err))
    } else {
      console.error('[Waitlist] WAITLIST_EMAIL_SECRET not set — skipping welcome email')
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
