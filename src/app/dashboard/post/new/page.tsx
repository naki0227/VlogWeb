'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { uploadMedia, uploadThumbnail, generateVideoThumbnail } from '@/lib/upload'
import { cn } from '@/utils/cn'
import type { Page, Visibility } from '@/types'

type Step = 'select' | 'edit'

export default function NewPostPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('select')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isVideo, setIsVideo] = useState(false)
  const [caption, setCaption] = useState('')
  const [visibility, setVisibility] = useState<Visibility>('private')
  const [pageId, setPageId] = useState<string>('')
  const [pages, setPages] = useState<Page[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      supabase
        .from('pages')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order')
        .then(({ data }) => setPages(data ?? []))
    })
  }, [router])

  // cleanup object URL on unmount
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [previewUrl])

  function handleFileSelected(selected: File) {
    const video = selected.type.startsWith('video/')
    const photo = selected.type.startsWith('image/')
    if (!video && !photo) {
      setError('動画または写真ファイルを選択してください')
      return
    }
    setError(null)
    setFile(selected)
    setIsVideo(video)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(selected))
    setStep('edit')
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFileSelected(f)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFileSelected(f)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setError(null)
    setUploading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ログインが必要です')

      // メディアアップロード
      const { url: mediaUrl, type: mediaType } = await uploadMedia(supabase, user.id, file)

      // 動画のサムネイル生成
      let thumbnailUrl: string | null = null
      if (isVideo) {
        try {
          const thumbBlob = await generateVideoThumbnail(file)
          thumbnailUrl = await uploadThumbnail(supabase, user.id, thumbBlob)
        } catch {
          // サムネイル生成失敗は無視して投稿を続ける
        }
      }

      const { error: insertError } = await supabase.from('posts').insert({
        user_id: user.id,
        media_url: mediaUrl,
        media_type: mediaType,
        thumbnail_url: thumbnailUrl,
        caption: caption.trim() || null,
        visibility,
        page_id: pageId || null,
      })

      if (insertError) throw new Error(insertError.message)

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '投稿に失敗しました')
      setUploading(false)
    }
  }

  // ---- STEP: SELECT ----
  if (step === 'select') {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-zinc-900">新しい投稿</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-zinc-400 hover:text-zinc-600"
            >
              キャンセル
            </button>
          </div>

          <div
            className={cn(
              'border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors',
              dragOver
                ? 'border-zinc-400 bg-zinc-100'
                : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
            )}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <div className="text-4xl mb-3 text-zinc-300">+</div>
            <p className="text-sm font-medium text-zinc-600">動画または写真を選択</p>
            <p className="text-xs text-zinc-400 mt-1">
              タップしてファイルを選ぶか、ここにドロップ
            </p>
            <p className="text-xs text-zinc-300 mt-3">MP4 / MOV / WebM / JPG / PNG / WebP · 最大500MB</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,image/*"
            onChange={handleInputChange}
            className="hidden"
          />

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        </div>
      </div>
    )
  }

  // ---- STEP: EDIT ----
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => { setStep('select'); setFile(null); setPreviewUrl(null) }}
            className="text-sm text-zinc-500 hover:text-zinc-900"
          >
            ← 戻る
          </button>
          <h1 className="text-sm font-semibold text-zinc-900">投稿を作成</h1>
          <button
            form="post-form"
            type="submit"
            disabled={uploading}
            className="text-sm font-medium text-zinc-900 hover:opacity-60 disabled:opacity-30 transition-opacity"
          >
            {uploading ? '投稿中...' : '投稿する'}
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <form id="post-form" onSubmit={handleSubmit} className="space-y-5">
          {/* preview */}
          {previewUrl && (
            <div className="rounded-2xl overflow-hidden bg-black aspect-video">
              {isVideo ? (
                <video
                  src={previewUrl}
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt=""
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          )}

          {/* caption */}
          <div>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="キャプションを書く（任意）"
              rows={3}
              className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm resize-none outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent placeholder:text-zinc-400"
            />
          </div>

          {/* visibility */}
          <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
            <p className="px-4 pt-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
              公開設定
            </p>
            <div className="p-2">
              {(
                [
                  { value: 'private', label: '非公開', desc: '自分だけ見れる' },
                  { value: 'unlisted', label: '限定公開', desc: 'URLを知っている人だけ' },
                  { value: 'public', label: '公開', desc: '誰でも見れる' },
                ] as const
              ).map(opt => (
                <label
                  key={opt.value}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors',
                    visibility === opt.value ? 'bg-zinc-100' : 'hover:bg-zinc-50'
                  )}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={opt.value}
                    checked={visibility === opt.value}
                    onChange={() => setVisibility(opt.value)}
                    className="accent-zinc-900"
                  />
                  <div>
                    <p className="text-sm font-medium text-zinc-800">{opt.label}</p>
                    <p className="text-xs text-zinc-400">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* page */}
          {pages.length > 0 && (
            <div className="bg-white border border-zinc-100 rounded-xl p-4">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                ページに追加（任意）
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPageId('')}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm border transition-colors',
                    pageId === ''
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'
                  )}
                >
                  なし
                </button>
                {pages.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPageId(p.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm border transition-colors',
                      pageId === p.id
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'
                    )}
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}
        </form>
      </div>
    </div>
  )
}
