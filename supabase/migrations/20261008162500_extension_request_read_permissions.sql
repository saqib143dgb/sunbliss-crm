-- CRM staff may read extension request decisions and history from the task panel.
drop policy if exists payment_extension_requests_select_staff on public.payment_extension_requests;
create policy payment_extension_requests_select_staff on public.payment_extension_requests
 for select to authenticated using (
   exists(select 1 from public.profiles p where p.id=auth.uid()
     and p.role::text in ('crm_officer','manager'))
 );
grant select on public.payment_extension_requests to authenticated;
