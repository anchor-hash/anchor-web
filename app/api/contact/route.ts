import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, message } = body

    if (!email || !message) {
      return NextResponse.json(
        { ok: false, error: 'Email and message are required.' },
        { status: 400 }
      )
    }

    // In production, send to an email service (e.g. Resend, SendGrid, Postmark)
    // For now, we just return ok: true
    console.log('[Contact Form]', { email, name: body.name || 'Anonymous', message })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
