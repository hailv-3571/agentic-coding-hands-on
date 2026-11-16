import { describe, expect, it } from "vitest";
import { KUDO_LIMITS, kudoTextLength } from "@/features/kudos-authoring/kudo-authoring-limits";
import {
  KudoInputSchema,
  KudoUpdateSchema,
  parseKudoInput,
} from "@/features/kudos-authoring/schemas/kudo-input-schema";

/** Shared create/update contract (FR-603: the server re-runs the same schema). */
const RECIPIENT = "0b6f1e5c-3c55-4d2a-9f53-2c1f4f7b9a10";
const TAGS = [
  "a3f1c2d4-1b2c-4d5e-8f60-718293a4b5c6",
  "b3f1c2d4-1b2c-4d5e-8f60-718293a4b5c6",
  "c3f1c2d4-1b2c-4d5e-8f60-718293a4b5c6",
  "d3f1c2d4-1b2c-4d5e-8f60-718293a4b5c6",
  "e3f1c2d4-1b2c-4d5e-8f60-718293a4b5c6",
  "f3f1c2d4-1b2c-4d5e-8f60-718293a4b5c6",
];
const imagePath = (n: number, ext = "jpg") => `kudos/1c0e6a7b-2d3f-4a5b-8c6d-7e8f9a0b1c${String(n).padStart(2, "0")}.${ext}`;
const valid = { recipientId: RECIPIENT, body: "Cảm ơn bạn!", hashtagIds: [TAGS[0]] };

const create = (input: unknown) => parseKudoInput(KudoInputSchema, input);
const update = (input: unknown) => parseKudoInput(KudoUpdateSchema, input);
const fieldErrorsOf = (result: ReturnType<typeof create>) => (result.ok ? {} : result.fieldErrors);

describe("limits", () => {
  it("match the decision log (hashtags 1–5, title 50, nickname 30, body 1000, images 5)", () => {
    expect(KUDO_LIMITS).toMatchObject({
      BODY_MAX: 1000,
      TITLE_MAX: 50,
      NICKNAME_MAX: 30,
      HASHTAGS_MIN: 1,
      HASHTAGS_MAX: 5,
      IMAGES_MAX: 5,
      IMAGE_MAX_BYTES: 5 * 1024 * 1024,
    });
  });

  it("counts characters as code points, like Postgres char_length", () => {
    expect(kudoTextLength("😀a")).toBe(2);
    expect(kudoTextLength("Đức")).toBe(3);
  });
});

describe("KudoInputSchema (create)", () => {
  it("normalizes a minimal valid kudo and fills defaults", () => {
    const result = create({ ...valid, body: "  dòng 1\r\ndòng 2  ", title: "   " });
    expect(result).toEqual({
      ok: true,
      data: {
        recipientId: RECIPIENT,
        title: null,
        body: "dòng 1\ndòng 2",
        hashtagIds: [TAGS[0]],
        imagePaths: [],
        isAnonymous: false,
        anonymousNickname: null,
      },
    });
  });

  it("never passes sender or status through from the client", () => {
    const result = create({ ...valid, senderId: RECIPIENT, status: "spam" });
    expect(result.ok && Object.keys(result.data)).not.toContain("senderId");
    expect(result.ok && Object.keys(result.data)).not.toContain("status");
  });

  it("answers DEC-001 (MISSING_REQUIRED) when recipient, body or hashtags are missing", () => {
    const result = create({ recipientId: "", body: "  \n ", hashtagIds: [] });
    expect(result).toEqual({
      ok: false,
      code: "MISSING_REQUIRED",
      fieldErrors: { recipientId: ["required"], body: ["required"], hashtagIds: ["required"] },
    });
    expect(create({})).toMatchObject({ ok: false, code: "MISSING_REQUIRED" });
  });

  it("accepts a 1,000-character body and rejects 1,001 (counted after trim, on code points)", () => {
    expect(create({ ...valid, body: `  ${"a".repeat(1000)}  ` }).ok).toBe(true);
    expect(create({ ...valid, body: "😀".repeat(1000) }).ok).toBe(true);
    const tooLong = create({ ...valid, body: "a".repeat(1001) });
    expect(tooLong).toMatchObject({ ok: false, code: "VALIDATION", fieldErrors: { body: ["bodyTooLong"] } });
    expect(fieldErrorsOf(create({ ...valid, body: "😀".repeat(1001) }))).toEqual({ body: ["bodyTooLong"] });
  });

  it("skips the link scan on an over-long body, so an oversized payload cannot stall the server", () => {
    // Unclosed `](` makes the destination scan quadratic; a Server Action body may be ~1 MB.
    expect(fieldErrorsOf(create({ ...valid, body: "](".repeat(20_000) }))).toEqual({ body: ["bodyTooLong"] });
  });

  it("keeps the title optional (blank → null) and caps it at 50 characters", () => {
    expect(create({ ...valid, title: " Người truyền lửa " })).toMatchObject({ ok: true, data: { title: "Người truyền lửa" } });
    expect(create({ ...valid, title: null })).toMatchObject({ ok: true, data: { title: null } });
    expect(create({ ...valid, title: "t".repeat(50) }).ok).toBe(true);
    expect(fieldErrorsOf(create({ ...valid, title: "t".repeat(51) }))).toEqual({ title: ["titleTooLong"] });
  });

  it("allows 1–5 unique hashtags", () => {
    expect(create({ ...valid, hashtagIds: TAGS.slice(0, 5) }).ok).toBe(true);
    expect(fieldErrorsOf(create({ ...valid, hashtagIds: TAGS }))).toEqual({ hashtagIds: ["hashtagsTooMany"] });
    expect(fieldErrorsOf(create({ ...valid, hashtagIds: [TAGS[0], TAGS[0]] }))).toEqual({
      hashtagIds: ["hashtagsDuplicate"],
    });
    expect(fieldErrorsOf(create({ ...valid, hashtagIds: ["not-a-uuid"] }))).toEqual({ hashtagIds: ["invalid"] });
  });

  it("allows up to 5 unique kudos/{uuid}.{ext} image paths, keeping their order", () => {
    const five = [imagePath(5, "png"), imagePath(1), imagePath(3, "webp"), imagePath(2), imagePath(4)];
    expect(create({ ...valid, imagePaths: five })).toMatchObject({ ok: true, data: { imagePaths: five } });
    const six = [...five, imagePath(6)];
    expect(fieldErrorsOf(create({ ...valid, imagePaths: six }))).toEqual({ imagePaths: ["imagesTooMany"] });
    expect(fieldErrorsOf(create({ ...valid, imagePaths: [imagePath(1), imagePath(1)] }))).toEqual({
      imagePaths: ["imagesDuplicate"],
    });
    for (const bad of [
      `kudos/${RECIPIENT}/${RECIPIENT}.jpg`,
      "kudos/../secret.jpg",
      imagePath(1, "gif"),
      imagePath(1).toUpperCase(),
    ]) {
      expect(fieldErrorsOf(create({ ...valid, imagePaths: [bad] }))).toEqual({ imagePaths: ["imagePathInvalid"] });
    }
  });

  it("requires a 1–30 character nickname exactly when anonymous", () => {
    expect(create({ ...valid, isAnonymous: true, anonymousNickname: "  Mèo Mun  " })).toMatchObject({
      ok: true,
      data: { isAnonymous: true, anonymousNickname: "Mèo Mun" },
    });
    expect(fieldErrorsOf(create({ ...valid, isAnonymous: true }))).toEqual({ anonymousNickname: ["nicknameRequired"] });
    expect(fieldErrorsOf(create({ ...valid, isAnonymous: true, anonymousNickname: "   " }))).toEqual({
      anonymousNickname: ["nicknameRequired"],
    });
    expect(create({ ...valid, isAnonymous: true, anonymousNickname: "n".repeat(30) }).ok).toBe(true);
    expect(fieldErrorsOf(create({ ...valid, isAnonymous: true, anonymousNickname: "n".repeat(31) }))).toEqual({
      anonymousNickname: ["nicknameTooLong"],
    });
    expect(fieldErrorsOf(create({ ...valid, isAnonymous: false, anonymousNickname: "Mèo" }))).toEqual({
      anonymousNickname: ["nicknameWithoutAnonymous"],
    });
    expect(create({ ...valid, isAnonymous: false, anonymousNickname: "" })).toMatchObject({
      ok: true,
      data: { anonymousNickname: null },
    });
  });

  it("reports every invalid field at once, DEC-001 winning the top-level code", () => {
    const result = create({ ...valid, body: "", isAnonymous: true, title: "t".repeat(51) });
    expect(result).toEqual({
      ok: false,
      code: "MISSING_REQUIRED",
      fieldErrors: { body: ["required"], title: ["titleTooLong"], anonymousNickname: ["nicknameRequired"] },
    });
  });

  it("rejects a non-http(s) Markdown link in the body", () => {
    expect(fieldErrorsOf(create({ ...valid, body: "[bấm](javascript:alert(1))" }))).toEqual({ body: ["linkScheme"] });
    expect(create({ ...valid, body: "Xem [SAA](https://saa.sun-asterisk.com) nhé" }).ok).toBe(true);
  });

  it("rejects Markdown image syntax in the body (Kudo images come only from imagePaths)", () => {
    expect(fieldErrorsOf(create({ ...valid, body: "Xem ![logo](https://a.vn/logo.png) nhé" }))).toEqual({ body: ["imageNotAllowed"] });
    expect(fieldErrorsOf(create({ ...valid, body: "![x](data:image/png;base64,AAAA)" }))).toEqual({
      body: ["linkScheme", "imageNotAllowed"],
    });
    expect(create({ ...valid, body: "Tuyệt! [SAA](https://saa.sun-asterisk.com)" }).ok).toBe(true);
  });
});

describe("KudoUpdateSchema", () => {
  it("accepts every editable field and no recipient", () => {
    expect(update({ body: valid.body, hashtagIds: valid.hashtagIds, title: "Danh hiệu mới" })).toMatchObject({ ok: true, data: { title: "Danh hiệu mới" } });
  });

  it("rejects an attempt to change the recipient", () => {
    expect(update(valid)).toEqual({ ok: false, code: "VALIDATION", fieldErrors: { recipientId: ["recipientImmutable"] } });
  });

  it("applies DEC-001 to body and hashtags", () => {
    expect(update({ body: "", hashtagIds: [] })).toEqual({
      ok: false,
      code: "MISSING_REQUIRED",
      fieldErrors: { body: ["required"], hashtagIds: ["required"] },
    });
  });
});
