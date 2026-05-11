'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShareModal } from '@/components/share/ShareModal'
import { THEMES, type ThemeConfig } from '@/lib/themes'
import { cn } from '@/utils/cn'
import type { Post, Theme } from '@/types'

function ThemeCard({ theme, selected, onClick }: { theme: ThemeConfig; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={cn('relative rounded-xl overflow-hidden border-2 transition-all', selected ? 'border-zinc-900 scale-[1.02]' : 'border-transparent hover:border-zinc-300')}
      style={{ backgroundColor: theme.bg }}>
      <div className="p-3 space-y-1.5">
        <div className="h-8 rounded-lg" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.muted}22` }} />
        <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: theme.accent }} />
      </div>
      <div className="px-3 pb-2 text-xs font-medium" style={{ color: theme.text }}>{theme.label}</div>
      {selected && (
        <div className="absolute top-1 right-1 w-4 h-4 bg-zinc-900 rounded-full flex items-center justify-center">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      )}
    </button>
  )
}

export default function EditPagePage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [theme, setTheme] = useState<Theme>('daily')
  const [isPublic, setIsPublic] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [pageTitle, setPageTitle] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      const [{ data: page }, { data: pagePosts }] = await Promise.all([
        supabase.from('pages').select('*').eq('id', id).eq('user_id', user.id).single(),
        supabase.from('posts').select('*').eq('page_id', id).order('sort_order').order('created_at', { ascending: false }),
      ])
      if (!page) { router.push('/dashboard'); return }
      setTitle(page.title)
      setPageTitle(page.title)
      setSlug(page.slug)
      setDescription(page.description ?? '')
      setTheme(page.theme as Theme)
      setIsPublic(page.is_public)
      setPosts(pagePosts ?? [])
    })
  }, [id, router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.from('pages').update({
      title, description: description.trim() || null, theme, is_public: isPublic,
    }).eq('id', id)
    if (updateError) { setError(updateError.message); setSaving(false); return }
    setPageTitle(title)
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm(`「${pageTitle}」を削除しますか？\n投稿はページから外れますが削除されません。`)) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('pages').delete().eq('id', id)
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="text-sm text-zinc-500 hover:text-zinc-900">← 戻る</button>
          <h1 className="text-sm font-semibold text-zinc-900 truncate max-w-[160px]">{pageTitle || 'ページを編集'}</h1>
          <button form="edit-page-form" type="submit" disabled={saving}
            className="text-sm font-medium text-zinc-900 hover:opacity-60 disabled:opacity-30 transition-opacity">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <form id="edit-page-form" onSubmit={handleSave} className="space-y-5">
          <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wide">タイトル</label>
                <input value={title} onChange={e => setTitle(e.target.value)} required
                  className="w-full text-lg font-medium outline-none text-zinc-900 placeholder:text-zinc-300" />
              </div>
              <div className="border-t border-zinc-100 pt-3">
                <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wide">スラッグ</label>
                <p className="text-sm text-zinc-400 font-mono">/you/<span className="text-zinc-700">{slug}</span></p>
                <p className="text-xs text-zinc-300 mt-0.5">スラッグは変更できません（URLが変わってしまうため）</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-zinc-100 rounded-xl p-4">
            <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wide">説明（任意）</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full text-sm outline-none resize-none text-zinc-900 placeholder:text-zinc-300" />
          </div>

          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">テーマ</p>
            <div className="grid grid-cols-4 gap-2">
              {(Object.values(THEMES) as ThemeConfig[]).map(t => (
                <ThemeCard key={t.id} theme={t} selected={theme === t.id} onClick={() => setTheme(t.id)} />
              ))}
            </div>
          </div>

          <div className="bg-white border border-zinc-100 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-800">公開する</p>
              <p className="text-xs text-zinc-400 mt-0.5">{isPublic ? '誰でも見れます' : '自分だけ見れます'}</p>
            </div>
            <button type="button" onClick={() => setIsPublic(v => !v)}
              className={cn('relative w-11 h-6 rounded-full transition-colors', isPublic ? 'bg-zinc-900' : 'bg-zinc-200')}>
              <span className={cn('absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform', isPublic ? 'translate-x-6' : 'translate-x-1')} />
            </button>
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button type="button" onClick={() => setShowShare(true)}
            className="w-full py-2.5 border border-zinc-200 text-zinc-700 text-sm rounded-xl hover:border-zinc-400 transition-colors">
            このページの共有リンクを作成
          </button>
        </form>

        {/* このページの投稿一覧 */}
        {posts.length > 0 && (
          <div className="mt-8 space-y-3">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">このページの投稿 ({posts.length})</p>
            <div className="grid grid-cols-3 gap-2">
              {posts.map(post => (
                <a key={post.id} href={`/dashboard/post/${post.id}`}
                  className="aspect-square bg-zinc-100 rounded-lg overflow-hidden relative group">
                  {post.thumbnail_url || post.media_url
                    ? <img src={post.thumbnail_url ?? post.media_url ?? ''} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-zinc-300 text-xl">{post.media_type === 'video' ? '▶' : '□'}</div>}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* 削除 */}
        <div className="mt-6">
          <button type="button" onClick={handleDelete} disabled={deleting}
            className="w-full py-2.5 border border-red-100 text-red-500 text-sm rounded-xl hover:bg-red-50 disabled:opacity-40 transition-colors">
            {deleting ? '削除中...' : 'このページを削除する'}
          </button>
        </div>
      </div>

      {showShare && <ShareModal pageId={id} label={pageTitle} onClose={() => setShowShare(false)} />}
    </div>
  )
}
