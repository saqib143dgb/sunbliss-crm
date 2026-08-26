-- Preserve FIFO allocation history when a source payment is edited or deleted.
-- The base carry-forward migration is replay-safe and already creates these fields;
-- these IF NOT EXISTS statements preserve the production migration sequence.

alter table public.carry_forward_allocations
  add column if not exists reversed_at timestamptz,
  add column if not exists reversed_by uuid references auth.users(id) on delete set null,
  add column if not exists reversal_reason text;

create index if not exists idx_carry_forward_allocations_active
  on public.carry_forward_allocations(positive_event_id,negative_event_id)
  where reversed_at is null;

comment on column public.carry_forward_allocations.reversed_at is
  'When set, this allocation is historical only and no longer participates in settlement.';
