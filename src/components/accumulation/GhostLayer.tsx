'use client'

import { useEffect, useRef } from 'react'
import type { AccumulationStage, GhostPost } from '@/hooks/useAccumulationStage'

interface Props {
  stage: AccumulationStage
  ghostPosts: GhostPost[]
}

interface GhostItem extends GhostPost {
  x: number
  y: number
  size: number
  duration: number
  delay: number
  rotate: number
}

// 再現性のある疑似乱数（IDベース）
function seededRandom(seed: string, index: number): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
  }
  h = ((h ^ index) * 1664525 + 1013904223) | 0
  return (h >>> 0) / 4294967295
}

function buildGhostItems(posts: GhostPost[]): GhostItem[] {
  return posts.map((post, i) => ({
    ...post,
    x: seededRandom(post.id, 0) * 90,
    y: seededRandom(post.id, 1) * 85,
    size: 120 + seededRandom(post.id, 2) * 160,
    duration: 18 + seededRandom(post.id, 3) * 22,
    delay: -(seededRandom(post.id, 4) * 15),
    rotate: (seededRandom(post.id, 5) - 0.5) * 8,
  }))
}

// Stage 1: 背景にうっすら浮かぶ（opacity 0.04）
function BackgroundGhosts({ items }: { items: GhostItem[] }) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {items.map(item => {
        const src = item.thumbnail_url ?? item.media_url
        if (!src) return null
        return (
          <div
            key={item.id}
            className="absolute rounded-xl overflow-hidden"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              width: item.size,
              height: item.size * 0.65,
              opacity: 0.04,
              filter: 'blur(1.5px) saturate(0.6)',
              transform: `rotate(${item.rotate}deg)`,
              animation: `ghostDrift ${item.duration}s ${item.delay}s ease-in-out infinite alternate`,
            }}
          >
            <img src={src} alt="" className="w-full h-full object-cover" />
          </div>
        )
      })}
      <style>{`
        @keyframes ghostDrift {
          from { transform: translate(0, 0) rotate(var(--r, 0deg)); }
          to   { transform: translate(8px, 12px) rotate(var(--r, 0deg)); }
        }
      `}</style>
    </div>
  )
}

// Stage 2: フィードに断片が混ざる用のデータを返す（実体はPostGridで使う）
// GhostLayerはStage 1のレイヤーのみ担当
export function GhostLayer({ stage, ghostPosts }: Props) {
  if (stage < 1 || ghostPosts.length === 0) return null
  const items = buildGhostItems(ghostPosts)
  return <BackgroundGhosts items={items} />
}

// Stage 2: PostGrid内に挿入するゴーストカード
export function GhostCard({ post }: { post: GhostPost }) {
  const src = post.thumbnail_url ?? post.media_url
  if (!src) return null
  return (
    <div
      className="aspect-square rounded-lg overflow-hidden relative"
      style={{
        opacity: 0.35,
        filter: 'saturate(0.3) blur(0.3px)',
        outline: '1px solid rgba(0,0,0,0.06)',
      }}
      title={new Date(post.created_at).toLocaleDateString('ja-JP')}
    >
      <img src={src} alt="" className="w-full h-full object-cover" />
      {/* 薄い日付表示 */}
      <span
        className="absolute bottom-1 left-1.5 text-[9px] font-mono"
        style={{ color: 'rgba(0,0,0,0.3)' }}
      >
        {new Date(post.created_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
      </span>
    </div>
  )
}
