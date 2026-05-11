-- share_tokens を拡張
alter table share_tokens
  add column if not exists access_type text not null default 'link'
    check (access_type in ('link', 'magic_link', 'passphrase', 'qr')),
  add column if not exists passphrase_hash text,        -- bcryptハッシュ
  add column if not exists max_uses int,                -- null = 無制限
  add column if not exists use_count int not null default 0,
  add column if not exists last_used_at timestamptz,
  add column if not exists revoked_at timestamptz;      -- 手動失効

-- magic link 用: メールアドレスを許可リストとして持つ
create table if not exists share_token_invites (
  id uuid default gen_random_uuid() primary key,
  token_id uuid references share_tokens(id) on delete cascade not null,
  email text not null,
  claimed_at timestamptz,
  created_at timestamptz default now(),
  unique(token_id, email)
);

-- アクセスログ（誰がいつアクセスしたか）
create table if not exists share_access_logs (
  id uuid default gen_random_uuid() primary key,
  token_id uuid references share_tokens(id) on delete cascade not null,
  accessed_at timestamptz default now(),
  ip_hash text  -- IPはハッシュして保存（個人情報に配慮）
);

-- インデックス
create index if not exists share_token_invites_token_id on share_token_invites(token_id);
create index if not exists share_access_logs_token_id on share_access_logs(token_id);

-- RLS
alter table share_token_invites enable row level security;
alter table share_access_logs enable row level security;

create policy "invites_owner" on share_token_invites for all using (
  exists (
    select 1 from share_tokens
    where id = token_id and user_id = auth.uid()
  )
);

create policy "logs_owner" on share_access_logs for select using (
  exists (
    select 1 from share_tokens
    where id = token_id and user_id = auth.uid()
  )
);

-- トークン使用カウント更新 + ログ記録（service_role から呼ぶ）
create or replace function use_share_token(
  p_token text,
  p_ip_hash text default null
)
returns json
language plpgsql
security definer
as $$
declare
  v_token share_tokens%rowtype;
begin
  select * into v_token
  from share_tokens
  where token = p_token
  for update;  -- 同時アクセスの競合を防ぐ

  if not found then
    return json_build_object('ok', false, 'reason', 'not_found');
  end if;

  -- 失効チェック
  if v_token.revoked_at is not null then
    return json_build_object('ok', false, 'reason', 'revoked');
  end if;

  -- 期限チェック
  if v_token.expires_at is not null and v_token.expires_at < now() then
    return json_build_object('ok', false, 'reason', 'expired');
  end if;

  -- 使用回数チェック
  if v_token.max_uses is not null and v_token.use_count >= v_token.max_uses then
    return json_build_object('ok', false, 'reason', 'used_up');
  end if;

  -- カウントアップ
  update share_tokens
  set
    use_count = use_count + 1,
    last_used_at = now()
  where id = v_token.id;

  -- ログ記録
  insert into share_access_logs(token_id, ip_hash)
  values (v_token.id, p_ip_hash);

  return json_build_object(
    'ok', true,
    'post_id', v_token.post_id,
    'page_id', v_token.page_id,
    'access_type', v_token.access_type
  );
end;
$$;
