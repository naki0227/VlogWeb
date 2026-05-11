# vlogweb — 引き継ぎドキュメント

## プロダクト概要

投稿を続けるごとに「自分だけのWebサイト」が育っていくサービス。

- 動画または写真を投稿し続けるとページ単位で個人サイトが積み重なる
- 誰に何を見せるかを完全にコントロール（QRコード・合言葉・Magic link・期限付き・1回限り）
- 結婚式・誕生日・旅などシーン別テンプレートから即作成できる
- 「え！！」体験：蓄積が一定量を超えると予期しない形で過去が現れる演出（Phase 2）

## URL構造

```
yourdomain.com/username          ← ユーザーの個人サイトトップ
yourdomain.com/username/travel   ← テーマページ
yourdomain.com/share/[token]     ← URL/QRコード共有（認証不要）
myname.com                       ← 独自ドメイン（CNAME設定、Vercel自動SSL）
```

## 技術スタック

| レイヤー | 技術 |
|---|---|
| Frontend + API | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| Backend / Auth / DB / Storage | Supabase |
| Hosting | Vercel（推奨） |
| ローカル開発 | Supabase CLI / Docker Compose |

Next.js 16 では `middleware.ts` → `src/proxy.ts` にリネーム済み（breaking change）。

## ディレクトリ構造

```
src/
├── app/
│   ├── auth/login|signup|callback
│   ├── dashboard/
│   │   ├── page.tsx               ← 投稿グリッド + ページ一覧
│   │   ├── settings/page.tsx      ← プロフィール・独自ドメイン・エクスポート・アカウント削除
│   │   ├── post/
│   │   │   ├── new/page.tsx       ← 投稿作成（動画/写真アップロード、サムネイル自動生成）
│   │   │   └── [id]/page.tsx      ← 投稿編集・削除・共有
│   │   └── pages/
│   │       ├── new/page.tsx       ← テンプレート選択 → ページ作成
│   │       └── [id]/page.tsx      ← ページ編集・削除・共有
│   ├── (site)/[username]/
│   │   ├── page.tsx               ← 公開サイトトップ
│   │   └── [page]/page.tsx        ← テーマページ
│   ├── share/[token]/
│   │   ├── page.tsx               ← 共有ページ（link/qr は直接表示）
│   │   └── ShareGate.tsx          ← 合言葉・Magic link のゲート画面
│   └── api/
│       ├── share/route.ts         ← POST: トークン生成
│       ├── share/[token]/route.ts ← POST: アクセス検証 / DELETE: 失効
│       ├── auth/magic-link/       ← POST: Magic link メール送信
│       ├── export/route.ts        ← GET: 全データ ZIP ダウンロード
│       └── account/route.ts       ← DELETE: アカウント完全削除
├── components/share/ShareModal.tsx ← QR表示・設定UI（合言葉/招待/期限/回数）
├── lib/
│   ├── supabase/{client,server,middleware,admin}.ts
│   ├── themes.ts                  ← 7テーマ定義（bg/surface/accent/text/muted/fontFamily）
│   ├── page-templates.ts          ← 8テンプレート定義（wedding/birthday/travel...）
│   ├── upload.ts                  ← Supabase Storage アップロード + 動画サムネイル生成
│   └── crypto.ts                  ← PBKDF2 パスフレーズハッシュ（Edge Runtime対応）
├── types/index.ts
├── utils/cn.ts
└── proxy.ts                       ← カスタムドメインルーティング + 認証セッション更新

supabase/
├── config.toml                    ← ローカルSupabase設定
├── vector.yaml                    ← Docker Compose用
└── migrations/
    ├── 001_initial.sql            ← 全テーブル・RLS・トリガー・handle_new_user
    ├── 002_storage.sql            ← media バケット（500MB）・RLS
    └── 003_share_access.sql       ← share_tokens拡張・招待テーブル・use_share_token関数
```

## DBスキーマ

```
profiles         ← auth.users拡張。username, custom_domain, avatar_url
pages            ← テーマ付きページ。is_public, sort_order
posts            ← 投稿。media_type: 'video'|'photo', visibility: 'public'|'private'|'unlisted'
share_tokens     ← 共有トークン。access_type: 'link'|'qr'|'passphrase'|'magic_link'
                   max_uses(null=無制限), use_count, expires_at, revoked_at
share_token_invites ← magic_link用の招待メアドリスト
share_access_logs   ← アクセスログ（IP はハッシュ化）
post_access      ← 投稿への特定ユーザーアクセス権（Phase 2）
page_access      ← ページへの特定ユーザーアクセス権（Phase 2）
```

RLS全テーブル設定済み。`use_share_token()` 関数は行ロックで同時アクセス競合を防ぐ。

## ローカル開発の起動

```bash
# 初回セットアップ
cp .env.local.example .env.local  # 値はデフォルトのままでOK

# 方法1: Supabase CLI（推奨・起動が速い）
make dev          # supabase start + npm run dev
make migrate      # migration適用
make reset        # DBリセット（全データ消去）
make migrate-new  # 新しいmigrationファイル作成

# 方法2: Docker Compose フルスタック（本番近い環境）
make up           # 全サービス起動
make down         # 停止
make down-v       # 停止 + ボリューム削除

# アクセスURL（どちらも同じ）
# App    → http://localhost:3000
# DB     → localhost:54322
# Mail   → http://localhost:54324  ← Magic linkの確認メールはここに届く
```

`.env.local` にはデフォルト値が既に入っているので **コピーするだけで動く**。

## テーマ一覧（src/lib/themes.ts）

daily / cafe / travel / night / minimal / wedding / birthday

## ページテンプレート一覧（src/lib/page-templates.ts）

blank / wedding / birthday / travel / daily / event / cafe / minimal（ポートフォリオ）

各テンプレートは theme, defaultTitle, defaultIsPublic, suggestedAccess を持つ。

## 共有アクセス設計

| 方式 | 説明 | ユースケース |
|---|---|---|
| link | URLを知っていれば見れる | カジュアルな共有 |
| qr | QRコード（期限・回数設定可）| イベント・その場限り |
| passphrase | 合言葉（PBKDF2ハッシュ）| グループ共有 |
| magic_link | メアドに招待リンク送信 | 結婚式・誕生日 |

QRは手動失効（revoke）可能。1回限りは max_uses=1 で実現。

## 未実装（残り）

1. ~~**「え！！」体験**~~ ✅ 実装済み
2. ~~**Expo モバイルアプリ**~~ ✅ 実装済み
3. **独自ドメインVercel API連携** — CNAME確認の自動化
4. **メール送信本番設定** — Resend/SendGrid（ローカルはInbucket済み）

## 「え！！」体験（実装済み）

```
src/hooks/useAccumulationStage.ts  ← stage (0/1/2) + ghostPosts を返す
src/components/accumulation/GhostLayer.tsx
  - GhostLayer: Stage 1+で背景に過去投稿をopacity 0.04でフロート
  - GhostCard:  Stage 2でグリッドに断片を混入（7投稿ごとに1枚）
src/app/dashboard/DashboardClient.tsx ← クライアントコンポーネントで組み込み
```

**重要: 通知なし。アニメーションなし。ページを開いたら静かに変わっている。**
疑似乱数はIDベースのseeded値（リロードで位置が変わらない）。

## Expo モバイルアプリ（mobile/）

```
mobile/
├── app/
│   ├── _layout.tsx          ← Auth state 監視 → 自動ルーティング
│   ├── (auth)/login.tsx
│   ├── (auth)/signup.tsx
│   ├── (tabs)/index.tsx     ← ホーム（投稿グリッド）
│   ├── (tabs)/create.tsx    ← 投稿作成（ギャラリー選択 + アップロード）
│   ├── (tabs)/profile.tsx   ← プロフィール + ログアウト
│   └── post/[id].tsx        ← 投稿詳細（動画再生 + 削除）
├── lib/supabase.ts           ← SecureStore でセッション永続化
├── types/index.ts            ← Web側と同じ型定義
├── global.css                ← NativeWind
├── tailwind.config.js
├── babel.config.js
├── metro.config.js
└── .env.example              ← EXPO_PUBLIC_ プレフィックス

# 起動方法
cd mobile
cp .env.example .env
npx expo start

# iOS: i キー / Android: a キー / Web: w キー
```

Web の Supabase backend をそのまま共有。認証・DB・Storageは同一。
