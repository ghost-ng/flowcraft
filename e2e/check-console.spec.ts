import { test } from '@playwright/test';

test('Capture console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    errors.push(`PAGE ERROR: ${err.message}`);
  });

  await page.goto('http://localhost:5173/Chart-Hero/');
  await page.waitForTimeout(5000);

  // Print page content to see what rendered
  const bodyHTML = await page.evaluate(() => document.body.innerHTML.substring(0, 2000));
  console.log('=== BODY HTML ===');
  console.log(bodyHTML);
  console.log('=== CONSOLE ERRORS ===');
  for (const e of errors) console.log(e);
  console.log(`Total errors: ${errors.length}`);
});
