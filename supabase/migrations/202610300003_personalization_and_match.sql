-- STEP 02. Forward-only, additive. Review before applying to a hosted project.
-- No account, invitation, existing preference, or activity row is replaced.
create function private.valid_match_answers(value jsonb, kind text) returns boolean
language plpgsql immutable set search_path = '' as $$
declare k text; v jsonb; item jsonb; allowed jsonb; rating_keys text[];
  interest_keys jsonb := '["cars","creative","games","travel","nature","sport","food","culture","photography","romance","adventure","relax"]';
  tags jsonb := '["walking","standing","intense","heights","water","crowds","loud","driving","screens","fine_motor","alcohol"]';
begin
  if value is null or jsonb_typeof(value) <> 'object' or octet_length(value::text) > 16000 then return false; end if;
  if kind = 'personal' then rating_keys := array['novelty','spontaneity','energy','pace','unfamiliar_comfort'];
  elsif kind = 'tonight' then rating_keys := array['energy','pace','familiarity','social'];
  else return false; end if;
  for k,v in select * from jsonb_each(value) loop
    if k = any(rating_keys) then
      if jsonb_typeof(v) <> 'number' or v::text !~ '^[1-5]$' then return false; end if;
    elsif kind = 'personal' and k = 'ratings' then
      if jsonb_typeof(v) <> 'object' then return false; end if;
      if exists (select 1 from jsonb_each(v) r where not interest_keys ? r.key or jsonb_typeof(r.value) <> 'number' or r.value::text !~ '^[1-5]$') then return false; end if;
    elsif (kind = 'personal' and k in ('favorite_experiences','disliked_activities','dream_experiences')) or (kind = 'tonight' and k = 'notes') then
      if jsonb_typeof(v) <> 'string' or char_length(v #>> '{}') > 1000 then return false; end if;
    elsif kind = 'personal' and k = 'social' then
      if jsonb_typeof(v) <> 'string' or not '["private","small_group","open"]'::jsonb ? (v #>> '{}') then return false; end if;
    elsif kind = 'tonight' and k in ('mood','intention') then
      allowed := case k when 'mood' then '["curious","calm","playful","romantic","adventurous"]'::jsonb else '["connect","explore","unwind","play","move"]'::jsonb end;
      if jsonb_typeof(v) <> 'string' or not allowed ? (v #>> '{}') then return false; end if;
    else
      allowed := null;
      if kind = 'personal' then
        allowed := case k
          when 'excluded_interests' then interest_keys when 'limitation_tags' then tags
          when 'romantic_preferences' then '["quiet","playful","creative","thoughtful","adventurous","surprise"]'::jsonb
          when 'location_characteristics' then '["nature","city","quiet","views","cozy","indoors","outdoors"]'::jsonb
          when 'surprise_types' then '["small","planned","creative","experience","none"]'::jsonb
          when 'automotive_interests' then '["design","classics","motorsport","roadtrip","technology"]'::jsonb
          when 'game_types' then '["board","cooperative","competitive","arcade","vr","puzzle"]'::jsonb else null end;
      else
        allowed := case k when 'desired_interests' then interest_keys when 'avoid_interests' then interest_keys when 'restriction_tags' then tags else null end;
      end if;
      if allowed is null or jsonb_typeof(v) <> 'array' then return false; end if;
      if jsonb_array_length(v) > jsonb_array_length(allowed) then return false; end if;
      if (select count(*) <> count(distinct e) from jsonb_array_elements(v) e) then return false; end if;
      for item in select * from jsonb_array_elements(v) loop
        if jsonb_typeof(item) <> 'string' or not allowed ? (item #>> '{}') then return false; end if;
      end loop;
    end if;
  end loop;
  return kind <> 'personal' or value ? 'ratings';
end; $$;
create function private.profile_complete(value jsonb) returns boolean language sql immutable set search_path = '' as $$
  select private.valid_match_answers(value,'personal') and (select count(*) from jsonb_object_keys(value->'ratings')) = 12;
$$;
create function private.response_complete(value jsonb) returns boolean language sql immutable set search_path = '' as $$
  select private.valid_match_answers(value,'tonight') and value ? 'mood' and value ? 'energy' and jsonb_array_length(coalesce(value->'desired_interests','[]')) > 0;
$$;

alter table public.user_preferences
  add column answers jsonb not null default '{"ratings":{}}' check (private.valid_match_answers(answers,'personal')),
  add column onboarding_step integer not null default 0 check (onboarding_step between 0 and 30),
  add column completed_at timestamptz,
  add column version integer not null default 0 check (version >= 0),
  add constraint preference_completion_valid check (completed_at is null or private.profile_complete(answers));

alter table public.activity_sessions
  add column transport text not null default 'walk' check (transport in ('walk','car','transit','bicycle')),
  add column max_travel_minutes integer not null default 15 check (max_travel_minutes between 0 and 180),
  add column budget_level integer not null default 1 check (budget_level between 0 and 3),
  add column environment text not null default 'either' check (environment in ('indoor','outdoor','either')),
  add column context_revision integer not null default 1 check (context_revision > 0),
  add column context_completed boolean not null default false,
  add column selected_concept_id text;

create table public.activity_concepts (
  id text primary key,
  title_bg text not null, title_en text not null,
  description_bg text not null, description_en text not null,
  interests text[] not null check (cardinality(interests) between 1 and 12),
  duration_minutes integer not null check (duration_minutes between 10 and 240),
  cost_level integer not null check (cost_level between 0 and 3),
  energy integer not null check (energy between 1 and 5),
  pace integer not null check (pace between 1 and 5),
  novelty integer not null check (novelty between 1 and 5),
  social integer not null check (social between 1 and 5),
  environment text not null check (environment in ('indoor','outdoor','either')),
  tags text[] not null default '{}', transport_required text check (transport_required = 'car'),
  catalog_version text not null default 'concepts-1'
);
alter table public.activity_sessions add constraint session_concept_fkey foreign key (selected_concept_id) references public.activity_concepts(id);
create table public.tonight_responses (
  session_id uuid not null references public.activity_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  answers jsonb not null default '{}' check (private.valid_match_answers(answers,'tonight')),
  mode text not null default 'quick' check (mode in ('quick','detailed')),
  current_step integer not null default 0 check (current_step between 0 and 11),
  share_answers boolean not null default false,
  context_revision integer not null check (context_revision > 0),
  version integer not null default 0 check (version >= 0),
  submitted_at timestamptz, updated_at timestamptz not null default now(),
  primary key (session_id,user_id),
  check (submitted_at is null or private.response_complete(answers))
);
create table public.match_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.activity_sessions(id) on delete cascade,
  context_revision integer not null,
  iteration integer not null check (iteration > 0),
  recommendations jsonb not null check (jsonb_typeof(recommendations) = 'array' and jsonb_array_length(recommendations) <= 4),
  input_fingerprint text not null,
  stale boolean not null default false,
  engine_version text not null default 'fair-floor-1',
  catalog_version text not null default 'concepts-1',
  created_at timestamptz not null default now(),
  unique (session_id,iteration)
);
create table public.match_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.activity_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  concept_id text not null references public.activity_concepts(id),
  context_revision integer not null,
  reason text not null check (reason in ('not_tonight','too_active','too_familiar','not_interested')),
  created_at timestamptz not null default now()
);
create index response_user on public.tonight_responses(user_id);
create index results_session on public.match_results(session_id,iteration desc);
create index feedback_session on public.match_feedback(session_id,context_revision);
alter table public.activity_concepts enable row level security;
alter table public.tonight_responses enable row level security;
alter table public.match_results enable row level security;
alter table public.match_feedback enable row level security;
revoke all on public.activity_concepts,public.tonight_responses,public.match_results,public.match_feedback from anon,authenticated;
grant select on public.activity_concepts,public.tonight_responses,public.match_results,public.match_feedback to authenticated;
create policy catalog_read on public.activity_concepts for select to authenticated using (true);
create policy own_tonight_read on public.tonight_responses for select to authenticated using (user_id=(select auth.uid()) and exists(select 1 from public.activity_sessions s where s.id=session_id and private.is_couple_member(s.couple_id)));
create policy results_read on public.match_results for select to authenticated using (exists(select 1 from public.activity_sessions s where s.id=session_id and private.is_couple_member(s.couple_id)));
create policy own_feedback_read on public.match_feedback for select to authenticated using (user_id=(select auth.uid()) and exists(select 1 from public.activity_sessions s where s.id=session_id and private.is_couple_member(s.couple_id)));

create function private.invalidate_session(target uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.match_results set stale=true where session_id=target and not stale;
  update public.activity_sessions set selected_concept_id=null where id=target and selected_concept_id is not null;
end; $$;
create function public.save_personal_preferences(p_answers jsonb,p_step integer,p_expected_version integer,p_complete boolean default false) returns integer
language plpgsql security definer set search_path = '' as $$
declare pref public.user_preferences%rowtype; target uuid;
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode='42501'; end if;
  if not private.valid_match_answers(p_answers,'personal') or p_step not between 0 and 30 or p_step is null or p_complete is null then raise exception 'invalid_answers' using errcode='22023'; end if;
  -- Match, context and personal edits use the same couple -> response -> preference lock order.
  select couple_id into target from public.couple_members where user_id=auth.uid();
  if target is not null then perform 1 from public.couples where id=target for update; end if;
  select * into pref from public.user_preferences where user_id=auth.uid() for update;
  if pref.version is distinct from p_expected_version then raise exception 'edit_conflict'; end if;
  if p_complete and not private.profile_complete(p_answers) then raise exception 'incomplete_profile'; end if;
  update public.user_preferences set answers=p_answers,onboarding_step=p_step,version=version+1,
    completed_at=case when p_complete then coalesce(completed_at,now()) when private.profile_complete(p_answers) then completed_at else null end
    where user_id=auth.uid();
  if pref.answers is distinct from p_answers then
    update public.tonight_responses set submitted_at=null,version=version+1 where user_id=auth.uid();
    update public.match_results r set stale=true from public.activity_sessions s where r.session_id=s.id and s.couple_id=target;
    update public.activity_sessions set selected_concept_id=null where couple_id=target and selected_concept_id is not null;
  end if;
  return pref.version+1;
end; $$;

create function public.update_tonight_context(p_session uuid,p_context jsonb,p_expected_revision integer) returns integer
language plpgsql security definer set search_path = '' as $$
declare s public.activity_sessions%rowtype;
begin
  select * into s from public.activity_sessions where id=p_session;
  if auth.uid() is null or s.id is null or not private.is_couple_member(s.couple_id) then raise exception 'unauthorized' using errcode='42501'; end if;
  perform 1 from public.couples where id=s.couple_id for update;
  select * into s from public.activity_sessions where id=p_session for update;
  if s.context_revision is distinct from p_expected_revision then raise exception 'edit_conflict'; end if;
  if jsonb_typeof(p_context)<>'object' or p_context is null or
    (select array_agg(key order by key) from jsonb_object_keys(p_context) key) is distinct from
      array['activity_date','budget_level','end_time','environment','max_travel_minutes','start_time','starting_location','timezone','timing','transport'] then raise exception 'invalid_context' using errcode='22023'; end if;
  if (p_context->>'max_travel_minutes') !~ '^\d{1,3}$' or (p_context->>'budget_level') !~ '^[0-3]$' then raise exception 'invalid_context' using errcode='22023'; end if;
  update public.activity_sessions set activity_date=(p_context->>'activity_date')::date,start_time=(p_context->>'start_time')::time,
    end_time=(p_context->>'end_time')::time,timezone=p_context->>'timezone',starting_location=p_context->>'starting_location',timing=p_context->>'timing',
    transport=p_context->>'transport',max_travel_minutes=(p_context->>'max_travel_minutes')::integer,budget_level=(p_context->>'budget_level')::integer,
    environment=p_context->>'environment',context_revision=context_revision+1,context_completed=true,selected_concept_id=null where id=p_session returning * into s;
  if s.starts_at < now()-interval '5 minutes' or s.starts_at > now()+interval '366 days' then raise exception 'date_out_of_range' using errcode='22023'; end if;
  update public.tonight_responses set submitted_at=null,context_revision=s.context_revision,version=version+1 where session_id=p_session;
  perform private.invalidate_session(p_session);
  return s.context_revision;
end; $$;

create function public.save_tonight_response(p_session uuid,p_answers jsonb,p_step integer,p_mode text,p_share boolean,p_expected_version integer,p_context_revision integer,p_submit boolean default false) returns integer
language plpgsql security definer set search_path = '' as $$
declare s public.activity_sessions%rowtype; r public.tonight_responses%rowtype;
begin
  select * into s from public.activity_sessions where id=p_session;
  if auth.uid() is null or s.id is null or not private.is_couple_member(s.couple_id) then raise exception 'unauthorized' using errcode='42501'; end if;
  perform 1 from public.couples where id=s.couple_id for update;
  select * into s from public.activity_sessions where id=p_session for update;
  if s.context_revision is distinct from p_context_revision then raise exception 'context_changed'; end if;
  if not s.context_completed then raise exception 'context_incomplete'; end if;
  if not private.valid_match_answers(p_answers,'tonight') or p_step is null or p_step not between 0 and 11 or p_mode is null or p_mode not in ('quick','detailed') or p_share is null or p_submit is null then raise exception 'invalid_answers' using errcode='22023'; end if;
  select * into r from public.tonight_responses where session_id=p_session and user_id=auth.uid() for update;
  if coalesce(r.version,0) is distinct from p_expected_version then raise exception 'edit_conflict'; end if;
  if p_submit and (not private.response_complete(p_answers) or not exists(select 1 from public.user_preferences where user_id=auth.uid() and completed_at is not null)) then raise exception 'incomplete_answers'; end if;
  insert into public.tonight_responses(session_id,user_id,answers,current_step,mode,share_answers,context_revision,version,submitted_at)
    values(p_session,auth.uid(),p_answers,p_step,p_mode,p_share,p_context_revision,coalesce(r.version,0)+1,case when p_submit then now() else null end)
    on conflict(session_id,user_id) do update set answers=excluded.answers,current_step=excluded.current_step,mode=excluded.mode,share_answers=excluded.share_answers,
      context_revision=excluded.context_revision,version=excluded.version,submitted_at=excluded.submitted_at,updated_at=now();
  if r.answers is distinct from p_answers or r.submitted_at is not null and not p_submit then perform private.invalidate_session(p_session); end if;
  return coalesce(r.version,0)+1;
end; $$;

create function public.tonight_progress(p_session uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare target uuid; result jsonb;
begin
  select couple_id into target from public.activity_sessions where id=p_session;
  if auth.uid() is null or target is null or not private.is_couple_member(target) then raise exception 'unauthorized' using errcode='42501'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('user_id',m.user_id,'display_name',p.display_name,'ready',coalesce(r.submitted_at is not null,false),
    'step',coalesce(r.current_step,0),'has_profile',pref.completed_at is not null,
    'revealed_answers',case when r.share_answers and r.submitted_at is not null then r.answers else null end) order by m.user_id),'[]') into result
    from public.couple_members m join public.profiles p on p.id=m.user_id join public.user_preferences pref on pref.user_id=m.user_id
    left join public.tonight_responses r on r.user_id=m.user_id and r.session_id=p_session where m.couple_id=target;
  return result;
end; $$;

-- Scoring kernel: ratings + current intent + style fit. Scores stay inside the database.
create function private.concept_person_score(c public.activity_concepts,p jsonb,t jsonb) returns numeric language sql immutable set search_path = '' as $$
  select (select avg(coalesce((p->'ratings'->>i)::integer,3))*12 from unnest(c.interests) i)
  + case when to_jsonb(c.interests) ?| array(select jsonb_array_elements_text(coalesce(t->'desired_interests','[]'))) then 15 else 0 end
  + case when c.interests && case t->>'mood' when 'curious' then array['travel','culture','photography'] when 'calm' then array['relax','nature'] when 'playful' then array['games','creative'] when 'romantic' then array['romance','food'] when 'adventurous' then array['adventure','sport','cars'] else '{}'::text[] end then 8 else 0 end
  + 10-abs(coalesce((t->>'energy')::integer,3)-c.energy)*2
  + 10-abs(coalesce((t->>'pace')::integer,(p->>'pace')::integer,3)-c.pace)*2
  + 10-abs(coalesce((t->>'familiarity')::integer,(p->>'novelty')::integer,3)-c.novelty)*2
  + 10-abs(coalesce((t->>'social')::integer,case p->>'social' when 'private' then 1 when 'open' then 5 else 3 end)-c.social)*2;
$$;
create function public.calculate_couple_match(p_session uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.activity_sessions%rowtype; a record; b record; fingerprint text; recommendations jsonb; result public.match_results%rowtype; n integer;
begin
  select * into s from public.activity_sessions where id=p_session;
  if auth.uid() is null or s.id is null or not private.is_couple_member(s.couple_id) then raise exception 'unauthorized' using errcode='42501'; end if;
  perform 1 from public.couples where id=s.couple_id for update;
  select * into s from public.activity_sessions where id=p_session for update;
  if not s.context_completed or (select count(*) from public.couple_members where couple_id=s.couple_id)<>2 then return jsonb_build_object('state','waiting'); end if;
  if (select count(*) from public.tonight_responses r join public.user_preferences p on p.user_id=r.user_id join public.couple_members m on m.user_id=r.user_id and m.couple_id=s.couple_id
      where r.session_id=p_session and r.submitted_at is not null and r.context_revision=s.context_revision and p.completed_at is not null)<>2 then return jsonb_build_object('state','waiting'); end if;
  select r.answers as tonight,p.answers as preferences,r.version as rv,p.version as pv,r.user_id into a from public.tonight_responses r join public.user_preferences p on p.user_id=r.user_id where r.session_id=p_session order by r.user_id limit 1;
  select r.answers as tonight,p.answers as preferences,r.version as rv,p.version as pv,r.user_id into b from public.tonight_responses r join public.user_preferences p on p.user_id=r.user_id where r.session_id=p_session order by r.user_id offset 1 limit 1;
  fingerprint := encode(extensions.digest(concat_ws(':',s.context_revision,a.user_id,a.rv,a.pv,b.user_id,b.rv,b.pv,(select count(*) from public.match_feedback where session_id=p_session and context_revision=s.context_revision)),'sha256'),'hex');
  select * into result from public.match_results where session_id=p_session and input_fingerprint=fingerprint and not stale order by iteration desc limit 1;
  if result.id is not null then return jsonb_build_object('state','matched','id',result.id); end if;
  with eligible as (
    select c.*,private.concept_person_score(c,a.preferences,a.tonight) as sa,private.concept_person_score(c,b.preferences,b.tonight) as sb
    from public.activity_concepts c where c.catalog_version='concepts-1'
      and c.duration_minutes + s.max_travel_minutes*2 <= extract(epoch from(s.ends_at-s.starts_at))/60
      and c.cost_level<=s.budget_level and (s.environment='either' or c.environment='either' or c.environment=s.environment)
      and (c.transport_required is null or c.transport_required=s.transport)
      and c.energy<=coalesce((a.tonight->>'energy')::integer,(a.preferences->>'energy')::integer,3)
      and c.energy<=coalesce((b.tonight->>'energy')::integer,(b.preferences->>'energy')::integer,3)
      and not to_jsonb(c.interests) ?| array(select jsonb_array_elements_text(coalesce(a.preferences->'excluded_interests','[]')||coalesce(b.preferences->'excluded_interests','[]')||coalesce(a.tonight->'avoid_interests','[]')||coalesce(b.tonight->'avoid_interests','[]')))
      and not to_jsonb(c.tags) ?| array(select jsonb_array_elements_text(coalesce(a.preferences->'limitation_tags','[]')||coalesce(b.preferences->'limitation_tags','[]')||coalesce(a.tonight->'restriction_tags','[]')||coalesce(b.tonight->'restriction_tags','[]')))
      and not exists(select 1 from public.match_feedback f where f.session_id=p_session and f.context_revision=s.context_revision and f.concept_id=c.id)
  ), ranked as (select id,0.75*least(sa,sb)+0.25*((sa+sb)/2)-0.05*abs(sa-sb) as score from eligible order by score desc,id collate "C" limit 4)
  select coalesce(jsonb_agg(jsonb_build_object('concept_id',id,'reasons',jsonb_build_array('time','budget','balanced','preferences')) order by score desc,id collate "C"),'[]') into recommendations from ranked;
  select coalesce(max(iteration),0)+1 into n from public.match_results where session_id=p_session;
  update public.match_results set stale=true where session_id=p_session and not stale;
  insert into public.match_results(session_id,context_revision,iteration,recommendations,input_fingerprint) values(p_session,s.context_revision,n,recommendations,fingerprint) returning * into result;
  return jsonb_build_object('state',case when jsonb_array_length(recommendations)=0 then 'no_match' else 'matched' end,'id',result.id);
end; $$;

create function public.record_match_feedback(p_session uuid,p_concept text,p_reason text) returns void language plpgsql security definer set search_path = '' as $$
declare s public.activity_sessions%rowtype;
begin
  select * into s from public.activity_sessions where id=p_session;
  if auth.uid() is null or s.id is null or not private.is_couple_member(s.couple_id) then raise exception 'unauthorized' using errcode='42501'; end if;
  perform 1 from public.couples where id=s.couple_id for update;
  if not exists(select 1 from public.match_results r,jsonb_array_elements(r.recommendations) item where r.session_id=p_session and not r.stale and item->>'concept_id'=p_concept) then raise exception 'stale_match'; end if;
  insert into public.match_feedback(session_id,user_id,concept_id,context_revision,reason) values(p_session,auth.uid(),p_concept,s.context_revision,p_reason);
  perform private.invalidate_session(p_session);
end; $$;
create function public.select_match_concept(p_session uuid,p_result uuid,p_concept text) returns void language plpgsql security definer set search_path = '' as $$
declare target uuid;
begin
  select couple_id into target from public.activity_sessions where id=p_session;
  if auth.uid() is null or target is null or not private.is_couple_member(target) then raise exception 'unauthorized' using errcode='42501'; end if;
  perform 1 from public.couples where id=target for update;
  if not exists(select 1 from public.match_results r,jsonb_array_elements(r.recommendations) item where r.id=p_result and r.session_id=p_session and not r.stale and item->>'concept_id'=p_concept) then raise exception 'stale_match'; end if;
  update public.activity_sessions set selected_concept_id=p_concept where id=p_session;
end; $$;

-- Definer functions never return private profiles, ratings, free text, scores or feedback to the other partner.
-- Scope grants to this migration's functions; preserve pre-existing private-schema permissions.
revoke all on function private.valid_match_answers(jsonb,text),private.profile_complete(jsonb),private.response_complete(jsonb),
 private.invalidate_session(uuid),private.concept_person_score(public.activity_concepts,jsonb,jsonb) from public,anon,authenticated;
grant execute on function private.valid_match_answers(jsonb,text),private.profile_complete(jsonb),private.response_complete(jsonb) to authenticated;
revoke all on function public.save_personal_preferences(jsonb,integer,integer,boolean), public.update_tonight_context(uuid,jsonb,integer),
 public.save_tonight_response(uuid,jsonb,integer,text,boolean,integer,integer,boolean),public.tonight_progress(uuid),public.calculate_couple_match(uuid),public.record_match_feedback(uuid,text,text),public.select_match_concept(uuid,uuid,text) from public,anon;
grant execute on function public.save_personal_preferences(jsonb,integer,integer,boolean),public.update_tonight_context(uuid,jsonb,integer),
 public.save_tonight_response(uuid,jsonb,integer,text,boolean,integer,integer,boolean),public.tonight_progress(uuid),public.calculate_couple_match(uuid),public.record_match_feedback(uuid,text,text),public.select_match_concept(uuid,uuid,text) to authenticated;
