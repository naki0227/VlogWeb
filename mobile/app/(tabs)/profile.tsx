import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Alert, ScrollView, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

export default function ProfileScreen() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [postCount, setPostCount] = useState(0)
  const [pageCount, setPageCount] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const [{ data: p }, { count: pc }, { count: pgc }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('pages').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ])
      setProfile(p)
      setPostCount(pc ?? 0)
      setPageCount(pgc ?? 0)
    })
  }, [])

  async function handleSignOut() {
    Alert.alert('ログアウト', 'ログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'ログアウト', style: 'destructive',
        onPress: async () => { await supabase.auth.signOut() },
      },
    ])
  }

  if (!profile) {
    return <View className="flex-1 bg-zinc-50 items-center justify-center"><Text className="text-zinc-400 text-sm">読み込み中...</Text></View>
  }

  return (
    <ScrollView className="flex-1 bg-zinc-50">
      <View className="bg-white border-b border-zinc-100 px-4 pt-14 pb-4">
        <Text className="text-base font-semibold text-zinc-900">プロフィール</Text>
      </View>

      <View className="px-4 py-6 space-y-5">
        {/* アバター + 名前 */}
        <View className="flex-row items-center gap-4">
          <View className="w-16 h-16 rounded-full bg-zinc-100 overflow-hidden">
            {profile.avatar_url
              ? <Image source={{ uri: profile.avatar_url }} className="w-full h-full" resizeMode="cover" />
              : <View className="flex-1 items-center justify-center"><Text className="text-zinc-300 text-xl">○</Text></View>}
          </View>
          <View>
            <Text className="text-base font-semibold text-zinc-900">
              {profile.display_name ?? profile.username}
            </Text>
            <Text className="text-sm text-zinc-400">@{profile.username}</Text>
            {profile.bio && <Text className="text-sm text-zinc-500 mt-1">{profile.bio}</Text>}
          </View>
        </View>

        {/* stats */}
        <View className="flex-row gap-3">
          {[
            { label: '投稿', value: postCount },
            { label: 'ページ', value: pageCount },
          ].map(({ label, value }) => (
            <View key={label} className="flex-1 bg-white border border-zinc-100 rounded-xl p-4 items-center">
              <Text className="text-2xl font-semibold text-zinc-900">{value}</Text>
              <Text className="text-xs text-zinc-500 mt-0.5">{label}</Text>
            </View>
          ))}
        </View>

        {/* メニュー */}
        <View className="bg-white border border-zinc-100 rounded-xl overflow-hidden divide-y divide-zinc-100">
          {[
            { label: 'Webサイトを見る', icon: '→', onPress: () => {} },
          ].map(item => (
            <TouchableOpacity key={item.label} onPress={item.onPress}
              className="flex-row items-center justify-between px-4 py-4">
              <Text className="text-sm text-zinc-800">{item.label}</Text>
              <Text className="text-zinc-400">{item.icon}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleSignOut}
          className="w-full py-3 border border-zinc-200 rounded-xl items-center"
        >
          <Text className="text-sm text-zinc-600">ログアウト</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
