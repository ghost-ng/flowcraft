import { test } from '@playwright/test';

test('debug page errors', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => logs.push(`[PAGEERROR] ${err.message}\n${err.stack}`));

  await page.goto('http://localhost:5173/Chart-Hero/');
  await page.waitForTimeout(8000);

  const html = await page.evaluate(() => document.documentElement.outerHTML.substring(0, 3000));
  console.log('=== HTML ===');
  console.log(html);
  console.log('=== LOGS ===');
  for (const l of logs) console.log(l);
});
