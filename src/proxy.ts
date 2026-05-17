import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { isSameHost, normalizeHost, withoutPort } from '@/lib/domain'

const PUBLIC_DOMAIN = process.env.NEXT_PUBLIC_DOMAIN ?? 'localhost:3000'

export async function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const normalizedHost = withoutPort(normalizeHost(host))
  const normalizedPublicDomain = withoutPort(normalizeHost(PUBLIC_DOMAIN))
  const { pathname } = request.nextUrl

  // カスタムドメインの処理
  // メインドメイン以外のホストはカスタムドメインとみなし /[username] にrewrite
  const isMainDomain =
    isSameHost(normalizedHost, normalizedPublicDomain) ||
    normalizedHost.endsWith('.vercel.app') ||
    normalizedHost.startsWith('localhost') ||
    normalizedHost.startsWith('127.0.0.1')

  if (!isMainDomain) {
    // DBでカスタムドメインに対応するusernameを引く (Edge Function経由)
    // ここでは受け口ページにrewriteし、その先で custom_domain を引く
    const url = request.nextUrl.clone()
    url.pathname = `/custom-domain${pathname}`
    url.searchParams.set('host', normalizedHost)
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
