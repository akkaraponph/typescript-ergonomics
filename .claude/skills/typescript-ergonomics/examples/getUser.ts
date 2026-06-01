// Canonical ergonomic pattern: a small, pure-ish function whose outcomes are
// modeled as a discriminated union, with an explicit return type and no `any`.

interface User {
  id: string;
  email: string;
  name: string;
}

// Each outcome is a distinct, fully-specified shape — callers must handle all.
type GetUserResult =
  | { kind: "found"; user: User }
  | { kind: "not_found" }
  | { kind: "invalid_id"; reason: string };

export async function getUserById(id: string): Promise<GetUserResult> {
  if (!id) {
    return { kind: "invalid_id", reason: "id must be a non-empty string" };
  }

  // Imagine a DB call here returning `User | null`.
  const user: User | null = null;

  if (!user) {
    return { kind: "not_found" };
  }

  return { kind: "found", user };
}

// Consuming the result: the switch is exhaustive, so adding a new `kind`
// becomes a compile error here until it's handled.
export function describeUser(result: GetUserResult): string {
  switch (result.kind) {
    case "found":
      return `Found ${result.user.name}`;
    case "not_found":
      return "No such user";
    case "invalid_id":
      return `Bad request: ${result.reason}`;
    default: {
      const _exhaustive: never = result;
      return _exhaustive;
    }
  }
}
