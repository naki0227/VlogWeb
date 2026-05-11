import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Alert, Image, Dimensions } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Video, ResizeMode } from 'expo-av'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/types'

const SCREEN_W = Dimensions.get('window').width

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    supabase.from('posts').select('*').eq('id', id).single()
      .then(({ data }) => setPost(data))
  }, [id])

  async function handleDelete() {
    Alert.alert('削除', 'この投稿を削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除', style: 'destructive',
        onPress: async () => {
          setDeleting(true)
          // Storageファイル削除
          if (post?.media_url) {
            const path = new URL(post.media_url).pathname.split('/object/public/media/')[1]
            if (path) await supabase.storage.from('media').remove([path])
          }
          await supabase.from('posts').delete().eq('id', id)
          router.back()
        },
      },
    ])
  }

  if (!post) {
    return (
      <View className="flex-1 bg-zinc-50 items-center justify-center">
        <Text className="text-zinc-400 text-sm">読み込み中...</Text>
      </View>
    )
  }

  const videoHeight = SCREEN_W * (9 / 16)

  return (
    <ScrollView className="flex-1 bg-zinc-50">
      {/* ヘッダー */}
      <View className="bg-white border-b border-zinc-100 px-4 pt-14 pb-3 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-sm text-zinc-500">← 戻る</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} disabled={deleting}>
          <Text className="text-sm text-red-400">{deleting ? '...' : '削除'}</Text>
        </TouchableOpacity>
      </View>

      {/* メディア */}
      {post.media_type === 'video' && post.media_url ? (
        <Video
          source={{ uri: post.media_url }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          style={{ width: SCREEN_W, height: videoHeight, backgroundColor: '#000' }}
        />
      ) : post.thumbnail_url || post.media_url ? (
        <Image
          source={{ uri: post.thumbnail_url ?? post.media_url! }}
          style={{ width: SCREEN_W, height: videoHeight }}
          resizeMode="cover"
        />
      ) : null}

      <View className="px-4 py-4 space-y-3">
        {post.caption && (
          <Text className="text-sm text-zinc-800 leading-relaxed">{post.caption}</Text>
        )}

        {/* メタ情報 */}
        <View className="flex-row gap-2">
          <View className={`px-2.5 py-1 rounded-full ${post.visibility === 'public' ? 'bg-green-50' : post.visibility === 'unlisted' ? 'bg-amber-50' : 'bg-zinc-100'}`}>
            <Text className={`text-xs font-medium ${post.visibility === 'public' ? 'text-green-700' : post.visibility === 'unlisted' ? 'text-amber-700' : 'text-zinc-500'}`}>
              {post.visibility === 'public' ? '公開' : post.visibility === 'unlisted' ? '限定公開' : '非公開'}
            </Text>
          </View>
          <Text className="text-xs text-zinc-400 self-center">
            {new Date(post.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}
