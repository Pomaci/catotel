// @ts-nocheck
import { device, expect, element, by } from "detox";

const loginEmail = process.env.DETOX_TEST_EMAIL;
const loginPassword = process.env.DETOX_TEST_PASSWORD;
const hasCreds = Boolean(loginEmail && loginPassword);

async function login() {
  await element(by.id("auth-email")).replaceText(loginEmail);
  await element(by.id("auth-password")).replaceText(loginPassword);
  await element(by.id("auth-submit")).tap();
}

describe("Admin dashboard smoke", () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  (hasCreds ? it : it.skip)("shows hero and key sections after login", async () => {
    await login();
    await expect(element(by.id("admin-hero-title"))).toBeVisible();
    await expect(element(by.text("Bugun Check-in / Check-out"))).toBeVisible();
    await expect(element(by.text("Geciken gorevler"))).toBeVisible();
    await expect(element(by.text("Doluluk analizi"))).toBeVisible();
    await element(by.id("logout-button")).tap();
    await expect(element(by.id("auth-hero-title"))).toBeVisible();
  });
});
