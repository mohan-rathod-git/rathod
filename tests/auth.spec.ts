import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should navigate to login page successfully', async ({ page }) => {
    // Navigate to base URL
    await page.goto('/');
    
    // Expect a title "to contain" a substring
    await expect(page).toHaveTitle(/Banjara Bandhan/);
    
    // Ensure the login button exists or redirect to login works
    const loginLink = page.getByRole('button', { name: /Sign In/i });
    if (await loginLink.isVisible()) {
      await loginLink.click();
    } else {
      await page.goto('/login');
    }
    
    // Check if Email and Password inputs are present
    await expect(page.getByPlaceholder('you@email.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
  });

  test('should show validation errors on invalid login', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.getByPlaceholder('you@email.com');
    const passwordInput = page.getByPlaceholder('••••••••');
    
    // Fill invalid data
    await emailInput.fill('invalid-email');
    await passwordInput.fill('123'); // Too short
    
    // Submit form
    await page.getByRole('button', { name: /Sign In/i }).click();
    
    // Check for Zod validation errors
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
    await expect(page.getByText('Password must be at least 6 characters')).toBeVisible();
  });
});
