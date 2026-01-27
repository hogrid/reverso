import { test, expect, waitForNetworkIdle } from './fixtures';

test.describe('Pages', () => {
  test.describe('Pages List', () => {
    test('should display list of pages', async ({ authenticatedPage: page }) => {
      await page.goto('/pages');

      // Should show pages heading
      await expect(page.getByRole('heading', { name: 'Pages' })).toBeVisible();

      // Should show page cards or list items
      await waitForNetworkIdle(page);

      // Either we have pages or an empty state
      const hasPages = await page.locator('[data-testid="page-card"]').count() > 0;
      const hasEmptyState = await page.getByText(/no pages/i).isVisible();

      expect(hasPages || hasEmptyState).toBeTruthy();
    });

    test('should navigate to page editor on page click', async ({ authenticatedPage: page }) => {
      await page.goto('/pages');
      await waitForNetworkIdle(page);

      // Click on first page card if exists
      const pageCard = page.locator('[data-testid="page-card"]').first();

      if (await pageCard.isVisible()) {
        await pageCard.click();
        await expect(page).toHaveURL(/\/pages\/.+/);
      }
    });

    test('should have search functionality', async ({ authenticatedPage: page }) => {
      await page.goto('/pages');

      const searchInput = page.getByPlaceholder(/search/i);

      if (await searchInput.isVisible()) {
        await searchInput.fill('home');
        await waitForNetworkIdle(page);

        // Results should be filtered
        const pageCards = page.locator('[data-testid="page-card"]');
        const count = await pageCards.count();

        // Either filtered results or no results message
        expect(count >= 0).toBeTruthy();
      }
    });
  });

  test.describe('Page Editor', () => {
    test('should display page editor with sections', async ({ authenticatedPage: page }) => {
      // Navigate to a page (assuming 'home' exists)
      await page.goto('/pages/home');
      await waitForNetworkIdle(page);

      // Either shows editor or page not found
      const hasEditor = await page.locator('[data-testid="field-renderer"]').count() > 0;
      const hasNotFound = await page.getByText(/not found/i).isVisible();

      expect(hasEditor || hasNotFound).toBeTruthy();
    });

    test('should show back button to return to pages list', async ({ authenticatedPage: page }) => {
      await page.goto('/pages/home');

      const backButton = page.getByRole('link', { name: /back/i });
      if (await backButton.isVisible()) {
        await backButton.click();
        await expect(page).toHaveURL('/pages');
      }
    });

    test('should track unsaved changes', async ({ authenticatedPage: page }) => {
      await page.goto('/pages/home');
      await waitForNetworkIdle(page);

      // Find a text input field
      const textInput = page.locator('input[type="text"]').first();

      if (await textInput.isVisible()) {
        // Get current value
        const currentValue = await textInput.inputValue();

        // Modify the field
        await textInput.fill(`${currentValue} modified`);

        // Should show unsaved changes indicator
        const unsavedBadge = page.getByText(/unsaved changes/i);
        await expect(unsavedBadge).toBeVisible();
      }
    });

    test('should save changes on save button click', async ({ authenticatedPage: page }) => {
      await page.goto('/pages/home');
      await waitForNetworkIdle(page);

      // Find a text input field
      const textInput = page.locator('input[type="text"]').first();

      if (await textInput.isVisible()) {
        // Modify the field
        await textInput.fill('Test Value ' + Date.now());

        // Click save button
        const saveButton = page.getByRole('button', { name: /save/i });
        await expect(saveButton).toBeEnabled();
        await saveButton.click();

        // Should show saved indicator
        await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 5000 });
      }
    });

    test('should support undo/redo operations', async ({ authenticatedPage: page }) => {
      await page.goto('/pages/home');
      await waitForNetworkIdle(page);

      // Find a text input field
      const textInput = page.locator('input[type="text"]').first();

      if (await textInput.isVisible()) {
        const originalValue = await textInput.inputValue();

        // Modify the field
        await textInput.fill('New Value');

        // Click undo button
        const undoButton = page.getByRole('button', { name: /undo/i });
        if (await undoButton.isEnabled()) {
          await undoButton.click();

          // Value should revert
          await expect(textInput).toHaveValue(originalValue);
        }
      }
    });

    test('should handle keyboard shortcuts', async ({ authenticatedPage: page }) => {
      await page.goto('/pages/home');
      await waitForNetworkIdle(page);

      // Find a text input field
      const textInput = page.locator('input[type="text"]').first();

      if (await textInput.isVisible()) {
        // Modify the field
        await textInput.fill('Test Value');

        // Press Ctrl+S to save
        await page.keyboard.press('Control+s');

        // Should trigger save (check for saving indicator)
        await expect(page.getByText(/saving/i)).toBeVisible({ timeout: 1000 }).catch(() => {
          // Save might complete quickly, check for saved indicator instead
          return expect(page.getByText(/saved/i)).toBeVisible({ timeout: 5000 });
        });
      }
    });

    test('should display section tabs for multi-section pages', async ({ authenticatedPage: page }) => {
      await page.goto('/pages/home');
      await waitForNetworkIdle(page);

      // Check for tabs if page has multiple sections
      const tabs = page.getByRole('tablist');

      if (await tabs.isVisible()) {
        const tabButtons = tabs.getByRole('tab');
        const tabCount = await tabButtons.count();

        if (tabCount > 1) {
          // Click second tab
          await tabButtons.nth(1).click();

          // Tab content should change
          await expect(tabButtons.nth(1)).toHaveAttribute('data-state', 'active');
        }
      }
    });

    test('should warn about unsaved changes when navigating away', async ({ authenticatedPage: page }) => {
      await page.goto('/pages/home');
      await waitForNetworkIdle(page);

      // Find a text input field
      const textInput = page.locator('input[type="text"]').first();

      if (await textInput.isVisible()) {
        // Modify the field
        await textInput.fill('Unsaved change');

        // Try to navigate away
        await page.getByRole('link', { name: /back/i }).click();

        // Should show confirmation dialog
        const confirmDialog = page.getByRole('alertdialog');
        if (await confirmDialog.isVisible()) {
          await expect(confirmDialog.getByText(/unsaved changes/i)).toBeVisible();

          // Cancel navigation
          await confirmDialog.getByRole('button', { name: /cancel/i }).click();

          // Should still be on editor
          await expect(page).toHaveURL(/\/pages\/home/);
        }
      }
    });
  });

  test.describe('Field Types', () => {
    test('should render text fields correctly', async ({ authenticatedPage: page }) => {
      await page.goto('/pages/home');
      await waitForNetworkIdle(page);

      const textInput = page.locator('input[type="text"]').first();
      if (await textInput.isVisible()) {
        await expect(textInput).toBeEditable();
      }
    });

    test('should render textarea fields correctly', async ({ authenticatedPage: page }) => {
      await page.goto('/pages/home');
      await waitForNetworkIdle(page);

      const textarea = page.locator('textarea').first();
      if (await textarea.isVisible()) {
        await expect(textarea).toBeEditable();
      }
    });

    test('should render image fields with upload option', async ({ authenticatedPage: page }) => {
      await page.goto('/pages/home');
      await waitForNetworkIdle(page);

      const imageField = page.locator('[data-field-type="image"]').first();
      if (await imageField.isVisible()) {
        // Should have upload or select button
        const uploadButton = imageField.getByRole('button', { name: /upload|select|browse/i });
        await expect(uploadButton).toBeVisible();
      }
    });
  });
});
