create table if not exists public.posts (
  id text primary key,
  founder_name text,
  project_name text,
  posted_date timestamptz,
  deadline date,
  description text,
  image_url text,
  field text,
  stage text,
  compensation text,
  roles text[] default '{}'
);

create table if not exists public.post_profile_views (
  post_id text primary key references public.posts(id) on delete cascade,
  view_count integer not null default 0
);

alter table public.posts enable row level security;
alter table public.post_profile_views enable row level security;

create policy posts_select on public.posts for select using (true);
create policy posts_insert on public.posts for insert with check (true);
create policy posts_update on public.posts for update using (true) with check (true);
create policy posts_delete on public.posts for delete using (true);

create policy views_select on public.post_profile_views for select using (true);
create policy views_insert on public.post_profile_views for insert with check (true);
create policy views_update on public.post_profile_views for update using (true) with check (true);
create policy views_delete on public.post_profile_views for delete using (true);

do $$
declare
  _pub text := 'supabase_realtime';
begin
  if not exists (select 1 from pg_publication where pubname = _pub) then
    execute format('create publication %I', _pub);
  end if;
end $$;

alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.post_profile_views;

create table if not exists public.users (
  id text primary key,
  name text not null,
  provider text not null check (provider in ('google','facebook')),
  provider_id text not null unique,
  date_of_birth date,
  bio text,
  links jsonb,
  contact_email text,
  contact_facebook_url text,
  phone_number text,
  cv_url text,
  portfolio_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists uniq_users_name_lower on public.users (lower(name));

create table if not exists public.blacklist (
  identifier text primary key
);

create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  user_id text references public.users(id) on delete cascade,
  filename text,
  url text not null,
  asset_type text not null default 'unspecified' check (asset_type in ('post_cover','cv','portfolio','avatar','unspecified')),
  created_at timestamptz default now()
);

create unique index if not exists uniq_upload_latest_per_user_asset on public.uploads (user_id, asset_type) where asset_type <> 'unspecified';

create or replace function public.cleanup_latest_uploads()
returns trigger as $$
begin
  if new.asset_type <> 'unspecified' then
    delete from public.uploads where user_id = new.user_id and asset_type = new.asset_type and id <> new.id;
  end if;
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_keep_latest_uploads on public.uploads;
create trigger trg_keep_latest_uploads
before insert on public.uploads
for each row execute function public.cleanup_latest_uploads();

alter table public.posts add column if not exists founder_id text references public.users(id);
create index if not exists idx_posts_posted_date on public.posts (posted_date);
create index if not exists idx_posts_founder_id on public.posts (founder_id);
create index if not exists idx_post_profile_views_post_id on public.post_profile_views (post_id);

alter table public.users enable row level security;
create policy users_select on public.users for select using (true);
create policy users_upsert on public.users for insert with check (true);
create policy users_update on public.users for update using (true) with check (true);

alter table public.blacklist enable row level security;
create policy blacklist_select on public.blacklist for select using (true);
create policy blacklist_upsert on public.blacklist for insert with check (true);

alter table public.uploads enable row level security;
create policy uploads_select on public.uploads for select using (true);
create policy uploads_insert on public.uploads for insert with check (true);

alter publication supabase_realtime add table public.users;
alter publication supabase_realtime add table public.blacklist;
alter publication supabase_realtime add table public.uploads;
