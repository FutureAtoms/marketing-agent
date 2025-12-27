import { test, expect } from '@playwright/test';

test.describe('Dashboard Layout with Auth Bypass', () => {
  test('test dashboard layout on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });

    // Navigate with auth bypass
    await page.goto('/(main)/(tabs)/dashboard?bypass_auth=true');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: 'e2e/screenshots/dashboard-bypass.png', fullPage: true });

    // Analyze layout
    const layoutInfo = await page.evaluate(() => {
      const result: any = {
        url: window.location.href,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        sidebar: null,
        mainContent: null,
        pageText: document.body.textContent?.substring(0, 500),
      };

      // Look for sidebar elements (narrow divs on the left)
      const allDivs = Array.from(document.querySelectorAll('div'));
      for (const div of allDivs) {
        const rect = div.getBoundingClientRect();
        const styles = window.getComputedStyle(div);

        // Sidebar: positioned on left, narrow width, tall height
        if (rect.x === 0 && rect.width > 50 && rect.width < 150 && rect.height > 300) {
          result.sidebar = {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            children: div.children.length,
            className: div.className?.substring(0, 50),
          };
          break;
        }
      }

      // Look for main content area
      for (const div of allDivs) {
        const rect = div.getBoundingClientRect();
        if (rect.x > 50 && rect.width > 500 && rect.height > 300) {
          result.mainContent = {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            className: div.className?.substring(0, 50),
          };
          break;
        }
      }

      return result;
    });

    console.log('Layout Info:', JSON.stringify(layoutInfo, null, 2));
  });

  test('test mobile layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });

    // Navigate with auth bypass
    await page.goto('/(main)/(tabs)/dashboard?bypass_auth=true');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: 'e2e/screenshots/dashboard-mobile.png', fullPage: true });

    // Check for bottom tab bar
    const tabBarInfo = await page.evaluate(() => {
      const allDivs = Array.from(document.querySelectorAll('div'));
      for (const div of allDivs) {
        const rect = div.getBoundingClientRect();
        // Bottom tab bar: at bottom, full width
        if (rect.y > window.innerHeight - 100 && rect.width > window.innerWidth - 50) {
          return {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            children: div.children.length,
          };
        }
      }
      return null;
    });

    console.log('Tab Bar Info:', tabBarInfo);
  });
});
