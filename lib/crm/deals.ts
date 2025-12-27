import { supabase } from '../supabase';

// ============================================================================
// Types
// ============================================================================

export interface Deal {
  id: string;
  title: string;
  contact_id: string;
  company: string | null;
  value: number;
  currency: string;
  stage: string;
  probability: number;
  expected_close_date: string | null;
  actual_close_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  organization_id?: string;
  created_by?: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color: string;
  probability: number;
  is_won: boolean;
  is_lost: boolean;
}

export interface DealFilters {
  stage?: string;
  contact_id?: string;
  min_value?: number;
  max_value?: number;
  expected_close_from?: string;
  expected_close_to?: string;
  search?: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DealsByStage {
  [stageId: string]: {
    stage: PipelineStage;
    deals: Deal[];
    totalValue: number;
  };
}

export interface PipelineStats {
  totalDeals: number;
  totalValue: number;
  weightedValue: number;
  valueByStage: { [stageId: string]: number };
  dealCountByStage: { [stageId: string]: number };
  winRate: number;
  avgDealSize: number;
  avgTimeToClose: number; // in days
  wonDeals: number;
  lostDeals: number;
  openDeals: number;
}

export interface ForecastData {
  period: string;
  bestCase: number;
  expected: number;
  worstCase: number;
  deals: Deal[];
}

export type ForecastPeriod = 'month' | 'quarter' | 'year';

export interface CreateDealInput {
  title: string;
  contact_id: string;
  company?: string | null;
  value: number;
  currency?: string;
  stage?: string;
  probability?: number;
  expected_close_date?: string | null;
  notes?: string | null;
}

export interface UpdateDealInput {
  title?: string;
  contact_id?: string;
  company?: string | null;
  value?: number;
  currency?: string;
  stage?: string;
  probability?: number;
  expected_close_date?: string | null;
  actual_close_date?: string | null;
  notes?: string | null;
}

export interface CreateStageInput {
  name: string;
  order?: number;
  color?: string;
  probability?: number;
  is_won?: boolean;
  is_lost?: boolean;
}

export interface UpdateStageInput {
  name?: string;
  order?: number;
  color?: string;
  probability?: number;
  is_won?: boolean;
  is_lost?: boolean;
}

// ============================================================================
// Default Pipeline Stages
// ============================================================================

export const DEFAULT_PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'lead',
    name: 'Lead',
    order: 0,
    color: '#94a3b8', // slate-400
    probability: 5,
    is_won: false,
    is_lost: false,
  },
  {
    id: 'qualified',
    name: 'Qualified',
    order: 1,
    color: '#60a5fa', // blue-400
    probability: 20,
    is_won: false,
    is_lost: false,
  },
  {
    id: 'proposal',
    name: 'Proposal',
    order: 2,
    color: '#a78bfa', // violet-400
    probability: 50,
    is_won: false,
    is_lost: false,
  },
  {
    id: 'negotiation',
    name: 'Negotiation',
    order: 3,
    color: '#fb923c', // orange-400
    probability: 75,
    is_won: false,
    is_lost: false,
  },
  {
    id: 'closed_won',
    name: 'Closed Won',
    order: 4,
    color: '#4ade80', // green-400
    probability: 100,
    is_won: true,
    is_lost: false,
  },
  {
    id: 'closed_lost',
    name: 'Closed Lost',
    order: 5,
    color: '#f87171', // red-400
    probability: 0,
    is_won: false,
    is_lost: true,
  },
];

// ============================================================================
// DealManager Class
// ============================================================================

export class DealManager {
  private organizationId: string;
  private stages: PipelineStage[];

  constructor(organizationId: string) {
    this.organizationId = organizationId;
    this.stages = [...DEFAULT_PIPELINE_STAGES];
  }

  // --------------------------------------------------------------------------
  // Deal CRUD Operations
  // --------------------------------------------------------------------------

  async getDeals(
    filters?: DealFilters,
    pagination?: Pagination
  ): Promise<PaginatedResult<Deal>> {
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('deals')
      .select('*', { count: 'exact' })
      .eq('organization_id', this.organizationId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters) {
      if (filters.stage) {
        query = query.eq('stage', filters.stage);
      }
      if (filters.contact_id) {
        query = query.eq('contact_id', filters.contact_id);
      }
      if (filters.min_value !== undefined) {
        query = query.gte('value', filters.min_value);
      }
      if (filters.max_value !== undefined) {
        query = query.lte('value', filters.max_value);
      }
      if (filters.expected_close_from) {
        query = query.gte('expected_close_date', filters.expected_close_from);
      }
      if (filters.expected_close_to) {
        query = query.lte('expected_close_date', filters.expected_close_to);
      }
      if (filters.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }
    }

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch deals: ${error.message}`);
    }

    const deals = (data || []).map(this.mapDatabaseDeal);
    const total = count || 0;

    return {
      data: deals,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getDeal(id: string): Promise<Deal | null> {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .eq('organization_id', this.organizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch deal: ${error.message}`);
    }

    return this.mapDatabaseDeal(data);
  }

  async createDeal(input: CreateDealInput): Promise<Deal> {
    const stage = input.stage || 'lead';
    const stageData = this.getStageById(stage);
    const probability = input.probability ?? stageData?.probability ?? 0;

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await (supabase
      .from('deals') as any)
      .insert({
        organization_id: this.organizationId,
        title: input.title,
        contact_id: input.contact_id,
        value: input.value,
        currency: input.currency || 'USD',
        stage: stage,
        probability: probability,
        expected_close_date: input.expected_close_date || null,
        notes: input.notes || null,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create deal: ${error.message}`);
    }

    return this.mapDatabaseDeal(data);
  }

  async updateDeal(id: string, updates: UpdateDealInput): Promise<Deal> {
    // If stage is being updated and probability wasn't explicitly set,
    // update probability to match the new stage
    const updateData: Record<string, unknown> = { ...updates };

    if (updates.stage && updates.probability === undefined) {
      const stageData = this.getStageById(updates.stage);
      if (stageData) {
        updateData.probability = stageData.probability;

        // Set actual_close_date for won/lost deals
        if (stageData.is_won || stageData.is_lost) {
          updateData.actual_close_date = new Date().toISOString();
        }
      }
    }

    const { data, error } = await (supabase
      .from('deals') as any)
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', this.organizationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update deal: ${error.message}`);
    }

    return this.mapDatabaseDeal(data);
  }

  async deleteDeal(id: string): Promise<void> {
    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', id)
      .eq('organization_id', this.organizationId);

    if (error) {
      throw new Error(`Failed to delete deal: ${error.message}`);
    }
  }

  async moveDealToStage(dealId: string, stageId: string): Promise<Deal> {
    const stage = this.getStageById(stageId);
    if (!stage) {
      throw new Error(`Invalid stage: ${stageId}`);
    }

    const updates: UpdateDealInput = {
      stage: stageId,
      probability: stage.probability,
    };

    // Set actual_close_date for won/lost deals
    if (stage.is_won || stage.is_lost) {
      updates.actual_close_date = new Date().toISOString();
    }

    return this.updateDeal(dealId, updates);
  }

  // --------------------------------------------------------------------------
  // Deal Queries
  // --------------------------------------------------------------------------

  async getDealsByStage(): Promise<DealsByStage> {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('organization_id', this.organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch deals by stage: ${error.message}`);
    }

    const deals = (data || []).map(this.mapDatabaseDeal);
    const result: DealsByStage = {};

    // Initialize all stages
    for (const stage of this.stages) {
      result[stage.id] = {
        stage,
        deals: [],
        totalValue: 0,
      };
    }

    // Group deals by stage
    for (const deal of deals) {
      const stageId = deal.stage;
      if (result[stageId]) {
        result[stageId].deals.push(deal);
        result[stageId].totalValue += deal.value;
      } else {
        // Handle unknown stages
        result[stageId] = {
          stage: {
            id: stageId,
            name: stageId,
            order: 999,
            color: '#6b7280',
            probability: 0,
            is_won: false,
            is_lost: false,
          },
          deals: [deal],
          totalValue: deal.value,
        };
      }
    }

    return result;
  }

  async getDealsByContact(contactId: string): Promise<Deal[]> {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('organization_id', this.organizationId)
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch deals by contact: ${error.message}`);
    }

    return (data || []).map(this.mapDatabaseDeal);
  }

  // --------------------------------------------------------------------------
  // Pipeline Statistics
  // --------------------------------------------------------------------------

  async getPipelineStats(): Promise<PipelineStats> {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('organization_id', this.organizationId);

    if (error) {
      throw new Error(`Failed to fetch pipeline stats: ${error.message}`);
    }

    const deals = (data || []).map(this.mapDatabaseDeal);

    const stats: PipelineStats = {
      totalDeals: deals.length,
      totalValue: 0,
      weightedValue: 0,
      valueByStage: {},
      dealCountByStage: {},
      winRate: 0,
      avgDealSize: 0,
      avgTimeToClose: 0,
      wonDeals: 0,
      lostDeals: 0,
      openDeals: 0,
    };

    // Initialize stage stats
    for (const stage of this.stages) {
      stats.valueByStage[stage.id] = 0;
      stats.dealCountByStage[stage.id] = 0;
    }

    let totalTimeToClose = 0;
    let closedDealsWithTime = 0;

    for (const deal of deals) {
      const stage = this.getStageById(deal.stage);
      const isWon = stage?.is_won || deal.stage === 'closed_won' || deal.stage === 'won';
      const isLost = stage?.is_lost || deal.stage === 'closed_lost' || deal.stage === 'lost';

      // Total value
      stats.totalValue += deal.value;

      // Weighted value (value * probability)
      stats.weightedValue += deal.value * (deal.probability / 100);

      // Value by stage
      if (stats.valueByStage[deal.stage] !== undefined) {
        stats.valueByStage[deal.stage] += deal.value;
      } else {
        stats.valueByStage[deal.stage] = deal.value;
      }

      // Deal count by stage
      if (stats.dealCountByStage[deal.stage] !== undefined) {
        stats.dealCountByStage[deal.stage]++;
      } else {
        stats.dealCountByStage[deal.stage] = 1;
      }

      // Win/loss tracking
      if (isWon) {
        stats.wonDeals++;

        // Calculate time to close
        if (deal.actual_close_date && deal.created_at) {
          const created = new Date(deal.created_at);
          const closed = new Date(deal.actual_close_date);
          const days = (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          totalTimeToClose += days;
          closedDealsWithTime++;
        }
      } else if (isLost) {
        stats.lostDeals++;
      } else {
        stats.openDeals++;
      }
    }

    // Calculate derived stats
    const closedDeals = stats.wonDeals + stats.lostDeals;
    stats.winRate = closedDeals > 0 ? (stats.wonDeals / closedDeals) * 100 : 0;
    stats.avgDealSize = deals.length > 0 ? stats.totalValue / deals.length : 0;
    stats.avgTimeToClose = closedDealsWithTime > 0 ? totalTimeToClose / closedDealsWithTime : 0;

    return stats;
  }

  // --------------------------------------------------------------------------
  // Stage Management
  // --------------------------------------------------------------------------

  getStages(): PipelineStage[] {
    return [...this.stages].sort((a, b) => a.order - b.order);
  }

  getStageById(id: string): PipelineStage | undefined {
    return this.stages.find((s) => s.id === id);
  }

  createStage(input: CreateStageInput): PipelineStage {
    const maxOrder = Math.max(...this.stages.map((s) => s.order), -1);

    const newStage: PipelineStage = {
      id: this.generateStageId(input.name),
      name: input.name,
      order: input.order ?? maxOrder + 1,
      color: input.color || '#6b7280',
      probability: input.probability ?? 0,
      is_won: input.is_won ?? false,
      is_lost: input.is_lost ?? false,
    };

    this.stages.push(newStage);
    this.stages.sort((a, b) => a.order - b.order);

    return newStage;
  }

  updateStage(id: string, updates: UpdateStageInput): PipelineStage {
    const index = this.stages.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Stage not found: ${id}`);
    }

    this.stages[index] = {
      ...this.stages[index],
      ...updates,
    };

    this.stages.sort((a, b) => a.order - b.order);

    return this.stages[index];
  }

  deleteStage(id: string): void {
    const index = this.stages.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Stage not found: ${id}`);
    }

    this.stages.splice(index, 1);
  }

  reorderStages(stageIds: string[]): PipelineStage[] {
    // Validate all stage IDs exist
    for (const id of stageIds) {
      if (!this.stages.find((s) => s.id === id)) {
        throw new Error(`Stage not found: ${id}`);
      }
    }

    // Update order based on position in array
    for (let i = 0; i < stageIds.length; i++) {
      const stage = this.stages.find((s) => s.id === stageIds[i]);
      if (stage) {
        stage.order = i;
      }
    }

    this.stages.sort((a, b) => a.order - b.order);

    return this.getStages();
  }

  // --------------------------------------------------------------------------
  // Forecasting
  // --------------------------------------------------------------------------

  async getForecast(period: ForecastPeriod): Promise<ForecastData[]> {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('organization_id', this.organizationId)
      .not('expected_close_date', 'is', null)
      .order('expected_close_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch forecast data: ${error.message}`);
    }

    const deals = (data || []).map(this.mapDatabaseDeal);
    const forecast: ForecastData[] = [];
    const now = new Date();

    // Generate period buckets
    const periods = this.generatePeriodBuckets(now, period);

    for (const periodInfo of periods) {
      const periodDeals = deals.filter((deal) => {
        if (!deal.expected_close_date) return false;
        const closeDate = new Date(deal.expected_close_date);
        return closeDate >= periodInfo.start && closeDate < periodInfo.end;
      });

      // Filter out already won/lost deals
      const openDeals = periodDeals.filter((deal) => {
        const stage = this.getStageById(deal.stage);
        return !(stage?.is_won || stage?.is_lost);
      });

      // Calculate forecast values
      let bestCase = 0;
      let expected = 0;
      let worstCase = 0;

      for (const deal of openDeals) {
        bestCase += deal.value;
        expected += deal.value * (deal.probability / 100);
        worstCase += deal.probability >= 50 ? deal.value * (deal.probability / 100) : 0;
      }

      // Add already won deals
      for (const deal of periodDeals) {
        const stage = this.getStageById(deal.stage);
        if (stage?.is_won) {
          bestCase += deal.value;
          expected += deal.value;
          worstCase += deal.value;
        }
      }

      forecast.push({
        period: periodInfo.label,
        bestCase,
        expected,
        worstCase,
        deals: openDeals,
      });
    }

    return forecast;
  }

  // --------------------------------------------------------------------------
  // Private Helpers
  // --------------------------------------------------------------------------

  private mapDatabaseDeal = (row: Record<string, unknown>): Deal => {
    return {
      id: row.id as string,
      title: row.title as string,
      contact_id: row.contact_id as string,
      company: (row.company as string | null) || null,
      value: row.value as number,
      currency: (row.currency as string) || 'USD',
      stage: row.stage as string,
      probability: row.probability as number,
      expected_close_date: (row.expected_close_date as string | null) || null,
      actual_close_date: (row.actual_close_date as string | null) || null,
      notes: (row.notes as string | null) || null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      organization_id: row.organization_id as string | undefined,
      created_by: row.created_by as string | undefined,
    };
  };

  private generateStageId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  private generatePeriodBuckets(
    startDate: Date,
    period: ForecastPeriod
  ): Array<{ start: Date; end: Date; label: string }> {
    const buckets: Array<{ start: Date; end: Date; label: string }> = [];
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    if (period === 'month') {
      // Generate 6 monthly buckets
      for (let i = 0; i < 6; i++) {
        const start = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        const end = new Date(startDate.getFullYear(), startDate.getMonth() + i + 1, 1);
        buckets.push({
          start,
          end,
          label: `${monthNames[start.getMonth()]} ${start.getFullYear()}`,
        });
      }
    } else if (period === 'quarter') {
      // Generate 4 quarterly buckets
      const currentQuarter = Math.floor(startDate.getMonth() / 3);
      for (let i = 0; i < 4; i++) {
        const quarterIndex = currentQuarter + i;
        const year = startDate.getFullYear() + Math.floor(quarterIndex / 4);
        const quarter = quarterIndex % 4;
        const start = new Date(year, quarter * 3, 1);
        const end = new Date(year, quarter * 3 + 3, 1);
        buckets.push({
          start,
          end,
          label: `Q${quarter + 1} ${year}`,
        });
      }
    } else {
      // Generate 3 yearly buckets
      for (let i = 0; i < 3; i++) {
        const year = startDate.getFullYear() + i;
        const start = new Date(year, 0, 1);
        const end = new Date(year + 1, 0, 1);
        buckets.push({
          start,
          end,
          label: `${year}`,
        });
      }
    }

    return buckets;
  }
}

// ============================================================================
// Factory function for easy instantiation
// ============================================================================

export function createDealManager(organizationId: string): DealManager {
  return new DealManager(organizationId);
}
