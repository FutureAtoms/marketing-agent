import { test } from '@playwright/test';

const pages = ['dashboard', 'social', 'email', 'content', 'crm', 'settings'];

test.describe('Screenshot All Pages', () => {
  for (const pageName of pages) {
    test(`screenshot ${pageName} page`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/(main)/(tabs)/${pageName}?bypass_auth=true`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      await page.screenshot({
        path: `e2e/screenshots/before-redesign-${pageName}.png`,
        fullPage: true
      });
    });
  }
});
