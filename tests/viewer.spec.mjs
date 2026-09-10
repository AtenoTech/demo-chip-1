import { test, expect } from '@playwright/test';
import sharp from 'sharp';

const png = (color = '#504e54') => sharp({ create: { width: 320, height: 180, channels: 3, background: color } }).png().toBuffer();
async function bundled(page, { count = 8, manifest = 'valid', delay = 0 } = {}) {
  const buffer = await png();
  const names = Array.from({ length: count }, (_, i) => `frame_${String(i).padStart(3, '0')}.png`);
  await page.route('**/frames/frames.json', (route) => {
    if (manifest === 'missing') return route.fulfill({ status: 404 });
    if (manifest === 'invalid') return route.fulfill({ contentType: 'application/json', body: '{not-json' });
    return route.fulfill({ json: { frames: manifest === 'empty' ? [] : manifest === 'stale' ? [...names, 'frame_099.png'] : names } });
  });
  await page.route(/\/frames\/frame_\d+\.png$/, async (route) => {
    const index = Number(route.request().url().match(/frame_(\d+)/)[1]);
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    await route.fulfill(index >= count ? { status: 404 } : { contentType: 'image/png', body: buffer });
  });
}
const sourceLabel = (page) => page.locator('.viewer-header__proof');
async function enter(page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Enter the viewer' }).click();
  await expect(page.getByRole('application')).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('canvas')).toBeVisible();
}
async function dismissGuide(page) {
  const button = page.getByRole('button', { name: 'Dismiss tutorial' });
  if (await button.count()) await button.click();
}
async function pixel(page) {
  return page.locator('canvas').evaluate((canvas) => [...canvas.getContext('2d').getImageData(0, 0, 1, 1).data].slice(0, 3));
}
async function trackUrls(page) {
  await page.addInitScript(() => {
    window.objectUrlLog = { created: [], revoked: [] };
    const create = URL.createObjectURL.bind(URL);
    const revoke = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = (blob) => { const url = create(blob); window.objectUrlLog.created.push(url); return url; };
    URL.revokeObjectURL = (url) => { window.objectUrlLog.revoked.push(url); revoke(url); };
  });
}

test('A: bundled hardware defaults to proof mode; full preload; demo remains available', async ({ page }) => {
  await bundled(page, { delay: 500 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Enter the viewer' }).click();
  await expect(page.getByRole('progressbar')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Spin', exact: true })).toBeDisabled();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(sourceLabel(page)).toHaveText('Pre-rendered on Ateno hardware');
  await expect(page.locator('.frame-proof')).toHaveText('Ateno framebuffer output');
  await expect(page.getByRole('button', { name: 'Hardware', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await dismissGuide(page);
  await page.getByRole('button', { name: 'Use demo instead' }).click();
  await expect(sourceLabel(page)).toContainText('Illustrative demo');
  await expect(page.locator('.frame-proof')).toHaveText('Not hardware output');
  await page.getByRole('button', { name: 'Hardware', exact: true }).click();
  await expect(sourceLabel(page)).toHaveText('Pre-rendered on Ateno hardware');
  await expect(page.locator('.angle')).toHaveText('000°');
});

for (const manifest of ['empty', 'invalid', 'stale', 'missing']) {
  test(`manifest ${manifest}: sequential discovery recovers real hardware frames`, async ({ page }) => {
    await bundled(page, { manifest });
    await enter(page);
    await expect(sourceLabel(page)).toHaveText('Pre-rendered on Ateno hardware');
    await expect(page.getByRole('alert')).toHaveCount(0);
    await dismissGuide(page);
    await page.getByRole('application').focus();
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('.angle')).toHaveText('315°');
  });
}

test('B: empty hardware directory opens real built-in demo, no error; details separate the run from sample', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.ico');
  await page.screenshot({ path: info.outputPath('desktop-welcome.png'), fullPage: true });
  await enter(page);
  await expect(sourceLabel(page)).toHaveText('Illustrative demoNot hardware output');
  await expect(page.locator('.frame-proof')).toHaveText('Not hardware output');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Load hardware frames' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Spin', exact: true })).toBeEnabled();
  await expect(page.locator('body')).not.toContainText('The first hardware frame is unavailable');
  await expect(page.locator('body')).not.toContainText('Pre-rendered on Ateno hardware');
  await page.screenshot({ path: info.outputPath('desktop-demo-guide.png'), fullPage: true });
  await dismissGuide(page);
  await page.screenshot({ path: info.outputPath('desktop-demo.png'), fullPage: true });
  await page.getByRole('application').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.angle')).toHaveText('348°');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.angle')).toHaveText('000°');
  await page.getByRole('button', { name: 'Run details' }).click();
  await expect(page.getByText(/not the currently displayed sample/)).toBeVisible();
  await expect(page.getByText(/No GPU comparison has been run/)).toBeVisible();
  await expect(page.getByText('Illustration, not hardware output')).toBeVisible();
  await page.getByText('Installing hardware output', { exact: true }).click();
  await expect(page.getByText('public/frames/', { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('desktop-details.png'), fullPage: true });
});

test('C: picker loads PNGs locally in numeric index order; filters other files; switching, replacement and removal revoke URLs', async ({ page }) => {
  await trackUrls(page);
  const requests = [];
  page.on('request', (request) => { if (request.method() !== 'GET') requests.push(request.url()); });
  await enter(page);
  await dismissGuide(page);
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Load hardware frames' }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles([
    { name: 'capture_10.png', mimeType: 'image/png', buffer: await png('#0000ff') },
    { name: 'frame_2.png', mimeType: 'image/png', buffer: await png('#00ff00') },
    { name: 'view_1.PNG', mimeType: 'image/png', buffer: await png('#ff0000') },
    { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('Not a PNG') },
  ]);
  await expect(sourceLabel(page)).toHaveText('Hardware frames — loaded locally');
  await expect(page.locator('.frame-proof')).toContainText('not verified');
  await expect.poll(() => pixel(page)).toEqual([255, 0, 0]);
  await page.getByRole('application').focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => pixel(page)).toEqual([0, 255, 0]);
  await expect(page.locator('.angle')).toHaveText('120°');
  await page.getByRole('button', { name: 'Use demo instead' }).click();
  await expect(sourceLabel(page)).toContainText('Illustrative demo');
  await page.getByRole('button', { name: 'Local files', exact: true }).click();
  await expect(sourceLabel(page)).toHaveText('Hardware frames — loaded locally');
  await page.locator('input[type="file"]').setInputFiles([{ name: 'other.png', mimeType: 'image/png', buffer: await png('#ffff00') }]);
  await expect.poll(() => pixel(page)).toEqual([255, 255, 0]);
  await expect.poll(() => page.evaluate(() => window.objectUrlLog.revoked.length)).toBe(3);
  await page.getByRole('button', { name: 'Use demo instead' }).click();
  await expect(sourceLabel(page)).toContainText('Illustrative demo');
  await page.getByRole('button', { name: 'Remove local files' }).click();
  await expect(page.getByRole('button', { name: 'Local files', exact: true })).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.objectUrlLog.revoked.length)).toBe(4);
  expect(requests).toEqual([]);
});

test('C: local preload has honest progress and cannot relabel the still-visible demo', async ({ page }) => {
  await enter(page);
  await dismissGuide(page);
  await page.evaluate(() => {
    const original = HTMLImageElement.prototype.decode;
    HTMLImageElement.prototype.decode = async function () {
      if (this.src.startsWith('blob:')) await new Promise((resolve) => setTimeout(resolve, 650));
      return original.call(this);
    };
  });
  await page.locator('input[type="file"]').setInputFiles([{ name: 'frame_1.png', mimeType: 'image/png', buffer: await png() }]);
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  await expect(page.getByRole('button', { name: 'Spin', exact: true })).toBeDisabled();
  await expect(sourceLabel(page)).toContainText('Illustrative demo');
  await expect(page.locator('.frame-proof')).toHaveText('Not hardware output');
  await expect(sourceLabel(page)).toHaveText('Hardware frames — loaded locally');
  await expect(page.getByRole('button', { name: 'Spin', exact: true })).toBeEnabled();
});

test('D: corrupted PNG rejects batch, reports filename, releases URLs and keeps demo interactive', async ({ page }) => {
  await trackUrls(page);
  await enter(page);
  await dismissGuide(page);
  const originalPixel = await pixel(page);
  await page.locator('input[type="file"]').setInputFiles([
    { name: 'good.png', mimeType: 'image/png', buffer: await png() },
    { name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('not an image') },
  ]);
  await expect(page.getByRole('alert')).toContainText('Could not decode: broken.png');
  await expect(sourceLabel(page)).toContainText('Illustrative demo');
  expect(await pixel(page)).toEqual(originalPixel);
  await expect(page.getByRole('button', { name: 'Spin', exact: true })).toBeEnabled();
  await expect.poll(() => page.evaluate(() => window.objectUrlLog.revoked.length)).toBe(2);
  await page.getByRole('application').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.angle')).toHaveText('011°');
  await expect(page.locator('.viewer-stage img')).toHaveCount(0);
});

test('source change cancels slow upload without stale activation or leaked URLs', async ({ page }) => {
  await trackUrls(page);
  await enter(page);
  await dismissGuide(page);
  await page.evaluate(() => {
    const original = HTMLImageElement.prototype.decode;
    HTMLImageElement.prototype.decode = async function () {
      if (this.src.startsWith('blob:')) await new Promise((resolve) => setTimeout(resolve, 300));
      return original.call(this);
    };
  });
  await page.locator('input[type="file"]').setInputFiles([{ name: 'a.png', mimeType: 'image/png', buffer: await png() }]);
  await expect(page.getByRole('progressbar')).toBeVisible();
  await page.getByRole('button', { name: 'Demo', exact: true }).click();
  await expect(page.getByRole('progressbar')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.objectUrlLog.revoked.length)).toBe(1);
  await page.waitForTimeout(400);
  await expect(sourceLabel(page)).toContainText('Illustrative demo');
  await expect(page.getByRole('button', { name: 'Local files', exact: true })).toHaveCount(0);
});

test('F: tutorial, keyboard wrapping, mouse orbit, tab focus, spin/reset and replay use common viewer', async ({ page }) => {
  await bundled(page);
  await enter(page);
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByText('Press Spin for hands-free playback.')).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByText('Every view in this orbit was rendered by Ateno hardware.')).toBeVisible();
  await page.getByRole('button', { name: 'Start exploring' }).click();
  const stage = page.getByRole('application');
  await expect(stage).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.angle')).toHaveText('315°');
  await page.keyboard.press('ArrowRight');
  const box = await stage.boundingBox();
  await page.mouse.move(box.x + box.width * .7, box.y + box.height * .4);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * .45, box.y + box.height * .4, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('.angle')).toHaveText('090°');
  await page.getByRole('button', { name: 'Reset view' }).click();
  await page.keyboard.press('Tab');
  const spin = page.getByRole('button', { name: 'Spin', exact: true });
  await expect(spin).toBeFocused();
  await expect(spin).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Pause' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.angle')).not.toHaveText('000°');
  await page.getByRole('button', { name: 'Pause' }).click();
  await page.getByRole('button', { name: 'Replay guide' }).click();
  await dismissGuide(page);
});

test('G: reduced motion stops spin, disables transitions and preserves manual orbit', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await enter(page);
  await dismissGuide(page);
  await expect(page.getByRole('button', { name: 'Spin', exact: true })).toBeDisabled();
  await expect(page.getByText(/Spin is off to respect/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reset view' })).toHaveCSS('transition-duration', '0s');
  await page.getByRole('application').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.angle')).toHaveText('011°');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: 'Spin', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.getByRole('button', { name: 'Spin', exact: true })).toBeDisabled();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.getByRole('button', { name: 'Spin', exact: true })).toHaveAttribute('aria-pressed', 'false');
});

test('E: mobile demo is dominant, controls fit, and native touch orbit works', async ({ browser }, info) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:5174/');
  await page.getByRole('button', { name: 'Enter the viewer' }).click();
  await expect(page.locator('canvas')).toBeVisible();
  await dismissGuide(page);
  await page.screenshot({ path: info.outputPath('mobile-demo.png'), fullPage: true });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const box = await page.getByRole('application').boundingBox();
  const session = await context.newCDPSession(page);
  const x = box.x + box.width * .7, y = box.y + box.height * .4;
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= 8; i++) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - box.width * .25 * i / 8, y }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.locator('.angle')).toHaveText('090°');
  await page.getByRole('button', { name: 'Run details' }).click();
  await expect(page.locator('.pipeline')).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('mobile-details.png'), fullPage: true });
  await context.close();
});
