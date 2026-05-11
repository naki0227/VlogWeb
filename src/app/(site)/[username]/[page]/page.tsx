import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTheme } from '@/lib/themes'
import type { Theme } from '@/types'

interface Props {
  params: Promise<{ username: string; page: string }>
}

export default async function UserPageRoute({ params }: Props) {
  const { username, page: pageSlug } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === profile.id

  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('user_id', profile.id)
    .eq('slug', pageSlug)
    .single()

  if (!page) notFound()

  // オーナー以外は公開ページのみアクセス可能（RLSで制御済みだが念のため）
  if (!page.is_public && !isOwner) notFound()

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('page_id', page.id)
    .order('sort_order')
    .order('created_at', { ascending: false })

  const theme = getTheme(page.theme as Theme)

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: theme.bg, color: theme.text, fontFamily: theme.fontFamily }}
    >
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        <header>
          <a
            href={`/${username}`}
            className="text-sm mb-4 inline-block hover:opacity-70 transition-opacity"
            style={{ color: theme.muted }}
          >
            ← {profile.display_name ?? username}
          </a>
          <h1 className="text-2xl font-semibold">{page.title}</h1>
          {page.description && (
            <p className="mt-1 text-sm" style={{ color: theme.muted }}>{page.description}</p>
          )}
        </header>

        {posts && posts.length > 0 ? (
          <div className="space-y-6">
            {posts.map(post => (
              <article
                key={post.id}
                className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: theme.surface }}
              >
                {(post.thumbnail_url || post.media_url) && (
                  <div className="aspect-video">
                    {post.media_type === 'video' ? (
                      <video
                        src={post.media_url ?? undefined}
                        poster={post.thumbnail_url ?? undefined}
                        controls
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={post.thumbnail_url ?? post.media_url ?? ''}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                )}
                {post.caption && (
                  <p className="px-4 py-3 text-sm leading-relaxed">{post.caption}</p>
                )}
                <p className="px-4 pb-3 text-xs" style={{ color: theme.muted }}>
                  {new Date(post.created_at).toLocaleDateString('ja-JP')}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: theme.muted }}>まだ投稿がありません</p>
        )}
      </div>
    </div>
  )
}
