import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: posts, count }, { data: pages }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('posts').select('*', { count: 'exact' }).eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(30),
    supabase.from('pages').select('*').eq('user_id', user.id).order('sort_order'),
  ])

  return (
    <DashboardClient
      profile={profile}
      posts={posts ?? []}
      postCount={count ?? 0}
      pages={pages ?? []}
    />
  )
}
