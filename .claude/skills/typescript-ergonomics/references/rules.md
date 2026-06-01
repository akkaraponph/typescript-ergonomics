# TypeScript Ergonomics — Full Ruleset

The complete reference behind the `typescript-ergonomics` skill. Each rule states
the intent, then shows the ergonomic form (✅) versus the form to avoid (❌).

> Read this when a rule's *why* matters — during reviews, larger refactors, or
> when deciding between two valid-looking designs.

---

## 1. Language & general

- Use TypeScript for all source (no plain JavaScript).
- Target modern runtimes; ES2022+ language features are allowed.
- Favor small, pure functions and explicit data flow over shared mutable state.

---

## 2. Types & safety

### Never use `any`; prefer `unknown` + narrowing

`any` switches off the type checker for everything it touches and silently
spreads. `unknown` keeps values opaque until you prove their shape.

```ts
// ❌ any — no safety, errors surface at runtime
function parse(json: string): any {
  return JSON.parse(json);
}

// ✅ unknown — caller must narrow before use
function parse(json: string): unknown {
  return JSON.parse(json);
}

function asUser(value: unknown): User | null {
  if (
    typeof value === "object" && value !== null &&
    "id" in value && "email" in value
  ) {
    return value as User;
  }
  return null;
}
```

If `any` is genuinely unavoidable (e.g. an untyped third-party lib), isolate it
to a single line and explain why:

```ts
// reason: `legacy-sdk` ships no types; shape verified against vendor docs.
const client = (legacySdk as any).connect();
```

### Model states with discriminated unions

Booleans and optional fields let callers construct impossible combinations.
A tagged union makes illegal states unrepresentable and forces exhaustive
handling.

```ts
// ❌ impossible states are representable: isLoading && error && data?
interface State {
  isLoading: boolean;
  error?: string;
  data?: User;
}

// ✅ exactly one shape is valid at a time
type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: User };
```

Handle them exhaustively so adding a new variant becomes a compile error:

```ts
function render(state: State): string {
  switch (state.status) {
    case "loading": return "…";
    case "error":   return state.message;
    case "ready":   return state.data.name;
    default: {
      const _exhaustive: never = state; // compile error if a case is missing
      return _exhaustive;
    }
  }
}
```

### Prefer literal unions / `as const` over numeric enums

```ts
// ❌ numeric enum: opaque values, reverse-mapping cruft, not tree-shakeable
enum Role { Admin, Editor, Viewer }

// ✅ string-literal union: transparent, JSON-friendly, narrowable
type Role = "admin" | "editor" | "viewer";

// ✅ when you need values + the union, derive both from one `as const`
const ROLES = ["admin", "editor", "viewer"] as const;
type Role = (typeof ROLES)[number];
```

### Other safety defaults

- Keep `strict` on. Lean on `noUncheckedIndexedAccess` — array/record access
  yields `T | undefined`, which catches a whole class of bugs.
- Avoid non-null assertions (`!`) and type assertions (`as`) unless you can
  justify them; they are escape hatches that defeat the checker.

---

## 3. Interfaces, types, and generics

- **`interface`** for object shapes and public contracts (declaration merging,
  better error messages, clearer intent).
- **`type`** for unions, intersections, tuples, and mapped/conditional types.
- Keep generics shallow. Avoid deeply nested conditional types unless there is
  no simpler option — they are write-only code.
- Name type parameters meaningfully (`Input`, `Output`, `Item`); single letters
  (`T`, `U`) only when the role is obvious.

```ts
// ✅ readable contract
interface PageRequest {
  cursor: string | null;
  limit: number;
}

// ✅ meaningful generic name
function first<Item>(items: readonly Item[]): Item | undefined {
  return items[0];
}
```

---

## 4. Functions & modules

### Explicit return types on exports

```ts
// ❌ exported, inferred — return shape can drift silently
export function loadConfig() { /* ... */ }

// ✅ explicit — the signature is the contract
export function loadConfig(): Config { /* ... */ }
```

### Object parameters over long / ambiguous arg lists

Adjacent same-type params are easy to transpose; long lists are unreadable at
the call site.

```ts
// ❌ which boolean is which?
function createUser(name: string, email: string, admin: boolean, active: boolean) {}
createUser("Ada", "ada@x.com", true, false);

// ✅ self-documenting at the call site
interface CreateUserInput {
  name: string;
  email: string;
  isAdmin: boolean;
  isActive: boolean;
}
function createUser(input: CreateUserInput): User { /* ... */ }
createUser({ name: "Ada", email: "ada@x.com", isAdmin: true, isActive: false });
```

### Prefer narrowing over overloads; early returns over nesting

```ts
// ✅ early returns keep the happy path flat
function discount(order: Order): number {
  if (order.items.length === 0) return 0;
  if (!order.coupon) return 0;
  return computeDiscount(order);
}
```

---

## 5. Error handling

Prefer typed result/error shapes over throwing in core domain logic. Throwing
hides failure from the type system; a returned union makes every caller account
for the error case.

```ts
// ✅ a tagged Result the caller cannot ignore
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

type ParseError = { code: "empty" } | { code: "invalid"; detail: string };

function parseAmount(raw: string): Result<number, ParseError> {
  if (raw.trim() === "") return { ok: false, error: { code: "empty" } };
  const n = Number(raw);
  if (Number.isNaN(n)) {
    return { ok: false, error: { code: "invalid", detail: raw } };
  }
  return { ok: true, value: n };
}
```

Reserve `throw` for genuinely exceptional conditions and programmer errors
(invariants that should never occur). Use domain-specific error types or tagged
unions rather than throwing bare strings or generic `Error`s.

---

## 6. Code style

- `camelCase` for variables and functions; `PascalCase` for types, interfaces,
  and components; `^_` prefix for intentionally unused bindings.
- Keep files focused — prefer many small files to a few large ones.
- Avoid functions or components over ~100 lines without strong justification.

---

## 7. Testing & ergonomics

- For new public APIs, default to writing at least one example test in
  TypeScript; confirm scope with the user if it's non-trivial.
- When refactoring, document **how** the types became simpler, safer, or more
  ergonomic — not just what changed.
