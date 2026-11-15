import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { accessTokenFor, createAnonClient, createAuthUser, deleteAuthUsers, uniqueEmail } from "./auth-test-users";

/**
 * SC-006 / FR-604 read as C-20: the public (anon) key — with or without a signed-in user's
 * token — cannot read or write `profiles` through the Supabase Data API.
 */
const createdUserIds: string[] = [];
let sunnerToken: string;

beforeAll(async () => {
  const email = uniqueEmail("rls-reader");
  const user = await createAuthUser(email, { full_name: "RLS Reader" });
  createdUserIds.push(user.id);
  sunnerToken = await accessTokenFor(email);
});

afterAll(() => deleteAuthUsers(createdUserIds));

function authenticatedClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${sunnerToken}` } },
  });
}

describe("profiles are server-only (C-20)", () => {
  it.each([
    ["anon key, no session", () => createAnonClient()],
    ["anon key + Sunner access token", () => authenticatedClient()],
  ])("returns no profile rows to %s", async (_label, makeClient) => {
    const { data, error } = await makeClient().from("profiles").select("id, email, role");
    // Revoked privileges answer "permission denied"; either way nothing is readable.
    expect(data ?? []).toEqual([]);
    if (error) expect(error.code).toBe("42501");
  });

  it("does not let a signed-in Sunner promote themselves to admin", async () => {
    const { data, error } = await authenticatedClient()
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", createdUserIds[0])
      .select("role");
    expect(data ?? []).toEqual([]);
    expect(error?.code).toBe("42501");
  });
});
