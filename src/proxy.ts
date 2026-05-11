import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_DOMAIN = process.env.NEXT_PUBLIC_DOMAIN ?? 'localhost:3000'

export async function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const { pathname } = request.nextUrl

  // カスタムドメインの処理
  // メインドメイン以外のホストはカスタムドメインとみなし /[username] にrewrite
  const isMainDomain =
    host === PUBLIC_DOMAIN ||
    host.endsWith('.vercel.app') ||
    host.startsWith('localhost')

  if (!isMainDomain) {
    // DBでカスタムドメインに対応するusernameを引く (Edge Function経由)
    // ここではシンプルにrewriteだけ行い、[username]側でDBルックアップする
    const url = request.nextUrl.clone()
    url.pathname = `/_custom-domain${pathname}`
    url.searchParams.set('host', host)
    return NextResponse.rewrite(url)
  }

  // 認証セッション更新
  const { supabaseResponse } = await updateSession(request)
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
