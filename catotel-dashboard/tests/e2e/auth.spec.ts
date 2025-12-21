import { test, expect } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL;
const describeFn = baseURL ? test.describe : test.describe.skip;

describeFn('Catotel dashboard auth flows', () => {
  test('user can register and reach dashboard', async ({ page }) => {
    const email = `playwright+${Date.now()}@example.com`;
    const password = `Pw!${Date.now()}`;

    await page.goto('/');
    await expect(page.getByText(/Nasıl kullanırsın/i)).toBeVisible();

    await page.getByRole('button', { name: /Hesabın yok mu/i }).click();
    await page.getByLabel(/Ad/i).fill('Playwright User');
    await page.getByLabel(/Email/i).fill(email);
    await page.getByLabel(/Ş�ifre/i).fill(password);
    await page.getByRole('button', { name: /Kayıt Ol ve Giriş Yap/i }).click();

    await page.waitForURL('**/dashboard');
    await expect(page.getByRole('heading', { name: /Playwright User/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Oturum Kontrolleri/i })).toBeVisible();
    await expect(page.getByText(/Kedi Profilleri/i)).toBeVisible();

    await page.getByRole('button', { name: /Çıkış Yap/i }).click();
    await page.waitForURL('**/');
    await expect(page.getByRole('button', { name: /Hesabın yok mu/i })).toBeVisible();
  });

  test('invalid login stays on landing and shows error', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/Email/i).fill('invalid@example.com');
    await page.getByLabel(/Ş�ifre/i).fill('wrong-password');
    await page.getByRole('button', { name: /Giriş Yap/i }).last().click();

    await expect(
      page.locator('text=/Invalid credentials|Giriş başarısız/i'),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test('login enforces CSRF token tied to the session', async ({ request }) => {
    const missingCsrf = await request.post('/api/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: 'csrf@test.com',
        password: 'csrf-test',
      },
    });
    expect(missingCsrf.status()).toBe(403);

    const csrfResponse = await request.get('/api/auth/csrf');
    expect(csrfResponse.ok()).toBeTruthy();
    const { token } = (await csrfResponse.json()) as { token?: string };
    expect(token).toBeTruthy();

    const response = await request.post('/api/auth/login', {
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': token ?? '',
      },
      data: {
        email: 'csrf@test.com',
        password: 'csrf-test',
      },
    });

    expect(response.status()).not.toBe(403);
    const setCookieHeader = response
      .headersArray()
      .filter(({ name }) => name.toLowerCase() === 'set-cookie')
      .map(({ value }) => value)
      .join('\n');
    expect(setCookieHeader).toMatch(/catotel_csrf/);

    if (response.status() >= 400) {
      const body = await response.json().catch(() => ({}));
      expect(body?.message ?? '').not.toMatch(/CSRF/i);
    }
  });
});
