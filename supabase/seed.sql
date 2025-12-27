-- Seed Data for Development
-- This file contains sample data for testing

-- Note: Users are created via Supabase Auth, so we'll create organizations
-- that can be linked to users after they sign up

-- Sample Organization
INSERT INTO public.organizations (id, name, slug, plan, settings)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Demo Company',
  'demo-company',
  'pro',
  '{"theme": "light", "timezone": "America/New_York"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- You can add more test data here after a user signs up
-- Example queries to run after signing up:

/*
-- Link a user to the demo organization (replace USER_ID with actual user ID)
INSERT INTO public.team_members (user_id, organization_id, role)
VALUES ('YOUR_USER_ID', '00000000-0000-0000-0000-000000000001', 'owner');

-- Create sample social accounts (replace USER_ID)
INSERT INTO public.social_accounts (
  organization_id, platform, platform_user_id, platform_username, platform_name, is_active
)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'twitter', 'demo_twitter_123', 'demo_twitter', 'Demo Twitter', true),
  ('00000000-0000-0000-0000-000000000001', 'linkedin', 'demo_linkedin_456', 'demo_linkedin', 'Demo LinkedIn', true);

-- Create sample social posts (replace USER_ID)
INSERT INTO public.social_posts (
  organization_id, created_by, status, content, platforms, hashtags
)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'YOUR_USER_ID',
    'published',
    'Excited to announce our new AI-powered marketing features! 🚀 #AI #Marketing #Innovation',
    ARRAY['twitter', 'linkedin'],
    ARRAY['#AI', '#Marketing', '#Innovation']
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'YOUR_USER_ID',
    'scheduled',
    'Our team has been working hard on something amazing. Stay tuned! 👀',
    ARRAY['twitter'],
    ARRAY['#ComingSoon']
  );

-- Create sample contacts
INSERT INTO public.contacts (
  organization_id, email, first_name, last_name, company, status, lead_score, source, tags
)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'john.doe@example.com',
    'John',
    'Doe',
    'Acme Corp',
    'qualified',
    75,
    'Website',
    ARRAY['enterprise', 'decision-maker']
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'jane.smith@example.com',
    'Jane',
    'Smith',
    'Tech Startup',
    'lead',
    45,
    'LinkedIn',
    ARRAY['startup', 'marketing']
  );
*/

-- Print success message
DO $$
BEGIN
  RAISE NOTICE 'Seed data loaded successfully!';
  RAISE NOTICE 'A demo organization has been created.';
  RAISE NOTICE 'Sign up a user and link them to the organization to test.';
END $$;
