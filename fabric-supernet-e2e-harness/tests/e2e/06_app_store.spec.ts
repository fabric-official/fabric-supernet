import { test, expect } from '@playwright/test';
const API = process.env.API_BASE || 'http://localhost:8080';

test('App Store install shows in UI', async ({ page, request }) => {
  const install = await request.post(`${API}/api/app-store/install`, { data: { id: 'hello-world', version: 'latest' } });
  expect(install.ok()).toBeTruthy();

  await page.goto('/app-store');
  await expect(page.getByText(/hello-world/i)).toBeVisible();
});
