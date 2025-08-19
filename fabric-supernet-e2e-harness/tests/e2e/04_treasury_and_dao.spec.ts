import { test, expect } from '@playwright/test';
const API = process.env.API_BASE || 'http://localhost:8080';

test('Treasury deposit reflected; DAO proposal lifecycle displays', async ({ page, request }) => {
  // Treasury deposit
  const dep = await request.post(`${API}/api/treasury/deposit`, { data: { amount: 1.23, currency: 'USDC', note: 'e2e' } });
  expect(dep.ok()).toBeTruthy();

  await page.goto('/treasury');
  await expect(page.getByText(/1\.23/)).toBeVisible();

  // DAO proposal
  const proposal = await request.post(`${API}/api/dao/proposals`, { data: { title: 'e2e-proposal', body: 'test', payout: 0 } });
  expect(proposal.ok()).toBeTruthy();

  await page.goto('/dao');
  await expect(page.getByText('e2e-proposal')).toBeVisible();
});
