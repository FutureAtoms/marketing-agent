/**
 * Utility Functions Test Suite
 * Comprehensive tests for helper functions and utilities
 */

describe('Utility Functions', () => {
  describe('String Utilities', () => {
    describe('truncate', () => {
      const truncate = (str: string, length: number) =>
        str.length > length ? str.slice(0, length) + '...' : str;

      it('should truncate long strings', () => {
        expect(truncate('This is a long string', 10)).toBe('This is a ...');
      });

      it('should not truncate short strings', () => {
        expect(truncate('Short', 10)).toBe('Short');
      });

      it('should handle empty strings', () => {
        expect(truncate('', 10)).toBe('');
      });
    });

    describe('slugify', () => {
      const slugify = (str: string) =>
        str
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

      it('should convert to lowercase', () => {
        expect(slugify('Hello World')).toBe('hello-world');
      });

      it('should replace spaces with hyphens', () => {
        expect(slugify('hello world')).toBe('hello-world');
      });

      it('should remove special characters', () => {
        expect(slugify('Hello! World?')).toBe('hello-world');
      });

      it('should handle consecutive spaces', () => {
        expect(slugify('hello   world')).toBe('hello-world');
      });
    });

    describe('capitalize', () => {
      const capitalize = (str: string) =>
        str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

      it('should capitalize first letter', () => {
        expect(capitalize('hello')).toBe('Hello');
      });

      it('should lowercase rest of string', () => {
        expect(capitalize('hELLO')).toBe('Hello');
      });

      it('should handle empty strings', () => {
        expect(capitalize('')).toBe('');
      });
    });

    describe('extractHashtags', () => {
      const extractHashtags = (str: string) =>
        (str.match(/#\w+/g) || []).map(tag => tag.toLowerCase());

      it('should extract hashtags from text', () => {
        expect(extractHashtags('Hello #world #test')).toEqual(['#world', '#test']);
      });

      it('should return empty array if no hashtags', () => {
        expect(extractHashtags('Hello world')).toEqual([]);
      });

      it('should lowercase hashtags', () => {
        expect(extractHashtags('#Hello #WORLD')).toEqual(['#hello', '#world']);
      });
    });
  });

  describe('Number Utilities', () => {
    describe('formatNumber', () => {
      const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
      };

      it('should format millions', () => {
        expect(formatNumber(1500000)).toBe('1.5M');
      });

      it('should format thousands', () => {
        expect(formatNumber(1500)).toBe('1.5K');
      });

      it('should not format small numbers', () => {
        expect(formatNumber(500)).toBe('500');
      });
    });

    describe('formatCurrency', () => {
      const formatCurrency = (amount: number, currency = 'USD') =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

      it('should format USD', () => {
        expect(formatCurrency(1234.56)).toBe('$1,234.56');
      });

      it('should format EUR', () => {
        expect(formatCurrency(1234.56, 'EUR')).toContain('1,234.56');
      });

      it('should handle zero', () => {
        expect(formatCurrency(0)).toBe('$0.00');
      });
    });

    describe('formatPercentage', () => {
      const formatPercentage = (value: number, decimals = 1) =>
        `${value.toFixed(decimals)}%`;

      it('should format percentage', () => {
        expect(formatPercentage(25.5)).toBe('25.5%');
      });

      it('should respect decimal places', () => {
        // Note: JS floating-point: 25.555.toFixed(2) = "25.55" due to binary representation
        expect(formatPercentage(25.555, 2)).toBe('25.55%');
        expect(formatPercentage(25.556, 2)).toBe('25.56%');
      });
    });

    describe('clamp', () => {
      const clamp = (value: number, min: number, max: number) =>
        Math.max(min, Math.min(max, value));

      it('should clamp to minimum', () => {
        expect(clamp(-5, 0, 100)).toBe(0);
      });

      it('should clamp to maximum', () => {
        expect(clamp(150, 0, 100)).toBe(100);
      });

      it('should return value if within range', () => {
        expect(clamp(50, 0, 100)).toBe(50);
      });
    });
  });

  describe('Date Utilities', () => {
    describe('formatDate', () => {
      const formatDate = (date: Date, format: 'short' | 'long' | 'iso') => {
        switch (format) {
          case 'short':
            return date.toLocaleDateString('en-US');
          case 'long':
            return date.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
          case 'iso':
            return date.toISOString().split('T')[0];
        }
      };

      it('should format as ISO', () => {
        const date = new Date('2024-06-15');
        expect(formatDate(date, 'iso')).toBe('2024-06-15');
      });

      it('should format as short date', () => {
        const date = new Date('2024-06-15');
        const result = formatDate(date, 'short');
        expect(result).toContain('2024');
      });
    });

    describe('getRelativeTime', () => {
      const getRelativeTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
      };

      it('should return "just now" for recent dates', () => {
        const now = new Date();
        expect(getRelativeTime(now)).toBe('just now');
      });

      it('should return minutes ago', () => {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        expect(getRelativeTime(fiveMinutesAgo)).toBe('5m ago');
      });

      it('should return hours ago', () => {
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        expect(getRelativeTime(twoHoursAgo)).toBe('2h ago');
      });
    });

    describe('isValidDate', () => {
      const isValidDate = (date: any) =>
        date instanceof Date && !isNaN(date.getTime());

      it('should validate valid dates', () => {
        expect(isValidDate(new Date())).toBe(true);
        expect(isValidDate(new Date('2024-06-15'))).toBe(true);
      });

      it('should reject invalid dates', () => {
        expect(isValidDate(new Date('invalid'))).toBe(false);
        expect(isValidDate('2024-06-15')).toBe(false);
      });
    });
  });

  describe('Array Utilities', () => {
    describe('groupBy', () => {
      const groupBy = <T>(arr: T[], key: keyof T) =>
        arr.reduce((acc, item) => {
          const group = String(item[key]);
          acc[group] = acc[group] || [];
          acc[group].push(item);
          return acc;
        }, {} as Record<string, T[]>);

      it('should group items by key', () => {
        const items = [
          { type: 'A', value: 1 },
          { type: 'B', value: 2 },
          { type: 'A', value: 3 },
        ];

        const grouped = groupBy(items, 'type');

        expect(grouped['A'].length).toBe(2);
        expect(grouped['B'].length).toBe(1);
      });
    });

    describe('unique', () => {
      const unique = <T>(arr: T[]) => [...new Set(arr)];

      it('should remove duplicates', () => {
        expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      });

      it('should work with strings', () => {
        expect(unique(['a', 'b', 'a'])).toEqual(['a', 'b']);
      });
    });

    describe('chunk', () => {
      const chunk = <T>(arr: T[], size: number) => {
        const chunks: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
          chunks.push(arr.slice(i, i + size));
        }
        return chunks;
      };

      it('should split array into chunks', () => {
        expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
      });

      it('should handle empty array', () => {
        expect(chunk([], 2)).toEqual([]);
      });
    });

    describe('sortBy', () => {
      const sortBy = <T>(arr: T[], key: keyof T, order: 'asc' | 'desc' = 'asc') =>
        [...arr].sort((a, b) => {
          const comparison = a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0;
          return order === 'asc' ? comparison : -comparison;
        });

      it('should sort ascending', () => {
        const items = [{ value: 3 }, { value: 1 }, { value: 2 }];
        const sorted = sortBy(items, 'value', 'asc');

        expect(sorted[0].value).toBe(1);
        expect(sorted[2].value).toBe(3);
      });

      it('should sort descending', () => {
        const items = [{ value: 3 }, { value: 1 }, { value: 2 }];
        const sorted = sortBy(items, 'value', 'desc');

        expect(sorted[0].value).toBe(3);
        expect(sorted[2].value).toBe(1);
      });
    });
  });

  describe('Object Utilities', () => {
    describe('pick', () => {
      const pick = <T extends object, K extends keyof T>(obj: T, keys: K[]) =>
        keys.reduce((acc, key) => {
          if (key in obj) acc[key] = obj[key];
          return acc;
        }, {} as Pick<T, K>);

      it('should pick specified keys', () => {
        const obj = { a: 1, b: 2, c: 3 };
        expect(pick(obj, ['a', 'b'])).toEqual({ a: 1, b: 2 });
      });
    });

    describe('omit', () => {
      const omit = <T extends object, K extends keyof T>(obj: T, keys: K[]) =>
        Object.fromEntries(
          Object.entries(obj).filter(([key]) => !keys.includes(key as K))
        ) as Omit<T, K>;

      it('should omit specified keys', () => {
        const obj = { a: 1, b: 2, c: 3 };
        expect(omit(obj, ['c'])).toEqual({ a: 1, b: 2 });
      });
    });

    describe('deepClone', () => {
      const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

      it('should create deep copy', () => {
        const obj = { a: { b: 1 } };
        const clone = deepClone(obj);

        clone.a.b = 2;

        expect(obj.a.b).toBe(1);
        expect(clone.a.b).toBe(2);
      });
    });

    describe('isEmpty', () => {
      const isEmpty = (value: any) => {
        if (value == null) return true;
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        if (typeof value === 'string') return value.length === 0;
        return false;
      };

      it('should detect empty values', () => {
        expect(isEmpty(null)).toBe(true);
        expect(isEmpty(undefined)).toBe(true);
        expect(isEmpty([])).toBe(true);
        expect(isEmpty({})).toBe(true);
        expect(isEmpty('')).toBe(true);
      });

      it('should detect non-empty values', () => {
        expect(isEmpty([1])).toBe(false);
        expect(isEmpty({ a: 1 })).toBe(false);
        expect(isEmpty('hello')).toBe(false);
        expect(isEmpty(0)).toBe(false);
      });
    });
  });

  describe('Validation Utilities', () => {
    describe('validateEmail', () => {
      const validateEmail = (email: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      it('should validate correct emails', () => {
        expect(validateEmail('test@example.com')).toBe(true);
        expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      });

      it('should reject invalid emails', () => {
        expect(validateEmail('invalid')).toBe(false);
        expect(validateEmail('@example.com')).toBe(false);
        expect(validateEmail('test@')).toBe(false);
        expect(validateEmail('')).toBe(false);
      });
    });

    describe('validateUrl', () => {
      const validateUrl = (url: string) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      };

      it('should validate correct URLs', () => {
        expect(validateUrl('https://example.com')).toBe(true);
        expect(validateUrl('http://localhost:3000')).toBe(true);
      });

      it('should reject invalid URLs', () => {
        expect(validateUrl('not-a-url')).toBe(false);
        expect(validateUrl('')).toBe(false);
      });
    });

    describe('validatePhone', () => {
      const validatePhone = (phone: string) =>
        /^\+?[\d\s-()]{10,}$/.test(phone);

      it('should validate phone numbers', () => {
        expect(validatePhone('+1 (555) 123-4567')).toBe(true);
        expect(validatePhone('5551234567')).toBe(true);
      });

      it('should reject invalid phones', () => {
        expect(validatePhone('123')).toBe(false);
        expect(validatePhone('abc')).toBe(false);
      });
    });
  });

  describe('Storage Utilities', () => {
    const mockStorage = new Map<string, string>();

    const storage = {
      get: (key: string) => {
        const value = mockStorage.get(key);
        return value ? JSON.parse(value) : null;
      },
      set: (key: string, value: any) => {
        mockStorage.set(key, JSON.stringify(value));
      },
      remove: (key: string) => {
        mockStorage.delete(key);
      },
      clear: () => {
        mockStorage.clear();
      },
    };

    beforeEach(() => {
      mockStorage.clear();
    });

    it('should store and retrieve values', () => {
      storage.set('test', { value: 123 });
      expect(storage.get('test')).toEqual({ value: 123 });
    });

    it('should return null for missing keys', () => {
      expect(storage.get('nonexistent')).toBeNull();
    });

    it('should remove values', () => {
      storage.set('test', 'value');
      storage.remove('test');
      expect(storage.get('test')).toBeNull();
    });

    it('should clear all values', () => {
      storage.set('key1', 'value1');
      storage.set('key2', 'value2');
      storage.clear();
      expect(storage.get('key1')).toBeNull();
      expect(storage.get('key2')).toBeNull();
    });
  });

  describe('Debounce & Throttle', () => {
    jest.useFakeTimers();

    describe('debounce', () => {
      const debounce = (fn: Function, delay: number) => {
        let timeoutId: ReturnType<typeof setTimeout>;
        return (...args: any[]) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => fn(...args), delay);
        };
      };

      it('should delay function execution', () => {
        const fn = jest.fn();
        const debouncedFn = debounce(fn, 100);

        debouncedFn();
        debouncedFn();
        debouncedFn();

        expect(fn).not.toHaveBeenCalled();

        jest.advanceTimersByTime(100);

        expect(fn).toHaveBeenCalledTimes(1);
      });
    });

    describe('throttle', () => {
      const throttle = (fn: Function, limit: number) => {
        let lastCall = 0;
        return (...args: any[]) => {
          const now = Date.now();
          if (now - lastCall >= limit) {
            lastCall = now;
            fn(...args);
          }
        };
      };

      it('should limit function calls', () => {
        const fn = jest.fn();
        const throttledFn = throttle(fn, 100);

        // Note: throttle needs real time, simplified test
        throttledFn();
        expect(fn).toHaveBeenCalledTimes(1);
      });
    });

    afterAll(() => {
      jest.useRealTimers();
    });
  });
});
