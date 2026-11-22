import { describe, expect, it } from "vitest";
import { attachmentFilename } from "@/features/admin-moderation/components/review-export-filename";

describe("attachmentFilename", () => {
  it("reads a quoted filename", () => {
    expect(attachmentFilename('attachment; filename="kudos-20261122-1610.csv"')).toBe("kudos-20261122-1610.csv");
  });

  it("prefers the RFC 5987 filename* form and decodes it", () => {
    expect(attachmentFilename("attachment; filename=\"a.csv\"; filename*=UTF-8''kud%E1%BB%93s.csv")).toBe("kudồs.csv");
  });

  it("reads an unquoted filename", () => {
    expect(attachmentFilename("attachment; filename=kudos.csv")).toBe("kudos.csv");
  });

  it("drops any path part so the download stays a plain file name", () => {
    expect(attachmentFilename('attachment; filename="../../etc/kudos.csv"')).toBe("kudos.csv");
  });

  it("is null without a usable name", () => {
    expect(attachmentFilename(null)).toBeNull();
    expect(attachmentFilename("attachment")).toBeNull();
    expect(attachmentFilename("attachment; filename*=UTF-8''%E0%A4%A")).toBeNull();
  });
});
