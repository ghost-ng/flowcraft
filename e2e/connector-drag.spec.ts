import { test, expect } from '@playwright/test';

test.describe('Connector drag from palette', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/Chart-Hero/');
    await page.waitForSelector('[data-charthero-canvas]', { timeout: 10000 });
  });

  test('connector buttons are visible and draggable', async ({ page }) => {
    // The shape palette should be open by default
    // Find connector buttons by their tooltip
    const smoothStepBtn = page.locator('[data-tooltip-right="Smooth Step"]');
    await expect(smoothStepBtn).toBeVisible();

    const bezierBtn = page.locator('[data-tooltip-right="Bezier"]');
    await expect(bezierBtn).toBeVisible();

    const stepBtn = page.locator('[data-tooltip-right="Step"]');
    await expect(stepBtn).toBeVisible();

    const straightBtn = page.locator('[data-tooltip-right="Straight"]');
    await expect(straightBtn).toBeVisible();

    // All should have draggable attribute
    await expect(smoothStepBtn).toHaveAttribute('draggable', 'true');
    await expect(bezierBtn).toHaveAttribute('draggable', 'true');
  });

  test('dragging a connector onto canvas creates nodes and edge', async ({ page }) => {
    const straightBtn = page.locator('[data-tooltip-right="Straight"]');
    await expect(straightBtn).toBeVisible();

    // Get the canvas area
    const canvas = page.locator('.react-flow__pane');
    await expect(canvas).toBeVisible();

    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).toBeTruthy();

    // Count nodes before drag
    const nodesBefore = await page.locator('.react-flow__node').count();

    // Perform drag and drop
    const sourceBox = await straightBtn.boundingBox();
    expect(sourceBox).toBeTruthy();

    // Use page.mouse for drag simulation
    const srcX = sourceBox!.x + sourceBox!.width / 2;
    const srcY = sourceBox!.y + sourceBox!.height / 2;
    const tgtX = canvasBox!.x + canvasBox!.width / 2;
    const tgtY = canvasBox!.y + canvasBox!.height / 2;

    // Try using dispatchEvent approach for HTML5 drag-drop
    await page.evaluate(
      ({ srcSelector, targetSelector, connectorType, tgtX, tgtY }) => {
        const src = document.querySelector(srcSelector) as HTMLElement;
        const target = document.querySelector(targetSelector) as HTMLElement;
        if (!src || !target) throw new Error('Elements not found');

        const dataTransfer = new DataTransfer();
        dataTransfer.setData('application/charthero-connector', connectorType);

        src.dispatchEvent(new DragEvent('dragstart', { dataTransfer, bubbles: true }));
        target.dispatchEvent(new DragEvent('dragover', { dataTransfer, bubbles: true, cancelable: true, clientX: tgtX, clientY: tgtY }));
        target.dispatchEvent(new DragEvent('drop', { dataTransfer, bubbles: true, cancelable: true, clientX: tgtX, clientY: tgtY }));
        src.dispatchEvent(new DragEvent('dragend', { dataTransfer, bubbles: true }));
      },
      {
        srcSelector: '[data-tooltip-right="Straight"]',
        targetSelector: '.react-flow__pane',
        connectorType: 'straight',
        tgtX,
        tgtY,
      },
    );

    // Wait for nodes to appear
    await page.waitForTimeout(500);

    // Should have 2 more nodes
    const nodesAfter = await page.locator('.react-flow__node').count();
    expect(nodesAfter).toBe(nodesBefore + 2);

    // Should have an edge
    const edges = await page.locator('.react-flow__edge').count();
    expect(edges).toBeGreaterThanOrEqual(1);
  });

  test('native drag of connector onto canvas creates nodes and edge', async ({ page }) => {
    const bezierBtn = page.locator('[data-tooltip-right="Bezier"]');
    await expect(bezierBtn).toBeVisible();

    const canvas = page.locator('.react-flow__pane');
    await expect(canvas).toBeVisible();

    const nodesBefore = await page.locator('.react-flow__node').count();

    // Use Playwright's native dragTo
    await bezierBtn.dragTo(canvas, {
      targetPosition: { x: 400, y: 300 },
    });

    await page.waitForTimeout(500);

    const nodesAfter = await page.locator('.react-flow__node').count();
    // If native drag works, we get 2 new nodes
    // If it doesn't, the count stays the same - this helps us diagnose
    console.log(`Nodes before: ${nodesBefore}, after: ${nodesAfter}`);
    expect(nodesAfter).toBe(nodesBefore + 2);
  });

  test('clicking connector button sets default edge type (visual highlight)', async ({ page }) => {
    const bezierBtn = page.locator('[data-tooltip-right="Bezier"]');
    await bezierBtn.click();

    // Should have active ring class
    await expect(bezierBtn).toHaveClass(/ring-2/);

    // Smooth step should NOT have active ring
    const smoothStepBtn = page.locator('[data-tooltip-right="Smooth Step"]');
    await expect(smoothStepBtn).not.toHaveClass(/ring-2/);
  });
});
