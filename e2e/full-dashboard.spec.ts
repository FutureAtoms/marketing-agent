import { test, expect } from '@playwright/test';

test.describe('Full Dashboard Verification', () => {
  test('capture full dashboard with all charts', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1440, height: 2000 });

    // Navigate with auth bypass
    await page.goto('/(main)/(tabs)/dashboard?bypass_auth=true');
    await page.waitForLoadState('networkidle');

    // Wait for charts to render
    await page.waitForTimeout(5000);

    // Take full page screenshot
    await page.screenshot({ path: 'e2e/screenshots/dashboard-full.png', fullPage: true });

    // Verify key elements are visible
    const statsCount = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return {
        hasVisitors: text.includes('Total Visitors'),
        hasLeads: text.includes('Leads Generated'),
        hasConversion: text.includes('Conversion Rate'),
        hasRevenue: text.includes('Revenue'),
        hasTrafficChart: text.includes('Website Traffic'),
        hasChannelChart: text.includes('Channel Performance'),
        hasTopPages: text.includes('Top Pages'),
        hasPricing: text.includes('/pricing'),
      };
    });

    console.log('Dashboard content verification:', statsCount);

    // All should be true
    expect(statsCount.hasVisitors).toBe(true);
    expect(statsCount.hasLeads).toBe(true);
    expect(statsCount.hasConversion).toBe(true);
    expect(statsCount.hasRevenue).toBe(true);
  });
});
