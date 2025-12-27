import { test } from '@playwright/test';

const pages = ['dashboard', 'social', 'email', 'content', 'crm', 'settings'];

test.describe('After Redesign Screenshots - Light Mode', () => {
  for (const pageName of pages) {
    test(`screenshot ${pageName} page (light mode)`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/(main)/(tabs)/${pageName}?bypass_auth=true`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      await page.screenshot({
        path: `e2e/screenshots/after-redesign-${pageName}-light.png`,
        fullPage: true
      });
    });
  }
});

test.describe('After Redesign Screenshots - Dark Mode', () => {
  test.use({ colorScheme: 'dark' });

  for (const pageName of pages) {
    test(`screenshot ${pageName} page (dark mode)`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/(main)/(tabs)/${pageName}?bypass_auth=true`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      await page.screenshot({
        path: `e2e/screenshots/after-redesign-${pageName}-dark.png`,
        fullPage: true
      });
    });
  }
});
