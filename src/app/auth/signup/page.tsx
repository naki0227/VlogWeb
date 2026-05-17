'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { OAuthButtons } from '@/components/auth/OAuthButtons'

function formatSignupError(message: string) {
  if (message === 'Database error saving new user') {
    return '登録処理は Supabase 側で失敗しました。profiles テーブルの migration 未反映か、認証トリガー設定を確認してください。'
  }

  if (message.toLowerCase().includes('already registered')) {
    return 'このメールアドレスは既に登録されています。'
  }

  return message
}

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    // usernameの重複チェック
    const { data: existing, error: existingError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    if (existingError) {
      setError('ユーザー名の確認に失敗しました。時間をおいてもう一度お試しください。')
      setLoading(false)
      return
    }

    if (existing) {
      setError('このユーザー名は既に使われています')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, display_name: username },
      },
    })

    if (error) {
      setError(formatSignupError(error.message))
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm space-y-6 p-8 bg-white rounded-2xl shadow-sm border border-zinc-100">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">新規登録</h1>
          <p className="mt-1 text-sm text-zinc-500">自分だけのサイトを作ろう</p>
        </div>

        <OAuthButtons mode="signup" />

        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <div className="h-px flex-1 bg-zinc-200" />
          <span>またはメールで登録</span>
          <div className="h-px flex-1 bg-zinc-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              ユーザー名
            </label>
            <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-zinc-900">
              <span className="px-3 py-2 text-sm text-zinc-400 bg-zinc-50 border-r border-zinc-200">
                site.com/
              </span>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                required
                placeholder="yourname"
                className="flex-1 px-3 py-2 text-sm text-zinc-950 placeholder:text-zinc-400 bg-white outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-950 placeholder:text-zinc-400 bg-white outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="8文字以上"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-950 placeholder:text-zinc-400 bg-white outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            {loading ? '...' : 'アカウント作成'}
          </button>
          <p className="text-xs leading-relaxed text-zinc-500">
            作成後は「投稿を追加」→「ページを作成」→「公開設定を選ぶ」の順ですぐ始められます。
          </p>
        </form>

        <p className="text-sm text-center text-zinc-500">
          既にアカウントがある方は{' '}
          <Link href="/auth/login" className="text-zinc-900 font-medium hover:underline">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  )
}
