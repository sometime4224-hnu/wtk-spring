const { test, expect } = require('@playwright/test');

async function blockExternalRequests(page) {
  await page.route('https://www.googletagmanager.com/**', (route) => route.abort());
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort());
  await page.route('https://fonts.gstatic.com/**', (route) => route.abort());
  await page.route('https://cdnjs.cloudflare.com/**', (route) => route.abort());
}

test('c17 reading page is linked from the chapter hub', async ({ page }) => {
  await blockExternalRequests(page);

  await page.goto('/c17/index.html', { waitUntil: 'domcontentloaded' });
  const readingLink = page.locator('a[href="reading.html"]');
  const cuttoonLink = page.locator('a[href="reading-cuttoon.html"]');
  const writingLink = page.locator('a[href="writing-cut.html"]');

  await expect(readingLink).toContainText('서동요 읽기와 내용 확인');
  await expect(cuttoonLink).toContainText('서동요 컷툰 보기');
  await expect(writingLink).toContainText('서동요 컷 쓰기');
});

test('c17 reading page renders visuals and grades reading checks', async ({ page }) => {
  await blockExternalRequests(page);

  await page.goto('/c17/reading.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('서동요와 소문의 힘');
  await expect(page.locator('.lesson-visual img')).toHaveCount(4);
  await expect(page.locator('.story-card img')).toHaveCount(4);

  await page.waitForFunction(() => {
    const images = Array.from(document.querySelectorAll('.lesson-visual img, .story-card img'));
    return images.length === 8 && images.every((image) => image.complete && image.naturalWidth > 0);
  });

  const imageSources = await page.locator('.lesson-visual img, .story-card img').evaluateAll((images) => (
    images.map((image) => image.currentSrc)
  ));
  for (const src of imageSources) {
    expect(src).toContain('/assets/c17/vocabulary/images/cards/');
  }

  await page.locator('[data-question]').first().locator('[data-choice="2"]').click();
  await expect(page.locator('[data-question]').first().locator('[data-feedback]')).toContainText('정답');

  await page.locator('#sequenceList button').nth(2).click();
  await expect(page.locator('#sequenceList button').nth(2).locator('b')).toHaveText('1');
});

test('c17 reading cuttoon renders sheet and individual cut assets', async ({ page }) => {
  await blockExternalRequests(page);

  await page.goto('/c17/reading-cuttoon.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('서동요 컷툰');
  await expect(page.locator('[data-sheet-panel] img')).toHaveCount(3);
  await expect(page.locator('[data-cut-card] img')).toHaveCount(9);

  await page.waitForFunction(() => {
    const images = Array.from(document.querySelectorAll('[data-sheet-panel].active img, [data-cut-card] img'));
    return images.length === 10 && images.every((image) => image.complete && image.naturalWidth > 0);
  });

  const imageSources = await page.locator('[data-sheet-panel] img, [data-cut-card] img').evaluateAll((images) => (
    images.map((image) => image.getAttribute('src'))
  ));
  expect(imageSources.filter((src) => src.includes('../assets/c17/reading-writing/images/cuttoon/'))).toHaveLength(3);
  expect(imageSources.filter((src) => src.includes('../assets/c17/reading-writing/images/cuts/'))).toHaveLength(9);

  await page.locator('[data-sheet-button="2"]').click();
  await expect(page.locator('[data-sheet-panel="2"]')).toHaveClass(/active/);
  await page.waitForFunction(() => {
    const image = document.querySelector('[data-sheet-panel="2"].active img');
    return image && image.complete && image.naturalWidth > 0;
  });

  await page.locator('[data-sheet-button="3"]').click();
  await expect(page.locator('[data-sheet-panel="3"]')).toHaveClass(/active/);
  await page.waitForFunction(() => {
    const image = document.querySelector('[data-sheet-panel="3"].active img');
    return image && image.complete && image.naturalWidth > 0;
  });
});

test('c17 cut writing page checks a sentence choice', async ({ page }) => {
  await blockExternalRequests(page);

  await page.goto('/c17/writing-cut.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('서동요 컷 쓰기');
  await expect(page.locator('.cut-pick')).toHaveCount(9);
  await expect(page.locator('#cutImage')).toHaveAttribute('src', /writing-cut\/c17-writing-cut-01\.webp/);
  await expect(page.locator('#progressDots .dot')).toHaveCount(4);
  await expect(page.locator('#modeRow')).not.toContainText('문장');
  await expect(page.locator('body')).not.toContainText('전체 문장 쓰기');
  await expect(page.locator('.cut-pick').first()).toContainText('0/4 완료');

  await page.waitForFunction(() => {
    const image = document.querySelector('#cutImage');
    return image && image.complete && image.naturalWidth > 0;
  });

  await page.locator('[data-choice-index="0"]').click();
  await page.locator('#checkBtn').click();
  await expect(page.locator('#feedback')).toContainText('정답');

  await page.locator('#nextBtn').click();
  await expect(page.locator('#stageTitle')).toContainText('핵심어');
});
