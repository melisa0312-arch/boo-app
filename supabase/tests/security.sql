-- Transactional TAP-compatible security tests. No records survive the rollback.
begin;
select '1..24';
create function pg_temp.ok(n integer, passed boolean, label text) returns text language plpgsql as $$
begin if passed is distinct from true then raise exception 'not ok % - %', n, label; end if; return format('ok %s - %s', n, label); end; $$;
create function pg_temp.denied(statement text) returns boolean language plpgsql as $$
begin execute statement; return false; exception when insufficient_privilege then return true; end; $$;
create function pg_temp.rejected(statement text) returns boolean language plpgsql as $$
begin execute statement; return false; exception when raise_exception or unique_violation or check_violation or invalid_parameter_value then return true; end; $$;

insert into auth.users(id, email) values
('10000000-0000-4000-8000-000000000001', 'db-a@example.test'),
('10000000-0000-4000-8000-000000000002', 'db-b@example.test'),
('10000000-0000-4000-8000-000000000003', 'db-c@example.test'),
('10000000-0000-4000-8000-000000000004', 'db-d@example.test');
create temporary table fixture (name text primary key, value text);
grant all on fixture to authenticated, anon;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select pg_temp.ok(1, (select count(*) from public.profiles) = 1, 'only own profile visible');
update public.profiles set display_name = 'Melisa' where id = auth.uid();
select pg_temp.ok(2, (select display_name from public.profiles where id = auth.uid()) = 'Melisa', 'own profile editable');
insert into fixture values ('couple', public.create_couple('BŪ test')::text);
select pg_temp.ok(3, (select count(*) from public.couple_members) = 1, 'creator is a member');
select pg_temp.ok(4, pg_temp.rejected($s$select public.create_couple('Second')$s$), 'cannot create second couple');
insert into fixture values ('old_token', public.issue_couple_invitation());
insert into fixture values ('token', public.issue_couple_invitation());
select pg_temp.ok(5, pg_temp.denied('select token_hash from public.couple_invitations'), 'invitation hashes not readable by client');
select pg_temp.ok(6, pg_temp.denied($s$insert into public.couple_members values ('00000000-0000-0000-0000-000000000000', auth.uid(), now())$s$), 'direct membership writes denied');

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{}', true);
select pg_temp.ok(7, pg_temp.denied('select * from public.activity_sessions'), 'anonymous session access denied');
select pg_temp.ok(8, pg_temp.denied($s$select public.join_couple(repeat('a',64))$s$), 'anonymous join denied');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select pg_temp.ok(9, (select count(*) from public.couples) = 0, 'unrelated couple invisible');
select pg_temp.ok(10, (select count(*) from public.couple_invitations) = 0, 'unrelated invitations invisible');
select pg_temp.ok(11, pg_temp.rejected(format('select public.join_couple(%L)', (select value from fixture where name='old_token'))), 'reissued invitation revoked');
reset role;
update public.couple_invitations set expires_at = now() - interval '1 minute' where used_at is null;
set local role authenticated;
select pg_temp.ok(12, pg_temp.rejected(format('select public.join_couple(%L)', (select value from fixture where name='token'))), 'expired invitation denied');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
update fixture set value = public.issue_couple_invitation() where name='token';
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select public.join_couple(value) from fixture where name='token';
select pg_temp.ok(13, (select count(*) from public.couple_members) = 2, 'invited partner joins');
select pg_temp.ok(14, (select public.get_partner_name()) = 'Melisa', 'partner name is intentionally shared');
select pg_temp.ok(15, (select count(*) from public.user_preferences) = 1, 'partner preferences remain private');
update public.profiles set display_name='Impersonation' where id='10000000-0000-4000-8000-000000000001';
select pg_temp.ok(16, not exists (select 1 from public.profiles where display_name='Impersonation'), 'cannot edit partner profile');
insert into public.activity_sessions(couple_id, created_by, activity_date, start_time, end_time, timezone, starting_location, timing)
select value::uuid, auth.uid(), current_date + 1, '23:30', '01:15', 'Europe/Sofia', 'sofia', 'future' from fixture where name='couple';
select pg_temp.ok(17, (select ends_next_day and ends_at > starts_at from public.activity_sessions limit 1), 'overnight session persisted');
select pg_temp.ok(18, pg_temp.denied(format($s$insert into public.activity_sessions(couple_id,created_by,activity_date,start_time,end_time,timezone,starting_location,timing) values (%L,'10000000-0000-4000-8000-000000000001',current_date+1,'18:00','20:00','Europe/Sofia','sofia','future')$s$, (select value from fixture where name='couple'))), 'cannot spoof creator');
select pg_temp.ok(19, pg_temp.rejected(format($s$insert into public.activity_sessions(couple_id,created_by,activity_date,start_time,end_time,timezone,starting_location,timing) values (%L,auth.uid(),current_date+1,'18:00','18:00','Europe/Sofia','sofia','future')$s$, (select value from fixture where name='couple'))), 'equal times rejected in database');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000004', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000004","role":"authenticated"}', true);
select pg_temp.ok(20, pg_temp.rejected(format('select public.join_couple(%L)', (select value from fixture where name='token'))), 'consumed invitation cannot admit third user');
select pg_temp.ok(21, (select count(*) from public.activity_sessions) = 0, 'unrelated sessions invisible');
select pg_temp.ok(22, pg_temp.denied(format($s$insert into public.activity_sessions(couple_id,created_by,activity_date,start_time,end_time,timezone,starting_location,timing) values (%L,auth.uid(),current_date+1,'18:00','20:00','Europe/Sofia','sofia','future')$s$, (select value from fixture where name='couple'))), 'unrelated session creation denied');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select pg_temp.ok(23, (select count(*) from public.activity_sessions) = 1, 'other member sees shared session');
select pg_temp.ok(24, pg_temp.rejected('select public.issue_couple_invitation()'), 'full couple cannot issue invitation');
rollback;
