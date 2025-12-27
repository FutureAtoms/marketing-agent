import { test } from '@playwright/test';

const pages = ['dashboard', 'social', 'email', 'content', 'crm', 'settings'];
const resolutions = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

test.describe('Mobile Resolution Theme Check - Light Mode', () => {
  for (const resolution of resolutions) {
    for (const pageName of pages) {
      test(`${pageName} at ${resolution.name} (${resolution.width}px) - light`, async ({ page }) => {
        await page.setViewportSize({ width: resolution.width, height: resolution.height });
        await page.goto(`/(main)/(tabs)/${pageName}?bypass_auth=true`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        await page.screenshot({
          path: `e2e/screenshots/theme-check/${pageName}-${resolution.name}-light.png`,
          fullPage: true
        });
      });
    }
  }
});

test.describe('Mobile Resolution Theme Check - Dark Mode', () => {
  test.use({ colorScheme: 'dark' });

  for (const resolution of resolutions) {
    for (const pageName of pages) {
      test(`${pageName} at ${resolution.name} (${resolution.width}px) - dark`, async ({ page }) => {
        await page.setViewportSize({ width: resolution.width, height: resolution.height });
        await page.goto(`/(main)/(tabs)/${pageName}?bypass_auth=true`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        await page.screenshot({
          path: `e2e/screenshots/theme-check/${pageName}-${resolution.name}-dark.png`,
          fullPage: true
        });
      });
    }
  }
});
