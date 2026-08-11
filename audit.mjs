/**
 * Comprehensive Website QA + Visual + Performance Audit Script
 * Uses Playwright to systematically test the Universe Portfolio site
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'http://localhost:3002';
const SCREENSHOTS_DIR = join(__dirname, 'audit-screenshots');
const REPORT_FILE = join(__dirname, 'audit-report.json');

// Ensure screenshots directory exists
if (!existsSync(SCREENSHOTS_DIR)) {
    mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Viewports to test
const VIEWPORTS = [
    { name: 'desktop-1440', width: 1440, height: 900 },
    { name: 'desktop-1280', width: 1280, height: 800 },
    { name: 'tablet-1024', width: 1024, height: 768 },
    { name: 'tablet-portrait', width: 768, height: 1024 },
    { name: 'mobile-390', width: 390, height: 844 },
    { name: 'mobile-375', width: 375, height: 812 },
];

// Audit results
const results = {
    timestamp: new Date().toISOString(),
    consoleErrors: [],
    consoleWarnings: [],
    networkFailures: [],
    performanceMetrics: {},
    viewportIssues: {},
    interactionResults: {},
    accessibilityIssues: [],
    seoIssues: [],
    visualIssues: [],
    screenshots: [],
};

/**
 * Takes a screenshot and records it
 */
async function takeScreenshot(page, name, fullPage = false) {
    const filename = `${name}.png`;
    const filepath = join(SCREENSHOTS_DIR, filename);
    await page.screenshot({ path: filepath, fullPage });
    results.screenshots.push({ name, filename, fullPage });
    console.log(`   Screenshot: ${filename}`);
    return filepath;
}

/**
 * Waits for the init sequence to complete and UniverseIntro to appear
 */
async function waitForIntro(page) {
    console.log('  ⏳ Waiting for UniverseIntro overlay...');
    try {
        await page.waitForSelector('#universe-intro', { timeout: 15000 });
        console.log('  ✅ UniverseIntro overlay found');
    } catch (e) {
        console.log('  ⚠️ UniverseIntro overlay not found within timeout');
    }
}

/**
 * Dismisses the UniverseIntro overlay
 */
async function dismissIntro(page) {
    console.log('  🖱️ Dismissing UniverseIntro...');
    try {
        // Try clicking the button directly
        const button = await page.$('.universe-intro-dismiss');
        if (button) {
            await button.click();
            console.log('  ✅ Clicked Enter Universe button');
            // Wait for overlay to fade out
            await page.waitForTimeout(500);
            const overlay = await page.$('#universe-intro');
            if (overlay) {
                const display = await overlay.evaluate(el => el.style.display);
                const opacity = await overlay.evaluate(el => window.getComputedStyle(el).opacity);
                console.log(`  ℹ️ Overlay state: display=${display}, opacity=${opacity}`);
                if (display !== 'none' && opacity !== '0') {
                    // Force hide via JS
                    await overlay.evaluate(el => { el.style.display = 'none'; });
                    console.log('  ⚠️ Force-hid overlay via JS');
                }
            }
        } else {
            console.log('  ⚠️ Enter Universe button not found');
            // Try to force dismiss via JS
            await page.evaluate(() => {
                const overlay = document.getElementById('universe-intro');
                if (overlay) overlay.style.display = 'none';
            });
            console.log('  ⚠️ Force-hid overlay via JS (button not found)');
        }
    } catch (e) {
        console.log(`  ❌ Error dismissing intro: ${e.message}`);
        // Force dismiss
        await page.evaluate(() => {
            const overlay = document.getElementById('universe-intro');
            if (overlay) overlay.style.display = 'none';
        });
    }
}

/**
 * Collects console errors and warnings
 */
function setupConsoleMonitoring(page) {
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        if (type === 'error') {
            results.consoleErrors.push({ text, url: msg.location()?.url || 'unknown' });
            console.log(`  ❌ Console Error: ${text}`);
        } else if (type === 'warning') {
            results.consoleWarnings.push({ text, url: msg.location()?.url || 'unknown' });
            console.log(`  ⚠️ Console Warning: ${text}`);
        }
    });

    page.on('pageerror', error => {
        results.consoleErrors.push({ text: error.message, url: 'pageerror' });
        console.log(`  ❌ Page Error: ${error.message}`);
    });

    page.on('requestfailed', request => {
        results.networkFailures.push({
            url: request.url(),
            failure: request.failure()?.errorText || 'unknown',
        });
        console.log(`  ❌ Network Failure: ${request.url()} - ${request.failure()?.errorText}`);
    });
}

/**
 * Main audit function
 */
async function runAudit() {
    console.log(' Starting Universe Portfolio Audit...\n');

    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
    });

    const page = await context.newPage();

    // Setup console monitoring
    setupConsoleMonitoring(page);

    // ============================================================
    // PHASE 1: Initial Load & Screenshots
    // ============================================================
    console.log('\n📋 PHASE 1: Initial Load & Screenshots');

    console.log('  🌐 Navigating to site...');
    const startTime = performance.now();
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    const loadTime = performance.now() - startTime;
    results.performanceMetrics.initialLoadTime = Math.round(loadTime);
    console.log(`  ✅ Page loaded in ${Math.round(loadTime)}ms`);

    // Wait for init sequence
    await waitForIntro(page);
    await takeScreenshot(page, '01-init-sequence');

    // Dismiss intro
    await dismissIntro(page);
    await takeScreenshot(page, '02-universe-view');

    // Wait a moment for 3D scene to stabilize
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '03-universe-stabilized', true);

    // ============================================================
    // PHASE 2: SEO & Technical Checks
    // ============================================================
    console.log('\n📋 PHASE 2: SEO & Technical Checks');

    const title = await page.title();
    console.log(`  📄 Title: "${title}"`);
    results.seoIssues.push({ check: 'title', value: title, status: title ? 'pass' : 'fail' });

    const metaDescription = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="description"]');
        return meta ? meta.content : null;
    });
    console.log(`   Meta Description: ${metaDescription || 'MISSING'}`);
    results.seoIssues.push({ check: 'meta-description', value: metaDescription, status: metaDescription ? 'pass' : 'fail' });

    const h1s = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('h1')).map(el => el.textContent.trim());
    });
    console.log(`  📄 H1 tags: ${h1s.length > 0 ? h1s.join(', ') : 'NONE'}`);
    results.seoIssues.push({ check: 'h1', value: h1s, status: h1s.length > 0 ? 'pass' : 'fail' });

    const favicon = await page.evaluate(() => {
        const link = document.querySelector('link[rel="icon"]') || document.querySelector('link[rel="shortcut icon"]');
        return link ? link.href : null;
    });
    console.log(`  📄 Favicon: ${favicon || 'MISSING'}`);
    results.seoIssues.push({ check: 'favicon', value: favicon, status: favicon ? 'pass' : 'fail' });

    const ogTags = await page.evaluate(() => {
        const tags = {};
        document.querySelectorAll('meta[property^="og:"]').forEach(meta => {
            tags[meta.getAttribute('property')] = meta.content;
        });
        return tags;
    });
    console.log(`   Open Graph tags: ${Object.keys(ogTags).length > 0 ? JSON.stringify(ogTags) : 'NONE'}`);
    results.seoIssues.push({ check: 'og-tags', value: ogTags, status: Object.keys(ogTags).length > 0 ? 'pass' : 'fail' });

    const lang = await page.evaluate(() => document.documentElement.lang);
    console.log(`  📄 HTML lang: "${lang || 'MISSING'}"`);
    results.seoIssues.push({ check: 'html-lang', value: lang, status: lang ? 'pass' : 'fail' });

    // ============================================================
    // PHASE 3: HUD Elements Check
    // ============================================================
    console.log('\n📋 PHASE 3: HUD Elements Check');

    const hudElements = await page.evaluate(() => {
        const elements = {};
        // Check for HUD elements in corners
        const allText = document.body.innerText;
        elements.hasAJGlover = allText.includes('AJ GLOVER');
        elements.hasSector = allText.includes('SECTOR');
        elements.hasObjects = allText.includes('OBJECTS');
        elements.hasMap = allText.includes('MAP');
        return elements;
    });
    console.log(`  🎮 HUD: ${JSON.stringify(hudElements)}`);
    results.interactionResults.hud = hudElements;

    // ============================================================
    // PHASE 4: 3D Cursor Check
    // ============================================================
    console.log('\n PHASE 4: 3D Cursor Check');

    const cursorCanvas = await page.evaluate(() => {
        const canvases = document.querySelectorAll('canvas');
        let cursorCanvas = null;
        canvases.forEach(c => {
            if (c.style.zIndex === '9999') {
                cursorCanvas = {
                    exists: true,
                    zIndex: c.style.zIndex,
                    pointerEvents: c.style.pointerEvents,
                    display: c.style.display,
                };
            }
        });
        return cursorCanvas || { exists: false };
    });
    console.log(`  🚀 Cursor canvas: ${JSON.stringify(cursorCanvas)}`);
    results.interactionResults.cursor = cursorCanvas;

    // ============================================================
    // PHASE 5: Planet Interaction Test
    // ============================================================
    console.log('\n📋 PHASE 5: Planet Interaction Test');

    // Get planet positions via Three.js
    const planetInfo = await page.evaluate(() => {
        // Try to access Three.js scene
        const canvases = document.querySelectorAll('canvas');
        let mainCanvas = null;
        canvases.forEach(c => {
            if (c.style.zIndex === '0' || c.style.position === 'fixed') {
                mainCanvas = c;
            }
        });
        return {
            canvasCount: canvases.length,
            mainCanvasExists: !!mainCanvas,
        };
    });
    console.log(`  🪐 Canvas info: ${JSON.stringify(planetInfo)}`);

    // Try to hover over center of screen (where planets should be)
    await page.mouse.move(640, 400);
    await page.waitForTimeout(500);
    await takeScreenshot(page, '04-hover-center');

    // Check for tooltip
    const tooltipVisible = await page.evaluate(() => {
        const tooltip = document.getElementById('planet-tooltip');
        if (!tooltip) return { exists: false };
        return {
            exists: true,
            visible: tooltip.style.display !== 'none',
            text: tooltip.textContent.trim(),
        };
    });
    console.log(`  💬 Tooltip: ${JSON.stringify(tooltipVisible)}`);
    results.interactionResults.tooltip = tooltipVisible;

    // Check for targeting HUD
    const targetingVisible = await page.evaluate(() => {
        const targeting = document.querySelector('.game-targeting');
        if (!targeting) return { exists: false };
        return {
            exists: true,
            visible: targeting.style.display !== 'none',
        };
    });
    console.log(`  🎯 Targeting HUD: ${JSON.stringify(targetingVisible)}`);
    results.interactionResults.targeting = targetingVisible;

    // ============================================================
    // PHASE 6: Category Navigation Test
    // ============================================================
    console.log('\n📋 PHASE 6: Category Navigation Test');

    // Try clicking on a planet (center of screen)
    await page.mouse.click(640, 400);
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '05-after-planet-click');

    // Check if category view appeared
    const categoryView = await page.evaluate(() => {
        const cv = document.getElementById('category-view');
        if (!cv) return { exists: false };
        return {
            exists: true,
            display: cv.style.display,
            title: document.getElementById('category-view-title')?.textContent || '',
        };
    });
    console.log(`  📂 Category View: ${JSON.stringify(categoryView)}`);
    results.interactionResults.categoryView = categoryView;

    // Check if case study appeared
    const caseStudy = await page.evaluate(() => {
        const cs = document.getElementById('project-detail-overlay');
        if (!cs) return { exists: false };
        return {
            exists: true,
            display: cs.style.display,
            title: document.getElementById('project-detail-title')?.textContent || '',
        };
    });
    console.log(`  📄 Case Study: ${JSON.stringify(caseStudy)}`);
    results.interactionResults.caseStudy = caseStudy;

    // Return to universe - try multiple approaches
    let returned = false;
    
    // Try return button in case study
    const returnBtn = await page.$('#return-to-universe');
    if (returnBtn) {
        const isVisible = await returnBtn.isVisible().catch(() => false);
        if (isVisible) {
            await returnBtn.click();
            await page.waitForTimeout(1500);
            console.log('  ✅ Clicked Return to Universe (case study)');
            returned = true;
        }
    }
    
    // Try back button in category view
    if (!returned) {
        const backBtn = await page.$('.category-view-back');
        if (backBtn) {
            const isVisible = await backBtn.isVisible().catch(() => false);
            if (isVisible) {
                await backBtn.click();
                await page.waitForTimeout(1500);
                console.log('  ✅ Clicked Back to Universe (category view)');
                returned = true;
            }
        }
    }
    
    // Try about return button
    if (!returned) {
        const aboutReturnBtn = await page.$('#about-return');
        if (aboutReturnBtn) {
            const isVisible = await aboutReturnBtn.isVisible().catch(() => false);
            if (isVisible) {
                await aboutReturnBtn.click();
                await page.waitForTimeout(1500);
                console.log('  ✅ Clicked About Return button');
                returned = true;
            }
        }
    }
    
    // Force return via navigation system
    if (!returned) {
        await page.evaluate(() => {
            if (window.navigationSystem) {
                window.navigationSystem.returnToUniverse();
            }
        }).catch(() => {});
        await page.waitForTimeout(1500);
        console.log('  ️ Force-triggered return to universe via JS');
    }
    
    if (!returned) {
        console.log('  ️ Could not return to universe - all buttons hidden');
    }
    await takeScreenshot(page, '06-after-return');

    // ============================================================
    // PHASE 7: About Section Test
    // ============================================================
    console.log('\n PHASE 7: About Section Test');

    // Try to navigate to About planet
    // About planet is typically at a specific position
    await page.mouse.move(900, 300);
    await page.waitForTimeout(500);
    await page.mouse.click(900, 300);
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '07-about-attempt');

    const aboutView = await page.evaluate(() => {
        const av = document.getElementById('about-view');
        if (!av) return { exists: false };
        return {
            exists: true,
            display: av.style.display,
            hasForm: !!document.getElementById('about-contact-form'),
            hasAstronaut: !!document.querySelector('.astronaut-overlay'),
        };
    });
    console.log(`  👤 About View: ${JSON.stringify(aboutView)}`);
    results.interactionResults.aboutView = aboutView;

    // Return to universe - check visibility first
    const aboutReturnBtn = await page.$('#about-return');
    if (aboutReturnBtn) {
        const isVisible = await aboutReturnBtn.isVisible().catch(() => false);
        if (isVisible) {
            await aboutReturnBtn.click();
            await page.waitForTimeout(1500);
            console.log('  ✅ Clicked About Return button');
        } else {
            console.log('  ️ About return button exists but not visible');
            await page.evaluate(() => {
                const av = document.getElementById('about-view');
                if (av) av.style.display = 'none';
            });
        }
    }

    // ============================================================
    // PHASE 8: Responsive Testing
    // ============================================================
    console.log('\n📋 PHASE 8: Responsive Testing');

    for (const vp of VIEWPORTS) {
        console.log(`  📱 Testing viewport: ${vp.name} (${vp.width}x${vp.height})`);
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.waitForTimeout(1000);

        // Check for horizontal overflow
        const overflow = await page.evaluate(() => {
            return {
                scrollWidth: document.documentElement.scrollWidth,
                clientWidth: document.documentElement.clientWidth,
                hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
            };
        });

        const issues = [];
        if (overflow.hasOverflow) {
            issues.push(`Horizontal overflow: scrollWidth=${overflow.scrollWidth} > clientWidth=${overflow.clientWidth}`);
        }

        // Check for broken layout
        const bodyRect = await page.evaluate(() => {
            const body = document.body;
            const rect = body.getBoundingClientRect();
            return { width: rect.width, height: rect.height };
        });

        results.viewportIssues[vp.name] = {
            overflow,
            bodyRect,
            issues,
        };

        await takeScreenshot(page, `responsive-${vp.name}`);
        console.log(`    ${issues.length === 0 ? '✅' : '⚠️'} ${issues.length === 0 ? 'No issues' : issues.join('; ')}`);
    }

    // Reset to default viewport
    await page.setViewportSize({ width: 1280, height: 800 });

    // ============================================================
    // PHASE 9: Performance Metrics
    // ============================================================
    console.log('\n📋 PHASE 9: Performance Metrics');

    const perfMetrics = await page.evaluate(() => {
        const perf = performance;
        const nav = perf.getEntriesByType('navigation')[0];
        const paint = perf.getEntriesByType('paint');
        const fcp = paint.find(p => p.name === 'first-contentful-paint');
        const lcp = perf.getEntriesByType('largest-contentful-paint');
        const lcpEntry = lcp && lcp.length > 0 ? lcp[lcp.length - 1] : null;

        return {
            domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
            loadComplete: nav ? Math.round(nav.loadEventEnd) : null,
            fcp: fcp ? Math.round(fcp.startTime) : null,
            lcp: lcpEntry ? Math.round(lcpEntry.startTime) : null,
            domInteractive: nav ? Math.round(nav.domInteractive) : null,
        };
    });
    results.performanceMetrics = { ...results.performanceMetrics, ...perfMetrics };
    console.log(`   Performance: ${JSON.stringify(perfMetrics, null, 2)}`);

    // Check asset sizes
    const resourceSizes = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource');
        return resources.map(r => ({
            name: r.name.split('/').pop(),
            size: Math.round(r.transferSize / 1024),
            type: r.initiatorType,
        })).filter(r => r.size > 0).sort((a, b) => b.size - a.size).slice(0, 20);
    });
    results.performanceMetrics.topAssets = resourceSizes;
    console.log(`   Top assets by size: ${JSON.stringify(resourceSizes.slice(0, 5), null, 2)}`);

    // ============================================================
    // PHASE 10: Accessibility Check
    // ============================================================
    console.log('\n📋 PHASE 10: Accessibility Check');

    const a11yCheck = await page.evaluate(() => {
        const issues = [];

        // Check images without alt text
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (!img.alt || img.alt.trim() === '') {
                issues.push({ type: 'missing-alt', src: img.src });
            }
        });

        // Check buttons without accessible names
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => {
            if (!btn.textContent.trim() && !btn.getAttribute('aria-label')) {
                issues.push({ type: 'button-no-label', id: btn.id });
            }
        });

        // Check form labels
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (!label && !input.getAttribute('aria-label')) {
                issues.push({ type: 'input-no-label', id: input.id, name: input.name });
            }
        });

        // Check heading hierarchy
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const headingLevels = Array.from(headings).map(h => parseInt(h.tagName[1]));

        return {
            imagesWithoutAlt: issues.filter(i => i.type === 'missing-alt').length,
            buttonsWithoutLabel: issues.filter(i => i.type === 'button-no-label').length,
            inputsWithoutLabel: issues.filter(i => i.type === 'input-no-label').length,
            headingLevels,
            issues: issues.slice(0, 20),
        };
    });
    results.accessibilityIssues = a11yCheck;
    console.log(`  ♿ Accessibility: ${JSON.stringify(a11yCheck, null, 2)}`);

    // ============================================================
    // PHASE 11: Contact Form Test
    // ============================================================
    console.log('\n📋 PHASE 11: Contact Form Test');

    // Navigate to About view to test form
    // Force show about view
    await page.evaluate(() => {
        const aboutView = document.getElementById('about-view');
        if (aboutView) {
            aboutView.style.display = 'flex';
            aboutView.style.opacity = '1';
        }
    });
    await page.waitForTimeout(500);

    const formTest = await page.evaluate(() => {
        const form = document.getElementById('about-contact-form');
        if (!form) return { exists: false };

        const fields = {
            name: document.getElementById('about-name'),
            email: document.getElementById('about-email'),
            subject: document.getElementById('about-subject'),
            message: document.getElementById('about-message'),
        };

        return {
            exists: true,
            action: form.action,
            method: form.method,
            fields: Object.fromEntries(
                Object.entries(fields).map(([k, v]) => [k, {
                    exists: !!v,
                    type: v?.type || v?.tagName,
                    required: v?.required,
                }])
            ),
        };
    });
    results.interactionResults.contactForm = formTest;
    console.log(`   Contact Form: ${JSON.stringify(formTest, null, 2)}`);

    // Hide about view
    await page.evaluate(() => {
        const aboutView = document.getElementById('about-view');
        if (aboutView) aboutView.style.display = 'none';
    });

    // ============================================================
    // PHASE 12: External Links Check
    // ============================================================
    console.log('\n PHASE 12: External Links Check');

    const externalLinks = await page.evaluate(() => {
        const links = document.querySelectorAll('a[target="_blank"]');
        return Array.from(links).map(a => ({
            href: a.href,
            text: a.textContent.trim(),
            hasRel: a.rel,
            hasNoopener: a.rel?.includes('noopener'),
            hasNoreferrer: a.rel?.includes('noreferrer'),
        }));
    });
    console.log(`  🔗 External links: ${externalLinks.length}`);
    externalLinks.forEach(link => {
        console.log(`    - ${link.text}: ${link.href} (noopener: ${link.hasNoopener}, noreferrer: ${link.hasNoreferrer})`);
    });
    results.interactionResults.externalLinks = externalLinks;

    // ============================================================
    // PHASE 13: WebGL/Three.js Check
    // ============================================================
    console.log('\n📋 PHASE 13: WebGL/Three.js Check');

    const webglCheck = await page.evaluate(() => {
        const canvases = document.querySelectorAll('canvas');
        const webglCanvases = [];
        canvases.forEach(c => {
            try {
                const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
                if (gl) {
                    webglCanvases.push({
                        width: c.width,
                        height: c.height,
                        styleWidth: c.style.width,
                        styleHeight: c.style.height,
                        zIndex: c.style.zIndex,
                    });
                }
            } catch (e) {}
        });
        return {
            totalCanvases: canvases.length,
            webglCanvases,
        };
    });
    console.log(`  🎮 WebGL: ${JSON.stringify(webglCheck, null, 2)}`);
    results.interactionResults.webgl = webglCheck;

    // ============================================================
    // Save Report
    // ============================================================
    console.log('\n📋 Saving audit report...');
    writeFileSync(REPORT_FILE, JSON.stringify(results, null, 2));
    console.log(`  ✅ Report saved to: ${REPORT_FILE}`);

    // ============================================================
    // Summary
    // ============================================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 AUDIT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Console Errors: ${results.consoleErrors.length}`);
    console.log(`Console Warnings: ${results.consoleWarnings.length}`);
    console.log(`Network Failures: ${results.networkFailures.length}`);
    console.log(`Screenshots Taken: ${results.screenshots.length}`);
    console.log(`SEO Issues: ${results.seoIssues.filter(s => s.status === 'fail').length}`);
    console.log(`Accessibility Issues: ${results.accessibilityIssues.issues?.length || 0}`);

    await browser.close();
    console.log('\n✅ Audit complete!');
}

// Run the audit
runAudit().catch(err => {
    console.error('❌ Audit failed:', err);
    process.exit(1);
});