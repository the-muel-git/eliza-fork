-- Safely revoke privileges if roles exist
do
$$ 
begin
    if exists (select 1 from pg_roles where rolname = 'anon_access') then
        revoke all privileges on all tables in schema public from anon_access;
        revoke all privileges on all sequences in schema public from anon_access;
        revoke all privileges on all functions in schema public from anon_access;
        revoke usage on schema public from anon_access;
    end if;

    if exists (select 1 from pg_roles where rolname = 'authenticated_role') then
        revoke all privileges on all tables in schema public from authenticated_role;
        revoke all privileges on all sequences in schema public from authenticated_role;
        revoke all privileges on all functions in schema public from authenticated_role;
        revoke usage on schema public from authenticated_role;
    end if;

    if exists (select 1 from pg_roles where rolname = 'agent_role') then
        revoke all privileges on all tables in schema public from agent_role;
        revoke all privileges on all sequences in schema public from agent_role;
        revoke all privileges on all functions in schema public from agent_role;
        revoke usage on schema public from agent_role;
    end if;
end
$$;

-- Drop existing policies if they exist
drop policy if exists "Public accounts are viewable by all users" on accounts;
drop policy if exists "Users can update their own account" on accounts;
drop policy if exists "Agents can create accounts" on accounts;
drop policy if exists "Room participants can view rooms" on rooms;
drop policy if exists "Agents can create rooms" on rooms;
drop policy if exists "Users can view room participants" on participants;
drop policy if exists "Users can join rooms" on participants;
drop policy if exists "Agents can manage participants" on participants;
drop policy if exists "Room participants can view memories" on memories;
drop policy if exists "Agents can create memories" on memories;
drop policy if exists "Agents can update memories" on memories;
drop policy if exists "Users can view their relationships" on relationships;
drop policy if exists "Users can manage their relationships" on relationships;
drop policy if exists "Users can view their goals" on goals;
drop policy if exists "Users can manage their goals" on goals;
drop policy if exists "Authenticated can read cache" on cache;
drop policy if exists "Agents can manage cache" on cache;
drop policy if exists "All users can query knowledge base" on knowledge;
drop policy if exists "Agents can manage knowledge" on knowledge;

-- Drop existing roles if they exist
drop role if exists anon_access;
drop role if exists agent_role;
drop role if exists authenticated_role;

-- Create roles with proper hierarchy
create role anon_access nologin;
create role authenticated_role nologin;
create role agent_role nologin in role authenticated_role; -- Agents inherit authenticated user permissions

-- Enable RLS on all tables
alter table accounts enable row level security;
alter table rooms enable row level security;
alter table participants enable row level security;
alter table memories enable row level security;
alter table relationships enable row level security;
alter table goals enable row level security;
alter table cache enable row level security;
alter table knowledge enable row level security;

-- Create auth check functions with improved security
create or replace function is_agent()
returns boolean
language plpgsql
security definer
as $$
begin
  return (
    auth.role() = 'authenticated' AND
    exists (
      select 1 from accounts
      where id = auth.uid()
      and (details->>'is_agent')::boolean = true
      and (details->>'is_active')::boolean = true -- Additional check for active agents
    )
  );
end;
$$;

create or replace function is_authenticated()
returns boolean
language plpgsql
security definer
as $$
begin
  return auth.role() = 'authenticated';
end;
$$;

-- Accounts policies with improved granularity
create policy "Public accounts are viewable by authenticated users"
on accounts for select
to authenticated_role
using (is_authenticated());

create policy "Users can update their own account"
on accounts for update
to authenticated_role
using (is_authenticated() and id = auth.uid())
with check (is_authenticated() and id = auth.uid());

create policy "Agents can create accounts"
on accounts for insert
to agent_role
with check (is_agent());

-- Rooms policies with enhanced security
create policy "Room participants can view rooms"
on rooms for select
to authenticated_role
using (
    is_authenticated() and
    exists (
        select 1 from participants
        where participants.room_id = rooms.id
        and participants.user_id = auth.uid()
        and participants.user_state != 'BANNED'
    )
);

create policy "Agents can manage rooms"
on rooms for all
to agent_role
using (is_agent());

-- Participants policies with role-based access
create policy "Users can view room participants"
on participants for select
to authenticated_role
using (
    is_authenticated() and
    exists (
        select 1 from participants p2
        where p2.room_id = participants.room_id
        and p2.user_id = auth.uid()
        and p2.user_state != 'BANNED'
    )
);

create policy "Users can join rooms"
on participants for insert
to authenticated_role
with check (
    is_authenticated() 
    and user_id = auth.uid()
    and not exists (
        select 1 from participants p2
        where p2.room_id = room_id
        and p2.user_id = auth.uid()
        and p2.user_state = 'BANNED'
    )
);

create policy "Agents can view participants"
on participants for select
to agent_role
using (is_agent());

create policy "Agents can manage participants"
on participants for all
to agent_role
using (is_agent());

-- Memories policies with vector search security
create policy "Room participants can view memories"
on memories for select
to authenticated_role
using (
    is_authenticated() and
    exists (
        select 1 from participants
        where participants.room_id = memories.room_id
        and participants.user_id = auth.uid()
        and participants.user_state != 'BANNED'
    )
);

create policy "Agents can create memories"
on memories for insert
to agent_role
with check (is_agent() and agent_id = auth.uid());

create policy "Agents can manage memories"
on memories for all
to agent_role
using (is_agent() and agent_id = auth.uid());

-- Relationships policies with improved privacy
create policy "Users can view their relationships"
on relationships for select
to authenticated_role
using (
    is_authenticated() and 
    (user_id = auth.uid() or target_user_id = auth.uid())
);

create policy "Users can manage their relationships"
on relationships for all
to authenticated_role
using (is_authenticated() and user_id = auth.uid())
with check (is_authenticated() and user_id = auth.uid());

-- Goals policies with enhanced access control
create policy "Users can view their goals"
on goals for select
to authenticated_role
using (is_authenticated() and user_id = auth.uid());

create policy "Users can manage their goals"
on goals for all
to authenticated_role
using (is_authenticated() and user_id = auth.uid())
with check (is_authenticated() and user_id = auth.uid());

-- Cache policies with agent-only access
create policy "Agents can read cache"
on cache for select
to agent_role
using (is_agent());

create policy "Agents can manage cache"
on cache for all
to agent_role
using (is_agent());

-- Knowledge policies with improved access control
create policy "Authenticated users can query knowledge base"
on knowledge for select
to authenticated_role
using (is_authenticated());

create policy "Agents can manage knowledge"
on knowledge for all
to agent_role
using (is_agent());

-- Grant base permissions to roles
grant usage on schema public to anon_access;
grant usage on schema public to authenticated_role;
grant usage on schema public to agent_role;

-- Anonymous access permissions (minimal)
grant select on table accounts to anon_access;
grant select on table rooms to anon_access;

-- Authenticated user permissions
grant select, insert, update on table accounts to authenticated_role;
grant select on table rooms to authenticated_role;
grant select, insert on table participants to authenticated_role;
grant select on table memories to authenticated_role;
grant select, insert, update, delete on table relationships to authenticated_role;
grant select, insert, update, delete on table goals to authenticated_role;
grant select on table knowledge to authenticated_role;

-- Agent permissions (full access with RLS constraints)
grant select, insert, update, delete on all tables in schema public to agent_role;
grant usage on all sequences in schema public to agent_role;

-- Helper function to create an agent account with improved validation
create or replace function create_agent_account(
    agent_name text,
    agent_username text,
    agent_details jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
as $$
declare
    new_agent_id uuid;
begin
    -- Verify the executing user has permission to create agents
    if not exists (
        select 1 from auth.users
        where id = auth.uid()
        and role = 'service_role'
    ) then
        raise exception 'Only service role can create agent accounts';
    end if;

    -- Validate agent details
    if agent_name is null or agent_username is null then
        raise exception 'Agent name and username are required';
    end if;

    -- Set required agent flags in details
    agent_details = jsonb_build_object(
        'is_agent', true,
        'is_active', true,
        'created_at', current_timestamp,
        'created_by', auth.uid()
    ) || coalesce(agent_details, '{}'::jsonb);
    
    -- Create the account
    insert into accounts (name, username, details)
    values (agent_name, agent_username, agent_details)
    returning id into new_agent_id;
    
    -- Grant agent role to the new account
    execute format('grant agent_role to %I', agent_username);
    
    return new_agent_id;
end;
$$; 