import { resolveEmailAssetUrl } from "./asset-url";

const webFonts = [
  { family: "Urbanist", file: "urbanist", weights: "100 900" },
  { family: "Sofia Sans", file: "sofia-sans", weights: "1 1000" },
  { family: "Montserrat", file: "montserrat", weights: "100 900" },
] as const;

export const TEXT_FONT_FAMILIES = [
  "Arial, sans-serif",
  "Helvetica, Arial, sans-serif",
  ...webFonts.map(({ family }) => `${family}, Arial, sans-serif`),
  "Verdana, sans-serif",
  "Tahoma, sans-serif",
  "Times New Roman, serif",
  "Courier New, monospace",
];

export function getEmailFontFaceCss(assetBase?: string, html?: string): string {
  return webFonts
    .filter(({ family }) => html === undefined || html.includes(family))
    .flatMap(({ family, file, weights }) => ["normal", "italic"].map(style => {
      const path = `/email-fonts/${file}-${style}.woff2`;
      const url = assetBase ? resolveEmailAssetUrl(path, assetBase) : path;
      return `@font-face{font-family:"${family}";src:url("${url}") format("woff2");font-style:${style};font-weight:${weights};font-display:swap;}`;
    }))
    .join("\n");
}
