import { test, expect } from '@playwright/test';
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Set timeout to 10s for this test
  page.setDefaultTimeout(10000);

  try {
    // Navigate to the app
    await page.goto('http://localhost:3000');

    // Wait for the app to load (look for a known element)
    await page.waitForSelector('.session-sidebar');

    // Initial state: sidebar should be expanded (width ~320px)
    const sidebar = page.locator('.session-sidebar');
    const initialBox = await sidebar.boundingBox();
    console.log('Initial sidebar width:', initialBox?.width);

    // Width should be > 100px (e.g. 320px)
    if (initialBox && initialBox.width < 100) {
      throw new Error('Sidebar started collapsed, expected expanded.');
    }

    // Trigger Ctrl+B
    await page.keyboard.press('Control+b');

    // Wait for transition/state change
    // The sidebar adds the 'collapsed' class
    await expect(sidebar).toHaveClass(/collapsed/);

    // Verify width decreased
    // We need to wait a bit for transition or check class immediately
    const collapsedBox = await sidebar.boundingBox();
    console.log('Collapsed sidebar width:', collapsedBox?.width);

    // Take screenshot of collapsed state
    await page.screenshot({ path: 'verification_collapsed.png' });

    // Trigger Ctrl+B again to expand
    await page.keyboard.press('Control+b');

    // Wait for removal of 'collapsed' class
    await expect(sidebar).not.toHaveClass(/collapsed/);

    // Take screenshot of expanded state
    await page.screenshot({ path: 'verification_expanded.png' });

    console.log('Verification successful!');
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
