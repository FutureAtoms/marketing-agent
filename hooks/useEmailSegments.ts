// Email Segments Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { segmentManager, type Segment, type SegmentRule, SEGMENT_TEMPLATES } from '../lib/email/segments';

// Query keys
const QUERY_KEYS = {
  segments: ['email-segments'] as const,
  segment: (id: string) => ['email-segment', id] as const,
  segmentCount: (id: string) => ['email-segment-count', id] as const,
  segmentPreview: (rules: SegmentRule[]) => ['email-segment-preview', JSON.stringify(rules)] as const,
};

// Hook to get all segments
export function useEmailSegments() {
  return useQuery({
    queryKey: QUERY_KEYS.segments,
    queryFn: () => segmentManager.getSegments(),
  });
}

// Hook to get single segment
export function useEmailSegment(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.segment(id),
    queryFn: () => segmentManager.getSegment(id),
    enabled: !!id,
  });
}

// Hook to get segment subscriber count
export function useSegmentCount(segment: Segment | null) {
  return useQuery({
    queryKey: QUERY_KEYS.segmentCount(segment?.id || ''),
    queryFn: () => segment ? segmentManager.getSegmentCount(segment) : 0,
    enabled: !!segment,
  });
}

// Hook to preview segment subscribers
export function useSegmentPreview(rules: SegmentRule[], enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.segmentPreview(rules),
    queryFn: () => segmentManager.previewSegment(rules),
    enabled: enabled && rules.length > 0,
  });
}

// Hook to create segment
export function useCreateSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (segment: Omit<Segment, 'id' | 'created_at' | 'updated_at'>) =>
      segmentManager.createSegment(segment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.segments });
    },
  });
}

// Hook to update segment
export function useUpdateSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Segment> }) =>
      segmentManager.updateSegment(id, updates),
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.segments });
        queryClient.setQueryData(QUERY_KEYS.segment(data.id), data);
      }
    },
  });
}

// Hook to delete segment
export function useDeleteSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => segmentManager.deleteSegment(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.segments });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.segment(id) });
    },
  });
}

// Hook to create segment from template
export function useCreateSegmentFromTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateIndex: number) => segmentManager.createFromTemplate(templateIndex),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.segments });
    },
  });
}

// Hook to export segment as CSV
export function useExportSegment() {
  return useMutation({
    mutationFn: (segmentId: string) => segmentManager.exportSegment(segmentId),
  });
}

// Hook to get segment templates
export function useSegmentTemplates() {
  return {
    templates: SEGMENT_TEMPLATES,
    count: SEGMENT_TEMPLATES.length,
  };
}

// Unified hook for segment management
export function useSegmentManagement() {
  const segments = useEmailSegments();
  const createSegment = useCreateSegment();
  const updateSegment = useUpdateSegment();
  const deleteSegment = useDeleteSegment();
  const createFromTemplate = useCreateSegmentFromTemplate();
  const exportSegment = useExportSegment();
  const templates = useSegmentTemplates();

  return {
    // Data
    segments: segments.data,
    isLoading: segments.isLoading,
    error: segments.error,
    templates,

    // Mutations
    createSegment: createSegment.mutate,
    createSegmentAsync: createSegment.mutateAsync,
    updateSegment: updateSegment.mutate,
    deleteSegment: deleteSegment.mutate,
    createFromTemplate: createFromTemplate.mutate,
    exportSegment: exportSegment.mutateAsync,

    // Mutation states
    isCreating: createSegment.isPending,
    isUpdating: updateSegment.isPending,
    isDeleting: deleteSegment.isPending,
    isExporting: exportSegment.isPending,

    // Refetch
    refetch: segments.refetch,
  };
}

export default useSegmentManagement;
