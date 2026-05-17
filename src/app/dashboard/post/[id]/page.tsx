'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShareModal } from '@/components/share/ShareModal'
import { cn } from '@/utils/cn'
import type { Page, Visibility } from '@/types'

export default function EditPostPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [caption, setCaption] = useState('')
  const [visibility, setVisibility] = useState<Visibility>('private')
  const [pageId, setPageId] = useState('')
  const [pages, setPages] = useState<Page[]>([])
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'video' | 'photo' | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPost() {
      setLoading(true)
      const res = await fetch(`/api/dashboard/posts/${id}`, { cache: 'no-store' })
      if (res.status === 401) { router.push('/auth/login'); return }
      if (res.status === 404) {
        setError('投稿が見つかりませんでした。')
        setLoading(false)
        return
      }

      const data = await res.json()
      setCaption(data.post.caption ?? '')
      setVisibility(data.post.visibility)
      setPageId(data.post.page_id ?? '')
      setMediaUrl(data.post.media_url)
      setThumbnailUrl(data.post.thumbnail_url)
      setMediaType(data.post.media_type)
      setPages(data.pages ?? [])
      setLoading(false)
    }

    loadPost()
  }, [id, router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.from('posts').update({
      caption: caption.trim() || null,
      visibility,
      page_id: pageId || null,
    }).eq('id', id)
    if (updateError) { setError(updateError.message); setSaving(false); return }
    router.push('/dashboard')
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('この投稿を削除しますか？')) return
    setDeleting(true)
    const supabase = createClient()

    // Storageからファイル削除
    const toDelete = [mediaUrl, thumbnailUrl].filter(Boolean) as string[]
    for (const url of toDelete) {
      const path = new URL(url).pathname.split('/object/public/media/')[1]
      if (path) await supabase.storage.from('media').remove([path])
    }

    await supabase.from('posts').delete().eq('id', id)
    router.push('/dashboard')
    router.refresh()
  }

  const previewUrl = thumbnailUrl ?? mediaUrl

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="text-sm text-zinc-500 hover:text-zinc-900">← 戻る</button>
          <h1 className="text-sm font-semibold text-zinc-900">投稿を編集</h1>
          <button form="edit-form" type="submit" disabled={saving}
            className="text-sm font-medium text-zinc-900 hover:opacity-60 disabled:opacity-30 transition-opacity">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading && (
          <div className="mb-4 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-500">
            投稿を読み込み中...
          </div>
        )}
        <form id="edit-form" onSubmit={handleSave} className="space-y-5">
          {/* プレビュー */}
          {previewUrl && (
            <div className="rounded-2xl overflow-hidden bg-black aspect-video">
              {mediaType === 'video'
                ? <video src={mediaUrl ?? undefined} poster={thumbnailUrl ?? undefined} controls playsInline className="w-full h-full object-contain" />
                : <img src={previewUrl} alt="" className="w-full h-full object-contain" />}
            </div>
          )}

          {/* キャプション */}
          <textarea value={caption} onChange={e => setCaption(e.target.value)}
            placeholder="キャプションを書く（任意）" rows={3}
            className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-950 resize-none outline-none focus:ring-2 focus:ring-zinc-900 placeholder:text-zinc-400" />

          {/* 公開設定 */}
          <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
            <p className="px-4 pt-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">公開設定</p>
            <div className="p-2">
              {([
                { value: 'private', label: '非公開', desc: '自分だけ' },
                { value: 'unlisted', label: '限定公開', desc: 'URLを知る人だけ' },
                { value: 'public', label: '公開', desc: '誰でも見れる' },
              ] as const).map(opt => (
                <label key={opt.value} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors', visibility === opt.value ? 'bg-zinc-100' : 'hover:bg-zinc-50')}>
                  <input type="radio" name="visibility" value={opt.value} checked={visibility === opt.value} onChange={() => setVisibility(opt.value)} className="accent-zinc-900" />
                  <div>
                    <p className="text-sm font-medium text-zinc-800">{opt.label}</p>
                    <p className="text-xs text-zinc-400">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* ページ */}
          {pages.length > 0 && (
            <div className="bg-white border border-zinc-100 rounded-xl p-4">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">ページ</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setPageId('')}
                  className={cn('px-3 py-1.5 rounded-full text-sm border transition-colors',
                    pageId === '' ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-600 hover:border-zinc-400')}>
                  なし
                </button>
                {pages.map(p => (
                  <button key={p.id} type="button" onClick={() => setPageId(p.id)}
                    className={cn('px-3 py-1.5 rounded-full text-sm border transition-colors',
                      pageId === p.id ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-600 hover:border-zinc-400')}>
                    {p.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          {/* 共有ボタン */}
          <button type="button" onClick={() => setShowShare(true)}
            className="w-full py-2.5 border border-zinc-200 text-zinc-700 text-sm rounded-xl hover:border-zinc-400 transition-colors">
            共有リンクを作成
          </button>

          {/* 削除 */}
          <button type="button" onClick={handleDelete} disabled={deleting}
            className="w-full py-2.5 border border-red-100 text-red-500 text-sm rounded-xl hover:bg-red-50 disabled:opacity-40 transition-colors">
            {deleting ? '削除中...' : 'この投稿を削除する'}
          </button>
        </form>
      </div>

      {showShare && <ShareModal postId={id} onClose={() => setShowShare(false)} />}
    </div>
  )
}
