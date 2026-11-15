import { z } from "zod";

export type EnvSource = Record<string, string | undefined>;

/** Parse `source` with `schema`, or throw one readable error listing every problem. */
export function parseOrThrow<T extends z.ZodType>(schema: T, source: EnvSource): z.output<T> {
  const result = schema.safeParse(source);
  if (!result.success) {
    // prettifyError lists variable names and reasons; it never includes the rejected values.
    throw new Error(
      `Invalid environment configuration (see .env.example):\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}
