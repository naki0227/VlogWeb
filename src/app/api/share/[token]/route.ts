import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// トークン検証 + アクセス（use_count インクリメント）
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const body = await req.json().catch(() => ({}))
  const { passphrase } = body

  const supabase = await createClient()

  // IPをハッシュ化（ログ用、特定はしない）
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? ''
  const ipHash = ip
    ? Buffer.from(
        await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip))
      ).toString('hex').slice(0, 16)
    : null

  // use_share_token 関数を呼ぶ（行ロックで同時アクセス競合を防ぐ）
  const { data: result } = await supabase
    .rpc('use_share_token', { p_token: token, p_ip_hash: ipHash })

  if (!result?.ok) {
    const messages: Record<string, string> = {
      not_found: 'このリンクは存在しません',
      revoked:   'このリンクは無効化されています',
      expired:   'このリンクは期限切れです',
      used_up:   'このリンクは使用済みです',
    }
    return NextResponse.json(
      { error: messages[result?.reason] ?? 'アクセスできません' },
      { status: 403 }
    )
  }

  // 合言葉チェック
  if (result.access_type === 'passphrase') {
    if (!passphrase) {
      return NextResponse.json({ requires: 'passphrase' }, { status: 200 })
    }

    const { data: tokenRow } = await supabase
      .from('share_tokens')
      .select('passphrase_hash')
      .eq('token', token)
      .single()

    if (!tokenRow?.passphrase_hash) {
      return NextResponse.json({ error: '設定エラー' }, { status: 500 })
    }

    const { verifyPassphrase } = await import('@/lib/crypto')
    const valid = await verifyPassphrase(passphrase, tokenRow.passphrase_hash)
    if (!valid) {
      return NextResponse.json({ error: '合言葉が違います' }, { status: 403 })
    }
  }

  // magic_link チェック（招待リストに含まれるメアドか確認）
  if (result.access_type === 'magic_link') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      return NextResponse.json({ requires: 'magic_link' }, { status: 200 })
    }

    const { data: invite } = await supabase
      .from('share_token_invites')
      .select('id, claimed_at')
      .eq('token_id', token)
      .eq('email', user.email.toLowerCase())
      .single()

    if (!invite) {
      return NextResponse.json({ error: 'このメールアドレスは招待されていません' }, { status: 403 })
    }

    // 未クレームなら claim する
    if (!invite.claimed_at) {
      await supabase
        .from('share_token_invites')
        .update({ claimed_at: new Date().toISOString() })
        .eq('id', invite.id)
    }
  }

  return NextResponse.json({ ok: true, post_id: result.post_id, page_id: result.page_id })
}

// トークン失効（オーナーのみ）
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('share_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('token', token)
    .eq('user_id', user.id)  // オーナーのみ

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
