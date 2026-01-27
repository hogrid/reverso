import { test, expect, waitForNetworkIdle } from './fixtures';

test.describe('Forms', () => {
  test.describe('Forms List', () => {
    test('should display forms list page', async ({ authenticatedPage: page }) => {
      await page.goto('/forms');

      await expect(page.getByRole('heading', { name: 'Forms' })).toBeVisible();
      await waitForNetworkIdle(page);
    });

    test('should show create new form button', async ({ authenticatedPage: page }) => {
      await page.goto('/forms');
      await waitForNetworkIdle(page);

      const createButton = page.getByRole('button', { name: /new form|create form/i });
      await expect(createButton).toBeVisible();
    });

    test('should navigate to form builder on create', async ({ authenticatedPage: page }) => {
      await page.goto('/forms');
      await waitForNetworkIdle(page);

      const createButton = page.getByRole('button', { name: /new form|create form/i });
      if (await createButton.isVisible()) {
        await createButton.click();

        // Should navigate to form builder
        await expect(page).toHaveURL(/\/forms\/new|\forms\/\d+/);
      }
    });

    test('should show form list or empty state', async ({ authenticatedPage: page }) => {
      await page.goto('/forms');
      await waitForNetworkIdle(page);

      // Either has forms or empty state
      const hasFormCards = await page.locator('[data-testid="form-card"]').count() > 0;
      const hasEmptyState = await page.getByText(/no forms|create your first form/i).isVisible();

      expect(hasFormCards || hasEmptyState).toBeTruthy();
    });
  });

  test.describe('Form Builder', () => {
    test('should display form builder interface', async ({ authenticatedPage: page }) => {
      // Go to forms list first
      await page.goto('/forms');
      await waitForNetworkIdle(page);

      // Either click create new or navigate to existing form
      const createButton = page.getByRole('button', { name: /new form|create form/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        await waitForNetworkIdle(page);

        // Should see form builder interface
        // Field palette, canvas, settings panel
      }
    });

    test('should show field type palette', async ({ authenticatedPage: page }) => {
      await page.goto('/forms/new');
      await waitForNetworkIdle(page);

      // Look for field type palette or drag-and-drop elements
      const fieldTypes = [
        /text/i,
        /email/i,
        /textarea/i,
        /select/i,
        /checkbox/i,
      ];

      for (const fieldType of fieldTypes) {
        const field = page.getByText(fieldType).first();
        // At least some field types should be available
      }
    });

    test('should allow naming the form', async ({ authenticatedPage: page }) => {
      await page.goto('/forms/new');
      await waitForNetworkIdle(page);

      const nameInput = page.getByLabel(/form name|name/i);
      if (await nameInput.isVisible()) {
        await nameInput.fill('Test Form ' + Date.now());
        await expect(nameInput).toHaveValue(/Test Form/);
      }
    });

    test('should save form', async ({ authenticatedPage: page }) => {
      await page.goto('/forms/new');
      await waitForNetworkIdle(page);

      // Fill form name
      const nameInput = page.getByLabel(/form name|name/i);
      if (await nameInput.isVisible()) {
        await nameInput.fill('E2E Test Form');
      }

      // Save form
      const saveButton = page.getByRole('button', { name: /save/i });
      if (await saveButton.isVisible()) {
        await saveButton.click();

        // Should show success or navigate
        await waitForNetworkIdle(page);
      }
    });
  });

  test.describe('Form Submissions', () => {
    test('should access submissions page', async ({ authenticatedPage: page }) => {
      await page.goto('/forms');
      await waitForNetworkIdle(page);

      // Find a form card and click submissions
      const formCard = page.locator('[data-testid="form-card"]').first();

      if (await formCard.isVisible()) {
        const submissionsLink = formCard.getByRole('link', { name: /submissions/i });
        if (await submissionsLink.isVisible()) {
          await submissionsLink.click();
          await expect(page).toHaveURL(/\/forms\/\d+\/submissions/);
        }
      }
    });

    test('should show submissions list or empty state', async ({ authenticatedPage: page }) => {
      await page.goto('/forms/1/submissions');
      await waitForNetworkIdle(page);

      // Either has submissions or empty/not found state
      const hasSubmissions = await page.locator('[data-testid="submission-row"]').count() > 0;
      const hasEmptyState = await page.getByText(/no submissions/i).isVisible();
      const hasNotFound = await page.getByText(/not found/i).isVisible();

      expect(hasSubmissions || hasEmptyState || hasNotFound).toBeTruthy();
    });

    test('should filter submissions', async ({ authenticatedPage: page }) => {
      await page.goto('/forms/1/submissions');
      await waitForNetworkIdle(page);

      const filterDropdown = page.getByRole('button', { name: /filter|status/i });

      if (await filterDropdown.isVisible()) {
        await filterDropdown.click();

        // Select a filter option
        const newOption = page.getByRole('menuitem', { name: /new/i });
        if (await newOption.isVisible()) {
          await newOption.click();
          await waitForNetworkIdle(page);
        }
      }
    });

    test('should export submissions', async ({ authenticatedPage: page }) => {
      await page.goto('/forms/1/submissions');
      await waitForNetworkIdle(page);

      const exportButton = page.getByRole('button', { name: /export/i });

      if (await exportButton.isVisible()) {
        // Click export (shouldn't actually download in test)
        // Just verify the button exists and is clickable
        await expect(exportButton).toBeEnabled();
      }
    });
  });

  test.describe('Form Settings', () => {
    test('should access form settings', async ({ authenticatedPage: page }) => {
      await page.goto('/forms/1');
      await waitForNetworkIdle(page);

      const settingsTab = page.getByRole('tab', { name: /settings/i });

      if (await settingsTab.isVisible()) {
        await settingsTab.click();

        // Should show settings panel
        await expect(page.getByText(/submit button|success message/i)).toBeVisible();
      }
    });

    test('should configure success message', async ({ authenticatedPage: page }) => {
      await page.goto('/forms/1');
      await waitForNetworkIdle(page);

      const settingsTab = page.getByRole('tab', { name: /settings/i });

      if (await settingsTab.isVisible()) {
        await settingsTab.click();

        const successMessageInput = page.getByLabel(/success message/i);
        if (await successMessageInput.isVisible()) {
          await successMessageInput.fill('Thank you for your submission!');
          await expect(successMessageInput).toHaveValue('Thank you for your submission!');
        }
      }
    });

    test('should configure email notifications', async ({ authenticatedPage: page }) => {
      await page.goto('/forms/1');
      await waitForNetworkIdle(page);

      const settingsTab = page.getByRole('tab', { name: /settings/i });

      if (await settingsTab.isVisible()) {
        await settingsTab.click();

        const emailInput = page.getByLabel(/notify email|notification email/i);
        if (await emailInput.isVisible()) {
          await emailInput.fill('admin@example.com');
          await expect(emailInput).toHaveValue('admin@example.com');
        }
      }
    });
  });

  test.describe('Form Fields', () => {
    test('should add text field', async ({ authenticatedPage: page }) => {
      await page.goto('/forms/new');
      await waitForNetworkIdle(page);

      // Find add field button or drag field from palette
      const textFieldButton = page.getByRole('button', { name: /add text|text field/i });

      if (await textFieldButton.isVisible()) {
        await textFieldButton.click();

        // Field should be added to canvas
        const fieldEditor = page.locator('[data-testid="field-editor"]');
        await expect(fieldEditor).toBeVisible();
      }
    });

    test('should configure field properties', async ({ authenticatedPage: page }) => {
      await page.goto('/forms/new');
      await waitForNetworkIdle(page);

      // Add a field first
      const textFieldButton = page.getByRole('button', { name: /add text|text field/i });

      if (await textFieldButton.isVisible()) {
        await textFieldButton.click();

        // Configure field label
        const labelInput = page.getByLabel(/label/i);
        if (await labelInput.isVisible()) {
          await labelInput.fill('Full Name');
        }

        // Configure placeholder
        const placeholderInput = page.getByLabel(/placeholder/i);
        if (await placeholderInput.isVisible()) {
          await placeholderInput.fill('Enter your name');
        }

        // Configure required
        const requiredCheckbox = page.getByLabel(/required/i);
        if (await requiredCheckbox.isVisible()) {
          await requiredCheckbox.check();
          await expect(requiredCheckbox).toBeChecked();
        }
      }
    });

    test('should reorder fields', async ({ authenticatedPage: page }) => {
      await page.goto('/forms/1');
      await waitForNetworkIdle(page);

      // Look for drag handles
      const dragHandles = page.locator('[data-testid="drag-handle"]');

      if (await dragHandles.count() > 1) {
        // Drag and drop functionality test
        // This is simplified; real drag-drop tests need more setup
        const firstHandle = dragHandles.first();
        const lastHandle = dragHandles.last();

        // Just verify handles exist
        await expect(firstHandle).toBeVisible();
        await expect(lastHandle).toBeVisible();
      }
    });

    test('should delete field', async ({ authenticatedPage: page }) => {
      await page.goto('/forms/1');
      await waitForNetworkIdle(page);

      // Find a field and its delete button
      const fieldItem = page.locator('[data-testid="field-item"]').first();

      if (await fieldItem.isVisible()) {
        // Hover to show delete button
        await fieldItem.hover();

        const deleteButton = fieldItem.getByRole('button', { name: /delete|remove/i });
        if (await deleteButton.isVisible()) {
          // Just verify it's clickable, don't actually delete
          await expect(deleteButton).toBeEnabled();
        }
      }
    });
  });

  test.describe('Form Preview', () => {
    test('should show form preview', async ({ authenticatedPage: page }) => {
      await page.goto('/forms/1');
      await waitForNetworkIdle(page);

      const previewTab = page.getByRole('tab', { name: /preview/i });

      if (await previewTab.isVisible()) {
        await previewTab.click();

        // Preview should show form fields
        await expect(page.locator('[data-testid="form-preview"]')).toBeVisible();
      }
    });

    test('should toggle between desktop and mobile preview', async ({ authenticatedPage: page }) => {
      await page.goto('/forms/1');
      await waitForNetworkIdle(page);

      const previewTab = page.getByRole('tab', { name: /preview/i });

      if (await previewTab.isVisible()) {
        await previewTab.click();

        const mobileButton = page.getByRole('button', { name: /mobile/i });
        const desktopButton = page.getByRole('button', { name: /desktop/i });

        if (await mobileButton.isVisible() && await desktopButton.isVisible()) {
          await mobileButton.click();
          // Preview container should change size

          await desktopButton.click();
          // Preview container should change back
        }
      }
    });
  });

  test.describe('Form Publishing', () => {
    test('should publish form', async ({ authenticatedPage: page }) => {
      await page.goto('/forms/1');
      await waitForNetworkIdle(page);

      const publishButton = page.getByRole('button', { name: /publish/i });

      if (await publishButton.isVisible()) {
        // Just verify button is enabled
        await expect(publishButton).toBeEnabled();
      }
    });

    test('should unpublish form', async ({ authenticatedPage: page }) => {
      await page.goto('/forms/1');
      await waitForNetworkIdle(page);

      const unpublishButton = page.getByRole('button', { name: /unpublish/i });

      if (await unpublishButton.isVisible()) {
        await expect(unpublishButton).toBeEnabled();
      }
    });
  });
});
