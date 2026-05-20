# AGENTS.md — Guia para IAs

Contexto e convenções do projeto para agentes de IA assistindo no desenvolvimento.

## Sobre o projeto

Editor visual de JSON com interface drag-and-drop. O usuário pode editar JSON via painel de código (CodeMirror) ou via interface gráfica (nós arrastáveis), com sincronização bidirecional entre os dois painéis.

## Stack

- **React 19** + **TypeScript 6**
- **Vite 8** como bundler
- **MUI v9** (Material UI) + **Emotion** para UI
- **Zustand** para estado global
- **CodeMirror 6** para edição de código JSON
- **AJV** + **Zod** para validação
- **ESLint 10** + **typescript-eslint** para lint

## Estrutura de pastas

```
src/
├── components/          # Componentes React organizados em subpastas por domínio
│   ├── json-panel/
│   │   └── JsonPanel.tsx
│   ├── node-editor/
│   │   ├── NodeEditor.tsx
│   │   └── useNodeEditor.ts   # composable — lógica de estado interna
│   └── ...
├── hooks/               # Hooks genéricos e reutilizáveis
├── lib/                 # Utilitários puros (sem efeitos colaterais)
├── store/               # Stores Zustand
├── types/               # Tipos e interfaces TypeScript
├── assets/              # Imagens e recursos estáticos
├── App.tsx
├── main.tsx
└── theme.ts
```

## Convenções de componentes

### Organização em subpastas

Cada componente vive em sua própria subpasta dentro de `src/components/`. Componentes relacionados ficam agrupados na mesma subpasta.

```
src/components/
├── top-bar/
│   └── TopBar.tsx
├── visual-editor/
│   ├── VisualEditor.tsx
│   └── useVisualEditor.ts
└── node-editor/
    ├── NodeEditor.tsx
    └── useNodeEditor.ts
```

### Composables (hooks de estado interno)

Quando um componente contém lógica interna de estado não-trivial, essa lógica deve ser extraída para um composable — um hook criado no mesmo nível do componente, nomeado `use<ComponentName>.ts`.

```
visual-editor/
├── VisualEditor.tsx       # apenas JSX e wiring
└── useVisualEditor.ts     # useState, useEffect, handlers internos
```

O composable não é reutilizável globalmente — é exclusivo do componente. Se a lógica precisar ser compartilhada, vai para `src/hooks/`.

### Props e actions

Componentes devem **evitar ao máximo** receber props e callbacks como parâmetros. A abordagem preferida é consumir diretamente a store via Zustand.

- **Prefira**: `const { value, setValue } = useJsonStore()`
- **Evite**: `<Component value={x} onChange={fn} />`

Props são aceitáveis apenas quando:
- O componente é genuinamente genérico e reutilizável fora de contexto
- O valor vem de uma iteração local (ex: map de lista)
- A prop é de configuração visual (ex: `size`, `variant`)

Nunca passe actions da store como props — consuma a store diretamente no componente que precisa da action.

## Convenções de store

### Stores concisas

Cada store deve ter responsabilidade única e ser pequena. Não acumule actions não-relacionadas em uma única store.

### Divisão de actions em arquivos

Quando uma store começa a acumular muitas actions, divida-as em arquivos separados de actions, mantendo o estado centralizado:

```
store/
├── jsonStore.ts           # estado + seletores
├── jsonStore.actions.ts   # actions de mutação do JSON
├── jsonStore.io.ts        # actions de import/export
└── uiStore.ts             # estado de UI (painéis, modais, seleção)
```

Cada arquivo de actions importa e reutiliza o store criado em `jsonStore.ts` — não cria uma store nova.

### Separação por domínio

| Store | Responsabilidade |
|-------|-----------------|
| `jsonStore` | Árvore JSON, parsing, validação |
| `uiStore` | Estado de UI: painel ativo, nó selecionado, modais |

Nunca misture estado de domínio com estado de UI na mesma store.
