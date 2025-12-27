/**
 * CRM React Query Hooks
 * TanStack Query integration for CRM contact management
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  contactManager,
  Contact,
  Activity,
  ContactFilters,
  Pagination,
  CreateContactInput,
  UpdateContactInput,
  CreateActivityInput,
  PaginatedResult,
} from '../lib/crm/contacts';

// =============================================================================
// Query Keys
// =============================================================================

export const crmQueryKeys = {
  all: ['crm'] as const,
  contacts: () => [...crmQueryKeys.all, 'contacts'] as const,
  contactsList: (filters?: ContactFilters) => [...crmQueryKeys.contacts(), 'list', filters] as const,
  contactDetail: (id: string) => [...crmQueryKeys.contacts(), 'detail', id] as const,
  contactActivities: (id: string) => [...crmQueryKeys.contacts(), 'activities', id] as const,
  contactSearch: (query: string) => [...crmQueryKeys.contacts(), 'search', query] as const,
  contactsByTag: (tag: string) => [...crmQueryKeys.contacts(), 'byTag', tag] as const,
  tags: () => [...crmQueryKeys.all, 'tags'] as const,
  stats: () => [...crmQueryKeys.all, 'stats'] as const,
};

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook to fetch paginated contacts with optional filters
 */
export function useContacts(filters?: ContactFilters, pagination?: Pagination) {
  return useQuery({
    queryKey: crmQueryKeys.contactsList(filters),
    queryFn: () => contactManager.getContacts(filters, pagination),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to fetch paginated contacts with infinite scrolling support
 */
export function useInfiniteContacts(filters?: ContactFilters, pageSize = 20) {
  return useInfiniteQuery({
    queryKey: [...crmQueryKeys.contactsList(filters), 'infinite'],
    queryFn: ({ pageParam = 1 }) =>
      contactManager.getContacts(filters, { page: pageParam, limit: pageSize }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedResult<Contact>) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook to fetch a single contact by ID with its activities
 */
export function useContact(id: string | null | undefined) {
  const queryClient = useQueryClient();

  const contactQuery = useQuery({
    queryKey: crmQueryKeys.contactDetail(id ?? ''),
    queryFn: () => (id ? contactManager.getContact(id) : null),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });

  const activitiesQuery = useQuery({
    queryKey: crmQueryKeys.contactActivities(id ?? ''),
    queryFn: () => (id ? contactManager.getActivities(id) : []),
    enabled: !!id,
    staleTime: 1000 * 60,
  });

  return {
    contact: contactQuery.data,
    activities: activitiesQuery.data ?? [],
    isLoading: contactQuery.isLoading,
    isLoadingActivities: activitiesQuery.isLoading,
    error: contactQuery.error,
    activitiesError: activitiesQuery.error,
    refetch: () => {
      contactQuery.refetch();
      activitiesQuery.refetch();
    },
  };
}

/**
 * Hook for creating a new contact
 */
export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contact: CreateContactInput) => contactManager.createContact(contact),
    onSuccess: (newContact) => {
      // Invalidate contacts list queries
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.contacts() });

      // Optionally prefetch the new contact detail
      queryClient.setQueryData(crmQueryKeys.contactDetail(newContact.id), newContact);

      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.stats() });
    },
  });
}

/**
 * Hook for updating a contact
 */
export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateContactInput }) =>
      contactManager.updateContact(id, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: crmQueryKeys.contactDetail(id) });

      // Snapshot the previous value
      const previousContact = queryClient.getQueryData<Contact>(
        crmQueryKeys.contactDetail(id)
      );

      // Optimistically update
      if (previousContact) {
        queryClient.setQueryData(crmQueryKeys.contactDetail(id), {
          ...previousContact,
          ...updates,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousContact };
    },
    onError: (_err, { id }, context) => {
      // Rollback on error
      if (context?.previousContact) {
        queryClient.setQueryData(crmQueryKeys.contactDetail(id), context.previousContact);
      }
    },
    onSettled: (_data, _error, { id }) => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.contactDetail(id) });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.contacts() });
    },
  });
}

/**
 * Hook for deleting a contact
 */
export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contactManager.deleteContact(id),
    onSuccess: (_data, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: crmQueryKeys.contactDetail(id) });
      queryClient.removeQueries({ queryKey: crmQueryKeys.contactActivities(id) });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.contacts() });

      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.stats() });
    },
  });
}

/**
 * Hook for searching contacts
 */
export function useContactSearch(query: string) {
  return useQuery({
    queryKey: crmQueryKeys.contactSearch(query),
    queryFn: () => contactManager.searchContacts(query),
    enabled: query.length >= 2, // Only search with 2+ characters
    staleTime: 1000 * 30, // 30 seconds
    placeholderData: [],
  });
}

/**
 * Hook for adding an activity to a contact
 */
export function useAddActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contactId,
      activity,
    }: {
      contactId: string;
      activity: CreateActivityInput;
    }) => contactManager.addActivity(contactId, activity),
    onSuccess: (newActivity, { contactId }) => {
      // Invalidate activities for this contact
      queryClient.invalidateQueries({
        queryKey: crmQueryKeys.contactActivities(contactId),
      });

      // Update contact's last_contacted_at if it was a communication activity
      if (['email', 'call', 'meeting'].includes(newActivity.type)) {
        queryClient.invalidateQueries({
          queryKey: crmQueryKeys.contactDetail(contactId),
        });
      }
    },
  });
}

/**
 * Hook for importing contacts from CSV
 */
export function useImportContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (csv: string) => contactManager.importContacts(csv),
    onSuccess: () => {
      // Invalidate all contact queries
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.contacts() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.stats() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.tags() });
    },
  });
}

/**
 * Hook for exporting contacts to CSV
 */
export function useExportContacts() {
  return useMutation({
    mutationFn: (filters?: ContactFilters) => contactManager.exportContacts(filters),
  });
}

/**
 * Hook for getting contacts by tag
 */
export function useContactsByTag(tag: string) {
  return useQuery({
    queryKey: crmQueryKeys.contactsByTag(tag),
    queryFn: () => contactManager.getContactsByTag(tag),
    enabled: !!tag,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook for merging duplicate contacts
 */
export function useMergeContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => contactManager.mergeContacts(ids),
    onSuccess: (mergedContact, mergedIds) => {
      // Remove merged contacts from cache
      mergedIds.slice(1).forEach((id) => {
        queryClient.removeQueries({ queryKey: crmQueryKeys.contactDetail(id) });
        queryClient.removeQueries({ queryKey: crmQueryKeys.contactActivities(id) });
      });

      // Update primary contact in cache
      queryClient.setQueryData(
        crmQueryKeys.contactDetail(mergedContact.id),
        mergedContact
      );

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.contacts() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.stats() });
    },
  });
}

/**
 * Hook for adding/removing tags
 */
export function useContactTags() {
  const queryClient = useQueryClient();

  const addTag = useMutation({
    mutationFn: ({ contactId, tag }: { contactId: string; tag: string }) =>
      contactManager.addTag(contactId, tag),
    onSuccess: (updatedContact) => {
      queryClient.setQueryData(
        crmQueryKeys.contactDetail(updatedContact.id),
        updatedContact
      );
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.contacts() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.tags() });
    },
  });

  const removeTag = useMutation({
    mutationFn: ({ contactId, tag }: { contactId: string; tag: string }) =>
      contactManager.removeTag(contactId, tag),
    onSuccess: (updatedContact) => {
      queryClient.setQueryData(
        crmQueryKeys.contactDetail(updatedContact.id),
        updatedContact
      );
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.contacts() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.tags() });
    },
  });

  return { addTag, removeTag };
}

/**
 * Hook for updating lead score
 */
export function useUpdateLeadScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contactId, score }: { contactId: string; score: number }) =>
      contactManager.updateLeadScore(contactId, score),
    onSuccess: (updatedContact) => {
      queryClient.setQueryData(
        crmQueryKeys.contactDetail(updatedContact.id),
        updatedContact
      );
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.contacts() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.stats() });
    },
  });
}

/**
 * Hook for fetching all unique tags
 */
export function useTags() {
  return useQuery({
    queryKey: crmQueryKeys.tags(),
    queryFn: () => contactManager.getAllTags(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for fetching contact statistics
 */
export function useContactStats() {
  return useQuery({
    queryKey: crmQueryKeys.stats(),
    queryFn: () => contactManager.getStats(),
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Hook for getting activities for a specific contact
 */
export function useContactActivities(contactId: string | null | undefined) {
  return useQuery({
    queryKey: crmQueryKeys.contactActivities(contactId ?? ''),
    queryFn: () => (contactId ? contactManager.getActivities(contactId) : []),
    enabled: !!contactId,
    staleTime: 1000 * 60,
  });
}

// =============================================================================
// Utility Hooks
// =============================================================================

/**
 * Hook for prefetching a contact (useful for hover states)
 */
export function usePrefetchContact() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: crmQueryKeys.contactDetail(id),
      queryFn: () => contactManager.getContact(id),
      staleTime: 1000 * 60 * 2,
    });
  };
}

/**
 * Hook for getting cached contact (without triggering a fetch)
 */
export function useCachedContact(id: string): Contact | undefined {
  const queryClient = useQueryClient();
  return queryClient.getQueryData<Contact>(crmQueryKeys.contactDetail(id));
}

/**
 * Type-safe hook for CRM state management combining multiple queries
 */
export function useCRMDashboard(filters?: ContactFilters) {
  const contactsQuery = useContacts(filters, { page: 1, limit: 10 });
  const statsQuery = useContactStats();
  const tagsQuery = useTags();

  return {
    // Data
    contacts: contactsQuery.data?.data ?? [],
    stats: statsQuery.data,
    tags: tagsQuery.data ?? [],

    // Pagination info
    totalContacts: contactsQuery.data?.total ?? 0,
    totalPages: contactsQuery.data?.totalPages ?? 0,
    hasMore: contactsQuery.data?.hasMore ?? false,

    // Loading states
    isLoading: contactsQuery.isLoading || statsQuery.isLoading,
    isLoadingContacts: contactsQuery.isLoading,
    isLoadingStats: statsQuery.isLoading,
    isLoadingTags: tagsQuery.isLoading,

    // Error states
    error: contactsQuery.error || statsQuery.error || tagsQuery.error,

    // Refetch functions
    refetch: () => {
      contactsQuery.refetch();
      statsQuery.refetch();
      tagsQuery.refetch();
    },
    refetchContacts: contactsQuery.refetch,
    refetchStats: statsQuery.refetch,
    refetchTags: tagsQuery.refetch,
  };
}
