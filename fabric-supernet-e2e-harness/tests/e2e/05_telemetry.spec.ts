import { test, expect } from '@playwright/test';
const API = process.env.API_BASE || 'http://localhost:8080';

test('Telemetry ingest updates chart/metrics in UI', async ({ page, request }) => {
  // Inject telemetry
  const now = Date.now();
  const ok = await request.post(`${API}/api/telemetry/ingest`, { data: { metric: 'cpu', value: 42, ts: now } });
  expect(ok.ok()).toBeTruthy();

  await page.goto('/telemetry');
  const chart = page.locator('canvas,[data-testid=chart]');
  await expect(chart.first()).toBeVisible();
  // Allow render
  await page.waitForTimeout(300);
  // Expect to see 'cpu' or recent value somewhere
  await expect(page.getByText(/cpu|42/)).toBeVisible();
});
