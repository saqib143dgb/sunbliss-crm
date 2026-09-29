-- SPA generation foundation.
-- Applied to Supabase as migration: spa_generation_foundation

create table if not exists public.spa_customer_profiles (
  customer_id bigint primary key references public.customers(id) on delete cascade,
  customer_name_ar text,
  nationality_ar text,
  address_ar text,
  co_applicant_name_ar text,
  arabic_name_source text check (arabic_name_source is null or arabic_name_source in ('emirates_id','passport','visa','other_official_document','manual_transliteration')),
  arabic_name_verified boolean not null default false,
  arabic_details_verified boolean not null default false,
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  notes text,
  updated_by uuid default auth.uid() references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.spa_unit_layouts (
  unit_id bigint primary key references public.units(id) on delete cascade,
  layout_key text,
  floor_plan_storage_path text,
  unit_plan_storage_path text,
  layout_version text,
  layout_revision_date date,
  verified boolean not null default false,
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  notes text,
  updated_by uuid default auth.uid() references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.spa_templates (
  id uuid primary key default gen_random_uuid(),
  project_name text not null,
  template_version text not null,
  template_storage_path text not null unique,
  master_plan_page integer check (master_plan_page is null or master_plan_page > 0),
  floor_unit_plan_page integer check (floor_unit_plan_page is null or floor_unit_plan_page > 0),
  active boolean not null default false,
  notes text,
  created_by uuid default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  unique(project_name, template_version)
);

create table if not exists public.spa_generation_records (
  id uuid primary key default gen_random_uuid(),
  unit_id bigint not null references public.units(id),
  customer_id bigint not null references public.customers(id),
  template_id uuid references public.spa_templates(id),
  snapshot jsonb not null,
  output_storage_path text,
  status text not null default 'draft' check(status in ('draft','ready','generated','cancelled')),
  generated_by uuid default auth.uid() references auth.users(id),
  generated_at timestamptz,
  created_at timestamptz not null default now()
);

-- Storage bucket: spa-assets (private)
-- RLS grants CRM Officer write access and CRM Officer / Manager read access.
