import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    post_id,
    page_id,
    access_type = 'link',
    passphrase,
    max_uses,        // null = 無制限、1 = 1回限り
    expires_in_hours,// null = 無期限
    label,
    invites = [],    // magic_link の場合: string[]（メアド）
  } = body

  if (!post_id && !page_id) {
    return NextResponse.json({ error: 'post_id か page_id が必要です' }, { status: 400 })
  }

  // オーナーチェック
  if (post_id) {
    const { data } = await supabase.from('posts').select('user_id').eq('id', post_id).single()
    if (data?.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (page_id) {
    const { data } = await supabase.from('pages').select('user_id').eq('id', page_id).single()
    if (data?.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // passphrase は bcrypt でハッシュ（サーバーサイドのみ）
  let passphrase_hash: string | null = null
  if (access_type === 'passphrase' && passphrase) {
    const { hashPassphrase } = await import('@/lib/crypto')
    passphrase_hash = await hashPassphrase(passphrase)
  }

  const expires_at = expires_in_hours
    ? new Date(Date.now() + expires_in_hours * 60 * 60 * 1000).toISOString()
    : null

  const { data: token, error } = await supabase
    .from('share_tokens')
    .insert({
      user_id: user.id,
      post_id: post_id ?? null,
      page_id: page_id ?? null,
      access_type,
      passphrase_hash,
      max_uses: max_uses ?? null,
      expires_at,
      label: label ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // magic_link の場合は招待メール送信
  if (access_type === 'magic_link' && invites.length > 0) {
    const inviteRows = (invites as string[]).map((email: string) => ({
      token_id: token.id,
      email: email.toLowerCase().trim(),
    }))
    await supabase.from('share_token_invites').insert(inviteRows)

    // メール送信（Supabase Edge Function か外部サービス経由）
    // TODO: Resend / SendGrid で送信
  }

  const shareUrl = `${process.env.NEXT_PUBLIC_DOMAIN ?? 'http://localhost:3000'}/share/${token.token}`

  return NextResponse.json({ token: token.token, url: shareUrl })
}
