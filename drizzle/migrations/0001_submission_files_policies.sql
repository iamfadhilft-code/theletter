create policy "Anyone can upload submission attachments"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'submission-files');

create policy "Admins can view submission attachments"
  on storage.objects for select to authenticated
  using (bucket_id = 'submission-files' and public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete submission attachments"
  on storage.objects for delete to authenticated
  using (bucket_id = 'submission-files' and public.has_role(auth.uid(), 'admin'));
