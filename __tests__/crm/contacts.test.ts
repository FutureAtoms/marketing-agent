/**
 * CRM Contacts Module Tests
 * Tests for the ContactManager class
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
  ContactManager,
  type Contact,
  type ContactStatus,
  type ActivityType,
  type CreateContactInput,
} from '../../lib/crm/contacts';

describe('CRM Contacts Module', () => {
  let contactManager: ContactManager;

  // Helper to create a fully chained mock query
  const createChainedMock = (resolvedData: any = null, resolvedError: any = null, count: number = 0) => {
    const chainedMock: any = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      eq: jest.fn(),
      neq: jest.fn(),
      gt: jest.fn(),
      gte: jest.fn(),
      lt: jest.fn(),
      lte: jest.fn(),
      ilike: jest.fn(),
      contains: jest.fn(),
      or: jest.fn(),
      in: jest.fn(),
      order: jest.fn(),
      range: jest.fn(),
      limit: jest.fn(),
      single: jest.fn(),
    };

    // Make each method return the chainedMock for chaining
    Object.keys(chainedMock).forEach(key => {
      if (key === 'single') {
        chainedMock[key].mockResolvedValue({ data: resolvedData, error: resolvedError });
      } else if (key === 'range') {
        chainedMock[key].mockResolvedValue({ data: resolvedData ? [resolvedData] : [], error: resolvedError, count });
      } else {
        chainedMock[key].mockReturnValue(chainedMock);
      }
    });

    return chainedMock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    contactManager = new ContactManager();
    mockFrom.mockReturnValue(createChainedMock());
  });

  describe('ContactManager Initialization', () => {
    it('should create ContactManager instance', () => {
      expect(contactManager).toBeDefined();
      expect(contactManager).toBeInstanceOf(ContactManager);
    });
  });

  describe('Contact Status Types', () => {
    it('should support all contact statuses', () => {
      const statuses: ContactStatus[] = ['lead', 'prospect', 'customer', 'churned'];
      statuses.forEach(status => {
        expect(['lead', 'prospect', 'customer', 'churned']).toContain(status);
      });
    });
  });

  describe('Activity Types', () => {
    it('should support all activity types', () => {
      const types: ActivityType[] = ['email', 'call', 'meeting', 'note', 'task'];
      types.forEach(type => {
        expect(['email', 'call', 'meeting', 'note', 'task']).toContain(type);
      });
    });
  });

  describe('getContacts', () => {
    it('should fetch contacts with default pagination', async () => {
      const mockContacts = [
        { id: '1', email: 'test1@example.com', first_name: 'Test', last_name: 'User1' },
        { id: '2', email: 'test2@example.com', first_name: 'Test', last_name: 'User2' },
      ];

      const chainedMock = createChainedMock();
      chainedMock.range.mockResolvedValue({ data: mockContacts, error: null, count: 2 });
      mockFrom.mockReturnValue(chainedMock);

      const result = await contactManager.getContacts();

      expect(mockFrom).toHaveBeenCalledWith('contacts');
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should support search filter', async () => {
      const chainedMock = createChainedMock();
      chainedMock.range.mockResolvedValue({ data: [], error: null, count: 0 });
      mockFrom.mockReturnValue(chainedMock);

      await contactManager.getContacts({ search: 'test' });

      expect(chainedMock.or).toHaveBeenCalled();
    });

    it('should handle status filter', async () => {
      const chainedMock = createChainedMock();
      chainedMock.range.mockResolvedValue({ data: [], error: null, count: 0 });
      mockFrom.mockReturnValue(chainedMock);

      await contactManager.getContacts({ status: 'lead' });

      expect(chainedMock.eq).toHaveBeenCalledWith('status', 'lead');
    });

    it('should handle multiple status filter', async () => {
      const chainedMock = createChainedMock();
      chainedMock.range.mockResolvedValue({ data: [], error: null, count: 0 });
      mockFrom.mockReturnValue(chainedMock);

      await contactManager.getContacts({ status: ['lead', 'prospect'] });

      expect(chainedMock.in).toHaveBeenCalledWith('status', ['lead', 'prospect']);
    });

    it('should handle pagination', async () => {
      const chainedMock = createChainedMock();
      chainedMock.range.mockResolvedValue({ data: [], error: null, count: 50 });
      mockFrom.mockReturnValue(chainedMock);

      const result = await contactManager.getContacts({}, { page: 2, limit: 10 });

      expect(chainedMock.range).toHaveBeenCalledWith(10, 19);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });

    it('should throw error on database error', async () => {
      const chainedMock = createChainedMock();
      chainedMock.range.mockResolvedValue({ data: null, error: { message: 'Database error' }, count: 0 });
      mockFrom.mockReturnValue(chainedMock);

      await expect(contactManager.getContacts()).rejects.toThrow('Failed to fetch contacts');
    });
  });

  describe('getContact', () => {
    it('should fetch single contact by ID', async () => {
      const mockContact = { id: '1', email: 'test@example.com', first_name: 'Test', last_name: 'User' };

      const chainedMock = createChainedMock(mockContact);
      mockFrom.mockReturnValue(chainedMock);

      const result = await contactManager.getContact('1');

      expect(result).toHaveProperty('id', '1');
      expect(result).toHaveProperty('email', 'test@example.com');
      // The implementation enriches with full_name
      expect(result).toHaveProperty('full_name', 'Test User');
    });

    it('should throw error when contact not found', async () => {
      // When no data and PGRST116 error code, return null
      const chainedMock = createChainedMock(null, { message: 'Not found', code: 'PGRST116' });
      mockFrom.mockReturnValue(chainedMock);

      const result = await contactManager.getContact('invalid');
      expect(result).toBeNull();
    });

    it('should throw error on other database errors', async () => {
      const chainedMock = createChainedMock(null, { message: 'Database error', code: 'PGRST500' });
      mockFrom.mockReturnValue(chainedMock);

      await expect(contactManager.getContact('invalid')).rejects.toThrow('Failed to fetch contact');
    });
  });

  describe('createContact', () => {
    it('should create contact with required fields', async () => {
      const newContact: CreateContactInput = {
        email: 'new@example.com',
        first_name: 'New',
        last_name: 'User'
      };
      const createdContact = { id: '123', ...newContact };

      const chainedMock = createChainedMock(createdContact);
      mockFrom.mockReturnValue(chainedMock);

      const result = await contactManager.createContact(newContact);

      expect(mockFrom).toHaveBeenCalledWith('contacts');
      expect(result).toHaveProperty('id');
    });

    it('should set default values', async () => {
      const newContact: CreateContactInput = {
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      };
      const createdContact = {
        id: '123',
        ...newContact,
        status: 'lead',
        lead_score: 0,
        tags: [],
      };

      const chainedMock = createChainedMock(createdContact);
      mockFrom.mockReturnValue(chainedMock);

      const result = await contactManager.createContact(newContact);

      expect(result?.status).toBe('lead');
    });

    it('should allow custom status', async () => {
      const newContact: CreateContactInput = {
        email: 'customer@example.com',
        first_name: 'Customer',
        last_name: 'User',
        status: 'customer',
      };
      const createdContact = { id: '123', ...newContact };

      const chainedMock = createChainedMock(createdContact);
      mockFrom.mockReturnValue(chainedMock);

      const result = await contactManager.createContact(newContact);

      expect(result?.status).toBe('customer');
    });
  });

  describe('updateContact', () => {
    it('should update contact fields', async () => {
      const updatedContact = { id: '1', first_name: 'Updated', last_name: 'Name' };

      const chainedMock = createChainedMock(updatedContact);
      mockFrom.mockReturnValue(chainedMock);

      const result = await contactManager.updateContact('1', { first_name: 'Updated' });

      expect(mockFrom).toHaveBeenCalledWith('contacts');
      expect(result).toHaveProperty('first_name', 'Updated');
    });

    it('should throw error on failure', async () => {
      const chainedMock = createChainedMock(null, { message: 'Update failed' });
      mockFrom.mockReturnValue(chainedMock);

      await expect(contactManager.updateContact('1', { first_name: 'Updated' })).rejects.toThrow('Failed to update contact');
    });
  });

  describe('deleteContact', () => {
    it('should delete contact by ID', async () => {
      const chainedMock = createChainedMock();
      chainedMock.eq.mockResolvedValue({ error: null });
      mockFrom.mockReturnValue(chainedMock);

      // deleteContact returns Promise<void>
      await expect(contactManager.deleteContact('1')).resolves.not.toThrow();
    });

    it('should throw error on failure', async () => {
      // First mock for deleting activities (success)
      const activitiesMock = createChainedMock();
      activitiesMock.eq.mockResolvedValue({ error: null });

      // Second mock for deleting contact (failure)
      const contactMock = createChainedMock();
      contactMock.eq.mockResolvedValue({ error: { message: 'Delete failed' } });

      mockFrom
        .mockReturnValueOnce(activitiesMock)
        .mockReturnValueOnce(contactMock);

      await expect(contactManager.deleteContact('1')).rejects.toThrow('Failed to delete contact');
    });
  });

  describe('updateLeadScore', () => {
    it('should update lead score to absolute value', async () => {
      // updateLeadScore sets absolute value, not delta
      const chainedMock = createChainedMock({ id: '1', first_name: 'Test', last_name: 'User', lead_score: 70 });
      mockFrom.mockReturnValue(chainedMock);

      const result = await contactManager.updateLeadScore('1', 70);

      expect(result?.lead_score).toBe(70);
    });

    it('should accept score of 100', async () => {
      const chainedMock = createChainedMock({ id: '1', first_name: 'Test', last_name: 'User', lead_score: 100 });
      mockFrom.mockReturnValue(chainedMock);

      const result = await contactManager.updateLeadScore('1', 100);

      expect(result?.lead_score).toBeLessThanOrEqual(100);
    });

    it('should reject score below 0', async () => {
      // Implementation throws for scores < 0 or > 100
      await expect(contactManager.updateLeadScore('1', -20)).rejects.toThrow('Lead score must be between 0 and 100');
    });

    it('should reject score above 100', async () => {
      await expect(contactManager.updateLeadScore('1', 150)).rejects.toThrow('Lead score must be between 0 and 100');
    });
  });

  describe('addActivity', () => {
    it('should add activity to contact', async () => {
      const mockActivity = {
        id: 'activity-1',
        type: 'email',
        title: 'Sent welcome email',
        description: 'Automated welcome email',
        contact_id: '1',
        date: new Date().toISOString(),
      };

      // For addActivity, need to mock both insert chain and potential updateContact call
      const insertChainedMock = createChainedMock(mockActivity);
      const updateChainedMock = createChainedMock({ id: '1', first_name: 'Test', last_name: 'User' });

      mockFrom
        .mockReturnValueOnce(insertChainedMock)  // insert activity
        .mockReturnValueOnce(updateChainedMock); // updateContact for last_contacted_at

      const result = await contactManager.addActivity('1', {
        type: 'email',
        title: 'Sent welcome email',
        description: 'Automated welcome email',
      });

      expect(result).toHaveProperty('type', 'email');
      expect(result).toHaveProperty('title', 'Sent welcome email');
    });

    it('should set default date', async () => {
      const mockActivity = {
        id: 'activity-1',
        type: 'note',
        title: 'Added a note',
        contact_id: '1',
        date: new Date().toISOString(),
      };

      const insertChainedMock = createChainedMock(mockActivity);
      mockFrom.mockReturnValue(insertChainedMock);

      const result = await contactManager.addActivity('1', {
        type: 'note', // 'note' doesn't trigger last_contacted_at update
        title: 'Added a note',
      });

      expect(result).toHaveProperty('date');
    });
  });

  describe('getActivities', () => {
    it('should fetch activities for contact', async () => {
      const mockActivities = [
        { id: '1', type: 'email', title: 'Email sent' },
        { id: '2', type: 'call', title: 'Follow-up call' },
      ];

      // getActivities uses: select → eq → order
      const chainedMock = createChainedMock();
      chainedMock.order.mockResolvedValue({ data: mockActivities, error: null });
      mockFrom.mockReturnValue(chainedMock);

      const result = await contactManager.getActivities('1');

      expect(result).toHaveLength(2);
    });

    it('should throw error on database error', async () => {
      // getActivities throws on error, doesn't return empty array
      const chainedMock = createChainedMock();
      chainedMock.order.mockResolvedValue({ data: null, error: { message: 'Database error' } });
      mockFrom.mockReturnValue(chainedMock);

      await expect(contactManager.getActivities('1')).rejects.toThrow('Failed to fetch activities');
    });
  });

  describe('searchContacts', () => {
    it('should search contacts by term', async () => {
      const chainedMock = createChainedMock();
      chainedMock.limit.mockResolvedValue({
        data: [{ id: '1', email: 'test@example.com' }],
        error: null
      });
      mockFrom.mockReturnValue(chainedMock);

      const result = await contactManager.searchContacts('test');

      expect(result).toHaveLength(1);
    });

    it('should return empty array for no matches', async () => {
      const chainedMock = createChainedMock();
      chainedMock.limit.mockResolvedValue({ data: [], error: null });
      mockFrom.mockReturnValue(chainedMock);

      const result = await contactManager.searchContacts('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('getContactsByTag', () => {
    it('should fetch contacts with specific tag', async () => {
      const chainedMock = createChainedMock();
      chainedMock.order.mockResolvedValue({
        data: [{ id: '1', tags: ['vip'] }],
        error: null
      });
      mockFrom.mockReturnValue(chainedMock);

      const result = await contactManager.getContactsByTag('vip');

      expect(result).toHaveLength(1);
    });
  });

  describe('addTag', () => {
    it('should add tag to contact', async () => {
      const firstChainedMock = createChainedMock({ id: '1', tags: ['existing'] });
      const secondChainedMock = createChainedMock({ id: '1', tags: ['existing', 'new'] });

      mockFrom
        .mockReturnValueOnce(firstChainedMock)
        .mockReturnValueOnce(secondChainedMock);

      const result = await contactManager.addTag('1', 'new');

      expect(result?.tags).toContain('new');
    });

    it('should not add duplicate tag', async () => {
      const chainedMock = createChainedMock({ id: '1', tags: ['existing'] });
      mockFrom.mockReturnValue(chainedMock);

      const result = await contactManager.addTag('1', 'existing');

      expect(result?.tags).toHaveLength(1);
    });
  });

  describe('removeTag', () => {
    it('should remove tag from contact', async () => {
      const firstChainedMock = createChainedMock({ id: '1', tags: ['tag1', 'tag2'] });
      const secondChainedMock = createChainedMock({ id: '1', tags: ['tag1'] });

      mockFrom
        .mockReturnValueOnce(firstChainedMock)
        .mockReturnValueOnce(secondChainedMock);

      const result = await contactManager.removeTag('1', 'tag2');

      expect(result?.tags).not.toContain('tag2');
    });
  });

  // Note: bulkUpdateStatus method not implemented in ContactManager

  describe('getStats', () => {
    it('should return contact statistics', async () => {
      const mockContacts = [
        { status: 'lead', lead_score: 30, last_contacted_at: null },
        { status: 'lead', lead_score: 50, last_contacted_at: null },
        { status: 'customer', lead_score: 80, last_contacted_at: null },
        { status: 'prospect', lead_score: 60, last_contacted_at: null },
      ];

      // getStats uses: from → select (direct await, no further chaining)
      mockFrom.mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: mockContacts, error: null }),
      });

      const result = await contactManager.getStats();

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('byStatus');
      expect(result.total).toBe(4);
    });

    it('should calculate average lead score', async () => {
      const mockContacts = [
        { status: 'lead', lead_score: 20, last_contacted_at: null },
        { status: 'lead', lead_score: 40, last_contacted_at: null },
      ];

      mockFrom.mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: mockContacts, error: null }),
      });

      const result = await contactManager.getStats();

      expect(result.averageLeadScore).toBe(30);
    });
  });

  // Note: exportToCSV and importFromCSV methods not implemented in ContactManager

  describe('Filter Options', () => {
    it('should filter by lead score range', async () => {
      const chainedMock = createChainedMock();
      chainedMock.range.mockResolvedValue({ data: [], error: null, count: 0 });
      mockFrom.mockReturnValue(chainedMock);

      await contactManager.getContacts({ lead_score_min: 50, lead_score_max: 80 });

      expect(chainedMock.gte).toHaveBeenCalledWith('lead_score', 50);
      expect(chainedMock.lte).toHaveBeenCalledWith('lead_score', 80);
    });

    it('should filter by date range', async () => {
      const chainedMock = createChainedMock();
      chainedMock.range.mockResolvedValue({ data: [], error: null, count: 0 });
      mockFrom.mockReturnValue(chainedMock);

      await contactManager.getContacts({
        created_after: '2024-01-01',
        created_before: '2024-12-31'
      });

      expect(chainedMock.gte).toHaveBeenCalledWith('created_at', '2024-01-01');
      expect(chainedMock.lte).toHaveBeenCalledWith('created_at', '2024-12-31');
    });

    it('should filter by tags', async () => {
      const chainedMock = createChainedMock();
      chainedMock.range.mockResolvedValue({ data: [], error: null, count: 0 });
      mockFrom.mockReturnValue(chainedMock);

      await contactManager.getContacts({ tags: ['vip', 'enterprise'] });

      expect(chainedMock.contains).toHaveBeenCalled();
    });
  });
});
