/**
 * Email Segments Module Tests
 */

// Mock Supabase with inline mock factory
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Import the mocked module and get reference
import { supabase } from '../../lib/supabase';
const mockFrom = supabase.from as jest.Mock;

import {
  SegmentManager,
  SEGMENTATION_FIELDS,
  SEGMENT_TEMPLATES,
  type Segment,
  type SegmentRule,
} from '../../lib/email/segments';

describe('Email Segments Module', () => {
  let segmentManager: SegmentManager;

  beforeEach(() => {
    jest.clearAllMocks();
    segmentManager = new SegmentManager();

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    });
  });

  describe('SEGMENTATION_FIELDS', () => {
    it('should have subscriber fields', () => {
      expect(SEGMENTATION_FIELDS).toHaveProperty('email');
      expect(SEGMENTATION_FIELDS).toHaveProperty('name');
      expect(SEGMENTATION_FIELDS).toHaveProperty('status');
      expect(SEGMENTATION_FIELDS).toHaveProperty('created_at');
    });

    it('should have engagement fields', () => {
      expect(SEGMENTATION_FIELDS).toHaveProperty('open_count');
      expect(SEGMENTATION_FIELDS).toHaveProperty('click_count');
      expect(SEGMENTATION_FIELDS).toHaveProperty('last_opened_at');
      expect(SEGMENTATION_FIELDS).toHaveProperty('last_clicked_at');
    });

    it('should have list membership field', () => {
      expect(SEGMENTATION_FIELDS).toHaveProperty('lists');
    });

    it('should have custom attribute fields', () => {
      // Keys are literally 'attributes.source' not nested objects
      expect(SEGMENTATION_FIELDS['attributes.source']).toBeDefined();
      expect(SEGMENTATION_FIELDS['attributes.plan']).toBeDefined();
      expect(SEGMENTATION_FIELDS['attributes.company']).toBeDefined();
    });

    it('should have proper field types', () => {
      expect(SEGMENTATION_FIELDS.email.type).toBe('string');
      expect(SEGMENTATION_FIELDS.open_count.type).toBe('number');
      expect(SEGMENTATION_FIELDS.created_at.type).toBe('date');
      expect(SEGMENTATION_FIELDS.status.type).toBe('select');
    });
  });

  describe('SEGMENT_TEMPLATES', () => {
    it('should have predefined templates', () => {
      expect(SEGMENT_TEMPLATES.length).toBeGreaterThan(0);
    });

    it('should have Highly Engaged template', () => {
      const highlyEngaged = SEGMENT_TEMPLATES.find(t => t.name === 'Highly Engaged');
      expect(highlyEngaged).toBeDefined();
      expect(highlyEngaged?.rules[0].field).toBe('open_count');
      expect(highlyEngaged?.rules[0].operator).toBe('greater_than');
    });

    it('should have Inactive template', () => {
      const inactive = SEGMENT_TEMPLATES.find(t => t.name === 'Inactive (30 days)');
      expect(inactive).toBeDefined();
      expect(inactive?.rules[0].operator).toBe('date_in_last');
    });

    it('should have New Subscribers template', () => {
      const newSubs = SEGMENT_TEMPLATES.find(t => t.name === 'New Subscribers');
      expect(newSubs).toBeDefined();
      expect(newSubs?.rules[0].field).toBe('created_at');
    });

    it('should have Never Opened template', () => {
      const neverOpened = SEGMENT_TEMPLATES.find(t => t.name === 'Never Opened');
      expect(neverOpened).toBeDefined();
      expect(neverOpened?.rules[0].value).toBe(0);
    });

    it('should have Clickers template', () => {
      const clickers = SEGMENT_TEMPLATES.find(t => t.name === 'Clickers');
      expect(clickers).toBeDefined();
      expect(clickers?.rules[0].field).toBe('click_count');
    });

    it('all templates should have valid rule_operator', () => {
      SEGMENT_TEMPLATES.forEach(template => {
        expect(['and', 'or']).toContain(template.rule_operator);
      });
    });
  });

  describe('SegmentManager.getSegments', () => {
    it('should fetch all segments', async () => {
      const mockSegments = [
        { id: '1', name: 'Segment 1', rules: [] },
        { id: '2', name: 'Segment 2', rules: [] },
      ];

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockSegments, error: null }),
      });

      const result = await segmentManager.getSegments();

      expect(mockFrom).toHaveBeenCalledWith('email_segments');
      expect(result).toHaveLength(2);
    });

    it('should return empty array on error', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      });

      const result = await segmentManager.getSegments();

      expect(result).toEqual([]);
    });
  });

  describe('SegmentManager.getSegment', () => {
    it('should fetch single segment by ID', async () => {
      const mockSegment = { id: '1', name: 'Test Segment', rules: [] };

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockSegment, error: null }),
      });

      const result = await segmentManager.getSegment('1');

      expect(result).toEqual(mockSegment);
    });
  });

  describe('SegmentManager.createSegment', () => {
    it('should create new segment', async () => {
      const newSegment = {
        name: 'New Segment',
        rules: [{ field: 'open_count', operator: 'greater_than' as const, value: 5 }],
        rule_operator: 'and' as const,
      };

      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: '123', ...newSegment }, error: null }),
      });

      const result = await segmentManager.createSegment(newSegment);

      expect(result).toHaveProperty('id');
      expect(result?.name).toBe('New Segment');
    });
  });

  describe('SegmentManager.updateSegment', () => {
    it('should update segment', async () => {
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: '1', name: 'Updated' }, error: null }),
      });

      const result = await segmentManager.updateSegment('1', { name: 'Updated' });

      expect(result?.name).toBe('Updated');
    });
  });

  describe('SegmentManager.deleteSegment', () => {
    it('should delete segment', async () => {
      mockFrom.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const result = await segmentManager.deleteSegment('1');

      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      mockFrom.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'Error' } }),
      });

      const result = await segmentManager.deleteSegment('1');

      expect(result).toBe(false);
    });
  });

  describe('SegmentManager.getSegmentSubscribers', () => {
    it('should fetch subscribers matching segment rules', async () => {
      const mockSubscribers = [
        { id: '1', email: 'test@example.com', open_count: 10 },
      ];

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        gt: jest.fn().mockResolvedValue({ data: mockSubscribers, error: null }),
      });

      const segment: Segment = {
        id: '1',
        name: 'Test',
        rules: [{ field: 'open_count', operator: 'greater_than', value: 5 }],
        rule_operator: 'and',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = await segmentManager.getSegmentSubscribers(segment);

      expect(result).toHaveLength(1);
    });
  });

  describe('SegmentManager.getSegmentCount', () => {
    it('should return count of matching subscribers', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: 42, error: null }),
      });

      const segment: Segment = {
        id: '1',
        name: 'Test',
        rules: [{ field: 'status', operator: 'equals', value: 'active' }],
        rule_operator: 'and',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = await segmentManager.getSegmentCount(segment);

      expect(result).toBe(42);
    });
  });

  describe('SegmentManager.previewSegment', () => {
    it('should return sample of matching subscribers', async () => {
      const mockSubscribers = [
        { id: '1', email: 'test1@example.com' },
        { id: '2', email: 'test2@example.com' },
      ];

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockSubscribers, error: null }),
      });

      const rules: SegmentRule[] = [
        { field: 'status', operator: 'equals', value: 'active' },
      ];

      const result = await segmentManager.previewSegment(rules, 10);

      expect(result.length).toBeLessThanOrEqual(10);
    });
  });

  describe('SegmentManager.createFromTemplate', () => {
    it('should create segment from template', async () => {
      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: '123', name: 'Highly Engaged', rules: [] },
          error: null
        }),
      });

      const result = await segmentManager.createFromTemplate(0);

      expect(result).toHaveProperty('id');
    });

    it('should return null for invalid template index', async () => {
      const result = await segmentManager.createFromTemplate(999);

      expect(result).toBeNull();
    });
  });

  describe('SegmentManager.exportSegment', () => {
    it('should export segment subscribers as CSV', async () => {
      const mockSegment = {
        id: '1',
        name: 'Test',
        rules: [],
        rule_operator: 'and',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockSubscribers = [
        { email: 'test1@example.com', name: 'Test 1', status: 'active', open_count: 5, click_count: 2, created_at: '2024-01-01' },
        { email: 'test2@example.com', name: 'Test 2', status: 'active', open_count: 10, click_count: 5, created_at: '2024-01-02' },
      ];

      // First call for getSegment
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockSegment, error: null }),
      });

      // Second call for getSegmentSubscribers
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ data: mockSubscribers, error: null }),
      });

      const result = await segmentManager.exportSegment('1');

      expect(result).toContain('email,name,status');
      expect(result).toContain('test1@example.com');
      expect(result).toContain('test2@example.com');
    });

    it('should return empty string if segment not found', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      });

      const result = await segmentManager.exportSegment('invalid');

      expect(result).toBe('');
    });
  });

  describe('Rule Operators', () => {
    // Test that all operators are valid enum values
    it('should support all defined rule operators', () => {
      const operators: SegmentRule['operator'][] = [
        'equals',
        'not_equals',
        'contains',
        'starts_with',
        'ends_with',
        'greater_than',
        'less_than',
        'in_list',
        'is_empty',
        'is_not_empty',
        'date_before',
        'date_after',
        'date_in_last',
      ];

      operators.forEach(op => {
        const rule: SegmentRule = {
          field: 'test_field',
          operator: op,
          value: 'test_value',
        };
        expect(rule.operator).toBe(op);
      });
    });

    it('should create valid segment rules with different value types', () => {
      // String value
      const stringRule: SegmentRule = { field: 'email', operator: 'contains', value: 'example.com' };
      expect(stringRule.value).toBe('example.com');

      // Number value
      const numberRule: SegmentRule = { field: 'open_count', operator: 'greater_than', value: 5 };
      expect(numberRule.value).toBe(5);

      // Array value
      const arrayRule: SegmentRule = { field: 'status', operator: 'in_list', value: ['active', 'pending'] };
      expect(arrayRule.value).toEqual(['active', 'pending']);

      // Boolean value for is_empty
      const boolRule: SegmentRule = { field: 'name', operator: 'is_empty', value: true };
      expect(boolRule.value).toBe(true);
    });
  });
});
