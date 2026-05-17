import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { normalizeHost, withoutPort } from '@/lib/domain'
import { getTheme } from '@/lib/themes'
import type { Theme } from '@/types'

interface Props {
  params: Promise<{ slug?: string[] }>
  searchParams: Promise<{ host?: string }>
}

export default async function CustomDomainPage({ params, searchParams }: Props) {
  const { slug = [] } = await params
  const { host } = await searchParams
  const normalizedHost = withoutPort(normalizeHost(host))

  if (!normalizedHost) notFound()

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('custom_domain', normalizedHost)
    .single()

  if (!profile) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === profile.id

  if (slug.length === 0) {
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

    const theme = getTheme('daily' as Theme)

    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: theme.bg, color: theme.text, fontFamily: theme.fontFamily }}
      >
        <div className="max-w-2xl mx-auto px-4 py-12 space-y-10">
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

          {pages && pages.length > 0 && (
            <nav className="flex flex-wrap gap-2">
              {pages.map(page => (
                <Link
                  key={page.id}
                  href={`/${page.slug}`}
                  className="px-4 py-1.5 rounded-full text-sm border transition-colors hover:opacity-70"
                  style={{ borderColor: theme.accent, color: theme.accent }}
                >
                  {page.title}
                </Link>
              ))}
            </nav>
          )}

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
              <Link
                href="/dashboard"
                className="text-xs px-3 py-1.5 rounded-full border"
                style={{ borderColor: theme.muted, color: theme.muted }}
              >
                管理画面
              </Link>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (slug.length !== 1) notFound()

  const pageSlug = slug[0]
  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('user_id', profile.id)
    .eq('slug', pageSlug)
    .single()

  if (!page) notFound()
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
          <Link
            href="/"
            className="text-sm mb-4 inline-block hover:opacity-70 transition-opacity"
            style={{ color: theme.muted }}
          >
            ← {profile.display_name ?? profile.username}
          </Link>
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
