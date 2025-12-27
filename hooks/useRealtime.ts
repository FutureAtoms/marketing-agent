import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useOrgStore } from '../stores/orgStore';
import type { RealtimeChannel } from '@supabase/supabase-js';

type TableName =
  | 'contacts'
  | 'deals'
  | 'social_posts'
  | 'email_campaigns'
  | 'analytics_events';

interface UseRealtimeOptions {
  tables: TableName[];
  onInsert?: (table: TableName, payload: unknown) => void;
  onUpdate?: (table: TableName, payload: unknown) => void;
  onDelete?: (table: TableName, payload: unknown) => void;
}

export function useRealtime({
  tables,
  onInsert,
  onUpdate,
  onDelete,
}: UseRealtimeOptions) {
  const { currentOrg } = useOrgStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!currentOrg) return;

    const channels: RealtimeChannel[] = [];

    tables.forEach((table) => {
      const channel = supabase
        .channel(`${table}-changes-${currentOrg.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table,
            filter: `organization_id=eq.${currentOrg.id}`,
          },
          (payload) => {
            onInsert?.(table, payload.new);
            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: [table] });
            queryClient.invalidateQueries({ queryKey: ['analytics'] });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table,
            filter: `organization_id=eq.${currentOrg.id}`,
          },
          (payload) => {
            onUpdate?.(table, payload.new);
            queryClient.invalidateQueries({ queryKey: [table] });
            queryClient.invalidateQueries({ queryKey: ['analytics'] });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table,
            filter: `organization_id=eq.${currentOrg.id}`,
          },
          (payload) => {
            onDelete?.(table, payload.old);
            queryClient.invalidateQueries({ queryKey: [table] });
            queryClient.invalidateQueries({ queryKey: ['analytics'] });
          }
        )
        .subscribe();

      channels.push(channel);
    });

    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [currentOrg, tables, onInsert, onUpdate, onDelete, queryClient]);
}

// Hook for real-time dashboard updates
export function useDashboardRealtime() {
  const queryClient = useQueryClient();

  const handleNewActivity = useCallback(
    (table: TableName, payload: unknown) => {
      // Show toast or update activity feed
      console.log('New activity:', table, payload);
    },
    []
  );

  useRealtime({
    tables: ['contacts', 'deals', 'social_posts', 'email_campaigns', 'analytics_events'],
    onInsert: handleNewActivity,
    onUpdate: handleNewActivity,
  });
}

// Hook for real-time analytics events
export function useAnalyticsRealtime() {
  const { currentOrg } = useOrgStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!currentOrg) return;

    const channel = supabase
      .channel(`analytics-live-${currentOrg.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_events',
          filter: `organization_id=eq.${currentOrg.id}`,
        },
        (payload) => {
          // Optimistic update for live counters
          queryClient.setQueryData(
            ['analytics', 'overview', currentOrg.id],
            (old: unknown) => {
              if (!old || typeof old !== 'object') return old;
              const data = old as Record<string, unknown>;
              const current = data.current as Record<string, number> | undefined;
              if (!current) return old;

              const event = payload.new as { event_type: string };
              if (event.event_type === 'page_view') {
                return {
                  ...data,
                  current: {
                    ...current,
                    pageViews: (current.pageViews || 0) + 1,
                  },
                };
              }
              return old;
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrg, queryClient]);
}
