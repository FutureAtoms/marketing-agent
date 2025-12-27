/**
 * Bundle & Build Verification Tests
 * These tests verify that the app can be bundled without errors
 * and catch issues like import.meta incompatibility
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Bundle Verification', () => {
  const projectRoot = path.resolve(__dirname, '../..');

  describe('Problematic Patterns Detection', () => {
    it('should not have import.meta in source files', () => {
      const sourceFiles = [
        'lib/ai/openai.ts',
        'lib/ai/anthropic.ts',
        'lib/ai/social.ts',
        'lib/ai/index.ts',
        'stores/authStore.ts',
        'stores/orgStore.ts',
        'stores/uiStore.ts',
      ];

      sourceFiles.forEach(file => {
        const filePath = path.join(projectRoot, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          // Check for problematic import.meta usage (not in comments)
          const lines = content.split('\n');
          lines.forEach((line, index) => {
            if (line.includes('import.meta') && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
              fail(`Found import.meta in ${file}:${index + 1} - "${line.trim()}"`);
            }
          });
        }
      });
    });

    it('should not directly import OpenAI SDK', () => {
      const sourceFiles = [
        'lib/ai/openai.ts',
        'lib/ai/social.ts',
      ];

      sourceFiles.forEach(file => {
        const filePath = path.join(projectRoot, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          expect(content).not.toMatch(/from ['"]openai['"]/);
          expect(content).not.toMatch(/import OpenAI/);
        }
      });
    });

    it('should not directly import Anthropic SDK', () => {
      const sourceFiles = [
        'lib/ai/anthropic.ts',
      ];

      sourceFiles.forEach(file => {
        const filePath = path.join(projectRoot, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          expect(content).not.toMatch(/from ['"]@anthropic-ai\/sdk['"]/);
          expect(content).not.toMatch(/import Anthropic/);
        }
      });
    });
  });

  describe('Zustand Patch Verification', () => {
    it('should have zustand patch file', () => {
      const patchDir = path.join(projectRoot, 'patches');
      expect(fs.existsSync(patchDir)).toBe(true);

      const patches = fs.readdirSync(patchDir);
      const zustandPatch = patches.find(p => p.startsWith('zustand'));
      expect(zustandPatch).toBeDefined();
    });

    it('should have postinstall script for patches', () => {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8')
      );
      expect(packageJson.scripts.postinstall).toBe('patch-package');
    });

    it('should have patched zustand without import.meta', () => {
      const zustandPath = path.join(projectRoot, 'node_modules/zustand/esm');
      if (fs.existsSync(zustandPath)) {
        const files = fs.readdirSync(zustandPath).filter(f => f.endsWith('.mjs'));

        files.forEach(file => {
          const content = fs.readFileSync(path.join(zustandPath, file), 'utf-8');
          // Should not have executable import.meta.env (comments are ok)
          const lines = content.split('\n');
          lines.forEach((line, index) => {
            if (line.includes('import.meta.env') &&
                !line.trim().startsWith('//') &&
                !line.trim().startsWith('*')) {
              fail(`Unpatched import.meta.env in zustand/${file}:${index + 1}`);
            }
          });
        });
      }
    });
  });

  describe('Required Dependencies', () => {
    it('should have patch-package installed', () => {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8')
      );
      expect(
        packageJson.devDependencies['patch-package'] ||
        packageJson.dependencies['patch-package']
      ).toBeDefined();
    });

    it('should have babel-plugin-transform-import-meta installed', () => {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8')
      );
      expect(
        packageJson.devDependencies['babel-plugin-transform-import-meta'] ||
        packageJson.dependencies['babel-plugin-transform-import-meta']
      ).toBeDefined();
    });
  });

  describe('Configuration Files', () => {
    it('should have valid metro.config.js', () => {
      const configPath = path.join(projectRoot, 'metro.config.js');
      expect(fs.existsSync(configPath)).toBe(true);

      const content = fs.readFileSync(configPath, 'utf-8');
      expect(content).toContain('getDefaultConfig');
    });

    it('should have valid babel.config.js', () => {
      const configPath = path.join(projectRoot, 'babel.config.js');
      expect(fs.existsSync(configPath)).toBe(true);

      const content = fs.readFileSync(configPath, 'utf-8');
      expect(content).toContain('babel-preset-expo');
    });

    it('should have babel-plugin-transform-import-meta in babel config', () => {
      const configPath = path.join(projectRoot, 'babel.config.js');
      const content = fs.readFileSync(configPath, 'utf-8');
      expect(content).toContain('babel-plugin-transform-import-meta');
    });
  });
});

describe('Module Import Verification', () => {
  it('should be able to import AI openai module', () => {
    expect(() => {
      require('../../lib/ai/openai');
    }).not.toThrow();
  });

  it('should be able to import AI anthropic module', () => {
    expect(() => {
      require('../../lib/ai/anthropic');
    }).not.toThrow();
  });

  it('should be able to import AI social module', () => {
    expect(() => {
      require('../../lib/ai/social');
    }).not.toThrow();
  });

  it('should be able to import stores', () => {
    expect(() => {
      require('../../stores/authStore');
    }).not.toThrow();

    expect(() => {
      require('../../stores/uiStore');
    }).not.toThrow();
  });
});

describe('AI Client Implementation', () => {
  it('should use fetch-based implementation in openai.ts', () => {
    const filePath = path.resolve(__dirname, '../../lib/ai/openai.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Should use fetch
    expect(content).toContain('fetch(');
    expect(content).toContain('OPENAI_API_URL');

    // Should not use SDK
    expect(content).not.toMatch(/new OpenAI\(/);
    expect(content).not.toMatch(/from ['"]openai['"]/);
  });

  it('should use fetch-based implementation in anthropic.ts', () => {
    const filePath = path.resolve(__dirname, '../../lib/ai/anthropic.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Should use fetch
    expect(content).toContain('fetch(');
    expect(content).toContain('ANTHROPIC_API_URL');

    // Should not use SDK
    expect(content).not.toMatch(/new Anthropic\(/);
    expect(content).not.toMatch(/from ['"]@anthropic-ai\/sdk['"]/);
  });

  it('should use fetch-based implementation in social.ts', () => {
    const filePath = path.resolve(__dirname, '../../lib/ai/social.ts');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Should use fetch or import from local modules only
    expect(content).not.toMatch(/from ['"]openai['"]/);
    expect(content).not.toMatch(/openai\.chat\.completions/);
  });

  it('should have mock responses for development', () => {
    const openaiPath = path.resolve(__dirname, '../../lib/ai/openai.ts');
    const anthropicPath = path.resolve(__dirname, '../../lib/ai/anthropic.ts');

    const openaiContent = fs.readFileSync(openaiPath, 'utf-8');
    const anthropicContent = fs.readFileSync(anthropicPath, 'utf-8');

    // Both should have mock/fallback responses
    expect(openaiContent).toMatch(/mock|Mock|fallback|development/i);
    expect(anthropicContent).toMatch(/mock|Mock|fallback|development/i);
  });
});
