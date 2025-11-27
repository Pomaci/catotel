import { test, expect } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL;
const describeFn = baseURL ? test.describe : test.describe.skip;

describeFn('Reservations flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Hesabın yok mu/i }).click();
    const email = `resv+${Date.now()}@example.com`;
    const password = `Pw!${Date.now()}`;
    await page.getByLabel(/Ad/i).fill('Playwright Resv');
    await page.getByLabel(/Email/i).fill(email);
    await page.getByLabel(/Şifre/i).fill(password);
    await page.getByRole('button', { name: /Kayıt Ol ve Giriş Yap/i }).click();
    await page.waitForURL('**/dashboard');
  });

  test('customer can create a reservation and see it listed', async ({ page }) => {
    // Navigate to reservations page (assumes sidebar link exists)
    await page.getByRole('link', { name: /Rezervasyonlar/i }).click();
    await expect(page).toHaveURL(/reservations/);

    // Fill reservation form (selectors depend on actual UI; adjust as needed)
    await page.getByLabel(/Giriş Tarihi/i).fill('2025-12-01');
    await page.getByLabel(/Çıkış Tarihi/i).fill('2025-12-03');
    await page.getByRole('combobox', { name: /Oda/i }).selectOption({ index: 0 });
    await page.getByRole('checkbox', { name: /Kedilerimden/i }).first().check();

    const submit = page.getByRole('button', { name: /Rezervasyon Oluştur/i });
    await submit.click();

    await expect(page.getByText(/Rezervasyon oluşturuldu/i)).toBeVisible();
    await expect(page.getByText(/2025-12-01/)).toBeVisible();
  });

  test('overlapping reservation attempt shows error', async ({ page }) => {
    await page.getByRole('link', { name: /Rezervasyonlar/i }).click();
    await page.getByLabel(/Giriş Tarihi/i).fill('2025-12-01');
    await page.getByLabel(/Çıkış Tarihi/i).fill('2025-12-03');
    await page.getByRole('combobox', { name: /Oda/i }).selectOption({ index: 0 });
    await page.getByRole('checkbox', { name: /Kedilerimden/i }).first().check();
    await page.getByRole('button', { name: /Rezervasyon Oluştur/i }).click();
    await expect(page.getByText(/Rezervasyon oluşturuldu/i)).toBeVisible();

    // Second overlapping attempt
    await page.getByLabel(/Giriş Tarihi/i).fill('2025-12-02');
    await page.getByLabel(/Çıkış Tarihi/i).fill('2025-12-04');
    await page.getByRole('button', { name: /Rezervasyon Oluştur/i }).click();
    await expect(page.getByText(/oda.*dolu|müsait/i)).toBeVisible();
  });
});
