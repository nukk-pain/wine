// __tests__/e2e/wine-tracker.spec.ts
import { test, expect } from '@playwright/test';

test('complete wine label processing flow', async ({ page }) => {
  // Mock API responses
  await page.route('/api/process', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          type: 'wine_label',
          extractedData: {
            name: 'SOAVE',
            'Region/Producer': 'FARINA',
            'Varietal(품종)': 'GARGANEGA'
          },
          notionResult: {
            id: 'test-id',
            url: 'test-url'
          }
        }
      })
    });
  });

  await page.goto('/');
  
  // Check initial page load
  await expect(page.locator('h1')).toHaveText('와인 추적기');
  
  // 1. Create a mock file for upload
  const fileContent = 'mock wine label image';
  const buffer = Buffer.from(fileContent);
  
  // 2. Upload file (simulated)
  await page.evaluate(() => {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      const mockFile = new File(['mock image content'], 'wine-label.jpg', { type: 'image/jpeg' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(mockFile);
      fileInput.files = dataTransfer.files;
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  
  // 3. Image type selection UI should appear
  await expect(page.locator('text=와인 라벨')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('text=영수증')).toBeVisible();
  
  // 4. Select wine label
  await page.click('text=와인 라벨');
  
  // 5. Check processing results
  await expect(page.locator('[data-testid="wine-name"]:has-text("SOAVE")')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('.wine-region:has-text("FARINA")')).toBeVisible();
  await expect(page.locator('.wine-varietal:has-text("GARGANEGA")')).toBeVisible();
  
  // 6. Check that save success message appears (since notionResult is included)
  await expect(page.locator('text=저장 완료!')).toBeVisible();
});

test('application loads correctly', async ({ page }) => {
  await page.goto('/');
  
  // Check initial page elements
  await expect(page.locator('h1')).toHaveText('와인 추적기');
  await expect(page.locator('text=1. 이미지 업로드')).toBeVisible();
  await expect(page.locator('text=파일 선택')).toBeVisible();
});

test('accessibility keyboard navigation', async ({ page }) => {
  await page.goto('/');
  
  // Tab key navigation test
  await page.keyboard.press('Tab');
  
  // Check if upload button gets focus
  const uploadButton = page.locator('button:has-text("파일 선택")');
  await expect(uploadButton).toBeFocused();
});

test('responsive design on mobile', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  
  // Check mobile layout
  await expect(page.locator('h1')).toBeVisible();
  
  // Check mobile tips section
  await expect(page.locator('text=모바일 팁:')).toBeVisible();
});

test('error handling display', async ({ page }) => {
  // Mock API to return error
  await page.route('/api/process', async route => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        error: '처리 중 오류가 발생했습니다'
      })
    });
  });
  
  await page.goto('/');
  
  // Simulate file upload and processing
  await page.evaluate(() => {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      const mockFile = new File(['mock image'], 'test.jpg', { type: 'image/jpeg' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(mockFile);
      fileInput.files = dataTransfer.files;
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  
  // Wait for type selector and click wine label
  await expect(page.locator('text=와인 라벨')).toBeVisible({ timeout: 5000 });
  await page.click('text=와인 라벨');
  
  // Check error message appears
  await expect(page.locator('text=오류: 처리 중 오류가 발생했습니다')).toBeVisible({ timeout: 10000 });
});