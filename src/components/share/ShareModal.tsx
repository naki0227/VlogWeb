'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { cn } from '@/utils/cn'

type AccessType = 'link' | 'qr' | 'passphrase' | 'magic_link'

interface Props {
  postId?: string
  pageId?: string
  label?: string
  onClose: () => void
}

interface CreatedToken {
  token: string
  url: string
  accessType: AccessType
  maxUses: number | null
  expiresInHours: number | null
}

const ACCESS_TYPES: { value: AccessType; label: string; desc: string }[] = [
  { value: 'link',        label: 'リンク',     desc: 'URLを知っている人なら誰でも' },
  { value: 'qr',          label: 'QRコード',   desc: 'QRをスキャンした人だけ' },
  { value: 'passphrase',  label: '合言葉',     desc: '合言葉を知っている人だけ' },
  { value: 'magic_link',  label: '招待',       desc: '指定したメアドに招待を送る' },
]

export function ShareModal({ postId, pageId, label, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [accessType, setAccessType] = useState<AccessType>('link')
  const [passphrase, setPassphrase] = useState('')
  const [inviteEmails, setInviteEmails] = useState('')
  const [maxUses, setMaxUses] = useState<'unlimited' | '1' | '5' | '10'>('unlimited')
  const [expiresIn, setExpiresIn] = useState<'never' | '24h' | '72h' | '7d' | '30d'>('never')
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<CreatedToken | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (created && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, created.url, {
        width: 240,
        margin: 2,
        color: { dark: '#111111', light: '#ffffff' },
      })
    }
  }, [created])

  async function handleCreate() {
    setError(null)
    setCreating(true)

    const hoursMap: Record<string, number | null> = {
      never: null, '24h': 24, '72h': 72, '7d': 168, '30d': 720,
    }
    const usesMap: Record<string, number | null> = {
      unlimited: null, '1': 1, '5': 5, '10': 10,
    }

    const emails = inviteEmails
      .split(/[\s,]+/)
      .map(e => e.trim())
      .filter(e => e.includes('@'))

    const res = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post_id: postId ?? null,
        page_id: pageId ?? null,
        access_type: accessType,
        passphrase: accessType === 'passphrase' ? passphrase : undefined,
        max_uses: usesMap[maxUses],
        expires_in_hours: hoursMap[expiresIn],
        label: label ?? null,
        invites: accessType === 'magic_link' ? emails : [],
      }),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error); setCreating(false); return }

    setCreated({
      token: data.token,
      url: data.url,
      accessType,
      maxUses: usesMap[maxUses],
      expiresInHours: hoursMap[expiresIn],
    })
    setCreating(false)
  }

  async function handleCopy() {
    if (!created) return
    await navigator.clipboard.writeText(created.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRevoke() {
    if (!created) return
    await fetch(`/api/share/${created.token}`, { method: 'DELETE' })
    setCreated(null)
  }

  function handleDownloadQR() {
    if (!canvasRef.current) return
    const a = document.createElement('a')
    a.download = `share-qr-${created?.token.slice(0, 8)}.png`
    a.href = canvasRef.current.toDataURL('image/png')
    a.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-xl">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">
            {created ? '共有リンクを作成しました' : '共有設定'}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-lg leading-none">×</button>
        </div>

        {!created ? (
          <div className="p-5 space-y-4">
            {/* アクセス方式 */}
            <div className="grid grid-cols-2 gap-2">
              {ACCESS_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setAccessType(t.value)}
                  className={cn(
                    'text-left p-3 rounded-xl border transition-colors',
                    accessType === t.value
                      ? 'border-zinc-900 bg-zinc-50'
                      : 'border-zinc-100 hover:border-zinc-300'
                  )}
                >
                  <p className="text-sm font-medium text-zinc-800">{t.label}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>

            {/* 合言葉入力 */}
            {accessType === 'passphrase' && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">合言葉</label>
                <input
                  value={passphrase}
                  onChange={e => setPassphrase(e.target.value)}
                  placeholder="例: okinawa2024、yukino-wedding"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
            )}

            {/* 招待メアド */}
            {accessType === 'magic_link' && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  招待するメールアドレス
                </label>
                <textarea
                  value={inviteEmails}
                  onChange={e => setInviteEmails(e.target.value)}
                  placeholder={'alice@example.com\nbob@example.com'}
                  rows={3}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                />
                <p className="text-xs text-zinc-400 mt-1">改行またはカンマ区切り</p>
              </div>
            )}

            {/* 使用回数 */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">使用回数</label>
              <div className="flex gap-2">
                {(['unlimited', '1', '5', '10'] as const).map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setMaxUses(v)}
                    className={cn(
                      'flex-1 py-1.5 rounded-lg text-xs border transition-colors',
                      maxUses === v ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'
                    )}
                  >
                    {v === 'unlimited' ? '無制限' : `${v}回`}
                  </button>
                ))}
              </div>
            </div>

            {/* 有効期限 */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">有効期限</label>
              <div className="flex gap-2 flex-wrap">
                {(['never', '24h', '72h', '7d', '30d'] as const).map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setExpiresIn(v)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs border transition-colors',
                      expiresIn === v ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'
                    )}
                  >
                    {v === 'never' ? '無期限' : v === '24h' ? '24時間' : v === '72h' ? '72時間' : v === '7d' ? '7日間' : '30日間'}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={handleCreate}
              disabled={creating || (accessType === 'passphrase' && !passphrase)}
              className="w-full py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 disabled:opacity-40 transition-colors"
            >
              {creating ? '生成中...' : '共有リンクを作成'}
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* QRコード */}
            {(created.accessType === 'qr' || created.accessType === 'link') && (
              <div className="flex justify-center">
                <canvas ref={canvasRef} className="rounded-xl" />
              </div>
            )}

            {/* URL */}
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-600 truncate font-mono">
                {created.url}
              </div>
              <button
                onClick={handleCopy}
                className={cn(
                  'px-3 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap',
                  copied ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-700 hover:border-zinc-400'
                )}
              >
                {copied ? 'コピー済み ✓' : 'コピー'}
              </button>
            </div>

            {/* アクセス設定サマリー */}
            <div className="px-3 py-2.5 bg-zinc-50 rounded-xl text-xs text-zinc-500 space-y-1">
              <p>アクセス方式: <span className="text-zinc-800 font-medium">
                {ACCESS_TYPES.find(t => t.value === created.accessType)?.label}
              </span></p>
              <p>使用回数: <span className="text-zinc-800 font-medium">
                {created.maxUses === null ? '無制限' : `${created.maxUses}回限り`}
              </span></p>
              <p>有効期限: <span className="text-zinc-800 font-medium">
                {created.expiresInHours === null ? '無期限'
                  : created.expiresInHours <= 24 ? '24時間'
                  : created.expiresInHours <= 72 ? '72時間'
                  : created.expiresInHours <= 168 ? '7日間' : '30日間'}
              </span></p>
            </div>

            <div className="flex gap-2">
              {created.accessType === 'qr' && (
                <button
                  onClick={handleDownloadQR}
                  className="flex-1 py-2 border border-zinc-200 text-zinc-700 text-sm rounded-xl hover:border-zinc-400 transition-colors"
                >
                  QR保存
                </button>
              )}
              <button
                onClick={handleRevoke}
                className="flex-1 py-2 border border-red-200 text-red-500 text-sm rounded-xl hover:bg-red-50 transition-colors"
              >
                このリンクを無効化
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
