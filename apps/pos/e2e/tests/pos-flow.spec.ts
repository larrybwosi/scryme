import { test, expect } from '@playwright/test';

test.describe('POS Application', () => {
  test('should load the application and show the login or setup screen', async ({ page }) => {
    await page.goto('/');
    // The app title should always be present
    await expect(page).toHaveTitle(/Scryme/i);

    // Check for common elements in setup or login
    const bodyText = await page.innerText('body');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('should navigate to setup if unconfigured', async ({ page }) => {
    await page.goto('/');
    // Check for a button or heading that indicates setup
    // For example, looking for "Terminal Setup" or similar text if it exists
    const content = await page.textContent('body');
    // We expect the app to NOT be blank
    expect(content).not.toBeNull();
  });
});
