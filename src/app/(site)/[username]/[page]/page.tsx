import Link from 'next/link'
import { Bebas_Neue, Cormorant_Garamond } from 'next/font/google'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTheme } from '@/lib/themes'
import type { Theme } from '@/types'

interface Props {
  params: Promise<{ username: string; page: string }>
}

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
})

const cormorantGaramond = Cormorant_Garamond({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  style: ['normal', 'italic'],
})

const PAGE_VIBES: Record<
  Theme,
  {
    eyebrow: string
    cardMode: 'clean' | 'scrap' | 'poster'
    tagline: string
    mosaic: boolean
    stamp: string
  }
> = {
  daily: { eyebrow: 'Photo Journal', cardMode: 'scrap', tagline: 'その日の温度が残る、ゆるい記録。', mosaic: true, stamp: 'Vol. 01' },
  cafe: { eyebrow: 'Cafe Editorial', cardMode: 'clean', tagline: '光と静けさを、誌面みたいに並べる。', mosaic: false, stamp: 'ZINE CUT' },
  travel: { eyebrow: 'Travel Poster', cardMode: 'poster', tagline: '移動と余韻ごと見せる、遠征のアーカイブ。', mosaic: true, stamp: 'Issue 24' },
  night: { eyebrow: 'After Dark Notes', cardMode: 'poster', tagline: 'ネオン、ノイズ、夜気まで拾うページ。', mosaic: true, stamp: 'Live 02AM' },
  minimal: { eyebrow: 'Quiet Archive', cardMode: 'clean', tagline: '説明しすぎない、静かな構図。', mosaic: false, stamp: 'Edit' },
  wedding: { eyebrow: 'Ceremony Journal', cardMode: 'clean', tagline: '柔らかい時間を上品に重ねる。', mosaic: false, stamp: 'Story' },
  birthday: { eyebrow: 'Gifted Moments', cardMode: 'scrap', tagline: 'サプライズの空気までポップに残す。', mosaic: true, stamp: 'Party' },
}

function getPageBackground(themeId: Theme, theme: ReturnType<typeof getTheme>) {
  switch (themeId) {
    case 'night':
      return `radial-gradient(circle at 12% 18%, ${theme.accent}32, transparent 16%), linear-gradient(180deg, #080812 0%, ${theme.bg} 42%, #11111a 100%)`
    case 'travel':
      return `radial-gradient(circle at top left, ${theme.accent}24, transparent 20%), radial-gradient(circle at 86% 12%, #ffffff 0%, transparent 18%), linear-gradient(180deg, #eff9ff 0%, ${theme.bg} 46%, ${theme.surface} 100%)`
    case 'cafe':
      return `linear-gradient(180deg, #f7ead8 0%, ${theme.bg} 58%, ${theme.surface} 100%)`
    case 'birthday':
      return `radial-gradient(circle at top left, #ff4da620, transparent 18%), linear-gradient(180deg, #fff8fb 0%, ${theme.bg} 58%, ${theme.surface} 100%)`
    default:
      return `radial-gradient(circle at top left, ${theme.accent}16, transparent 24%), radial-gradient(circle at bottom right, ${theme.accent}12, transparent 22%), ${theme.bg}`
  }
}

function getThemeDisplayClass(themeId: Theme) {
  switch (themeId) {
    case 'travel':
    case 'night':
      return bebasNeue.className
    case 'cafe':
      return cormorantGaramond.className
    default:
      return ''
  }
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
  const vibe = PAGE_VIBES[page.theme as Theme]
  const leadPost = posts?.[0] ?? null
  const quotePost = posts?.find(post => post.caption)?.caption
  const bodyPosts = leadPost ? posts?.slice(1) ?? [] : posts ?? []
  const displayClass = getThemeDisplayClass(page.theme as Theme)

  return (
    <div
      className="min-h-screen"
      style={{
        background: getPageBackground(page.theme as Theme, theme),
        color: theme.text,
        fontFamily: theme.fontFamily,
      }}
    >
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <aside className="lg:sticky lg:top-10 lg:self-start">
            <div
              className="rounded-[2.2rem] border p-6 sm:p-8"
              style={{
                background:
                  page.theme === 'night'
                    ? `linear-gradient(180deg, ${theme.surface} 0%, #10101a 100%)`
                    : page.theme === 'travel'
                      ? `linear-gradient(180deg, #ffffff 0%, ${theme.accent}10 100%)`
                      : `linear-gradient(180deg, ${theme.surface} 0%, ${theme.accent}10 100%)`,
                borderColor: `${theme.accent}22`,
                boxShadow:
                  page.theme === 'night' || page.theme === 'travel'
                    ? `0 24px 70px ${theme.accent}12`
                    : undefined,
              }}
            >
              <Link
                href={`/${username}`}
                className="inline-flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
                style={{ color: theme.muted }}
              >
                ← {profile.display_name ?? username}
              </Link>

              <div className="mt-7">
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: theme.muted }}>
                  {vibe.eyebrow}
                </p>
                <h1
                  className={`mt-4 text-4xl font-semibold tracking-tight sm:text-5xl ${displayClass}`}
                  style={{
                    textTransform: page.theme === 'travel' ? 'uppercase' : undefined,
                    letterSpacing:
                      page.theme === 'travel' || page.theme === 'night'
                        ? '-0.02em'
                        : undefined,
                    lineHeight:
                      page.theme === 'travel' || page.theme === 'night'
                        ? 0.94
                        : undefined,
                    fontStyle: page.theme === 'cafe' ? 'italic' : undefined,
                    textShadow:
                      page.theme === 'night'
                        ? `0 0 18px ${theme.accent}20`
                        : undefined,
                  }}
                >
                  {page.title}
                </h1>
                <p className="mt-4 text-sm uppercase tracking-[0.26em]" style={{ color: theme.muted }}>
                  {vibe.tagline}
                </p>
                {page.description && (
                  <p className="mt-4 max-w-xl text-base leading-8" style={{ color: theme.muted }}>
                    {page.description}
                  </p>
                )}
                {(page.theme === 'travel' || page.theme === 'night' || page.theme === 'cafe') && (
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <span
                      className="rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.28em]"
                      style={{ borderColor: `${theme.accent}35`, color: theme.muted }}
                    >
                      {vibe.stamp}
                    </span>
                    <span
                      className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.28em]"
                      style={{
                        backgroundColor: page.theme === 'night' ? `${theme.accent}20` : `${theme.accent}12`,
                        color: theme.text,
                      }}
                    >
                      {page.theme === 'travel' ? 'Cover Story' : page.theme === 'night' ? 'Flyer Cut' : 'Indie Print'}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-[1.4rem] p-4" style={{ backgroundColor: `${theme.accent}12` }}>
                  <p className="text-xs uppercase tracking-[0.24em]" style={{ color: theme.muted }}>
                    Posts
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{posts?.length ?? 0}</p>
                </div>
                <div className="rounded-[1.4rem] p-4" style={{ backgroundColor: `${theme.accent}12` }}>
                  <p className="text-xs uppercase tracking-[0.24em]" style={{ color: theme.muted }}>
                    Theme
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{theme.label}</p>
                </div>
              </div>

              {quotePost && (
                <blockquote className="mt-8 border-l-2 pl-4 text-sm leading-7 sm:text-base" style={{ borderColor: theme.accent }}>
                  “{quotePost}”
                </blockquote>
              )}
            </div>
          </aside>

          <main className="space-y-5">
            {leadPost && (
              <article
                className="relative overflow-hidden rounded-[2.2rem] border"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: `${theme.accent}22`,
                  boxShadow:
                    vibe.cardMode === 'poster'
                      ? `0 28px 80px ${theme.accent}18`
                      : undefined,
                }}
              >
                {(leadPost.thumbnail_url || leadPost.media_url) && (
                  <div className="aspect-[4/5] sm:aspect-[16/10]">
                    {leadPost.media_type === 'video' ? (
                      <video
                        src={leadPost.media_url ?? undefined}
                        poster={leadPost.thumbnail_url ?? undefined}
                        controls
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <img
                        src={leadPost.thumbnail_url ?? leadPost.media_url ?? ''}
                        alt=""
                        className="h-full w-full object-cover"
                        style={{
                          filter:
                            page.theme === 'night'
                              ? 'contrast(1.14) saturate(1.22)'
                              : page.theme === 'cafe'
                                ? 'saturate(0.88) sepia(0.08)'
                                : undefined,
                        }}
                      />
                    )}
                  </div>
                )}
                {page.theme === 'travel' && (
                  <>
                    <div
                      className="absolute left-4 top-4 rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.28em] sm:left-6 sm:top-6"
                      style={{ borderColor: 'rgba(255,255,255,0.55)', color: '#fff', backgroundColor: 'rgba(0,0,0,0.18)' }}
                    >
                      {vibe.stamp}
                    </div>
                    <div
                      className={`absolute right-4 top-6 text-right text-5xl leading-none sm:right-6 sm:text-7xl ${bebasNeue.className}`}
                      style={{ color: 'rgba(255,255,255,0.8)', textShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
                    >
                      COVER
                    </div>
                  </>
                )}
                {page.theme === 'night' && (
                  <div className="absolute inset-x-0 top-0 flex overflow-hidden border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className={`shrink-0 px-4 py-2 text-xs uppercase tracking-[0.32em] ${bebasNeue.className}`}
                        style={{ color: '#f6f0ff', backgroundColor: index % 2 === 0 ? 'rgba(233,69,96,0.82)' : 'rgba(21,21,34,0.82)' }}
                      >
                        AFTER DARK
                      </div>
                    ))}
                  </div>
                )}
                {page.theme === 'cafe' && (
                  <>
                    <div
                      className="absolute left-5 top-5 -rotate-2 rounded-sm px-3 py-2 text-[11px] uppercase tracking-[0.24em] shadow-sm"
                      style={{ backgroundColor: 'rgba(255,248,238,0.88)', color: '#7a5a42' }}
                    >
                      handpicked note
                    </div>
                    <div
                      className={`absolute bottom-6 right-6 rotate-2 rounded-full border px-4 py-1 text-sm ${cormorantGaramond.className}`}
                      style={{ borderColor: 'rgba(255,255,255,0.68)', color: '#fff', backgroundColor: 'rgba(92,66,42,0.18)' }}
                    >
                      warm issue
                    </div>
                  </>
                )}
                {vibe.cardMode === 'poster' && (
                  <div
                    className="absolute inset-x-0 bottom-0 p-6 sm:p-8"
                    style={{
                      background:
                        page.theme === 'night'
                          ? 'linear-gradient(180deg, transparent 0%, rgba(8,8,14,0.94) 78%)'
                          : 'linear-gradient(180deg, transparent 0%, rgba(22,40,48,0.84) 78%)',
                      color: '#fff',
                    }}
                  >
                    <p className="text-xs uppercase tracking-[0.28em] opacity-80">{vibe.eyebrow}</p>
                    {leadPost.caption && (
                      <p
                        className={`mt-3 max-w-2xl text-xl leading-[1.45] sm:text-3xl ${displayClass}`}
                        style={{
                          letterSpacing:
                            page.theme === 'travel' || page.theme === 'night'
                              ? '0.015em'
                              : undefined,
                          fontStyle: page.theme === 'cafe' ? 'italic' : undefined,
                        }}
                      >
                        {leadPost.caption}
                      </p>
                    )}
                    <p className="mt-5 text-xs uppercase tracking-[0.24em] opacity-80">
                      {new Date(leadPost.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                )}
                <div
                  className="flex flex-col gap-3 p-5 sm:p-6"
                  style={{ display: vibe.cardMode === 'poster' ? 'none' : undefined }}
                >
                  {leadPost.caption && (
                    <p className={`text-lg leading-8 sm:text-xl ${page.theme === 'cafe' ? cormorantGaramond.className : ''}`} style={{ fontStyle: page.theme === 'cafe' ? 'italic' : undefined }}>
                      {leadPost.caption}
                    </p>
                  )}
                  <p className="text-xs uppercase tracking-[0.24em]" style={{ color: theme.muted }}>
                    {new Date(leadPost.created_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </article>
            )}

            {bodyPosts.length > 0 ? (
              <div className={vibe.mosaic ? 'columns-1 gap-5 md:columns-2' : 'grid gap-5 md:grid-cols-2'}>
                {bodyPosts.map((post, index) => (
                  <article
                    key={post.id}
                    className="mb-5 overflow-hidden rounded-[2rem] border transition-transform duration-200 hover:-translate-y-1"
                    style={{
                      backgroundColor: theme.surface,
                      borderColor: `${theme.accent}20`,
                      transform:
                        vibe.cardMode === 'clean'
                          ? 'none'
                          : index % 4 === 1
                            ? 'rotate(-0.9deg)'
                            : index % 4 === 3
                              ? 'rotate(0.9deg)'
                              : 'none',
                      boxShadow:
                        vibe.cardMode === 'poster'
                          ? `0 24px 60px ${theme.accent}18`
                          : undefined,
                      breakInside: 'avoid',
                    }}
                  >
                    {(post.thumbnail_url || post.media_url) && (
                      <div
                        className={
                          vibe.mosaic
                            ? index % 4 === 0
                              ? 'aspect-[4/5.3]'
                              : index % 4 === 1
                                ? 'aspect-[4/4]'
                                : index % 4 === 2
                                  ? 'aspect-[4/4.9]'
                                  : 'aspect-[4/4.3]'
                            : index % 3 === 0
                              ? 'aspect-[4/5]'
                              : 'aspect-[4/4.2]'
                        }
                      >
                        {post.media_type === 'video' ? (
                          <video
                            src={post.media_url ?? undefined}
                            poster={post.thumbnail_url ?? undefined}
                            controls
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <img
                            src={post.thumbnail_url ?? post.media_url ?? ''}
                            alt=""
                            className="h-full w-full object-cover"
                            style={{
                              filter:
                                page.theme === 'night'
                                  ? 'contrast(1.1) saturate(1.15)'
                                  : page.theme === 'cafe'
                                    ? 'saturate(0.92) sepia(0.06)'
                                    : undefined,
                            }}
                          />
                        )}
                      </div>
                    )}
                    <div className="space-y-3 p-4 sm:p-5">
                      {(page.theme === 'travel' || page.theme === 'night' || page.theme === 'cafe') && (
                        <div className="flex items-center justify-between gap-3">
                          <span
                            className={`text-[11px] uppercase tracking-[0.28em] ${page.theme === 'travel' || page.theme === 'night' ? bebasNeue.className : cormorantGaramond.className}`}
                            style={{ color: theme.muted, fontStyle: page.theme === 'cafe' ? 'italic' : undefined }}
                          >
                            {page.theme === 'travel' ? 'Cut' : page.theme === 'night' ? 'Lineup' : 'Page note'}
                          </span>
                          <span className="text-[11px] uppercase tracking-[0.24em]" style={{ color: theme.muted }}>
                            {String(index + 2).padStart(2, '0')}
                          </span>
                        </div>
                      )}
                      {post.caption && (
                        <p
                          className={`text-sm leading-7 sm:text-[15px] ${page.theme === 'cafe' ? cormorantGaramond.className : ''}`}
                          style={{ fontStyle: page.theme === 'cafe' ? 'italic' : undefined }}
                        >
                          {post.caption}
                        </p>
                      )}
                      <p className="text-xs uppercase tracking-[0.24em]" style={{ color: theme.muted }}>
                        {new Date(post.created_at).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : !leadPost ? (
              <p className="rounded-[1.6rem] border px-5 py-4 text-sm" style={{ color: theme.muted, borderColor: `${theme.accent}20` }}>
                まだ投稿がありません
              </p>
            ) : null}
          </main>
        </div>
      </div>
    </div>
  )
}
