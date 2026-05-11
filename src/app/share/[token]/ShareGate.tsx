'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  token: string
  accessType: 'passphrase' | 'magic_link'
  postId: string | null
  pageId: string | null
}

export function ShareGate({ token, accessType, postId, pageId }: Props) {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [magicSent, setMagicSent] = useState(false)

  async function handlePassphrase(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch(`/api/share/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passphrase: value }),
    })

    const data = await res.json()
    if (!res.ok || !data.ok) {
      setError(data.error ?? '合言葉が違います')
      setLoading(false)
      return
    }

    // 認証成功 → セッションCookieをセットしてリロード
    router.refresh()
    setLoading(false)
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Supabase Auth で magic link 送信
    const res = await fetch('/api/auth/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, redirect_to: `/share/${token}` }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? '送信に失敗しました')
      setLoading(false)
      return
    }

    setMagicSent(true)
    setLoading(false)
  }

  if (accessType === 'passphrase') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-zinc-100 p-8 space-y-5">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">合言葉を入力</h1>
            <p className="text-sm text-zinc-400 mt-1">このコンテンツは合言葉で保護されています</p>
          </div>
          <form onSubmit={handlePassphrase} className="space-y-3">
            <input
              type="text"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="合言葉"
              required
              autoFocus
              className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-zinc-900"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading || !value}
              className="w-full py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 disabled:opacity-40 transition-colors"
            >
              {loading ? '確認中...' : '見る'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (accessType === 'magic_link') {
    if (magicSent) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-zinc-100 p-8 text-center space-y-3">
            <div className="text-3xl">✉️</div>
            <h1 className="text-lg font-semibold text-zinc-900">メールを確認してください</h1>
            <p className="text-sm text-zinc-400">
              {email} にアクセスリンクを送りました。
              メール内のリンクをクリックするとコンテンツが見られます。
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-zinc-100 p-8 space-y-5">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">メールアドレスを確認</h1>
            <p className="text-sm text-zinc-400 mt-1">
              招待されたメールアドレスを入力してください。
              アクセス用リンクをお送りします。
            </p>
          </div>
          <form onSubmit={handleMagicLink} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoFocus
              className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-zinc-900"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 disabled:opacity-40 transition-colors"
            >
              {loading ? '送信中...' : 'リンクを受け取る'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return null
}
