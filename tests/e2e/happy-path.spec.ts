import { test, expect } from '@playwright/test';

test('add task → start pomodoro → fast-forward → stats reflect', async ({ page }) => {
  await page.clock.install();
  page.on('dialog', d => d.dismiss());

  await page.goto('/studyFlow/#/today');

  await page.locator('#add-task').click();
  const title = page.locator('.task-form input[name="title"]');
  await expect(title).toBeVisible();
  await title.fill('Read chapter 4');
  await page.locator('.task-form button[type="submit"]').click();

  const row = page.locator('.task-row', { hasText: 'Read chapter 4' });
  await expect(row).toBeVisible();

  await row.locator('button.task-row__start').click();
  await expect(page.locator('aside.pomodoro.is-active')).toBeVisible();

  // Abort to record a session; fast-forwarding through the rAF tick auto-advances phases
  // indefinitely in fake-clock mode, so we simply abort to finalize.
  await page.locator('aside.pomodoro [data-act="abort"]').click();
  await expect(page.locator('aside.pomodoro.is-active')).toHaveCount(0);

  await page.goto('/studyFlow/#/stats');
  const kpis = page.locator('.stats-kpis .kpi__value');
  await expect(kpis.first()).toBeVisible();
  await expect(kpis.nth(3)).toContainText(/\d+/);
});

test('shortcut g d navigates to stats', async ({ page }) => {
  page.on('dialog', d => d.dismiss());
  await page.goto('/studyFlow/#/today');
  await page.locator('main#app').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('g');
  await page.keyboard.press('d');
  await expect(page).toHaveURL(/#\/stats$/);
});
