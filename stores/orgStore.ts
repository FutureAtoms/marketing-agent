import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Organization, TeamMember } from '../types/database';

interface OrgState {
  currentOrg: Organization | null;
  organizations: Organization[];
  members: TeamMember[];
  userRole: TeamMember['role'] | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchOrganizations: (userId: string) => Promise<void>;
  setCurrentOrg: (org: Organization | null) => void;
  createOrganization: (name: string, slug: string) => Promise<{ success: boolean; error?: string }>;
  updateOrganization: (orgId: string, updates: Partial<Organization>) => Promise<{ success: boolean; error?: string }>;
  fetchMembers: (orgId: string) => Promise<void>;
  inviteMember: (email: string, role: TeamMember['role']) => Promise<{ success: boolean; error?: string }>;
  updateMemberRole: (memberId: string, role: TeamMember['role']) => Promise<{ success: boolean; error?: string }>;
  removeMember: (memberId: string) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

export const useOrgStore = create<OrgState>((set, get) => ({
  currentOrg: null,
  organizations: [],
  members: [],
  userRole: null,
  isLoading: false,
  error: null,

  fetchOrganizations: async (userId: string) => {
    set({ isLoading: true, error: null });

    try {
      // Get organizations where user is a member
      const { data: memberships, error: memberError } = await supabase
        .from('team_members')
        .select('organization_id, role')
        .eq('user_id', userId) as { data: { organization_id: string; role: TeamMember['role'] }[] | null; error: Error | null };

      if (memberError) {
        set({ error: memberError.message, isLoading: false });
        return;
      }

      if (!memberships || memberships.length === 0) {
        set({ organizations: [], currentOrg: null, isLoading: false });
        return;
      }

      const orgIds = memberships.map((m) => m.organization_id);

      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .in('id', orgIds) as { data: Organization[] | null; error: Error | null };

      if (orgsError) {
        set({ error: orgsError.message, isLoading: false });
        return;
      }

      const organizations = orgs || [];
      const currentOrg = get().currentOrg || organizations[0] || null;
      const membership = memberships.find((m) => m.organization_id === currentOrg?.id);

      set({
        organizations,
        currentOrg,
        userRole: membership?.role || null,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch organizations';
      set({ error: message, isLoading: false });
    }
  },

  setCurrentOrg: (org: Organization | null) => {
    set({ currentOrg: org });
    if (org) {
      get().fetchMembers(org.id);
    }
  },

  createOrganization: async (name: string, slug: string) => {
    set({ isLoading: true, error: null });

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        set({ error: 'Not authenticated', isLoading: false });
        return { success: false, error: 'Not authenticated' };
      }

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({ name, slug } as never)
        .select()
        .single() as { data: Organization | null; error: Error | null };

      if (orgError || !org) {
        const errMessage = orgError?.message || 'Failed to create organization';
        set({ error: errMessage, isLoading: false });
        return { success: false, error: errMessage };
      }

      // Add user as owner
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          user_id: user.id,
          organization_id: org.id,
          role: 'owner',
        } as never);

      if (memberError) {
        // Rollback org creation
        await supabase.from('organizations').delete().eq('id', org.id);
        set({ error: memberError.message, isLoading: false });
        return { success: false, error: memberError.message };
      }

      set((state) => ({
        organizations: [...state.organizations, org],
        currentOrg: org,
        userRole: 'owner',
        isLoading: false,
      }));

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create organization';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  updateOrganization: async (orgId: string, updates: Partial<Organization>) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('organizations')
        .update(updates as never)
        .eq('id', orgId)
        .select()
        .single() as { data: Organization | null; error: Error | null };

      if (error) {
        set({ error: error.message, isLoading: false });
        return { success: false, error: error.message };
      }

      if (data) {
        set((state) => ({
          organizations: state.organizations.map((org) =>
            org.id === orgId ? data : org
          ),
          currentOrg: state.currentOrg?.id === orgId ? data : state.currentOrg,
          isLoading: false,
        }));
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update organization';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  fetchMembers: async (orgId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('organization_id', orgId) as { data: TeamMember[] | null; error: Error | null };

      if (error) {
        set({ error: error.message });
        return;
      }

      set({ members: data || [] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch members';
      set({ error: message });
    }
  },

  inviteMember: async (_email: string, _role: TeamMember['role']) => {
    const currentOrg = get().currentOrg;

    if (!currentOrg) {
      return { success: false, error: 'No organization selected' };
    }

    set({ isLoading: true, error: null });

    try {
      // In a real app, you'd send an invitation email and create a pending invite
      // For now, we'll just show the concept
      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to invite member';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  updateMemberRole: async (memberId: string, role: TeamMember['role']) => {
    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role } as never)
        .eq('id', memberId);

      if (error) {
        set({ error: error.message, isLoading: false });
        return { success: false, error: error.message };
      }

      set((state) => ({
        members: state.members.map((m) =>
          m.id === memberId ? { ...m, role } : m
        ),
        isLoading: false,
      }));

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update member role';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  removeMember: async (memberId: string) => {
    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) {
        set({ error: error.message, isLoading: false });
        return { success: false, error: error.message };
      }

      set((state) => ({
        members: state.members.filter((m) => m.id !== memberId),
        isLoading: false,
      }));

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove member';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  clearError: () => set({ error: null }),
}));
