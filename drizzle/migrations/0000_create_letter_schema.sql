-- ===== Content status enums =====
create type public.content_status as enum ('draft','published');
create type public.submission_status as enum ('pending','approved','rejected');
create type public.app_role as enum ('admin');

-- ===== Admin roles (separate table, never on profiles) =====
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null default 'admin',
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users can view own roles"
  on public.user_roles for select to authenticated
  using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- ===== updated_at helper =====
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ===== profiles =====
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  full_name text not null,
  bio text,
  details text,
  photo_url text,
  active boolean not null default true,
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create index profiles_active_idx on public.profiles (active, sort_order);

-- ===== blogs =====
create table public.blogs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  short_description text,
  content text not null default '',
  cover_image_url text,
  image_urls text[] not null default '{}',
  author_id uuid references public.profiles(id) on delete set null,
  category text,
  status public.content_status not null default 'draft',
  featured boolean not null default false,
  sort_order integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_blogs_updated_at before update on public.blogs
  for each row execute function public.set_updated_at();
create index blogs_status_published_idx on public.blogs (status, published_at desc nulls last);
create index blogs_featured_idx on public.blogs (featured, sort_order);
create index blogs_category_idx on public.blogs (category);
create index blogs_author_idx on public.blogs (author_id);

-- ===== thoughts =====
create table public.thoughts (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  author_name text not null,
  status public.content_status not null default 'published',
  sort_order integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_thoughts_updated_at before update on public.thoughts
  for each row execute function public.set_updated_at();
create index thoughts_status_idx on public.thoughts (status, sort_order);

-- ===== winners =====
create table public.winners (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  photo_url text,
  award_title text not null,
  category text,
  description text,
  award_date date,
  featured boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_winners_updated_at before update on public.winners
  for each row execute function public.set_updated_at();
create index winners_active_idx on public.winners (active, sort_order);

-- ===== submissions (public, pending until admin approves) =====
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  content text not null,
  author_name text not null,
  author_email text not null,
  image_urls text[] not null default '{}',
  status public.submission_status not null default 'pending',
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index submissions_status_idx on public.submissions (status, created_at desc);

-- ===== GRANTs (required for the Data API) =====
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT ON public.blogs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blogs TO authenticated;
GRANT ALL ON public.blogs TO service_role;

GRANT SELECT ON public.thoughts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.thoughts TO authenticated;
GRANT ALL ON public.thoughts TO service_role;

GRANT SELECT ON public.winners TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.winners TO authenticated;
GRANT ALL ON public.winners TO service_role;

GRANT INSERT ON public.submissions TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;

-- ===== RLS =====
alter table public.profiles enable row level security;
alter table public.blogs enable row level security;
alter table public.thoughts enable row level security;
alter table public.winners enable row level security;
alter table public.submissions enable row level security;

-- public read: only active/published rows
create policy "Anyone can view active profiles"
  on public.profiles for select to anon, authenticated
  using (active = true);
create policy "Admins manage profiles"
  on public.profiles for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Anyone can view published blogs"
  on public.blogs for select to anon, authenticated
  using (status = 'published');
create policy "Admins manage blogs"
  on public.blogs for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Anyone can view published thoughts"
  on public.thoughts for select to anon, authenticated
  using (status = 'published');
create policy "Admins manage thoughts"
  on public.thoughts for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Anyone can view active winners"
  on public.winners for select to anon, authenticated
  using (active = true);
create policy "Admins manage winners"
  on public.winners for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Anyone can submit for review"
  on public.submissions for insert to anon, authenticated
  with check (status = 'pending');
create policy "Admins manage submissions"
  on public.submissions for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ===== Storage access policies for letter-images =====
create policy "Public can view letter images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'letter-images');
create policy "Admins can upload letter images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'letter-images' and public.has_role(auth.uid(), 'admin'));
create policy "Admins can update letter images"
  on storage.objects for update to authenticated
  using (bucket_id = 'letter-images' and public.has_role(auth.uid(), 'admin'));
create policy "Admins can delete letter images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'letter-images' and public.has_role(auth.uid(), 'admin'));
