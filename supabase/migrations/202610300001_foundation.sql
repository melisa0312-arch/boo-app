-- Apply with the Supabase CLI. Never run a remote reset for this migration.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) between 1 and 60),
  locale text not null default 'bg' check (locale in ('bg', 'en')),
  timezone text not null default 'Europe/Sofia',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.couples (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create table public.couple_members (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);
create table public.couple_invitations (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  token_hash text not null unique,
  expires_at timestamptz not null default (now() + interval '48 hours'),
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index one_live_invitation on public.couple_invitations(couple_id) where used_at is null;
create table public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  interests text[] not null default '{}',
  updated_at timestamptz not null default now(),
  check (cardinality(interests) <= 30)
);
create table public.activity_sessions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  activity_mode text not null default 'go_out' check (activity_mode in ('go_out', 'stay_in', 'watch', 'quick_match', 'surprise')),
  activity_date date not null,
  start_time time(0) not null,
  end_time time(0) not null,
  timezone text not null default 'Europe/Sofia',
  ends_next_day boolean not null default false,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  starting_location text not null check (starting_location in ('sofia', 'chavdar')),
  timing text not null check (timing in ('now', 'today', 'future')),
  status text not null default 'draft' check (status in ('draft', 'planned', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_time <> end_time),
  check (ends_at > starts_at),
  check (ends_at - starts_at <= interval '26 hours')
);
create index sessions_couple_created on public.activity_sessions(couple_id, created_at desc);
create index invitations_couple on public.couple_invitations(couple_id);

create function private.is_couple_member(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.couple_members where couple_id = target and user_id = (select auth.uid()));
$$;
revoke all on function private.is_couple_member(uuid) from public;
grant execute on function private.is_couple_member(uuid) to authenticated;

create function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$ begin new.updated_at := now(); return new; end; $$;
create trigger profiles_updated before update on public.profiles for each row execute function private.touch_updated_at();
create trigger preferences_updated before update on public.user_preferences for each row execute function private.touch_updated_at();
create trigger sessions_updated before update on public.activity_sessions for each row execute function private.touch_updated_at();

create function private.bootstrap_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id) values (new.id);
  insert into public.user_preferences(user_id) values (new.id);
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.bootstrap_user();
-- Also prepare accounts which predate this migration without trusting user metadata.
insert into public.profiles(id) select id from auth.users on conflict do nothing;
insert into public.user_preferences(user_id) select id from public.profiles on conflict do nothing;

create function private.limit_couple_members() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.couples where id = new.couple_id for update;
  if (select count(*) from public.couple_members where couple_id = new.couple_id) >= 2 then
    raise exception 'couple_full' using errcode = 'P0001';
  end if;
  return new;
end; $$;
create trigger enforce_two_members before insert on public.couple_members for each row execute function private.limit_couple_members();

create function private.validate_timezone() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'invalid_timezone' using errcode = '22023';
  end if;
  return new;
end; $$;
create trigger profile_timezone before insert or update on public.profiles for each row execute function private.validate_timezone();

create function private.validate_session_window() returns trigger
language plpgsql set search_path = '' as $$
declare
  start_local timestamp;
  end_local timestamp;
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'invalid_timezone' using errcode = '22023';
  end if;
  if new.start_time = new.end_time then raise exception 'equal_times' using errcode = '22023'; end if;
  new.ends_next_day := new.end_time < new.start_time;
  start_local := new.activity_date + new.start_time;
  end_local := new.activity_date + new.end_time + case when new.ends_next_day then interval '1 day' else interval '0' end;
  new.starts_at := start_local at time zone new.timezone;
  new.ends_at := end_local at time zone new.timezone;
  -- PostgreSQL normalizes nonexistent wall times: reject instead of silently shifting.
  if new.starts_at at time zone new.timezone <> start_local or new.ends_at at time zone new.timezone <> end_local then
    raise exception 'nonexistent_local_time' using errcode = '22023';
  end if;
  -- Reject repeated wall times at DST transitions, including half-hour transitions.
  if exists (
    select 1 from generate_series(-180,180,15) as offsets(minutes)
    where minutes <> 0 and (
      (new.starts_at + minutes * interval '1 minute') at time zone new.timezone = start_local
      or (new.ends_at + minutes * interval '1 minute') at time zone new.timezone = end_local
    )
  ) then raise exception 'ambiguous_local_time' using errcode = '22023'; end if;
  if TG_OP = 'INSERT' and (new.starts_at < now() - interval '5 minutes' or new.starts_at > now() + interval '366 days') then
    raise exception 'date_out_of_range' using errcode = '22023';
  end if;
  if TG_OP = 'UPDATE' and (new.couple_id <> old.couple_id or new.created_by <> old.created_by) then
    raise exception 'immutable_session_owner' using errcode = '42501';
  end if;
  return new;
end; $$;
create trigger validate_session before insert or update on public.activity_sessions for each row execute function private.validate_session_window();

alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.couple_invitations enable row level security;
alter table public.user_preferences enable row level security;
alter table public.activity_sessions enable row level security;

-- Remove Supabase's default broad grants. Membership and invitations mutate only via RPCs.
revoke all on public.profiles, public.couples, public.couple_members, public.couple_invitations, public.user_preferences, public.activity_sessions from anon, authenticated;
grant select on public.profiles, public.couples, public.couple_members, public.user_preferences, public.activity_sessions to authenticated;
grant update (display_name, locale, timezone) on public.profiles to authenticated;
grant update (interests) on public.user_preferences to authenticated;
grant select (id, couple_id, created_by, expires_at, used_at, created_at) on public.couple_invitations to authenticated;
grant insert (couple_id, created_by, activity_mode, activity_date, start_time, end_time, timezone, starting_location, timing, status) on public.activity_sessions to authenticated;

create policy own_profile_read on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy own_profile_edit on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy couple_read on public.couples for select to authenticated using (private.is_couple_member(id));
create policy membership_read on public.couple_members for select to authenticated using (private.is_couple_member(couple_id));
create policy invitation_metadata_read on public.couple_invitations for select to authenticated using (private.is_couple_member(couple_id));
create policy preferences_read on public.user_preferences for select to authenticated using (user_id = (select auth.uid()));
create policy preferences_edit on public.user_preferences for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy session_read on public.activity_sessions for select to authenticated using (private.is_couple_member(couple_id));
create policy session_create on public.activity_sessions for insert to authenticated with check (private.is_couple_member(couple_id) and created_by = (select auth.uid()));

create function public.create_couple(couple_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare result uuid;
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode = '42501'; end if;
  if char_length(btrim(couple_name)) not between 1 and 60 or couple_name is null then raise exception 'invalid_name'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text, 0));
  if exists (select 1 from public.couple_members where user_id = auth.uid()) then raise exception 'already_member'; end if;
  insert into public.couples(name, created_by) values (btrim(couple_name), auth.uid()) returning id into result;
  insert into public.couple_members(couple_id, user_id) values (result, auth.uid());
  return result;
end; $$;

create function public.issue_couple_invitation() returns text
language plpgsql security definer set search_path = '' as $$
declare target uuid; token text;
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode = '42501'; end if;
  select couple_id into target from public.couple_members where user_id = auth.uid();
  if target is null then raise exception 'not_member'; end if;
  perform 1 from public.couples where id = target for update;
  if (select count(*) from public.couple_members where couple_id = target) >= 2 then raise exception 'couple_full'; end if;
  -- Reissuing revokes all previous links, including expired ones.
  update public.couple_invitations set used_at = now() where couple_id = target and used_at is null;
  token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.couple_invitations(couple_id, created_by, token_hash)
    values (target, auth.uid(), encode(extensions.digest(token, 'sha256'), 'hex'));
  return token;
end; $$;

create function public.join_couple(invitation_token text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare target uuid; invitation public.couple_invitations%rowtype;
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode = '42501'; end if;
  if invitation_token is null or invitation_token !~ '^[a-f0-9]{64}$' then raise exception 'invalid_invitation'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text, 0));
  if exists (select 1 from public.couple_members where user_id = auth.uid()) then raise exception 'already_member'; end if;
  select couple_id into target from public.couple_invitations where token_hash = encode(extensions.digest(invitation_token, 'sha256'), 'hex');
  if target is null then raise exception 'invalid_invitation'; end if;
  -- Same lock order as issue: couple first, invitation second. Serializes competing joins.
  perform 1 from public.couples where id = target for update;
  select * into invitation from public.couple_invitations
    where token_hash = encode(extensions.digest(invitation_token, 'sha256'), 'hex') for update;
  if invitation.used_at is not null or invitation.expires_at <= now() or invitation.created_by = auth.uid() then
    raise exception 'invalid_invitation';
  end if;
  if (select count(*) from public.couple_members where couple_id = target) >= 2 then raise exception 'couple_full'; end if;
  insert into public.couple_members(couple_id, user_id) values (target, auth.uid());
  update public.couple_invitations set used_at = now() where id = invitation.id;
  return target;
end; $$;

-- Only the intentionally shared display name crosses the private profile boundary.
create function public.get_partner_name() returns text
language sql stable security definer set search_path = '' as $$
  select p.display_name from public.couple_members mine
  join public.couple_members partner on partner.couple_id = mine.couple_id and partner.user_id <> mine.user_id
  join public.profiles p on p.id = partner.user_id where mine.user_id = (select auth.uid());
$$;

revoke all on function public.create_couple(text), public.issue_couple_invitation(), public.join_couple(text), public.get_partner_name() from public, anon;
grant execute on function public.create_couple(text), public.issue_couple_invitation(), public.join_couple(text), public.get_partner_name() to authenticated;
revoke all on all functions in schema private from public, anon;
