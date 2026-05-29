import { test, expect } from '@playwright/test';

test.describe('Business Continuity', () => {
  test('application initializes and is reachable', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });
});
