import { test, expect } from '@playwright/test'
import { jsonPanel, seedJson } from './helpers'

test.describe('Responsive Layouts', () => {
  test.describe('Desktop (1280x720)', () => {
    test.use({ viewport: { width: 1280, height: 720 } })

    test('5.1 two-column layout with both panels visible', async ({ page }) => {
      await page.goto('/')
      await expect(page.locator(jsonPanel())).toBeVisible()
      await expect(page.getByText('Modelo (visual)')).toBeVisible()
      await expect(page.getByText('JSON Final')).toBeVisible()
    })

    test('5.1 palette panel visible, AddFieldForm hidden', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('button', { name: 'string' }).first()).toBeVisible()
      await expect(page.getByRole('heading', { name: /adicionar dados ao json/i })).not.toBeVisible()
    })

    test('5.3 desktop toolbar shows text buttons', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('button', { name: 'Editar JSON' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Copiar', exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Copiar minificado' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Baixar' })).toBeVisible()
    })
  })

  test.describe('Mobile (375x812)', () => {
    test.use({ viewport: { width: 375, height: 812 } })

    test('5.2 single-column stacked layout', async ({ page }) => {
      await page.goto('/')
      await expect(page.locator(jsonPanel())).toBeVisible()
      await expect(page.getByText('Modelo (visual)')).toBeVisible()
      await expect(page.getByText('JSON Final')).toBeVisible()
    })

    test('5.2 AddFieldForm visible, palette hidden', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('heading', { name: /adicionar dados ao json/i })).toBeVisible()
      await expect(page.getByRole('button', { name: 'string' }).first()).not.toBeVisible()
    })

    test('5.3 mobile toolbar shows icon-only buttons', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('button', { name: 'Editar JSON' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Copiar', exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Copiar minificado' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Baixar' })).toBeVisible()
    })

    test('5.4 add field via mobile form', async ({ page }) => {
      await page.goto('/')
      await seedJson(page, '{}')

      await page.getByRole('combobox', { name: 'Inserir em' }).click()
      await page.getByRole('option', { name: /Inicio.*object/ }).click()

      await page.getByRole('combobox', { name: 'Tipo' }).last().click()
      await page.getByRole('option', { name: 'Texto' }).click()

      await page.getByPlaceholder('nome do campo').fill('greeting')
      await page.getByLabel('Valor').fill('hello')

      await page.getByRole('button', { name: 'Adicionar' }).click()

      await expect(page.locator(jsonPanel())).toContainText('"greeting"')
      await expect(page.locator(jsonPanel())).toContainText('"hello"')
    })
  })
})
