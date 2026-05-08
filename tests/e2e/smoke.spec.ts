import { test, expect } from '@playwright/test';

test('app boots and renders home', async ({ page }) => {
  await page.goto('/studyFlow/');
  await expect(page).toHaveTitle('StudyFlow');
  await expect(page.locator('header.site-header')).toBeVisible();
});
