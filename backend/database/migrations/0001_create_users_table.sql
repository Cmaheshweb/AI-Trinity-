-- Migration: 0001_create_users_table.sql

-- UP (Apply this migration)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- Enable UUID generation

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users (email);

-- DOWN (Revert this migration)
DROP TABLE IF EXISTS users;
DROP EXTENSION IF EXISTS "uuid-ossp";