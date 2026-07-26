import { test, expect } from '@playwright/test'
import { jsonPanel, editorPanel, seedJson } from './helpers'

test.describe('JSON Panel E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.locator(jsonPanel())).toBeVisible()
  })

  test.describe('Edit mode', () => {
    test('4.1 enter edit mode via Editar JSON button', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Editar JSON' })).toBeVisible()
      await page.getByRole('button', { name: 'Editar JSON' }).click()

      await expect(page.locator(editorPanel())).toBeVisible()
      await expect(page.getByRole('button', { name: 'Cancelar' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Validar' })).toBeVisible()
      await expect(page.getByText('Modo edição manual')).toBeVisible()
    })

    test('4.2 cancel editing discards changes', async ({ page }) => {
      await seedJson(page, '{"key":"value"}')
      await expect(page.locator(jsonPanel())).toContainText('"key"')

      await page.getByRole('button', { name: 'Editar JSON' }).click()
      const cm = page.locator(editorPanel())
      await expect(cm).toBeVisible()
      await cm.click()
      await page.keyboard.press('ControlOrMeta+a')
      await page.keyboard.press('Delete')
      await page.keyboard.type('{"changed":"yes"}', { delay: 5 })

      await page.getByRole('button', { name: 'Cancelar' }).click()

      await expect(page.locator(editorPanel())).not.toBeVisible()
      await expect(page.getByRole('button', { name: 'Editar JSON' })).toBeVisible()
      await expect(page.locator(jsonPanel())).toContainText('"key"')
      await expect(page.locator(jsonPanel())).not.toContainText('"changed"')
    })

    test('4.3 validate with valid JSON applies changes', async ({ page }) => {
      await page.getByRole('button', { name: 'Editar JSON' }).click()
      const cm = page.locator(editorPanel())
      await expect(cm).toBeVisible()
      await cm.click()
      await page.keyboard.press('ControlOrMeta+a')
      await page.keyboard.press('Delete')
      await page.keyboard.type('{"valid":true}', { delay: 5 })

      await page.getByRole('button', { name: 'Validar' }).click()

      await expect(page.getByText('JSON válido aplicado com sucesso.')).toBeVisible()
      await expect(page.locator(jsonPanel())).toContainText('"valid"')
      await expect(page.locator(editorPanel())).not.toBeVisible()
    })

    test('4.3 validate with invalid JSON shows error', async ({ page }) => {
      await page.getByRole('button', { name: 'Editar JSON' }).click()
      const cm = page.locator(editorPanel())
      await expect(cm).toBeVisible()
      await cm.click()
      await page.keyboard.press('ControlOrMeta+a')
      await page.keyboard.press('Delete')
      await page.keyboard.type('{ invalid }', { delay: 5 })

      await page.getByRole('button', { name: 'Validar' }).click()

      await expect(page.getByText('JSON inválido')).toBeVisible()
      await expect(page.locator(editorPanel())).toBeVisible()
    })
  })

  test.describe('Toolbar actions', () => {
    test('4.4 copy button copies formatted JSON to clipboard', async ({ page }) => {
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
      await seedJson(page, '{"hello":"world"}')

      await page.getByRole('button', { name: 'Copiar', exact: true }).click()
      await expect(page.getByText('JSON copiado para o clipboard!')).toBeVisible()

      const clip = await page.evaluate(() => navigator.clipboard.readText())
      expect(clip).toContain('"hello"')
      expect(clip).toContain('"world"')
    })

    test('4.5 copy minified button copies minified JSON', async ({ page }) => {
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
      await seedJson(page, '{"a":1,"b":2}')

      await page.getByRole('button', { name: 'Copiar minificado' }).click()
      await expect(page.getByText('JSON minificado copiado para o clipboard!')).toBeVisible()

      const clip = await page.evaluate(() => navigator.clipboard.readText())
      expect(clip).toBe('{"a":1,"b":2}')
      expect(clip).not.toContain('\n')
    })

    test('4.6 download button triggers file download', async ({ page }) => {
      await seedJson(page, '{"download":"test"}')

      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: 'Baixar' }).click()
      const download = await downloadPromise
      expect(download.suggestedFilename()).toBe('data.json')

      const path = await download.path()
      expect(path).toBeTruthy()
    })
  })
})
