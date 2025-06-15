import { test, expect, Page } from '@playwright/test';

const viewports: { width: number; height: number }[] = [
  { width: 375, height: 812 }, // iPhone 12
  { width: 768, height: 1024 }, // iPad Pro
  { width: 1440, height: 900 }, // Desktop
];

test.describe('WasteNot Admin Panel Login Page Responsiveness and Element Visibility', () => {
  for (const viewport of viewports) {
    test(`should display login form correctly at ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      try {
        await page.setViewportSize(viewport);
        await page.goto(
          'https://admin-staging.wastenot-official.com'
        );

        // Wait explicitly for the form container to be visible
        await page.waitForSelector(
          'form[class*="flex w-full flex-col gap-[24px]"]',
          { timeout: 10000 }
        );

        // Selectors based on actual HTML structure and Japanese placeholder text
        const emailInput = page.locator(
          'input[placeholder="メールアドレスを入力"]'
        );
        const passwordInput = page.locator(
          'input[placeholder="パスワードを入力"]'
        );
        const loginButton = page.locator('button[type="submit"]');

        // Check visibility of elements
        await expect(emailInput).toBeVisible({ timeout: 5000 });
        await expect(passwordInput).toBeVisible({ timeout: 5000 });
        await expect(loginButton).toBeVisible({ timeout: 5000 });

        // Basic functionality check: fill inputs and check button enabled state
        await emailInput.fill('testuser@example.com');
        await passwordInput.fill('TestPassword123!');
        await expect(loginButton).toBeEnabled();

        // Optionally click login button to verify navigation or response (commented out)
        // await loginButton.click();
        // await page.waitForNavigation();
      } catch (error) {
        // Log error for debugging
        console.error(
          `Test failed at viewport ${viewport.width}x${viewport.height}:`,
          error
        );

        // Capture screenshot on failure with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const screenshotPath = `screenshots/login_test_failure_${viewport.width}x${viewport.height}_${timestamp}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Screenshot saved to: ${screenshotPath}`);

        // Re-throw error to fail the test
        throw error;
      }
    });
  }
});
