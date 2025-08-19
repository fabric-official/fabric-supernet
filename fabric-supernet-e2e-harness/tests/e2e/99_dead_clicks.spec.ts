import { test, expect } from '@playwright/test';

test('Dead-click sweep across key routes', async ({ page }) => {
  const routes = (process.env.ROUTES || '/,/pair,/wifi,/devices,/policies,/registry,/treasury,/dao,/telemetry,/app-store').split(',');
  const results:any[] = [];
  for (const r of routes) {
    await page.goto(r);
    const btns = page.locator('button, [role=button], a');
    const count = await btns.count();
    for (let i=0;i<count;i++){
      const b = btns.nth(i);
      if (!(await b.isVisible())) continue;
      const before = await page.content();
      const prevUrl = page.url();
      let net=0;
      page.on('request', req => { if (!req.url().includes('/favicon')) net++; });
      await b.click({ force: true }).catch(()=>{});
      await page.waitForTimeout(150);
      const after = await page.content();
      const changed = Math.abs(after.length - before.length) > 0;
      const moved = page.url() !== prevUrl;
      if (!changed && !moved && net===0){
        const label = (await b.textContent()) || (await b.getAttribute('aria-label')) || '<unlabeled>';
        results.push({ route:r, index:i, label:label?.trim() });
      }
    }
  }
  expect(results, 'Dead clicks found: '+JSON.stringify(results,null,2)).toHaveLength(0);
});
