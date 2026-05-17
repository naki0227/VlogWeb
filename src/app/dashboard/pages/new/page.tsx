'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { THEMES, type ThemeConfig } from '@/lib/themes'
import { PAGE_TEMPLATES, type PageTemplate } from '@/lib/page-templates'
import { cn } from '@/utils/cn'
import { Switch } from '@/components/ui/Switch'
import type { Theme } from '@/types'

type Step = 'template' | 'form'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s　]+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
}

function ThemeCard({ theme, selected, onClick }: { theme: ThemeConfig; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('relative rounded-xl overflow-hidden border-2 transition-all', selected ? 'border-zinc-900 scale-[1.02]' : 'border-transparent hover:border-zinc-300')}
      style={{ backgroundColor: theme.bg }}
    >
      <div className="p-3 space-y-1.5">
        <div className="h-10 rounded-lg" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.muted}22` }} />
        <div className="flex gap-1">
          <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: theme.accent }} />
          <div className="h-1.5 w-5 rounded-full" style={{ backgroundColor: theme.muted }} />
        </div>
        <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: theme.muted + '44' }} />
        <div className="h-1.5 w-3/4 rounded-full" style={{ backgroundColor: theme.muted + '44' }} />
      </div>
      <div className="px-3 pb-2.5 text-xs font-medium" style={{ color: theme.text, fontFamily: theme.fontFamily }}>
        {theme.label}
      </div>
      {selected && (
        <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-zinc-900 rounded-full flex items-center justify-center">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      )}
    </button>
  )
}

export default function NewPagePage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<PageTemplate | null>(null)

  // form state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [description, setDescription] = useState('')
  const [theme, setTheme] = useState<Theme>('daily')
  const [isPublic, setIsPublic] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const derivedSlug = slugEdited ? slug : slugify(title)

  function applyTemplate(tpl: PageTemplate) {
    setSelectedTemplate(tpl)
    setTitle(tpl.defaultTitle)
    setSlug(slugify(tpl.defaultTitle))
    setSlugEdited(false)
    setDescription(tpl.defaultDescription)
    setTheme(tpl.theme)
    setIsPublic(tpl.defaultIsPublic)
    setStep('form')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const sanitizedSlug = slugify(derivedSlug)
    if (!title.trim()) { setError('ページタイトルを入力してください'); return }
    if (!sanitizedSlug) { setError('スラッグを入力してください'); return }
    setError(null)
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: existing } = await supabase
      .from('pages').select('id').eq('user_id', user.id).eq('slug', sanitizedSlug).maybeSingle()
    if (existing) { setError('このスラッグは既に使われています'); setSaving(false); return }

    const { error: insertError } = await supabase.from('pages').insert({
      user_id: user.id, slug: sanitizedSlug, title: title.trim(), theme,
      description: description.trim() || null,
      is_public: isPublic,
    })
    if (insertError) { setError(insertError.message); setSaving(false); return }

    router.push('/dashboard')
    router.refresh()
  }

  // ── STEP 1: テンプレート選択 ──
  if (step === 'template') {
    return (
      <div className="min-h-screen bg-zinc-50">
        <header className="bg-white border-b border-zinc-100 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
            <button onClick={() => router.push('/dashboard')} className="text-sm text-zinc-500 hover:text-zinc-900">← 戻る</button>
            <h1 className="text-sm font-semibold text-zinc-900">テンプレートを選ぶ</h1>
            <div />
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 gap-3">
            {PAGE_TEMPLATES.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => applyTemplate(tpl)}
                className="text-left p-4 bg-white rounded-2xl border border-zinc-100 hover:border-zinc-300 hover:shadow-sm transition-all group"
              >
                <div className="text-2xl mb-2">{tpl.emoji}</div>
                <p className="text-sm font-semibold text-zinc-900">{tpl.label}</p>
                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{tpl.description}</p>
                {tpl.hint && (
                  <p className="text-xs text-zinc-300 mt-2 leading-relaxed">{tpl.hint}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 2: フォーム ──
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => setStep('template')} className="text-sm text-zinc-500 hover:text-zinc-900">← テンプレート</button>
          <h1 className="text-sm font-semibold text-zinc-900">
            {selectedTemplate?.emoji} {selectedTemplate?.label ?? '新しいページ'}
          </h1>
          <button form="page-form" type="submit" disabled={saving || !title}
            className="text-sm font-medium text-zinc-900 hover:opacity-60 disabled:opacity-30 transition-opacity">
            {saving ? '作成中...' : '作成する'}
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <form id="page-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
            <p className="text-sm font-semibold text-amber-950">1分で作る流れ</p>
            <p className="mt-1 text-sm text-amber-900">1. タイトルを決める  2. テーマを選ぶ  3. まずは非公開で保存して、あとで共有方法を決める</p>
          </div>

          <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wide">ページタイトル</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="例: 旅の記録" required
                  className="w-full rounded-lg bg-zinc-50 px-3 py-2 text-lg font-medium text-zinc-950 outline-none placeholder:text-zinc-400 ring-1 ring-transparent transition focus:bg-white focus:ring-zinc-900" />
              </div>
              <div className="border-t border-zinc-100 pt-3">
                <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wide">URL スラッグ</label>
                <div className="flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm ring-1 ring-transparent transition focus-within:bg-white focus-within:ring-zinc-900">
                  <span className="whitespace-nowrap text-zinc-500">yourdomain.com/you/</span>
                  <input value={derivedSlug}
                    onChange={e => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setSlugEdited(true) }}
                    placeholder="travel" className="min-w-0 flex-1 bg-transparent font-mono text-zinc-950 outline-none placeholder:text-zinc-400" />
                </div>
                <p className="mt-1.5 text-xs text-zinc-500">半角英数字と `-` を使えます。空ならタイトルから自動生成します。</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-zinc-100 rounded-xl p-4">
            <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wide">説明（任意）</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="このページについての説明" rows={2}
              className="w-full rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-950 outline-none placeholder:text-zinc-400 resize-none ring-1 ring-transparent transition focus:bg-white focus:ring-zinc-900" />
          </div>

          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">テーマ</p>
            <div className="grid grid-cols-4 gap-2">
              {(Object.values(THEMES) as ThemeConfig[]).map(t => (
                <ThemeCard key={t.id} theme={t} selected={theme === t.id} onClick={() => setTheme(t.id)} />
              ))}
            </div>
          </div>

          <div className="bg-white border border-zinc-100 rounded-xl p-4">
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
              label="公開する"
              description={isPublic ? '誰でもこのページを見られます' : 'まずは自分だけ見られる状態で保存します'}
            />
          </div>

          {selectedTemplate && selectedTemplate.id !== 'blank' && (
            <div className="px-4 py-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <p className="text-xs text-zinc-500">
                <span className="font-medium text-zinc-700">おすすめのアクセス設定: </span>
                {selectedTemplate.suggestedAccess === 'magic_link' ? '招待制（Magic link）' :
                 selectedTemplate.suggestedAccess === 'qr' ? 'QRコード（1回限り）' :
                 selectedTemplate.suggestedAccess === 'passphrase' ? '合言葉' : 'URLリンク'}
                {selectedTemplate.hint && ` — ${selectedTemplate.hint}`}
              </p>
            </div>
          )}

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            {saving ? 'ページを作成中...' : 'この内容でページを作成'}
          </button>
        </form>
      </div>
    </div>
  )
}
