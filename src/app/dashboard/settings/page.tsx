'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { uploadMedia } from '@/lib/upload'
import { cn } from '@/utils/cn'
import type { Profile } from '@/types'

export default function SettingsPage() {
  const router = useRouter()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [customDomain, setCustomDomain] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data)
        setDisplayName(data.display_name ?? '')
        setUsername(data.username ?? '')
        setBio(data.bio ?? '')
        setCustomDomain(data.custom_domain ?? '')
        setAvatarUrl(data.avatar_url)
      }
    })
  }, [router])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    setUploading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    try {
      const { url } = await uploadMedia(supabase, user.id, file)
      setAvatarUrl(url)
    } finally {
      setUploading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // username重複チェック（自分以外）
    if (username !== profile?.username) {
      const { data: existing } = await supabase
        .from('profiles').select('id').eq('username', username).neq('id', user.id).single()
      if (existing) { setError('このユーザー名は既に使われています'); setSaving(false); return }
    }

    const { error: updateError } = await supabase.from('profiles').update({
      display_name: displayName.trim() || null,
      username: username.trim(),
      bio: bio.trim() || null,
      custom_domain: customDomain.trim() || null,
      avatar_url: avatarUrl,
    }).eq('id', user.id)

    if (updateError) { setError(updateError.message); setSaving(false); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch('/api/export')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `belle-trace-export-${new Date().toISOString().split('T')[0]}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  async function handleDelete() {
    if (deleteConfirm !== username) return
    setDeleting(true)
    const res = await fetch('/api/account', { method: 'DELETE' })
    if (res.ok) {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/')
    } else {
      const data = await res.json()
      setError(data.error)
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="text-sm text-zinc-500 hover:text-zinc-900">← 戻る</button>
          <h1 className="text-sm font-semibold text-zinc-900">設定</h1>
          <div />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* プロフィール */}
        <form onSubmit={handleSave} className="space-y-4">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">プロフィール</h2>

          {/* アバター */}
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full bg-zinc-100 overflow-hidden cursor-pointer relative"
              onClick={() => avatarInputRef.current?.click()}
            >
              {avatarUrl
                ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-zinc-300 text-2xl">+</div>}
              {uploading && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <span className="text-white text-xs">...</span>
                </div>
              )}
            </div>
            <div>
              <button type="button" onClick={() => avatarInputRef.current?.click()}
                className="text-sm text-zinc-700 hover:text-zinc-900 font-medium">
                写真を変更
              </button>
              {avatarUrl && (
                <button type="button" onClick={() => setAvatarUrl(null)}
                  className="ml-3 text-sm text-zinc-400 hover:text-red-500">削除</button>
              )}
            </div>
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>

          <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden divide-y divide-zinc-100">
            {[
              { label: '表示名', value: displayName, setter: setDisplayName, placeholder: '表示名' },
              { label: 'ユーザー名', value: username, setter: setUsername, placeholder: 'username' },
            ].map(({ label, value, setter, placeholder }) => (
              <div key={label} className="flex items-center px-4 py-3">
                <span className="text-sm text-zinc-500 w-24 shrink-0">{label}</span>
                <input value={value} onChange={e => setter(e.target.value)} placeholder={placeholder}
                  className="flex-1 text-sm outline-none text-zinc-900 placeholder:text-zinc-300" />
              </div>
            ))}
            <div className="flex items-start px-4 py-3">
              <span className="text-sm text-zinc-500 w-24 shrink-0 pt-0.5">自己紹介</span>
              <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="自己紹介" rows={2}
                className="flex-1 text-sm outline-none resize-none text-zinc-900 placeholder:text-zinc-300" />
            </div>
          </div>

          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide pt-2">独自ドメイン</h2>
          <div className="bg-white border border-zinc-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <input value={customDomain} onChange={e => setCustomDomain(e.target.value.toLowerCase().trim())}
                placeholder="myname.com" className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900" />
            </div>
            {customDomain && (
              <div className="p-3 bg-zinc-50 rounded-lg text-xs text-zinc-600 space-y-1">
                <p className="font-medium text-zinc-800">DNSに以下を設定してください</p>
                <code className="block font-mono bg-white px-2 py-1 rounded border border-zinc-200 text-zinc-700">
                  CNAME &nbsp; {customDomain} &nbsp; cname.vercel-dns.com
                </code>
                <p className="text-zinc-400">反映まで最大48時間かかる場合があります</p>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button type="submit" disabled={saving}
            className={cn('w-full py-2.5 text-sm font-medium rounded-xl transition-colors',
              saved ? 'bg-green-600 text-white' : 'bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-40')}>
            {saved ? '保存しました ✓' : saving ? '保存中...' : '変更を保存'}
          </button>
        </form>

        {/* データ */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">あなたのデータ</h2>

          <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden divide-y divide-zinc-100">
            <div className="flex items-center justify-between px-4 py-4">
              <div>
                <p className="text-sm font-medium text-zinc-800">データをエクスポート</p>
                <p className="text-xs text-zinc-400 mt-0.5">全投稿・ページ・メタデータをZIPでダウンロード</p>
              </div>
              <button onClick={handleExport} disabled={exporting}
                className="px-4 py-1.5 text-sm border border-zinc-200 rounded-lg hover:border-zinc-400 disabled:opacity-40 transition-colors text-zinc-700">
                {exporting ? '...' : 'エクスポート'}
              </button>
            </div>
          </div>
        </div>

        {/* 危険ゾーン */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wide">危険な操作</h2>
          <div className="bg-white border border-red-100 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-zinc-800">アカウントを削除する</p>
            <p className="text-xs text-zinc-500 leading-relaxed">
              全ての投稿・ページ・メディアファイルが完全に削除されます。この操作は取り消せません。
            </p>
            <div className="space-y-2">
              <p className="text-xs text-zinc-500">確認のため <strong>{username}</strong> と入力してください</p>
              <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                placeholder={username}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-400" />
            </div>
            <button
              onClick={handleDelete}
              disabled={deleteConfirm !== username || deleting}
              className="w-full py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-30 transition-colors"
            >
              {deleting ? '削除中...' : 'アカウントを完全に削除する'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
