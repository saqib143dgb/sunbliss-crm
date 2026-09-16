-- On-demand generated documents. Existing customer/payment data is untouched.
create table public.crm_documents (
 id uuid primary key default gen_random_uuid(),
 unit_id bigint not null references public.units(id),
 customer_id bigint not null references public.customers(id),
 document_type text not null check(document_type = 'welcome_letter'),
 template_version text not null,
 fingerprint text not null check(fingerprint ~ '^[a-f0-9]{64}$'),
 file_name text not null,
 storage_path text not null unique,
 file_size integer not null check(file_size > 0 and file_size <= 5242880),
 snapshot jsonb not null,
 status text not null default 'pending' check(status in ('pending','ready')),
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 unique(unit_id,customer_id,document_type,fingerprint),
 check(storage_path = unit_id::text || '/' || customer_id::text || '/' || id::text || '.pdf')
);
alter table public.crm_documents enable row level security;
revoke all on public.crm_documents from anon, authenticated;
grant select, insert on public.crm_documents to authenticated;
grant update(status) on public.crm_documents to authenticated;
create index crm_documents_customer_idx on public.crm_documents(customer_id,unit_id,created_at desc);
create index crm_documents_creator_idx on public.crm_documents(created_by);
create policy "CRM document read" on public.crm_documents for select to authenticated using (
 exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role::text in ('crm_officer','manager'))
);
create policy "CRM document create" on public.crm_documents for insert to authenticated with check (
 created_by=(select auth.uid()) and status='pending'
 and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role::text='crm_officer')
 and exists(select 1 from public.units u where u.id=crm_documents.unit_id and u.customer_id=crm_documents.customer_id and u.status is distinct from 'Cancelled')
);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values ('crm-documents','crm-documents',false,5242880,array['application/pdf']);
create policy "CRM document file read" on storage.objects for select to authenticated using (
 bucket_id='crm-documents'
 and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role::text in ('crm_officer','manager'))
);
create policy "CRM document file upload" on storage.objects for insert to authenticated with check (
 bucket_id='crm-documents'
 and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role::text='crm_officer')
 and exists(select 1 from public.crm_documents d where d.storage_path=name and d.created_by=(select auth.uid()) and d.status='pending')
);
create policy "CRM document finalize" on public.crm_documents for update to authenticated
 using(status='pending' and created_by=(select auth.uid()) and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role::text='crm_officer'))
 with check(status='ready' and created_by=(select auth.uid()) and exists(select 1 from storage.objects o where o.bucket_id='crm-documents' and o.name=storage_path));
