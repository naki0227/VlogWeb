import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import JSZip from 'jszip'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 全データを並行取得
  const [profileRes, pagesRes, postsRes, tokensRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('pages').select('*').eq('user_id', user.id).order('sort_order'),
    supabase.from('posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('share_tokens').select('id, token, access_type, label, max_uses, use_count, expires_at, created_at').eq('user_id', user.id),
  ])

  const exportData = {
    exported_at: new Date().toISOString(),
    profile: profileRes.data,
    pages: pagesRes.data ?? [],
    posts: (postsRes.data ?? []).map(p => ({
      ...p,
      // media URLを含む（ダウンロード用）
      _media_download: p.media_url,
      _thumbnail_download: p.thumbnail_url,
    })),
    share_tokens: tokensRes.data ?? [],
    _note: 'media_url フィールドのURLからメディアファイルをダウンロードできます',
  }

  const zip = new JSZip()
  zip.file('data.json', JSON.stringify(exportData, null, 2))

  // メディアURLのリスト（manifest）
  const mediaManifest = (postsRes.data ?? [])
    .filter(p => p.media_url)
    .map(p => ({
      post_id: p.id,
      created_at: p.created_at,
      media_type: p.media_type,
      media_url: p.media_url,
      thumbnail_url: p.thumbnail_url,
    }))

  zip.file('media_manifest.json', JSON.stringify(mediaManifest, null, 2))

  // README
  zip.file('README.txt', [
    'Belle Trace データエクスポート',
    '======================',
    '',
    'data.json        - プロフィール・投稿・ページの全メタデータ',
    'media_manifest.json - メディアファイルのURL一覧',
    '',
    'メディアファイルのダウンロード:',
    'media_manifest.json の media_url からファイルを直接ダウンロードできます。',
    '',
    `エクスポート日時: ${new Date().toLocaleString('ja-JP')}`,
  ].join('\n'))

  const zipBuffer = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })

  return new NextResponse(zipBuffer.buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="belle-trace-export-${new Date().toISOString().split('T')[0]}.zip"`,
    },
  })
}
