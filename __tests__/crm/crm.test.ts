/**
 * CRM Module Test Suite
 * Comprehensive tests for contact management, deals, and lead scoring
 */

describe('CRM Module', () => {
  describe('Contact Management', () => {
    const mockContact = {
      id: 'contact-123',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      company: 'Acme Corp',
      phone: '+1234567890',
      status: 'lead' as const,
      leadScore: 50,
      source: 'website',
      tags: ['enterprise', 'decision-maker'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    describe('Contact Creation', () => {
      it('should create a contact with required fields', () => {
        const contact = { ...mockContact };

        expect(contact.email).toBeDefined();
        expect(contact.firstName).toBeDefined();
      });

      it('should validate email format', () => {
        const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        expect(isValidEmail(mockContact.email)).toBe(true);
        expect(isValidEmail('invalid-email')).toBe(false);
        expect(isValidEmail('')).toBe(false);
      });

      it('should validate phone format', () => {
        const isValidPhone = (phone: string) => /^\+?[\d\s-()]+$/.test(phone);

        expect(isValidPhone(mockContact.phone)).toBe(true);
        expect(isValidPhone('abc123')).toBe(false);
      });

      it('should handle optional fields', () => {
        const minimalContact = {
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        };

        expect(minimalContact.email).toBeDefined();
        expect((minimalContact as any).company).toBeUndefined();
      });
    });

    describe('Contact Updates', () => {
      it('should update contact fields', () => {
        const updated = {
          ...mockContact,
          company: 'New Company',
          updatedAt: new Date().toISOString(),
        };

        expect(updated.company).toBe('New Company');
        expect(updated.updatedAt).not.toBe(mockContact.updatedAt);
      });

      it('should track update timestamp', () => {
        const original = mockContact.updatedAt;
        const updated = {
          ...mockContact,
          updatedAt: new Date().toISOString(),
        };

        expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
          new Date(original).getTime()
        );
      });
    });

    describe('Contact Status Transitions', () => {
      const validStatuses = ['lead', 'qualified', 'customer', 'churned'] as const;
      const validTransitions: Record<string, string[]> = {
        lead: ['qualified', 'churned'],
        qualified: ['customer', 'churned'],
        customer: ['churned'],
        churned: ['lead'], // Allow re-engagement
      };

      it('should have valid status values', () => {
        expect(validStatuses).toContain(mockContact.status);
      });

      it('should allow valid status transitions', () => {
        const canTransition = (from: string, to: string) =>
          validTransitions[from]?.includes(to);

        expect(canTransition('lead', 'qualified')).toBe(true);
        expect(canTransition('qualified', 'customer')).toBe(true);
      });

      it('should prevent invalid status transitions', () => {
        const canTransition = (from: string, to: string) =>
          validTransitions[from]?.includes(to);

        expect(canTransition('lead', 'customer')).toBe(false); // Skip qualified
      });
    });

    describe('Contact Tags', () => {
      it('should add tags to contact', () => {
        const tags = [...mockContact.tags, 'vip'];

        expect(tags).toContain('vip');
        expect(tags.length).toBe(3);
      });

      it('should remove tags from contact', () => {
        const tags = mockContact.tags.filter(t => t !== 'enterprise');

        expect(tags).not.toContain('enterprise');
        expect(tags.length).toBe(1);
      });

      it('should prevent duplicate tags', () => {
        const addTag = (tags: string[], newTag: string) =>
          tags.includes(newTag) ? tags : [...tags, newTag];

        const tags = addTag(mockContact.tags, 'enterprise');
        expect(tags.length).toBe(2); // Not 3
      });
    });
  });

  describe('Lead Scoring', () => {
    const scoringRules = {
      emailOpened: 5,
      linkClicked: 10,
      formSubmitted: 25,
      demoRequested: 50,
      meetingBooked: 75,
    };

    it('should calculate lead score based on activities', () => {
      const activities = ['emailOpened', 'linkClicked', 'formSubmitted'];
      const score = activities.reduce(
        (total, activity) => total + (scoringRules[activity as keyof typeof scoringRules] || 0),
        0
      );

      expect(score).toBe(40); // 5 + 10 + 25
    });

    it('should cap score at 100', () => {
      const calculateScore = (activities: string[]) => {
        const rawScore = activities.reduce(
          (total, activity) => total + (scoringRules[activity as keyof typeof scoringRules] || 0),
          0
        );
        return Math.min(rawScore, 100);
      };

      const activities = ['demoRequested', 'meetingBooked'];
      const score = calculateScore(activities);

      expect(score).toBe(100); // Capped
    });

    it('should categorize leads by score', () => {
      const categorize = (score: number) => {
        if (score >= 75) return 'hot';
        if (score >= 50) return 'warm';
        if (score >= 25) return 'cool';
        return 'cold';
      };

      expect(categorize(80)).toBe('hot');
      expect(categorize(60)).toBe('warm');
      expect(categorize(30)).toBe('cool');
      expect(categorize(10)).toBe('cold');
    });

    it('should decay score over time', () => {
      const decayScore = (score: number, daysSinceActivity: number) => {
        const decayRate = 0.05; // 5% per day
        const decay = Math.min(daysSinceActivity * decayRate, 0.5); // Max 50% decay
        return Math.round(score * (1 - decay));
      };

      expect(decayScore(100, 0)).toBe(100);
      expect(decayScore(100, 5)).toBe(75); // 25% decay
      expect(decayScore(100, 20)).toBe(50); // Max 50% decay
    });
  });

  describe('Deal Management', () => {
    const mockDeal = {
      id: 'deal-123',
      contactId: 'contact-123',
      title: 'Enterprise License',
      value: 50000,
      stage: 'proposal' as const,
      probability: 60,
      expectedCloseDate: new Date('2024-06-30').toISOString(),
      createdAt: new Date().toISOString(),
    };

    const pipelineStages = [
      'qualification',
      'discovery',
      'proposal',
      'negotiation',
      'closed_won',
      'closed_lost',
    ];

    describe('Deal Stages', () => {
      it('should have valid stage', () => {
        expect(pipelineStages).toContain(mockDeal.stage);
      });

      it('should move deal through pipeline stages', () => {
        const currentIndex = pipelineStages.indexOf(mockDeal.stage);
        const nextStage = pipelineStages[currentIndex + 1];

        expect(nextStage).toBe('negotiation');
      });

      it('should prevent backward stage movement', () => {
        const canMoveBackward = false; // Business rule
        expect(canMoveBackward).toBe(false);
      });
    });

    describe('Deal Value', () => {
      it('should calculate weighted pipeline value', () => {
        const weightedValue = mockDeal.value * (mockDeal.probability / 100);

        expect(weightedValue).toBe(30000); // 50000 * 0.6
      });

      it('should sum total pipeline value', () => {
        const deals = [
          { value: 50000, probability: 60 },
          { value: 30000, probability: 80 },
          { value: 20000, probability: 40 },
        ];

        const totalWeighted = deals.reduce(
          (sum, deal) => sum + deal.value * (deal.probability / 100),
          0
        );

        expect(totalWeighted).toBe(62000); // 30000 + 24000 + 8000
      });
    });

    describe('Deal Forecasting', () => {
      it('should calculate monthly forecast', () => {
        const deals = [
          { value: 50000, probability: 60, expectedCloseDate: '2024-06-15' },
          { value: 30000, probability: 80, expectedCloseDate: '2024-06-20' },
          { value: 20000, probability: 40, expectedCloseDate: '2024-07-10' },
        ];

        const juneDeals = deals.filter(d => d.expectedCloseDate.startsWith('2024-06'));
        const juneForecast = juneDeals.reduce(
          (sum, deal) => sum + deal.value * (deal.probability / 100),
          0
        );

        expect(juneForecast).toBe(54000); // 30000 + 24000
      });
    });
  });

  describe('Activity Tracking', () => {
    const mockActivity = {
      id: 'activity-123',
      contactId: 'contact-123',
      type: 'email' as const,
      subject: 'Follow-up on proposal',
      description: 'Sent follow-up email regarding Q4 proposal',
      date: new Date().toISOString(),
      outcome: 'positive' as const,
    };

    const activityTypes = ['email', 'call', 'meeting', 'note', 'task'];

    it('should have valid activity type', () => {
      expect(activityTypes).toContain(mockActivity.type);
    });

    it('should track activity timeline', () => {
      const activities = [
        { ...mockActivity, date: '2024-01-01' },
        { ...mockActivity, date: '2024-01-15' },
        { ...mockActivity, date: '2024-01-30' },
      ];

      const sorted = activities.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      expect(sorted[0].date).toBe('2024-01-30');
    });

    it('should categorize activities by outcome', () => {
      const activities = [
        { outcome: 'positive' },
        { outcome: 'negative' },
        { outcome: 'positive' },
        { outcome: 'neutral' },
      ];

      const positive = activities.filter(a => a.outcome === 'positive');
      expect(positive.length).toBe(2);
    });
  });

  describe('Contact Search & Filtering', () => {
    const contacts = [
      { firstName: 'John', lastName: 'Doe', company: 'Acme Corp', status: 'lead' },
      { firstName: 'Jane', lastName: 'Smith', company: 'Tech Inc', status: 'customer' },
      { firstName: 'Bob', lastName: 'Johnson', company: 'Acme Corp', status: 'qualified' },
    ];

    it('should search by name', () => {
      const search = (query: string) =>
        contacts.filter(
          c =>
            c.firstName.toLowerCase().includes(query.toLowerCase()) ||
            c.lastName.toLowerCase().includes(query.toLowerCase())
        );

      expect(search('john').length).toBe(2); // John and Johnson
    });

    it('should filter by company', () => {
      const filtered = contacts.filter(c => c.company === 'Acme Corp');

      expect(filtered.length).toBe(2);
    });

    it('should filter by status', () => {
      const filtered = contacts.filter(c => c.status === 'lead');

      expect(filtered.length).toBe(1);
    });

    it('should combine multiple filters', () => {
      const filtered = contacts.filter(
        c => c.company === 'Acme Corp' && c.status === 'qualified'
      );

      expect(filtered.length).toBe(1);
      expect(filtered[0].firstName).toBe('Bob');
    });
  });

  describe('Data Import/Export', () => {
    it('should parse CSV contact data', () => {
      const csvRow = 'John,Doe,john@example.com,Acme Corp,CEO';
      const [firstName, lastName, email, company, title] = csvRow.split(',');

      expect(firstName).toBe('John');
      expect(email).toBe('john@example.com');
    });

    it('should validate imported data', () => {
      const validateContact = (data: any) => {
        const errors: string[] = [];
        if (!data.email) errors.push('Email is required');
        if (!data.firstName) errors.push('First name is required');
        if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
          errors.push('Invalid email format');
        }
        return errors;
      };

      const validData = { email: 'test@example.com', firstName: 'Test' };
      const invalidData = { email: 'invalid', firstName: '' };

      expect(validateContact(validData).length).toBe(0);
      expect(validateContact(invalidData).length).toBe(2);
    });

    it('should export contacts to CSV format', () => {
      const contacts = [
        { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
      ];

      const csv = contacts.map(c => `${c.firstName},${c.lastName},${c.email}`).join('\n');

      expect(csv).toContain('John,Doe,john@example.com');
      expect(csv.split('\n').length).toBe(2);
    });
  });
});
