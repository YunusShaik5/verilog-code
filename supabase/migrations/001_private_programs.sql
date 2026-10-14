-- Run once in the Supabase SQL editor. No service-role key is used by the website.
begin;
create table public.signal_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z][a-z0-9_]{2,23}$'),
  quota_bytes integer not null default 5242880 check (quota_bytes between 1048576 and 10485760),
  created_at timestamptz not null default now()
);
create table public.signal_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.signal_profiles(user_id) on delete cascade,
  name text not null check (name ~ '^[A-Za-z0-9][A-Za-z0-9 _.-]{0,63}$'),
  design text not null default '',
  testbench text not null default '',
  language text not null default '2012' check (language in ('2005','2012')),
  time_limit integer not null default 1000 check (time_limit between 1 and 100000),
  size_bytes integer generated always as (octet_length(design) + octet_length(testbench)) stored,
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  check (octet_length(design) + octet_length(testbench) <= 1048576)
);
create unique index signal_program_names on public.signal_programs(user_id, lower(name));

create function public.signal_user_id() returns uuid
language sql stable set search_path = '' as $$
  select case when auth.jwt()->'app_metadata'->>'provider' = 'google'
    then auth.uid() else null end;
$$;
revoke all on function public.signal_user_id() from public, anon;
grant execute on function public.signal_user_id() to authenticated;

alter table public.signal_profiles enable row level security;
alter table public.signal_programs enable row level security;
revoke all on public.signal_profiles, public.signal_programs from public, anon, authenticated;
grant select on public.signal_profiles, public.signal_programs to authenticated;
create policy own_profile on public.signal_profiles for select to authenticated
  using (user_id = (select public.signal_user_id()));
create policy own_programs on public.signal_programs for select to authenticated
  using (user_id = (select public.signal_user_id()));
-- All mutations use checked functions. Clients cannot change owner IDs or bypass quotas.
create function public.signal_claim_username(p_username text) returns public.signal_profiles
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.signal_user_id(); result public.signal_profiles; uname text := lower(trim(p_username));
begin
  if uid is null then raise exception 'Google sign-in required'; end if;
  if uname is null or uname !~ '^[a-z][a-z0-9_]{2,23}$' then
    raise exception 'Use 3-24 characters: start with a letter, then letters, numbers or underscores';
  end if;
  insert into public.signal_profiles(user_id, username) values(uid, uname)
    on conflict(user_id) do nothing;
  select * into result from public.signal_profiles where user_id = uid;
  return result;
exception when unique_violation then raise exception 'Username already taken';
end;
$$;

create function public.signal_set_quota(p_mebibytes integer) returns public.signal_profiles
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.signal_user_id(); result public.signal_profiles; used bigint;
begin
  if uid is null then raise exception 'Google sign-in required'; end if;
  if p_mebibytes is null or p_mebibytes not between 1 and 10 then raise exception 'Choose 1-10 MiB'; end if;
  select * into result from public.signal_profiles where user_id = uid for update;
  if not found then raise exception 'Choose a username first'; end if;
  select coalesce(sum(size_bytes),0) into used from public.signal_programs where user_id = uid;
  if used > p_mebibytes * 1048576 then raise exception 'Delete files before lowering your storage limit'; end if;
  update public.signal_profiles set quota_bytes = p_mebibytes * 1048576 where user_id = uid returning * into result;
  return result;
end;
$$;

create function public.signal_save_program(p_id uuid, p_name text, p_design text, p_testbench text,
  p_language text, p_time_limit integer, p_expected_version integer)
returns public.signal_programs language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.signal_user_id(); quota integer; used bigint; count_files integer;
  prior public.signal_programs; result public.signal_programs; bytes integer;
begin
  if uid is null then raise exception 'Google sign-in required'; end if;
  select quota_bytes into quota from public.signal_profiles where user_id = uid for update;
  if not found then raise exception 'Choose a username first'; end if;
  if p_name is null or trim(p_name) !~ '^[A-Za-z0-9][A-Za-z0-9 _.-]{0,63}$' then raise exception 'Use a file name of 1-64 letters, numbers, spaces, dots, underscores or hyphens'; end if;
  if p_design is null or p_testbench is null then raise exception 'Source code is required'; end if;
  if p_language is null or p_language not in ('2005','2012') or p_time_limit is null or p_time_limit not between 1 and 100000 then raise exception 'Invalid simulation settings'; end if;
  bytes := octet_length(p_design) + octet_length(p_testbench);
  if bytes > 1048576 then raise exception 'A program can contain at most 1 MiB of code'; end if;
  if p_id is not null then
    select * into prior from public.signal_programs where id = p_id and user_id = uid;
    if not found then raise exception 'File not found'; end if;
    if p_expected_version is distinct from prior.version then raise exception 'This file changed in another tab. Export your edits and reopen the file before saving'; end if;
  end if;
  select coalesce(sum(size_bytes),0), count(*) into used, count_files from public.signal_programs where user_id = uid;
  if p_id is null and count_files >= 100 then raise exception 'Maximum 100 files per account'; end if;
  if used - coalesce(prior.size_bytes,0) + bytes > quota then raise exception 'Storage limit reached. Allocate more storage or delete a file'; end if;
  if p_id is null then
    insert into public.signal_programs(user_id,name,design,testbench,language,time_limit)
      values(uid,trim(p_name),p_design,p_testbench,p_language,p_time_limit) returning * into result;
  else
    update public.signal_programs set name=trim(p_name),design=p_design,testbench=p_testbench,
      language=p_language,time_limit=p_time_limit,version=version+1,updated_at=now()
      where id=p_id and user_id=uid returning * into result;
  end if;
  return result;
exception when unique_violation then raise exception 'You already have a file with that name';
end;
$$;

create function public.signal_delete_program(p_id uuid, p_expected_version integer) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.signal_user_id(); prior public.signal_programs;
begin
  if uid is null then raise exception 'Google sign-in required'; end if;
  perform 1 from public.signal_profiles where user_id=uid for update;
  select * into prior from public.signal_programs where id=p_id and user_id=uid;
  if not found then raise exception 'File not found'; end if;
  if prior.version is distinct from p_expected_version then raise exception 'File changed in another tab. Refresh before deleting'; end if;
  delete from public.signal_programs where id=p_id and user_id=uid;
end;
$$;

revoke all on function public.signal_claim_username(text), public.signal_set_quota(integer),
  public.signal_save_program(uuid,text,text,text,text,integer,integer), public.signal_delete_program(uuid,integer) from public, anon;
grant execute on function public.signal_claim_username(text), public.signal_set_quota(integer),
  public.signal_save_program(uuid,text,text,text,text,integer,integer), public.signal_delete_program(uuid,integer) to authenticated;
commit;
