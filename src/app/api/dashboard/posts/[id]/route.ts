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
  const [{ data: post }, { data: pages }] = await Promise.all([
    admin.from('posts').select('*').eq('id', id).eq('user_id', user.id).maybeSingle(),
    admin.from('pages').select('*').eq('user_id', user.id).order('sort_order'),
  ])

  if (!post) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    post,
    pages: pages ?? [],
  })
}
