import { Tabs } from 'expo-router'
import { Text } from 'react-native'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f4f4f5',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#18181b',
        tabBarInactiveTintColor: '#a1a1aa',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⊞</Text>,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '投稿',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>+</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'プロフィール',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>○</Text>,
        }}
      />
    </Tabs>
  )
}
