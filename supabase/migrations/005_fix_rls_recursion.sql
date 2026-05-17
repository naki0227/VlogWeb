-- RLS policy recursion fix
-- posts -> post_access -> posts / pages -> page_access -> pages の再帰を
-- security definer 関数に逃がして解消する

create or replace function public.user_has_post_access(target_post_id uuid, target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.post_access
    where post_id = target_post_id
      and viewer_id = target_user_id
  );
$$;

create or replace function public.user_has_page_access(target_page_id uuid, target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.page_access
    where page_id = target_page_id
      and viewer_id = target_user_id
  );
$$;

create or replace function public.user_owns_post(target_post_id uuid, target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.posts
    where id = target_post_id
      and user_id = target_user_id
  );
$$;

create or replace function public.user_owns_page(target_page_id uuid, target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.pages
    where id = target_page_id
      and user_id = target_user_id
  );
$$;

drop policy if exists "pages_public_read" on pages;
drop policy if exists "posts_public_read" on posts;
drop policy if exists "post_access_owner" on post_access;
drop policy if exists "page_access_owner" on page_access;

create policy "pages_public_read" on pages for select using (
  is_public = true or
  auth.uid() = user_id or
  public.user_has_page_access(id, auth.uid())
);

create policy "posts_public_read" on posts for select using (
  visibility = 'public' or
  auth.uid() = user_id or
  public.user_has_post_access(id, auth.uid())
);

create policy "post_access_owner" on post_access for all using (
  public.user_owns_post(post_id, auth.uid())
);

create policy "page_access_owner" on page_access for all using (
  public.user_owns_page(page_id, auth.uid())
);
