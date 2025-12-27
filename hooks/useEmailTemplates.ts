/**
 * Email Templates React Hooks
 * TanStack Query hooks for email template management
 *
 * These hooks provide a complete interface for:
 * - Listing and filtering templates
 * - CRUD operations with optimistic updates
 * - Template rendering with variable substitution
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useOrgStore } from '../stores/orgStore';
import {
  EmailTemplate,
  EmailTemplateManager,
  CreateTemplateInput,
  UpdateTemplateInput,
  TemplateCategory,
  RenderResult,
  DEFAULT_TEMPLATES,
  validateTemplate,
} from '../lib/email/templates';

// =============================================================================
// Query Keys
// =============================================================================

const QUERY_KEYS = {
  templates: (orgId: string | undefined, category?: TemplateCategory) =>
    ['email-templates', orgId, category] as const,
  template: (orgId: string | undefined, id: string) =>
    ['email-template', orgId, id] as const,
  categories: (orgId: string | undefined) =>
    ['email-template-categories', orgId] as const,
  search: (orgId: string | undefined, query: string) =>
    ['email-templates-search', orgId, query] as const,
};

// =============================================================================
// List Templates Hook
// =============================================================================

/**
 * Hook to fetch all email templates, optionally filtered by category
 *
 * @param category - Optional category filter
 * @returns Query result with templates array
 *
 * @example
 * ```tsx
 * const { data: templates, isLoading } = useEmailTemplates();
 * const { data: newsletters } = useEmailTemplates('newsletter');
 * ```
 */
export function useEmailTemplates(category?: TemplateCategory) {
  const { currentOrg } = useOrgStore();

  return useQuery({
    queryKey: QUERY_KEYS.templates(currentOrg?.id, category),
    queryFn: async () => {
      if (!currentOrg?.id) return [];

      const manager = new EmailTemplateManager(currentOrg.id);
      return manager.getTemplates(category);
    },
    enabled: !!currentOrg?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// =============================================================================
// Single Template Hook
// =============================================================================

/**
 * Hook to fetch a single email template by ID
 *
 * @param id - Template ID
 * @returns Query result with template or null
 *
 * @example
 * ```tsx
 * const { data: template, isLoading } = useEmailTemplate('template-123');
 * ```
 */
export function useEmailTemplate(id: string | null | undefined) {
  const { currentOrg } = useOrgStore();

  return useQuery({
    queryKey: QUERY_KEYS.template(currentOrg?.id, id || ''),
    queryFn: async () => {
      if (!currentOrg?.id || !id) return null;

      const manager = new EmailTemplateManager(currentOrg.id);
      return manager.getTemplate(id);
    },
    enabled: !!currentOrg?.id && !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// =============================================================================
// Create Template Hook
// =============================================================================

/**
 * Hook to create a new email template
 *
 * @returns Mutation for creating templates
 *
 * @example
 * ```tsx
 * const createTemplate = useCreateTemplate();
 *
 * await createTemplate.mutateAsync({
 *   name: 'My Template',
 *   subject: 'Hello {{name}}',
 *   html_content: '<p>Hello {{name}}</p>',
 *   text_content: 'Hello {{name}}',
 *   category: 'custom',
 *   variables: [{ name: 'name', required: true, type: 'text', description: 'Name' }],
 *   is_default: false,
 *   thumbnail_url: null,
 * });
 * ```
 */
export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrgStore();

  return useMutation({
    mutationFn: async (template: CreateTemplateInput) => {
      if (!currentOrg?.id) throw new Error('No organization selected');

      // Validate template
      const validation = validateTemplate(template);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const manager = new EmailTemplateManager(currentOrg.id);
      return manager.createTemplate(template);
    },
    onSuccess: (newTemplate) => {
      // Invalidate templates list
      queryClient.invalidateQueries({
        queryKey: ['email-templates', currentOrg?.id],
      });

      // Add the new template to cache
      queryClient.setQueryData(
        QUERY_KEYS.template(currentOrg?.id, newTemplate.id),
        newTemplate
      );
    },
  });
}

// =============================================================================
// Update Template Hook
// =============================================================================

/**
 * Hook to update an existing email template
 *
 * @returns Mutation for updating templates
 *
 * @example
 * ```tsx
 * const updateTemplate = useUpdateTemplate();
 *
 * await updateTemplate.mutateAsync({
 *   id: 'template-123',
 *   name: 'Updated Name',
 *   subject: 'New Subject',
 * });
 * ```
 */
export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrgStore();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: UpdateTemplateInput & { id: string }) => {
      if (!currentOrg?.id) throw new Error('No organization selected');

      const manager = new EmailTemplateManager(currentOrg.id);
      return manager.updateTemplate(id, updates);
    },
    onMutate: async ({ id, ...updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.template(currentOrg?.id, id),
      });

      // Snapshot previous value
      const previousTemplate = queryClient.getQueryData<EmailTemplate>(
        QUERY_KEYS.template(currentOrg?.id, id)
      );

      // Optimistically update
      if (previousTemplate) {
        queryClient.setQueryData(QUERY_KEYS.template(currentOrg?.id, id), {
          ...previousTemplate,
          ...updates,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousTemplate };
    },
    onError: (_err, { id }, context) => {
      // Rollback on error
      if (context?.previousTemplate) {
        queryClient.setQueryData(
          QUERY_KEYS.template(currentOrg?.id, id),
          context.previousTemplate
        );
      }
    },
    onSettled: (_data, _error, { id }) => {
      // Invalidate to refetch
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.template(currentOrg?.id, id),
      });
      queryClient.invalidateQueries({
        queryKey: ['email-templates', currentOrg?.id],
      });
    },
  });
}

// =============================================================================
// Delete Template Hook
// =============================================================================

/**
 * Hook to delete an email template
 *
 * @returns Mutation for deleting templates
 *
 * @example
 * ```tsx
 * const deleteTemplate = useDeleteTemplate();
 *
 * await deleteTemplate.mutateAsync('template-123');
 * ```
 */
export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrgStore();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!currentOrg?.id) throw new Error('No organization selected');

      const manager = new EmailTemplateManager(currentOrg.id);
      await manager.deleteTemplate(id);
      return id;
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['email-templates', currentOrg?.id],
      });

      // Snapshot previous value
      const previousTemplates = queryClient.getQueryData<EmailTemplate[]>(
        QUERY_KEYS.templates(currentOrg?.id)
      );

      // Optimistically remove
      if (previousTemplates) {
        queryClient.setQueryData(
          QUERY_KEYS.templates(currentOrg?.id),
          previousTemplates.filter((t) => t.id !== id)
        );
      }

      return { previousTemplates };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.previousTemplates) {
        queryClient.setQueryData(
          QUERY_KEYS.templates(currentOrg?.id),
          context.previousTemplates
        );
      }
    },
    onSettled: () => {
      // Invalidate to refetch
      queryClient.invalidateQueries({
        queryKey: ['email-templates', currentOrg?.id],
      });
    },
  });
}

// =============================================================================
// Duplicate Template Hook
// =============================================================================

/**
 * Hook to duplicate an email template
 *
 * @returns Mutation for duplicating templates
 *
 * @example
 * ```tsx
 * const duplicateTemplate = useDuplicateTemplate();
 *
 * const newTemplate = await duplicateTemplate.mutateAsync('template-123');
 * ```
 */
export function useDuplicateTemplate() {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrgStore();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!currentOrg?.id) throw new Error('No organization selected');

      const manager = new EmailTemplateManager(currentOrg.id);
      return manager.duplicateTemplate(id);
    },
    onSuccess: (newTemplate) => {
      // Invalidate templates list
      queryClient.invalidateQueries({
        queryKey: ['email-templates', currentOrg?.id],
      });

      // Add the new template to cache
      queryClient.setQueryData(
        QUERY_KEYS.template(currentOrg?.id, newTemplate.id),
        newTemplate
      );
    },
  });
}

// =============================================================================
// Render Template Hook
// =============================================================================

/**
 * Hook to render a template with variable substitution
 *
 * @returns Mutation for rendering templates
 *
 * @example
 * ```tsx
 * const renderTemplate = useRenderTemplate();
 *
 * const result = await renderTemplate.mutateAsync({
 *   templateId: 'template-123',
 *   variables: {
 *     first_name: 'John',
 *     company_name: 'Acme Inc',
 *   },
 * });
 *
 * console.log(result.html);
 * console.log(result.subject);
 * console.log(result.missingVariables);
 * ```
 */
export function useRenderTemplate() {
  const { currentOrg } = useOrgStore();

  return useMutation({
    mutationFn: async ({
      templateId,
      variables,
    }: {
      templateId: string;
      variables: Record<string, string>;
    }): Promise<RenderResult> => {
      if (!currentOrg?.id) throw new Error('No organization selected');

      const manager = new EmailTemplateManager(currentOrg.id);
      return manager.renderTemplate(templateId, variables);
    },
  });
}

/**
 * Hook to render a template directly from template data (no DB call)
 *
 * @returns Render function
 *
 * @example
 * ```tsx
 * const renderTemplateContent = useRenderTemplateContent();
 *
 * const result = renderTemplateContent(template, {
 *   first_name: 'John',
 * });
 * ```
 */
export function useRenderTemplateContent() {
  const { currentOrg } = useOrgStore();

  return (
    template: EmailTemplate | CreateTemplateInput,
    variables: Record<string, string>
  ): RenderResult => {
    const manager = new EmailTemplateManager(currentOrg?.id || 'preview');
    return manager.renderTemplateContent(template, variables);
  };
}

// =============================================================================
// Template Categories Hook
// =============================================================================

/**
 * Hook to get all template categories in use
 *
 * @returns Query result with categories array
 *
 * @example
 * ```tsx
 * const { data: categories } = useTemplateCategories();
 * ```
 */
export function useTemplateCategories() {
  const { currentOrg } = useOrgStore();

  return useQuery({
    queryKey: QUERY_KEYS.categories(currentOrg?.id),
    queryFn: async () => {
      if (!currentOrg?.id) return [];

      const manager = new EmailTemplateManager(currentOrg.id);
      return manager.getCategories();
    },
    enabled: !!currentOrg?.id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// =============================================================================
// Search Templates Hook
// =============================================================================

/**
 * Hook to search templates by name or subject
 *
 * @param query - Search query string
 * @returns Query result with matching templates
 *
 * @example
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState('');
 * const { data: results } = useSearchTemplates(searchQuery);
 * ```
 */
export function useSearchTemplates(query: string) {
  const { currentOrg } = useOrgStore();

  return useQuery({
    queryKey: QUERY_KEYS.search(currentOrg?.id, query),
    queryFn: async () => {
      if (!currentOrg?.id || !query.trim()) return [];

      const manager = new EmailTemplateManager(currentOrg.id);
      return manager.searchTemplates(query);
    },
    enabled: !!currentOrg?.id && query.trim().length >= 2,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// =============================================================================
// Initialize Default Templates Hook
// =============================================================================

/**
 * Hook to initialize default templates for a new organization
 *
 * @returns Mutation for initializing templates
 *
 * @example
 * ```tsx
 * const initTemplates = useInitializeDefaultTemplates();
 *
 * await initTemplates.mutateAsync();
 * ```
 */
export function useInitializeDefaultTemplates() {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrgStore();

  return useMutation({
    mutationFn: async () => {
      if (!currentOrg?.id) throw new Error('No organization selected');

      const manager = new EmailTemplateManager(currentOrg.id);
      return manager.initializeDefaultTemplates();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['email-templates', currentOrg?.id],
      });
    },
  });
}

// =============================================================================
// Preview Template Hook
// =============================================================================

/**
 * Hook to preview a template with sample data
 *
 * @returns Preview function
 *
 * @example
 * ```tsx
 * const previewTemplate = usePreviewTemplate();
 *
 * const preview = previewTemplate(template);
 * console.log(preview.html);
 * ```
 */
export function usePreviewTemplate() {
  const { currentOrg } = useOrgStore();

  return (template: EmailTemplate | CreateTemplateInput): RenderResult => {
    const manager = new EmailTemplateManager(currentOrg?.id || 'preview');
    return manager.previewWithSampleData(template);
  };
}

// =============================================================================
// Get Default Templates Hook
// =============================================================================

/**
 * Hook to get the list of available default templates
 *
 * @returns Array of default template definitions
 *
 * @example
 * ```tsx
 * const defaultTemplates = useDefaultTemplates();
 *
 * // Create a new template from a default
 * const createTemplate = useCreateTemplate();
 * await createTemplate.mutateAsync(defaultTemplates[0]);
 * ```
 */
export function useDefaultTemplates() {
  return DEFAULT_TEMPLATES;
}

// =============================================================================
// Template Validation Hook
// =============================================================================

/**
 * Hook to validate template content
 *
 * @returns Validation function
 *
 * @example
 * ```tsx
 * const validateTemplateContent = useValidateTemplate();
 *
 * const { isValid, errors } = validateTemplateContent(template);
 * if (!isValid) {
 *   console.log('Errors:', errors);
 * }
 * ```
 */
export function useValidateTemplate() {
  return (template: CreateTemplateInput) => validateTemplate(template);
}

// =============================================================================
// Template Statistics Hook
// =============================================================================

/**
 * Hook to get template usage statistics
 *
 * @param templateId - Template ID
 * @returns Query result with statistics
 *
 * @example
 * ```tsx
 * const { data: stats } = useTemplateStats('template-123');
 * console.log(`Sent: ${stats?.sent}, Opened: ${stats?.opened}`);
 * ```
 */
export function useTemplateStats(templateId: string | null | undefined) {
  const { currentOrg } = useOrgStore();

  return useQuery({
    queryKey: ['email-template-stats', currentOrg?.id, templateId],
    queryFn: async () => {
      if (!currentOrg?.id || !templateId) return null;

      // Query email campaign stats that used this template
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('sent_count, opened_count, clicked_count, bounced_count')
        .eq('organization_id', currentOrg.id)
        .eq('template_id', templateId);

      if (error) throw error;

      // Define campaign type for TypeScript
      type CampaignStats = {
        sent_count: number | null;
        opened_count: number | null;
        clicked_count: number | null;
        bounced_count: number | null;
      };

      // Aggregate stats
      const stats = ((data || []) as CampaignStats[]).reduce(
        (acc, campaign) => ({
          sent: acc.sent + (campaign.sent_count || 0),
          opened: acc.opened + (campaign.opened_count || 0),
          clicked: acc.clicked + (campaign.clicked_count || 0),
          bounced: acc.bounced + (campaign.bounced_count || 0),
          campaignsUsed: acc.campaignsUsed + 1,
        }),
        { sent: 0, opened: 0, clicked: 0, bounced: 0, campaignsUsed: 0 }
      );

      return {
        ...stats,
        openRate: stats.sent > 0 ? (stats.opened / stats.sent) * 100 : 0,
        clickRate: stats.sent > 0 ? (stats.clicked / stats.sent) * 100 : 0,
        bounceRate: stats.sent > 0 ? (stats.bounced / stats.sent) * 100 : 0,
      };
    },
    enabled: !!currentOrg?.id && !!templateId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// =============================================================================
// Bulk Operations Hook
// =============================================================================

/**
 * Hook for bulk template operations
 *
 * @returns Bulk operation mutations
 *
 * @example
 * ```tsx
 * const bulkOps = useBulkTemplateOperations();
 *
 * await bulkOps.deleteMany(['id1', 'id2', 'id3']);
 * await bulkOps.updateCategory(['id1', 'id2'], 'newsletter');
 * ```
 */
export function useBulkTemplateOperations() {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrgStore();

  const deleteMany = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!currentOrg?.id) throw new Error('No organization selected');

      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('organization_id', currentOrg.id)
        .in('id', ids);

      if (error) throw error;
      return ids;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['email-templates', currentOrg?.id],
      });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({
      ids,
      category,
    }: {
      ids: string[];
      category: TemplateCategory;
    }) => {
      if (!currentOrg?.id) throw new Error('No organization selected');

      const { error } = await (supabase
        .from('email_templates') as any)
        .update({ category })
        .eq('organization_id', currentOrg.id)
        .in('id', ids);

      if (error) throw error;
      return { ids, category };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['email-templates', currentOrg?.id],
      });
    },
  });

  return {
    deleteMany,
    updateCategory,
  };
}

// =============================================================================
// Export Types
// =============================================================================

export type {
  EmailTemplate,
  CreateTemplateInput,
  UpdateTemplateInput,
  TemplateCategory,
  RenderResult,
};
