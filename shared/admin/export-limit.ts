import "server-only";
import { env } from "@/shared/config/env";

/** Raised when an admin export would exceed `EXPORT_MAX_ROWS`; map it to a 4xx + message. */
export class ExportLimitExceededError extends Error {
  constructor(
    readonly count: number,
    readonly limit: number,
  ) {
    super(`Export has ${count} rows, above the limit of ${limit}. Narrow the filters.`);
    this.name = "ExportLimitExceededError";
  }
}

/** Call with the filtered row count before streaming an admin CSV export. */
export function assertWithinExportLimit(count: number): void {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError(`Export row count must be a non-negative integer, received ${count}`);
  }
  if (count > env.EXPORT_MAX_ROWS) {
    throw new ExportLimitExceededError(count, env.EXPORT_MAX_ROWS);
  }
}
