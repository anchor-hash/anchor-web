import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { ok: false, error: 'A valid email address is required.' },
        { status: 400 }
      )
    }

    // TODO: wire up to Resend/Mailchimp/Supabase for real persistence
    // e.g. await resend.emails.send({ from: ..., to: ..., subject: "New Anchor waitlist signup", ... })
    console.log('[Waitlist]', { email, timestamp: new Date().toISOString() })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
