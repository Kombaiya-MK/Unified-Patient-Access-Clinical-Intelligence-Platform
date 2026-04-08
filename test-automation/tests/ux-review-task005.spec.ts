/**
 * UX Review Script for US_044 TASK_005 — Responsive Dashboards
 * Tests all 3 dashboards at 3 viewports: Mobile (375), Tablet (768), Desktop (1440)
 * Captures screenshots, checks accessibility, console errors, and CSS properties.
 */
import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = 'ux-review-screenshots';

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

// Login helper
async function loginAs(page: Page, role: 'patient' | 'staff' | 'admin') {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle').catch(() => {});
  const creds: Record<string, { email: string; password: string }> = {
    patient: { email: 'patient2@example.com', password: 'Admin123!' },
    staff: { email: 'staff@example.com', password: 'Admin123!' },
    admin: { email: 'admin@example.com', password: 'Admin123!' },
  };
  const { email, password } = creds[role];
  try {
    await page.fill('input[name="email"], input[type="email"]', email, { timeout: 5000 });
    await page.fill('input[name="password"], input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {});
  } catch {
    // If login fails, navigate directly
  }
}

// Helper to navigate directly (SPA routes)
async function navigateTo(page: Page, path: string) {
  await page.goto(`${BASE_URL}${path}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
}

// ========== PATIENT DASHBOARD ==========
test.describe('SCR-002 Patient Dashboard', () => {
  for (const vp of VIEWPORTS) {
    test(`${vp.name} (${vp.width}px) — layout and components`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await navigateTo(page, '/patient/dashboard');
      
      // Screenshot
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/patient-dashboard-${vp.name}-${vp.width}.png`,
        fullPage: true,
      });

      // Check for console errors  
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      // Check dashboard grid CSS
      const gridEl = await page.$('.dashboard-grid');
      if (gridEl) {
        const gridCols = await gridEl.evaluate(el =>
          window.getComputedStyle(el).gridTemplateColumns
        );
        console.log(`[${vp.name}] Patient grid-template-columns: ${gridCols}`);
      }

      // Check tabs visibility
      const tabList = await page.$('.responsive-tabs__list');
      if (tabList) {
        const tabDisplay = await tabList.evaluate(el =>
          window.getComputedStyle(el).display
        );
        console.log(`[${vp.name}] Patient tab list display: ${tabDisplay}`);
        
        if (vp.name === 'desktop') {
          expect(tabDisplay).toBe('none');
        } else {
          expect(tabDisplay).not.toBe('none');
        }
      }

      // Check FAB visibility
      const fab = await page.$('.fab');
      if (fab) {
        const fabDisplay = await fab.evaluate(el =>
          window.getComputedStyle(el).display
        );
        console.log(`[${vp.name}] Patient FAB display: ${fabDisplay}`);
        
        if (vp.name === 'desktop') {
          expect(fabDisplay).toBe('none');
        } else {
          expect(fabDisplay).not.toBe('none');
        }
      }

      // Check FAB min dimensions  
      if (fab && vp.name !== 'desktop') {
        const fabMinH = await fab.evaluate(el =>
          window.getComputedStyle(el).minHeight
        );
        const fabMinW = await fab.evaluate(el =>
          window.getComputedStyle(el).minWidth
        );
        console.log(`[${vp.name}] FAB min-height: ${fabMinH}, min-width: ${fabMinW}`);
        expect(parseInt(fabMinH)).toBeGreaterThanOrEqual(56);
        expect(parseInt(fabMinW)).toBeGreaterThanOrEqual(56);
      }

      // Tab min-height (44px touch target)
      const tabBtns = await page.$$('.responsive-tabs__tab');
      for (const btn of tabBtns) {
        const minH = await btn.evaluate(el =>
          window.getComputedStyle(el).minHeight
        );
        console.log(`[${vp.name}] Tab button min-height: ${minH}`);
        expect(parseInt(minH)).toBeGreaterThanOrEqual(44);
      }

      // Check widget border-radius
      const widgets = await page.$$('.dashboard-widget');
      for (const w of widgets) {
        const radius = await w.evaluate(el =>
          window.getComputedStyle(el).borderRadius
        );
        console.log(`[${vp.name}] Widget border-radius: ${radius}`);
      }

      // Large desktop max-width test
      if (vp.width >= 1441) {
        if (gridEl) {
          const maxW = await gridEl.evaluate(el =>
            window.getComputedStyle(el).maxWidth
          );
          console.log(`[${vp.name}] Grid max-width: ${maxW}`);
          expect(parseInt(maxW)).toBeLessThanOrEqual(1600);
        }
      }

      // Focus visible on tabs (keyboard a11y)
      if (tabBtns.length > 0 && vp.name !== 'desktop') {
        await tabBtns[0].focus();
        const focusOutline = await tabBtns[0].evaluate(el => {
          el.focus();
          return window.getComputedStyle(el, ':focus-visible').outline || 
                 window.getComputedStyle(el).outlineStyle;
        });
        console.log(`[${vp.name}] Tab focus outline: ${focusOutline}`);
      }

      console.log(`[${vp.name}] Console errors: ${consoleErrors.length}`);
    });
  }

  // Large desktop test
  test('large-desktop (1920px) — max-width constraint', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await navigateTo(page, '/patient/dashboard');
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/patient-dashboard-large-1920.png`,
      fullPage: true,
    });
    
    const gridEl = await page.$('.dashboard-grid');
    if (gridEl) {
      const maxW = await gridEl.evaluate(el =>
        window.getComputedStyle(el).maxWidth
      );
      console.log(`[large-desktop] Grid max-width: ${maxW}`);
    }
  });
});

// ========== STAFF DASHBOARD ==========
test.describe('SCR-003 Staff Dashboard', () => {
  for (const vp of VIEWPORTS) {
    test(`${vp.name} (${vp.width}px) — layout and components`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await navigateTo(page, '/staff/dashboard');
      
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/staff-dashboard-${vp.name}-${vp.width}.png`,
        fullPage: true,
      });

      // Check grid columns
      const gridEl = await page.$('.dashboard-grid');
      if (gridEl) {
        const gridCols = await gridEl.evaluate(el =>
          window.getComputedStyle(el).gridTemplateColumns
        );
        console.log(`[${vp.name}] Staff grid-template-columns: ${gridCols}`);
      }

      // Check tabs
      const tabList = await page.$('.responsive-tabs__list');
      if (tabList) {
        const tabDisplay = await tabList.evaluate(el =>
          window.getComputedStyle(el).display
        );
        console.log(`[${vp.name}] Staff tab list display: ${tabDisplay}`);
      }

      // Check FAB
      const fab = await page.$('.fab');
      if (fab) {
        const fabDisplay = await fab.evaluate(el =>
          window.getComputedStyle(el).display
        );
        console.log(`[${vp.name}] Staff FAB display: ${fabDisplay}`);
        
        // FAB aria-label
        const ariaLabel = await fab.getAttribute('aria-label');
        console.log(`[${vp.name}] Staff FAB aria-label: ${ariaLabel}`);
        expect(ariaLabel).toBeTruthy();
      }

      // Keyboard nav test: Tab through
      if (vp.name === 'mobile') {
        const tabBtns = await page.$$('.responsive-tabs__tab');
        if (tabBtns.length >= 2) {
          // Click first tab
          await tabBtns[0].click();
          // Press ArrowRight
          await page.keyboard.press('ArrowRight');
          await page.waitForTimeout(200);
          
          // Check which tab is now active
          const activeTab = await page.$('.responsive-tabs__tab--active');
          if (activeTab) {
            const activeText = await activeTab.textContent();
            console.log(`[mobile] Staff active tab after ArrowRight: ${activeText}`);
          }
        }
      }
    });
  }
});

// ========== ADMIN DASHBOARD ==========
test.describe('SCR-004 Admin Dashboard', () => {
  for (const vp of VIEWPORTS) {
    test(`${vp.name} (${vp.width}px) — layout and components`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await navigateTo(page, '/admin/dashboard');
      
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/admin-dashboard-${vp.name}-${vp.width}.png`,
        fullPage: true,
      });

      // Check grid
      const gridEl = await page.$('.dashboard-grid');
      if (gridEl) {
        const gridCols = await gridEl.evaluate(el =>
          window.getComputedStyle(el).gridTemplateColumns
        );
        console.log(`[${vp.name}] Admin grid-template-columns: ${gridCols}`);
      }

      // Check tabs
      const tabList = await page.$('.responsive-tabs__list');
      if (tabList) {
        const tabDisplay = await tabList.evaluate(el =>
          window.getComputedStyle(el).display
        );
        console.log(`[${vp.name}] Admin tab list display: ${tabDisplay}`);
      }

      // Admin should NOT have FAB
      const fab = await page.$('.fab');
      console.log(`[${vp.name}] Admin FAB present: ${fab !== null}`);

      // Check ARIA roles
      const tabRoles = await page.$$eval('[role="tab"]', tabs =>
        tabs.map(t => ({
          text: t.textContent,
          ariaSelected: t.getAttribute('aria-selected'),
          ariaControls: t.getAttribute('aria-controls'),
          tabIndex: t.getAttribute('tabindex'),
        }))
      );
      console.log(`[${vp.name}] Admin tabs ARIA:`, JSON.stringify(tabRoles));

      // Check tabpanels
      const panels = await page.$$eval('[role="tabpanel"]', panels => 
        panels.map(p => ({
          id: p.id,
          ariaLabelledby: p.getAttribute('aria-labelledby'),
          hidden: p.hasAttribute('hidden'),
        }))
      );
      console.log(`[${vp.name}] Admin tabpanels:`, JSON.stringify(panels));

      // Check regions on desktop
      if (vp.name === 'desktop') {
        const regions = await page.$$eval('[role="region"]', rs =>
          rs.map(r => r.getAttribute('aria-label'))
        );
        console.log(`[desktop] Admin regions: ${JSON.stringify(regions)}`);
      }
    });
  }
});

// ========== ACCESSIBILITY AUDIT ==========
test.describe('Accessibility Checks', () => {
  test('Patient dashboard — focus-visible styles', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await navigateTo(page, '/patient/dashboard');
    
    // Tab through interactive elements
    const interactiveCount = await page.$$eval(
      'button, a, [role="tab"], [tabindex="0"]',
      els => els.length
    );
    console.log(`Interactive elements: ${interactiveCount}`);
    
    // Check heading hierarchy
    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', hs => 
      hs.map(h => ({ tag: h.tagName, text: h.textContent?.trim().substring(0, 50) }))
    );
    console.log('Heading hierarchy:', JSON.stringify(headings));
  });

  test('Color contrast — widget text', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await navigateTo(page, '/patient/dashboard');
    
    const titleEl = await page.$('.dashboard-widget__title');
    if (titleEl) {
      const styles = await titleEl.evaluate(el => {
        const cs = window.getComputedStyle(el);
        return { color: cs.color, fontSize: cs.fontSize, fontWeight: cs.fontWeight };
      });
      console.log('Widget title styles:', JSON.stringify(styles));
    }

    // FAB contrast check
    const fabEl = await page.$('.fab');
    if (fabEl) {
      const fabStyles = await fabEl.evaluate(el => {
        const cs = window.getComputedStyle(el);
        return { background: cs.backgroundColor, color: cs.color };
      });
      console.log('FAB styles:', JSON.stringify(fabStyles));
    }
  });

  test('Reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 375, height: 812 });
    await navigateTo(page, '/patient/dashboard');
    
    const fab = await page.$('.fab');
    if (fab) {
      const transition = await fab.evaluate(el =>
        window.getComputedStyle(el).transition
      );
      console.log(`FAB transition (reduced motion): ${transition}`);
    }

    const widget = await page.$('.dashboard-widget');
    if (widget) {
      const transition = await widget.evaluate(el =>
        window.getComputedStyle(el).transition
      );
      console.log(`Widget transition (reduced motion): ${transition}`);
    }
  });
});

// ========== CONSOLE ERRORS ==========
test('Global console error check — all dashboards', async ({ page }) => {
  const allErrors: { url: string; error: string }[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      allErrors.push({ url: page.url(), error: msg.text() });
    }
  });

  for (const path of ['/patient/dashboard', '/staff/dashboard', '/admin/dashboard']) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await navigateTo(page, path);
    await page.waitForTimeout(1500);
  }

  console.log(`Total console errors across dashboards: ${allErrors.length}`);
  if (allErrors.length > 0) {
    console.log('Errors:', JSON.stringify(allErrors, null, 2));
  }
});

// ========== WIREFRAME COMPARISON ==========
test.describe('Wireframe Screenshots', () => {
  const wireframes = [
    { name: 'SCR-002', file: 'wireframe-SCR-002-patient-dashboard.html' },
    { name: 'SCR-003', file: 'wireframe-SCR-003-staff-dashboard.html' },
    { name: 'SCR-004', file: 'wireframe-SCR-004-admin-dashboard.html' },
  ];

  for (const wf of wireframes) {
    for (const vp of VIEWPORTS) {
      test(`${wf.name} wireframe at ${vp.name} (${vp.width}px)`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const wfPath = `file:///c:/Users/KombaiyaMariappan/Desktop/ASSIGNMENT/Unified-Patient-Access-Clinical-Intelligence-Platform/.propel/context/wireframes/Hi-Fi/${wf.file}`;
        await page.goto(wfPath);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(500);
        
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/wireframe-${wf.name}-${vp.name}-${vp.width}.png`,
          fullPage: true,
        });
      });
    }
  }
});
