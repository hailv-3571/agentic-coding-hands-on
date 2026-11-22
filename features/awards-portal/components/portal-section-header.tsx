import { divider, sectionCaption, sectionTitle } from "./portal-styles";

type PortalSectionHeaderProps = {
  caption: string;
  title: string;
  headingId?: string;
  /** The Awards page title is its `<h1>`; Homepage sections use `<h2>`. */
  as?: "h1" | "h2";
  centered?: boolean;
};

/**
 * "Sun* annual awards 2025" caption (Bold 24/32 white), 1 px #2E3940 divider, gold title
 * (Bold 57/64, smaller on phones): the Live board section header layout, gap 16.
 */
export function PortalSectionHeader({ caption, title, headingId, as: Heading = "h2", centered = false }: PortalSectionHeaderProps) {
  return (
    <div className={`flex flex-col gap-4 ${centered ? "text-center" : ""}`}>
      <p className={sectionCaption}>{caption}</p>
      <div className={divider} />
      <Heading id={headingId} className={sectionTitle}>
        {title}
      </Heading>
    </div>
  );
}
