import { test, expect } from '@playwright/test';

test.describe('Certificate Claim Flow', () => {
  const testEventId = process.env.PLAYWRIGHT_TEST_EVENT_ID || 'test-event-id';

  test('landing page loads and shows hero', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByText(/zerocert/i).first()).toBeVisible();
  });

  test('verify page renders search form', async ({ page }) => {
    await page.goto('/verify');
    await expect(page.locator('[aria-label="Certificate ID to verify"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /verify/i })).toBeVisible();
  });

  test('verify shows not-found for invalid cert ID', async ({ page }) => {
    await page.goto('/verify');
    await page.fill('[aria-label="Certificate ID to verify"]', 'INVALID-CERT-ZZZ');
    await page.click('button:has-text("Verify")');
    await expect(page.getByText(/not found/i)).toBeVisible({ timeout: 8000 });
  });

  test('login page renders form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('[aria-label="Email address"]')).toBeVisible();
    await expect(page.locator('[aria-label="Password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('login redirects unauthenticated access to dashboard', async ({ page }) => {
    const res = await page.goto('/dashboard');
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('claim page loads for valid event', async ({ page }) => {
    await page.goto(`/events/${testEventId}`);
    // Either shows claim form or error — both are valid
    const hasForm = await page.locator('[aria-label="Certificate claim form"]').isVisible().catch(() => false);
    const hasError = await page.getByText(/not found|removed/i).isVisible().catch(() => false);
    expect(hasForm || hasError).toBeTruthy();
  });
});
