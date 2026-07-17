import React, { startTransition, useState } from 'react'
import { TextField } from '@mui/material'

export function NumberField({ value, onChange }: { value: number; onChange: (n: number) => void }): React.JSX.Element {
  const [text, setText] = useState(String(value ?? 0))
  const prevValueRef = React.useRef(value)

  React.useLayoutEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value
      const cur = Number(text)
      const typing = text.endsWith('.') || text.endsWith('-')

      if (!typing && cur !== value) {
        startTransition(() => setText(String(value ?? 0)))
      }
    }
  }, [value, text])

  return (
    <TextField
      size="small"
      value={text}
      variant="outlined"
      inputMode="decimal"
      sx={{ flex: 1 }}
      onChange={(e) => setText(e.target.value)}
      onBlur={(e) => {
        const n = Number(e.target.value)

        if (Number.isFinite(n)) {
          onChange(n)
          setText(String(n))
        } else {
          onChange(0)
          setText('0')
        }
      }}
    />
  )
}
