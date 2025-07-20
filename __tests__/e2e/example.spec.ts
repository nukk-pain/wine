import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Wine Tracker/);
});

test('basic navigation', async ({ page }) => {
  await page.goto('/');

  // Should have a basic page structure
  await expect(page.locator('body')).toBeVisible();
});