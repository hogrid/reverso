import { test, expect, TEST_USER } from './fixtures';

test.describe('Authentication', () => {
  test.describe('Login Flow', () => {
    test('should display login page with correct elements', async ({ page }) => {
      await page.goto('/login');

      // Check page elements
      await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
      await expect(page.getByText('Sign in to access the admin panel')).toBeVisible();
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByLabel('Password')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    });

    test('should show validation for empty fields', async ({ page }) => {
      await page.goto('/login');

      // Click submit without filling fields
      await page.getByRole('button', { name: 'Sign in' }).click();

      // Browser native validation should prevent submission
      const emailInput = page.getByLabel('Email');
      await expect(emailInput).toBeFocused();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel('Email').fill('invalid@example.com');
      await page.getByLabel('Password').fill('wrongpassword');
      await page.getByRole('button', { name: 'Sign in' }).click();

      // Should show error message
      await expect(page.locator('.text-destructive')).toBeVisible();
    });

    test('should successfully login with valid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel('Email').fill(TEST_USER.email);
      await page.getByLabel('Password').fill(TEST_USER.password);
      await page.getByRole('button', { name: 'Sign in' }).click();

      // Should redirect to dashboard
      await expect(page).toHaveURL('/');
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    });

    test('should show loading state during login', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel('Email').fill(TEST_USER.email);
      await page.getByLabel('Password').fill(TEST_USER.password);

      // Click and immediately check for loading state
      const submitButton = page.getByRole('button', { name: 'Sign in' });
      await submitButton.click();

      // Button should show loading indicator
      await expect(page.getByText('Signing in...')).toBeVisible();
    });

    test('should redirect authenticated user away from login', async ({ page }) => {
      // First login
      await page.goto('/login');
      await page.getByLabel('Email').fill(TEST_USER.email);
      await page.getByLabel('Password').fill(TEST_USER.password);
      await page.getByRole('button', { name: 'Sign in' }).click();
      await expect(page).toHaveURL('/');

      // Try to access login page again
      await page.goto('/login');

      // Should redirect back to dashboard
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login for unauthenticated users', async ({ page }) => {
      // Try to access protected page
      await page.goto('/pages');

      // Should redirect to login
      await expect(page).toHaveURL('/login');
    });

    test('should redirect to login for all protected routes', async ({ page }) => {
      const protectedRoutes = [
        '/',
        '/pages',
        '/pages/home',
        '/media',
        '/forms',
        '/forms/1',
        '/forms/1/submissions',
        '/redirects',
      ];

      for (const route of protectedRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL('/login');
      }
    });
  });

  test.describe('Session Persistence', () => {
    test('should maintain session across page refreshes', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.getByLabel('Email').fill(TEST_USER.email);
      await page.getByLabel('Password').fill(TEST_USER.password);
      await page.getByRole('button', { name: 'Sign in' }).click();
      await expect(page).toHaveURL('/');

      // Refresh page
      await page.reload();

      // Should still be on dashboard
      await expect(page).toHaveURL('/');
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ authenticatedPage: page }) => {
      // Find and click logout button (usually in user menu)
      const userMenu = page.locator('[data-testid="user-menu"]');

      // If user menu exists, click it first
      if (await userMenu.isVisible()) {
        await userMenu.click();
        await page.getByRole('menuitem', { name: /logout|sign out/i }).click();
      } else {
        // Try to find a direct logout button
        const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
        if (await logoutButton.isVisible()) {
          await logoutButton.click();
        }
      }

      // Should redirect to login
      await expect(page).toHaveURL('/login');
    });
  });
});
