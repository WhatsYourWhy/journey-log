const path = require('path');
const { test, expect } = require('@playwright/test');

const indexFileUrl = `file://${path.join(__dirname, '..', 'index.html')}`;

test.describe('PWA wiring', () => {
  test('includes manifest and install icon links', async ({ page }) => {
    await page.goto(indexFileUrl);

    await expect(page.locator('link[rel="manifest"][href="manifest.webmanifest"]')).toHaveCount(1);
    await expect(page.locator('link[rel="apple-touch-icon"][href="icons/icon-192.svg"]')).toHaveCount(1);
    await expect(page.locator('link[rel="mask-icon"][href="icons/icon-maskable.svg"]')).toHaveCount(1);
  });

  test('signals service-worker registration in supported contexts', async ({ page }) => {
    await page.goto(indexFileUrl);

    const supportsRegistration = await page.evaluate(
      () => 'serviceWorker' in navigator && window.isSecureContext
    );

    test.skip(!supportsRegistration, 'Service workers require a secure context.');

    await expect
      .poll(async () => page.getAttribute('html', 'data-sw-status'))
      .toBe('registered');
  });
});
