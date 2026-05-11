import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-base font-semibold tracking-tight">Belle Trace</span>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
              ログイン
            </Link>
            <Link
              href="/auth/signup"
              className="px-4 py-1.5 bg-zinc-900 text-white text-sm rounded-full hover:bg-zinc-700 transition-colors"
            >
              無料で始める
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-28 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-7">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-full text-xs text-zinc-600">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            無料で使えます
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1] text-zinc-900">
            投稿するだけで
            <br />
            <span className="text-zinc-400">自分だけの</span>サイトが育つ
          </h1>
          <p className="text-lg text-zinc-500 leading-relaxed max-w-xl mx-auto">
            写真・動画を投稿し続けると、あなただけのWebサイトになる。
            結婚式のアルバムも、誕生日ギフトも、旅の記録も、
            URLひとつで大切な人に届けられる。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/auth/signup"
              className="px-7 py-3 bg-zinc-900 text-white text-sm font-semibold rounded-full hover:bg-zinc-700 transition-colors w-full sm:w-auto text-center"
            >
              無料で始める →
            </Link>
            <Link
              href="/auth/login"
              className="px-7 py-3 border border-zinc-200 text-zinc-700 text-sm rounded-full hover:border-zinc-400 transition-colors w-full sm:w-auto text-center"
            >
              ログイン
            </Link>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-20 px-6 bg-zinc-50">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest text-center mb-10">
            こんな使い方ができます
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                emoji: '💍',
                title: 'ウェディングアルバム',
                desc: '参列者だけが見られる招待制のページ。QRコードを席次表に印刷して当日シェア。',
                theme: { bg: '#FDF8F5', accent: '#C9A882' },
              },
              {
                emoji: '🎂',
                title: '誕生日ギフト',
                desc: '1回限りのQRコードを作って本人だけに渡す。開いた瞬間に失効するサプライズ体験。',
                theme: { bg: '#FFF0F6', accent: '#FF4DA6' },
              },
              {
                emoji: '✈️',
                title: '旅の記録',
                desc: '投稿を続けるうちに旅のアーカイブが完成。URLを友達にシェアするだけ。',
                theme: { bg: '#E8F4F8', accent: '#2C7DA0' },
              },
            ].map(c => (
              <div
                key={c.title}
                className="rounded-2xl p-6 space-y-3"
                style={{ backgroundColor: c.theme.bg }}
              >
                <div className="text-3xl">{c.emoji}</div>
                <p className="font-semibold text-zinc-900">{c.title}</p>
                <p className="text-sm text-zinc-500 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest text-center mb-12">
            使い方はシンプル
          </p>
          <div className="space-y-10">
            {[
              {
                step: '01',
                title: '動画か写真を投稿する',
                desc: 'テーマ（旅・カフェ・日常…）を選んで投稿するだけ。毎日少しずつでも、まとめてでも。',
              },
              {
                step: '02',
                title: '自分だけのサイトが育つ',
                desc: '投稿が積み重なるほど、あなた専用のWebサイトになっていく。気づいたら変わってる体験が待っている。',
              },
              {
                step: '03',
                title: '誰に・どこまで見せるかを決める',
                desc: 'QRコード・合言葉・メール招待で、見せたい人だけに届ける。1回限りのリンクも作れる。',
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-6 items-start">
                <span className="text-3xl font-bold text-zinc-100 w-14 shrink-0 tabular-nums leading-none pt-1">
                  {item.step}
                </span>
                <div>
                  <p className="font-semibold text-zinc-900 mb-1">{item.title}</p>
                  <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-zinc-50">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest text-center mb-10">
            機能
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: '◻', label: 'QRコード共有', desc: '1回限り・期限付きも' },
              { icon: '✉️', label: 'メール招待', desc: '招待制アクセス' },
              { icon: '💬', label: '合言葉保護', desc: '思い出の言葉で' },
              { icon: '🌐', label: '独自ドメイン', desc: 'myname.com で公開' },
              { icon: '◑', label: '7つのテーマ', desc: '雰囲気に合わせて' },
              { icon: '↓', label: 'データエクスポート', desc: 'いつでも持ち出せる' },
              { icon: '📱', label: 'スマホアプリ', desc: 'iOS / Android対応' },
              { icon: '✦', label: 'え！！体験', desc: '気づいたら変わってる' },
            ].map(f => (
              <div key={f.label} className="bg-white rounded-xl p-4 border border-zinc-100">
                <p className="text-xl mb-2">{f.icon}</p>
                <p className="text-sm font-medium text-zinc-800">{f.label}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6">
        <div className="max-w-xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            あなたのサイトを
            <br />
            育て始めよう
          </h2>
          <p className="text-zinc-500 text-sm leading-relaxed">
            クレジットカード不要。無料で始められます。
          </p>
          <Link
            href="/auth/signup"
            className="inline-block px-8 py-3.5 bg-zinc-900 text-white text-sm font-semibold rounded-full hover:bg-zinc-700 transition-colors"
          >
            無料で始める →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-400">Belle Trace</span>
          <p className="text-xs text-zinc-300">© 2026 Belle Trace</p>
        </div>
      </footer>
    </div>
  )
}
