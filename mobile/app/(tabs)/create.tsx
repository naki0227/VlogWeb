import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, Image,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import type { Page, Visibility } from '@/types'

export default function CreateScreen() {
  const router = useRouter()
  const [mediaUri, setMediaUri] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'video' | 'photo' | null>(null)
  const [caption, setCaption] = useState('')
  const [visibility, setVisibility] = useState<Visibility>('private')
  const [pageId, setPageId] = useState('')
  const [pages, setPages] = useState<Page[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('pages').select('*')
        .eq('user_id', user.id).order('sort_order')
      setPages(data ?? [])
    })
  }, [])

  async function pickMedia() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('権限が必要です', '写真・動画へのアクセスを許可してください')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.85,
      videoMaxDuration: 300,
      allowsEditing: false,
    })
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0]
      setMediaUri(asset.uri)
      setMediaType(asset.type === 'video' ? 'video' : 'photo')
    }
  }

  async function handlePost() {
    if (!mediaUri || !mediaType) return
    setUploading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ログインが必要です')

      // ファイルをFetch → Blobとしてアップロード
      const response = await fetch(mediaUri)
      const blob = await response.blob()
      const ext = mediaType === 'video' ? 'mp4' : 'jpg'
      const path = `${user.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(path, blob, {
          contentType: mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
          cacheControl: '3600',
        })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)

      const { error: insertError } = await supabase.from('posts').insert({
        user_id: user.id,
        media_url: publicUrl,
        media_type: mediaType,
        caption: caption.trim() || null,
        visibility,
        page_id: pageId || null,
      })
      if (insertError) throw insertError

      // リセット
      setMediaUri(null)
      setMediaType(null)
      setCaption('')
      setVisibility('private')
      setPageId('')
      router.replace('/(tabs)')

    } catch (e) {
      Alert.alert('エラー', e instanceof Error ? e.message : '投稿に失敗しました')
    } finally {
      setUploading(false)
    }
  }

  return (
    <ScrollView className="flex-1 bg-zinc-50">
      <View className="px-4 pt-14 pb-3 bg-white border-b border-zinc-100 flex-row items-center justify-between">
        <Text className="text-base font-semibold text-zinc-900">新しい投稿</Text>
        <TouchableOpacity
          onPress={handlePost}
          disabled={!mediaUri || uploading}
          className="px-4 py-1.5 bg-zinc-900 rounded-full"
          style={{ opacity: (!mediaUri || uploading) ? 0.4 : 1 }}
        >
          <Text className="text-white text-sm font-semibold">
            {uploading ? '投稿中...' : '投稿する'}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="p-4 space-y-4">
        {/* メディア選択 */}
        <TouchableOpacity
          onPress={pickMedia}
          className="w-full aspect-video bg-zinc-100 rounded-2xl overflow-hidden items-center justify-center"
        >
          {mediaUri ? (
            <Image source={{ uri: mediaUri }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="items-center">
              <Text className="text-4xl text-zinc-300 mb-2">+</Text>
              <Text className="text-sm text-zinc-400">動画または写真を選ぶ</Text>
            </View>
          )}
        </TouchableOpacity>

        {uploading && (
          <View className="items-center py-2">
            <ActivityIndicator color="#18181b" />
            <Text className="text-xs text-zinc-400 mt-2">アップロード中...</Text>
          </View>
        )}

        {/* キャプション */}
        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder="キャプションを書く（任意）"
          placeholderTextColor="#a1a1aa"
          multiline
          numberOfLines={3}
          className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 min-h-[80px]"
          textAlignVertical="top"
        />

        {/* 公開設定 */}
        <View className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
          <Text className="px-4 pt-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            公開設定
          </Text>
          {([
            { value: 'private', label: '非公開', desc: '自分だけ' },
            { value: 'unlisted', label: '限定公開', desc: 'URLを知る人だけ' },
            { value: 'public', label: '公開', desc: '誰でも見れる' },
          ] as const).map(opt => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setVisibility(opt.value)}
              className={`flex-row items-center px-4 py-3 mx-2 my-0.5 rounded-lg ${visibility === opt.value ? 'bg-zinc-100' : ''}`}
            >
              <View className={`w-4 h-4 rounded-full border-2 mr-3 items-center justify-center ${visibility === opt.value ? 'border-zinc-900' : 'border-zinc-300'}`}>
                {visibility === opt.value && <View className="w-2 h-2 rounded-full bg-zinc-900" />}
              </View>
              <View>
                <Text className="text-sm font-medium text-zinc-800">{opt.label}</Text>
                <Text className="text-xs text-zinc-400">{opt.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ページ */}
        {pages.length > 0 && (
          <View>
            <Text className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              ページに追加（任意）
            </Text>
            <View className="flex-row flex-wrap gap-2">
              <TouchableOpacity
                onPress={() => setPageId('')}
                className={`px-3 py-1.5 rounded-full border ${pageId === '' ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-200'}`}
              >
                <Text className={`text-sm ${pageId === '' ? 'text-white' : 'text-zinc-600'}`}>なし</Text>
              </TouchableOpacity>
              {pages.map(p => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setPageId(p.id)}
                  className={`px-3 py-1.5 rounded-full border ${pageId === p.id ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-200'}`}
                >
                  <Text className={`text-sm ${pageId === p.id ? 'text-white' : 'text-zinc-600'}`}>{p.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  )
}
