// Email Subscriber Segmentation - Inspired by Listmonk
import { supabase } from '../supabase';

// Types
export interface Subscriber {
  id: string;
  email: string;
  name?: string;
  status: 'active' | 'unsubscribed' | 'bounced' | 'complained';
  lists: string[];
  attributes: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_opened_at?: string;
  last_clicked_at?: string;
  open_count: number;
  click_count: number;
  unsubscribed_at?: string;
}

export interface Segment {
  id: string;
  name: string;
  description?: string;
  rules: SegmentRule[];
  rule_operator: 'and' | 'or';
  subscriber_count?: number;
  created_at: string;
  updated_at: string;
}

export interface SegmentRule {
  field: string;
  operator: RuleOperator;
  value: string | number | boolean | string[];
}

export type RuleOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'in_list'
  | 'not_in_list'
  | 'is_empty'
  | 'is_not_empty'
  | 'date_before'
  | 'date_after'
  | 'date_in_last';

// Available fields for segmentation
export const SEGMENTATION_FIELDS = {
  // Subscriber fields
  email: { label: 'Email', type: 'string' },
  name: { label: 'Name', type: 'string' },
  status: { label: 'Status', type: 'select', options: ['active', 'unsubscribed', 'bounced', 'complained'] },
  created_at: { label: 'Signup Date', type: 'date' },

  // Engagement fields
  open_count: { label: 'Total Opens', type: 'number' },
  click_count: { label: 'Total Clicks', type: 'number' },
  last_opened_at: { label: 'Last Opened', type: 'date' },
  last_clicked_at: { label: 'Last Clicked', type: 'date' },

  // List membership
  lists: { label: 'List Membership', type: 'list' },

  // Custom attributes
  'attributes.source': { label: 'Source', type: 'string' },
  'attributes.plan': { label: 'Plan', type: 'string' },
  'attributes.company': { label: 'Company', type: 'string' },
} as const;

// Pre-defined segment templates
export const SEGMENT_TEMPLATES: Omit<Segment, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Highly Engaged',
    description: 'Subscribers who have opened emails 5+ times',
    rules: [{ field: 'open_count', operator: 'greater_than', value: 5 }],
    rule_operator: 'and',
  },
  {
    name: 'Inactive (30 days)',
    description: 'Subscribers who haven\'t opened in 30 days',
    rules: [{ field: 'last_opened_at', operator: 'date_in_last', value: 30 }],
    rule_operator: 'and',
  },
  {
    name: 'New Subscribers',
    description: 'Subscribers who joined in the last 7 days',
    rules: [{ field: 'created_at', operator: 'date_in_last', value: 7 }],
    rule_operator: 'and',
  },
  {
    name: 'Never Opened',
    description: 'Subscribers who have never opened an email',
    rules: [{ field: 'open_count', operator: 'equals', value: 0 }],
    rule_operator: 'and',
  },
  {
    name: 'Clickers',
    description: 'Subscribers who have clicked at least once',
    rules: [{ field: 'click_count', operator: 'greater_than', value: 0 }],
    rule_operator: 'and',
  },
];

// Segment Manager Class
export class SegmentManager {
  // Get all segments
  async getSegments(): Promise<Segment[]> {
    const { data, error } = await supabase
      .from('email_segments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching segments:', error);
      return [];
    }

    return data || [];
  }

  // Get single segment
  async getSegment(id: string): Promise<Segment | null> {
    const { data, error } = await supabase
      .from('email_segments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching segment:', error);
      return null;
    }

    return data;
  }

  // Create segment
  async createSegment(segment: Omit<Segment, 'id' | 'created_at' | 'updated_at'>): Promise<Segment | null> {
    const { data, error } = await (supabase
      .from('email_segments') as any)
      .insert({
        ...segment,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating segment:', error);
      return null;
    }

    return data;
  }

  // Update segment
  async updateSegment(id: string, updates: Partial<Segment>): Promise<Segment | null> {
    const { data, error } = await (supabase
      .from('email_segments') as any)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating segment:', error);
      return null;
    }

    return data;
  }

  // Delete segment
  async deleteSegment(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('email_segments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting segment:', error);
      return false;
    }

    return true;
  }

  // Get subscribers matching segment rules
  async getSegmentSubscribers(segment: Segment): Promise<Subscriber[]> {
    // Build query based on rules
    let query = supabase.from('email_subscribers').select('*');

    for (const rule of segment.rules) {
      query = this.applyRule(query, rule);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching segment subscribers:', error);
      return [];
    }

    return data || [];
  }

  // Count subscribers in segment
  async getSegmentCount(segment: Segment): Promise<number> {
    let query = supabase.from('email_subscribers').select('id', { count: 'exact', head: true });

    for (const rule of segment.rules) {
      query = this.applyRule(query, rule);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error counting segment:', error);
      return 0;
    }

    return count || 0;
  }

  // Preview segment (get sample of matching subscribers)
  async previewSegment(rules: SegmentRule[], limit: number = 10): Promise<Subscriber[]> {
    let query = supabase.from('email_subscribers').select('*').limit(limit);

    for (const rule of rules) {
      query = this.applyRule(query, rule);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error previewing segment:', error);
      return [];
    }

    return data || [];
  }

  // Apply a single rule to query
  private applyRule(query: any, rule: SegmentRule): any {
    const { field, operator, value } = rule;

    switch (operator) {
      case 'equals':
        return query.eq(field, value);
      case 'not_equals':
        return query.neq(field, value);
      case 'contains':
        return query.ilike(field, `%${value}%`);
      case 'not_contains':
        return query.not(field, 'ilike', `%${value}%`);
      case 'starts_with':
        return query.ilike(field, `${value}%`);
      case 'ends_with':
        return query.ilike(field, `%${value}`);
      case 'greater_than':
        return query.gt(field, value);
      case 'less_than':
        return query.lt(field, value);
      case 'in_list':
        return query.in(field, value as string[]);
      case 'not_in_list':
        return query.not(field, 'in', `(${(value as string[]).join(',')})`);
      case 'is_empty':
        return query.is(field, null);
      case 'is_not_empty':
        return query.not(field, 'is', null);
      case 'date_before':
        return query.lt(field, value);
      case 'date_after':
        return query.gt(field, value);
      case 'date_in_last':
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - (value as number));
        return query.gte(field, daysAgo.toISOString());
      default:
        return query;
    }
  }

  // Create segment from template
  async createFromTemplate(templateIndex: number): Promise<Segment | null> {
    const template = SEGMENT_TEMPLATES[templateIndex];
    if (!template) return null;
    return this.createSegment(template);
  }

  // Export segment as CSV
  async exportSegment(segmentId: string): Promise<string> {
    const segment = await this.getSegment(segmentId);
    if (!segment) return '';

    const subscribers = await this.getSegmentSubscribers(segment);

    const headers = ['email', 'name', 'status', 'open_count', 'click_count', 'created_at'];
    const rows = subscribers.map(sub =>
      headers.map(h => String(sub[h as keyof Subscriber] || '')).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }
}

// Export singleton instance
export const segmentManager = new SegmentManager();

export default segmentManager;
