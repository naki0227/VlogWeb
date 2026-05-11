-- profiles (extends auth.users)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  custom_domain text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- pages (sections of a user's personal site)
create table pages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  slug text not null,
  title text not null,
  theme text not null default 'daily',
  description text,
  sort_order int default 0,
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, slug)
);

-- posts
create table posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  page_id uuid references pages(id) on delete set null,
  media_url text,
  media_type text check (media_type in ('video', 'photo')),
  thumbnail_url text,
  caption text,
  visibility text not null default 'private' check (visibility in ('public', 'private', 'unlisted')),
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- share tokens (URL/QR sharing)
create table share_tokens (
  id uuid default gen_random_uuid() primary key,
  token text unique not null default encode(gen_random_bytes(16), 'hex'),
  user_id uuid references profiles(id) on delete cascade not null,
  post_id uuid references posts(id) on delete cascade,
  page_id uuid references pages(id) on delete cascade,
  label text,
  expires_at timestamptz,
  created_at timestamptz default now(),
  check (
    (post_id is not null and page_id is null) or
    (post_id is null and page_id is not null)
  )
);

-- specific user access grants (post level)
create table post_access (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade not null,
  viewer_id uuid references profiles(id) on delete cascade not null,
  granted_at timestamptz default now(),
  unique(post_id, viewer_id)
);

-- specific user access grants (page level)
create table page_access (
  id uuid default gen_random_uuid() primary key,
  page_id uuid references pages(id) on delete cascade not null,
  viewer_id uuid references profiles(id) on delete cascade not null,
  granted_at timestamptz default now(),
  unique(page_id, viewer_id)
);

-- indexes
create index posts_user_id_created_at on posts(user_id, created_at desc);
create index posts_page_id on posts(page_id);
create index pages_user_id on pages(user_id, sort_order);
create index share_tokens_token on share_tokens(token);
create index profiles_custom_domain on profiles(custom_domain);

-- updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on profiles
  for each row execute function update_updated_at();
create trigger pages_updated_at before update on pages
  for each row execute function update_updated_at();
create trigger posts_updated_at before update on posts
  for each row execute function update_updated_at();

-- auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- RLS
alter table profiles enable row level security;
alter table pages enable row level security;
alter table posts enable row level security;
alter table share_tokens enable row level security;
alter table post_access enable row level security;
alter table page_access enable row level security;

-- profiles: 誰でも読める、自分だけ書ける
create policy "profiles_public_read" on profiles for select using (true);
create policy "profiles_owner_write" on profiles for all using (auth.uid() = id);

-- pages: 公開 or アクセス権あり or オーナー
create policy "pages_owner_all" on pages for all using (auth.uid() = user_id);
create policy "pages_public_read" on pages for select using (
  is_public = true or
  auth.uid() = user_id or
  exists (
    select 1 from page_access
    where page_id = pages.id and viewer_id = auth.uid()
  )
);

-- posts: オーナー or 公開 or アクセス権 or share token経由は別途API側で処理
create policy "posts_owner_all" on posts for all using (auth.uid() = user_id);
create policy "posts_public_read" on posts for select using (
  visibility = 'public' or
  auth.uid() = user_id or
  exists (
    select 1 from post_access
    where post_id = posts.id and viewer_id = auth.uid()
  )
);

-- share_tokens: オーナーのみ
create policy "share_tokens_owner" on share_tokens for all using (auth.uid() = user_id);

-- post_access / page_access: オーナーのみ管理
create policy "post_access_owner" on post_access for all using (
  exists (select 1 from posts where id = post_id and user_id = auth.uid())
);
create policy "page_access_owner" on page_access for all using (
  exists (select 1 from pages where id = page_id and user_id = auth.uid())
);
