alter table public.sales
  add column if not exists commercial_sale_price numeric(14,2),
  add column if not exists commercial_price_source text,
  add column if not exists commercial_price_reference text,
  add column if not exists commercial_price_verified_at timestamptz,
  add column if not exists commercial_non_cash_settlement numeric(14,2) not null default 0;

alter table public.sales
  drop constraint if exists sales_commercial_sale_price_nonnegative;

alter table public.sales
  add constraint sales_commercial_sale_price_nonnegative
  check (commercial_sale_price is null or commercial_sale_price >= 0);

alter table public.sales
  drop constraint if exists sales_commercial_non_cash_settlement_nonnegative;

alter table public.sales
  add constraint sales_commercial_non_cash_settlement_nonnegative
  check (commercial_non_cash_settlement >= 0);

comment on column public.sales.commercial_sale_price is
  'Actual agreed property price payable by the customer, excluding a higher SPA/Oqood registration value.';

comment on column public.sales.commercial_price_source is
  'Evidence class used to establish the commercial sale price.';

comment on column public.sales.commercial_price_reference is
  'Human-readable reference to the approved email, booking record, or audited baseline evidence.';

comment on column public.sales.commercial_non_cash_settlement is
  'Approved non-cash settlement that reduces the property balance but is never reported as cash received.';

-- Establish a complete baseline for every active sale before applying the
-- individually verified commercial-price exceptions below.
update public.sales s
set commercial_sale_price = round(u.total_price::numeric, 2),
    commercial_price_source = 'Verified active-unit baseline',
    commercial_price_reference = 'KYC workbook, original CRM sale records, and approved commercial emails reviewed 02 Sep 2026',
    commercial_price_verified_at = now(),
    commercial_non_cash_settlement = 0
from public.units u
where u.id = s.unit_id
  and not exists (
    select 1
    from public.cancelled_units cu
    where cu.unit_id = u.id
  );

-- Explicit exceptions where the amount the customer pays differs from the
-- registered value, includes an approved discount, or preserves exact audited
-- decimals that were rounded in the unit record.
with verified(unit_no, commercial_sale_price, source, reference, non_cash_settlement) as (
  values
    ('A1-507', 2874990.00::numeric, 'Management-approved commercial rate', 'Shibli Anis approval email, 30 Sep 2025: AED 1,410/sq.ft on 2,039 sq.ft', 0.00::numeric),
    ('A1-707', 2926984.50::numeric, 'Approved commercial discount', 'CRM approval confirmation and issued 1% credit note, 06-07 Aug 2026', 0.00::numeric),
    ('A1-807', 2854600.00::numeric, 'Management-approved commercial rate', 'Shibli Anis booking confirmation, 21 Dec 2025: AED 1,400/sq.ft on 2,039 sq.ft', 0.00::numeric),
    ('A1-907', 2956550.00::numeric, 'KYC commercial price', 'KYC workbook total; excludes AED 2 CRM registration round-off', 0.00::numeric),
    ('A2-904', 2687700.00::numeric, 'Management-approved commercial rate', 'Shibli Anis email, 25 Feb 2026: AED 1,445/sq.ft on 1,860 sq.ft', 0.00::numeric),
    ('A3-609', 2000083.20::numeric, 'KYC commercial price', 'KYC workbook exact total at AED 1,401.60/sq.ft', 0.00::numeric),
    ('A3-709', 1997800.00::numeric, 'KYC commercial price', 'KYC workbook price; later AED 2,000,000 registration value excluded', 0.00::numeric),
    ('B1-510', 2067555.00::numeric, 'Approved commercial discount', 'Shibli Anis approval email, 30 May 2026: 2% credit on total unit value', 0.00::numeric),
    ('B2-1003', 1943000.00::numeric, 'Management-approved commercial rate', 'Shibli Anis email, 29 Nov 2025: effective AED 1,450/sq.ft on 1,340 sq.ft', 0.00::numeric),
    ('B2-403', 1909500.00::numeric, 'Management-approved commercial rate', 'Shibli Anis email, 28 Nov 2025: AED 1,425/sq.ft on 1,340 sq.ft', 0.00::numeric),
    ('B2-703', 1876000.00::numeric, 'Management-approved commercial rate', 'Shibli Anis email, 12 Dec 2025: AED 1,400/sq.ft on 1,340 sq.ft; later SPA increase excluded', 58290.00::numeric),
    ('B3-501', 1828770.00::numeric, 'Management-approved commercial rate', 'Shibli Anis email, 14 Oct 2025: AED 1,410/sq.ft on 1,297 sq.ft', 0.00::numeric),
    ('B3-905', 1996650.00::numeric, 'Management-approved commercial rate', 'Shibli Anis instruction acknowledged by Accounts, 13 Aug 2026: AED 1,450/sq.ft on 1,377 sq.ft', 0.00::numeric)
)
update public.sales s
set commercial_sale_price = v.commercial_sale_price,
    commercial_price_source = v.source,
    commercial_price_reference = v.reference,
    commercial_price_verified_at = now(),
    commercial_non_cash_settlement = v.non_cash_settlement
from public.units u
join verified v on replace(u.unit_no, '/', '-') = replace(v.unit_no, '/', '-')
where s.unit_id = u.id
  and not exists (
    select 1
    from public.cancelled_units cu
    where cu.unit_id = u.id
  );

create or replace function public.set_sale_commercial_baseline()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  unit_total numeric(14,2);
begin
  if new.commercial_sale_price is null then
    select round(total_price::numeric, 2)
      into unit_total
      from public.units
     where id = new.unit_id;

    new.commercial_sale_price := unit_total;
    new.commercial_price_source := coalesce(new.commercial_price_source, 'Original CRM sale price');
    new.commercial_price_reference := coalesce(new.commercial_price_reference, 'Captured when the sale was created');
    new.commercial_price_verified_at := coalesce(new.commercial_price_verified_at, now());
  end if;

  return new;
end;
$$;

drop trigger if exists set_sale_commercial_baseline_before_insert on public.sales;

create trigger set_sale_commercial_baseline_before_insert
before insert on public.sales
for each row
execute function public.set_sale_commercial_baseline();
