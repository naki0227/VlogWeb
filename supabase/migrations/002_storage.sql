-- Storage バケット作成
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'media',
    'media',
    true,
    524288000, -- 500MB
    array[
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/quicktime', 'video/webm', 'video/mov'
    ]
  )
on conflict (id) do nothing;

-- Storage RLS: 認証済みユーザーは自分のフォルダのみアップロード可
create policy "media_upload_own_folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'media' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "media_public_read" on storage.objects
  for select to public
  using (bucket_id = 'media');

create policy "media_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'media' and
    (storage.foldername(name))[1] = auth.uid()::text
  );
