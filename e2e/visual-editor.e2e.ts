import { test, expect } from '@playwright/test'
import { jsonPanel, seedJson } from './helpers'

test.describe('Visual Editor E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.locator(jsonPanel())).toBeVisible()
  })

  test.describe('Root type selection', () => {
    test('3.1 change root from string to number', async ({ page }) => {
      await seedJson(page, '"hello"')
      await page.getByRole('combobox', { name: 'Tipo' }).click()
      await page.getByRole('option', { name: 'Número' }).click()
      await expect(page.locator(jsonPanel())).toContainText('0')
    })

    test('3.1 change root from string to array', async ({ page }) => {
      await seedJson(page, '"hello"')
      await page.getByRole('combobox', { name: 'Tipo' }).click()
      await page.getByRole('option', { name: 'Array' }).click()
      await expect(page.locator(jsonPanel())).toContainText('[]')
    })
  })

  test.describe('Inline value editing', () => {
    test('3.2 edit a string value', async ({ page }) => {
      await seedJson(page, '{"key":"old"}')
      const input = page.locator('input[aria-label="Renomear chave key"]').locator('..').locator('..').locator('input[type="text"]')
      await input.clear()
      await input.fill('hello world')
      await input.blur()
      await expect(page.locator(jsonPanel())).toContainText('hello world')
    })

    test('3.2 edit a number value', async ({ page }) => {
      await seedJson(page, '{"count":0}')
      const numInput = page.locator('input[type="text"]').last()
      await expect(numInput).toBeVisible()
      await numInput.clear()
      await numInput.fill('42')
      await numInput.blur()
      await expect(page.locator(jsonPanel())).toContainText('42')
    })

    test('3.2 toggle a boolean value', async ({ page }) => {
      await seedJson(page, '{"flag":false}')
      const boolSelect = page.getByRole('combobox', { name: 'Valor' }).first()
      await expect(boolSelect).toBeVisible()
      await boolSelect.click()
      await page.getByRole('option', { name: 'true' }).click()
      await expect(page.locator(jsonPanel())).toContainText('true')
    })
  })

  test.describe('Object key rename', () => {
    test('3.3 rename object key updates JSON panel', async ({ page }) => {
      await seedJson(page, '{"name":"test"}')
      const keyInput = page.locator('input[aria-label="Renomear chave name"]')
      await keyInput.clear()
      await keyInput.fill('newKey')
      await keyInput.blur()
      await expect(page.locator(jsonPanel())).toContainText('"newKey"')
      await expect(page.locator(jsonPanel())).not.toContainText('"name"')
    })
  })

  test.describe('Delete node', () => {
    test('3.4 delete an object property', async ({ page }) => {
      await seedJson(page, '{"name":"test","age":25}')
      await expect(page.locator(jsonPanel())).toContainText('"name"')
      await page.getByRole('button', { name: 'Deletar name' }).click()
      await expect(page.locator(jsonPanel())).not.toContainText('"name"')
      await expect(page.locator(jsonPanel())).toContainText('"age"')
    })

    test('3.4 delete an array item', async ({ page }) => {
      await seedJson(page, '["a","b","c"]')
      await expect(page.locator(jsonPanel())).toContainText('"a"')
      await page.getByRole('button', { name: 'Deletar [0]' }).click()
      await expect(page.locator(jsonPanel())).not.toContainText('"a"')
      await expect(page.locator(jsonPanel())).toContainText('"b"')
    })
  })

  test.describe('Expand and collapse', () => {
    test('3.5 expand a nested object', async ({ page }) => {
      await seedJson(page, '{"outer":{"inner":"value"}}')
      await expect(page.locator('input[aria-label="Renomear chave inner"]')).not.toBeVisible()
      const expandBtn = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-right') }).first()
      await expandBtn.click()
      await expect(page.locator('input[aria-label="Renomear chave inner"]')).toBeVisible()
    })

    test('3.5 expand all and collapse all', async ({ page }) => {
      await seedJson(page, '{"outer":{"inner":"value"}}')
      await page.getByRole('button', { name: 'Expandir todos' }).click()
      await expect(page.locator('input[aria-label="Renomear chave inner"]')).toBeVisible()

      await page.getByRole('button', { name: 'Recolher todos' }).click()
      await expect(page.locator('input[aria-label="Renomear chave inner"]')).not.toBeVisible()
    })
  })

  test.describe('Palette drag-and-drop', () => {
    test('3.6 insert string via palette drop', async ({ page }) => {
      await seedJson(page, '{}')
      const paletteBtn = page.getByRole('button', { name: 'string' }).first()
      const dropZone = page.getByText('Arraste itens para cá').first()
      await paletteBtn.dragTo(dropZone)
      await expect(page.locator(jsonPanel())).toContainText('"newField"')
    })
  })

  test.describe('Node reorder', () => {
    test('3.6 reorder array items via drag-and-drop', async ({ page }) => {
      await seedJson(page, '["first","second"]')
      await expect(page.locator(jsonPanel())).toContainText('"first"')
      const firstHandle = page.locator('div[role="img"][aria-label="Arrastar para reordenar"]').first()
      const secondItem = page.getByText('[1]')
      await firstHandle.dragTo(secondItem)
      await expect(page.locator(jsonPanel())).toContainText('"second"')
      await expect(page.locator(jsonPanel())).toContainText('"first"')
    })
  })
})
