import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { useOrgStore } from '../stores/orgStore';
import {
  createDealManager,
  Deal,
  DealFilters,
  Pagination,
  PaginatedResult,
  DealsByStage,
  PipelineStats,
  PipelineStage,
  ForecastData,
  ForecastPeriod,
  CreateDealInput,
  UpdateDealInput,
  DEFAULT_PIPELINE_STAGES,
} from '../lib/crm/deals';

// ============================================================================
// Query Keys
// ============================================================================

const DEALS_QUERY_KEYS = {
  all: ['deals'] as const,
  lists: () => [...DEALS_QUERY_KEYS.all, 'list'] as const,
  list: (orgId: string, filters?: DealFilters, pagination?: Pagination) =>
    [...DEALS_QUERY_KEYS.lists(), orgId, filters, pagination] as const,
  details: () => [...DEALS_QUERY_KEYS.all, 'detail'] as const,
  detail: (orgId: string, id: string) =>
    [...DEALS_QUERY_KEYS.details(), orgId, id] as const,
  byStage: (orgId: string) =>
    [...DEALS_QUERY_KEYS.all, 'byStage', orgId] as const,
  byContact: (orgId: string, contactId: string) =>
    [...DEALS_QUERY_KEYS.all, 'byContact', orgId, contactId] as const,
  stats: (orgId: string) =>
    [...DEALS_QUERY_KEYS.all, 'stats', orgId] as const,
  stages: (orgId: string) =>
    [...DEALS_QUERY_KEYS.all, 'stages', orgId] as const,
  forecast: (orgId: string, period: ForecastPeriod) =>
    [...DEALS_QUERY_KEYS.all, 'forecast', orgId, period] as const,
};

// ============================================================================
// Hook: useDeals - Paginated list of deals
// ============================================================================

export function useDeals(
  filters?: DealFilters,
  pagination?: Pagination
): UseQueryResult<PaginatedResult<Deal>> {
  const { currentOrg } = useOrgStore();
  const orgId = currentOrg?.id || 'demo';

  return useQuery({
    queryKey: DEALS_QUERY_KEYS.list(orgId, filters, pagination),
    queryFn: async () => {
      if (!currentOrg?.id) {
        // Return mock data for demo/development
        return getMockDeals(filters, pagination);
      }

      const manager = createDealManager(currentOrg.id);
      return manager.getDeals(filters, pagination);
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// ============================================================================
// Hook: useDeal - Single deal by ID
// ============================================================================

export function useDeal(id: string | null): UseQueryResult<Deal | null> {
  const { currentOrg } = useOrgStore();
  const orgId = currentOrg?.id || 'demo';

  return useQuery({
    queryKey: DEALS_QUERY_KEYS.detail(orgId, id || ''),
    queryFn: async () => {
      if (!id) return null;

      if (!currentOrg?.id) {
        // Return mock deal for demo/development
        return getMockDealById(id);
      }

      const manager = createDealManager(currentOrg.id);
      return manager.getDeal(id);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

// ============================================================================
// Hook: useDealsByStage - Grouped deals for Kanban view
// ============================================================================

export function useDealsByStage(): UseQueryResult<DealsByStage> {
  const { currentOrg } = useOrgStore();
  const orgId = currentOrg?.id || 'demo';

  return useQuery({
    queryKey: DEALS_QUERY_KEYS.byStage(orgId),
    queryFn: async () => {
      if (!currentOrg?.id) {
        // Return mock data for demo/development
        return getMockDealsByStage();
      }

      const manager = createDealManager(currentOrg.id);
      return manager.getDealsByStage();
    },
    staleTime: 1000 * 60 * 2,
  });
}

// ============================================================================
// Hook: useDealsByContact - Deals for a specific contact
// ============================================================================

export function useDealsByContact(
  contactId: string | null
): UseQueryResult<Deal[]> {
  const { currentOrg } = useOrgStore();
  const orgId = currentOrg?.id || 'demo';

  return useQuery({
    queryKey: DEALS_QUERY_KEYS.byContact(orgId, contactId || ''),
    queryFn: async () => {
      if (!contactId) return [];

      if (!currentOrg?.id) {
        // Return mock data for demo/development
        const mockDeals = getMockDeals().data;
        return mockDeals.filter((d) => d.contact_id === contactId);
      }

      const manager = createDealManager(currentOrg.id);
      return manager.getDealsByContact(contactId);
    },
    enabled: !!contactId,
    staleTime: 1000 * 60 * 2,
  });
}

// ============================================================================
// Hook: useCreateDeal - Create deal mutation
// ============================================================================

export function useCreateDeal(): UseMutationResult<
  Deal,
  Error,
  CreateDealInput
> {
  const { currentOrg } = useOrgStore();
  const queryClient = useQueryClient();
  const orgId = currentOrg?.id || 'demo';

  return useMutation({
    mutationFn: async (input: CreateDealInput) => {
      if (!currentOrg?.id) {
        // Return mock created deal for demo
        return createMockDeal(input);
      }

      const manager = createDealManager(currentOrg.id);
      return manager.createDeal(input);
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: DEALS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: DEALS_QUERY_KEYS.byStage(orgId) });
      queryClient.invalidateQueries({ queryKey: DEALS_QUERY_KEYS.stats(orgId) });
    },
  });
}

// ============================================================================
// Hook: useUpdateDeal - Update deal mutation
// ============================================================================

export function useUpdateDeal(): UseMutationResult<
  Deal,
  Error,
  { id: string; updates: UpdateDealInput }
> {
  const { currentOrg } = useOrgStore();
  const queryClient = useQueryClient();
  const orgId = currentOrg?.id || 'demo';

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateDealInput }) => {
      if (!currentOrg?.id) {
        // Return mock updated deal for demo
        return updateMockDeal(id, updates);
      }

      const manager = createDealManager(currentOrg.id);
      return manager.updateDeal(id, updates);
    },
    onSuccess: (deal) => {
      // Update cache with new deal data
      queryClient.setQueryData(
        DEALS_QUERY_KEYS.detail(orgId, deal.id),
        deal
      );
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: DEALS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: DEALS_QUERY_KEYS.byStage(orgId) });
      queryClient.invalidateQueries({ queryKey: DEALS_QUERY_KEYS.stats(orgId) });
    },
  });
}

// ============================================================================
// Hook: useDeleteDeal - Delete deal mutation
// ============================================================================

export function useDeleteDeal(): UseMutationResult<void, Error, string> {
  const { currentOrg } = useOrgStore();
  const queryClient = useQueryClient();
  const orgId = currentOrg?.id || 'demo';

  return useMutation({
    mutationFn: async (id: string) => {
      if (!currentOrg?.id) {
        // Mock delete for demo
        return;
      }

      const manager = createDealManager(currentOrg.id);
      return manager.deleteDeal(id);
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: DEALS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: DEALS_QUERY_KEYS.byStage(orgId) });
      queryClient.invalidateQueries({ queryKey: DEALS_QUERY_KEYS.stats(orgId) });
    },
  });
}

// ============================================================================
// Hook: useMoveDeal - Move deal to stage with optimistic update
// ============================================================================

export function useMoveDeal(): UseMutationResult<
  Deal,
  Error,
  { dealId: string; stageId: string }
> {
  const { currentOrg } = useOrgStore();
  const queryClient = useQueryClient();
  const orgId = currentOrg?.id || 'demo';

  return useMutation({
    mutationFn: async ({ dealId, stageId }: { dealId: string; stageId: string }) => {
      if (!currentOrg?.id) {
        // Return mock moved deal for demo
        return moveMockDeal(dealId, stageId);
      }

      const manager = createDealManager(currentOrg.id);
      return manager.moveDealToStage(dealId, stageId);
    },
    onMutate: async ({ dealId, stageId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: DEALS_QUERY_KEYS.byStage(orgId) });

      // Snapshot the previous value
      const previousDealsByStage = queryClient.getQueryData<DealsByStage>(
        DEALS_QUERY_KEYS.byStage(orgId)
      );

      // Optimistically update the cache
      if (previousDealsByStage) {
        const newDealsByStage = { ...previousDealsByStage };

        // Find and remove deal from current stage
        let movedDeal: Deal | undefined;
        for (const stageKey of Object.keys(newDealsByStage)) {
          const dealIndex = newDealsByStage[stageKey].deals.findIndex(
            (d) => d.id === dealId
          );
          if (dealIndex !== -1) {
            movedDeal = newDealsByStage[stageKey].deals[dealIndex];
            newDealsByStage[stageKey] = {
              ...newDealsByStage[stageKey],
              deals: newDealsByStage[stageKey].deals.filter((d) => d.id !== dealId),
              totalValue: newDealsByStage[stageKey].totalValue - movedDeal.value,
            };
            break;
          }
        }

        // Add deal to new stage
        if (movedDeal && newDealsByStage[stageId]) {
          const stage = newDealsByStage[stageId].stage;
          const updatedDeal = {
            ...movedDeal,
            stage: stageId,
            probability: stage.probability,
            updated_at: new Date().toISOString(),
          };

          newDealsByStage[stageId] = {
            ...newDealsByStage[stageId],
            deals: [updatedDeal, ...newDealsByStage[stageId].deals],
            totalValue: newDealsByStage[stageId].totalValue + movedDeal.value,
          };
        }

        queryClient.setQueryData(DEALS_QUERY_KEYS.byStage(orgId), newDealsByStage);
      }

      return { previousDealsByStage };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousDealsByStage) {
        queryClient.setQueryData(
          DEALS_QUERY_KEYS.byStage(orgId),
          context.previousDealsByStage
        );
      }
    },
    onSettled: () => {
      // Refetch to ensure data is in sync
      queryClient.invalidateQueries({ queryKey: DEALS_QUERY_KEYS.byStage(orgId) });
      queryClient.invalidateQueries({ queryKey: DEALS_QUERY_KEYS.stats(orgId) });
    },
  });
}

// ============================================================================
// Hook: usePipelineStats - Pipeline statistics
// ============================================================================

export function usePipelineStats(): UseQueryResult<PipelineStats> {
  const { currentOrg } = useOrgStore();
  const orgId = currentOrg?.id || 'demo';

  return useQuery({
    queryKey: DEALS_QUERY_KEYS.stats(orgId),
    queryFn: async () => {
      if (!currentOrg?.id) {
        // Return mock stats for demo/development
        return getMockPipelineStats();
      }

      const manager = createDealManager(currentOrg.id);
      return manager.getPipelineStats();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ============================================================================
// Hook: usePipelineStages - Pipeline stages list
// ============================================================================

export function usePipelineStages(): UseQueryResult<PipelineStage[]> {
  const { currentOrg } = useOrgStore();
  const orgId = currentOrg?.id || 'demo';

  return useQuery({
    queryKey: DEALS_QUERY_KEYS.stages(orgId),
    queryFn: async () => {
      if (!currentOrg?.id) {
        // Return default stages for demo/development
        return DEFAULT_PIPELINE_STAGES;
      }

      const manager = createDealManager(currentOrg.id);
      return manager.getStages();
    },
    staleTime: 1000 * 60 * 30, // 30 minutes (stages don't change often)
  });
}

// ============================================================================
// Hook: useForecast - Revenue forecast data
// ============================================================================

export function useForecast(
  period: ForecastPeriod = 'month'
): UseQueryResult<ForecastData[]> {
  const { currentOrg } = useOrgStore();
  const orgId = currentOrg?.id || 'demo';

  return useQuery({
    queryKey: DEALS_QUERY_KEYS.forecast(orgId, period),
    queryFn: async () => {
      if (!currentOrg?.id) {
        // Return mock forecast for demo/development
        return getMockForecast(period);
      }

      const manager = createDealManager(currentOrg.id);
      return manager.getForecast(period);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ============================================================================
// Mock Data Functions (for development/demo)
// ============================================================================

const MOCK_DEALS: Deal[] = [
  {
    id: 'deal-1',
    title: 'Enterprise Software License',
    contact_id: 'contact-1',
    company: 'Acme Corporation',
    value: 75000,
    currency: 'USD',
    stage: 'negotiation',
    probability: 75,
    expected_close_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    actual_close_date: null,
    notes: 'Finalizing contract terms',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'deal-2',
    title: 'Marketing Platform Subscription',
    contact_id: 'contact-2',
    company: 'TechStart Inc',
    value: 24000,
    currency: 'USD',
    stage: 'proposal',
    probability: 50,
    expected_close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    actual_close_date: null,
    notes: 'Sent proposal, awaiting feedback',
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'deal-3',
    title: 'Consulting Services',
    contact_id: 'contact-3',
    company: 'Global Industries',
    value: 150000,
    currency: 'USD',
    stage: 'qualified',
    probability: 20,
    expected_close_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    actual_close_date: null,
    notes: 'Initial discovery completed',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'deal-4',
    title: 'SaaS Annual Plan',
    contact_id: 'contact-4',
    company: 'StartupXYZ',
    value: 12000,
    currency: 'USD',
    stage: 'lead',
    probability: 5,
    expected_close_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    actual_close_date: null,
    notes: 'New inbound lead from website',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'deal-5',
    title: 'Data Analytics Platform',
    contact_id: 'contact-5',
    company: 'DataDriven Co',
    value: 48000,
    currency: 'USD',
    stage: 'closed_won',
    probability: 100,
    expected_close_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    actual_close_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Deal closed successfully!',
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'deal-6',
    title: 'Cloud Migration Project',
    contact_id: 'contact-6',
    company: 'Legacy Systems Inc',
    value: 95000,
    currency: 'USD',
    stage: 'closed_lost',
    probability: 0,
    expected_close_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    actual_close_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Lost to competitor on pricing',
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

function getMockDeals(
  filters?: DealFilters,
  pagination?: Pagination
): PaginatedResult<Deal> {
  let deals = [...MOCK_DEALS];

  if (filters) {
    if (filters.stage) {
      deals = deals.filter((d) => d.stage === filters.stage);
    }
    if (filters.contact_id) {
      deals = deals.filter((d) => d.contact_id === filters.contact_id);
    }
    if (filters.min_value !== undefined) {
      deals = deals.filter((d) => d.value >= filters.min_value!);
    }
    if (filters.max_value !== undefined) {
      deals = deals.filter((d) => d.value <= filters.max_value!);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      deals = deals.filter(
        (d) =>
          d.title.toLowerCase().includes(searchLower) ||
          d.company?.toLowerCase().includes(searchLower)
      );
    }
  }

  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    data: deals.slice(start, end),
    total: deals.length,
    page,
    pageSize,
    totalPages: Math.ceil(deals.length / pageSize),
  };
}

function getMockDealById(id: string): Deal | null {
  return MOCK_DEALS.find((d) => d.id === id) || null;
}

function getMockDealsByStage(): DealsByStage {
  const result: DealsByStage = {};

  for (const stage of DEFAULT_PIPELINE_STAGES) {
    const stageDeals = MOCK_DEALS.filter((d) => d.stage === stage.id);
    result[stage.id] = {
      stage,
      deals: stageDeals,
      totalValue: stageDeals.reduce((sum, d) => sum + d.value, 0),
    };
  }

  return result;
}

function createMockDeal(input: CreateDealInput): Deal {
  const stage = DEFAULT_PIPELINE_STAGES.find((s) => s.id === (input.stage || 'lead'));
  return {
    id: `deal-${Date.now()}`,
    title: input.title,
    contact_id: input.contact_id,
    company: input.company || null,
    value: input.value,
    currency: input.currency || 'USD',
    stage: input.stage || 'lead',
    probability: input.probability ?? stage?.probability ?? 0,
    expected_close_date: input.expected_close_date || null,
    actual_close_date: null,
    notes: input.notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function updateMockDeal(id: string, updates: UpdateDealInput): Deal {
  const deal = MOCK_DEALS.find((d) => d.id === id);
  if (!deal) {
    throw new Error(`Deal not found: ${id}`);
  }

  return {
    ...deal,
    ...updates,
    updated_at: new Date().toISOString(),
  };
}

function moveMockDeal(dealId: string, stageId: string): Deal {
  const deal = MOCK_DEALS.find((d) => d.id === dealId);
  if (!deal) {
    throw new Error(`Deal not found: ${dealId}`);
  }

  const stage = DEFAULT_PIPELINE_STAGES.find((s) => s.id === stageId);
  if (!stage) {
    throw new Error(`Stage not found: ${stageId}`);
  }

  return {
    ...deal,
    stage: stageId,
    probability: stage.probability,
    actual_close_date: stage.is_won || stage.is_lost ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };
}

function getMockPipelineStats(): PipelineStats {
  const openDeals = MOCK_DEALS.filter(
    (d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost'
  );
  const wonDeals = MOCK_DEALS.filter((d) => d.stage === 'closed_won');
  const lostDeals = MOCK_DEALS.filter((d) => d.stage === 'closed_lost');

  const totalValue = MOCK_DEALS.reduce((sum, d) => sum + d.value, 0);
  const weightedValue = MOCK_DEALS.reduce(
    (sum, d) => sum + d.value * (d.probability / 100),
    0
  );

  const valueByStage: { [key: string]: number } = {};
  const dealCountByStage: { [key: string]: number } = {};

  for (const stage of DEFAULT_PIPELINE_STAGES) {
    const stageDeals = MOCK_DEALS.filter((d) => d.stage === stage.id);
    valueByStage[stage.id] = stageDeals.reduce((sum, d) => sum + d.value, 0);
    dealCountByStage[stage.id] = stageDeals.length;
  }

  const closedDeals = wonDeals.length + lostDeals.length;
  const winRate = closedDeals > 0 ? (wonDeals.length / closedDeals) * 100 : 0;
  const avgDealSize = MOCK_DEALS.length > 0 ? totalValue / MOCK_DEALS.length : 0;

  return {
    totalDeals: MOCK_DEALS.length,
    totalValue,
    weightedValue,
    valueByStage,
    dealCountByStage,
    winRate,
    avgDealSize,
    avgTimeToClose: 35, // Mock average
    wonDeals: wonDeals.length,
    lostDeals: lostDeals.length,
    openDeals: openDeals.length,
  };
}

function getMockForecast(period: ForecastPeriod): ForecastData[] {
  const now = new Date();
  const forecast: ForecastData[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (period === 'month') {
    for (let i = 0; i < 6; i++) {
      const month = (now.getMonth() + i) % 12;
      const year = now.getFullYear() + Math.floor((now.getMonth() + i) / 12);
      const baseValue = 50000 + Math.random() * 100000;

      forecast.push({
        period: `${monthNames[month]} ${year}`,
        bestCase: Math.round(baseValue * 1.3),
        expected: Math.round(baseValue),
        worstCase: Math.round(baseValue * 0.7),
        deals: [],
      });
    }
  } else if (period === 'quarter') {
    const currentQuarter = Math.floor(now.getMonth() / 3);
    for (let i = 0; i < 4; i++) {
      const quarterIndex = (currentQuarter + i) % 4;
      const year = now.getFullYear() + Math.floor((currentQuarter + i) / 4);
      const baseValue = 150000 + Math.random() * 200000;

      forecast.push({
        period: `Q${quarterIndex + 1} ${year}`,
        bestCase: Math.round(baseValue * 1.3),
        expected: Math.round(baseValue),
        worstCase: Math.round(baseValue * 0.7),
        deals: [],
      });
    }
  } else {
    for (let i = 0; i < 3; i++) {
      const year = now.getFullYear() + i;
      const baseValue = 500000 + Math.random() * 500000;

      forecast.push({
        period: `${year}`,
        bestCase: Math.round(baseValue * 1.3),
        expected: Math.round(baseValue),
        worstCase: Math.round(baseValue * 0.7),
        deals: [],
      });
    }
  }

  return forecast;
}
