-- Migration: 0002_create_subscription_and_code_session_tables.sql

-- UP (Apply this migration)

-- Create subscription_plans table
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    duration_days INTEGER NOT NULL,
    max_code_generations_per_month INTEGER,
    max_debug_requests_per_month INTEGER,
    features JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed some initial subscription plans (optional, but good for quick setup)
INSERT INTO subscription_plans (name, description, price, duration_days, max_code_generations_per_month, max_debug_requests_per_month, features) VALUES
('Basic', 'Limited access for individuals', 9.99, 30, 10, 20, '{"supported_languages": ["JavaScript", "Python"], "max_code_size_mb": 1}'),
('Premium', 'Full access for professionals', 29.99, 30, 100, 200, '{"supported_languages": ["JavaScript", "Python", "Java", "Go"], "max_code_size_mb": 5, "priority_support": true}'),
('Enterprise', 'Unlimited for large teams', 99.99, 30, NULL, NULL, '{"supported_languages": ["All"], "max_code_size_mb": 10, "priority_support": true, "team_management": true}');


-- Create user_subscriptions table
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    plan_id UUID NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'active' NOT NULL, -- 'active', 'expired', 'cancelled'
    stripe_subscription_id VARCHAR(255) UNIQUE,
    current_generation_count INTEGER DEFAULT 0,
    current_debug_count INTEGER DEFAULT 0,
    last_reset_date TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    UNIQUE (user_id, status) -- Ensure only one active subscription per user at a time
);

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions (user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions (status);


-- Create code_sessions table
CREATE TYPE code_session_type AS ENUM ('generation', 'debugging', 'deployment_assist');
CREATE TYPE code_session_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'canceled');

CREATE TABLE code_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    session_type code_session_type NOT NULL,
    status code_session_status DEFAULT 'pending' NOT NULL,
    input_s3_key VARCHAR(500) NOT NULL,
    output_s3_key VARCHAR(500),
    requested_language VARCHAR(50),
    requested_framework VARCHAR(50),
    request_details JSONB,
    result_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE, -- For temporary S3 data expiration
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_code_sessions_user_id ON code_sessions (user_id);
CREATE INDEX idx_code_sessions_created_at ON code_sessions (created_at);
CREATE INDEX idx_code_sessions_status ON code_sessions (status);

-- DOWN (Revert this migration)
DROP TABLE IF EXISTS code_sessions;
DROP TYPE IF EXISTS code_session_type;
DROP TYPE IF EXISTS code_session_status;
DROP TABLE IF EXISTS user_subscriptions;
DROP TABLE IF EXISTS subscription_plans;