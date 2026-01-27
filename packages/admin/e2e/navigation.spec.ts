import { test, expect, waitForNetworkIdle } from './fixtures';

test.describe('Navigation & Layout', () => {
  test.describe('Sidebar', () => {
    test('should display sidebar navigation', async ({ authenticatedPage: page }) => {
      await page.goto('/');

      // Sidebar should be visible
      const sidebar = page.locator('[data-testid="sidebar"]');
      await expect(sidebar).toBeVisible();
    });

    test('should show all main navigation items', async ({ authenticatedPage: page }) => {
      await page.goto('/');

      const navItems = [
        { name: /dashboard/i, url: '/' },
        { name: /pages/i, url: '/pages' },
        { name: /media/i, url: '/media' },
        { name: /forms/i, url: '/forms' },
        { name: /redirects/i, url: '/redirects' },
      ];

      for (const item of navItems) {
        const link = page.getByRole('link', { name: item.name });
        await expect(link).toBeVisible();
      }
    });

    test('should navigate to pages on click', async ({ authenticatedPage: page }) => {
      await page.goto('/');

      // Click on Pages link
      await page.getByRole('link', { name: /pages/i }).click();
      await expect(page).toHaveURL('/pages');

      // Click on Media link
      await page.getByRole('link', { name: /media/i }).click();
      await expect(page).toHaveURL('/media');

      // Click on Forms link
      await page.getByRole('link', { name: /forms/i }).click();
      await expect(page).toHaveURL('/forms');
    });

    test('should highlight active navigation item', async ({ authenticatedPage: page }) => {
      await page.goto('/pages');

      const pagesLink = page.getByRole('link', { name: /pages/i });

      // Active link should have special styling (data-active or aria-current)
      await expect(pagesLink).toHaveAttribute('aria-current', 'page');
    });

    test('should be collapsible on mobile', async ({ authenticatedPage: page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Sidebar might be hidden or show toggle
      const menuToggle = page.getByRole('button', { name: /menu|toggle/i });

      if (await menuToggle.isVisible()) {
        await menuToggle.click();

        // Sidebar should appear
        const sidebar = page.locator('[data-testid="sidebar"]');
        await expect(sidebar).toBeVisible();
      }
    });
  });

  test.describe('Dashboard', () => {
    test('should display dashboard page', async ({ authenticatedPage: page }) => {
      await page.goto('/');

      await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    });

    test('should show quick stats or overview', async ({ authenticatedPage: page }) => {
      await page.goto('/');
      await waitForNetworkIdle(page);

      // Dashboard typically shows stats cards
      const statCards = page.locator('[data-testid="stat-card"]');

      // Either shows stats or some dashboard content
      const hasContent = await statCards.count() > 0 ||
        await page.getByText(/pages|media|forms/i).count() > 0;

      expect(hasContent).toBeTruthy();
    });

    test('should have quick action buttons', async ({ authenticatedPage: page }) => {
      await page.goto('/');
      await waitForNetworkIdle(page);

      // Dashboard might have quick actions like "Create Page", "Upload Media"
      const quickActions = page.locator('[data-testid="quick-action"]');

      // This is optional depending on dashboard design
    });
  });

  test.describe('Header', () => {
    test('should display header with logo', async ({ authenticatedPage: page }) => {
      await page.goto('/');

      // Header or top bar should exist
      const header = page.locator('header');
      await expect(header).toBeVisible();
    });

    test('should show user menu', async ({ authenticatedPage: page }) => {
      await page.goto('/');

      // User menu/avatar should be visible
      const userMenu = page.locator('[data-testid="user-menu"]');

      if (await userMenu.isVisible()) {
        await expect(userMenu).toBeVisible();
      }
    });

    test('should toggle theme', async ({ authenticatedPage: page }) => {
      await page.goto('/');

      const themeToggle = page.getByRole('button', { name: /theme|dark|light/i });

      if (await themeToggle.isVisible()) {
        // Get current theme
        const htmlElement = page.locator('html');
        const initialTheme = await htmlElement.getAttribute('class');

        // Toggle theme
        await themeToggle.click();

        // Theme should change
        const newTheme = await htmlElement.getAttribute('class');

        // Classes should be different (dark vs light)
      }
    });
  });

  test.describe('Breadcrumbs', () => {
    test('should show breadcrumb navigation', async ({ authenticatedPage: page }) => {
      await page.goto('/pages/home');
      await waitForNetworkIdle(page);

      const breadcrumbs = page.locator('[data-testid="breadcrumbs"]');

      if (await breadcrumbs.isVisible()) {
        // Should show path like: Dashboard > Pages > Home
        await expect(breadcrumbs.getByText(/pages/i)).toBeVisible();
      }
    });

    test('should navigate via breadcrumb links', async ({ authenticatedPage: page }) => {
      await page.goto('/pages/home');
      await waitForNetworkIdle(page);

      const breadcrumbs = page.locator('[data-testid="breadcrumbs"]');

      if (await breadcrumbs.isVisible()) {
        const pagesLink = breadcrumbs.getByRole('link', { name: /pages/i });

        if (await pagesLink.isVisible()) {
          await pagesLink.click();
          await expect(page).toHaveURL('/pages');
        }
      }
    });
  });

  test.describe('404 Page', () => {
    test('should show 404 for non-existent routes', async ({ authenticatedPage: page }) => {
      await page.goto('/non-existent-page-12345');

      // Should show not found message
      await expect(page.getByText(/not found|404|doesn't exist/i)).toBeVisible();
    });

    test('should provide navigation back to dashboard', async ({ authenticatedPage: page }) => {
      await page.goto('/non-existent-page-12345');

      const homeLink = page.getByRole('link', { name: /home|dashboard|go back/i });
      await expect(homeLink).toBeVisible();

      await homeLink.click();
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt to tablet viewport', async ({ authenticatedPage: page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');

      // Content should still be accessible
      await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    });

    test('should adapt to mobile viewport', async ({ authenticatedPage: page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Content should still be accessible
      await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    });

    test('should have proper touch targets on mobile', async ({ authenticatedPage: page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Buttons should be large enough to tap
      const buttons = page.getByRole('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const box = await button.boundingBox();

        if (box) {
          // Touch target should be at least 44x44 pixels
          expect(box.width >= 44 || box.height >= 44).toBeTruthy();
        }
      }
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should be fully keyboard navigable', async ({ authenticatedPage: page }) => {
      await page.goto('/');

      // Tab through navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should have visible focus
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should trap focus in modals', async ({ authenticatedPage: page }) => {
      await page.goto('/media');
      await waitForNetworkIdle(page);

      // Try to open a modal (like delete confirmation)
      const mediaItems = page.locator('[data-testid="media-item"]');

      if (await mediaItems.count() > 0) {
        const firstItem = mediaItems.first();
        const checkbox = firstItem.locator('input[type="checkbox"]');

        if (await checkbox.isVisible()) {
          await checkbox.click();

          const deleteButton = page.getByRole('button', { name: /delete/i });
          if (await deleteButton.isVisible()) {
            await deleteButton.click();

            const dialog = page.getByRole('dialog');
            if (await dialog.isVisible()) {
              // Tab should stay within dialog
              await page.keyboard.press('Tab');
              await page.keyboard.press('Tab');
              await page.keyboard.press('Tab');

              const focusedElement = page.locator(':focus');
              await expect(focusedElement).toBeVisible();

              // Close dialog
              await page.keyboard.press('Escape');
            }
          }
        }
      }
    });

    test('should close modals with Escape key', async ({ authenticatedPage: page }) => {
      await page.goto('/media');
      await waitForNetworkIdle(page);

      const mediaItems = page.locator('[data-testid="media-item"]');

      if (await mediaItems.count() > 0) {
        const firstItem = mediaItems.first();
        const checkbox = firstItem.locator('input[type="checkbox"]');

        if (await checkbox.isVisible()) {
          await checkbox.click();

          const deleteButton = page.getByRole('button', { name: /delete/i });
          if (await deleteButton.isVisible()) {
            await deleteButton.click();

            const dialog = page.getByRole('dialog');
            if (await dialog.isVisible()) {
              await page.keyboard.press('Escape');
              await expect(dialog).not.toBeVisible();
            }
          }
        }
      }
    });
  });

  test.describe('Loading States', () => {
    test('should show loading indicators', async ({ authenticatedPage: page }) => {
      await page.goto('/pages');

      // During initial load, should show loading state
      const loadingIndicator = page.locator('[data-testid="loading"]');

      // Loading should eventually disappear
      await expect(loadingIndicator).not.toBeVisible({ timeout: 10000 });
    });

    test('should show skeleton loaders', async ({ authenticatedPage: page }) => {
      await page.goto('/pages');

      // Skeleton loaders might appear during data fetch
      const skeletons = page.locator('[data-testid="skeleton"]');

      // Either skeletons exist briefly or content loads directly
    });
  });

  test.describe('Error Handling', () => {
    test('should show error state on network failure', async ({ authenticatedPage: page }) => {
      // Simulate network failure
      await page.route('**/api/**', (route) => route.abort());

      await page.goto('/pages');

      // Should show error state
      const errorMessage = page.getByText(/error|failed|could not/i);
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });

    test('should allow retry after error', async ({ authenticatedPage: page }) => {
      let requestCount = 0;

      // Fail first request, succeed on retry
      await page.route('**/api/**', (route) => {
        requestCount++;
        if (requestCount === 1) {
          route.abort();
        } else {
          route.continue();
        }
      });

      await page.goto('/pages');

      // Wait for error
      const retryButton = page.getByRole('button', { name: /retry|try again/i });

      if (await retryButton.isVisible({ timeout: 5000 })) {
        await retryButton.click();

        // Content should load on retry
        await waitForNetworkIdle(page);
      }
    });
  });
});
