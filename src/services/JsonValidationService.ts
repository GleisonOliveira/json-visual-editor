import { z } from 'zod'

/**
 * Validation logic for the JSON editor: form validation and JSON string parsing.
 * Extracted from AddFieldForm to be reusable and testable.
 */
export class JsonValidationService {
  /** Validates the AddFieldForm data. Returns `{ ok: true, data }` or `{ ok: false, nameError?, valueError? }`. */
  validateAddFieldForm(opts: {
    name: string
    type: string
    isNull: boolean
    valueText: string
    valueNumberText: string
    valueBoolean: boolean
    parentIsArray: boolean
  }): { ok: true; data: { name: string; type: string } } | { ok: false; nameError: string | null; valueError: string | null } {
    const schema = z
      .object({
        name: opts.parentIsArray
          ? z.string().trim().optional()
          : z.string().trim().min(1, 'Informe um nome.'),
        type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
        isNull: z.boolean(),
        valueText: z.string(),
        valueNumberText: z.string(),
        valueBoolean: z.boolean(),
      })
      .superRefine((data, ctx) => {
        if (data.isNull) return
        if (data.type === 'string' && data.valueText.trim().length === 0)
          ctx.addIssue({ code: 'custom', message: 'Informe um valor.' })
        if (data.type === 'number' && !Number.isFinite(Number(data.valueNumberText)))
          ctx.addIssue({ code: 'custom', message: 'Informe um numero valido.' })
      })

    const result = schema.safeParse({
      name: opts.name,
      type: opts.type,
      isNull: opts.isNull,
      valueText: opts.valueText,
      valueNumberText: opts.valueNumberText,
      valueBoolean: opts.valueBoolean,
    })

    if (!result.success) {
      const msg = result.error.issues[0]?.message ?? 'Dados invalidos.'
      if (msg === 'Informe um nome.') return { ok: false, nameError: msg, valueError: null }

      return { ok: false, nameError: null, valueError: msg }
    }

    return { ok: true, data: { name: result.data.name ?? '', type: result.data.type } }
  }

  /** Parses a JSON string and returns the result or an error message. */
  validateJsonString(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
    try {
      const value = JSON.parse(text) as unknown

      return { ok: true, value }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'JSON invalido' }
    }
  }
}
