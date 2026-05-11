import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native'
import { Link } from 'expo-router'
import { supabase } from '@/lib/supabase'

export default function SignupScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup() {
    setLoading(true)

    // username重複チェック
    const { data: existing } = await supabase
      .from('profiles').select('id').eq('username', username).single()
    if (existing) {
      Alert.alert('エラー', 'このユーザー名は既に使われています')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { username, display_name: username } },
    })
    if (error) Alert.alert('エラー', error.message)
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-zinc-50"
    >
      <ScrollView contentContainerClassName="items-center justify-center px-6 py-12 min-h-full">
        <View className="w-full max-w-sm space-y-6">
          <View>
            <Text className="text-2xl font-semibold text-zinc-900">新規登録</Text>
            <Text className="text-sm text-zinc-500 mt-1">自分だけのサイトを作ろう</Text>
          </View>

          <View className="space-y-3">
            <View>
              <Text className="text-sm font-medium text-zinc-700 mb-1.5">ユーザー名</Text>
              <TextInput
                value={username}
                onChangeText={t => setUsername(t.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="yourname"
                placeholderTextColor="#a1a1aa"
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 font-mono"
              />
              <Text className="text-xs text-zinc-400 mt-1">
                site.com/<Text className="text-zinc-700">{username || 'yourname'}</Text>
              </Text>
            </View>
            <View>
              <Text className="text-sm font-medium text-zinc-700 mb-1.5">メールアドレス</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="your@email.com"
                placeholderTextColor="#a1a1aa"
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900"
              />
            </View>
            <View>
              <Text className="text-sm font-medium text-zinc-700 mb-1.5">パスワード（8文字以上）</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor="#a1a1aa"
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSignup}
            disabled={loading || !email || !password || !username}
            className="w-full py-3 bg-zinc-900 rounded-xl items-center"
          >
            <Text className="text-white text-sm font-semibold">
              {loading ? '作成中...' : 'アカウント作成'}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center">
            <Text className="text-sm text-zinc-500">既にアカウントがある方は </Text>
            <Link href="/(auth)/login">
              <Text className="text-sm font-semibold text-zinc-900">ログイン</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
