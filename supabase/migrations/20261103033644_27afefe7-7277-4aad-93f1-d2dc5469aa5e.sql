
-- letter-images: publicly viewable through the same-origin media proxy, editors manage
CREATE POLICY letter_images_public_read ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'letter-images');
CREATE POLICY letter_images_admin_write ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'letter-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'letter-images' AND public.is_admin());

-- submission-files: anyone can attach a file to their submission, editors review
CREATE POLICY submission_files_public_insert ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'submission-files');
CREATE POLICY submission_files_admin_all ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'submission-files' AND public.is_admin())
  WITH CHECK (bucket_id = 'submission-files' AND public.is_admin());
