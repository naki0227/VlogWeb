'use client'

import Link from 'next/link'
import { useAccumulationStage } from '@/hooks/useAccumulationStage'
import { GhostLayer, GhostCard } from '@/components/accumulation/GhostLayer'
import { cn } from '@/utils/cn'
import type { Profile, Post, Page } from '@/types'

interface Props {
  profile: Profile | null
  posts: Post[]
  postCount: number
  pages: Page[]
}

// Stage 2: 7投稿ごとにゴーストを1枚挿入
function buildGridItems(posts: Post[], ghostPosts: import('@/hooks/useAccumulationStage').GhostPost[], stage: number) {
  if (stage < 2 || ghostPosts.length === 0) {
    return posts.map(p => ({ type: 'post' as const, data: p }))
  }
  const items: Array<{ type: 'post'; data: Post } | { type: 'ghost'; data: (typeof ghostPosts)[0] }> = []
  let ghostIdx = 0
  posts.forEach((post, i) => {
    if (i > 0 && i % 7 === 0 && ghostIdx < ghostPosts.length) {
      items.push({ type: 'ghost', data: ghostPosts[ghostIdx++] })
    }
    items.push({ type: 'post', data: post })
  })
  return items
}

export function DashboardClient({ profile, posts, postCount, pages }: Props) {
  const { stage, ghostPosts } = useAccumulationStage()
  const gridItems = buildGridItems(posts, ghostPosts, stage)
  const onboardingSteps = [
    {
      title: '1. 最初の投稿を追加',
      description: '写真か動画を1つ入れると、サイトの土台ができます。',
      href: '/dashboard/post/new',
      done: postCount > 0,
      cta: '投稿する',
    },
    {
      title: '2. ページを作る',
      description: '旅、カフェ、日常などテーマごとにまとめられます。',
      href: '/dashboard/pages/new',
      done: pages.length > 0,
      cta: 'ページを作る',
    },
    {
      title: '3. 公開方法を決める',
      description: 'まずは限定公開で始めて、慣れたら公開にするのがおすすめです。',
      href: '/dashboard/settings',
      done: posts.some(p => p.visibility !== 'private') || pages.some(p => p.is_public),
      cta: '設定を見る',
    },
  ]

  return (
    <div className="min-h-screen bg-zinc-50 relative">
      {/* Stage 1+: 背景ゴーストレイヤー（通知なし・静かに） */}
      <GhostLayer stage={stage} ghostPosts={ghostPosts} />

      <header className="bg-white border-b border-zinc-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-zinc-900">Belle Trace</span>
            <Link href="/dashboard/settings" className="text-xs text-zinc-400 hover:text-zinc-600">設定</Link>
          </div>
          <div className="flex items-center gap-3">
            <a href={`/${profile?.username}`} target="_blank" className="text-sm text-zinc-500 hover:text-zinc-900">
              サイトを見る →
            </a>
            <Link href="/dashboard/post/new"
              className="px-4 py-1.5 bg-zinc-900 text-white text-sm rounded-full hover:bg-zinc-800 transition-colors">
              投稿する
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8 relative z-[1]">
        {/* stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: '投稿数', value: postCount },
            { label: 'ページ数', value: pages.length },
            { label: '公開中', value: posts.filter(p => p.visibility === 'public').length },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl p-4 border border-zinc-100">
              <p className="text-2xl font-semibold text-zinc-900">{value}</p>
              <p className="text-sm text-zinc-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">はじめかた</h2>
              <p className="mt-1 text-sm text-zinc-500">どこから触ればいいか迷わないように、最短ルートを置いてあります。</p>
            </div>
            <p className="shrink-0 text-xs font-medium text-zinc-400">
              {onboardingSteps.filter(step => step.done).length}/{onboardingSteps.length} 完了
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {onboardingSteps.map(step => (
              <div key={step.title} className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                <p className="text-sm font-semibold text-zinc-900">{step.title}</p>
                <p className="mt-1 min-h-12 text-sm leading-relaxed text-zinc-500">{step.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className={cn('text-xs font-medium', step.done ? 'text-emerald-600' : 'text-zinc-400')}>
                    {step.done ? '完了' : '未完了'}
                  </span>
                  <Link href={step.href} className="text-sm font-medium text-zinc-900 hover:opacity-70">
                    {step.cta} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* pages */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-zinc-700">ページ</h2>
            <Link href="/dashboard/pages/new" className="text-sm text-zinc-500 hover:text-zinc-900">+ 追加</Link>
          </div>
          {pages.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {pages.map(page => (
                <Link key={page.id} href={`/dashboard/pages/${page.id}`}
                  className="px-3 py-1.5 bg-white border border-zinc-200 rounded-full text-sm text-zinc-700 hover:border-zinc-400 transition-colors">
                  {page.title}
                  {!page.is_public && <span className="ml-1.5 text-xs text-zinc-300">非公開</span>}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400">
              ページはまだありません。
              <Link href="/dashboard/pages/new" className="text-zinc-600 hover:underline ml-1">作成する →</Link>
            </p>
          )}
        </section>

        {/* posts grid */}
        <section>
          <h2 className="text-sm font-medium text-zinc-700 mb-3">投稿</h2>
          {gridItems.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {gridItems.map((item, idx) =>
                item.type === 'post' ? (
                  <Link key={item.data.id} href={`/dashboard/post/${item.data.id}`}
                    className="aspect-square bg-zinc-100 rounded-lg overflow-hidden relative group">
                    {item.data.thumbnail_url || item.data.media_url ? (
                      <img src={item.data.thumbnail_url ?? item.data.media_url ?? ''} alt=""
                        className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-300 text-2xl">
                        {item.data.media_type === 'video' ? '▶' : '□'}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    {item.data.visibility !== 'public' && (
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-black/60 text-white text-xs rounded">
                        {item.data.visibility === 'private' ? '非公開' : '限定'}
                      </span>
                    )}
                  </Link>
                ) : (
                  // Stage 2: ゴーストカード（通知なし・静かに混ざる）
                  <GhostCard key={`ghost-${idx}`} post={item.data} />
                )
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-zinc-400">
              <p className="text-4xl mb-3">+</p>
              <p className="text-sm">最初の投稿をしよう</p>
              <Link href="/dashboard/post/new" className="mt-3 inline-block text-sm text-zinc-600 hover:underline">
                投稿する →
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
