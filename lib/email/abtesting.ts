// Email A/B Testing System - Inspired by Listmonk
import { supabase } from '../supabase';

// Types
export interface ABTest {
  id: string;
  campaign_id: string;
  name: string;
  status: 'draft' | 'running' | 'completed' | 'cancelled';
  test_type: 'subject' | 'content' | 'sender' | 'send_time';
  variants: ABVariant[];
  winner_criteria: WinnerCriteria;
  sample_size_percent: number; // % of audience for testing
  auto_send_winner: boolean;
  winner_delay_hours: number; // Hours before selecting winner
  winning_variant_id?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ABVariant {
  id: string;
  name: string;
  weight: number; // Distribution weight (sum should = 100)

  // Variant content based on test type
  subject?: string;
  preview_text?: string;
  content?: string;
  sender_name?: string;
  sender_email?: string;
  send_time?: string;

  // Results
  recipients: number;
  opens: number;
  clicks: number;
  conversions: number;
  unsubscribes: number;
}

export type WinnerCriteria = 'open_rate' | 'click_rate' | 'conversion_rate' | 'revenue';

export interface ABTestStats {
  test_id: string;
  variants: VariantStats[];
  winner?: string;
  confidence_level?: number;
  is_statistically_significant: boolean;
}

export interface VariantStats {
  variant_id: string;
  variant_name: string;
  recipients: number;
  opens: number;
  open_rate: number;
  clicks: number;
  click_rate: number;
  conversions: number;
  conversion_rate: number;
  unsubscribes: number;
  unsubscribe_rate: number;
}

// A/B Test Manager Class
export class ABTestManager {
  // Get all A/B tests
  async getTests(campaignId?: string): Promise<ABTest[]> {
    let query = supabase
      .from('email_ab_tests')
      .select('*')
      .order('created_at', { ascending: false });

    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching A/B tests:', error);
      return [];
    }

    return data || [];
  }

  // Get single A/B test
  async getTest(id: string): Promise<ABTest | null> {
    const { data, error } = await supabase
      .from('email_ab_tests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching A/B test:', error);
      return null;
    }

    return data;
  }

  // Create A/B test
  async createTest(test: Omit<ABTest, 'id' | 'created_at' | 'updated_at'>): Promise<ABTest | null> {
    // Validate variant weights sum to 100
    const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight !== 100) {
      console.error('Variant weights must sum to 100');
      return null;
    }

    const { data, error } = await (supabase
      .from('email_ab_tests') as any)
      .insert({
        ...test,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating A/B test:', error);
      return null;
    }

    return data;
  }

  // Update A/B test
  async updateTest(id: string, updates: Partial<ABTest>): Promise<ABTest | null> {
    const { data, error } = await (supabase
      .from('email_ab_tests') as any)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating A/B test:', error);
      return null;
    }

    return data;
  }

  // Delete A/B test
  async deleteTest(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('email_ab_tests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting A/B test:', error);
      return false;
    }

    return true;
  }

  // Start A/B test
  async startTest(id: string): Promise<ABTest | null> {
    const test = await this.getTest(id);
    if (!test || test.status !== 'draft') {
      console.error('Test must be in draft status to start');
      return null;
    }

    return this.updateTest(id, {
      status: 'running',
      started_at: new Date().toISOString(),
    });
  }

  // Calculate test statistics
  calculateStats(test: ABTest): ABTestStats {
    const variantStats: VariantStats[] = test.variants.map(variant => ({
      variant_id: variant.id,
      variant_name: variant.name,
      recipients: variant.recipients,
      opens: variant.opens,
      open_rate: variant.recipients > 0 ? (variant.opens / variant.recipients) * 100 : 0,
      clicks: variant.clicks,
      click_rate: variant.recipients > 0 ? (variant.clicks / variant.recipients) * 100 : 0,
      conversions: variant.conversions,
      conversion_rate: variant.recipients > 0 ? (variant.conversions / variant.recipients) * 100 : 0,
      unsubscribes: variant.unsubscribes,
      unsubscribe_rate: variant.recipients > 0 ? (variant.unsubscribes / variant.recipients) * 100 : 0,
    }));

    // Determine winner based on criteria
    const winner = this.determineWinner(variantStats, test.winner_criteria);

    // Calculate statistical significance (simplified chi-square test)
    const isSignificant = this.calculateSignificance(variantStats, test.winner_criteria);

    return {
      test_id: test.id,
      variants: variantStats,
      winner: winner?.variant_id,
      confidence_level: isSignificant ? 95 : undefined,
      is_statistically_significant: isSignificant,
    };
  }

  // Determine winning variant
  private determineWinner(stats: VariantStats[], criteria: WinnerCriteria): VariantStats | null {
    if (stats.length === 0) return null;

    const metricMap: Record<WinnerCriteria, keyof VariantStats> = {
      open_rate: 'open_rate',
      click_rate: 'click_rate',
      conversion_rate: 'conversion_rate',
      revenue: 'conversion_rate', // Simplified - would need revenue tracking
    };
    const metricKey = metricMap[criteria];

    return stats.reduce((best, current) =>
      (current[metricKey] as number) > (best[metricKey] as number) ? current : best
    );
  }

  // Calculate statistical significance (simplified)
  private calculateSignificance(stats: VariantStats[], criteria: WinnerCriteria): boolean {
    if (stats.length < 2) return false;

    // Need minimum sample size
    const minSampleSize = 100;
    const hasEnoughSamples = stats.every(s => s.recipients >= minSampleSize);
    if (!hasEnoughSamples) return false;

    // Calculate z-score for two-proportion test (simplified)
    const metricKey: keyof VariantStats = criteria === 'open_rate' ? 'open_rate' :
      criteria === 'click_rate' ? 'click_rate' : 'conversion_rate';

    const rates = stats.map(s => s[metricKey] as number / 100);
    const samples = stats.map(s => s.recipients);

    if (rates.length === 2) {
      const p1 = rates[0];
      const p2 = rates[1];
      const n1 = samples[0];
      const n2 = samples[1];

      // Pooled proportion
      const p = (p1 * n1 + p2 * n2) / (n1 + n2);

      // Standard error
      const se = Math.sqrt(p * (1 - p) * (1/n1 + 1/n2));

      // Z-score
      const z = Math.abs(p1 - p2) / (se || 1);

      // 95% confidence requires z > 1.96
      return z > 1.96;
    }

    return false;
  }

  // Auto-select winner and send to remaining audience
  async selectWinner(testId: string, variantId?: string): Promise<ABTest | null> {
    const test = await this.getTest(testId);
    if (!test || test.status !== 'running') {
      console.error('Test must be running to select winner');
      return null;
    }

    // If no variant specified, calculate winner
    let winnerId = variantId;
    if (!winnerId) {
      const stats = this.calculateStats(test);
      winnerId = stats.winner;
    }

    if (!winnerId) {
      console.error('Could not determine winner');
      return null;
    }

    return this.updateTest(testId, {
      status: 'completed',
      winning_variant_id: winnerId,
      completed_at: new Date().toISOString(),
    });
  }

  // Cancel A/B test
  async cancelTest(id: string): Promise<ABTest | null> {
    return this.updateTest(id, {
      status: 'cancelled',
      completed_at: new Date().toISOString(),
    });
  }

  // Create default two-variant test
  createDefaultVariants(testType: ABTest['test_type']): ABVariant[] {
    const baseVariant: Omit<ABVariant, 'id' | 'name'> = {
      weight: 50,
      recipients: 0,
      opens: 0,
      clicks: 0,
      conversions: 0,
      unsubscribes: 0,
    };

    return [
      {
        ...baseVariant,
        id: 'variant-a',
        name: 'Variant A (Control)',
      },
      {
        ...baseVariant,
        id: 'variant-b',
        name: 'Variant B',
      },
    ];
  }

  // Get recommended sample size based on expected effect
  getRecommendedSampleSize(
    baselineRate: number, // e.g., 0.20 for 20% open rate
    minimumDetectableEffect: number, // e.g., 0.02 for 2% improvement
    power: number = 0.8,
    significance: number = 0.05
  ): number {
    // Simplified sample size calculation
    // For more accuracy, use proper statistical libraries
    const zAlpha = 1.96; // 95% confidence
    const zBeta = 0.84; // 80% power

    const p1 = baselineRate;
    const p2 = baselineRate + minimumDetectableEffect;
    const pAvg = (p1 + p2) / 2;

    const n = (2 * pAvg * (1 - pAvg) * Math.pow(zAlpha + zBeta, 2)) /
      Math.pow(p1 - p2, 2);

    return Math.ceil(n);
  }
}

// Export singleton instance
export const abTestManager = new ABTestManager();

export default abTestManager;
