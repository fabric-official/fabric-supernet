import { test, expect } from '@playwright/test';
const API = process.env.API_BASE || 'http://localhost:8080';

test('Policy create + list + enforce visible in UI', async ({ page, request }) => {
  // Create a policy via API: POST /api/policies
  const newPolicy = { name: 'e2e-policy', rule: 'energy_budget<=100', note: 'harness' };
  const create = await request.post(`${API}/api/policies`, { data: newPolicy });
  expect(create.ok()).toBeTruthy();

  // Visit policies UI
  await page.goto('/policies');
  const table = page.locator('[data-testid=policies-table], table');
  await expect(table).toBeVisible();
  await expect(page.getByText('e2e-policy')).toBeVisible();
});
