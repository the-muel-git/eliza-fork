-- Insert default agent
INSERT INTO public.accounts (id, name, email, "avatarUrl", details)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'SamBot',
    'sambot@agent.com',
    '',
    '{"type": "agent", "description": "Your friendly neighborhood AI assistant"}'
);

-- Insert default room
INSERT INTO public.rooms (id)
VALUES ('00000000-0000-0000-0000-000000000000');