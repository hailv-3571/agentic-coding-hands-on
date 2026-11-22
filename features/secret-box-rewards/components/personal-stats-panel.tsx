import Image from "next/image";
import type { ReactNode } from "react";
import { useFormatter, useTranslations } from "next-intl";
import type { PersonalRewardStatsView } from "../schemas/secret-box-views";
import { RewardsStatusMessage } from "./rewards-status-message";
import { SecretBoxLauncher } from "./secret-box-launcher";
import { rewardsPanel, statLabel, statValue } from "./secret-box-styles";

function StatRow({ label, value, extra, className = "" }: { label: string; value: string; extra?: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <dt className={`flex items-center gap-1 ${statLabel}`}>
        {label}
        {extra}
      </dt>
      <dd className={statValue}>{value}</dd>
    </div>
  );
}

/** "x2" over the mirrored flame (34×40), shown only while a heart campaign runs (FR-202). */
function DoubleHeartsBadge({ label, text }: { label: string; text: string }) {
  return (
    <span role="img" aria-label={label} className="relative inline-flex h-10 w-8.5 shrink-0">
      <Image src="/images/secret-box/x2-flame.webp" alt="" fill sizes="34px" className="-scale-x-100 object-fill" />
      <span aria-hidden className="absolute inset-x-0 bottom-0 text-center text-[17.5px]/[23.4px] font-bold text-text">
        {text}
      </span>
    </span>
  );
}

/**
 * Personal reward stats (CAP-04; Figma 2940:13489): five rows — Kudos received, sent, hearts
 * received (weighted, x2 flame while a campaign is active), a divider, boxes opened and
 * unopened — then "Mở Secret Box" (dimmed with a tooltip at 0, DEC-001). Reused on the own profile
 * (phase 12). `stats = null` (query failed) → the panel's error with retry; the deep link still
 * opens the modal. Server/client neutral; the launcher reads `useSearchParams`, so with
 * `cacheComponents` a host renders this under a `<Suspense>` (the Live board's request-time part is).
 */
export function PersonalStatsPanel({ stats }: { stats: PersonalRewardStatsView | null }) {
  const t = useTranslations("secretBox");
  const format = useFormatter();
  const number = (value: number) => format.number(value);

  return (
    <section aria-label={t("stats.label")} className={`${rewardsPanel} p-6`}>
      {stats ? (
        <div className="flex flex-col gap-4">
          <dl className="flex flex-col gap-4">
            <StatRow label={t("stats.kudosReceived")} value={number(stats.kudosReceived)} />
            <StatRow label={t("stats.kudosSent")} value={number(stats.kudosSent)} />
            <StatRow
              label={t("stats.heartsReceived")}
              value={number(stats.heartsReceived)}
              extra={stats.campaignActive && <DoubleHeartsBadge label={t("stats.x2Label")} text={t("stats.x2")} />}
            />
            <StatRow label={t("stats.boxesOpened")} value={number(stats.boxesOpened)} className="border-t border-divider pt-4" />
            <StatRow label={t("stats.boxesUnopened")} value={number(stats.boxesUnopened)} />
          </dl>
          <SecretBoxLauncher unopened={stats.boxesUnopened} />
        </div>
      ) : (
        <>
          <RewardsStatusMessage kind="error" message={t("stats.loadFailed")} />
          <SecretBoxLauncher unopened={null} />
        </>
      )}
    </section>
  );
}
