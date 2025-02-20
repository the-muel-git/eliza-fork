-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists vector;

-- Drop existing tables if they exist (in reverse order of dependencies)
drop table if exists knowledge cascade;
drop table if exists cache cascade;
drop table if exists goals cascade;
drop table if exists relationships cascade;
drop table if exists memories cascade;
drop table if exists participants cascade;
drop table if exists rooms cascade;
drop table if exists accounts cascade;

-- Create base tables
create table accounts (
    id uuid primary key default uuid_generate_v4(),
    name text,
    username text,
    details jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table rooms (
    id uuid primary key default uuid_generate_v4(),
    platform text not null, -- 'discord', 'telegram', etc.
    external_id text,      -- Platform-specific channel/room ID
    metadata jsonb,        -- Platform-specific settings
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table participants (
    id uuid primary key default uuid_generate_v4(),
    room_id uuid references rooms(id) on delete cascade,
    user_id uuid references accounts(id) on delete cascade,
    user_state text,       -- 'FOLLOWED', 'MUTED', etc.
    platform_user_id text, -- Platform-specific user ID
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(room_id, user_id)
);

create table memories (
    id uuid primary key default uuid_generate_v4(),
    room_id uuid references rooms(id) on delete cascade,
    agent_id uuid references accounts(id),
    content jsonb,
    embedding vector(1536), -- For OpenAI embeddings
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    expires_at timestamp with time zone -- For TTL cleanup
);

create table relationships (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references accounts(id) on delete cascade,
    target_user_id uuid references accounts(id) on delete cascade,
    relationship_type text,
    metadata jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, target_user_id)
);

create table goals (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references accounts(id) on delete cascade,
    title text not null,
    description text,
    status text,
    metadata jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table cache (
    key text primary key,
    value jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    expires_at timestamp with time zone
);

create table knowledge (
    id uuid primary key default uuid_generate_v4(),
    content text not null,
    metadata jsonb,
    embedding vector(1536),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Drop existing indexes if they exist
drop index if exists idx_memories_room_id;
drop index if exists idx_memories_agent_id;
drop index if exists idx_participants_room_id;
drop index if exists idx_participants_user_id;
drop index if exists idx_relationships_user_id;
drop index if exists idx_relationships_target_user_id;
drop index if exists idx_goals_user_id;
drop index if exists idx_cache_expires_at;
drop index if exists idx_memories_embedding;
drop index if exists idx_knowledge_embedding;

-- Create indexes for better query performance
create index idx_memories_room_id on memories(room_id);
create index idx_memories_agent_id on memories(agent_id);
create index idx_participants_room_id on participants(room_id);
create index idx_participants_user_id on participants(user_id);
create index idx_relationships_user_id on relationships(user_id);
create index idx_relationships_target_user_id on relationships(target_user_id);
create index idx_goals_user_id on goals(user_id);
create index idx_cache_expires_at on cache(expires_at);
create index idx_memories_embedding on memories using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index idx_knowledge_embedding on knowledge using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Drop existing functions if they exist
drop function if exists cosine_similarity(vector, vector);

-- Create vector similarity function
create or replace function cosine_similarity(a vector, b vector)
returns float
language plpgsql
as $$
begin
    return 1 - (a <=> b);
end;
$$; 