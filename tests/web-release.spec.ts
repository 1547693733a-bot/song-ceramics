import {expect, test} from '@playwright/test';

for (const viewport of [{width: 393, height: 852}, {width: 1440, height: 900}]) {
  test(`production experience at ${viewport.width}px`, async ({page}) => {
    const failures: string[] = [];
    page.on('pageerror', error => failures.push(error.message));
    page.on('response', response => {if(response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);});
    await page.setViewportSize(viewport);
    await page.emulateMedia({reducedMotion: 'reduce'});
    await page.goto('/?preview=1'); // Production must never enable the preview shell.
    await expect(page.getByTestId('web-screen')).toBeVisible();
    await expect(page.getByTestId('device-picker')).toHaveCount(0);
    await expect(page.locator('.phone-bezel, .status-bar, .home-indicator')).toHaveCount(0);
    const screen = await page.getByTestId('web-screen').boundingBox();
    expect(screen?.height).toBe(viewport.height);
    expect(screen?.width).toBe(Math.min(viewport.width, 520));
    const intro = page.getByRole('button', {name: '触碰开孔泥坯，旋转进入八窑世界', exact: true});
    await expect(intro).toBeEnabled({timeout: 30_000});
    await intro.click();
    const enter = page.getByRole('button', {name: '轻触焰心，进入磁州窑三幕场景', exact: true});
    await expect(enter).toBeVisible();
    await enter.click();
    await expect(page.locator('.cizhou-knowledge')).toHaveAttribute('data-arrival-phase', 'ready');
    await page.locator('.cizhou-scene-hotspots button:visible').first().click();
    await expect(page.getByTestId('bottom-sheet')).toBeVisible();
    await expect.poll(async () => {
      const box = await page.getByTestId('bottom-sheet').boundingBox();
      return box ? box.y + box.height : Infinity;
    }).toBeLessThanOrEqual(viewport.height + 1);
    const sheet = await page.getByTestId('bottom-sheet').boundingBox();
    expect(sheet!.x).toBeGreaterThanOrEqual(screen!.x - 1);
    expect(sheet!.x + sheet!.width).toBeLessThanOrEqual(screen!.x + screen!.width + 1);
    expect(sheet!.y + sheet!.height).toBeLessThanOrEqual(viewport.height + 1);
    await page.getByRole('button', {name: '关闭知识详情'}).click();
    await expect(page.getByTestId('bottom-sheet')).toHaveCount(0);
    await page.locator('.cizhou-trait-carousel').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.cizhou-scene-hotspots')).toHaveAttribute('aria-label', '装载启程器物解读');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.cizhou-scene-hotspots')).toHaveAttribute('aria-label', '酒肆入席器物解读');
    await page.screenshot({path: `test-results/release-${viewport.width}.png`});
    await page.getByRole('button', {name: '返回窑口', exact: true}).click();
    await expect(enter).toBeVisible();
    expect(failures).toEqual([]);
  });
}

test('normal-motion clay intro reaches the kiln without a runtime error', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({width: 393, height: 852});
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.goto('/');
  const intro = page.getByRole('button', {name: '触碰开孔泥坯，旋转进入八窑世界', exact: true});
  await expect(intro).toBeEnabled({timeout: 30_000});
  await intro.click();
  await expect(page.locator('.kiln-sphere')).toHaveAttribute('data-intro-phase', 'hidden', {timeout: 30_000});
  await expect(page.getByRole('button', {name: '轻触焰心，进入磁州窑三幕场景', exact: true})).toBeVisible();
  expect(errors).toEqual([]);
});
