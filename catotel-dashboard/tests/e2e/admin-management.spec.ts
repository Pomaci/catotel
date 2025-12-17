import { test, expect } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL;
const describeFn = baseURL ? test.describe : test.describe.skip;
const adminEmail = process.env.E2E_ADMIN_EMAIL ?? 'admin@catotel.test';
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? 'Admin123!';

describeFn('Admin management flows', () => {
  test('admin can create room types and rooms with validation feedback', async ({ page }) => {
    const suffix = Date.now().toString();
    const roomTypeName = `Playwright Loft ${suffix}`;
    const roomName = `Suite ${suffix}`;

    await page.goto('/');
    await page.getByLabel(/Email/i).fill(adminEmail);
    await page.getByLabel(/?žifre/i).fill(adminPassword);
    await page.getByRole('button', { name: /GiriY Yap/i }).last().click();
    await page.waitForURL('**/dashboard');
    await page.goto('/dashboard/rooms');
    await expect(page.getByRole('heading', { name: /Oda Tipleri/i })).toBeVisible();

    await page.getByRole('button', { name: /Oda Tipi Ekle/i }).click();
    await page.getByRole('button', { name: /Kaydet/i }).click();
    await expect(page.getByText(/Oda adi gerekli/i)).toBeVisible();

    await page.getByLabel(/Oda Adi/i).fill(roomTypeName);
    await page.getByLabel(/Kapasite/i).selectOption('2');
    await page.getByLabel(/Overbooking toleransi/i).fill('1');
    await page.getByLabel(/Gece Ucreti/i).fill('199.5');
    await page.getByLabel(/Aciklama/i).fill('Playwright generated room type');
    await page.getByRole('button', { name: /Kaydet/i }).click();

    await expect(page.getByText(/Oda kaydedildi/i)).toBeVisible();
    await expect(page.getByText(roomTypeName)).toBeVisible();

    await page.getByRole('button', { name: /Oda Ekle/i }).click();
    await page.getByRole('button', { name: /Kaydet/i }).click();
    await expect(page.getByText(/Oda adi gerekli/i)).toBeVisible();

    await page.getByLabel(/^Oda Adi/i).fill(roomName);
    await page.getByLabel(/Oda Tipi/i).selectOption({ label: roomTypeName });
    await page.getByRole('button', { name: /Kaydet/i }).click();

    await expect(page.getByText(/Oda kaydedildi/i)).toBeVisible();
    await expect(page.getByText(roomName)).toBeVisible();
  });

  test('room type mutations require CSRF tokens for admins', async ({ request }) => {
    const loginCsrf = await request.get('/api/auth/csrf');
    expect(loginCsrf.ok()).toBeTruthy();
    const { token: loginToken } = (await loginCsrf.json()) as { token?: string };
    expect(loginToken).toBeTruthy();

    const loginResponse = await request.post('/api/auth/login', {
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': loginToken ?? '',
      },
      data: {
        email: adminEmail,
        password: adminPassword,
      },
    });
    expect(loginResponse.ok()).toBeTruthy();

    const nameBase = `CSRF Loft ${Date.now()}`;
    const missingCsrf = await request.post('/api/room-types', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        name: `${nameBase} Missing`,
        capacity: 2,
        nightlyRate: 180,
        overbookingLimit: 1,
      },
    });
    expect(missingCsrf.status()).toBe(403);

    const csrfResponse = await request.get('/api/auth/csrf');
    expect(csrfResponse.ok()).toBeTruthy();
    const { token } = (await csrfResponse.json()) as { token?: string };
    expect(token).toBeTruthy();

    const createResponse = await request.post('/api/room-types', {
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': token ?? '',
      },
      data: {
        name: `${nameBase} Validated`,
        capacity: 3,
        nightlyRate: 220,
        overbookingLimit: 0,
      },
    });
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    expect(created.name).toContain(nameBase);
  });
});
