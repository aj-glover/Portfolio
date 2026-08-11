# Full Website QA + Visual + Performance Audit Report

**Site:** Universe Portfolio (Anthony Glover)  
**URL:** http://localhost:3002  
**Audit Date:** August 10, 2026  
**Tool:** Playwright (Chromium headless) + Manual Code Review  
**Screenshots:** 13 captured in `audit-screenshots/`

---

## EXECUTIVE SUMMARY

This is an ambitious 3D immersive portfolio built with Three.js, GSAP, and a game-like HUD system. The concept is creative and technically impressive, but there are **critical WebGL rendering issues**, **performance problems**, and **SEO/accessibility gaps** that need attention before this is ready for professional use.

---

## CRITICAL ISSUES

### C1. WebGL Context Creation Failing
- **Severity:** CRITICAL
- **Location:** Global (affects all 3D rendering)
- **Observed:** 4 console errors: `THREE.WebGLRenderer: A WebGL context could not be created. Reason: Canvas has an existing context of a different type`
- **Source:** `three.module-BEvS_7fE.js` (Three.js core)
- **Why it matters:** The site has TWO WebGL canvases (main scene + cursor overlay). When the cursor system tries to create a WebGL context on a canvas that already has one, it fails. This means the 3D cursor, asteroids, projectiles, and trail effects may not render properly.
- **Likely cause:** The cursor.js creates its own WebGLRenderer on a separate canvas, but there may be a conflict with the main scene renderer. The `webglCanvases` array returned 0 successful contexts despite 2 canvases existing.
- **Recommended fix:** Ensure each canvas gets its own WebGL context. Check if the cursor canvas is being reused instead of creating a new one. Add `canvas.getContext('webgl', { alpha: true })` with proper context attributes.

### C2. Planet Navigation Not Working
- **Severity:** CRITICAL
- **Location:** Universe view → Category navigation
- **Observed:** Clicking at screen center (640, 400) did not trigger planet hover tooltip, targeting HUD, or category navigation. Category view and case study overlays exist in DOM but remain `display: none`.
- **Why it matters:** The core navigation flow of the portfolio is broken. Users cannot navigate from the universe view to category planets to projects. This is the primary user journey.
- **Likely cause:** Planets are not positioned at screen center. The raycaster in navigation.js uses `pointer.x/y` calculated from mouse position relative to the renderer canvas. In headless mode, the 3D scene may not be rendering planets at expected positions, or the raycaster isn't detecting intersections.
- **Recommended fix:** Verify planet positions in the 3D scene. Add debug visualization for raycaster hits. Test with actual mouse movement in non-headless mode.

### C3. GPU Performance Stalls
- **Severity:** CRITICAL
- **Location:** WebGL rendering pipeline
- **Observed:** 4 warnings: `GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels`
- **Why it matters:** GPU stalls cause frame drops and janky animations. The continuous ReadPixels calls (likely from the cursor system reading pixel data for collision detection) are blocking the GPU pipeline.
- **Likely cause:** The cursor system or another component is calling `gl.readPixels()` every frame, which forces the GPU to synchronize and stalls the pipeline.
- **Recommended fix:** Remove or throttle ReadPixels calls. Use alternative collision detection methods (math-based rather than pixel-based).

---

## HIGH ISSUES

### H1. Slow Initial Load Time
- **Severity:** HIGH
- **Location:** Initial page load
- **Observed:** 4,876ms initial load time. FCP: 964ms. LCP: not measured (null).
- **Why it matters:** Nearly 5 seconds to load is unacceptable for a portfolio. Users may bounce before seeing content.
- **Top assets by size:**
  - `cursor.glb`: 88KB (cursor model - extremely large for a cursor!)
  - `01.png`: 19KB
  - Planet models: 6-14KB each
  - Total 3D models: ~150KB+
- **Recommended fix:** 
  - Optimize cursor.glb (88KB is excessive for a cursor - should be <10KB)
  - Lazy-load 3D models (load cursor after main scene)
  - Add loading progress indicator
  - Consider using Draco compression for all GLB files
  - Preload critical assets

### H2. Missing SEO Metadata
- **Severity:** HIGH
- **Location:** `<head>` section
- **Observed:**
  - No `<meta name="description">` tag
  - No favicon (`<link rel="icon">`)
  - No Open Graph tags (`og:title`, `og:description`, `og:image`)
  - Title is generic: "Universe Portfolio" (should be "AJ Glover - Creative Universe Portfolio" or similar)
- **Why it matters:** When shared on social media or in search results, the site will show no description, no image, and a generic title. This hurts discoverability and professional impression.
- **Recommended fix:** Add comprehensive meta tags including description, OG tags, Twitter cards, and a proper favicon.

### H3. Multiple H1 Tags
- **Severity:** HIGH
- **Location:** UniverseIntro overlay, AboutView
- **Observed:** 3 H1 elements found: "AJ", "" (empty), "I connect creativity, technology, and growth."
- **Why it matters:** Having multiple H1 tags confuses search engines and screen readers. There should be exactly one H1 per page representing the main heading.
- **Recommended fix:** Keep only one H1 (likely "AJ" or "Anthony Glover - Creative Universe Portfolio"). Change other H1s to H2 or H3.

### H4. DRACOLoader API Deprecation
- **Severity:** HIGH
- **Location:** `src/core/scene.js`, `src/game/cursor.js`
- **Observed:** 3 warnings: `THREE.DRACOLoader: setDecoderConfig to has been deprecated and will be removed in r194.`
- **Why it matters:** The code uses a deprecated API that will be removed in a future Three.js version. This will break when Three.js is updated.
- **Source:** Lines 42-43 in scene.js and lines 239-241 in cursor.js both call `dracoLoader.setDecoderConfig({ type: 'js' })`
- **Recommended fix:** Remove the `setDecoderConfig` call or update to the new API. The JS decoder is the default anyway.

---

## MEDIUM ISSUES

### M1. Heading Hierarchy Disorder
- **Severity:** MEDIUM
- **Location:** AboutView, CaseStudy
- **Observed:** Heading levels found: [1, 1, 2, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 2, 2, 2]
- **Why it matters:** Headings should follow a logical hierarchy (H1 → H2 → H3). Skipping levels or having multiple H1s confuses screen readers and SEO.
- **Recommended fix:** Audit all heading levels and ensure proper nesting.

### M2. Resume Link Uses Localhost URL
- **Severity:** MEDIUM
- **Location:** AboutView links section
- **Observed:** Resume link href is `http://localhost:3002/Anthony_Glover_Marketing_Resume.pdf`
- **Why it matters:** In production, this link will be broken. It should use a relative path `/Anthony_Glover_Marketing_Resume.pdf` or the actual production domain.
- **Recommended fix:** Change to relative path: `/Anthony_Glover_Marketing_Resume.pdf`

### M3. No Loading State for 3D Models
- **Severity:** MEDIUM
- **Location:** Planet models, cursor model, astronaut model
- **Observed:** Models load asynchronously but there's no visible loading indicator for individual models. The init sequence shows "SYSTEM ONLINE" but doesn't indicate model loading progress.
- **Why it matters:** Users may see empty space where planets should be while models are loading.
- **Recommended fix:** Add loading spinners or placeholder geometry for each model.

### M4. Cursor Model Excessively Large
- **Severity:** MEDIUM
- **Location:** `public/models/cursor.glb`
- **Observed:** 88KB for a cursor model
- **Why it matters:** The cursor is the first thing users interact with. An 88KB model is excessive and slows down initial interaction.
- **Recommended fix:** Optimize the cursor model. A simple geometric shape or low-poly model should be <5KB.

### M5. No Reduced Motion Handling for 3D Cursor
- **Severity:** MEDIUM
- **Location:** `src/game/cursor.js`
- **Observed:** The cursor system checks `gameState.getSetting('reducedMotion')` but the physics constants show reduced motion overrides exist. However, the continuous asteroid spawning, projectile system, and trail dots may still run.
- **Why it matters:** Users with vestibular disorders need reduced motion. The cursor's continuous animations (asteroids, projectiles, trails) could cause discomfort.
- **Recommended fix:** Ensure all cursor animations respect the reduced motion setting.

---

## LOW ISSUES

### L1. Generic Page Title
- **Severity:** LOW
- **Location:** `<title>` tag
- **Observed:** Title is "Universe Portfolio"
- **Recommended fix:** Change to "AJ Glover - Creative Universe Portfolio | Marketing Strategist & Creative Technologist"

### L2. No robots.txt or sitemap
- **Severity:** LOW
- **Location:** Root directory
- **Observed:** No `robots.txt` or `sitemap.xml` found
- **Recommended fix:** Add basic robots.txt and sitemap.xml for SEO.

### L3. External Link Text Could Be More Descriptive
- **Severity:** LOW
- **Location:** AboutView links
- **Observed:** Link texts are "inLinkedIn", "↗Portfolio", "↓Resume"
- **Recommended fix:** Use more descriptive text like "View LinkedIn Profile", "Visit Portfolio Website", "Download Resume (PDF)"

### L4. No Error Handling for Failed Model Loads
- **Severity:** LOW
- **Location:** `src/core/scene.js`, `src/game/cursor.js`
- **Observed:** Model load errors are logged to console but no user-facing error is shown.
- **Recommended fix:** Show a fallback message or placeholder if a model fails to load.

---

## WHAT WORKS WELL

1. **Creative Concept:** The space/universe theme is unique and memorable for a portfolio.
2. **HUD System:** The game-like HUD (sector display, object count, map button) adds polish.
3. **Responsive Layout:** All 6 viewports tested (1440×900 down to 375×812) show no horizontal overflow.
4. **Contact Form:** Properly structured with labels, required fields, and Formspree integration.
5. **External Links:** All 3 external links have proper `rel="noopener noreferrer"` attributes.
6. **Image Alt Text:** 0 images without alt text - good accessibility practice.
7. **Form Labels:** All form inputs have proper labels.
8. **HTML Lang Attribute:** Properly set to "en".
9. **Button Labels:** All buttons have accessible text.
10. **Code Organization:** Well-structured modular architecture with clear separation of concerns.

---

## VISUAL ASSESSMENT

**Score: 6/10**

**Strengths:**
- The space theme is cohesive and visually interesting
- Color-coded category planets create clear visual distinction
- The HUD elements add a professional game-like polish
- Typography hierarchy is generally clear
- Dark background with bright accents creates good contrast

**Weaknesses:**
- The 3D elements feel more like a tech demo than a professional portfolio
- The "Enter Universe" button is the only clear CTA - once dismissed, users may not know what to do
- Planet positions are not immediately obvious - users need to hunt for clickable elements
- The case study overlay, while functional, doesn't feel integrated with the 3D theme
- The init sequence ("SYSTEM ONLINE") is cryptic and doesn't clearly communicate what the site is
- The cursor model (spacecraft) is a fun touch but may distract from the actual work

**Recommendation:** The visual design needs to better balance the "cool 3D effect" with "clear communication of professional identity." Consider adding a persistent name/identity element that's always visible, not just in the intro overlay.

---

## UX ASSESSMENT

**Score: 5/10**

**Strengths:**
- The navigation flow (Universe → Category → Project → Case Study) is logical
- Return buttons are present in all views
- The hint text "Hover a project to preview it. Click to fly into its world." is helpful
- Category chips in the intro provide a quick overview of content areas

**Weaknesses:**
- **Critical:** Planet navigation is not working (see C2)
- No clear indication of where planets are located in the 3D space
- No keyboard navigation support for the 3D elements
- The 3D cursor may confuse users who expect a standard cursor
- No way to directly navigate to a specific project without going through the category flow
- The About section requires finding and clicking the About planet, which may not be intuitive
- No search or filter functionality for the 29 projects
- The init sequence adds ~2 seconds of delay before users can interact

**Recommendation:** Add a 2D navigation fallback (sidebar or top nav) that allows direct access to categories and projects. The 3D universe should be an enhancement, not the only way to navigate.

---

## PERFORMANCE ASSESSMENT

**Score: 4/10**

**Metrics:**
- Initial Load Time: 4,876ms (POOR - should be <2s)
- DOMContentLoaded: 276ms (GOOD)
- Load Complete: 641ms (GOOD)
- FCP: 964ms (ACCEPTABLE)
- LCP: Not measured (null) - concerning
- Total 3D model size: ~150KB+ (cursor.glb alone is 88KB)

**Issues:**
- GPU stalls from ReadPixels calls
- Large cursor model (88KB)
- No lazy loading of 3D models
- Continuous animations (cursor, starfield, planet rotations) run even when not interacting
- Two WebGL contexts may be causing performance overhead

**Recommendation:** Optimize the cursor model, implement lazy loading, throttle ReadPixels calls, and consider pausing animations when not in viewport.

---

## MOBILE ASSESSMENT

**Score: 6/10**

**Strengths:**
- No horizontal overflow at any tested viewport
- Responsive layout adapts to different screen sizes
- Touch events should work (pointer events used)

**Weaknesses:**
- 3D cursor system may not work well on touch devices (no hover state)
- Small planet targets may be difficult to tap on mobile
- The HUD elements may be too small on mobile screens
- No mobile-specific navigation fallback
- Performance may be worse on mobile GPUs

**Recommendation:** Add touch-specific interactions (tap to select planet, pinch to zoom). Consider a simplified 2D navigation for mobile.

---

## FINAL VERDICT

**"Would this portfolio be ready to show to a professional employer/client today?"**

**No, not yet.**

While the concept is creative and technically ambitious, there are critical issues that prevent this from being production-ready:

1. **WebGL context errors** mean the 3D rendering may be broken
2. **Planet navigation not working** means users can't explore the portfolio
3. **5-second load time** is too slow for a professional site
4. **Missing SEO metadata** hurts discoverability
5. **The 3D experience, while cool, doesn't clearly communicate professional identity**

**What's needed before launch:**
1. Fix WebGL context creation (CRITICAL)
2. Fix planet navigation/raycasting (CRITICAL)
3. Optimize cursor model and implement lazy loading (HIGH)
4. Add meta description, favicon, OG tags (HIGH)
5. Fix heading hierarchy (MEDIUM)
6. Add 2D navigation fallback (HIGH)
7. Reduce initial load time to <2s (HIGH)

**Estimated effort to fix:** 2-3 days of focused development.

The foundation is solid and the concept is strong. With these fixes, this could be a standout portfolio that demonstrates both creative vision and technical skill.

---

## APPENDIX: Raw Audit Data

- **Console Errors:** 4 (all WebGL context creation failures)
- **Console Warnings:** 8 (3 DRACOLoader deprecation, 4 GPU stalls, 1 deprecated API)
- **Network Failures:** 0
- **Screenshots Taken:** 13
- **SEO Issues:** 3 failures (meta description, favicon, OG tags)
- **Accessibility Issues:** 0 critical (but heading hierarchy needs work)
- **Viewports Tested:** 6 (all passed overflow check)
- **External Links:** 3 (all properly configured)
- **Contact Form:** Properly structured with 4 required fields

---

*Report generated by Playwright audit script on August 10, 2026*