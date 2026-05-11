import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTheme } from '@/lib/themes'
import type { Theme } from '@/types'

interface Props {
  params: Promise<{ username: string }>
}

export default async function UserSitePage({ params }: Props) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === profile.id

  const { data: pages } = await supabase
    .from('pages')
    .select('*')
    .eq('user_id', profile.id)
    .eq('is_public', true)
    .order('sort_order')

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', profile.id)
    .eq('visibility', 'public')
    .is('page_id', null)
    .order('created_at', { ascending: false })
    .limit(30)

  // デフォルトはdailyテーマ
  const theme = getTheme('daily' as Theme)

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: theme.bg, color: theme.text, fontFamily: theme.fontFamily }}
    >
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-10">
        {/* profile header */}
        <header className="space-y-2">
          {profile.avatar_url && (
            <img
              src={profile.avatar_url}
              alt=""
              className="w-12 h-12 rounded-full object-cover"
            />
          )}
          <h1 className="text-xl font-semibold">
            {profile.display_name ?? profile.username}
          </h1>
          {profile.bio && (
            <p className="text-sm" style={{ color: theme.muted }}>{profile.bio}</p>
          )}
        </header>

        {/* page links */}
        {pages && pages.length > 0 && (
          <nav className="flex flex-wrap gap-2">
            {pages.map(page => (
              <a
                key={page.id}
                href={`/${username}/${page.slug}`}
                className="px-4 py-1.5 rounded-full text-sm border transition-colors hover:opacity-70"
                style={{ borderColor: theme.accent, color: theme.accent }}
              >
                {page.title}
              </a>
            ))}
          </nav>
        )}

        {/* posts */}
        {posts && posts.length > 0 && (
          <section className="grid grid-cols-2 gap-3">
            {posts.map(post => (
              <div key={post.id} className="rounded-xl overflow-hidden" style={{ backgroundColor: theme.surface }}>
                {post.thumbnail_url || post.media_url ? (
                  <div className="aspect-video">
                    <img
                      src={post.thumbnail_url ?? post.media_url ?? ''}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : null}
                {post.caption && (
                  <p className="px-3 py-2 text-sm">{post.caption}</p>
                )}
              </div>
            ))}
          </section>
        )}

        {isOwner && (
          <div className="text-center">
            <a
              href="/dashboard"
              className="text-xs px-3 py-1.5 rounded-full border"
              style={{ borderColor: theme.muted, color: theme.muted }}
            >
              管理画面
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
