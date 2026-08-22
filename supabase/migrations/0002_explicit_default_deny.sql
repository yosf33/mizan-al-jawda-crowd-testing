-- Explicitly document and enforce the server-only data-access model.
-- The backend uses the Supabase service role after verifying the caller token;
-- direct browser access to application tables remains denied.

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create policy profiles_direct_access_denied on public.profiles as restrictive for all to anon, authenticated using (false) with check (false);
create policy tester_profiles_direct_access_denied on public.tester_profiles as restrictive for all to anon, authenticated using (false) with check (false);
create policy tester_devices_direct_access_denied on public.tester_devices as restrictive for all to anon, authenticated using (false) with check (false);
create policy projects_direct_access_denied on public.projects as restrictive for all to anon, authenticated using (false) with check (false);
create policy test_cycles_direct_access_denied on public.test_cycles as restrictive for all to anon, authenticated using (false) with check (false);
create policy cycle_bounty_rates_direct_access_denied on public.cycle_bounty_rates as restrictive for all to anon, authenticated using (false) with check (false);
create policy bug_reports_direct_access_denied on public.bug_reports as restrictive for all to anon, authenticated using (false) with check (false);
create policy bug_attachments_direct_access_denied on public.bug_attachments as restrictive for all to anon, authenticated using (false) with check (false);
create policy wallets_direct_access_denied on public.wallets as restrictive for all to anon, authenticated using (false) with check (false);
create policy transactions_direct_access_denied on public.transactions as restrictive for all to anon, authenticated using (false) with check (false);
create policy payout_requests_direct_access_denied on public.payout_requests as restrictive for all to anon, authenticated using (false) with check (false);
create policy reputation_events_direct_access_denied on public.reputation_events as restrictive for all to anon, authenticated using (false) with check (false);
create policy notifications_direct_access_denied on public.notifications as restrictive for all to anon, authenticated using (false) with check (false);
