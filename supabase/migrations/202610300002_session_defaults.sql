-- These columns are overwritten by validate_session before constraints run.
-- Defaults let generated clients correctly omit database-calculated timestamps.
alter table public.activity_sessions alter column starts_at set default now();
alter table public.activity_sessions alter column ends_at set default now();
