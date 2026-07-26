import { test, expect } from '@playwright/test'
import { jsonPanel, seedJson } from './helpers'

test.describe('Theme & Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.locator(jsonPanel())).toBeVisible()
  })

  test.describe('Theme toggle', () => {
    test('6.1 toggle from light to dark mode', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Tema escuro' })).toBeVisible()
      await page.getByRole('button', { name: 'Tema escuro' }).click()
      await expect(page.getByRole('button', { name: 'Tema claro' })).toBeVisible()
      const bg = await page.locator('main').evaluate((el) => getComputedStyle(el).backgroundColor)
      expect(bg).not.toBe('rgb(255, 255, 255)')
    })

    test('6.1 toggle from dark to light mode', async ({ page }) => {
      await page.getByRole('button', { name: 'Tema escuro' }).click()
      await expect(page.getByRole('button', { name: 'Tema claro' })).toBeVisible()
      await page.getByRole('button', { name: 'Tema claro' }).click()
      await expect(page.getByRole('button', { name: 'Tema escuro' })).toBeVisible()
    })

    test('6.2 theme persists across page reload', async ({ page }) => {
      await page.getByRole('button', { name: 'Tema escuro' }).click()
      await expect(page.getByRole('button', { name: 'Tema claro' })).toBeVisible()
      await page.reload()
      await expect(page.getByRole('button', { name: 'Tema claro' })).toBeVisible()
    })
  })

  test.describe('Navigation', () => {
    test('6.3 GitHub link opens repository in new tab', async ({ page }) => {
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page'),
        page.getByRole('link', { name: /github/i }).click(),
      ])
      expect(newPage.url()).toContain('github.com/GleisonOliveira/json-visual-editor')
      await newPage.close()
    })
  })

  test.describe('Toast notifications', () => {
    test('6.4 toast auto-dismisses after ~4 seconds', async ({ page }) => {
      await seedJson(page, '{"toast":"test"}')
      await page.getByRole('button', { name: 'Copiar', exact: true }).click()
      const toast = page.getByText('JSON copiado para o clipboard!')
      await expect(toast).toBeVisible()
      await expect(toast).not.toBeVisible({ timeout: 6000 })
    })
  })
})
