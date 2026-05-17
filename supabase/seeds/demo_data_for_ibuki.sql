-- Belle Trace demo data for:
-- a61fd3f1-b829-4651-9069-a5dfa041ffde
--
-- 使い方:
-- Supabase SQL Editor でそのまま実行してください。
-- 何度でも再実行できます。既存の [DEMO] データを消してから入れ直します。

begin;

-- 対象ユーザーがいなければ何もしない
do $$
declare
  target_user_id constant uuid := 'a61fd3f1-b829-4651-9069-a5dfa041ffde';
  user_exists boolean;
begin
  select exists (
    select 1 from public.profiles where id = target_user_id
  ) into user_exists;

  if not user_exists then
    raise exception 'Target profile % not found', target_user_id;
  end if;
end $$;

-- 既存の demo 投稿を消す
delete from public.posts
where user_id = 'a61fd3f1-b829-4651-9069-a5dfa041ffde'
  and caption like '[DEMO]%';

-- 既存の demo ページを消す
delete from public.pages
where user_id = 'a61fd3f1-b829-4651-9069-a5dfa041ffde'
  and slug in ('demo-climbing', 'demo-city-walk', 'demo-cafe-notes');

with demo_pages as (
  insert into public.pages (
    user_id,
    slug,
    title,
    theme,
    description,
    sort_order,
    is_public
  )
  values
    (
      'a61fd3f1-b829-4651-9069-a5dfa041ffde',
      'demo-climbing',
      'ボルダー記録',
      'travel',
      '[DEMO] 岩場・ジム・遠征の記録をまとめるページ',
      10,
      true
    ),
    (
      'a61fd3f1-b829-4651-9069-a5dfa041ffde',
      'demo-city-walk',
      '街歩きスナップ',
      'daily',
      '[DEMO] 日常の写真や短い記録を並べるページ',
      20,
      true
    ),
    (
      'a61fd3f1-b829-4651-9069-a5dfa041ffde',
      'demo-cafe-notes',
      'カフェメモ',
      'cafe',
      '[DEMO] お店・雰囲気・気分を残すページ',
      30,
      false
    )
  returning id, slug
),
source_media as (
  select
    media_url,
    media_type,
    thumbnail_url,
    row_number() over (order by created_at asc, id asc) as rn
  from public.posts
  where user_id = 'a61fd3f1-b829-4651-9069-a5dfa041ffde'
    and media_url is not null
),
source_count as (
  select count(*)::int as count from source_media
),
demo_rows as (
  select *
  from (
    values
      ('demo-climbing', 'public',   '[DEMO] 初めての完登。足位置がはまった瞬間が気持ちよかった。', 10, 1),
      ('demo-climbing', 'unlisted', '[DEMO] ジム練のメモ。保持よりも重心移動が大事だった日。',   20, 2),
      ('demo-city-walk', 'public',  '[DEMO] 夕方の街の色がきれいで、つい立ち止まった一枚。',       10, 3),
      ('demo-city-walk', 'private', '[DEMO] 下書き用の非公開スナップ。あとで整理する。',             20, 4),
      ('demo-cafe-notes', 'public', '[DEMO] 窓際の席が最高だった。静かで作業しやすい。',             10, 5),
      ('demo-cafe-notes', 'unlisted','[DEMO] 限定共有用。コーヒーの香りがかなり好き。',             20, 6),
      (null,             'public',  '[DEMO] ページ未分類の公開投稿。トップにも出る確認用。',         30, 7),
      (null,             'private', '[DEMO] ページ未分類の非公開投稿。権限制御の確認用。',           40, 8)
  ) as t(page_slug, visibility, caption, sort_order, media_slot)
)
insert into public.posts (
  user_id,
  page_id,
  media_url,
  media_type,
  thumbnail_url,
  caption,
  visibility,
  sort_order
)
select
  'a61fd3f1-b829-4651-9069-a5dfa041ffde'::uuid,
  dp.id,
  sm.media_url,
  sm.media_type,
  sm.thumbnail_url,
  dr.caption,
  dr.visibility::text,
  dr.sort_order
from demo_rows dr
left join demo_pages dp
  on dp.slug = dr.page_slug
left join lateral (
  select
    source_media.media_url,
    source_media.media_type,
    source_media.thumbnail_url
  from source_media
  where source_media.rn = case
    when (select count from source_count) = 0 then null
    else ((dr.media_slot - 1) % (select count from source_count)) + 1
  end
) sm on true;

-- プロフィールにも少しだけ demo っぽい説明を入れる
update public.profiles
set
  display_name = coalesce(display_name, 'Ibuki Nagase'),
  bio = coalesce(bio, '[DEMO] ボルダリング / 街歩き / カフェ記録')
where id = 'a61fd3f1-b829-4651-9069-a5dfa041ffde';

commit;
