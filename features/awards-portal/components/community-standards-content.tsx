import { getTranslations } from "next-intl/server";
import { divider } from "./portal-styles";

/** A message array (BTC can add or drop list items in JSON); anything else renders nothing. */
const textList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const displayTitle = "text-headline-large font-bold text-primary md:text-display-medium";
const goldLine = "text-title-medium font-bold text-primary";
const whiteLine = "text-title-medium font-bold text-text";
const listItem = "text-title-medium font-bold leading-7.5 text-text";

/**
 * Tiêu chuẩn cộng đồng (Figma 1161:8944): p16, gap 32. Title (Bold 45/52 gold), gold lead,
 * the spam rule intro and the 1–10 list (Bold 16/30), a divider, then "Tiêu chuẩn bảo mật"
 * with its bullets and the gold contact line. Static copy from messages (FR-321, FR-603).
 * List items are read with `t.raw` so characters like "<" stay literal text.
 */
export async function CommunityStandardsContent() {
  const t = await getTranslations("awardsPortal.standards");
  return (
    <div className="flex flex-col gap-8 p-4">
      <h1 className={displayTitle}>{t("title")}</h1>
      <div className="flex flex-col gap-6">
        <div>
          <p className={goldLine}>{t("lead")}</p>
          <p className={whiteLine}>{t("intro")}</p>
        </div>
        <ol className="list-decimal pl-8">
          {textList(t.raw("violations")).map((rule) => (
            <li key={rule} className={listItem}>
              {rule}
            </li>
          ))}
        </ol>
      </div>
      <div className={divider} />
      <section aria-labelledby="security-standards-heading" className="flex flex-col gap-6">
        <h2 id="security-standards-heading" className={displayTitle}>
          {t("securityTitle")}
        </h2>
        <div className="flex flex-col gap-2">
          <p className={whiteLine}>{t("securityIntro")}</p>
          <ul className="list-disc pl-6">
            {textList(t.raw("securityItems")).map((item) => (
              <li key={item} className={listItem}>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className={goldLine}>{t("contact")}</p>
      </section>
    </div>
  );
}
