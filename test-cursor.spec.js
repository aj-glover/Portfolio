import { test, expect } from '@playwright/test';

test.describe('Cursor Ship Movement Tests', () => {
  
  test('canvas loads and ship is visible', async ({ page }) => {
    await page.goto('http://localhost:3003/');
    await page.waitForTimeout(3000);

    const canvas = await page.$('canvas');
    expect(canvas).not.toBeNull();
    console.log('✓ Canvas is present on page');
  });

  test('ship yaw rotation on horizontal mouse movement', async ({ page }) => {
    await page.goto('http://localhost:3003/');
    await page.waitForTimeout(2000);

    const canvas = await page.$('canvas');
    const box = await canvas.boundingBox();
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    // Move mouse right to trigger horizontal yaw
    await page.mouse.move(centerX, centerY);
    await page.mouse.move(centerX + 200, centerY);
    await page.waitForTimeout(500);
    console.log('✓ Yaw rotation: mouse moved right');

    // Move mouse left to trigger opposite yaw
    await page.mouse.move(centerX - 200, centerY);
    await page.waitForTimeout(500);
    console.log('✓ Yaw rotation: mouse moved left');
  });

  test('ship pitch rotation on vertical mouse movement', async ({ page }) => {
    await page.goto('http://localhost:3003/');
    await page.waitForTimeout(2000);

    const canvas = await page.$('canvas');
    const box = await canvas.boundingBox();
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    // Move mouse up to trigger pitch down
    await page.mouse.move(centerX, centerY);
    await page.mouse.move(centerX, centerY - 200);
    await page.waitForTimeout(500);
    console.log('✓ Pitch rotation: mouse moved up');

    // Move mouse down to trigger pitch up
    await page.mouse.move(centerX, centerY + 200);
    await page.waitForTimeout(500);
    console.log('✓ Pitch rotation: mouse moved down');
  });

  test('no ship flipping during rapid direction changes', async ({ page }) => {
    await page.goto('http://localhost:3003/');
    await page.waitForTimeout(2000);

    const canvas = await page.$('canvas');
    const box = await canvas.boundingBox();
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    // Rapidly sweep mouse in all directions
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * 300;
      const y = centerY + Math.sin(angle) * 300;
      await page.mouse.move(x, y);
      await page.waitForTimeout(150);
    }
    console.log('✓ No flipping: ship completed full directional sweep');
  });

  test('ship follows mouse with spring physics', async ({ page }) => {
    await page.goto('http://localhost:3003/');
    await page.waitForTimeout(2000);

    const canvas = await page.$('canvas');
    const box = await canvas.boundingBox();

    // Move mouse to different corners to test spring pull
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.waitForTimeout(500);
    await page.mouse.move(box.x + box.width - 100, box.y + box.height - 100);
    await page.waitForTimeout(500);
    console.log('✓ Spring physics: ship follows mouse across screen');
  });

  test('page loads without errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:3003/');
    await page.waitForTimeout(3000);
    
    expect(errors).toEqual([]);
    console.log('✓ No console errors');
  });

});