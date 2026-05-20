# JSON Visual Editor

[![PR Checks](https://github.com/GleisonOliveira/json-visual-editor/actions/workflows/pr.yml/badge.svg)](https://github.com/GleisonOliveira/json-visual-editor/actions/workflows/pr.yml)
[![Deploy](https://github.com/GleisonOliveira/json-visual-editor/actions/workflows/deploy.yml/badge.svg)](https://github.com/GleisonOliveira/json-visual-editor/actions/workflows/deploy.yml)

Editor visual de JSON com interface drag-and-drop. Permite visualizar, editar e navegar em estruturas JSON de forma gráfica, com painel de código sincronizado em tempo real.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | React 19 |
| Linguagem | TypeScript 6 |
| Build | Vite 8 |
| UI | MUI (Material UI) v9 + Emotion |
| Estado global | Zustand |
| Editor de código | CodeMirror 6 |
| Validação de schema | AJV + Zod |
| Lint | ESLint 10 + typescript-eslint |

## Comandos

```bash
# Desenvolvimento
npm run dev           # Inicia servidor de desenvolvimento com HMR

# Qualidade de código
npm run typecheck     # Verifica tipagem TypeScript sem gerar arquivos
npm run lint:check    # Verifica lint sem alterar arquivos (falha em warnings)
npm run check         # Roda typecheck + lint:check em sequência

# Build
npm run build         # Executa check completo e gera build de produção
npm run preview       # Serve o build de produção localmente
```

> `npm run build` falha se houver erros de tipagem ou lint.
