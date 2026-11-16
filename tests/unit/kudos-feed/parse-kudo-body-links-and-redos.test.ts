import { describe, expect, it } from "vitest";
import { parseKudoBody } from "@/features/kudos-feed/markdown/parse-kudo-body";
import { ALLOWED_TYPES, hrefs, link, nodeTypes, paragraph, text } from "./kudo-body-ast-test-helpers";

/**
 * Whitelist parser, links (phase-04-backend-contracts § 1.1): only inline `[text](http(s)://…)`
 * and bare http(s) autolinks, each href re-validated with `new URL()`; reference links, entity
 * tricks and `![img](…)` never produce a link to a bad scheme or an image. Plus the ReDoS budget.
 */
describe("parseKudoBody — links", () => {
  it("parses an inline http(s) link with formatted text and normalizes the href", () => {
    expect(parseKudoBody("Xem [**SAA** 2025](https://saa.sun-asterisk.com/awards?x=1#top) nhé")).toEqual([
      paragraph(
        text("Xem "),
        link("https://saa.sun-asterisk.com/awards?x=1#top", { type: "strong", children: [text("SAA")] }, text(" 2025")),
        text(" nhé"),
      ),
    ]);
    expect(hrefs(parseKudoBody("[x](HTTP://Example.COM/a%20b)"))).toEqual(["http://example.com/a%20b"]);
    // A space ends the destination: no inline link; the bare URL inside is still autolinked.
    expect(parseKudoBody("[x](https://a.b/c d)")).toEqual([
      paragraph(text("[x]("), link("https://a.b/c", text("https://a.b/c")), text(" d)")),
    ]);
  });

  it("accepts what the composer writes: escaped brackets in the label, encoded parens, a spaced title", () => {
    expect(parseKudoBody("[a\\]b](https://a.b/x%28y%29)")).toEqual([paragraph(link("https://a.b/x%28y%29", text("a]b")))]);
    // An escaped `)` stays in the destination instead of closing it.
    expect(parseKudoBody(String.raw`[a](http://a.b/x\)y) tiếp`)).toEqual([
      paragraph(link("http://a.b/x)y", text("a")), text(" tiếp")),
    ]);
    expect(hrefs(parseKudoBody('[x]( http://example.com "tiêu đề" )'))).toEqual(["http://example.com/"]);
    expect(hrefs(parseKudoBody("[w](https://en.wikipedia.org/wiki/Foo_(bar))"))).toEqual([
      "https://en.wikipedia.org/wiki/Foo_(bar)",
    ]);
  });

  it.each([
    ["javascript:", "[bấm](javascript:alert(1))"],
    ["upper-case JAVASCRIPT:", "[bấm](JAVASCRIPT:alert(1))"],
    ["tab inside the scheme", "[bấm](java\tscript:alert(1))"],
    ["data:", "[bấm](data:text/html,<script>alert(1)</script>)"],
    ["vbscript:", "[bấm](vbscript:msgbox(1))"],
    ["protocol-relative", "[bấm](//evil.example)"],
    ["relative path", "[bấm](/admin)"],
    ["entity-encoded scheme", "[bấm](java&#115;cript:alert(1))"],
    ["angle-bracket destination", "[bấm](<javascript:alert(1)>)"],
    ["http scheme without host", "[bấm](https://)"],
  ])("rejects a %s href (no link node at all)", (_label, body) => {
    const nodes = parseKudoBody(body);
    expect(hrefs(nodes)).toEqual([]);
    expect(nodeTypes(nodes).has("link")).toBe(false);
  });

  it("renders a reference link plus an entity-encoded definition as text", () => {
    const nodes = parseKudoBody("[x][1]\n\n[1]: java&#115;cript:alert(1)");
    expect(nodes).toEqual([paragraph(text("[x][1]")), paragraph(text("[1]: java&#115;cript:alert(1)"))]);
  });

  it("keeps Markdown image syntax literal: no image node, no link, not even the bare URL inside", () => {
    const body = "![x](https://a.b/c.png) và ![y](javascript:alert(1))";
    const nodes = parseKudoBody(body);
    expect(nodeTypes(nodes).has("link")).toBe(false);
    expect(nodes).toEqual([paragraph(text(body))]);
    // An escaped `!` is plain text, so an ordinary link follows; `\\` escapes the backslash only.
    expect(parseKudoBody("\\![x](https://a.b/c.png)")).toEqual([paragraph(text("!"), link("https://a.b/c.png", text("x")))]);
    expect(parseKudoBody("\\\\![x](https://a.b/c.png)")).toEqual([paragraph(text("\\![x](https://a.b/c.png)"))]);
  });

  it("rejects URLs that carry credentials (userinfo can spoof the host)", () => {
    for (const body of ["[b](http://user:pw@host)", "http://user:pw@host", "https://user@host.example/x"]) {
      expect(nodeTypes(parseKudoBody(body)).has("link"), body).toBe(false);
    }
    // `\@` decodes to `@`: the label would point at evil.com with `EXAMPLE.com` as the username.
    const hosts = hrefs(parseKudoBody("[b](http://EXAMPLE.com\\@evil.com)")).map((href) => new URL(href));
    expect(hosts.map((url) => url.hostname)).not.toContain("evil.com");
    expect(hosts.every((url) => !url.username && !url.password)).toBe(true);
  });

  it("never nests a link inside a link", () => {
    const nodes = parseKudoBody("[a [b](https://x.y) https://z.w](https://outer.example)");
    expect(hrefs(nodes)).toEqual(["https://outer.example/"]);
  });

  it("autolinks bare http(s) URLs, trimming trailing punctuation and unbalanced parens", () => {
    expect(parseKudoBody("Xem https://a.b/c_d_e. Và (https://x.y/z), **https://k.l**")).toEqual([
      paragraph(
        text("Xem "),
        link("https://a.b/c_d_e", text("https://a.b/c_d_e")),
        text(". Và ("),
        link("https://x.y/z", text("https://x.y/z")),
        text("), "),
        { type: "strong", children: [link("https://k.l/", text("https://k.l"))] },
      ),
    ]);
  });

  it("does not autolink other schemes, mid-word URLs or bare javascript:", () => {
    const nodes = parseKudoBody("ftp://a.b javascript:alert(1) xhttps://a.b file:///etc/passwd");
    expect(hrefs(nodes)).toEqual([]);
  });
});

describe("parseKudoBody — adversarial input (no ReDoS)", () => {
  const adversarial: [string, string][] = [
    ["bold markers", "**".repeat(500)],
    ["alternating markers", "**_~~".repeat(200)],
    ["open brackets", "[".repeat(1000)],
    ["unterminated links", "[a](".repeat(250)],
    ["bracket soup", "[]()".repeat(250)],
    ["escaped soup", "\\[\\*".repeat(250)],
    ["long autolink", `https://${"a".repeat(992)}`],
    ["many autolinks", " https://a".repeat(100)],
    ["nested quotes", "> ".repeat(500)],
    ["many list lines", "- a\n".repeat(250)],
    ["underscores", "_a".repeat(500)],
    ["mixed", "**[_~~https://x.y/(_)**]](".repeat(40).slice(0, 1000)],
  ];

  it.each(adversarial)("parses 1,000 characters of %s in under 50 ms", (_label, body) => {
    expect(body.length).toBeLessThanOrEqual(1000);
    parseKudoBody(body); // warm-up (JIT)
    const started = performance.now();
    const nodes = parseKudoBody(body);
    expect(performance.now() - started).toBeLessThan(50);
    expect([...nodeTypes(nodes)].every((type) => ALLOWED_TYPES.has(type))).toBe(true);
  });

  it("parses only the first 5,000 characters of an oversized body (write limit is 1,000)", () => {
    expect(parseKudoBody("a".repeat(6000))).toEqual([paragraph(text("a".repeat(5000)))]);
  });
});
