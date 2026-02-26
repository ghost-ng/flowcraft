/**
 * Playwright script to capture dark-mode screenshots for README and wiki.
 * Uses a realistic fictional project for all diagram content.
 * Run: node scripts/capture-dark-screenshots.mjs
 */
import { chromium } from 'playwright';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, '..', 'assets');
const BASE_URL = 'http://localhost:5173/';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Fictional project: "Pulse" — a healthcare patient portal ───

const HERO_DIAGRAM = {
  nodes: [
    { id: 'h1', position: { x: 60, y: 60 }, data: { label: 'Patient Login', shape: 'roundedRectangle', color: '#3b82f6', textColor: '#ffffff', fontSize: 14, fontWeight: 600, width: 160, height: 52 } },
    { id: 'h2', position: { x: 300, y: 60 }, data: { label: 'Auth Service', shape: 'roundedRectangle', color: '#6366f1', textColor: '#ffffff', fontSize: 14, fontWeight: 600, width: 150, height: 52 } },
    { id: 'h3', position: { x: 540, y: 20 }, data: { label: 'Dashboard', shape: 'roundedRectangle', color: '#10b981', textColor: '#ffffff', fontSize: 14, fontWeight: 600, width: 150, height: 52 } },
    { id: 'h4', position: { x: 540, y: 120 }, data: { label: 'MFA Challenge', shape: 'roundedRectangle', color: '#f59e0b', textColor: '#ffffff', fontSize: 13, fontWeight: 600, width: 150, height: 52 } },
    { id: 'h5', position: { x: 300, y: 200 }, data: { label: 'Audit Log', shape: 'hexagon', color: '#8b5cf6', textColor: '#ffffff', fontSize: 13, fontWeight: 600, width: 130, height: 70 } },
    { id: 'h6', position: { x: 780, y: 20 }, data: { label: 'Appointments', shape: 'roundedRectangle', color: '#0ea5e9', textColor: '#ffffff', fontSize: 13, fontWeight: 600, width: 150, height: 52 } },
    { id: 'h7', position: { x: 780, y: 120 }, data: { label: 'Medical Records', shape: 'roundedRectangle', color: '#0ea5e9', textColor: '#ffffff', fontSize: 13, fontWeight: 600, width: 160, height: 52 } },
    { id: 'h8', position: { x: 780, y: 220 }, data: { label: 'Prescriptions', shape: 'roundedRectangle', color: '#0ea5e9', textColor: '#ffffff', fontSize: 13, fontWeight: 600, width: 150, height: 52 } },
  ],
  edges: [
    { id: 'he1', source: 'h1', target: 'h2', type: 'smoothstep', data: { label: 'credentials', edgeColor: '#64748b', thickness: 2 } },
    { id: 'he2', source: 'h2', target: 'h3', type: 'smoothstep', data: { label: 'verified', edgeColor: '#10b981', thickness: 2 } },
    { id: 'he3', source: 'h2', target: 'h4', type: 'smoothstep', data: { label: '2FA required', edgeColor: '#f59e0b', thickness: 2 } },
    { id: 'he4', source: 'h4', target: 'h3', type: 'smoothstep', data: { edgeColor: '#10b981', thickness: 2 } },
    { id: 'he5', source: 'h2', target: 'h5', type: 'smoothstep', data: { label: 'log event', edgeColor: '#8b5cf6', thickness: 1.5 } },
    { id: 'he6', source: 'h3', target: 'h6', type: 'smoothstep', data: { edgeColor: '#64748b', thickness: 2 } },
    { id: 'he7', source: 'h3', target: 'h7', type: 'smoothstep', data: { edgeColor: '#64748b', thickness: 2 } },
    { id: 'he8', source: 'h3', target: 'h8', type: 'smoothstep', data: { edgeColor: '#64748b', thickness: 2 } },
  ],
};

const CONNECTORS_DIAGRAM = {
  nodes: [
    { id: 'a1', position: { x: 60, y: 50 }, data: { label: 'API Gateway', shape: 'roundedRectangle', color: '#3b82f6', textColor: '#ffffff', fontSize: 13, fontWeight: 600, width: 140, height: 46 } },
    { id: 'a2', position: { x: 320, y: 50 }, data: { label: 'User Service', shape: 'roundedRectangle', color: '#6366f1', textColor: '#ffffff', fontSize: 13, fontWeight: 600, width: 140, height: 46 } },
    { id: 'b1', position: { x: 60, y: 160 }, data: { label: 'Load Balancer', shape: 'roundedRectangle', color: '#3b82f6', textColor: '#ffffff', fontSize: 13, fontWeight: 600, width: 140, height: 46 } },
    { id: 'b2', position: { x: 320, y: 160 }, data: { label: 'Order Service', shape: 'roundedRectangle', color: '#8b5cf6', textColor: '#ffffff', fontSize: 13, fontWeight: 600, width: 140, height: 46 } },
    { id: 'c1', position: { x: 60, y: 270 }, data: { label: 'Message Queue', shape: 'roundedRectangle', color: '#3b82f6', textColor: '#ffffff', fontSize: 13, fontWeight: 600, width: 140, height: 46 } },
    { id: 'c2', position: { x: 320, y: 270 }, data: { label: 'Notification Svc', shape: 'roundedRectangle', color: '#0ea5e9', textColor: '#ffffff', fontSize: 13, fontWeight: 600, width: 150, height: 46 } },
    { id: 'd1', position: { x: 60, y: 380 }, data: { label: 'Cache Layer', shape: 'roundedRectangle', color: '#3b82f6', textColor: '#ffffff', fontSize: 13, fontWeight: 600, width: 140, height: 46 } },
    { id: 'd2', position: { x: 320, y: 380 }, data: { label: 'Database', shape: 'roundedRectangle', color: '#10b981', textColor: '#ffffff', fontSize: 13, fontWeight: 600, width: 140, height: 46 } },
  ],
  edges: [
    { id: 'e1', source: 'a1', target: 'a2', type: 'smoothstep', data: { label: 'SmoothStep', edgeColor: '#6366f1', thickness: 2.5, labelFontSize: 11 } },
    { id: 'e2', source: 'b1', target: 'b2', type: 'default', data: { label: 'Bezier', edgeColor: '#8b5cf6', thickness: 2.5, labelFontSize: 11 } },
    { id: 'e3', source: 'c1', target: 'c2', type: 'step', data: { label: 'Step', edgeColor: '#0ea5e9', thickness: 2.5, labelFontSize: 11 } },
    { id: 'e4', source: 'd1', target: 'd2', type: 'straight', data: { label: 'Straight', edgeColor: '#10b981', thickness: 2.5, labelFontSize: 11 } },
  ],
};

const PUCKS_DIAGRAM = {
  nodes: [
    { id: 'p1', position: { x: 60, y: 50 }, data: { label: 'UI Design', shape: 'roundedRectangle', color: '#3b82f6', textColor: '#ffffff', fontSize: 13, fontWeight: 600, width: 140, height: 50, statusIndicators: [{ id: 'pk1', status: 'completed', color: '#10b981', size: 14, position: 'top-right', icon: 'default', borderColor: '#000000', borderWidth: 1, borderStyle: 'solid' }] } },
    { id: 'p2', position: { x: 280, y: 50 }, data: { label: 'Backend API', shape: 'roundedRectangle', color: '#6366f1', textColor: '#ffffff', fontSize: 13, fontWeight: 600, width: 140, height: 50, statusIndicators: [{ id: 'pk2', status: 'in-progress', color: '#3b82f6', size: 14, position: 'top-right', icon: 'default', borderColor: '#000000', borderWidth: 1, borderStyle: 'solid' }] } },
    { id: 'p3', position: { x: 500, y: 50 }, data: { label: 'Code Review', shape: 'roundedRectangle', color: '#f59e0b', textColor: '#ffffff', fontSize: 13, fontWeight: 600, width: 140, height: 50, statusIndicators: [{ id: 'pk3', status: 'review', color: '#f59e0b', size: 14, position: 'top-right', icon: 'default', borderColor: '#000000', borderWidth: 1, borderStyle: 'solid' }] } },
    { id: 'p4', position: { x: 60, y: 170 }, data: { label: 'QA Testing', shape: 'roundedRectangle', color: '#ef4444', textColor: '#ffffff', fontSize: 13, fontWeight: 600, width: 140, height: 50, statusIndicators: [{ id: 'pk4', status: 'blocked', color: '#ef4444', size: 14, position: 'top-right', icon: 'default', borderColor: '#000000', borderWidth: 1, borderStyle: 'solid' }] } },
    { id: 'p5', position: { x: 280, y: 170 }, data: { label: 'Documentation', shape: 'roundedRectangle', color: '#94a3b8', textColor: '#ffffff', fontSize: 13, fontWeight: 600, width: 150, height: 50, statusIndicators: [{ id: 'pk5', status: 'not-started', color: '#94a3b8', size: 14, position: 'top-right', icon: 'default', borderColor: '#000000', borderWidth: 1, borderStyle: 'solid' }] } },
    { id: 'p6', position: { x: 500, y: 170 }, data: { label: 'Deployment', shape: 'roundedRectangle', color: '#0ea5e9', textColor: '#ffffff', fontSize: 13, fontWeight: 600, width: 140, height: 50, statusIndicators: [{ id: 'pk6a', status: 'completed', color: '#10b981', size: 13, position: 'top-left', icon: 'default', borderColor: '#000000', borderWidth: 1, borderStyle: 'solid' }, { id: 'pk6b', status: 'in-progress', color: '#3b82f6', size: 13, position: 'top-right', icon: 'default', borderColor: '#000000', borderWidth: 1, borderStyle: 'solid' }, { id: 'pk6c', status: 'blocked', color: '#ef4444', size: 13, position: 'bottom-right', icon: 'default', borderColor: '#000000', borderWidth: 1, borderStyle: 'solid' }] } },
  ],
  edges: [
    { id: 'pe1', source: 'p1', target: 'p2', type: 'smoothstep', data: { edgeColor: '#94a3b8' } },
    { id: 'pe2', source: 'p2', target: 'p3', type: 'smoothstep', data: { edgeColor: '#94a3b8' } },
    { id: 'pe3', source: 'p1', target: 'p4', type: 'smoothstep', data: { edgeColor: '#94a3b8' } },
    { id: 'pe4', source: 'p4', target: 'p5', type: 'smoothstep', data: { edgeColor: '#94a3b8' } },
    { id: 'pe5', source: 'p5', target: 'p6', type: 'smoothstep', data: { edgeColor: '#94a3b8' } },
  ],
};

const LEGEND_DIAGRAM = {
  nodes: [
    { id: 'l1', position: { x: 250, y: 50 }, data: { label: 'Critical Path', shape: 'roundedRectangle', color: '#ef4444', textColor: '#ffffff', fontSize: 13, fontWeight: 600, width: 140, height: 46 } },
    { id: 'l2', position: { x: 460, y: 50 }, data: { label: 'Optimization', shape: 'roundedRectangle', color: '#f59e0b', textColor: '#ffffff', fontSize: 13, fontWeight: 600, width: 150, height: 46 } },
    { id: 'l3', position: { x: 250, y: 150 }, data: { label: 'Core Feature', shape: 'roundedRectangle', color: '#3b82f6', textColor: '#ffffff', fontSize: 13, fontWeight: 600, width: 140, height: 46 } },
    { id: 'l4', position: { x: 460, y: 150 }, data: { label: 'Shipped', shape: 'roundedRectangle', color: '#10b981', textColor: '#ffffff', fontSize: 13, fontWeight: 600, width: 150, height: 46, statusIndicators: [{ id: 'lk1', status: 'completed', color: '#10b981', size: 13, position: 'top-right', icon: 'default', borderColor: '#000000', borderWidth: 1, borderStyle: 'solid' }] } },
    { id: 'l5', position: { x: 350, y: 250 }, data: { label: 'Infrastructure', shape: 'hexagon', color: '#8b5cf6', textColor: '#ffffff', fontSize: 13, fontWeight: 600, width: 140, height: 70 } },
  ],
  edges: [
    { id: 'le1', source: 'l1', target: 'l3', type: 'smoothstep', data: { edgeColor: '#ef4444' } },
    { id: 'le2', source: 'l2', target: 'l4', type: 'smoothstep', data: { edgeColor: '#f59e0b' } },
    { id: 'le3', source: 'l3', target: 'l5', type: 'smoothstep', data: { edgeColor: '#3b82f6' } },
    { id: 'le4', source: 'l4', target: 'l5', type: 'smoothstep', data: { edgeColor: '#10b981' } },
  ],
};

// ─── Helpers ────────────────────────────────────────────────────────

async function dismissOverlays(page) {
  // Press Escape multiple times to close nested dialogs
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Escape');
    await delay(200);
  }
  // Force-remove any remaining fixed overlays via DOM
  await page.evaluate(() => {
    document.querySelectorAll('.fixed').forEach(el => {
      const style = window.getComputedStyle(el);
      if (style.position === 'fixed' && style.zIndex && parseInt(style.zIndex) > 40) {
        el.remove();
      }
    });
    // Also remove by common overlay patterns
    document.querySelectorAll('[class*="inset-0"][class*="bg-black"], [class*="inset-0"][class*="backdrop"]').forEach(el => {
      el.closest('.fixed')?.remove() || el.remove();
    });
  });
  await delay(300);
}

async function enableDarkMode(page) {
  const isDark = await page.evaluate(() => document.querySelector('.dark') !== null);
  if (isDark) { console.log('  Dark mode already active'); return; }
  await page.keyboard.press('Control+Shift+k');
  await delay(500);
  const nowDark = await page.evaluate(() => document.querySelector('.dark') !== null);
  if (!nowDark) {
    try {
      const moonBtn = page.locator('button').filter({ has: page.locator('svg.lucide-moon') });
      if (await moonBtn.first().isVisible({ timeout: 2000 })) {
        await moonBtn.first().click();
        await delay(500);
      }
    } catch { /* ignore */ }
  }
  console.log('  Dark mode enabled');
}

async function importDiagram(page, diagram) {
  await dismissOverlays(page);
  const importBtn = page.locator('[data-tooltip="Import JSON"]');
  await importBtn.click({ timeout: 5000 });
  await delay(800);

  const textarea = page.locator('textarea');
  await textarea.waitFor({ state: 'visible', timeout: 5000 });
  await textarea.fill(JSON.stringify(diagram));
  await delay(300);

  const importAction = page.locator('button').filter({ hasText: /^Import$/ });
  await importAction.click();
  await delay(1000);
}

async function fitView(page) {
  try {
    const fitBtn = page.locator('.react-flow__controls button[title="fit view"]');
    await fitBtn.click({ timeout: 3000 });
  } catch {
    try { const altBtn = page.locator('.react-flow__controls button').nth(2); await altBtn.click({ timeout: 2000 }); } catch { /* skip */ }
  }
  await delay(800);
}

async function clearCanvas(page) {
  await dismissOverlays(page);
  await clickCanvas(page);
  await page.keyboard.press('Control+a');
  await delay(300);
  await page.keyboard.press('Delete');
  await delay(500);
}

async function clickCanvas(page) {
  await dismissOverlays(page);
  const pane = page.locator('.react-flow__pane');
  await pane.click({ position: { x: 50, y: 50 }, timeout: 5000 });
  await delay(300);
}

async function screenshotFull(page, filename) {
  await page.screenshot({ path: join(ASSETS_DIR, filename) });
  console.log(`  ✓ ${filename}`);
}

async function screenshotElement(page, locator, filename, padding = 0) {
  const el = typeof locator === 'string' ? page.locator(locator).first() : locator;
  const box = await el.boundingBox();
  if (box) {
    await page.screenshot({
      path: join(ASSETS_DIR, filename),
      clip: {
        x: Math.max(0, box.x - padding),
        y: Math.max(0, box.y - padding),
        width: box.width + padding * 2,
        height: box.height + padding * 2,
      },
    });
    console.log(`  ✓ ${filename}`);
  } else {
    console.log(`  ✗ Could not find element for ${filename}`);
  }
}

async function screenshotCanvas(page, filename) {
  await screenshotElement(page, '.react-flow', filename);
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log(`Navigating to ${BASE_URL}...`);
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await delay(2500);
  await page.waitForSelector('.react-flow', { timeout: 15000 });
  console.log('App loaded.\n');

  // Close any startup dialogs
  try {
    const closeBtn = page.locator('button:has-text("Close"), button:has-text("Got it"), button:has-text("Dismiss")');
    if (await closeBtn.first().isVisible({ timeout: 1000 })) { await closeBtn.first().click(); await delay(500); }
  } catch { /* no dialog */ }

  // ─── Enable dark mode ─────────────────────────────────────────
  console.log('=== Enabling dark mode ===');
  await enableDarkMode(page);
  await delay(500);

  // ─── 1. HERO ──────────────────────────────────────────────────
  console.log('\n--- 1. Hero Screenshots ---');
  await clearCanvas(page);
  await importDiagram(page, HERO_DIAGRAM);
  await fitView(page);
  await clickCanvas(page);
  await screenshotFull(page, 'hero-dark.png');
  await screenshotCanvas(page, 'guide-canvas-overview.png');

  // ─── 2. SHAPE PALETTE ─────────────────────────────────────────
  console.log('\n--- 2. Shape Palette ---');
  const shapePalette = page.locator('div.flex.flex-col.w-14').first();
  if (await shapePalette.isVisible({ timeout: 2000 }).catch(() => false)) {
    const box = await shapePalette.boundingBox();
    if (box) {
      await page.screenshot({
        path: join(ASSETS_DIR, 'wiki-shape-palette.png'),
        clip: { x: box.x, y: box.y, width: box.width + 30, height: box.height },
      });
      console.log('  ✓ wiki-shape-palette.png');
      await page.screenshot({
        path: join(ASSETS_DIR, 'guide-shape-palette.png'),
        clip: { x: box.x, y: box.y, width: box.width + 30, height: box.height },
      });
      console.log('  ✓ guide-shape-palette.png');
    }
  }

  // ─── 3. PROPERTIES PANEL ──────────────────────────────────────
  console.log('\n--- 3. Properties Panel ---');
  const firstNode = page.locator('.react-flow__node').first();
  await firstNode.click();
  await delay(500);
  const panelSel = 'div[class*="w-\\[280px\\]"]';
  if (await page.locator(panelSel).first().isVisible({ timeout: 2000 }).catch(() => false)) {
    await screenshotElement(page, panelSel, 'properties-panel.png', 2);
    await screenshotElement(page, panelSel, 'wiki-properties-panel.png', 2);
    await screenshotElement(page, panelSel, 'properties-panel-overview.png', 2);
  }

  // ─── 4. SELECT ALL ────────────────────────────────────────────
  console.log('\n--- 4. Select All ---');
  await page.keyboard.press('Control+a');
  await delay(500);
  await screenshotCanvas(page, 'wiki-select-all.png');

  // ─── 5. SELECTION CONTEXT MENU ────────────────────────────────
  console.log('\n--- 5. Selection Context Menu ---');
  try {
    const selNode = page.locator('.react-flow__node').first();
    const nb = await selNode.boundingBox();
    if (nb) {
      await page.mouse.click(nb.x + nb.width / 2, nb.y + nb.height / 2, { button: 'right' });
      await delay(600);
      await screenshotFull(page, 'wiki-selection-context-menu.png');
      await dismissOverlays(page);
    }
  } catch (e) { console.log('  ✗ Selection context menu failed:', e.message); }

  // ─── 6. NODE CONTEXT MENU ────────────────────────────────────
  console.log('\n--- 6. Node Context Menu ---');
  try {
    await clickCanvas(page);
    await firstNode.click();
    await delay(300);
    const nb2 = await firstNode.boundingBox();
    if (nb2) {
      await page.mouse.click(nb2.x + nb2.width / 2, nb2.y + nb2.height / 2, { button: 'right' });
      await delay(600);
      await screenshotFull(page, 'wiki-node-context-menu.png');
      await screenshotFull(page, 'guide-context-menu.png');
      await dismissOverlays(page);
    }
  } catch (e) { console.log('  ✗ Node context menu failed:', e.message); }

  // ─── 7. KEYBOARD SHORTCUTS ────────────────────────────────────
  console.log('\n--- 7. Keyboard Shortcuts ---');
  try {
    await clickCanvas(page);
    await page.keyboard.press('Control+/');
    await delay(800);
    await screenshotFull(page, 'wiki-keyboard-shortcuts.png');
    await screenshotFull(page, 'guide-shortcuts-dialog.png');
    await dismissOverlays(page);
  } catch (e) { console.log('  ✗ Shortcuts dialog failed:', e.message); }

  // ─── 8. ALIGN & DISTRIBUTE ────────────────────────────────────
  console.log('\n--- 8. Align & Distribute ---');
  try {
    await clickCanvas(page);
    await page.keyboard.press('Control+a');
    await delay(300);
    const alignBtn = page.locator('[data-tooltip*="Align"]').first();
    if (await alignBtn.isVisible({ timeout: 2000 })) {
      await alignBtn.click();
      await delay(500);
      await screenshotFull(page, 'wiki-align-distribute.png');
      await dismissOverlays(page);
    } else {
      console.log('  ✗ Align button not found');
    }
  } catch (e) { console.log('  ✗ Align failed:', e.message); }

  // ─── 9. FORMAT PAINTER ────────────────────────────────────────
  console.log('\n--- 9. Format Painter ---');
  try {
    await clickCanvas(page);
    await firstNode.click();
    await delay(300);
    const fmtBtn = page.locator('[data-tooltip*="Format Painter"]').first();
    if (await fmtBtn.isVisible({ timeout: 2000 })) {
      const fmtBox = await fmtBtn.boundingBox();
      if (fmtBox) {
        await page.screenshot({
          path: join(ASSETS_DIR, 'wiki-format-painter.png'),
          clip: { x: Math.max(0, fmtBox.x - 60), y: Math.max(0, fmtBox.y - 10), width: 200, height: 50 },
        });
        console.log('  ✓ wiki-format-painter.png');
      }
    } else {
      console.log('  ✗ Format painter button not found');
    }
  } catch (e) { console.log('  ✗ Format painter failed:', e.message); }

  // ─── 10. CONNECTORS ───────────────────────────────────────────
  console.log('\n--- 10. Connectors Overview ---');
  await clearCanvas(page);
  await importDiagram(page, CONNECTORS_DIAGRAM);
  await fitView(page);
  await clickCanvas(page);
  await screenshotCanvas(page, 'connectors-overview.png');

  // ─── 11. STATUS PUCKS ─────────────────────────────────────────
  console.log('\n--- 11. Status Pucks ---');
  await clearCanvas(page);
  await importDiagram(page, PUCKS_DIAGRAM);
  await fitView(page);
  await clickCanvas(page);
  await screenshotCanvas(page, 'wiki-status-pucks.png');
  await screenshotCanvas(page, 'wiki-pucks-on-nodes.png');

  // Right-click for "Add Status" menu
  try {
    const pn = page.locator('.react-flow__node').first();
    const pnb = await pn.boundingBox();
    if (pnb) {
      await page.mouse.click(pnb.x + pnb.width / 2, pnb.y + pnb.height / 2, { button: 'right' });
      await delay(600);
      await screenshotFull(page, 'wiki-add-status-menu.png');
      await dismissOverlays(page);
    }
  } catch (e) { console.log('  ✗ Status menu failed:', e.message); }

  // ─── 12. LEGENDS ──────────────────────────────────────────────
  console.log('\n--- 12. Legends ---');
  await clearCanvas(page);
  await importDiagram(page, LEGEND_DIAGRAM);
  await fitView(page);
  await clickCanvas(page);
  await screenshotCanvas(page, 'legends-overview.png');

  // ─── 13. EXPORT DIALOG ────────────────────────────────────────
  console.log('\n--- 13. Export Dialog ---');
  try {
    await clickCanvas(page);
    await page.keyboard.press('Control+Shift+e');
    await delay(800);
    await screenshotFull(page, 'wiki-export-dialog.png');
    await screenshotFull(page, 'export-dialog.png');

    // PDF tab
    try {
      const pdfTab = page.locator('button').filter({ hasText: /PDF/i }).first();
      if (await pdfTab.isVisible({ timeout: 1000 })) {
        await pdfTab.click();
        await delay(500);
        await screenshotFull(page, 'wiki-export-pdf.png');
      }
    } catch { /* no PDF tab */ }

    await dismissOverlays(page);
  } catch (e) { console.log('  ✗ Export dialog failed:', e.message); }

  // ─── RECOVERY: reload app and re-enable dark mode if stuck ───
  console.log('\n--- Recovering: reloading app ---');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await delay(2500);
  await page.waitForSelector('.react-flow', { timeout: 15000 });
  await enableDarkMode(page);
  await delay(500);
  // Re-import the hero diagram for remaining screenshots
  await clearCanvas(page);
  await importDiagram(page, HERO_DIAGRAM);
  await fitView(page);
  await clickCanvas(page);

  // ─── 14. STYLE PICKER ────────────────────────────────────────
  console.log('\n--- 14. Style Picker ---');
  try {
    await clickCanvas(page);
    const styleBtn = page.locator('[data-tooltip*="Style"]').first();
    if (await styleBtn.isVisible({ timeout: 2000 })) {
      await styleBtn.click();
      await delay(600);
      await screenshotFull(page, 'wiki-style-picker.png');
      await screenshotFull(page, 'guide-style-picker.png');
      await dismissOverlays(page);
    }
  } catch (e) { console.log('  ✗ Style picker failed:', e.message); }

  // ─── 15. TEMPLATE GALLERY ────────────────────────────────────
  console.log('\n--- 15. Template Gallery ---');
  try {
    await clickCanvas(page);
    const fileBtn = page.locator('button, [role="menuitem"]').filter({ hasText: /^File$/i }).first();
    if (await fileBtn.isVisible({ timeout: 2000 })) {
      await fileBtn.click();
      await delay(500);
      const tplBtn = page.locator('button, [role="menuitem"], div').filter({ hasText: /Template/i }).first();
      if (await tplBtn.isVisible({ timeout: 2000 })) {
        await tplBtn.click();
        await delay(800);
        await screenshotFull(page, 'wiki-template-gallery.png');
        await screenshotFull(page, 'template-gallery.png');
        await dismissOverlays(page);
      }
    }
  } catch (e) { console.log('  ✗ Template gallery failed:', e.message); }

  // ─── 16. AI PANEL ─────────────────────────────────────────────
  console.log('\n--- 16. AI Panel ---');
  try {
    await clickCanvas(page);
    await page.keyboard.press('Control+Shift+a');
    await delay(800);
    await screenshotFull(page, 'wiki-ai-panel.png');
    await screenshotFull(page, 'ai-assistant.png');
    await screenshotFull(page, 'guide-ai-panel.png');
    await dismissOverlays(page);
  } catch (e) { console.log('  ✗ AI panel failed:', e.message); }

  // ─── 17. DARK MODE TOGGLE ────────────────────────────────────
  console.log('\n--- 17. Dark Mode ---');
  try {
    const statusBar = page.locator('div[class*="h-6"][class*="border-t"]').first();
    if (await statusBar.isVisible({ timeout: 2000 })) {
      await screenshotElement(page, statusBar, 'wiki-dark-mode.png', 4);
      await screenshotElement(page, statusBar, 'guide-dark-mode.png', 4);
    }
  } catch (e) { console.log('  ✗ Dark mode screenshot failed:', e.message); }

  // ─── 18. GRID & SNAP OPTIONS ──────────────────────────────────
  console.log('\n--- 18. Grid & Snap ---');
  try {
    await clickCanvas(page);
    const gridBtn = page.locator('[data-tooltip*="Grid"]').first();
    if (await gridBtn.isVisible({ timeout: 2000 })) {
      await gridBtn.click();
      await delay(500);
      await screenshotFull(page, 'wiki-grid-options.png');
      await dismissOverlays(page);
    }
  } catch (e) { console.log('  ✗ Grid options failed:', e.message); }

  try {
    const snapBtn = page.locator('[data-tooltip*="Snap"]').first();
    if (await snapBtn.isVisible({ timeout: 2000 })) {
      await snapBtn.click();
      await delay(500);
      await screenshotFull(page, 'wiki-snap-options.png');
      await dismissOverlays(page);
    }
  } catch (e) { console.log('  ✗ Snap options failed:', e.message); }

  // ─── 19. SWIMLANE DIALOG ──────────────────────────────────────
  console.log('\n--- 19. Swimlane ---');
  try {
    const laneBtn = page.locator('[data-tooltip-right="Swimlanes"]').first();
    if (await laneBtn.isVisible({ timeout: 2000 })) {
      await laneBtn.click();
      await delay(800);
      await screenshotFull(page, 'wiki-swimlane-dialog.png');
      await dismissOverlays(page);
    }
  } catch (e) { console.log('  ✗ Swimlane failed:', e.message); }

  // ─── RECOVERY: reload again after swimlane dialog ──────────
  console.log('\n--- Recovering: reloading app ---');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await delay(2500);
  await page.waitForSelector('.react-flow', { timeout: 15000 });
  await enableDarkMode(page);
  await delay(500);

  // ─── 20. SELECT SAME TYPE ─────────────────────────────────────
  console.log('\n--- 20. Select Same Type ---');
  try {
    await clearCanvas(page);
    await importDiagram(page, HERO_DIAGRAM);
    await fitView(page);
    await clickCanvas(page);
    const stNode = page.locator('.react-flow__node').first();
    await stNode.click();
    await delay(300);
    const stb = await stNode.boundingBox();
    if (stb) {
      await page.mouse.click(stb.x + stb.width / 2, stb.y + stb.height / 2, { button: 'right' });
      await delay(600);
      await screenshotFull(page, 'wiki-select-same-type.png');
      await dismissOverlays(page);
    }
  } catch (e) { console.log('  ✗ Select same type failed:', e.message); }

  // ─── 21. DEPENDENCY BADGES ────────────────────────────────────
  console.log('\n--- 21. Dependencies ---');
  try {
    await clickCanvas(page);
    const dNode = page.locator('.react-flow__node').first();
    await dNode.click();
    await delay(300);
    const depsTab = page.locator('button').filter({ hasText: /DEPS/i }).first();
    if (await depsTab.isVisible({ timeout: 2000 })) {
      await depsTab.click();
      await delay(500);
      await screenshotFull(page, 'wiki-dependency-badges.png');
    }
  } catch (e) { console.log('  ✗ Dependencies failed:', e.message); }

  // ─── 22. NEON DARK STYLE ──────────────────────────────────────
  console.log('\n--- 22. Neon Dark Style ---');
  try {
    await clickCanvas(page);
    const styleBtn2 = page.locator('[data-tooltip*="Style"]').first();
    if (await styleBtn2.isVisible({ timeout: 2000 })) {
      await styleBtn2.click();
      await delay(600);
      const neonOpt = page.locator('button, div').filter({ hasText: /Neon Dark/i }).first();
      if (await neonOpt.isVisible({ timeout: 2000 })) {
        await neonOpt.click();
        await delay(800);
      }
      await dismissOverlays(page);
      await clickCanvas(page);
      await screenshotFull(page, 'wiki-neon-dark-style.png');

      // Reset to Clean Minimal
      await styleBtn2.click();
      await delay(600);
      const cleanOpt = page.locator('button, div').filter({ hasText: /Clean Minimal/i }).first();
      if (await cleanOpt.isVisible({ timeout: 2000 })) {
        await cleanOpt.click();
        await delay(500);
      }
      await dismissOverlays(page);
    }
  } catch (e) { console.log('  ✗ Neon dark style failed:', e.message); }

  // ─── 23. AUTO LAYOUT ─────────────────────────────────────────
  console.log('\n--- 23. Auto Layout ---');
  try {
    await clickCanvas(page);
    const layoutBtn = page.locator('button, [role="menuitem"]').filter({ hasText: /^Layout$/i }).first();
    if (await layoutBtn.isVisible({ timeout: 2000 })) {
      await layoutBtn.click();
      await delay(500);
      await screenshotFull(page, 'guide-auto-layout.png');
      await dismissOverlays(page);
    }
  } catch (e) { console.log('  ✗ Auto layout failed:', e.message); }

  // ═══════════════════════════════════════════════════════════════
  console.log('\n=== All dark mode screenshots complete! ===');
  console.log(`Output: ${ASSETS_DIR}`);

  await delay(2000);
  await browser.close();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
