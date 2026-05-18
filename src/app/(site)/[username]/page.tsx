import Link from 'next/link'
import { Bebas_Neue, Cormorant_Garamond } from 'next/font/google'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTheme } from '@/lib/themes'
import type { Theme } from '@/types'

interface Props {
  params: Promise<{ username: string }>
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

const HOME_VIBES: Record<
  Theme,
  {
    eyebrow: string
    kicker: string
    note: string
    badge: string
    layout: 'editorial' | 'scrap' | 'poster' | 'quiet'
    stamp: string
  }
> = {
  daily: {
    eyebrow: 'Personal Scrapbook',
    kicker: '日常の断片が、あとから効いてくる。',
    note: '気分で撮ったものが、そのままムードになる。',
    badge: 'Open diary',
    layout: 'scrap',
    stamp: 'Vol. 01',
  },
  cafe: {
    eyebrow: 'Cafe Notes',
    kicker: '余白までおいしい、やわらかい記録。',
    note: '光・カップ・椅子の距離感まで残すためのページ。',
    badge: 'Soft issue',
    layout: 'editorial',
    stamp: 'ZINE CUT',
  },
  travel: {
    eyebrow: 'Travel Journal',
    kicker: '移動したぶんだけ、景色の熱量が増えていく。',
    note: '遠征、寄り道、偶然のカットをポスターみたいに並べる。',
    badge: 'Field Note',
    layout: 'poster',
    stamp: 'Issue 24',
  },
  night: {
    eyebrow: 'Night Archive',
    kicker: '夜の空気ごと切り取る、静かなログ。',
    note: 'ネオン、路地、ノイズ感をそのまま残すアーカイブ。',
    badge: 'After Dark',
    layout: 'poster',
    stamp: 'Live 02AM',
  },
  minimal: {
    eyebrow: 'Quiet Portfolio',
    kicker: '余計な説明はいらない、静かな見せ方。',
    note: '線と余白で整える、観察寄りのページ。',
    badge: 'Quiet edit',
    layout: 'quiet',
    stamp: 'Edit',
  },
  wedding: {
    eyebrow: 'Ceremony Story',
    kicker: '一日分の温度を、やさしく重ねていく。',
    note: '大切な瞬間を、品よく柔らかく見せる。',
    badge: 'Ceremony',
    layout: 'editorial',
    stamp: 'Story',
  },
  birthday: {
    eyebrow: 'Birthday Diary',
    kicker: 'うれしい空気を、そのままギフトにする。',
    note: '色、声、サプライズ感をポップに残すページ。',
    badge: 'Gift mood',
    layout: 'scrap',
    stamp: 'Party',
  },
}

function getHomeBackground(themeId: Theme, theme: ReturnType<typeof getTheme>) {
  switch (themeId) {
    case 'travel':
      return `radial-gradient(circle at 12% 12%, ${theme.accent}30, transparent 22%), radial-gradient(circle at 82% 18%, #ffffff 0%, transparent 18%), linear-gradient(180deg, #f5fbff 0%, ${theme.bg} 48%, ${theme.surface} 100%)`
    case 'night':
      return `radial-gradient(circle at 18% 14%, ${theme.accent}32, transparent 18%), radial-gradient(circle at 78% 0%, #3f4cff22, transparent 22%), linear-gradient(180deg, #090914 0%, ${theme.bg} 38%, #111119 100%)`
    case 'cafe':
      return `radial-gradient(circle at top left, #fff5e633, transparent 24%), linear-gradient(180deg, #f7ead8 0%, ${theme.bg} 55%, ${theme.surface} 100%)`
    case 'birthday':
      return `radial-gradient(circle at top left, #ff4da620, transparent 22%), radial-gradient(circle at 85% 15%, #ffd6ea 0%, transparent 20%), linear-gradient(180deg, #fff8fb 0%, ${theme.bg} 60%, ${theme.surface} 100%)`
    default:
      return `radial-gradient(circle at top left, ${theme.accent}14, transparent 28%), linear-gradient(180deg, ${theme.bg} 0%, ${theme.surface} 100%)`
  }
}

function getDisplayClass(themeId: Theme) {
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

  const dominantThemeId = (pages?.[0]?.theme as Theme | undefined) ?? 'daily'
  const theme = getTheme(dominantThemeId)
  const vibe = HOME_VIBES[dominantThemeId]
  const featuredPost = posts?.[0] ?? null
  const restPosts = posts?.slice(1) ?? []
  const displayClass = getDisplayClass(dominantThemeId)

  return (
    <div
      className="min-h-screen"
      style={{
        background: getHomeBackground(dominantThemeId, theme),
        color: theme.text,
        fontFamily: theme.fontFamily,
      }}
    >
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        <header className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              {profile.avatar_url && (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-14 w-14 rounded-2xl object-cover ring-1"
                  style={{ borderColor: `${theme.accent}33` }}
                />
              )}
              <div className="text-sm tracking-[0.28em] uppercase" style={{ color: theme.muted }}>
                {vibe.eyebrow}
              </div>
            </div>
            <div className="space-y-4">
              <h1
                className={`max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl ${displayClass}`}
                style={{
                  letterSpacing:
                    dominantThemeId === 'night'
                      ? '-0.04em'
                      : dominantThemeId === 'travel'
                        ? '-0.02em'
                        : undefined,
                  textTransform: dominantThemeId === 'travel' ? 'uppercase' : undefined,
                  lineHeight: dominantThemeId === 'travel' || dominantThemeId === 'night' ? 0.92 : undefined,
                  fontStyle: dominantThemeId === 'cafe' ? 'italic' : undefined,
                  textShadow:
                    dominantThemeId === 'night'
                      ? `0 0 22px ${theme.accent}20`
                      : undefined,
                }}
              >
                {profile.display_name ?? profile.username}
              </h1>
              <p className="max-w-2xl text-lg leading-8 sm:text-xl">
                {vibe.kicker}
              </p>
              {profile.bio && (
                <p className="max-w-2xl text-base leading-8 sm:text-lg" style={{ color: theme.muted }}>
                  {profile.bio}
                </p>
              )}
            </div>
            {(dominantThemeId === 'travel' || dominantThemeId === 'night' || dominantThemeId === 'cafe') && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <span
                  className="rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.28em]"
                  style={{ borderColor: `${theme.accent}35`, color: theme.muted }}
                >
                  {vibe.stamp}
                </span>
                <span
                  className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.28em]"
                  style={{
                    backgroundColor:
                      dominantThemeId === 'night' ? `${theme.accent}20` : `${theme.accent}12`,
                    color: theme.text,
                  }}
                >
                  {dominantThemeId === 'travel' ? 'Cover Story' : dominantThemeId === 'night' ? 'Flyer Cut' : 'Indie Print'}
                </span>
              </div>
            )}
          </div>

            <div
              className="rounded-[2rem] border p-5 backdrop-blur-sm"
              style={{
                background:
                  dominantThemeId === 'night'
                    ? `linear-gradient(180deg, ${theme.surface}f5 0%, #11111a 100%)`
                    : `${theme.surface}E6`,
                borderColor: `${theme.accent}22`,
                boxShadow:
                  vibe.layout === 'poster'
                    ? `0 24px 60px ${theme.accent}16`
                    : undefined,
              }}
            >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em]" style={{ color: theme.muted }}>
                  Pages
                </p>
                <p className="mt-2 text-3xl font-semibold">{pages?.length ?? 0}</p>
                <p className="mt-2 text-sm leading-7" style={{ color: theme.muted }}>
                  {vibe.note}
                </p>
              </div>
              {isOwner && (
                <Link
                  href="/dashboard"
                  className="rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] transition-opacity hover:opacity-70"
                  style={{ borderColor: `${theme.accent}33`, color: theme.text }}
                >
                  Dashboard
                </Link>
              )}
            </div>

            {pages && pages.length > 0 && (
              <nav className="mt-5 grid gap-3">
                {pages.map((page, index) => (
                  <Link
                    key={page.id}
                    href={`/${username}/${page.slug}`}
                    className="group flex items-center justify-between rounded-[1.4rem] border px-4 py-4 transition-transform duration-200 hover:-translate-y-0.5"
                    style={{
                      background:
                        dominantThemeId === 'night'
                          ? `linear-gradient(135deg, ${theme.surface} 0%, #131320 100%)`
                          : dominantThemeId === 'travel'
                            ? `linear-gradient(135deg, ${theme.accent}12 0%, ${theme.surface} 100%)`
                            : index % 2 === 0
                              ? `${theme.accent}10`
                              : theme.surface,
                      borderColor: `${theme.accent}1f`,
                    }}
                  >
                    <div>
                      <p
                        className={`text-base font-medium ${page.theme === 'travel' || page.theme === 'night' ? bebasNeue.className : page.theme === 'cafe' ? cormorantGaramond.className : ''}`}
                        style={{
                          fontSize:
                            page.theme === 'travel' || page.theme === 'night'
                              ? '1.45rem'
                              : page.theme === 'cafe'
                                ? '1.3rem'
                                : undefined,
                          letterSpacing:
                            page.theme === 'travel' || page.theme === 'night'
                              ? '0.02em'
                              : undefined,
                          fontStyle: page.theme === 'cafe' ? 'italic' : undefined,
                          textTransform: page.theme === 'travel' ? 'uppercase' : undefined,
                        }}
                      >
                        {page.title}
                      </p>
                      {page.description && (
                        <p className="mt-1 text-sm line-clamp-2" style={{ color: theme.muted }}>
                          {page.description}
                        </p>
                      )}
                    </div>
                    <span className="text-sm transition-transform group-hover:translate-x-1">↗</span>
                  </Link>
                ))}
              </nav>
            )}
          </div>
        </header>

        {featuredPost && (
          <section className="mt-10 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <article
              className="relative overflow-hidden rounded-[2.2rem] border"
              style={{
                backgroundColor: theme.surface,
                borderColor: `${theme.accent}20`,
                boxShadow:
                  vibe.layout === 'poster'
                    ? `0 28px 80px ${theme.accent}18`
                    : undefined,
              }}
            >
              <div className="aspect-[4/5] sm:aspect-[16/11]">
                <img
                  src={featuredPost.thumbnail_url ?? featuredPost.media_url ?? ''}
                  alt=""
                  className="h-full w-full object-cover"
                  style={{
                    filter:
                      dominantThemeId === 'night'
                        ? 'contrast(1.14) saturate(1.22)'
                        : dominantThemeId === 'cafe'
                          ? 'saturate(0.88) sepia(0.08)'
                          : undefined,
                  }}
                />
              </div>
              {dominantThemeId === 'travel' && (
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
                    TRAVEL
                  </div>
                </>
              )}
              {dominantThemeId === 'night' && (
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
              {dominantThemeId === 'cafe' && (
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
              {vibe.layout === 'poster' && (
                <div
                  className="absolute inset-x-0 bottom-0 p-6 sm:p-8"
                  style={{
                    background:
                      dominantThemeId === 'night'
                        ? 'linear-gradient(180deg, transparent 0%, rgba(8,8,14,0.94) 78%)'
                        : 'linear-gradient(180deg, transparent 0%, rgba(22,40,48,0.82) 78%)',
                    color: '#fff',
                  }}
                >
                  <p className="text-xs uppercase tracking-[0.28em] opacity-80">{vibe.badge}</p>
                  {featuredPost.caption && (
                    <p
                      className={`mt-3 max-w-2xl text-xl leading-[1.45] sm:text-3xl ${dominantThemeId === 'travel' || dominantThemeId === 'night' ? bebasNeue.className : dominantThemeId === 'cafe' ? cormorantGaramond.className : ''}`}
                      style={{
                        letterSpacing:
                          dominantThemeId === 'travel' || dominantThemeId === 'night'
                            ? '0.02em'
                            : undefined,
                        fontStyle: dominantThemeId === 'cafe' ? 'italic' : undefined,
                      }}
                    >
                      {featuredPost.caption}
                    </p>
                  )}
                </div>
              )}
            </article>
            <div
              className="flex flex-col justify-between rounded-[2.2rem] border p-6 sm:p-8"
              style={{
                background: `linear-gradient(180deg, ${theme.accent}12 0%, ${theme.surface} 100%)`,
                borderColor: `${theme.accent}20`,
              }}
            >
              <div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: theme.muted }}>
                  {vibe.layout === 'poster' ? 'Spotlight' : 'Latest Scene'}
                </p>
                <p
                  className={`mt-6 text-2xl font-medium leading-[1.35] sm:text-3xl ${dominantThemeId === 'cafe' ? cormorantGaramond.className : ''}`}
                  style={{ display: vibe.layout === 'poster' ? 'none' : undefined }}
                >
                  {featuredPost.caption ?? '何気ない瞬間が、そのまま雰囲気になる。'}
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.4rem] px-4 py-4" style={{ backgroundColor: `${theme.accent}10` }}>
                    <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: theme.muted }}>
                      Public posts
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{posts?.length ?? 0}</p>
                  </div>
                  <div className="rounded-[1.4rem] px-4 py-4" style={{ backgroundColor: `${theme.accent}10` }}>
                    <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: theme.muted }}>
                      Current mood
                    </p>
                    <p className="mt-2 text-lg font-medium">{theme.label}</p>
                  </div>
                </div>
                {dominantThemeId === 'cafe' && (
                  <div
                    className="mt-6 max-w-sm rounded-[1.4rem] border px-4 py-4"
                    style={{ borderColor: `${theme.accent}26`, backgroundColor: 'rgba(255,255,255,0.52)' }}
                  >
                    <p className={`text-lg ${cormorantGaramond.className}`} style={{ fontStyle: 'italic' }}>
                      Small scenes, slow edits, soft edges.
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-8 flex items-center justify-between gap-4">
                <p className="text-sm" style={{ color: theme.muted }}>
                  {new Date(featuredPost.created_at).toLocaleDateString('ja-JP')}
                </p>
                <span
                  className="rounded-full px-4 py-2 text-xs uppercase tracking-[0.24em]"
                  style={{ backgroundColor: `${theme.accent}14`, color: theme.text }}
                >
                  {vibe.badge}
                </span>
              </div>
            </div>
          </section>
        )}

        {restPosts.length > 0 && (
          <section className="mt-10">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em]" style={{ color: theme.muted }}>
                Free Posts
              </p>
              <p className="text-sm" style={{ color: theme.muted }}>
                {restPosts.length} moments
              </p>
            </div>

            <div
              className={
                vibe.layout === 'quiet'
                  ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3'
                  : 'columns-1 gap-4 sm:columns-2 xl:columns-3'
              }
            >
              {restPosts.map((post, index) => (
                <article
                  key={post.id}
                  className="mb-4 overflow-hidden rounded-[2rem] border transition-transform duration-200 hover:-translate-y-1"
                  style={{
                    backgroundColor: theme.surface,
                    borderColor: `${theme.accent}20`,
                    transform:
                      vibe.layout === 'quiet'
                        ? 'none'
                        : index % 3 === 1
                          ? 'rotate(-1deg)'
                          : index % 3 === 2
                            ? 'rotate(1deg)'
                            : 'none',
                    boxShadow:
                      vibe.layout === 'poster'
                        ? `0 22px 64px ${theme.accent}14`
                        : undefined,
                    breakInside: 'avoid',
                  }}
                >
                  {(post.thumbnail_url || post.media_url) && (
                    <div
                      className={
                        vibe.layout === 'quiet'
                          ? index % 3 === 0
                            ? 'aspect-[4/5]'
                            : 'aspect-[4/4.5]'
                          : index % 4 === 0
                            ? 'aspect-[4/5.4]'
                            : index % 4 === 1
                              ? 'aspect-[4/4]'
                              : index % 4 === 2
                                ? 'aspect-[4/5]'
                                : 'aspect-[4/4.6]'
                      }
                    >
                      <img
                        src={post.thumbnail_url ?? post.media_url ?? ''}
                        alt=""
                        className="h-full w-full object-cover"
                        style={{
                          filter:
                            dominantThemeId === 'night'
                              ? 'contrast(1.08) saturate(1.12)'
                              : dominantThemeId === 'cafe'
                                ? 'saturate(0.92) sepia(0.06)'
                                : undefined,
                        }}
                      />
                    </div>
                  )}
                  <div className="space-y-3 p-4">
                    {(dominantThemeId === 'travel' || dominantThemeId === 'night' || dominantThemeId === 'cafe') && (
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`text-[11px] uppercase tracking-[0.28em] ${dominantThemeId === 'travel' || dominantThemeId === 'night' ? bebasNeue.className : cormorantGaramond.className}`}
                          style={{ color: theme.muted, fontStyle: dominantThemeId === 'cafe' ? 'italic' : undefined }}
                        >
                          {dominantThemeId === 'travel' ? 'Cut' : dominantThemeId === 'night' ? 'Lineup' : 'Page note'}
                        </span>
                        <span className="text-[11px] uppercase tracking-[0.24em]" style={{ color: theme.muted }}>
                          {String(index + 2).padStart(2, '0')}
                        </span>
                      </div>
                    )}
                    {post.caption && (
                      <p
                        className={`text-sm leading-7 sm:text-[15px] ${dominantThemeId === 'cafe' ? cormorantGaramond.className : ''}`}
                        style={{ fontStyle: dominantThemeId === 'cafe' ? 'italic' : undefined }}
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
          </section>
        )}
      </div>
    </div>
  )
}
