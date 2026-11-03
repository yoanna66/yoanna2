begin;
create table public.events (
 id uuid primary key default gen_random_uuid(), code text unique not null check(code ~ '^[A-F0-9]{12}$'),
 title text not null check(length(title) between 1 and 80), organizer text not null check(length(organizer) between 1 and 40),
 admin_hash text not null, final_slot_id uuid, created_at timestamptz not null default now()
);
create table public.slots (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events on delete cascade,
 starts_at timestamptz not null, ends_at timestamptz not null check(ends_at>starts_at), unique(event_id,starts_at,ends_at), unique(event_id,id)
);
alter table public.events add constraint final_slot_belongs_to_event foreign key(id,final_slot_id) references public.slots(event_id,id);
create table public.participants (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events on delete cascade,
 nickname text not null check(length(nickname) between 1 and 40), edit_hash text not null,
 choices uuid[] not null default '{}', updated_at timestamptz not null default now(), unique(event_id,edit_hash)
);
create index on public.participants(event_id);
alter table public.events enable row level security;
alter table public.slots enable row level security;
alter table public.participants enable row level security;
revoke all on public.events, public.slots, public.participants from anon, authenticated;
grant select, insert, update, delete on public.events, public.slots, public.participants to service_role;

create function public.create_event(p_code text,p_title text,p_organizer text,p_hash text,p_slots jsonb) returns void language plpgsql set search_path=public as $$
declare eid uuid;
begin
 if jsonb_array_length(p_slots) not between 1 and 40 then raise exception 'invalid slots'; end if;
 insert into events(code,title,organizer,admin_hash) values(p_code,p_title,p_organizer,p_hash) returning id into eid;
 insert into slots(event_id,starts_at,ends_at) select eid,(s->>'start')::timestamptz,(s->>'end')::timestamptz from jsonb_array_elements(p_slots) s;
end $$;
create function public.read_event(p_code text) returns jsonb language sql stable set search_path=public as $$
 select jsonb_build_object('id',e.id,'code',e.code,'title',e.title,'organizer',e.organizer,'final_slot_id',e.final_slot_id,
 'slots',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'starts_at',s.starts_at,'ends_at',s.ends_at) order by s.starts_at) from slots s where s.event_id=e.id),'[]'::jsonb),
 'participants',coalesce((select jsonb_agg(jsonb_build_object('nickname',p.nickname,'choices',p.choices) order by p.updated_at) from participants p where p.event_id=e.id),'[]'::jsonb)) from events e where e.code=p_code;
$$;
create function public.read_response(p_code text,p_hash text) returns jsonb language sql stable set search_path=public as $$
 select jsonb_build_object('nickname',p.nickname,'choices',p.choices) from participants p join events e on e.id=p.event_id where e.code=p_code and p.edit_hash=p_hash;
$$;
create function public.save_response(p_code text,p_hash text,p_nickname text,p_choices uuid[],p_edit boolean) returns void language plpgsql set search_path=public as $$
declare ev events;
begin
 select * into ev from events where code=p_code for update;
 if ev.id is null or ev.final_slot_id is not null then raise exception 'closed or missing'; end if;
 if cardinality(p_choices)>40 or exists(select 1 from unnest(p_choices) c where not exists(select 1 from slots where id=c and event_id=ev.id)) then raise exception 'invalid choices'; end if;
 if p_edit then
 update participants set nickname=p_nickname,choices=p_choices,updated_at=now() where event_id=ev.id and edit_hash=p_hash;
 if not found then raise exception 'invalid token'; end if;
 else
 -- Retry with the same random capability is idempotent, including a lost HTTP response.
 insert into participants(event_id,nickname,edit_hash,choices) values(ev.id,p_nickname,p_hash,p_choices)
 on conflict(event_id,edit_hash) do update set nickname=excluded.nickname, choices=excluded.choices, updated_at=now();
 end if;
end $$;
create function public.confirm_event(p_code text,p_hash text,p_slot uuid) returns void language plpgsql set search_path=public as $$
declare ev events;
begin
 select * into ev from events where code=p_code for update;
 if ev.id is null or ev.admin_hash<>p_hash or not exists(select 1 from slots where id=p_slot and event_id=ev.id) then raise exception 'forbidden'; end if;
 if ev.final_slot_id is not null and ev.final_slot_id<>p_slot then raise exception 'already confirmed'; end if;
 update events set final_slot_id=p_slot where id=ev.id;
end $$;
revoke execute on function public.create_event(text,text,text,text,jsonb), public.read_event(text), public.read_response(text,text), public.save_response(text,text,text,uuid[],boolean), public.confirm_event(text,text,uuid) from public,anon,authenticated;
grant execute on function public.create_event(text,text,text,text,jsonb), public.read_event(text), public.read_response(text,text), public.save_response(text,text,text,uuid[],boolean), public.confirm_event(text,text,uuid) to service_role;
commit;
