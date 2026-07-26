import type React from 'react'
import {
  Button,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useAddFieldForm } from './useAddFieldForm'

/**
 * Molecule: form for adding fields to the JSON tree (visible on mobile).
 * Provides target selector, type selector, name input, value input, null toggle,
 * and submit button. Validates before insertion.
 */
export function AddFieldForm(): React.JSX.Element {
  const {
    fieldName, fieldType,
    valueText, valueNumberText, valueBoolean, valueIsNull,
    setFieldName, setFieldType, setTargetLabel,
    setValueText, setValueNumberText, setValueBoolean, setValueIsNull,
    nameError, valueError,
    editingJson, targets, selectedTarget, onAdd,
  } = useAddFieldForm()

  return (
    <>
      <Typography variant="subtitle2" component="h2">Adicionar dados ao JSON</Typography>
      <Grid container spacing={1.25}>
        <Grid size={{ xs: 12, md: 'grow' }}>
          <FormControl size="small" fullWidth>
            <InputLabel id="target-label">Inserir em</InputLabel>
            <Select
              labelId="target-label"
              value={selectedTarget?.label ?? 'Início'}
              label="Inserir em"
              onChange={(e) => setTargetLabel(e.target.value)}
              disabled={targets.length === 0 || editingJson}
              sx={{ '& .MuiSelect-select': { textAlign: 'left' } }}
            >
              {targets.map((t) => (
                <MenuItem key={t.label} value={t.label}>{t.label} ({t.kind})</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 'grow' }}>
          <FormControl size="small" fullWidth>
            <InputLabel id="fieldType-label">Tipo</InputLabel>
            <Select
              labelId="fieldType-label"
              value={fieldType}
              label="Tipo"
              disabled={valueIsNull || editingJson}
              onChange={(e) => {
                const nextType = e.target.value as import('../../../types').FieldType
                setFieldType(nextType)
                setValueIsNull(false)

                if (nextType === 'string') { setValueText('item'); setValueIsNull(false) }

                if (nextType === 'boolean') setValueBoolean(false)
                if (nextType === 'number') setValueNumberText('0')

                if (nextType === 'object' || nextType === 'array') {
                  setValueText('item'); setValueNumberText('0'); setValueBoolean(false)
                }
              }}
              sx={{ '& .MuiSelect-select': { textAlign: 'left' } }}
            >
              <MenuItem value="string">Texto</MenuItem>
              <MenuItem value="number">Número</MenuItem>
              <MenuItem value="boolean">Boolean</MenuItem>
              <MenuItem value="object">Objeto</MenuItem>
              <MenuItem value="array">Array</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 'grow' }}>
          <TextField
            label="Nome do campo"
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            placeholder="nome do campo"
            variant="outlined"
            size="small"
            fullWidth
            disabled={selectedTarget?.kind === 'array' || editingJson}
            helperText={selectedTarget?.kind === 'array' ? 'Pai é um array' : (nameError ?? ' ')}
            error={!!nameError}
            autoComplete="off"
          />
        </Grid>

        {fieldType === 'string' && (
          <Grid size={{ xs: 12, md: 'grow' }}>
            <TextField label="Valor" value={valueText} onChange={(e) => setValueText(e.target.value)} size="small" variant="outlined" fullWidth disabled={valueIsNull || editingJson} error={!!valueError} helperText={valueError ?? ' '} autoComplete="off" />
          </Grid>
        )}

        {fieldType === 'number' && (
          <Grid size={{ xs: 12, md: 'grow' }}>
            <TextField label="Valor" value={valueNumberText} onChange={(e) => setValueNumberText(e.target.value)} size="small" variant="outlined" fullWidth disabled={valueIsNull || editingJson} inputMode="decimal" error={!!valueError} helperText={valueError ?? ' '} autoComplete="off" />
          </Grid>
        )}

        {fieldType === 'boolean' && (
          <Grid size={{ xs: 12, md: 'grow' }}>
            <FormControl size="small" fullWidth disabled={valueIsNull || editingJson}>
              <InputLabel id="bool-label">Valor</InputLabel>
              <Select labelId="bool-label" value={String(valueBoolean)} label="Valor" onChange={(e) => setValueBoolean(e.target.value === 'true')} sx={{ '& .MuiSelect-select': { textAlign: 'left' } }}>
                <MenuItem value="true">true</MenuItem>
                <MenuItem value="false">false</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}

        <Grid size={{ xs: 12, md: 'grow' }}>
          <Grid>
            <Switch checked={valueIsNull} onChange={(e) => setValueIsNull(e.target.checked)} disabled={editingJson} slotProps={{ input: { 'aria-label': 'Nulo' } }} />
            <Typography component="span" variant="body2">Nulo</Typography>
          </Grid>
        </Grid>
      </Grid>

      <Grid container spacing={1.25} sx={{ justifyContent: 'flex-end' }}>
        <Grid size={{ xs: 12, md: 'auto' }}>
          <Button variant="outlined" onClick={onAdd} disabled={!selectedTarget || editingJson}>
            Adicionar
          </Button>
        </Grid>
      </Grid>

      <Divider sx={{ mt: 3 }} />
    </>
  )
}
