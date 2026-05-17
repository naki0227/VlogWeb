import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const [{ data: profile }, { data: posts, count }, { data: pages }] = await Promise.all([
    admin.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    admin.from('posts').select('*', { count: 'exact' }).eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(30),
    admin.from('pages').select('*').eq('user_id', user.id).order('sort_order'),
  ])

  return NextResponse.json({
    profile: profile ?? null,
    posts: posts ?? [],
    postCount: count ?? 0,
    pages: pages ?? [],
  })
}
