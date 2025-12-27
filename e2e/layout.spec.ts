import { test, expect } from '@playwright/test';

test.describe('Layout and Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the app
    await page.goto('/');
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('take screenshot and analyze layout', async ({ page }) => {
    // Wait for content to render
    await page.waitForTimeout(3000);

    // Take a full page screenshot
    await page.screenshot({ path: 'e2e/screenshots/full-page.png', fullPage: true });

    // Get the viewport dimensions
    const viewportSize = page.viewportSize();
    console.log('Viewport size:', viewportSize);

    // Check for sidebar elements
    const sidebar = await page.locator('[role="tablist"], nav').first();
    if (await sidebar.isVisible()) {
      const sidebarBox = await sidebar.boundingBox();
      console.log('Sidebar bounding box:', sidebarBox);
    }

    // Check tab bar position and styles
    const tabBar = await page.evaluate(() => {
      const tabElements = document.querySelectorAll('[role="tab"], [role="tablist"] button');
      const tabs: any[] = [];
      tabElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const styles = window.getComputedStyle(el);
        tabs.push({
          text: el.textContent,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          position: styles.position,
          display: styles.display,
          flexDirection: styles.flexDirection,
        });
      });
      return tabs;
    });
    console.log('Tab elements:', JSON.stringify(tabBar, null, 2));

    // Check main content area
    const mainContent = await page.evaluate(() => {
      const main = document.querySelector('main, [role="main"], div[style*="flex: 1"]');
      if (main) {
        const rect = main.getBoundingClientRect();
        const styles = window.getComputedStyle(main);
        return {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          marginLeft: styles.marginLeft,
          paddingLeft: styles.paddingLeft,
        };
      }
      return null;
    });
    console.log('Main content:', mainContent);

    // Check for elements with position: absolute that might be overlapping
    const absoluteElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const absolute: any[] = [];
      elements.forEach((el) => {
        const styles = window.getComputedStyle(el);
        if (styles.position === 'absolute' || styles.position === 'fixed') {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            absolute.push({
              tagName: el.tagName,
              className: el.className,
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
              position: styles.position,
              left: styles.left,
              right: styles.right,
              top: styles.top,
              bottom: styles.bottom,
            });
          }
        }
      });
      return absolute;
    });
    console.log('Absolute/Fixed positioned elements:', JSON.stringify(absoluteElements, null, 2));

    // Check for flexbox containers
    const flexContainers = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const flex: any[] = [];
      elements.forEach((el) => {
        const styles = window.getComputedStyle(el);
        if (styles.display === 'flex' || styles.display === 'inline-flex') {
          const rect = el.getBoundingClientRect();
          if (rect.width > 100 && rect.height > 100) { // Only significant containers
            flex.push({
              tagName: el.tagName,
              className: el.className?.substring(0, 50),
              flexDirection: styles.flexDirection,
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            });
          }
        }
      });
      return flex.slice(0, 20); // Limit to 20
    });
    console.log('Flex containers:', JSON.stringify(flexContainers, null, 2));
  });

  test('check skeleton loading states', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Find skeleton/loading elements
    const skeletons = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="skeleton"], [class*="Skeleton"], [class*="loading"], [class*="Loading"]');
      return Array.from(elements).map(el => ({
        className: el.className,
        visible: el.getBoundingClientRect().width > 0,
      }));
    });
    console.log('Skeleton elements:', skeletons);

    // Take screenshot to see current state
    await page.screenshot({ path: 'e2e/screenshots/skeleton-state.png' });
  });

  test('analyze CSS issues', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Get all elements with potential issues
    const cssIssues = await page.evaluate(() => {
      const issues: string[] = [];
      const elements = document.querySelectorAll('*');

      elements.forEach((el) => {
        const styles = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();

        // Check for elements outside viewport
        if (rect.x < 0 || rect.y < 0) {
          issues.push(`Element outside viewport: ${el.tagName}.${el.className} at (${rect.x}, ${rect.y})`);
        }

        // Check for overlapping fixed/absolute elements
        if (styles.position === 'absolute' && rect.x < 100 && rect.width < 100) {
          issues.push(`Potentially misplaced absolute element: ${el.tagName}.${el.className} at (${rect.x}, ${rect.y})`);
        }
      });

      return issues.slice(0, 30);
    });
    console.log('CSS Issues found:', cssIssues);
  });
});
