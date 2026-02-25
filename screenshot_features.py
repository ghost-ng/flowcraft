"""Capture feature screenshots for Chart Hero wiki using Playwright.

v5 - Fixes: pucks baked into JSON template (fresh import), correct setStyle method.
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright, Page

BASE = "http://localhost:5173/Chart-Hero/"
ASSETS = Path(r"c:\Users\miguel\OneDrive\Documents\Flowcraft\assets")
ASSETS.mkdir(exist_ok=True)

# Template JSON (no pucks - used for most screenshots)
TEMPLATE_JSON = r'''{"nodes": [
  {"id":"start","type":"shapeNode","position":{"x":300,"y":50},"data":{"label":"Start","shape":"roundedRectangle","color":"#10b981","borderColor":"#059669","textColor":"#ffffff","fontSize":14,"fontWeight":600,"width":140,"height":50,"borderWidth":2,"borderRadius":12}},
  {"id":"process-a","type":"shapeNode","position":{"x":100,"y":180},"data":{"label":"Process A","shape":"rectangle","color":"#3b82f6","borderColor":"#2563eb","textColor":"#ffffff","fontSize":14,"width":140,"height":55,"borderWidth":2,"borderRadius":6}},
  {"id":"process-b","type":"shapeNode","position":{"x":300,"y":180},"data":{"label":"Process B","shape":"rectangle","color":"#3b82f6","borderColor":"#2563eb","textColor":"#ffffff","fontSize":14,"width":140,"height":55,"borderWidth":2,"borderRadius":6}},
  {"id":"process-c","type":"shapeNode","position":{"x":500,"y":180},"data":{"label":"Process C","shape":"rectangle","color":"#3b82f6","borderColor":"#2563eb","textColor":"#ffffff","fontSize":14,"width":140,"height":55,"borderWidth":2,"borderRadius":6}},
  {"id":"decision","type":"shapeNode","position":{"x":270,"y":320},"data":{"label":"Decision","shape":"diamond","color":"#f59e0b","borderColor":"#d97706","textColor":"#ffffff","fontSize":14,"width":120,"height":120,"borderWidth":2}},
  {"id":"database","type":"shapeNode","position":{"x":100,"y":450},"data":{"label":"Database","shape":"database","color":"#8b5cf6","borderColor":"#7c3aed","textColor":"#ffffff","fontSize":14,"width":130,"height":65,"borderWidth":2}},
  {"id":"end","type":"shapeNode","position":{"x":400,"y":450},"data":{"label":"End","shape":"roundedRectangle","color":"#ef4444","borderColor":"#dc2626","textColor":"#ffffff","fontSize":14,"fontWeight":600,"width":140,"height":50,"borderWidth":2,"borderRadius":12}}
],"edges":[
  {"id":"e-start-a","source":"start","target":"process-a","type":"smoothstep","data":{"label":"","color":"#64748b","thickness":2}},
  {"id":"e-start-b","source":"start","target":"process-b","type":"smoothstep","data":{"label":"","color":"#64748b","thickness":2}},
  {"id":"e-start-c","source":"start","target":"process-c","type":"smoothstep","data":{"label":"","color":"#64748b","thickness":2}},
  {"id":"e-a-dec","source":"process-a","target":"decision","type":"smoothstep","data":{"label":"","color":"#64748b","thickness":2}},
  {"id":"e-b-dec","source":"process-b","target":"decision","type":"smoothstep","data":{"label":"Yes","color":"#64748b","thickness":2}},
  {"id":"e-c-dec","source":"process-c","target":"decision","type":"smoothstep","data":{"label":"","color":"#64748b","thickness":2}},
  {"id":"e-dec-db","source":"decision","target":"database","type":"smoothstep","data":{"label":"Save","color":"#64748b","thickness":2}},
  {"id":"e-dec-end","source":"decision","target":"end","type":"smoothstep","data":{"label":"Done","color":"#64748b","thickness":2}}
]}'''

# Template JSON WITH pucks baked in (used for status pucks screenshot)
# Pucks are in statusIndicators array so the import code picks them up on first render
TEMPLATE_WITH_PUCKS_JSON = r'''{"nodes": [
  {"id":"start","type":"shapeNode","position":{"x":300,"y":50},"data":{"label":"Start","shape":"roundedRectangle","color":"#10b981","borderColor":"#059669","textColor":"#ffffff","fontSize":14,"fontWeight":600,"width":140,"height":50,"borderWidth":2,"borderRadius":12}},
  {"id":"process-a","type":"shapeNode","position":{"x":100,"y":180},"data":{"label":"Process A","shape":"rectangle","color":"#3b82f6","borderColor":"#2563eb","textColor":"#ffffff","fontSize":14,"width":140,"height":55,"borderWidth":2,"borderRadius":6,"statusIndicators":[{"id":"pk_a","status":"in-progress","color":"#f59e0b","size":22,"position":"top-right","borderColor":"#ffffff","borderWidth":2,"borderStyle":"solid"}]}},
  {"id":"process-b","type":"shapeNode","position":{"x":300,"y":180},"data":{"label":"Process B","shape":"rectangle","color":"#3b82f6","borderColor":"#2563eb","textColor":"#ffffff","fontSize":14,"width":140,"height":55,"borderWidth":2,"borderRadius":6,"statusIndicators":[{"id":"pk_b","status":"completed","color":"#10b981","size":22,"position":"top-right","borderColor":"#ffffff","borderWidth":2,"borderStyle":"solid"}]}},
  {"id":"process-c","type":"shapeNode","position":{"x":500,"y":180},"data":{"label":"Process C","shape":"rectangle","color":"#3b82f6","borderColor":"#2563eb","textColor":"#ffffff","fontSize":14,"width":140,"height":55,"borderWidth":2,"borderRadius":6,"statusIndicators":[{"id":"pk_c","status":"blocked","color":"#ef4444","size":22,"position":"top-right","borderColor":"#ffffff","borderWidth":2,"borderStyle":"solid"}]}},
  {"id":"decision","type":"shapeNode","position":{"x":270,"y":320},"data":{"label":"Decision","shape":"diamond","color":"#f59e0b","borderColor":"#d97706","textColor":"#ffffff","fontSize":14,"width":120,"height":120,"borderWidth":2,"statusIndicators":[{"id":"pk_d","status":"review","color":"#f97316","size":22,"position":"top-right","borderColor":"#ffffff","borderWidth":2,"borderStyle":"solid"}]}},
  {"id":"database","type":"shapeNode","position":{"x":100,"y":450},"data":{"label":"Database","shape":"database","color":"#8b5cf6","borderColor":"#7c3aed","textColor":"#ffffff","fontSize":14,"width":130,"height":65,"borderWidth":2,"statusIndicators":[{"id":"pk_e","status":"not-started","color":"#94a3b8","size":22,"position":"top-right","borderColor":"#ffffff","borderWidth":2,"borderStyle":"solid"}]}},
  {"id":"end","type":"shapeNode","position":{"x":400,"y":450},"data":{"label":"End","shape":"roundedRectangle","color":"#ef4444","borderColor":"#dc2626","textColor":"#ffffff","fontSize":14,"fontWeight":600,"width":140,"height":50,"borderWidth":2,"borderRadius":12}}
],"edges":[
  {"id":"e-start-a","source":"start","target":"process-a","type":"smoothstep","data":{"label":"","color":"#64748b","thickness":2}},
  {"id":"e-start-b","source":"start","target":"process-b","type":"smoothstep","data":{"label":"","color":"#64748b","thickness":2}},
  {"id":"e-start-c","source":"start","target":"process-c","type":"smoothstep","data":{"label":"","color":"#64748b","thickness":2}},
  {"id":"e-a-dec","source":"process-a","target":"decision","type":"smoothstep","data":{"label":"","color":"#64748b","thickness":2}},
  {"id":"e-b-dec","source":"process-b","target":"decision","type":"smoothstep","data":{"label":"Yes","color":"#64748b","thickness":2}},
  {"id":"e-c-dec","source":"process-c","target":"decision","type":"smoothstep","data":{"label":"","color":"#64748b","thickness":2}},
  {"id":"e-dec-db","source":"decision","target":"database","type":"smoothstep","data":{"label":"Save","color":"#64748b","thickness":2}},
  {"id":"e-dec-end","source":"decision","target":"end","type":"smoothstep","data":{"label":"Done","color":"#64748b","thickness":2}}
]}'''


async def screenshot(page: Page, name: str, delay: float = 0.5):
    """Wait briefly then take a full page screenshot."""
    await asyncio.sleep(delay)
    path = ASSETS / f"{name}.png"
    await page.screenshot(path=str(path), type="png")
    print(f"  -> {name}.png")


async def import_diagram(page: Page, json_str: str):
    """Import a diagram via the Import JSON dialog."""
    await page.click('[data-tooltip="Import JSON"]', force=True, timeout=5000)
    await asyncio.sleep(0.8)
    textarea = page.locator("textarea").first
    await textarea.fill(json_str)
    await asyncio.sleep(0.3)
    await page.click('button:has-text("Import")', force=True)
    await asyncio.sleep(1.5)
    await page.click('[data-tooltip="Fit View"]', force=True, timeout=3000)
    await asyncio.sleep(0.8)


async def dismiss_all(page: Page):
    """Dismiss any open dialogs/menus/overlays."""
    for _ in range(3):
        await page.keyboard.press("Escape")
        await asyncio.sleep(0.2)
    try:
        cancel = page.locator('button:has-text("Cancel")')
        if await cancel.count() > 0 and await cancel.first.is_visible():
            await cancel.first.click(force=True)
            await asyncio.sleep(0.3)
    except:
        pass


async def run():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=False)
        ctx = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=1,
        )
        page = await ctx.new_page()

        # ---- Load app ----
        print("Loading app...")
        await page.goto(BASE)
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(3)
        await page.keyboard.press("Escape")
        await asyncio.sleep(0.5)

        # Wait for stores to be exposed
        await page.wait_for_function("window.__flowStore__", timeout=5000)
        print("Stores exposed on window")

        # Import template
        print("Importing template diagram...")
        await import_diagram(page, TEMPLATE_JSON)

        # ================================================================
        # PHASE 1: Basic screenshots (unchanged from before, already working)
        # ================================================================

        # -- 1. Properties Panel --
        print("\n1. Properties panel...")
        try:
            node = page.locator('.react-flow__node').filter(has_text="Decision").first
            await node.click(force=True)
            await asyncio.sleep(0.5)
            await screenshot(page, "wiki-properties-panel")
        except Exception as e:
            print(f"  Error: {e}")

        # -- 2. Select All --
        print("\n2. Select All...")
        try:
            await page.locator('.react-flow__pane').click(force=True)
            await asyncio.sleep(0.3)
            await page.keyboard.press("Control+a")
            await asyncio.sleep(0.5)
            await screenshot(page, "wiki-select-all")
            await page.keyboard.press("Escape")
            await asyncio.sleep(0.3)
        except Exception as e:
            print(f"  Error: {e}")

        # -- 3. Select Same Type (via store for reliable selection) --
        print("\n3. Select Same Type...")
        try:
            # First click Process A to select it
            node_a = page.locator('.react-flow__node').filter(has_text="Process A").first
            await node_a.click(force=True)
            await asyncio.sleep(0.3)
            # Use store to select all rectangles (more reliable)
            await page.evaluate("""() => {
                const store = window.__flowStore__;
                const state = store.getState();
                const rectIds = state.nodes.filter(n => n.data.shape === 'rectangle').map(n => n.id);
                state.setSelectedNodes(rectIds);
            }""")
            await asyncio.sleep(0.5)
            await screenshot(page, "wiki-select-same-type")
            # Deselect
            await page.evaluate("() => window.__flowStore__.getState().setSelectedNodes([])")
            await asyncio.sleep(0.3)
        except Exception as e:
            print(f"  Error: {e}")

        # -- 4. Align & Distribute --
        print("\n4. Align & Distribute...")
        try:
            node_a = page.locator('.react-flow__node').filter(has_text="Process A").first
            node_b = page.locator('.react-flow__node').filter(has_text="Process B").first
            node_c = page.locator('.react-flow__node').filter(has_text="Process C").first
            await node_a.click(force=True)
            await node_b.click(force=True, modifiers=["Shift"])
            await node_c.click(force=True, modifiers=["Shift"])
            await asyncio.sleep(0.3)
            await page.click('[data-tooltip="Align & Distribute"]', force=True, timeout=3000)
            await asyncio.sleep(0.5)
            await screenshot(page, "wiki-align-distribute")
            await page.keyboard.press("Escape")
            await asyncio.sleep(0.3)
        except Exception as e:
            print(f"  Error: {e}")

        # -- 5. Node Context Menu --
        print("\n5. Node context menu...")
        try:
            await page.locator('.react-flow__pane').click(force=True)
            await asyncio.sleep(0.2)
            node = page.locator('.react-flow__node').filter(has_text="Decision").first
            await node.click(button="right", force=True)
            await asyncio.sleep(0.5)
            await screenshot(page, "wiki-node-context-menu")
            await page.keyboard.press("Escape")
            await asyncio.sleep(0.3)
        except Exception as e:
            print(f"  Error: {e}")

        # -- 6. Selection Context Menu --
        print("\n6. Selection context menu...")
        try:
            node_a = page.locator('.react-flow__node').filter(has_text="Process A").first
            node_b = page.locator('.react-flow__node').filter(has_text="Process B").first
            await node_a.click(force=True)
            await node_b.click(force=True, modifiers=["Shift"])
            await asyncio.sleep(0.3)
            await node_b.click(button="right", force=True)
            await asyncio.sleep(0.5)
            await screenshot(page, "wiki-selection-context-menu")
            await page.keyboard.press("Escape")
            await asyncio.sleep(0.3)
        except Exception as e:
            print(f"  Error: {e}")

        # -- 7. Add Status submenu --
        print("\n7. Add Status submenu...")
        try:
            await page.locator('.react-flow__pane').click(force=True)
            await asyncio.sleep(0.2)
            node_a = page.locator('.react-flow__node').filter(has_text="Process A").first
            await node_a.click(button="right", force=True)
            await asyncio.sleep(0.5)
            status_btn = page.locator('button:has-text("Add Status")').first
            await status_btn.hover(force=True)
            await asyncio.sleep(0.4)
            await screenshot(page, "wiki-add-status-menu")
            await page.keyboard.press("Escape")
            await asyncio.sleep(0.3)
        except Exception as e:
            print(f"  Error: {e}")
            await dismiss_all(page)

        # -- 8. Dependency Badges --
        print("\n8. Dependency badges...")
        try:
            await page.locator('.react-flow__pane').click(force=True)
            await asyncio.sleep(0.2)
            await page.click('[data-tooltip="Toggle Dependency Badges"]', force=True, timeout=3000)
            await asyncio.sleep(0.8)
            await screenshot(page, "wiki-dependency-badges")
            await page.click('[data-tooltip="Toggle Dependency Badges"]', force=True)
            await asyncio.sleep(0.3)
        except Exception as e:
            print(f"  Error: {e}")

        # -- 9. Grid Options --
        print("\n9. Grid options...")
        try:
            await page.click('[data-tooltip="Grid Options"]', force=True, timeout=3000)
            await asyncio.sleep(0.5)
            await screenshot(page, "wiki-grid-options")
            await page.keyboard.press("Escape")
            await asyncio.sleep(0.3)
        except Exception as e:
            print(f"  Error: {e}")

        # -- 10. Snap Options --
        print("\n10. Snap options...")
        try:
            await page.click('[data-tooltip="Snap Options"]', force=True, timeout=3000)
            await asyncio.sleep(0.5)
            await screenshot(page, "wiki-snap-options")
            await page.keyboard.press("Escape")
            await asyncio.sleep(0.3)
        except Exception as e:
            print(f"  Error: {e}")

        # -- 11. Format Painter --
        print("\n11. Format painter...")
        try:
            node_a = page.locator('.react-flow__node').filter(has_text="Process A").first
            await node_a.click(force=True)
            await asyncio.sleep(0.3)
            fp_btn = page.locator('[data-tooltip="Format Painter"], [data-tooltip*="Format Painter"]').first
            await fp_btn.click(force=True)
            await asyncio.sleep(0.5)
            await screenshot(page, "wiki-format-painter")
            await page.keyboard.press("Escape")
            await asyncio.sleep(0.3)
        except Exception as e:
            print(f"  Error: {e}")

        # -- 12. Style & Palette Picker --
        print("\n12. Style & Palette picker...")
        try:
            await page.click('[data-tooltip="Style & Palette"]', force=True, timeout=3000)
            await asyncio.sleep(0.8)
            await screenshot(page, "wiki-style-picker")
            await page.keyboard.press("Escape")
            await asyncio.sleep(0.3)
        except Exception as e:
            print(f"  Error: {e}")

        # -- 13. Neon Dark Style (via store) --
        print("\n13. Neon Dark style...")
        try:
            await page.evaluate("""() => {
                const styleStore = window.__styleStore__;
                styleStore.getState().setStyle('neonDark');
            }""")
            await asyncio.sleep(1)
            await page.click('[data-tooltip="Fit View"]', force=True)
            await asyncio.sleep(0.5)
            await screenshot(page, "wiki-neon-dark-style")
            # Reset to clean minimal
            await page.evaluate("""() => {
                window.__styleStore__.getState().setStyle('cleanMinimal');
            }""")
            await asyncio.sleep(0.5)
        except Exception as e:
            print(f"  Error: {e}")

        # ================================================================
        # PHASE 2: Keyboard-shortcut dialogs
        # ================================================================

        # -- 14. Keyboard Shortcuts --
        print("\n14. Keyboard shortcuts dialog...")
        try:
            await page.keyboard.press("Control+/")
            await asyncio.sleep(0.8)
            await screenshot(page, "wiki-keyboard-shortcuts")
            await page.keyboard.press("Escape")
            await asyncio.sleep(0.3)
        except Exception as e:
            print(f"  Error: {e}")

        # -- 15. Dark Mode --
        print("\n15. Dark mode...")
        try:
            await page.evaluate("() => window.__styleStore__.getState().setDarkMode(true)")
            await asyncio.sleep(0.8)
            await page.click('[data-tooltip="Fit View"]', force=True)
            await asyncio.sleep(0.5)
            await screenshot(page, "wiki-dark-mode")
            await page.evaluate("() => window.__styleStore__.getState().setDarkMode(false)")
            await asyncio.sleep(0.5)
        except Exception as e:
            print(f"  Error: {e}")

        # -- 16. AI Panel --
        print("\n16. AI panel...")
        try:
            await page.keyboard.press("Control+Shift+a")
            await asyncio.sleep(1)
            await screenshot(page, "wiki-ai-panel")
            await page.keyboard.press("Control+Shift+a")
            await asyncio.sleep(0.3)
        except Exception as e:
            print(f"  Error: {e}")

        # ================================================================
        # PHASE 3: Overlay dialogs
        # ================================================================

        # -- 17. Export dialog --
        print("\n17. Export dialog...")
        try:
            await page.click('[data-tooltip="Export (Ctrl+Shift+E)"]', force=True, timeout=3000)
            await asyncio.sleep(1)
            await screenshot(page, "wiki-export-dialog")
            try:
                pdf_tab = page.locator('button:has-text("PDF")').first
                await pdf_tab.click(force=True)
                await asyncio.sleep(0.5)
                await screenshot(page, "wiki-export-pdf")
            except:
                pass
            try:
                cancel = page.locator('button:has-text("Cancel")').first
                await cancel.click(force=True)
            except:
                await page.keyboard.press("Escape")
            await asyncio.sleep(0.5)
            await dismiss_all(page)
        except Exception as e:
            print(f"  Error: {e}")
            await dismiss_all(page)

        # -- 18. Template Gallery --
        print("\n18. Template gallery...")
        try:
            await page.click('[data-tooltip="File"]', force=True, timeout=3000)
            await asyncio.sleep(0.5)
            tmpl = page.locator('button:has-text("Templates")')
            if await tmpl.count() > 0:
                await tmpl.first.click(force=True)
                await asyncio.sleep(1)
                await screenshot(page, "wiki-template-gallery")
            await page.keyboard.press("Escape")
            await asyncio.sleep(0.5)
            await dismiss_all(page)
        except Exception as e:
            print(f"  Error: {e}")
            await dismiss_all(page)

        # -- 19. Swimlane Creation Dialog (via store) --
        print("\n19. Swimlane creation dialog...")
        try:
            # Force open the creation dialog via store
            await page.evaluate("""() => {
                const store = window.__swimlaneStore__;
                store.getState().setIsCreating(true);
            }""")
            await asyncio.sleep(1)
            await screenshot(page, "wiki-swimlane-dialog")
            # Close it
            await page.evaluate("""() => {
                window.__swimlaneStore__.getState().setIsCreating(false);
            }""")
            await asyncio.sleep(0.5)
        except Exception as e:
            print(f"  Error: {e}")
            await dismiss_all(page)

        # -- 20. Shape Palette --
        print("\n20. Shape palette...")
        try:
            await page.click('[data-tooltip="Fit View"]', force=True)
            await asyncio.sleep(0.5)
            await screenshot(page, "wiki-shape-palette")
        except Exception as e:
            print(f"  Error: {e}")

        # ================================================================
        # PHASE 4: Status Pucks (fresh page load with pucks in JSON)
        # React Flow doesn't re-render nodes when data changes via store
        # after initial render, so we must import with pucks from the start.
        # ================================================================
        print("\n21. Status pucks (fresh load with pucks in JSON)...")
        try:
            # Reload app fresh
            await page.goto(BASE)
            await page.wait_for_load_state("networkidle")
            await asyncio.sleep(3)
            await page.keyboard.press("Escape")
            await asyncio.sleep(0.5)
            await page.wait_for_function("window.__flowStore__", timeout=5000)

            # Import the template that has statusIndicators baked in
            await import_diagram(page, TEMPLATE_WITH_PUCKS_JSON)

            # Deselect and fit view
            await page.locator('.react-flow__pane').click(force=True, position={"x": 50, "y": 50})
            await asyncio.sleep(0.3)
            await page.click('[data-tooltip="Fit View"]', force=True)
            await asyncio.sleep(0.8)

            # Verify pucks are in DOM
            puck_count = await page.evaluate("""() => {
                let count = 0;
                document.querySelectorAll('.react-flow__node').forEach(node => {
                    node.querySelectorAll('div').forEach(d => {
                        if (d.style.borderRadius === '50%' && d.style.backgroundColor) count++;
                    });
                });
                return count;
            }""")
            print(f"  Puck elements in DOM: {puck_count}")

            await screenshot(page, "wiki-status-pucks")
        except Exception as e:
            print(f"  Error: {e}")

        print("\n=== Done! ===")
        import os
        wiki_files = sorted([f for f in os.listdir(str(ASSETS)) if f.startswith("wiki-")])
        print(f"\nCaptured {len(wiki_files)} wiki screenshots:")
        for f in wiki_files:
            size_kb = os.path.getsize(str(ASSETS / f)) / 1024
            print(f"  {f} ({size_kb:.0f}KB)")

        await browser.close()


asyncio.run(run())
