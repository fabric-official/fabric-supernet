import { test, expect } from '@playwright/test';
const API = process.env.API_BASE || 'http://localhost:8080';

test('Agent publish appears in Registry UI', async ({ page, request }) => {
  const agent = { name: 'agent-e2e', version: '0.0.1', origin: 'Harness', description: 'E2E test agent' };
  const pub = await request.post(`${API}/api/registry/agents`, { data: agent });
  expect(pub.ok()).toBeTruthy();

  await page.goto('/registry');
  await expect(page.getByText('agent-e2e')).toBeVisible();
});
