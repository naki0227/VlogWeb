import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// アカウント完全削除
export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Storageのファイルを削除（userId/ 以下の全ファイル）
  const { data: files } = await admin.storage.from('media').list(user.id, { limit: 1000 })
  if (files && files.length > 0) {
    const paths = files.map(f => `${user.id}/${f.name}`)
    await admin.storage.from('media').remove(paths)
  }

  // auth.users を削除 → DBはCASCADE削除される
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
