import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import { Link } from 'expo-router'
import { supabase } from '@/lib/supabase'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) Alert.alert('エラー', error.message)
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-zinc-50 items-center justify-center px-6"
    >
      <View className="w-full max-w-sm space-y-6">
        <View>
          <Text className="text-2xl font-semibold text-zinc-900">ログイン</Text>
          <Text className="text-sm text-zinc-500 mt-1">アカウントにサインイン</Text>
        </View>

        <View className="space-y-3">
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
            <Text className="text-sm font-medium text-zinc-700 mb-1.5">パスワード</Text>
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
          onPress={handleLogin}
          disabled={loading || !email || !password}
          className="w-full py-3 bg-zinc-900 rounded-xl items-center opacity-100 disabled:opacity-40"
        >
          <Text className="text-white text-sm font-semibold">
            {loading ? 'ログイン中...' : 'ログイン'}
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center">
          <Text className="text-sm text-zinc-500">アカウントがない方は </Text>
          <Link href="/(auth)/signup">
            <Text className="text-sm font-semibold text-zinc-900">新規登録</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
