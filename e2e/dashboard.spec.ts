import { test, expect } from '@playwright/test';

test.describe('Dashboard Layout Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up mock auth state in localStorage before navigating
    await page.addInitScript(() => {
      // Mock the auth state to simulate logged-in user
      const mockUser = {
        id: 'test-user-123',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User',
        },
      };

      // Set Supabase auth tokens
      localStorage.setItem('sb-localhost-auth-token', JSON.stringify({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: mockUser,
        expires_at: Date.now() + 3600000,
      }));
    });

    // Navigate directly to dashboard
    await page.goto('/(main)/(tabs)/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('take dashboard screenshot', async ({ page }) => {
    await page.screenshot({ path: 'e2e/screenshots/dashboard.png', fullPage: true });
  });

  test('check sidebar layout on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);

    // Take screenshot
    await page.screenshot({ path: 'e2e/screenshots/dashboard-desktop.png', fullPage: true });

    // Check for sidebar
    const sidebar = await page.evaluate(() => {
      const allDivs = document.querySelectorAll('div');
      const sidebarCandidates: any[] = [];

      allDivs.forEach((div) => {
        const styles = window.getComputedStyle(div);
        const rect = div.getBoundingClientRect();

        // Look for sidebar - typically on the left, narrow width
        if (rect.x === 0 && rect.width < 150 && rect.height > 400) {
          sidebarCandidates.push({
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            className: div.className?.substring(0, 50),
            display: styles.display,
            flexDirection: styles.flexDirection,
            childCount: div.children.length,
          });
        }
      });

      return sidebarCandidates;
    });

    console.log('Sidebar candidates:', JSON.stringify(sidebar, null, 2));

    // Check for tab/navigation icons
    const navItems = await page.evaluate(() => {
      const pressables = document.querySelectorAll('[role="button"], button, [data-testid]');
      const items: any[] = [];

      pressables.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.x < 100 && rect.width < 100) { // Items on the left side
          items.push({
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            text: el.textContent?.trim().substring(0, 30),
          });
        }
      });

      return items;
    });

    console.log('Navigation items:', JSON.stringify(navItems, null, 2));
  });
});
