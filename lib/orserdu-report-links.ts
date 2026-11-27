export const DEFAULT_ORSERDU_REPORT_LINK_COLOR = "#0563C1";

export const ORSERDU_MEDWATCH_URL = "https://www.fda.gov/medwatch";
export const ORSERDU_REPORT_PI_URL = "http://pi.orserduhcp.com/";

const previousDefaultLinks = new Map([
  ["https://www.fda.gov/safety/medwatch-fda-safety-information-and-adverse-event-reporting-program", ORSERDU_MEDWATCH_URL],
  ["https://rxmenarinistemline.com/ORSERDU_elacestrant_Full_Prescribing_Information.pdf", ORSERDU_REPORT_PI_URL],
]);

export function resolveOrserduReportLinkHref(href?: string): string {
  const value = href?.trim() || "";
  return previousDefaultLinks.get(value) ?? value;
}

interface OrserduReportLinkItem {
  linkText?: string;
  linkHref?: string;
  suffixText?: string;
}

export function normalizeOrserduReportLinkItem(item: OrserduReportLinkItem) {
  const linkHref = resolveOrserduReportLinkHref(item.linkHref);
  const linkText = item.linkText || "";
  const isMedwatchLink =
    linkHref.toLowerCase().includes("medwatch") ||
    linkText.replace(/\.+$/, "").trim().toLowerCase() === "www.fda.gov/medwatch";

  if (!isMedwatchLink) {
    return { linkHref, linkText, suffixText: item.suffixText || "" };
  }

  const normalizedLinkText = linkText.replace(/\.+$/, "");
  const existingSuffix = item.suffixText || "";
  const suffixText = existingSuffix.startsWith(".")
    ? existingSuffix
    : `.${existingSuffix}`;

  return { linkHref, linkText: normalizedLinkText, suffixText };
}
