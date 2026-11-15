import { describe, expect, it } from "vitest";
import { testSql } from "../../setup/integration-db";

/**
 * public.is_sunner_email: the single domain predicate behind the before_user_created hook and
 * the auth.users trigger (BR-001). Called directly, so every edge case hits the SQL itself.
 */
const isSunnerEmail = async (email: string | null) =>
  (await testSql<{ ok: boolean }[]>`select public.is_sunner_email(${email}::text) as ok`)[0].ok;

describe("public.is_sunner_email", () => {
  it.each([
    ["a plain address", "an.nguyen@sun-asterisk.com"],
    ["an upper-case address", "An.Nguyen@SUN-ASTERISK.COM"],
    ["a plus-tagged local part", "an+saa@sun-asterisk.com"],
  ])("accepts %s", async (_label, email) => {
    expect(await isSunnerEmail(email)).toBe(true);
  });

  it.each([
    ["NULL", null],
    ["an empty string", ""],
    ["a trailing dot", "an@sun-asterisk.com."],
    ["a leading space", " an@sun-asterisk.com"],
    ["a trailing space", "an@sun-asterisk.com "],
    ["a space in the local part", "an nguyen@sun-asterisk.com"],
    ["a tab", "an\t@sun-asterisk.com"],
    ["a trailing newline", "an@sun-asterisk.com\n"],
    ["an empty local part", "@sun-asterisk.com"],
    ["a second @", "an@evil.io@sun-asterisk.com"],
    ["a sub-domain", "an@mail.sun-asterisk.com"],
    ["a suffix look-alike", "an@sun-asterisk.com.evil.io"],
    ["a prefix look-alike", "an@evilsun-asterisk.com"],
    ["a letter look-alike", "an@sun-asterlsk.com"],
    ["a dot instead of the hyphen", "an@sun.asterisk.com"],
    ["a KELVIN SIGN (U+212A) that lower() would fold to k", "an@sun-asterisK.com"],
    ["a Cyrillic а (U+0430)", "an@sun-аsterisk.com"],
    ["a dotless I (U+0130) in the domain", "an@sun-asterİsk.com"],
  ])("rejects %s", async (_label, email) => {
    expect(await isSunnerEmail(email)).toBe(false);
  });
});
