alter table public.sales
  add column if not exists incentive_type text;

alter table public.sales
  drop constraint if exists sales_incentive_type_check;

alter table public.sales
  add constraint sales_incentive_type_check
  check (
    incentive_type is null
    or incentive_type in ('Credit Voucher', 'Referral Voucher')
  );

comment on column public.sales.incentive_type is
  'Optional incentive for Individual Buyer sales: Credit Voucher or Referral Voucher.';
