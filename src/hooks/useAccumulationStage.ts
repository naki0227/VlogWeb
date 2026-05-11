'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ステージ定義
// 0: 通常（0-9投稿）
// 1: 侵食開始（10-29投稿）— 背景に過去投稿がうっすら流れ始める
// 2: 断片混入（30+投稿）  — フィードに過去の断片が混ざる

export type AccumulationStage = 0 | 1 | 2

interface AccumulationState {
  stage: AccumulationStage
  postCount: number
  ghostPosts: GhostPost[]
}

export interface GhostPost {
  id: string
  thumbnail_url: string | null
  media_url: string | null
  created_at: string
}

function calcStage(count: number): AccumulationStage {
  if (count >= 30) return 2
  if (count >= 10) return 1
  return 0
}

export function useAccumulationStage(): AccumulationState {
  const [state, setState] = useState<AccumulationState>({
    stage: 0,
    postCount: 0,
    ghostPosts: [],
  })

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return

      const { data: posts, count } = await supabase
        .from('posts')
        .select('id, thumbnail_url, media_url, created_at', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const total = count ?? 0
      const stage = calcStage(total)

      // ゴースト用: ランダムに過去投稿を選ぶ（サムネイルあるものを優先）
      const withMedia = (posts ?? []).filter(p => p.thumbnail_url || p.media_url)
      const shuffled = [...withMedia].sort(() => Math.random() - 0.5)

      setState({
        stage,
        postCount: total,
        ghostPosts: shuffled.slice(0, stage === 2 ? 8 : 5) as GhostPost[],
      })
    })
  }, [])

  return state
}
