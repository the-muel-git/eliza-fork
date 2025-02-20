# Deployment Configuration

## Character Configuration
We use a production-specific character file `characters/production.character.json` that maintains the core TrollDetective.Exe personality while including our deployment-specific settings.

### Character File Location
The production character file is located at:
```
characters/production.character.json
```

This file includes:
- Discord and Telegram client configurations
- Memory settings (enabled, with 30-day TTL and 1000 item limit)
- Database configuration for Supabase
- All core personality traits and behaviors

## Environment Variables

### Already Configured in Render
- Database credentials (Supabase)
- API Keys (OpenAI)
- Client tokens (Discord, Telegram)

### Deployment Configuration
When deploying, set the following in Render:
```env
CHARACTER_FILE=characters/production.character.json
```

## Deployment Checklist
1. Verify character file is present:
   - Ensure `production.character.json` is in the characters directory
   - Verify file permissions are correct
   
2. Verify environment variables in Render:
   - All required API keys and tokens are set
   - CHARACTER_FILE is set to the correct path
   
3. Post-deployment verification:
   - Check logs for successful character file loading
   - Verify client connections (Discord and Telegram)
   - Test bot responses in both platforms
   - Verify memory storage is working

## Maintenance Notes
- Monitor memory usage in Render dashboard
- Check database connections regularly
- Review client connection status
- Monitor rate limits for API calls
- Periodically verify memory storage and retrieval

## Troubleshooting
If the bot fails to start:
1. Check if character file is being loaded correctly
2. Verify all required environment variables are set
3. Check client connection logs for Discord and Telegram
4. Verify database connectivity
5. Check memory system initialization

## Service Operation

### Automatic Initialization
The character is automatically initialized when the service starts. You don't need to manually "start" the character after deployment.

### Process Flow
1. Service starts via Render's `startCommand`
2. System automatically loads character from `CHARACTER_FILE`
3. Initializes all configured clients (Discord, Telegram)
4. Establishes database connections
5. Sets up memory systems

### Always-On Operation
- Service runs continuously through Render's scaling configuration
- Maintains exactly one instance running (min=1, max=1)
  - Single instance is optimal for maintaining conversation state
  - Prevents duplicate responses in Discord and Telegram
  - Ensures consistent memory and database operations
- Auto-restarts on crashes or failures
- Auto-deploys when changes are pushed to the repository

### Monitoring Service Status
You can verify the service is running by:
1. Checking Render dashboard for service status
2. Reviewing deployment logs for successful initialization
3. Testing bot responses in Discord and Telegram
4. Monitoring database connections in Supabase 

## Character and Agent Relationship

### Understanding the Difference
- **Character** (`production.character.json`):
  - Configuration file that defines personality, behavior, and settings
  - Static JSON definition
  - Contains client configurations, memory settings, and personality traits

- **Agent**:
  - Running instance that implements the character
  - Handles active connections to Discord, Telegram
  - Manages database interactions and memory
  - Processes conversations and generates responses

### Initialization Process
1. System loads character configuration
2. Creates agent runtime with:
   - Database connection
   - Cache system
   - Client connections
   - Memory management
3. Agent begins processing messages through configured clients

### Runtime Management
- Single agent instance runs per character
- Agent maintains conversation state and memory
- Automatic reconnection if clients disconnect
- Persistent database connection for memory storage

### Agent Health Monitoring
1. Memory Usage:
   ```
   - Check Render logs for memory-related warnings
   - Monitor memory limit usage (configured for 1000 items)
   - Verify TTL cleanup is working (30-day expiration)
   ```

2. Client Connections:
   ```
   - Discord status and presence
   - Telegram bot responsiveness
   - Connection retry patterns
   ```

3. Database Operations:
   ```
   - Memory storage writes
   - Relationship updates
   - Embedding storage
   ```

4. Agent State Verification:
   ```
   - Character personality consistency
   - Response templating
   - Context maintenance between messages
   ```

### Agent Logs to Monitor
Look for these key log patterns:
- "Successfully loaded character from: characters/production.character.json"
- "Successfully connected to Supabase database"
- "Started [Character Name] as [Agent ID]"
- Client connection confirmations
- Memory storage operations

### Agent Recovery
If agent state becomes inconsistent:
1. Check database connectivity
2. Verify client token validity
3. Monitor memory cleanup operations
4. Review rate limit status
5. Check for plugin initialization errors

## Character and Agent Relationship

### Understanding the Difference
- **Character** (`production.character.json`):
  - Configuration file that defines personality, behavior, and settings
  - Static JSON definition
  - Contains client configurations, memory settings, and personality traits

- **Agent**:
  - Running instance that implements the character
  - Handles active connections to Discord, Telegram
  - Manages database interactions and memory
  - Processes conversations and generates responses

### Initialization Process
1. System loads character configuration
2. Creates agent runtime with:
   - Database connection
   - Cache system
   - Client connections
   - Memory management
3. Agent begins processing messages through configured clients

### Runtime Management
- Single agent instance runs per character
- Agent maintains conversation state and memory
- Automatic reconnection if clients disconnect
- Persistent database connection for memory storage

## Supabase Configuration

### Required Tables
```sql
-- Core Tables Required by Eliza
- accounts          # User account information
- participants      # Room participation and user states
- rooms            # Chat rooms/conversations
- memories         # Conversation memory storage
- goals            # User and agent goals
- relationships    # User-to-user relationships
- cache            # Agent cache storage
- knowledge        # RAG knowledge base

-- Additional Tables for Vector Search
- embeddings       # Vector embeddings for semantic search
```

### Table Creation Steps
1. Create tables with proper schemas:
   ```sql
   -- Accounts Table (Core user information)
   create table accounts (
     id uuid primary key default uuid_generate_v4(),
     name text,
     username text,
     details jsonb,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null,
     updated_at timestamp with time zone default timezone('utc'::text, now()) not null
   );

   -- Rooms Table (Conversations/Channels)
   create table rooms (
     id uuid primary key default uuid_generate_v4(),
     platform text not null, -- 'discord', 'telegram', etc.
     external_id text, -- Platform-specific channel/room ID
     metadata jsonb,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null
   );

   -- Participants Table (Room membership)
   create table participants (
     id uuid primary key default uuid_generate_v4(),
     room_id uuid references rooms(id) on delete cascade,
     user_id uuid references accounts(id) on delete cascade,
     user_state text, -- 'FOLLOWED', 'MUTED', etc.
     platform_user_id text, -- Platform-specific user ID
     created_at timestamp with time zone default timezone('utc'::text, now()) not null,
     unique(room_id, user_id)
   );

   -- Memories Table (Conversation history and context)
   create table memories (
     id uuid primary key default uuid_generate_v4(),
     room_id uuid references rooms(id) on delete cascade,
     agent_id uuid references accounts(id),
     content jsonb,
     embedding vector(1536), -- For OpenAI embeddings
     created_at timestamp with time zone default timezone('utc'::text, now()) not null,
     expires_at timestamp with time zone -- For TTL cleanup
   );

   -- Relationships Table (User connections and rapport)
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

   -- Goals Table (User and agent objectives)
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

   -- Cache Table (Temporary data storage)
   create table cache (
     key text primary key,
     value jsonb,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null,
     expires_at timestamp with time zone
   );

   -- Knowledge Table (RAG knowledge base)
   create table knowledge (
     id uuid primary key default uuid_generate_v4(),
     content text not null,
     metadata jsonb,
     embedding vector(1536),
     created_at timestamp with time zone default timezone('utc'::text, now()) not null
   );

   -- Create indexes for better query performance
   create index idx_memories_room_id on memories(room_id);
   create index idx_memories_agent_id on memories(agent_id);
   create index idx_participants_room_id on participants(room_id);
   create index idx_participants_user_id on participants(user_id);
   create index idx_relationships_user_id on relationships(user_id);
   create index idx_relationships_target_user_id on relationships(target_user_id);
   create index idx_goals_user_id on goals(user_id);
   create index idx_cache_expires_at on cache(expires_at);
   ```

### Row Level Security (RLS)

Enable RLS on all tables:
```sql
alter table accounts enable row level security;
alter table rooms enable row level security;
alter table participants enable row level security;
alter table memories enable row level security;
alter table relationships enable row level security;
alter table goals enable row level security;
alter table cache enable row level security;
alter table knowledge enable row level security;
```

#### Core Table Policies

```sql
-- Accounts Table
create policy "Public accounts are viewable by all users"
on accounts for select
to authenticated
using (true);

create policy "Users can update their own account"
on accounts for update
to authenticated
using (id = auth.uid());

-- Rooms Table
create policy "Room participants can view rooms"
on rooms for select
to authenticated
using (
  exists (
    select 1 from participants
    where participants.room_id = rooms.id
    and participants.user_id = auth.uid()
  )
);

-- Participants Table
create policy "Users can view room participants"
on participants for select
to authenticated
using (
  exists (
    select 1 from participants p2
    where p2.room_id = participants.room_id
    and p2.user_id = auth.uid()
  )
);

create policy "Users can join rooms"
on participants for insert
to authenticated
with check (user_id = auth.uid());

-- Memories Table
create policy "Room participants can view memories"
on memories for select
to authenticated
using (
  exists (
    select 1 from participants
    where participants.room_id = memories.room_id
    and participants.user_id = auth.uid()
  )
);

create policy "Agents can create memories"
on memories for insert
to authenticated
with check (agent_id = auth.uid());

-- Relationships Table
create policy "Users can view their relationships"
on relationships for select
to authenticated
using (user_id = auth.uid() or target_user_id = auth.uid());

create policy "Users can manage their relationships"
on relationships for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Goals Table
create policy "Users can view their goals"
on goals for select
to authenticated
using (user_id = auth.uid());

create policy "Users can manage their goals"
on goals for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Cache Table (System-level access only)
create policy "Authenticated can read cache"
on cache for select
to authenticated
using (true);

-- Knowledge Table
create policy "All users can query knowledge base"
on knowledge for select
to authenticated
using (true);
```

### Vector Search Setup

1. Enable vector extension:
```sql
create extension if not exists vector;
```

2. Create vector similarity functions:
```sql
-- Cosine similarity
create or replace function cosine_similarity(a vector, b vector)
returns float
language plpgsql
as $$
begin
  return 1 - (a <=> b);
end;
$$;

-- Create GiST index for vector similarity search
create index idx_memories_embedding on memories using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index idx_knowledge_embedding on knowledge using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
```

3. Example similarity search:
```sql
-- Search similar memories
select id, content, cosine_similarity(embedding, query_embedding) as similarity
from memories
where room_id = :room_id
order by embedding <=> :query_embedding
limit 5;
```

### API Key Switch Steps

1. Create a new anon key with limited permissions:
```sql
-- Create role for anon access
create role anon_access;

-- Grant necessary permissions
grant usage on schema public to anon_access;
grant select on all tables in schema public to anon_access;
grant insert, update on table participants to anon_access;
grant insert on table memories to anon_access;
grant insert, update on table relationships to anon_access;
grant insert, update on table goals to anon_access;
```

2. Update environment variables in Render:
```bash
# Remove
SUPABASE_SERVICE_KEY

# Add
SUPABASE_ANON_KEY=eyJh...  # Your anon key here
```

3. Verify permissions:
```sql
-- Test queries with anon key
select * from rooms;  -- Should only show rooms user is participant in
select * from memories;  -- Should only show memories from user's rooms
insert into participants (room_id, user_id) values (...);  -- Should work
insert into memories (...) values (...);  -- Should work if agent
```

### Verification Steps
1. Database Access:
   - Test read operations with anon key
   - Verify write operations work
   - Check RLS policies are enforced

2. Table Verification:
   - All required tables present
   - Correct schemas
   - Proper relationships

3. Performance Check:
   - Query response times
   - Connection pooling
   - Index usage

### Migration Process
1. Backup current data
2. Create new tables
3. Enable RLS
4. Test with anon key
5. Switch keys in production
6. Verify agent operation 