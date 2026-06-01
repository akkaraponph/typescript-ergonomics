# typescript-ergonomics

A reusable [Claude Code skill](https://docs.claude.com/en/docs/claude-code/skills)
that teaches Claude to write **safe, readable, ergonomic TypeScript** — and ships
the strict `tsconfig` and ESLint config that enforce the same rules mechanically.

When you (or Claude) create or edit `.ts`/`.tsx` files, the skill applies a
consistent set of conventions: no `any`, discriminated unions over booleans and
magic strings, explicit return types on exports, object params over long arg
lists, and `Result`-style error handling. The full rationale with ✅/❌ examples
lives in [`references/rules.md`](.claude/skills/typescript-ergonomics/references/rules.md).

## Example

The skill steers code away from loosely-typed, throw-based shapes toward
discriminated unions with explicit return types and no `any`:

```ts
// ❌ Before — `any`, impossible states, errors hidden from the type system
async function getUser(id): any {
  const user = await db.find(id);
  if (!user) throw "not found";
  return user;
}

// ✅ After — outcomes modeled as a union; callers must handle every case
interface User {
  id: string;
  email: string;
  name: string;
}

type GetUserResult =
  | { kind: "found"; user: User }
  | { kind: "not_found" }
  | { kind: "invalid_id"; reason: string };

export async function getUserById(id: string): Promise<GetUserResult> {
  if (!id) return { kind: "invalid_id", reason: "id must be non-empty" };

  const user = await db.find(id); // returns User | null
  if (!user) return { kind: "not_found" };

  return { kind: "found", user };
}
```

Consuming the result is exhaustive — adding a new `kind` becomes a compile error
until every caller handles it:

```ts
function describe(result: GetUserResult): string {
  switch (result.kind) {
    case "found":      return `Found ${result.user.name}`;
    case "not_found":  return "No such user";
    case "invalid_id": return `Bad request: ${result.reason}`;
    default: {
      const _exhaustive: never = result; // errors if a case is unhandled
      return _exhaustive;
    }
  }
}
```

Runnable versions live in
[`examples/getUser.ts`](.claude/skills/typescript-ergonomics/examples/getUser.ts)
and [`examples/result.ts`](.claude/skills/typescript-ergonomics/examples/result.ts).

## Layout

```
.claude/skills/typescript-ergonomics/
├─ SKILL.md                 # what Claude reads; core rules + self-check
├─ references/
│  └─ rules.md              # full ruleset with rationale and examples
├─ assets/
│  ├─ tsconfig.json         # strict, runtime-agnostic compiler config
│  └─ eslint.config.mjs     # ESLint v9 flat config (typescript-eslint)
└─ examples/
   ├─ getUser.ts            # discriminated-union result pattern
   └─ result.ts             # reusable Result<T, E> type + helpers
```

## Installing the skill

### With `npx skills` (recommended)

Once this repo is on GitHub, install the skill straight from it with the
[`skills`](https://github.com/vercel-labs/skills) CLI — no manual copying:

```bash
# into the current project's .claude/skills/
npx skills@latest add akkaraponph/typescript-ergonomics \
  --skill typescript-ergonomics --agent claude-code --yes
```

```bash
# globally, for all your projects (~/.claude/skills/)
npx skills@latest add akkaraponph/typescript-ergonomics \
  --skill typescript-ergonomics --agent claude-code --global --yes
```

The CLI discovers the skill under `.claude/skills/` in this repo; `--skill`
selects it by name, and `--agent claude-code` sets the install destination.
Manage installed skills with `npx skills@latest list` and
`npx skills@latest update --yes`.

### Manually (copy the folder)

```bash
# project-scoped
cp -R .claude/skills/typescript-ergonomics /path/to/project/.claude/skills/

# all your projects
cp -R .claude/skills/typescript-ergonomics ~/.claude/skills/
```

### In this repo

Claude Code auto-discovers skills under `.claude/skills/`, so it's already active
when you work here.

## Invoking it

Claude invokes the skill automatically based on its `description` whenever a task
involves writing or reviewing TypeScript — just ask for the work:

```text
> Add a function that looks up an order by id and returns its status.
> Refactor src/cart.ts to remove the `any`s.
> Review src/auth/ for ergonomic TypeScript issues.
```

To force it explicitly, name it: `use the typescript-ergonomics skill to …`.

## Using the configs in a project

Copy the assets into a TypeScript project and install the ESLint peers:

```bash
cp .claude/skills/typescript-ergonomics/assets/tsconfig.json     ./tsconfig.json
cp .claude/skills/typescript-ergonomics/assets/eslint.config.mjs ./eslint.config.mjs
npm i -D eslint @eslint/js typescript-eslint
```

`tsconfig.json` is runtime-agnostic; adjust `module` / `moduleResolution` / `lib`
for your runtime (Node, bundler, or browser) — see the comments in the file.

> **Note:** the ESLint config uses the modern **flat config** format
> (`eslint.config.mjs`), required by ESLint v9+. The legacy `.eslintrc.*` format
> is deprecated and not used here.
