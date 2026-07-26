import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export const jsonPanel = (): string => '[aria-label="Visualização de JSON"]'

export const editorPanel = (): string => '[aria-label="Editor de JSON"]'

/**
 * Seeds the visual editor with JSON data by opening the editor, typing the JSON, validating, and waiting for the success toast to dismiss.
 */
export async function seedJson(
  page: Page,
  json: string,
): Promise<void> {
  await page.getByRole('button', { name: 'Editar JSON' }).click()
  const cm = page.locator(editorPanel())
  await expect(cm).toBeVisible()
  await cm.click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('Delete')
  await page.keyboard.type(json, { delay: 5 })
  await page.getByRole('button', { name: 'Validar' }).click()
  await expect(page.getByText('JSON válido aplicado com sucesso.')).toBeVisible()
  await expect(page.getByText('JSON válido aplicado com sucesso.')).not.toBeVisible({ timeout: 6000 })
}
