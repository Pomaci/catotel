// @ts-nocheck
import { device, expect, element, by } from "detox";

const loginEmail = process.env.DETOX_TEST_EMAIL;
const loginPassword = process.env.DETOX_TEST_PASSWORD;
const shouldRunLogin = Boolean(loginEmail && loginPassword);

async function loginThroughForm() {
  await element(by.id("auth-email")).replaceText(loginEmail);
  await element(by.id("auth-password")).replaceText(loginPassword);
  await element(by.id("auth-submit")).tap();
}

describe("Catotel Auth smoke", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it("renders landing screen", async () => {
    await expect(element(by.id("auth-hero-title"))).toBeVisible();
  });

  (shouldRunLogin ? it : it.skip)(
    "logs in with provided credentials and reaches dashboard",
    async () => {
      await loginThroughForm();
      await expect(element(by.id("admin-hero-title"))).toBeVisible();
      await element(by.id("logout-button")).tap();
      await expect(element(by.id("auth-hero-title"))).toBeVisible();
    },
  );
});
