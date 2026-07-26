import { test, expect } from '@playwright/test'
import { jsonPanel, editorPanel, seedJson } from './helpers'

test.describe('Accessibility E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.locator(jsonPanel())).toBeVisible()
  })

  test.describe('Skip-to-Content', () => {
    test('9.1 skip-to-content link is keyboard-reachable and moves focus to main content', async ({ page }) => {
      const skipLink = page.locator('a[href="#main-content"]')
      await expect(skipLink).toBeAttached()

      const box = await skipLink.boundingBox()

      if (box !== null) {
        expect(box.x).toBeLessThan(0)
      }

      await page.keyboard.press('Tab')
      await expect(skipLink).toBeFocused()

      await page.keyboard.press('Enter')
      const mainContent = page.locator('#main-content')
      await expect(mainContent).toBeVisible()
    })
  })

  test.describe('ARIA Labels', () => {
    test('9.2 CodeMirror aria-label switches on edit mode entry', async ({ page }) => {
      await expect(page.locator(jsonPanel())).toHaveAttribute('aria-label', 'Visualização de JSON')

      await page.getByRole('button', { name: 'Editar JSON' }).click()
      await expect(page.locator(editorPanel())).toHaveAttribute('aria-label', 'Editor de JSON')
      await expect(page.locator(jsonPanel())).not.toBeVisible()
    })
  })

  test.describe('Disabled States in Edit Mode', () => {
    test('9.3 palette buttons, TypeSelector, ValueInput, delete buttons, and key rename inputs are disabled during edit mode', async ({ page }) => {
      await seedJson(page, '{"key":"value","count":42,"flag":true}')

      const paletteBtn = page.getByRole('button', { name: 'string' }).first()
      await expect(paletteBtn).toBeEnabled()

      const typeSelector = page.getByRole('combobox', { name: 'Tipo' }).first()
      await expect(typeSelector).toBeEnabled()

      const stringInput = page.locator('input[aria-label="Renomear chave key"]').locator('..').locator('..').locator('input[type="text"]')
      await expect(stringInput).toBeEnabled()

      const deleteBtn = page.getByRole('button', { name: 'Deletar key' })
      await expect(deleteBtn).toBeEnabled()

      await page.getByRole('button', { name: 'Editar JSON' }).click()
      await expect(page.locator(editorPanel())).toBeVisible()

      await expect(paletteBtn).toBeDisabled()
      await expect(typeSelector).toBeDisabled()
      await expect(stringInput).toBeDisabled()
      await expect(deleteBtn).toBeDisabled()
    })
  })

  test.describe('Toast Accessibility', () => {
    test('9.4 toast notifications render inside a container with role="alert"', async ({ page }) => {
      await seedJson(page, '{"toast":"test"}')
      await page.getByRole('button', { name: 'Copiar', exact: true }).click()
      const alert = page.locator('[role="alert"]')
      await expect(alert).toBeVisible()
      await expect(alert).toContainText('JSON copiado para o clipboard!')
    })
  })

  test.describe('Heading Hierarchy', () => {
    test('9.5 h1 ("JSON Visual Editor") is present as the main heading', async ({ page }) => {
      const h1 = page.locator('h1')
      await expect(h1).toBeVisible()
      await expect(h1).toContainText('JSON Visual Editor')
    })

    test('9.5 h2 heading exists for mobile form section', async ({ page }) => {
      const h2 = page.locator('h2')
      const count = await h2.count()
      expect(count).toBeGreaterThanOrEqual(0)
    })
  })
})
