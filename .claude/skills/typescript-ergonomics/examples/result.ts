// A reusable, runtime-agnostic Result type for typed error handling.
//
// Prefer returning a `Result` from core domain logic over throwing: failures
// become part of the function's type, so callers cannot forget to handle them.

export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/** Transform the success value, leaving errors untouched. */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result;
}

/** Extract the value or fall back — never throws. */
export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback;
}
