import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface Context {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const [{ data: page }, { data: pagePosts }] = await Promise.all([
    admin.from('pages').select('*').eq('id', id).eq('user_id', user.id).maybeSingle(),
    admin.from('posts').select('*').eq('page_id', id).eq('user_id', user.id)
      .order('sort_order').order('created_at', { ascending: false }),
  ])

  if (!page) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    page,
    posts: pagePosts ?? [],
  })
}
