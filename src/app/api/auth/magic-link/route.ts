import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { email, redirect_to } = await req.json()

  if (!email) {
    return NextResponse.json({ error: 'メールアドレスが必要です' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_DOMAIN ?? 'http://localhost:3000'}${redirect_to ?? '/'}`,
      shouldCreateUser: false, // 既存ユーザーのみ（招待制）
    },
  })

  if (error) {
    // "Email not found" → 招待されていないメアド
    if (error.message.includes('not found') || error.status === 422) {
      return NextResponse.json(
        { error: 'このメールアドレスは招待されていません' },
        { status: 403 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
