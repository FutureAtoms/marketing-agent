import { test } from '@playwright/test';

test('capture settings with logout button - dark mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 1440, height: 2000 });
  await page.goto('/(main)/(tabs)/settings?bypass_auth=true');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  await page.screenshot({
    path: 'e2e/screenshots/logout-button-dark.png',
    fullPage: true
  });
});
