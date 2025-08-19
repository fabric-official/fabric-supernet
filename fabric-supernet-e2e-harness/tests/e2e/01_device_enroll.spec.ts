import { test, expect } from '@playwright/test';

const API = process.env.API_BASE || 'http://localhost:8080';

// Candidate routes + selectors can be overridden by env vars if needed.
const routeCandidates = (process.env.PAIR_ROUTES || '/pair,/connect,/enroll,/devices/pair,/device/pair,/onboarding')
  .split(',').map(s=>s.trim()).filter(Boolean);
const qrSelectors = (process.env.QR_SELECTORS || '[data-testid=qr-image],[data-testid*=qr i],canvas#qrCanvas,canvas,img[alt*="qr" i],img[src*="qr" i]')
  .split(',').map(s=>s.trim());

test('Device enrollment end-to-end', async ({ page, request }) => {
  // 1) Find a working route
  let okRoute: string | null = null;
  for (const r of routeCandidates) {
    const resp = await page.goto(r, { waitUntil: 'domcontentloaded' }).catch(() => null);
    if (resp && resp.ok()) { okRoute = r; break; }
  }
  expect(okRoute, `None of the candidate routes responded OK: ${routeCandidates.join(', ')}`).toBeTruthy();

  // 2) Find a visible QR element (img/canvas/any element with qr in testid/alt/src)
  const qr = page.locator(qrSelectors.join(','));
  await expect(qr.first()).toBeVisible({ timeout: 15000 });

  // 3) Simulate device enrollment via API (adjust endpoint if different)
  const enrollEndpoint = process.env.ENROLL_ENDPOINT || '/api/devices/enroll';
  const enrollRes = await request.post(`${API}${enrollEndpoint}`, {
    data: { mock: true, note: 'e2e harness' }
  });
  expect(enrollRes.ok(), `POST ${enrollEndpoint} did not return 2xx`).toBeTruthy();

  // 4) Devices page shows a row
  const deviceRoutes = (process.env.DEVICES_ROUTES || '/devices,/device/list,/admin/devices')
    .split(',').map(s=>s.trim());
  let okDevRoute: string | null = null;
  for (const r of deviceRoutes) {
    const resp = await page.goto(r, { waitUntil: 'domcontentloaded' }).catch(() => null);
    if (resp && resp.ok()) { okDevRoute = r; break; }
  }
  expect(okDevRoute, `No devices route responded OK: ${deviceRoutes.join(', ')}`).toBeTruthy();

  const table = page.locator('[data-testid=devices-table], table, [role=table]');
  await expect(table).toBeVisible({ timeout: 10000 });
  await expect(page.locator('tr')).toHaveCountGreaterThan(1);
});
