/**
 * CRM Contact Management System
 * Inspired by Twenty CRM - A modern open-source CRM
 */

import { supabase } from '../supabase';

// =============================================================================
// Types
// =============================================================================

export type ContactStatus = 'lead' | 'prospect' | 'customer' | 'churned';

export type ActivityType = 'email' | 'call' | 'meeting' | 'note' | 'task';

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  avatar_url: string | null;
  tags: string[];
  custom_fields: Record<string, unknown>;
  lead_score: number;
  source: string | null;
  status: ContactStatus;
  created_at: string;
  updated_at: string;
  last_contacted_at: string | null;
  // Computed field
  full_name?: string;
}

export interface Activity {
  id: string;
  contact_id: string;
  type: ActivityType;
  title: string;
  description: string | null;
  date: string;
  metadata: Record<string, unknown>;
  created_at?: string;
}

export interface ContactFilters {
  status?: ContactStatus | ContactStatus[];
  tags?: string[];
  source?: string;
  search?: string;
  lead_score_min?: number;
  lead_score_max?: number;
  created_after?: string;
  created_before?: string;
  last_contacted_after?: string;
  last_contacted_before?: string;
}

export interface Pagination {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface CreateContactInput {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  job_title?: string | null;
  avatar_url?: string | null;
  tags?: string[];
  custom_fields?: Record<string, unknown>;
  lead_score?: number;
  source?: string | null;
  status?: ContactStatus;
}

export interface UpdateContactInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string | null;
  company?: string | null;
  job_title?: string | null;
  avatar_url?: string | null;
  tags?: string[];
  custom_fields?: Record<string, unknown>;
  lead_score?: number;
  source?: string | null;
  status?: ContactStatus;
  last_contacted_at?: string | null;
}

export interface CreateActivityInput {
  type: ActivityType;
  title: string;
  description?: string | null;
  date?: string;
  metadata?: Record<string, unknown>;
}

export interface CSVContactRow {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  tags?: string;
  source?: string;
  status?: string;
  [key: string]: string | undefined;
}

// =============================================================================
// ContactManager Class
// =============================================================================

export class ContactManager {
  private tableName = 'contacts';
  private activitiesTable = 'contact_activities';

  /**
   * Get contacts with optional filtering and pagination
   */
  async getContacts(
    filters?: ContactFilters,
    pagination?: Pagination
  ): Promise<PaginatedResult<Contact>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from(this.tableName)
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters) {
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status);
        } else {
          query = query.eq('status', filters.status);
        }
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      if (filters.source) {
        query = query.eq('source', filters.source);
      }

      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.or(
          `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},company.ilike.${searchTerm}`
        );
      }

      if (filters.lead_score_min !== undefined) {
        query = query.gte('lead_score', filters.lead_score_min);
      }

      if (filters.lead_score_max !== undefined) {
        query = query.lte('lead_score', filters.lead_score_max);
      }

      if (filters.created_after) {
        query = query.gte('created_at', filters.created_after);
      }

      if (filters.created_before) {
        query = query.lte('created_at', filters.created_before);
      }

      if (filters.last_contacted_after) {
        query = query.gte('last_contacted_at', filters.last_contacted_after);
      }

      if (filters.last_contacted_before) {
        query = query.lte('last_contacted_at', filters.last_contacted_before);
      }
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch contacts: ${error.message}`);
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: (data as Contact[]).map(this.enrichContact),
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  /**
   * Get a single contact by ID
   */
  async getContact(id: string): Promise<Contact | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch contact: ${error.message}`);
    }

    return this.enrichContact(data as Contact);
  }

  /**
   * Create a new contact
   */
  async createContact(contact: CreateContactInput): Promise<Contact> {
    const now = new Date().toISOString();

    const newContact = {
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone ?? null,
      company: contact.company ?? null,
      job_title: contact.job_title ?? null,
      avatar_url: contact.avatar_url ?? null,
      tags: contact.tags ?? [],
      custom_fields: contact.custom_fields ?? {},
      lead_score: contact.lead_score ?? 0,
      source: contact.source ?? null,
      status: contact.status ?? 'lead',
      created_at: now,
      updated_at: now,
      last_contacted_at: null,
    };

    const { data, error } = await (supabase
      .from(this.tableName) as any)
      .insert(newContact)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create contact: ${error.message}`);
    }

    return this.enrichContact(data as Contact);
  }

  /**
   * Update an existing contact
   */
  async updateContact(id: string, updates: UpdateContactInput): Promise<Contact> {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await (supabase
      .from(this.tableName) as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update contact: ${error.message}`);
    }

    return this.enrichContact(data as Contact);
  }

  /**
   * Delete a contact
   */
  async deleteContact(id: string): Promise<void> {
    // First delete all activities for this contact
    await supabase
      .from(this.activitiesTable)
      .delete()
      .eq('contact_id', id);

    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete contact: ${error.message}`);
    }
  }

  /**
   * Merge duplicate contacts into one
   * The first ID in the array becomes the primary contact
   */
  async mergeContacts(ids: string[]): Promise<Contact> {
    if (ids.length < 2) {
      throw new Error('At least 2 contact IDs are required for merging');
    }

    // Fetch all contacts to merge
    const { data: contacts, error: fetchError } = await supabase
      .from(this.tableName)
      .select('*')
      .in('id', ids);

    if (fetchError) {
      throw new Error(`Failed to fetch contacts for merge: ${fetchError.message}`);
    }

    if (!contacts || contacts.length < 2) {
      throw new Error('Could not find all contacts to merge');
    }

    const [primary, ...duplicates] = contacts as Contact[];
    const duplicateIds = duplicates.map(d => d.id);

    // Merge data: prefer non-null values from primary, then from duplicates
    const mergedTags = [...new Set([
      ...primary.tags,
      ...duplicates.flatMap(d => d.tags)
    ])];

    const mergedCustomFields = duplicates.reduce(
      (acc, dup) => ({ ...acc, ...dup.custom_fields }),
      { ...primary.custom_fields }
    );

    // Take the highest lead score
    const maxLeadScore = Math.max(
      primary.lead_score,
      ...duplicates.map(d => d.lead_score)
    );

    // Get the most recent last_contacted_at
    const allContactedDates = [primary.last_contacted_at, ...duplicates.map(d => d.last_contacted_at)]
      .filter((d): d is string => d !== null);
    const mostRecentContact = allContactedDates.length > 0
      ? allContactedDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
      : null;

    // Update primary contact with merged data
    const mergedData: UpdateContactInput = {
      phone: primary.phone ?? duplicates.find(d => d.phone)?.phone ?? null,
      company: primary.company ?? duplicates.find(d => d.company)?.company ?? null,
      job_title: primary.job_title ?? duplicates.find(d => d.job_title)?.job_title ?? null,
      avatar_url: primary.avatar_url ?? duplicates.find(d => d.avatar_url)?.avatar_url ?? null,
      tags: mergedTags,
      custom_fields: mergedCustomFields,
      lead_score: maxLeadScore,
      source: primary.source ?? duplicates.find(d => d.source)?.source ?? null,
      last_contacted_at: mostRecentContact,
    };

    // Update primary contact
    const updatedPrimary = await this.updateContact(primary.id, mergedData);

    // Move all activities from duplicates to primary
    await (supabase
      .from(this.activitiesTable) as any)
      .update({ contact_id: primary.id })
      .in('contact_id', duplicateIds);

    // Delete duplicate contacts
    await supabase
      .from(this.tableName)
      .delete()
      .in('id', duplicateIds);

    return updatedPrimary;
  }

  /**
   * Add a tag to a contact
   */
  async addTag(contactId: string, tag: string): Promise<Contact> {
    const contact = await this.getContact(contactId);

    if (!contact) {
      throw new Error('Contact not found');
    }

    if (contact.tags.includes(tag)) {
      return contact; // Tag already exists
    }

    return this.updateContact(contactId, {
      tags: [...contact.tags, tag],
    });
  }

  /**
   * Remove a tag from a contact
   */
  async removeTag(contactId: string, tag: string): Promise<Contact> {
    const contact = await this.getContact(contactId);

    if (!contact) {
      throw new Error('Contact not found');
    }

    return this.updateContact(contactId, {
      tags: contact.tags.filter(t => t !== tag),
    });
  }

  /**
   * Update the lead score for a contact
   */
  async updateLeadScore(contactId: string, score: number): Promise<Contact> {
    if (score < 0 || score > 100) {
      throw new Error('Lead score must be between 0 and 100');
    }

    return this.updateContact(contactId, {
      lead_score: score,
    });
  }

  /**
   * Get activities for a contact
   */
  async getActivities(contactId: string): Promise<Activity[]> {
    const { data, error } = await supabase
      .from(this.activitiesTable)
      .select('*')
      .eq('contact_id', contactId)
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch activities: ${error.message}`);
    }

    return data as Activity[];
  }

  /**
   * Add an activity to a contact
   */
  async addActivity(contactId: string, activity: CreateActivityInput): Promise<Activity> {
    const now = new Date().toISOString();

    const newActivity = {
      contact_id: contactId,
      type: activity.type,
      title: activity.title,
      description: activity.description ?? null,
      date: activity.date ?? now,
      metadata: activity.metadata ?? {},
      created_at: now,
    };

    const { data, error } = await (supabase
      .from(this.activitiesTable) as any)
      .insert(newActivity)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add activity: ${error.message}`);
    }

    // Update last_contacted_at if this is a communication activity
    if (['email', 'call', 'meeting'].includes(activity.type)) {
      await this.updateContact(contactId, {
        last_contacted_at: activity.date ?? now,
      });
    }

    return data as Activity;
  }

  /**
   * Full-text search across contacts
   */
  async searchContacts(query: string): Promise<Contact[]> {
    if (!query.trim()) {
      return [];
    }

    const searchTerm = `%${query.trim()}%`;

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .or(
        `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},company.ilike.${searchTerm},job_title.ilike.${searchTerm}`
      )
      .order('lead_score', { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(`Failed to search contacts: ${error.message}`);
    }

    return (data as Contact[]).map(this.enrichContact);
  }

  /**
   * Get all contacts with a specific tag
   */
  async getContactsByTag(tag: string): Promise<Contact[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .contains('tags', [tag])
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch contacts by tag: ${error.message}`);
    }

    return (data as Contact[]).map(this.enrichContact);
  }

  /**
   * Import contacts from CSV data
   */
  async importContacts(csv: string): Promise<{ imported: number; errors: string[] }> {
    const rows = this.parseCSV(csv);
    const errors: string[] = [];
    let imported = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        // Validate required fields
        if (!row.email) {
          errors.push(`Row ${i + 2}: Missing required field 'email'`);
          continue;
        }

        if (!row.first_name || !row.last_name) {
          errors.push(`Row ${i + 2}: Missing required fields 'first_name' or 'last_name'`);
          continue;
        }

        // Validate email format
        if (!this.isValidEmail(row.email)) {
          errors.push(`Row ${i + 2}: Invalid email format '${row.email}'`);
          continue;
        }

        // Parse tags (comma-separated)
        const tags = row.tags
          ? row.tags.split(',').map(t => t.trim()).filter(Boolean)
          : [];

        // Validate status
        const validStatuses: ContactStatus[] = ['lead', 'prospect', 'customer', 'churned'];
        const status = validStatuses.includes(row.status as ContactStatus)
          ? (row.status as ContactStatus)
          : 'lead';

        // Extract custom fields (any fields not in standard set)
        const standardFields = [
          'first_name', 'last_name', 'email', 'phone', 'company',
          'job_title', 'tags', 'source', 'status'
        ];
        const customFields: Record<string, unknown> = {};
        Object.keys(row).forEach(key => {
          if (!standardFields.includes(key) && row[key]) {
            customFields[key] = row[key];
          }
        });

        await this.createContact({
          first_name: row.first_name,
          last_name: row.last_name,
          email: row.email,
          phone: row.phone || null,
          company: row.company || null,
          job_title: row.job_title || null,
          tags,
          source: row.source || 'csv_import',
          status,
          custom_fields: Object.keys(customFields).length > 0 ? customFields : {},
        });

        imported++;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Row ${i + 2}: ${errorMessage}`);
      }
    }

    return { imported, errors };
  }

  /**
   * Export contacts to CSV format
   */
  async exportContacts(filters?: ContactFilters): Promise<string> {
    // Get all contacts matching filters (no pagination)
    let query = supabase
      .from(this.tableName)
      .select('*');

    if (filters) {
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status);
        } else {
          query = query.eq('status', filters.status);
        }
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      if (filters.source) {
        query = query.eq('source', filters.source);
      }

      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.or(
          `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},company.ilike.${searchTerm}`
        );
      }
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to export contacts: ${error.message}`);
    }

    const contacts = data as Contact[];

    // Define CSV headers
    const headers = [
      'first_name',
      'last_name',
      'email',
      'phone',
      'company',
      'job_title',
      'tags',
      'lead_score',
      'source',
      'status',
      'created_at',
      'updated_at',
      'last_contacted_at',
    ];

    // Build CSV string
    const csvRows = [headers.join(',')];

    for (const contact of contacts) {
      const row = [
        this.escapeCSVField(contact.first_name),
        this.escapeCSVField(contact.last_name),
        this.escapeCSVField(contact.email),
        this.escapeCSVField(contact.phone || ''),
        this.escapeCSVField(contact.company || ''),
        this.escapeCSVField(contact.job_title || ''),
        this.escapeCSVField(contact.tags.join(';')),
        contact.lead_score.toString(),
        this.escapeCSVField(contact.source || ''),
        contact.status,
        contact.created_at,
        contact.updated_at,
        contact.last_contacted_at || '',
      ];
      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Get all unique tags across all contacts
   */
  async getAllTags(): Promise<string[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('tags');

    if (error) {
      throw new Error(`Failed to fetch tags: ${error.message}`);
    }

    const allTags = (data as { tags: string[] }[])
      .flatMap(contact => contact.tags);

    return [...new Set(allTags)].sort();
  }

  /**
   * Get contact statistics
   */
  async getStats(): Promise<{
    total: number;
    byStatus: Record<ContactStatus, number>;
    averageLeadScore: number;
    recentlyContacted: number;
  }> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('status, lead_score, last_contacted_at');

    if (error) {
      throw new Error(`Failed to fetch stats: ${error.message}`);
    }

    const contacts = data as Pick<Contact, 'status' | 'lead_score' | 'last_contacted_at'>[];
    const total = contacts.length;

    const byStatus: Record<ContactStatus, number> = {
      lead: 0,
      prospect: 0,
      customer: 0,
      churned: 0,
    };

    let totalLeadScore = 0;
    let recentlyContacted = 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    contacts.forEach(contact => {
      byStatus[contact.status]++;
      totalLeadScore += contact.lead_score;

      if (contact.last_contacted_at && new Date(contact.last_contacted_at) > thirtyDaysAgo) {
        recentlyContacted++;
      }
    });

    return {
      total,
      byStatus,
      averageLeadScore: total > 0 ? totalLeadScore / total : 0,
      recentlyContacted,
    };
  }

  // =============================================================================
  // Private Helper Methods
  // =============================================================================

  private enrichContact(contact: Contact): Contact {
    return {
      ...contact,
      full_name: `${contact.first_name} ${contact.last_name}`.trim(),
    };
  }

  private parseCSV(csv: string): CSVContactRow[] {
    const lines = csv.trim().split('\n');

    if (lines.length < 2) {
      return [];
    }

    // Parse header
    const headers = this.parseCSVLine(lines[0]).map(h =>
      h.toLowerCase().trim().replace(/\s+/g, '_')
    );

    // Parse data rows
    const rows: CSVContactRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);

      if (values.length === 0) continue;

      const row: CSVContactRow = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || '';
      });

      rows.push(row);
    }

    return rows;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  private escapeCSVField(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Export singleton instance
export const contactManager = new ContactManager();
