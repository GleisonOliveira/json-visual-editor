# Contribuindo

## Pré-requisitos

- Node.js 22+
- npm 10+

## Setup

```bash
git clone git@github.com:GleisonOliveira/json-visual-editor.git
cd json-visual-editor
npm install
npm run dev
```

## Fluxo de trabalho

1. Crie uma branch a partir de `main`
2. Faça as alterações
3. Garanta que `npm run check` passa sem erros
4. Abra um Pull Request para `main`

```bash
git checkout -b feat/minha-feature
# ... alterações ...
npm run check
git push origin feat/minha-feature
```

## Convenção de branches

| Prefixo | Uso |
|---------|-----|
| `feat/` | Nova funcionalidade |
| `fix/` | Correção de bug |
| `refactor/` | Refatoração sem mudança de comportamento |
| `docs/` | Documentação |
| `chore/` | Tarefas de manutenção (deps, config) |

## Qualidade de código

A pipeline bloqueia merge se `npm run check` falhar. Rode localmente antes de abrir PR:

```bash
npm run typecheck   # Verifica tipagem TypeScript
npm run lint:check  # ESLint com zero warnings tolerados
npm run check       # Ambos em sequência
```

## Build

```bash
npm run build    # Executa check + build de produção
npm run preview  # Serve o build localmente
```

## Deploy

Automático via GitHub Actions ao mergear em `main`. O site é publicado em:
`https://gleisonoliveira.github.io/json-visual-editor/`
