-- LinkedIn Power Post — Supabase Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Brand Profiles table
create table if not exists brand_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  company_name text default '',
  industry text default '',
  tone_description text default '',
  target_audience text default '',
  example_language text default '',
  taglines text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Posts history table
create table if not exists posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  topic text default '',
  tone text default 'thought-leadership',
  mode text default 'both',
  personal_variation1 text,
  personal_variation2 text,
  company_variation1 text,
  company_variation2 text,
  image_urls text[],
  image_type text,
  created_at timestamptz default now()
);

-- Row Level Security (RLS)
alter table brand_profiles enable row level security;
alter table posts enable row level security;

-- Brand profiles policies
create policy "Users can view own brand profile"
  on brand_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own brand profile"
  on brand_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own brand profile"
  on brand_profiles for update
  using (auth.uid() = user_id);

-- Posts policies
create policy "Users can view own posts"
  on posts for select
  using (auth.uid() = user_id);

create policy "Users can insert own posts"
  on posts for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own posts"
  on posts for delete
  using (auth.uid() = user_id);

-- Updated_at trigger for brand_profiles
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_brand_profiles_updated_at
  before update on brand_profiles
  for each row execute function update_updated_at_column();
