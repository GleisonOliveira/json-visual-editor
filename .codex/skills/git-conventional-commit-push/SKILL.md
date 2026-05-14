---
name: git-conventional-commit-push
description: "Commit e push com segurança usando Conventional Commits. Use quando o usuário pedir para dar commit e push seguindo Conventional Commits e regras de branch: nunca commitar/push na main; sempre trabalhar em branch separada; se necessário, criar/checkout uma branch derivada do Conventional Commit antes de commitar."
---

## Workflow

1. Determine o Conventional Commit a partir do que o usuário pediu (tipo, optional scope e subject).
2. Garanta que você NÃO está na `main`.
3. Se não estiver na branch esperada, crie/checkout a branch esperada e então commite.
4. Faça `git add -A`.
5. Se não houver mudanças em staged, não comite.
6. Crie commit com mensagem `type(scope): subject` (ou `type: subject` se não houver scope).
7. Dê `git push -u origin <branch>`.

## Convenções

- Tipo (`--type`) e scope (`--scope`) devem seguir Conventional Commits.
- Branch esperada: `<type>/<scope-?> <subject-slug>` (sem espaços; subject em slug).
- Falhe se a branch esperada for `main`.

## Comandos (execução)

Use os comandos abaixo, na ordem, e com as verificações indicadas:

1. Identifique a branch atual: `git branch --show-current`
2. Identifique o nome da branch-alvo (derivada do Conventional Commit):
   - `<type>/...` (nunca `main`)
3. Se a branch atual for diferente da branch-alvo:
   - Se a branch existir localmente: `git checkout <branch-alvo>`
   - Se não existir: `git checkout -b <branch-alvo>`
4. Garanta que a branch-alvo é diferente de `main`. Se for `main`, pare sem fazer commit/push.
5. Adicione arquivos: `git add -A`
6. Verifique se há changes staged: se `git diff --cached --quiet` retornar “sem diff”, pare.
7. Commite: `git commit -m "<mensagem>"` (mensagem em Conventional Commits)
8. Faça push: `git push -u origin <branch-alvo>`

## Nunca Faça

- Nunca comite nem faça push na branch `main`.
- Nunca modifique arquivos/pastas dentro de `.git` diretamente (ex.: editar `.git/config`, criar/remover locks, mexer em `.git/index`). Sempre use comandos `git` no terminal para qualquer operação (checkout, add, commit, push, branch).
- Nunca comite/pushe segredos (ex.: `API_KEY`, `ACCESS_TOKEN`, `SECRET`, `.env`, chaves privadas, tokens em texto).
- Nunca inclua credenciais ou chaves de API em commit message, arquivos ou mudanças.
- Nunca faça push antes de confirmar que está na branch correta (branch-alvo) e que a branch-alvo não é `main`.

## Mensagem do Commit

- A mensagem do commit deve ser **sempre** gerada em **Conventional Commits**.
- Formato obrigatório: `type(scope): subject` (ou `type: subject` se não houver scope).
