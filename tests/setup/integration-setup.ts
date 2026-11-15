import { afterAll } from "vitest";
import { closeTestDb } from "./integration-db";

// One pool per test file (vitest isolates modules per file); close it so the run exits.
afterAll(async () => {
  await closeTestDb();
});
