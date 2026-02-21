-- Create storage bucket for 'moments'
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('moments', 'moments', true, 5242880, '{"image/jpeg","image/png","image/webp","image/gif"}')
on conflict (id) do nothing;

-- RLS policies for storage.objects (the files)
-- Authenticated users can read the public 'moments' bucket
create policy "Authenticated users can read moments"
on storage.objects for select
to authenticated
using ( bucket_id = 'moments' );

-- Users can upload/insert only if it's the moments bucket
create policy "Authenticated users can insert moments"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'moments' );

-- Users can delete their own uploaded photos
create policy "Users can delete own moments"
on storage.objects for delete
to authenticated
using ( bucket_id = 'moments' and owner = auth.uid() );
