import { describe, expect, it } from "vitest";
import { serializeCsv } from "@/shared/admin/csv-serializer";

const BOM = "\uFEFF";

describe("serializeCsv", () => {
  it("starts with a UTF-8 BOM, keeps Vietnamese text and separates rows with CRLF", () => {
    const csv = serializeCsv(["Tên", "Phòng ban"], [["Nguyễn Văn Ánh", "CEVC1"]]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toBe(`${BOM}Tên,Phòng ban\r\nNguyễn Văn Ánh,CEVC1\r\n`);
  });

  it("quotes cells containing commas, quotes or line breaks (RFC 4180)", () => {
    const csv = serializeCsv(["a"], [['x,y'], ['say "hi"'], ["line1\nline2"]]);
    expect(csv).toBe(`${BOM}a\r\n"x,y"\r\n"say ""hi"""\r\n"line1\nline2"\r\n`);
  });

  it.each([
    ["=SUM(A1:A2)", "'=SUM(A1:A2)"],
    ["+1", "'+1"],
    ["-2+3", "'-2+3"],
    ["@cmd", "'@cmd"],
    ["\tlead", "'\tlead"],
  ])("neutralises formula-like text %j", (input, expected) => {
    expect(serializeCsv(["v"], [[input]])).toBe(`${BOM}v\r\n${expected}\r\n`);
  });

  it("quotes a guarded cell that also needs quoting", () => {
    expect(serializeCsv(["v"], [["=HYPERLINK(\"x\",\"y\")"]])).toBe(
      `${BOM}v\r\n"'=HYPERLINK(""x"",""y"")"\r\n`,
    );
  });

  it("guards a leading carriage return and quotes it", () => {
    expect(serializeCsv(["v"], [["\r=1"]])).toBe(`${BOM}v\r\n"'\r=1"\r\n`);
  });

  it("writes numbers and booleans verbatim (negative numbers are not text)", () => {
    expect(serializeCsv(["n", "b"], [[-5, true], [3.5, false]])).toBe(
      `${BOM}n,b\r\n-5,true\r\n3.5,false\r\n`,
    );
  });

  it("writes null and undefined as empty cells", () => {
    expect(serializeCsv(["a", "b", "c"], [[null, undefined, "x"]])).toBe(
      `${BOM}a,b,c\r\n,,x\r\n`,
    );
  });

  it("applies the same escaping to header cells", () => {
    expect(serializeCsv(["=evil", "ok"], [])).toBe(`${BOM}'=evil,ok\r\n`);
  });

  it("rejects rows whose width differs from the header", () => {
    expect(() => serializeCsv(["a", "b"], [["only-one"]])).toThrow(/row 1/i);
  });

  it("rejects non-finite numbers", () => {
    expect(() => serializeCsv(["n"], [[Number.NaN]])).toThrow(/finite/i);
  });
});
