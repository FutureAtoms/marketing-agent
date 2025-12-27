-- Row Level Security Policies
-- Ensures data isolation between organizations

-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Get organizations the current user belongs to
CREATE OR REPLACE FUNCTION get_user_organizations()
RETURNS SETOF UUID AS $$
    SELECT organization_id
    FROM public.team_members
    WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user has role in organization
CREATE OR REPLACE FUNCTION has_org_role(org_id UUID, required_roles TEXT[])
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.team_members
        WHERE user_id = auth.uid()
        AND organization_id = org_id
        AND role = ANY(required_roles)
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user can edit in organization (owner, admin, or editor)
CREATE OR REPLACE FUNCTION can_edit_org(org_id UUID)
RETURNS BOOLEAN AS $$
    SELECT has_org_role(org_id, ARRAY['owner', 'admin', 'editor']);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user can admin organization (owner or admin)
CREATE OR REPLACE FUNCTION can_admin_org(org_id UUID)
RETURNS BOOLEAN AS $$
    SELECT has_org_role(org_id, ARRAY['owner', 'admin']);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================================================
-- USERS POLICIES
-- =============================================================================

-- Users can view their own profile
CREATE POLICY users_select_own ON public.users
    FOR SELECT USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY users_update_own ON public.users
    FOR UPDATE USING (id = auth.uid());

-- =============================================================================
-- ORGANIZATIONS POLICIES
-- =============================================================================

-- Users can view organizations they belong to
CREATE POLICY orgs_select ON public.organizations
    FOR SELECT USING (id IN (SELECT get_user_organizations()));

-- Admins can update their organizations
CREATE POLICY orgs_update ON public.organizations
    FOR UPDATE USING (can_admin_org(id));

-- Anyone authenticated can create an organization
CREATE POLICY orgs_insert ON public.organizations
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================================
-- TEAM MEMBERS POLICIES
-- =============================================================================

-- Users can view team members in their organizations
CREATE POLICY team_members_select ON public.team_members
    FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));

-- Admins can manage team members
CREATE POLICY team_members_insert ON public.team_members
    FOR INSERT WITH CHECK (can_admin_org(organization_id));

CREATE POLICY team_members_update ON public.team_members
    FOR UPDATE USING (can_admin_org(organization_id));

CREATE POLICY team_members_delete ON public.team_members
    FOR DELETE USING (can_admin_org(organization_id));

-- =============================================================================
-- SOCIAL ACCOUNTS POLICIES
-- =============================================================================

CREATE POLICY social_accounts_select ON public.social_accounts
    FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY social_accounts_insert ON public.social_accounts
    FOR INSERT WITH CHECK (can_admin_org(organization_id));

CREATE POLICY social_accounts_update ON public.social_accounts
    FOR UPDATE USING (can_admin_org(organization_id));

CREATE POLICY social_accounts_delete ON public.social_accounts
    FOR DELETE USING (can_admin_org(organization_id));

-- =============================================================================
-- SOCIAL POSTS POLICIES
-- =============================================================================

CREATE POLICY social_posts_select ON public.social_posts
    FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY social_posts_insert ON public.social_posts
    FOR INSERT WITH CHECK (can_edit_org(organization_id));

CREATE POLICY social_posts_update ON public.social_posts
    FOR UPDATE USING (can_edit_org(organization_id));

CREATE POLICY social_posts_delete ON public.social_posts
    FOR DELETE USING (can_edit_org(organization_id));

-- =============================================================================
-- CONTACTS POLICIES
-- =============================================================================

CREATE POLICY contacts_select ON public.contacts
    FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY contacts_insert ON public.contacts
    FOR INSERT WITH CHECK (can_edit_org(organization_id));

CREATE POLICY contacts_update ON public.contacts
    FOR UPDATE USING (can_edit_org(organization_id));

CREATE POLICY contacts_delete ON public.contacts
    FOR DELETE USING (can_edit_org(organization_id));

-- =============================================================================
-- DEALS POLICIES
-- =============================================================================

CREATE POLICY deals_select ON public.deals
    FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY deals_insert ON public.deals
    FOR INSERT WITH CHECK (can_edit_org(organization_id));

CREATE POLICY deals_update ON public.deals
    FOR UPDATE USING (can_edit_org(organization_id));

CREATE POLICY deals_delete ON public.deals
    FOR DELETE USING (can_edit_org(organization_id));

-- =============================================================================
-- ACTIVITIES POLICIES
-- =============================================================================

CREATE POLICY activities_select ON public.activities
    FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY activities_insert ON public.activities
    FOR INSERT WITH CHECK (can_edit_org(organization_id));

-- =============================================================================
-- EMAIL TEMPLATES POLICIES
-- =============================================================================

CREATE POLICY email_templates_select ON public.email_templates
    FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY email_templates_insert ON public.email_templates
    FOR INSERT WITH CHECK (can_edit_org(organization_id));

CREATE POLICY email_templates_update ON public.email_templates
    FOR UPDATE USING (can_edit_org(organization_id));

CREATE POLICY email_templates_delete ON public.email_templates
    FOR DELETE USING (can_edit_org(organization_id));

-- =============================================================================
-- EMAIL CAMPAIGNS POLICIES
-- =============================================================================

CREATE POLICY email_campaigns_select ON public.email_campaigns
    FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY email_campaigns_insert ON public.email_campaigns
    FOR INSERT WITH CHECK (can_edit_org(organization_id));

CREATE POLICY email_campaigns_update ON public.email_campaigns
    FOR UPDATE USING (can_edit_org(organization_id));

CREATE POLICY email_campaigns_delete ON public.email_campaigns
    FOR DELETE USING (can_admin_org(organization_id));

-- =============================================================================
-- EMAIL SUBSCRIBERS POLICIES
-- =============================================================================

CREATE POLICY email_subscribers_select ON public.email_subscribers
    FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY email_subscribers_insert ON public.email_subscribers
    FOR INSERT WITH CHECK (can_edit_org(organization_id));

CREATE POLICY email_subscribers_update ON public.email_subscribers
    FOR UPDATE USING (can_edit_org(organization_id));

-- =============================================================================
-- CONTENT PIECES POLICIES
-- =============================================================================

CREATE POLICY content_pieces_select ON public.content_pieces
    FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY content_pieces_insert ON public.content_pieces
    FOR INSERT WITH CHECK (can_edit_org(organization_id));

CREATE POLICY content_pieces_update ON public.content_pieces
    FOR UPDATE USING (can_edit_org(organization_id));

CREATE POLICY content_pieces_delete ON public.content_pieces
    FOR DELETE USING (can_edit_org(organization_id));

-- =============================================================================
-- MEDIA LIBRARY POLICIES
-- =============================================================================

CREATE POLICY media_library_select ON public.media_library
    FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY media_library_insert ON public.media_library
    FOR INSERT WITH CHECK (can_edit_org(organization_id));

CREATE POLICY media_library_delete ON public.media_library
    FOR DELETE USING (can_edit_org(organization_id));

-- =============================================================================
-- LANDING PAGES POLICIES
-- =============================================================================

CREATE POLICY landing_pages_select ON public.landing_pages
    FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY landing_pages_insert ON public.landing_pages
    FOR INSERT WITH CHECK (can_edit_org(organization_id));

CREATE POLICY landing_pages_update ON public.landing_pages
    FOR UPDATE USING (can_edit_org(organization_id));

CREATE POLICY landing_pages_delete ON public.landing_pages
    FOR DELETE USING (can_admin_org(organization_id));

-- =============================================================================
-- FORMS POLICIES
-- =============================================================================

CREATE POLICY forms_select ON public.forms
    FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY forms_insert ON public.forms
    FOR INSERT WITH CHECK (can_edit_org(organization_id));

CREATE POLICY forms_update ON public.forms
    FOR UPDATE USING (can_edit_org(organization_id));

CREATE POLICY forms_delete ON public.forms
    FOR DELETE USING (can_edit_org(organization_id));

-- =============================================================================
-- FORM SUBMISSIONS POLICIES
-- =============================================================================

-- Anyone can submit a form (for public landing pages)
CREATE POLICY form_submissions_insert ON public.form_submissions
    FOR INSERT WITH CHECK (true);

-- Only org members can view submissions
CREATE POLICY form_submissions_select ON public.form_submissions
    FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));

-- =============================================================================
-- ANALYTICS EVENTS POLICIES
-- =============================================================================

-- Anyone can insert events (for tracking)
CREATE POLICY analytics_events_insert ON public.analytics_events
    FOR INSERT WITH CHECK (true);

-- Only org members can view analytics
CREATE POLICY analytics_events_select ON public.analytics_events
    FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));

-- =============================================================================
-- STORAGE POLICIES (for Supabase Storage)
-- =============================================================================

-- Create storage bucket for media if it doesn't exist
-- Note: Run this in Supabase dashboard SQL editor
/*
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- Allow public read access
CREATE POLICY "Public can view media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');

-- Allow owners to delete their media
CREATE POLICY "Users can delete their own media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);
*/
