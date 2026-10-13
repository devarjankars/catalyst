interface OrserduReportLinkItem {
  linkText?: string;
  linkHref?: string;
  suffixText?: string;
}

export function normalizeOrserduReportLinkItem(item: OrserduReportLinkItem) {
  const linkText = item.linkText || "";
  const isMedwatchLink =
    item.linkHref?.toLowerCase().includes("medwatch") ||
    linkText.replace(/\.+$/, "").trim().toLowerCase() === "www.fda.gov/medwatch";

  if (!isMedwatchLink) {
    return { linkText, suffixText: item.suffixText || "" };
  }

  const normalizedLinkText = linkText.replace(/\.+$/, "");
  const existingSuffix = item.suffixText || "";
  const suffixText = existingSuffix.startsWith(".")
    ? existingSuffix
    : `.${existingSuffix}`;

  return { linkText: normalizedLinkText, suffixText };
}
