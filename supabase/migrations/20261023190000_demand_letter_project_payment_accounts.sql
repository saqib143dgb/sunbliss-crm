-- Store verified payment instructions independently in each project and test workspace.
-- Never copy bank details across project boundaries.
alter table public.branding add column if not exists demand_account_details text;
alter table crm_test.branding add column if not exists demand_account_details text;
alter table crm_triana.branding add column if not exists demand_account_details text;
alter table crm_triana_test.branding add column if not exists demand_account_details text;
comment on column public.branding.demand_account_details is 'Approved Sunbliss Demand Letter payment instructions. Managed by CRM officer.';
comment on column crm_triana.branding.demand_account_details is 'Approved Triana Demand Letter payment instructions. Do not inherit Sunbliss details.';