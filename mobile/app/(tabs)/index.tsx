import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, Image, TouchableOpacity,
  Dimensions, RefreshControl, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import type { Post, Page } from '@/types'

const COLS = 3
const SCREEN_W = Dimensions.get('window').width
const CELL_SIZE = (SCREEN_W - 4) / COLS  // 2px gap × 2

export default function HomeScreen() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: postData }, { data: pageData }] = await Promise.all([
      supabase.from('posts').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(60),
      supabase.from('pages').select('*').eq('user_id', user.id).order('sort_order'),
    ])
    setPosts(postData ?? [])
    setPages(pageData ?? [])
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <View className="flex-1 bg-zinc-50 items-center justify-center">
        <ActivityIndicator color="#18181b" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-zinc-50">
      {/* ヘッダー */}
      <View className="bg-white border-b border-zinc-100 px-4 pt-14 pb-3 flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-zinc-900">vlog</Text>
        <TouchableOpacity onPress={() => router.push('/post/new' as never)}>
          <Text className="text-2xl text-zinc-900">+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={p => p.id}
        numColumns={COLS}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}
        ListHeaderComponent={
          pages.length > 0 ? (
            <View className="px-4 py-3 flex-row flex-wrap gap-2">
              {pages.map(page => (
                <View key={page.id} className="px-3 py-1.5 bg-white border border-zinc-200 rounded-full">
                  <Text className="text-xs text-zinc-700">{page.title}</Text>
                </View>
              ))}
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text className="text-4xl text-zinc-200 mb-3">+</Text>
            <Text className="text-sm text-zinc-400">最初の投稿をしよう</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{ width: CELL_SIZE, height: CELL_SIZE, margin: 1 }}
            onPress={() => router.push(`/post/${item.id}` as never)}
            activeOpacity={0.85}
          >
            {item.thumbnail_url || item.media_url ? (
              <Image
                source={{ uri: item.thumbnail_url ?? item.media_url! }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <View className="flex-1 bg-zinc-100 items-center justify-center">
                <Text className="text-zinc-300 text-xl">
                  {item.media_type === 'video' ? '▶' : '□'}
                </Text>
              </View>
            )}
            {item.visibility !== 'public' && (
              <View className="absolute top-1 right-1 bg-black/50 rounded px-1 py-0.5">
                <Text className="text-white text-[9px]">
                  {item.visibility === 'private' ? '非' : '限'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  )
}
