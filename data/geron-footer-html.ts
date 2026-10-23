export const GERON_RYTELO_LOGO_SRC = "/ryteloLogo.png";
export const GERON_LOGO_SRC = "/geronLogo.png";
export const GERON_RYTELO_LOGO_HREF = "https://www.rytelohcp.com/";
export const GERON_LOGO_HREF = "https://www.geron.com/";
export const GERON_FOOTER_COPYRIGHT =
  "© 2026 Geron Corp. All rights reserved. GERON, GERON logo, RYTELO and RYTELO logo are registered trademarks of Geron Corporation. All other trademarks are the property of their respective owners.";
export const GERON_FOOTER_JOB_CODE = "C-US-RYT-IM-0471 October 2026";

export const GERON_FOOTER_HTML = `<table class="geron-footer-table" role="presentation" width="100%" align="center" bgcolor="#173782" border="0" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;margin:0 auto;background-color:#173782;"><tbody><tr><td align="center" bgcolor="#173782" style="padding:20px 20px 31px;text-align:center;background-color:#173782;"><table role="presentation" width="100%" align="center" bgcolor="#173782" border="0" cellpadding="0" cellspacing="0" style="width:100%;margin:0 auto;background-color:#173782;"><tbody><tr><td class="deskDisp" align="center" bgcolor="#173782" style="text-align:center;background-color:#173782;"><table role="presentation" width="390" align="center" border="0" cellpadding="0" cellspacing="0" style="width:390px;margin:0 auto;"><tbody><tr><td align="right" valign="middle" style="width:50%;padding:0 29px 0 0;border-right:1.5px solid #fff;text-align:right;"><a target="_blank" href="${GERON_RYTELO_LOGO_HREF}" style="display:inline-block;"><img src="${GERON_RYTELO_LOGO_SRC}" alt="Rytelo Logo" width="165" border="0" style="display:block;width:165px;height:auto;margin:0 0 0 auto;"></a></td><td align="left" valign="middle" style="width:50%;padding:0 0 0 29px;text-align:left;"><a target="_blank" href="${GERON_LOGO_HREF}" style="display:inline-block;"><img src="${GERON_LOGO_SRC}" alt="Geron Logo" width="165" border="0" style="display:block;width:165px;height:auto;margin:0 auto 0 0;"></a></td></tr></tbody></table></td></tr><tr><td class="mbDisp" align="center" bgcolor="#173782" style="display:none;padding:0 0 17px;text-align:center;background-color:#173782;"><a target="_blank" href="${GERON_RYTELO_LOGO_HREF}" style="display:inline-block;"><img src="${GERON_RYTELO_LOGO_SRC}" alt="Rytelo Logo" width="165" border="0" style="display:block;width:165px;height:auto;margin:0 auto;"></a></td></tr><tr><td class="mbDisp" align="center" bgcolor="#173782" style="display:none;padding:0 0 28px;text-align:center;background-color:#173782;"><a target="_blank" href="${GERON_LOGO_HREF}" style="display:inline-block;"><img src="${GERON_LOGO_SRC}" alt="Geron Logo" width="165" border="0" style="display:block;width:165px;height:auto;margin:0 auto;"></a></td></tr><tr><td width="100%" height="28" style="font-size:0;line-height:28px;mso-line-height-rule:exactly;">&nbsp;</td></tr><tr><td class="apple-no-link" width="100%" align="center" valign="top" bgcolor="#173782" style="width:100%;font-family:Arial,sans-serif;font-size:13.9px;font-weight:400;line-height:16px;text-align:center;color:#fff !important;-webkit-text-fill-color:#fff !important;background-color:#173782;"><span class="apple-no-link" style="display:block;text-align:center;color:#fff !important;-webkit-text-fill-color:#fff !important;">${GERON_FOOTER_COPYRIGHT}</span></td></tr><tr><td width="100%" height="10" bgcolor="#173782" style="font-size:0;line-height:10px;mso-line-height-rule:exactly;background-color:#173782;">&nbsp;</td></tr><tr><td class="apple-no-link" width="100%" align="center" valign="top" bgcolor="#173782" style="width:100%;font-family:Arial,sans-serif;font-size:13.9px;font-weight:400;line-height:16px;text-align:center;color:#fff !important;-webkit-text-fill-color:#fff !important;background-color:#173782;"><span class="apple-no-link" style="display:block;text-align:center;color:#fff !important;-webkit-text-fill-color:#fff !important;">${GERON_FOOTER_JOB_CODE}</span></td></tr></tbody></table></td></tr></tbody></table>`;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function renderFooterCopyright(value: string): string {
  return value
    .split(/(<br\s*\/?>|\r\n|\r|\n)/gi)
    .map((part) => (/^<br\s*\/?>$/i.test(part) || /^[\r\n]+$/.test(part) ? "<br>" : escapeHtml(part)))
    .join("");
}

export interface GeronFooterContent {
  ryteloLogoHref: string;
  geronLogoHref: string;
  copyright: string;
  jobCode: string;
}

export function renderGeronFooterHtml(
  _html: string,
  content: GeronFooterContent,
  preventAutoLinking: (text: string) => string,
): string {
  const safeJobCode = preventAutoLinking(escapeHtml(content.jobCode));
  return `<table class="geron-footer-table" role="presentation" width="100%" align="center" bgcolor="#173782" border="0" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;margin:0 auto;background-color:#173782;"><tbody><tr><td align="center" bgcolor="#173782" style="padding:20px 20px 31px;text-align:center;background-color:#173782;"><table role="presentation" width="100%" align="center" bgcolor="#173782" border="0" cellpadding="0" cellspacing="0" style="width:100%;margin:0 auto;background-color:#173782;"><tbody><tr><td class="deskDisp" align="center" bgcolor="#173782" style="text-align:center;background-color:#173782;"><table role="presentation" width="390" align="center" border="0" cellpadding="0" cellspacing="0" style="width:390px;margin:0 auto;"><tbody><tr><td align="right" valign="middle" style="width:50%;padding:0 29px 0 0;border-right:1.5px solid #fff;text-align:right;"><a target="_blank" href="${escapeHtml(content.ryteloLogoHref)}" style="display:inline-block;"><img src="${GERON_RYTELO_LOGO_SRC}" alt="Rytelo Logo" width="165" border="0" style="display:block;width:165px;height:auto;margin:0 0 0 auto;"></a></td><td align="left" valign="middle" style="width:50%;padding:0 0 0 29px;text-align:left;"><a target="_blank" href="${escapeHtml(content.geronLogoHref)}" style="display:inline-block;"><img src="${GERON_LOGO_SRC}" alt="Geron Logo" width="165" border="0" style="display:block;width:165px;height:auto;margin:0 auto 0 0;"></a></td></tr></tbody></table></td></tr><tr><td class="mbDisp" align="center" bgcolor="#173782" style="display:none;padding:0 0 17px;text-align:center;background-color:#173782;"><a target="_blank" href="${escapeHtml(content.ryteloLogoHref)}" style="display:inline-block;"><img src="${GERON_RYTELO_LOGO_SRC}" alt="Rytelo Logo" width="165" border="0" style="display:block;width:165px;height:auto;margin:0 auto;"></a></td></tr><tr><td class="mbDisp" align="center" bgcolor="#173782" style="display:none;padding:0 0 28px;text-align:center;background-color:#173782;"><a target="_blank" href="${escapeHtml(content.geronLogoHref)}" style="display:inline-block;"><img src="${GERON_LOGO_SRC}" alt="Geron Logo" width="165" border="0" style="display:block;width:165px;height:auto;margin:0 auto;"></a></td></tr><tr><td width="100%" height="28" bgcolor="#173782" style="font-size:0;line-height:28px;mso-line-height-rule:exactly;background-color:#173782;">&nbsp;</td></tr><tr><td class="apple-no-link" width="100%" align="center" valign="top" bgcolor="#173782" style="width:100%;font-family:Arial,sans-serif;font-size:13.9px;font-weight:400;line-height:16px;text-align:center;color:#fff !important;-webkit-text-fill-color:#fff !important;background-color:#173782;"><span class="apple-no-link" style="display:block;text-align:center;color:#fff !important;-webkit-text-fill-color:#fff !important;">${renderFooterCopyright(content.copyright)}</span></td></tr><tr><td width="100%" height="10" bgcolor="#173782" style="font-size:0;line-height:10px;mso-line-height-rule:exactly;background-color:#173782;">&nbsp;</td></tr><tr><td class="apple-no-link" width="100%" align="center" valign="top" bgcolor="#173782" style="width:100%;font-family:Arial,sans-serif;font-size:13.9px;font-weight:400;line-height:16px;text-align:center;color:#fff !important;-webkit-text-fill-color:#fff !important;background-color:#173782;"><span class="apple-no-link" style="display:block;text-align:center;color:#fff !important;-webkit-text-fill-color:#fff !important;">${safeJobCode}</span></td></tr></tbody></table></td></tr></tbody></table>`;
}
