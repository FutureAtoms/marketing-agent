import { test, expect } from '@playwright/test';

test.describe('Login and Test Dashboard', () => {
  test('login and check dashboard layout', async ({ page }) => {
    // Go to the app
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Fill in login form
    const emailInput = page.locator('input[placeholder*="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[placeholder*="password"], input[type="password"]').first();

    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');

    // Take screenshot before login
    await page.screenshot({ path: 'e2e/screenshots/before-login.png' });

    // Click sign in button
    const signInButton = page.locator('button:has-text("Sign In"), [role="button"]:has-text("Sign In")').first();
    await signInButton.click();

    // Wait for navigation or error
    await page.waitForTimeout(3000);

    // Take screenshot after login attempt
    await page.screenshot({ path: 'e2e/screenshots/after-login.png' });

    // Check if we're on the dashboard or still on login
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Get page content to debug
    const bodyContent = await page.evaluate(() => {
      return {
        hasWelcome: document.body.textContent?.includes('Welcome'),
        hasDashboard: document.body.textContent?.includes('Dashboard'),
        hasSignIn: document.body.textContent?.includes('Sign In'),
        url: window.location.href,
      };
    });
    console.log('Page content check:', bodyContent);
  });

  test('analyze current page layout', async ({ page }) => {
    // Go to root
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: 'e2e/screenshots/current-layout.png', fullPage: true });

    // Analyze all visible elements
    const layoutAnalysis = await page.evaluate(() => {
      const analysis: any = {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        mainElements: [],
        flexContainers: [],
        absoluteElements: [],
      };

      document.querySelectorAll('*').forEach((el) => {
        const rect = el.getBoundingClientRect();
        const styles = window.getComputedStyle(el);

        // Skip tiny or invisible elements
        if (rect.width < 10 || rect.height < 10) return;

        // Track absolute/fixed elements
        if (styles.position === 'absolute' || styles.position === 'fixed') {
          analysis.absoluteElements.push({
            tag: el.tagName,
            class: el.className?.toString().substring(0, 40),
            position: styles.position,
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
          });
        }

        // Track flex containers on left side (potential sidebars)
        if ((styles.display === 'flex' || styles.display === 'inline-flex') && rect.x < 100) {
          analysis.flexContainers.push({
            tag: el.tagName,
            class: el.className?.toString().substring(0, 40),
            flexDirection: styles.flexDirection,
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
            childCount: el.children.length,
          });
        }
      });

      // Limit to relevant items
      analysis.absoluteElements = analysis.absoluteElements.slice(0, 20);
      analysis.flexContainers = analysis.flexContainers.slice(0, 20);

      return analysis;
    });

    console.log('Layout Analysis:', JSON.stringify(layoutAnalysis, null, 2));
  });
});
