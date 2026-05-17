'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/utils/cn'

const PROVIDERS = [
  { id: 'google', label: 'Google で続ける' },
  { id: 'apple', label: 'Apple で続ける' },
] as const

interface Props {
  mode: 'login' | 'signup'
}

export function OAuthButtons({ mode }: Props) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleOAuth(provider: 'google' | 'apple') {
    setError(null)
    setLoadingProvider(provider)

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    })

    if (error) {
      setError(`${provider === 'google' ? 'Google' : 'Apple'} ログインを開始できませんでした。Supabase 側で provider 設定を確認してください。`)
      setLoadingProvider(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2">
        {PROVIDERS.map(provider => (
          <button
            key={provider.id}
            type="button"
            onClick={() => handleOAuth(provider.id)}
            disabled={loadingProvider !== null}
            className={cn(
              'w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 transition-colors hover:border-zinc-400 hover:bg-zinc-50 disabled:opacity-50'
            )}
          >
            {loadingProvider === provider.id
              ? `${provider.label}...`
              : provider.label}
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-zinc-500">
        {mode === 'signup' ? 'メール登録の代わりに使えます' : 'すでに作成したアカウントでも使えます'}
      </p>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
