
-- ============ The Letter editorial schema (aligns app expectations) ============

-- profiles: rename and extend
ALTER TABLE public.profiles RENAME COLUMN name TO full_name;
ALTER TABLE public.profiles
  ADD COLUMN slug text NOT NULL DEFAULT '',
  ADD COLUMN details text,
  ADD COLUMN active boolean NOT NULL DEFAULT true,
  ADD COLUMN featured boolean NOT NULL DEFAULT false,
  ADD COLUMN sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

-- blogs: rename and extend
ALTER TABLE public.blogs RENAME COLUMN cover_image TO cover_image_url;
ALTER TABLE public.blogs
  ADD COLUMN short_description text,
  ADD COLUMN image_urls text[],
  ADD COLUMN author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN category text,
  ADD COLUMN featured boolean NOT NULL DEFAULT false,
  ADD COLUMN sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN published_at timestamptz;
UPDATE public.blogs SET status = 'draft' WHERE status IS NULL;
ALTER TABLE public.blogs ALTER COLUMN status SET DEFAULT 'draft', ALTER COLUMN status SET NOT NULL;

-- thoughts: extend
UPDATE public.thoughts SET author_name = '' WHERE author_name IS NULL;
ALTER TABLE public.thoughts ALTER COLUMN author_name SET NOT NULL;
ALTER TABLE public.thoughts
  ADD COLUMN sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN published_at timestamptz,
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

-- winners: rename and extend
ALTER TABLE public.winners RENAME COLUMN name TO full_name;
ALTER TABLE public.winners
  ADD COLUMN award_title text NOT NULL DEFAULT '',
  ADD COLUMN category text,
  ADD COLUMN award_date date,
  ADD COLUMN featured boolean NOT NULL DEFAULT false,
  ADD COLUMN active boolean NOT NULL DEFAULT true,
  ADD COLUMN sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

-- submissions: rename and extend
ALTER TABLE public.submissions RENAME COLUMN name TO author_name;
ALTER TABLE public.submissions RENAME COLUMN email TO author_email;
ALTER TABLE public.submissions
  ADD COLUMN description text,
  ADD COLUMN image_urls text[],
  ADD COLUMN reviewed_at timestamptz;
UPDATE public.submissions SET status = 'pending' WHERE status IS NULL;
ALTER TABLE public.submissions ALTER COLUMN status SET DEFAULT 'pending', ALTER COLUMN status SET NOT NULL;

-- user_roles: tighten
ALTER TABLE public.user_roles
  ALTER COLUMN role SET DEFAULT 'user',
  ALTER COLUMN role SET NOT NULL;
DO $$ BEGIN
  ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN new.updated_at = now(); RETURN new; END $$;
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_blogs_updated_at ON public.blogs;
CREATE TRIGGER trg_blogs_updated_at BEFORE UPDATE ON public.blogs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_thoughts_updated_at ON public.thoughts;
CREATE TRIGGER trg_thoughts_updated_at BEFORE UPDATE ON public.thoughts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_winners_updated_at ON public.winners;
CREATE TRIGGER trg_winners_updated_at BEFORE UPDATE ON public.winners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- admin role helper (security definer so RLS on user_roles can't hide it)
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public' AS $$
  SELECT exists (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- grants
GRANT SELECT ON public.profiles, public.blogs, public.thoughts, public.winners TO anon, authenticated;
GRANT INSERT ON public.submissions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles, public.blogs, public.thoughts, public.winners, public.submissions, public.user_roles TO authenticated;
GRANT ALL ON public.profiles, public.blogs, public.thoughts, public.winners, public.submissions, public.user_roles TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- row level security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- profiles: public reads active rows, admins manage everything
CREATE POLICY profiles_public_read ON public.profiles FOR SELECT TO anon, authenticated
  USING (active = true);
CREATE POLICY profiles_admin_read ON public.profiles FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY profiles_admin_write ON public.profiles FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- blogs: public reads published, admins manage everything (incl. drafts)
CREATE POLICY blogs_public_read ON public.blogs FOR SELECT TO anon, authenticated
  USING (status = 'published');
CREATE POLICY blogs_admin_read ON public.blogs FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY blogs_admin_write ON public.blogs FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- thoughts: public reads published, admins manage everything
CREATE POLICY thoughts_public_read ON public.thoughts FOR SELECT TO anon, authenticated
  USING (status = 'published');
CREATE POLICY thoughts_admin_read ON public.thoughts FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY thoughts_admin_write ON public.thoughts FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- winners: public reads active, admins manage everything
CREATE POLICY winners_public_read ON public.winners FOR SELECT TO anon, authenticated
  USING (active = true);
CREATE POLICY winners_admin_read ON public.winners FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY winners_admin_write ON public.winners FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- submissions: anyone can submit (pending only), admins review
CREATE POLICY submissions_public_insert ON public.submissions FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending');
CREATE POLICY submissions_admin_all ON public.submissions FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- user_roles: users read their own roles; roles only managed via service access
CREATE POLICY user_roles_read_own ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
