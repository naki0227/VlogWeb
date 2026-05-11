import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTheme } from '@/lib/themes'
import { ShareGate } from './ShareGate'
import type { Theme } from '@/types'

interface Props {
  params: Promise<{ token: string }>
}

export default async function SharePage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()

  const { data: shareToken } = await supabase
    .from('share_tokens')
    .select('id, token, access_type, expires_at, max_uses, use_count, revoked_at, post_id, page_id')
    .eq('token', token)
    .single()

  if (!shareToken) notFound()

  // 失効・期限切れチェック（UI表示のため先に確認）
  if (shareToken.revoked_at) {
    return <ErrorView message="このリンクは無効化されています" />
  }
  if (shareToken.expires_at && new Date(shareToken.expires_at) < new Date()) {
    return <ErrorView message="このリンクは期限切れです" />
  }
  if (shareToken.max_uses !== null && shareToken.use_count >= shareToken.max_uses) {
    return <ErrorView message="このリンクは使用済みです" />
  }

  // 合言葉・magic_link はクライアント側でゲート処理
  if (shareToken.access_type === 'passphrase' || shareToken.access_type === 'magic_link') {
    return (
      <ShareGate
        token={token}
        accessType={shareToken.access_type}
        postId={shareToken.post_id}
        pageId={shareToken.page_id}
      />
    )
  }

  // link / qr はそのままコンテンツを表示（API経由でuse_countインクリメント）
  return <ShareContent token={token} postId={shareToken.post_id} pageId={shareToken.page_id} />
}

async function ShareContent({
  token, postId, pageId,
}: {
  token: string
  postId: string | null
  pageId: string | null
}) {
  const supabase = await createClient()

  // use_count インクリメント
  await supabase.rpc('use_share_token', { p_token: token, p_ip_hash: null })

  const theme = getTheme('daily' as Theme)

  if (pageId) {
    const { data: page } = await supabase.from('pages').select('*').eq('id', pageId).single()
    if (!page) notFound()

    const { data: posts } = await supabase
      .from('posts')
      .select('*')
      .eq('page_id', page.id)
      .order('sort_order')
      .order('created_at', { ascending: false })

    const t = getTheme(page.theme as Theme)

    return (
      <div className="min-h-screen" style={{ backgroundColor: t.bg, color: t.text, fontFamily: t.fontFamily }}>
        <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
          <header>
            <h1 className="text-2xl font-semibold">{page.title}</h1>
            {page.description && <p className="mt-1 text-sm" style={{ color: t.muted }}>{page.description}</p>}
          </header>
          <div className="space-y-6">
            {posts?.map(post => (
              <article key={post.id} className="rounded-2xl overflow-hidden" style={{ backgroundColor: t.surface }}>
                {(post.thumbnail_url || post.media_url) && (
                  <div className="aspect-video">
                    {post.media_type === 'video'
                      ? <video src={post.media_url} poster={post.thumbnail_url ?? undefined} controls className="w-full h-full object-cover" />
                      : <img src={post.thumbnail_url ?? post.media_url} alt="" className="w-full h-full object-cover" />}
                  </div>
                )}
                {post.caption && <p className="px-4 py-3 text-sm">{post.caption}</p>}
                <p className="px-4 pb-3 text-xs" style={{ color: t.muted }}>
                  {new Date(post.created_at).toLocaleDateString('ja-JP')}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (postId) {
    const { data: post } = await supabase.from('posts').select('*').eq('id', postId).single()
    if (!post) notFound()

    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bg }}>
        <div className="w-full max-w-lg px-4" style={{ color: theme.text }}>
          {(post.thumbnail_url || post.media_url) && (
            <div className="aspect-video rounded-2xl overflow-hidden">
              {post.media_type === 'video'
                ? <video src={post.media_url} poster={post.thumbnail_url ?? undefined} controls className="w-full h-full object-cover" />
                : <img src={post.thumbnail_url ?? post.media_url} alt="" className="w-full h-full object-cover" />}
            </div>
          )}
          {post.caption && <p className="mt-4 text-sm">{post.caption}</p>}
        </div>
      </div>
    )
  }

  notFound()
}

function ErrorView({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <p className="text-zinc-500 text-sm">{message}</p>
    </div>
  )
}
