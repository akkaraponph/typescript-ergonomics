---
name: typescript-ergonomics
description: >-
  Enforce ergonomic, type-safe TypeScript conventions when writing, reviewing,
  or refactoring TypeScript. Use whenever creating or editing .ts/.tsx files.
  Covers strict typing (no `any`, prefer `unknown` + narrowing), discriminated
  unions over booleans/magic strings, explicit return types on exports, object
  parameters over long arg lists, Result-style error handling, and naming /
  file-size conventions. Ships a drop-in strict tsconfig.json and an ESLint flat
  config that mechanically enforce the rules.
---

# Ergonomic TypeScript

Write TypeScript that is **safe** (the compiler catches mistakes), **readable**
(the types document intent), and **ergonomic** (easy to use correctly, hard to
use wrong). Apply these rules when authoring or editing any `.ts`/`.tsx` file.

## The core rules (apply on every edit)

1. **No `any`.** Use `unknown` and narrow explicitly. If `any` is truly
   unavoidable, isolate it to one line and add a `// reason:` comment.
2. **Model states with discriminated unions**, not booleans or magic strings.
   Make illegal states unrepresentable.
3. **Exported functions get explicit return types.** Inferred return types are
   fine for local/inline functions only.
4. **Object params over long arg lists.** Two or more parameters of the same
   type, or 3+ params, → a single named-field object.
5. **`unknown` + narrowing, never `any`**, for external/untyped data.
6. **`interface` for object shapes**; `type` for unions, intersections, mapped
   types. Prefer string-literal unions or `as const` objects over numeric enums.
7. **Result-style errors in domain logic.** Return a typed result/tagged union
   instead of throwing in core logic; reserve `throw` for truly exceptional or
   programmer-error cases.
8. **Early returns over deep nesting.** Keep functions under ~100 lines.
9. **Naming:** `camelCase` for values/functions, `PascalCase` for types and
   components, `^_` prefix for intentionally unused bindings.

## Self-check before finishing an edit

- [ ] No `any` (or isolated + commented).
- [ ] Each exported function has an explicit return type.
- [ ] States/outcomes use discriminated unions, exhaustively handled.
- [ ] No 3+-arg or same-type-adjacent param lists.
- [ ] Domain errors are typed values, not thrown strings.
- [ ] File and functions stay small and focused.

## When refactoring

Briefly explain in your summary **how the types got simpler or safer** — e.g.
"replaced `boolean isLoaded` + `data?` with a `{ status: 'loading' | 'ready' }`
union so callers can't read `data` before it exists."

## Bundled resources

- **`references/rules.md`** — the full ruleset with rationale and ✅/❌ examples.
  Read it when a rule's intent is unclear or when reviewing a larger change.
- **`assets/tsconfig.json`** — strict, runtime-agnostic compiler config. Copy
  into a project to enforce the type-safety rules mechanically.
- **`assets/eslint.config.mjs`** — ESLint v9 flat config (typescript-eslint)
  that enforces no-`any`, explicit return types, `interface` definitions,
  function-length limits, and unused-var conventions.
- **`examples/`** — canonical patterns: `getUser.ts` (discriminated-union
  result) and `result.ts` (reusable `Result` type + helpers).
