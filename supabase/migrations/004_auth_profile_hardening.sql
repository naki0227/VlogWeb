-- profiles insert policy を明示し、サインアップ時のプロフィール自動作成を壊れにくくする

drop policy if exists "profiles_owner_write" on profiles;

create policy "profiles_owner_insert" on profiles
  for insert
  with check (auth.uid() = id);

create policy "profiles_owner_update" on profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_owner_delete" on profiles
  for delete
  using (auth.uid() = id);

create or replace function public.generate_unique_username(base_username text, user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_base text;
  candidate text;
  suffix int := 0;
begin
  normalized_base := lower(coalesce(base_username, ''));
  normalized_base := regexp_replace(normalized_base, '[^a-z0-9_-]', '', 'g');

  if normalized_base = '' then
    normalized_base := 'user';
  end if;

  candidate := normalized_base;

  while exists (
    select 1
    from public.profiles
    where username = candidate
      and id <> user_id
  ) loop
    suffix := suffix + 1;
    candidate := normalized_base || '_' || suffix::text;
  end loop;

  return candidate;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  requested_username text;
  fallback_username text;
  final_username text;
  final_display_name text;
begin
  requested_username := coalesce(new.raw_user_meta_data->>'username', '');
  fallback_username := split_part(coalesce(new.email, ''), '@', 1);
  final_username := public.generate_unique_username(
    coalesce(nullif(requested_username, ''), fallback_username),
    new.id
  );
  final_display_name := coalesce(
    nullif(new.raw_user_meta_data->>'display_name', ''),
    nullif(requested_username, ''),
    nullif(fallback_username, ''),
    final_username
  );

  insert into public.profiles (id, username, display_name)
  values (new.id, final_username, final_display_name)
  on conflict (id) do update
  set
    username = excluded.username,
    display_name = excluded.display_name,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
