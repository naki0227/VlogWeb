import type { Theme } from '@/types'

export interface PageTemplate {
  id: string
  label: string
  emoji: string
  description: string
  theme: Theme
  defaultTitle: string
  defaultDescription: string
  defaultIsPublic: boolean
  suggestedAccess: 'link' | 'magic_link' | 'passphrase' | 'qr'
  hint: string
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'blank',
    label: 'ブランク',
    emoji: '✦',
    description: 'ゼロから作る',
    theme: 'daily',
    defaultTitle: '',
    defaultDescription: '',
    defaultIsPublic: false,
    suggestedAccess: 'link',
    hint: '',
  },
  {
    id: 'wedding',
    label: 'ウェディング',
    emoji: '💍',
    description: '結婚式の写真・動画を招待客と',
    theme: 'wedding',
    defaultTitle: 'Wedding',
    defaultDescription: '大切な日の記録',
    defaultIsPublic: false,
    suggestedAccess: 'magic_link',
    hint: '招待制にして参列者だけに送るのがおすすめ',
  },
  {
    id: 'birthday',
    label: '誕生日',
    emoji: '🎂',
    description: 'サプライズギフトとして贈る',
    theme: 'birthday',
    defaultTitle: 'Happy Birthday',
    defaultDescription: '',
    defaultIsPublic: false,
    suggestedAccess: 'qr',
    hint: '1回限りQRで本人だけに渡せる',
  },
  {
    id: 'travel',
    label: '旅',
    emoji: '✈️',
    description: '旅の記録をまとめて共有',
    theme: 'travel',
    defaultTitle: '旅の記録',
    defaultDescription: '',
    defaultIsPublic: false,
    suggestedAccess: 'link',
    hint: 'URLを知っている人だけ見れる設定がおすすめ',
  },
  {
    id: 'daily',
    label: '日常',
    emoji: '📷',
    description: '日々の記録を積み重ねる',
    theme: 'daily',
    defaultTitle: '日常',
    defaultDescription: '',
    defaultIsPublic: false,
    suggestedAccess: 'link',
    hint: '',
  },
  {
    id: 'event',
    label: 'イベント',
    emoji: '🎉',
    description: 'パーティーや集まりの思い出',
    theme: 'night',
    defaultTitle: 'イベント',
    defaultDescription: '',
    defaultIsPublic: false,
    suggestedAccess: 'qr',
    hint: '会場でQRを表示するとその場の人だけ見れる',
  },
  {
    id: 'cafe',
    label: 'カフェ日記',
    emoji: '☕',
    description: 'お気に入りのカフェをまとめる',
    theme: 'cafe',
    defaultTitle: 'カフェ日記',
    defaultDescription: '',
    defaultIsPublic: true,
    suggestedAccess: 'link',
    hint: '公開にして友達と共有するのもあり',
  },
  {
    id: 'minimal',
    label: 'ポートフォリオ',
    emoji: '◻',
    description: '作品や活動をシンプルに見せる',
    theme: 'minimal',
    defaultTitle: 'Works',
    defaultDescription: '',
    defaultIsPublic: true,
    suggestedAccess: 'link',
    hint: '',
  },
]
