-- Drop existing tables if they exist
DROP TABLE IF EXISTS memories_1536 CASCADE;
DROP TABLE IF EXISTS cache CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;

-- Drop extension if exists
DROP EXTENSION IF EXISTS vector CASCADE;