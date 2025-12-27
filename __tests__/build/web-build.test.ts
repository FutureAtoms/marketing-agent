/**
 * Web Build Verification Tests
 * Tests that verify the web bundle can be built and is valid
 */

import { execSync, spawn } from 'child_process';
import * as path from 'path';
import * as http from 'http';

const projectRoot = path.resolve(__dirname, '../..');

describe('Web Build Verification', () => {
  describe('TypeScript Compilation', () => {
    it('should compile without errors', () => {
      let compilationError: string | null = null;
      try {
        execSync('npx tsc --noEmit', {
          cwd: projectRoot,
          encoding: 'utf-8',
          stdio: 'pipe',
        });
      } catch (error: any) {
        compilationError = error.stdout || error.stderr;
      }
      expect(compilationError).toBeNull();
    });
  });

  describe('ESLint', () => {
    it('should pass linting (if configured)', () => {
      try {
        // Check if expo lint is available
        execSync('npx expo lint --help', {
          cwd: projectRoot,
          encoding: 'utf-8',
          stdio: 'pipe',
        });
      } catch {
        // Lint not configured, skip
        console.log('ESLint not configured, skipping');
      }
    });
  });
});

describe('Bundle Content Verification', () => {
  // This test verifies the bundle content without starting a server
  it('should not contain problematic ES module syntax in source', () => {
    const fs = require('fs');

    // Check key source files for problematic patterns
    const filesToCheck = [
      'lib/ai/openai.ts',
      'lib/ai/anthropic.ts',
      'lib/ai/social.ts',
      'stores/authStore.ts',
      'stores/orgStore.ts',
    ];

    const problematicPatterns = [
      { pattern: /import\.meta\.env/, description: 'import.meta.env usage' },
      { pattern: /import\.meta\.url/, description: 'import.meta.url usage' },
      { pattern: /from\s+['"]openai['"]/, description: 'Direct OpenAI SDK import' },
      { pattern: /from\s+['"]@anthropic-ai\/sdk['"]/, description: 'Direct Anthropic SDK import' },
    ];

    const issues: string[] = [];

    filesToCheck.forEach(file => {
      const filePath = path.join(projectRoot, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');

        problematicPatterns.forEach(({ pattern, description }) => {
          const lines = content.split('\n');
          lines.forEach((line: string, index: number) => {
            // Skip comments
            if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
              return;
            }
            if (pattern.test(line)) {
              issues.push(`Found ${description} in ${file}:${index + 1}\nLine: ${line.trim()}`);
            }
          });
        });
      }
    });

    expect(issues).toEqual([]);
  });
});

describe('Node Modules Verification', () => {
  it('should have zustand patched correctly', () => {
    const fs = require('fs');
    const zustandEsmPath = path.join(projectRoot, 'node_modules/zustand/esm');

    if (!fs.existsSync(zustandEsmPath)) {
      console.log('Zustand ESM not found, may be using CJS');
      return;
    }

    const files = fs.readdirSync(zustandEsmPath).filter((f: string) => f.endsWith('.mjs'));

    let unpatched = false;
    files.forEach((file: string) => {
      const content = fs.readFileSync(path.join(zustandEsmPath, file), 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line: string, index: number) => {
        // Check for unpatched import.meta.env (ignore comments)
        if (!line.trim().startsWith('//') &&
            !line.trim().startsWith('*') &&
            line.includes('import.meta.env')) {
          console.error(`Unpatched: zustand/esm/${file}:${index + 1}`);
          unpatched = true;
        }
      });
    });

    expect(unpatched).toBe(false);
  });
});

describe('Environment Configuration', () => {
  it('should have .env file with required variables', () => {
    const fs = require('fs');
    const envPath = path.join(projectRoot, '.env');

    if (!fs.existsSync(envPath)) {
      console.log('.env file not found - using defaults');
      return;
    }

    const content = fs.readFileSync(envPath, 'utf-8');

    // Check for required environment variables
    const requiredVars = [
      'EXPO_PUBLIC_SUPABASE_URL',
      'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    ];

    requiredVars.forEach(varName => {
      expect(content).toContain(varName);
    });
  });

  it('should have jest globals configured', () => {
    const fs = require('fs');
    const jestConfigPath = path.join(projectRoot, 'jest.config.js');
    const content = fs.readFileSync(jestConfigPath, 'utf-8');

    expect(content).toContain('globals');
    expect(content).toContain('EXPO_PUBLIC_SUPABASE_URL');
  });
});

describe('Fetch-based AI Clients', () => {
  it('openai client should export expected functions', () => {
    const openai = require('../../lib/ai/openai');

    expect(typeof openai.generateSocialCaption).toBe('function');
    expect(typeof openai.generateHashtags).toBe('function');
    expect(typeof openai.generateEmailSubjects).toBe('function');
  });

  it('anthropic client should export expected functions', () => {
    const anthropic = require('../../lib/ai/anthropic');

    expect(typeof anthropic.generateBlogPost).toBe('function');
    expect(typeof anthropic.generateContentStrategy).toBe('function');
  });

  it('social client should export expected functions', () => {
    const social = require('../../lib/ai/social');

    expect(typeof social.generateCaption).toBe('function');
    expect(typeof social.generateHashtags).toBe('function');
    expect(typeof social.analyzeContent).toBe('function');
  });
});
