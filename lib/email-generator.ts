import type { EmailComponent } from "@/types/email-builder";
import { getDisplayAttributes } from "./style-generator";
import { generateColumnHtml } from "./column-html-generator";
import { compareAsc } from "date-fns";

function generateComponentHTML(component: EmailComponent): string {
  if (!component) return ""; // Defensive check
  switch (component.type) {
    case "section":
      const childrenHTML = (component.children || [])
        .filter((child) => !!child) // Filter out undefined children
        .map((child) => generateComponentHTML(child))
        .join("");

      const display = (component.displayType ||
        "all") as EmailComponent["displayType"];
      const { classAttr, innerStyle } = getDisplayAttributes(display);

      const getColumnStyles = (child: EmailComponent) => {
        if (!child.isColumn) return "";

        const alignment = child.columnAlignment || "left";
        const verticalAlignment = child.columnVerticalAlignment || "center";

        return `
      text-align: ${alignment};
      vertical-align: ${
        verticalAlignment === "top"
          ? "top"
          : verticalAlignment === "middle"
            ? "middle"
            : "bottom"
      };
      min-height: ${child.columnMinHeight || "120px"};
    `;
      };

      return `
      ${display === "mobile-only" ? "<!--[if !mso]><!-->" : ""}
      
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      align="center"
      bgcolor="${component.backgroundColor}"
       ${display === "mobile-only" ? 'class="mbl-show-table"' : display === "desktop-only" ? 'class="desk-show-table"' : ""}
       

       style="
        background-color:${component.backgroundColor};
        ${innerStyle ? innerStyle : ""}
       "
    >
      <tr bgcolor="${component.backgroundColor}" style="background-color:${component.backgroundColor};">
        <td bgcolor="${component.backgroundColor}" align="${component.columnAlignment || "top"}"  ${display === "mobile-only" ? 'class="mbl-show-cell"' : display === "desktop-only" ? 'class="desk-show-cell"' : ""} style="background-color:${component.backgroundColor};padding:${component.padding || "0 20px 0 20px"};${innerStyle ? innerStyle : ""}">
          <table
            cellpadding="0"
            cellspacing="0"
            border="0"
            width="100%"
            align="center"
            bgcolor="${component.backgroundColor}"
             ${display === "mobile-only" ? 'class="mbl-show-table"' : display === "desktop-only" ? 'class="desk-show-table"' : ""}
            style="
              max-width: ${component.maxWidth || "600px"};
              ${component.isColumn ? getColumnStyles(component) : ""}
              ${innerStyle ? innerStyle : ""}
              background-color:${component.backgroundColor};
            "
          >
            ${
              component.columns && component.columns > 1
                ? generateColumnHtml({ component, generateComponentHTML })
                : generateColumnHtml({
                    component,
                    generateComponentHTML,
                    childHtml: childrenHTML,
                  })
            }
          </table>
        </td>
      </tr>
    </table>
    ${display === "mobile-only" ? "<!--[endif]-->" : ""}
  `.trim();

    case "text": {
      const display = (component.displayType ||
        "all") as EmailComponent["displayType"];

      const { classAttr, innerStyle } = getDisplayAttributes(display);

      const divStyle = `
        font-size: ${component.fontSize || "14px"};
        color: ${component.color || "#000000"};
        text-align: ${component.textAlign || "left"};
        font-weight: ${component.fontWeight || "normal"};
        font-family: Arial, sans-serif;
        line-height: ${component.lineHeight || "16px"};
        background-color: ${component.backgroundColor || "transparent"};
       
      `.trim();

      return `
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
           ${innerStyle ? `style="${innerStyle}"` : ""}
        ${display === "mobile-only" ? 'class="mbl-show-table"' : display === "desktop-only" ? 'class="desk-show-table"' : ""}

        >
          <tbody>
            <tr>
              <td style="padding: ${
                component.padding || "0 20px 10px 20px"
              }; background-color:${
                component.backgroundColor || "transparent"
              };${innerStyle ? innerStyle : ""}" bgcolor="${component.backgroundColor || "transferent"}"   ${display === "mobile-only" ? 'class="mbl-show-table"' : display === "desktop-only" ? 'class="desk-show-table"' : ""}> 
                <div style="${divStyle}">
                  ${component.content || ""}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      `;
    }

    case "image": {
      const display = (component.displayType ||
        "all") as EmailComponent["displayType"];
      const { classAttr, innerStyle } = getDisplayAttributes(display);

      const imgStyle = `
      
        height: ${component.height || "auto"};
       
        max-width:${component.maxWidth || "100%"};
       
      `.trim();

      return `
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          align="center"
           ${innerStyle ? `style="${innerStyle}"` : ""}
        ${display === "mobile-only" ? 'class="mbl-show-table"' : display === "desktop-only" ? 'class="desk-show-table"' : ""}
        >
          <tbody>
            <tr>
              <td width="${(component.width || "100%").toString().replace("px", "")}" ${display === "mobile-only" ? 'class="mbl-show-cell"' : display === "desktop-only" ? 'class="desk-show-cell"' : ""} align='${
                component.textAlign || "center"
              }' style="padding: ${component.padding || "0 0 0 0"}; mso-line-height-rule: exactly;">
                 <img 
                    width="${(component.width || "100%").toString().replace("px", "")}"
                    src="${component.src || ""}" 
                    alt="${component.alt || "Image"}"
                    border="0"
                    style="${imgStyle} display: block;"
                  />
              </td>
            </tr>
          </tbody>
        </table>
      `;
    }

    case "button": {
      const display = (component.displayType ||
        "all") as EmailComponent["displayType"];
      const { classAttr, innerStyle } = getDisplayAttributes(display);

      const linkStyle = `
        color: ${component.color || "#ffffff"};
        text-decoration: none;
        font-family: Arial, sans-serif;
        font-weight: bold;
        ${innerStyle ? innerStyle : ""}
      `.trim();

      return `
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
           ${innerStyle ? `style="${innerStyle}"` : ""}
          ${display && display === "mobile-only" ? 'class="mbl-show-table"' : display && display === "desktop-only" ? 'class="desk-show-table"' : ""}
        >
          <tbody>
            <tr>
              <td style="padding: ${component.padding || "0 20px 20px 20px"}; text-align: ${
                component.textAlign || "center"
              };${innerStyle ? innerStyle : ""}">
                <table ${display && display === "mobile-only" ? 'class="mbl-show-table"' : display && display === "desktop-only" ? 'class="desk-show-table"' : ""} cellpadding="0" cellspacing="0" border="0" align="center" ${innerStyle ? `style="${innerStyle}"` : ""}>
                  <tr>
                    <td ${display && display === "mobile-only" ? 'class="mbl-show-cell"' : display && display === "desktop-only" ? 'class="desk-show-cell"' : ""} style="
                      background-color: ${
                        component.backgroundColor || "#007bff"
                      };
                      border-radius: ${component.borderRadius || "4px"};
                      padding: ${component.buttonPadding || "12px 24px"};
                      ${component.width ? `width: ${component.width};` : ""}
                      ${component.height ? `height: ${component.height};` : ""}
                      ${innerStyle ? innerStyle : ""}
                    ">
                      <a href="${component.href || "#"}" style="${linkStyle}">
                        ${component.text || "Button"}
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      `;
    }

    case "divider": {
      const display = (component.displayType ||
        "all") as EmailComponent["displayType"];
      const { classAttr, innerStyle } = getDisplayAttributes(display);

      const dividerStyle = `
    line-height: ${component.height || "1px"};
    font-size: 0px;
    height: ${component.height || "1px"};
    background-color: ${component.backgroundColor || "#e0e0e0"};
    ${innerStyle ? innerStyle : ""}
    mso-line-height-rule: exactly;
  `.trim();

      return `
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
       ${innerStyle ? `style="${innerStyle}"` : ""}
     ${display && display === "mobile-only" ? 'class="mbl-show-table"' : display && display === "desktop-only" ? 'class="desk-show-table"' : ""}
    >
      <tbody>
        <tr>
          <td ${display && display === "mobile-only" ? 'class="mbl-show-cell"' : display && display === "desktop-only" ? 'class="desk-show-cell"' : ""} style="padding: ${component.padding || "0 20px 20px 20px"};${innerStyle ? innerStyle : ""}" >
            <table  ${display && display === "mobile-only" ? 'class="mbl-show-table"' : display && display === "desktop-only" ? 'class="desk-show-table"' : ""} cellpadding="0" cellspacing="0" border="0" width="100%"  ${innerStyle ? `style="${innerStyle}"` : ""}>
              <tr>
                <td style="${dividerStyle}">&nbsp;</td>
              </tr>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  `;
    }
    case "raw-html":
      return `
      <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      align="center"
      border="0"
    >
      <tbody>
        <tr>
          <td  width="100%"  align="center" style="padding: ${component.padding || "0 20px 20px 20px"};" >
            ${component.html}
          </td>
        </tr>
      </tbody>
    </table>
      
      `;

    case "cta-button": {
      const ctaDisplay = (component.displayType ||
        "all") as EmailComponent["displayType"];
      const { classAttr, innerStyle } = getDisplayAttributes(ctaDisplay);

      return `
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      align="center"
        ${innerStyle ? `style="${innerStyle}"` : ""}
      bgcolor="${component.backgroundColor || "#ffffff"}"
      ${ctaDisplay && ctaDisplay === "mobile-only" ? 'class="mbl-show-table"' : ctaDisplay && ctaDisplay === "desktop-only" ? 'class="desk-show-table"' : ""}
    >
      <tbody>
        <tr>
          <td bgcolor="${component.backgroundColor || "#ffffff"}" width="100%" ${ctaDisplay && ctaDisplay === "mobile-only" ? 'class="mbl-show-cell"' : ctaDisplay && ctaDisplay === "desktop-only" ? 'class="desk-show-cell"' : ""} align="center" style="text-align:center;padding: ${component.padding || "0 20px 20px 20px"};${innerStyle ? innerStyle : ""}; mso-line-height-rule: exactly;">
            <table width="${(component.width || "470").toString().replace("px", "")}" ${ctaDisplay && ctaDisplay === "mobile-only" ? 'class="mbl-show-table"' : ctaDisplay && ctaDisplay === "desktop-only" ? 'class="desk-show-table"' : ""} align="center" cellpadding="0" cellspacing="0" border="0"  ${innerStyle ? `style="${innerStyle}"` : ""}>
              <tr>
                <td width="100%" ${ctaDisplay && ctaDisplay === "mobile-only" ? 'class="mbl-show-cell"' : ctaDisplay && ctaDisplay === "desktop-only" ? 'class="desk-show-cell"' : ""} align="center"  ${innerStyle ? `style="${innerStyle}"` : ""} style="mso-line-height-rule: exactly;">
                      <a href="${component.href || "#"}"  target="_blank">
                        <img
                          width="100%"
                          src="${component.imageSrc || "/cta-placeholder.png"}"
                          alt="${component.imageAlt || "CTA Image"}"
                          border="0"
                          style="
                            width:100%;
                            height: ${component.height || "auto"}; 
                            max-width: 100%; 
                            display: block;
                          "
                        />
                      </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  `;
    }

    case "footer-links": {
      const footerDisplay = (component.displayType ||
        "all") as EmailComponent["displayType"];
      const { classAttr, innerStyle } = getDisplayAttributes(footerDisplay);
      const linksHTML = (component.links || [])
        .map(
          (link, index) => `
      <a target="_blank" href="${link.href || "#"}" style="color: ${
        component.color || "#0463c1"
      }; text-decoration: underline; font-size: ${
        component.fontSize || "12px"
      }; margin-right: 10px;font-family: Arial, sans-serif;${innerStyle ? innerStyle : ""}">
        ${link.text || "Link"}
      </a>
      ${index === 1 ? "<br class='mobile' style='display: none;'/>" : ""}
      ${index === 1 ? "<br class='mobile' style='display: none;'/>" : ""}
      ${
        index < component.links!.length - 1
          ? index == 1
            ? `<span class='desktop'  style="color:#000000; font-size:14px; margin-right:5px;">&nbsp;|&nbsp;&nbsp;</span>`
            : `<span  style="color:#000000; font-size:14px; margin-right:5px;">&nbsp;|&nbsp;&nbsp;</span>`
          : ""
      }
    `,
        )
        .join("");
      return `
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      bgcolor="${component.backgroundColor || "#ffffff"}"
       ${innerStyle ? `style="${innerStyle}"` : ""}
     ${footerDisplay && footerDisplay === "mobile-only" ? 'class="mbl-show-table"' : footerDisplay && footerDisplay === "desktop-only" ? 'class="desk-show-table"' : ""}
    >
      <tbody>
        <tr>
          <td bgcolor="${component.backgroundColor || "#ffffff"}" ${footerDisplay && footerDisplay === "mobile-only" ? 'class="mbl-show-cell"' : footerDisplay && footerDisplay === "desktop-only" ? 'class="desk-show-cell"' : ""} style="padding: ${component.padding || "20px 20px 20px 20px"}; text-align: ${
            component.textAlign || "left"
          }; background-color: ${component.backgroundColor || "#fffff"};${innerStyle ? innerStyle : ""}">
            <div style="color: ${component.color || "#0463c1"}; font-size: ${
              component.fontSize || "14px"
            }; line-height: ${component.lineHeight};">
              ${linksHTML}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  `.trim();
    }

    case "footer-links(3)": {
      const footerDisplay = (component.displayType ||
        "all") as EmailComponent["displayType"];
      const { classAttr, innerStyle } = getDisplayAttributes(footerDisplay);
      const linksHTML = (component.links || [])
        .map(
          (link, index) => `
      <a href="${link.href || "#"}" target="_blank" style="color: ${
        component.color || "#0000EE"
      }; text-decoration: underline; font-size: ${
        component.fontSize || "14px"
      }; margin-right: 10px;font-family: Arial, sans-serif;${innerStyle ? innerStyle : ""}">
        ${link.text || "Link"}
      </a>
      ${index === 1 ? "<br class='mobile' style='display: none;'/>" : ""}
      ${
        index < component.links!.length - 1
          ? index == 1
            ? `<span class='desktop'  style="color:grey; font-size:14px; margin-right:5px;">|&nbsp;&nbsp;</span>`
            : `<span  style="color:grey; font-size:14px; margin-right:5px;">|&nbsp;&nbsp;</span>`
          : ""
      }
    `,
        )
        .join("");
      return `
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      bgcolor="${component.backgroundColor || "#ffffff"}"
       ${innerStyle ? `style="${innerStyle}"` : ""}
     ${footerDisplay && footerDisplay === "mobile-only" ? 'class="mbl-show-table"' : footerDisplay && footerDisplay === "desktop-only" ? 'class="desk-show-table"' : ""}
    >
      <tbody>
        <tr>
          <td bgcolor="${component.backgroundColor || "#ffffff"}" ${footerDisplay && footerDisplay === "mobile-only" ? 'class="mbl-show-cell"' : footerDisplay && footerDisplay === "desktop-only" ? 'class="desk-show-cell"' : ""} style="padding: ${component.padding || "0 20px 0 20px"}; text-align: ${
            component.textAlign || "left"
          }; background-color: ${component.backgroundColor || "#fffff"};${innerStyle ? innerStyle : ""}">
            <div style="color: ${component.color || "#000000"}; font-size: ${
              component.fontSize || "14px"
            }; line-height: 1.5;">
              ${linksHTML}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  `;
    }

    case "elzonris-pi": {
      return `
      <table class="mobile-table" width="100%" align="center" border="0" cellspacing="0" cellpadding="0">
        <tbody>
          <tr>
            <td width="30" height="1" style="font-size:0px;line-height:1px;mso-line-height-rule:exactly;"></td>
            <td>
              <table width="100%" align="center" border="0" cellspacing="0" cellpadding="0">
                <tbody>
                  <tr><td width="100%" height="15" style="font-size:0px;line-height:15px;mso-line-height-rule:exactly;">&nbsp;</td></tr>
                  <tr>
                    <td align="left" valign="middle" style="color:${component.color || '#000000'};font-family:Arial,sans-serif;font-weight:bold;font-size:${component.fontSize || '12px'};line-height:14px;">
                      Please see Full <a href="${component.piHref || 'http://pi.elzonris.com/'}" target="_blank" style="font-weight:bold;text-decoration:underline;color:${component.linkColor || '#009877'};line-height:16px;">Prescribing Information</a>, including Boxed WARNING.
                    </td>
                  </tr>
                  <tr><td width="100%" height="10" style="font-size:0px;line-height:10px;mso-line-height-rule:exactly;">&nbsp;</td></tr>
                  <tr>
                    <td align="left" valign="top" style="color:${component.color || '#000000'};font-weight:bold;font-family:Arial,sans-serif;font-size:${component.fontSize || '12px'};line-height:14px;">
                      Please click <a href="${component.isiHref || '#'}" target="_blank" style="font-weight:bold;text-decoration:underline;color:${component.linkColor || '#009877'};">here</a>&nbsp;for Important Safety Information, including Boxed WARNING.
                    </td>
                  </tr>
                  <tr><td width="100%" height="15" style="font-size:0px;line-height:15px;mso-line-height-rule:exactly;">&nbsp;</td></tr>
                </tbody>
              </table>
            </td>
            <td width="30" height="1" style="font-size:0px;line-height:1px;mso-line-height-rule:exactly;"></td>
          </tr>
        </tbody>
      </table>
      `.trim();
    }

    case "elzonris-brand-logo": {
      const display = (component.displayType || "all") as EmailComponent["displayType"];
      const { innerStyle } = getDisplayAttributes(display);
      return `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
        <tbody>
          <tr>
            <td style="padding: ${component.padding || "10px 20px"};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td class="brand-logo-col" width="50%" align="left" valign="middle" style="width:50%; padding: 5px 0;">
                    <a href="${component.logoA?.href || "#"}" target="_blank">
                      <img src="${component.logoA?.imgSrc || ""}" width="200" style="display:block; border:0; max-width:100%;" alt="${component.logoA?.altTex || ""}" />
                    </a>
                  </td>
                  <td class="brand-logo-col" width="50%" align="right" valign="middle" style="width:50%; padding: 5px 0;">
                    <a href="${component.logoB?.href || "#"}" target="_blank">
                      <img src="${component.logoB?.imgSrc || ""}" width="150" style="display:block; border:0; max-width:100%; margin-left:auto;" alt="${component.logoB?.altTex || ""}" />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
      `;
    }

    case "footer-link-3": {
      const fl3LinksHtml = (component.links || []).map((link, index) => `
        <td class="footer-link-col" align="${index === 0 ? 'left' : index === (component.links!.length - 1) ? 'right' : 'center'}" valign="top" style="padding: 5px 0;">
          <a href="${link.href}" target="_blank" style="color: ${component.color || '#009877'}; text-decoration: underline; font-family: Arial, sans-serif; font-size: ${component.fontSize || '12px'};">${link.text}</a>
        </td>
      `.trim()).join("");
      return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${component.backgroundColor || '#ffffff'}" align="center">
        <tbody><tr><td align="center" style="padding: ${component.padding || '5px 20px'};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tbody><tr>${fl3LinksHtml}</tr></tbody>
          </table></td></tr></tbody></table>
      `.trim();
    }

case "isi": {
      return `
       <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
       <tbody>
          <tr>
            <td style="padding: 20px 20px 10px 20px;">
               <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tbody>
                   <tr>
                                          <td class="f_14 green f_bold" align="left" valign="top"
                                             style=" font-weight: 600; color: #006937; font-family: Arial, sans-serif; font-size: 16px; line-height: 18px; ">
                                             IMPORTANT SAFETY INFORMATION </td>
                                       </tr>
                                       <tr>
                                          <td width="100%" height="15"
                                             style=" font-size: 0px; line-height: 15px; mso-line-height-rule: exactly; ">
                                             &nbsp;</td>
                                       </tr>
                                       <tr>
                                          <td class="f_14 black f_bold" align="left" valign="top"
                                             style=" font-weight: 700; color: #2B2E34; font-family: Arial, sans-serif; font-size: 14px; line-height: 14px; ">
                                             Warnings and Precautions </td>
                                       </tr>
                                       <tr>
                                          <td width="100%" height="10"
                                             style=" font-size: 0px; line-height: 10px; mso-line-height-rule: exactly; ">
                                             &nbsp;</td>
                                       </tr>
                                       <tr>
                                          <td>
                                             <table class="mobile-table" width="100%" align="center" border="0"
                                                cellspacing="0" cellpadding="0">
                                                <tbody>
                                                   <tr>
                                                      <td bgcolor="#ffffff" align="left" valign="top" width="2%" style="color: #69d6b5;font-size: 16px;line-height: 16px;padding: 2px 0 0 0;">&#8226;</td>
                                                      <td class="f_14 black f_normal" align="left" valign="top"
                                                         style=" font-weight: 400; color: #2B2E34; font-family: Arial, sans-serif; font-size: 14px; line-height: 18px;padding:0 0 0 5px; ">
                                                         <span class="f_bold"
                                                            style="font-weight: 700">Dyslipidemia:&nbsp;</span>Hypercholesterolemia
                                                         and hypertriglyceridemia occurred in patients taking ORSERDU at
                                                         an incidence of 30% and 27%, respectively. The incidence of
                                                         Grade 3 and 4 hypercholesterolemia and hypertriglyceridemia
                                                         were 0.9% and 2.2%, respectively. Monitor lipid profile prior
                                                         to starting and periodically while taking ORSERDU.
                                                      </td>
                                                   </tr>
                                                </tbody>
                                             </table>
                                          </td>
                                       </tr>
                                       <tr>
                                          <td width="100%" height="10"
                                             style=" font-size: 0px; line-height: 10px; mso-line-height-rule: exactly; ">
                                             &nbsp;</td>
                                       </tr>
                                       <tr>
                                          <td>
                                             <table class="mobile-table" width="100%" align="center" border="0"
                                                cellspacing="0" cellpadding="0">
                                                <tbody>
                                                   <tr>
                                                      <td bgcolor="#ffffff" align="left" valign="top" width="2%" style="color: #69d6b5;font-size: 16px;line-height: 16px;padding: 2px 0 0 0;">&#8226;</td>
                                                      <td class="f_14 black f_normal" align="left" valign="top"
                                                         style=" font-weight: 400; color: #2B2E34; font-family: Arial, sans-serif; font-size: 14px; line-height: 18px;padding:0 0 0 5px; ">
                                                         <span class="f_bold" style="font-weight: 700">Embryo-Fetal
                                                            Toxicity:&nbsp;</span>Based on findings in animals and its
                                                         mechanism of action, ORSERDU can cause fetal harm when
                                                         administered to a pregnant woman. Advise pregnant women and
                                                         females of reproductive potential of the potential risk to a
                                                         fetus. Advise females of reproductive potential to use
                                                         effective contraception during treatment with ORSERDU and for 1
                                                         week after the last dose. Advise male patients with female
                                                         partners of reproductive potential to use effective
                                                         contraception during treatment with ORSERDU and for 1 week
                                                         after the last dose.
                                                      </td>
                                                   </tr>
                                                </tbody>
                                             </table>
                                          </td>
                                       </tr>
                                       <tr>
                                          <td width="100%" height="15"
                                             style=" font-size: 0px; line-height: 15px; mso-line-height-rule: exactly; ">
                                             &nbsp;</td>
                                       </tr>
                                       <tr>
                                          <td class="f_14 black f_bold" align="left" valign="top"
                                             style=" font-weight: 700; color: #2B2E34; font-family: Arial, sans-serif; font-size: 14px; line-height: 18px; ">
                                             Adverse Reactions </td>
                                       </tr>
                                       <tr>
                                          <td width="100%" height="10"
                                             style=" font-size: 0px; line-height: 10px; mso-line-height-rule: exactly; ">
                                             &nbsp;</td>
                                       </tr>
                                       <tr>
                                          <td>
                                             <table class="mobile-table" width="100%" align="center" border="0"
                                                cellspacing="0" cellpadding="0">
                                                <tbody>
                                                   <tr>
                                                      <td bgcolor="#ffffff" align="left" valign="top" width="2%" style="color: #69d6b5;font-size: 16px;line-height: 16px;padding: 2px 0 0 0;">&#8226;</td>
                                                      <td class="f_14 black f_normal" align="left" valign="top"
                                                         style=" font-weight: 400; color: #2B2E34; font-family: Arial, sans-serif; font-size: 14px; line-height: 18px; padding:0 0 0 5px;">
                                                         <span class="f_bold" style="font-weight: 700">Serious adverse
                                                            reactions&nbsp;</span>occurred in 12% of patients who
                                                         received ORSERDU. Serious adverse reactions in &gt;1% of
                                                         patients who received ORSERDU were musculoskeletal pain (1.7%)
                                                         and nausea (1.3%). Fatal adverse reactions occurred in 1.7% of
                                                         patients who received ORSERDU, including cardiac arrest, septic
                                                         shock, diverticulitis, and unknown cause (one patient each).
                                                      </td>
                                                   </tr>
                                                </tbody>
                                             </table>
                                          </td>
                                       </tr>
                                       <tr>
                                          <td width="100%" height="10"
                                             style=" font-size: 0px; line-height: 10px; mso-line-height-rule: exactly; ">
                                             &nbsp;</td>
                                       </tr>
                                       <tr>
                                          <td>
                                             <table class="mobile-table" width="100%" align="center" border="0"
                                                cellspacing="0" cellpadding="0">
                                                <tbody>
                                                   <tr>
                                                      <td bgcolor="#ffffff" align="left" valign="top" width="2%" style="color: #69d6b5;font-size: 16px;line-height: 16px;padding: 2px 0 0 0;">&#8226;</td>
                                                      
                                                      <td class="f_14 black f_normal" align="left" valign="top"
                                                         style=" font-weight: 400; color: #2B2E34; font-family: Arial, sans-serif; font-size: 14px; line-height: 18px;padding:0 0 0 5px; ">
                                                         <span class="f_bold" style="font-weight: 700">The most common
                                                            adverse reactions&nbsp;</span>(&#8805;10%), including laboratory
                                                         abnormalities, of ORSERDU were musculoskeletal pain (41%),
                                                         nausea (35%), increased cholesterol (30%), increased AST (29%),
                                                         increased triglycerides (27%), fatigue (26%), decreased
                                                         hemoglobin (26%), vomiting (19%), increased ALT (17%),
                                                         decreased sodium (16%), increased creatinine (16%), decreased
                                                         appetite (15%), diarrhea (13%), headache (12%), constipation
                                                         (12%), abdominal pain (11%), hot flush (11%), and dyspepsia
                                                         (10%).
                                                      </td>
                                                   </tr>
                                                </tbody>
                                             </table>
                                          </td>
                                       </tr>
                                       <tr>
                                          <td width="100%" height="15"
                                             style=" font-size: 0px; line-height: 15px; mso-line-height-rule: exactly; ">
                                             &nbsp;</td>
                                       </tr>
                                       <tr>
                                          <td class="f_14 black f_bold" align="left" valign="top"
                                             style=" font-weight: 700; color: #2B2E34; font-family: Arial, sans-serif; font-size: 14px; line-height: 18px; ">
                                             Drug Interactions </td>
                                       </tr>
                                       <tr>
                                          <td width="100%" height="10"
                                             style=" font-size: 0px; line-height: 10px; mso-line-height-rule: exactly; ">
                                             &nbsp;</td>
                                       </tr>
                                       <tr>
                                          <td>
                                             <table class="mobile-table" width="100%" align="center" border="0"
                                                cellspacing="0" cellpadding="0">
                                                <tbody>
                                                   <tr>
                                                      <td bgcolor="#ffffff" align="left" valign="top" width="2%" style="color: #69d6b5;font-size: 16px;line-height: 16px;padding: 2px 0 0 0;">&#8226;</td>
                                                    
                                                      <td class="f_14 black f_normal" align="left" valign="top"
                                                         style=" font-weight: 400; color: #2B2E34; font-family: Arial, sans-serif; font-size: 14px; line-height: 18px;padding:0 0 0 5px;">
                                                         <span class="f_bold" style="font-weight: 700">Concomitant use
                                                            with CYP3A4 inducers and/or inhibitors:&nbsp;</span>Avoid
                                                         concomitant use of strong or moderate CYP3A4 inhibitors with
                                                         ORSERDU. Avoid concomitant use of strong or moderate CYP3A4
                                                         inducers with ORSERDU.
                                                      </td>
                                                   </tr>
                                                </tbody>
                                             </table>
                                          </td>
                                       </tr>
                                       <tr>
                                          <td width="100%" height="15"
                                             style=" font-size: 0px; line-height: 15px; mso-line-height-rule: exactly; ">
                                             &nbsp;</td>
                                       </tr>
                                       <tr>
                                          <td class="f_14 black f_bold" align="left" valign="top"
                                             style=" font-weight: 700; color: #2B2E34; font-family: Arial, sans-serif; font-size: 14px; line-height: 18px; ">
                                             Use in Specific Populations </td>
                                       </tr>
                                       <tr>
                                          <td width="100%" height="10"
                                             style=" font-size: 0px; line-height: 10px; mso-line-height-rule: exactly; ">
                                             &nbsp;</td>
                                       </tr>
                                       <tr>
                                          <td>
                                             <table class="mobile-table" width="100%" align="center" border="0"
                                                cellspacing="0" cellpadding="0">
                                                <tbody>
                                                   <tr>
                                                      <td bgcolor="#ffffff" align="left" valign="top" width="2%" style="color: #69d6b5;font-size: 16px;line-height: 16px;padding: 2px 0 0 0;">&#8226;</td>
                                                      
                                                      <td class="f_14 black f_normal" align="left" valign="top"
                                                         style=" font-weight: 400; color: #2B2E34; font-family: Arial, sans-serif; font-size: 14px; line-height: 18px;padding:0 0 0 5px; ">
                                                         <span class="f_bold"
                                                            style="font-weight: 700">Lactation:&nbsp;</span>Advise
                                                         lactating women to not breastfeed during treatment with ORSERDU
                                                         and for 1 week after the last dose.
                                                      </td>
                                                   </tr>
                                                </tbody>
                                             </table>
                                          </td>
                                       </tr>
                                       <tr>
                                          <td width="100%" height="10"
                                             style=" font-size: 0px; line-height: 10px; mso-line-height-rule: exactly; ">
                                             &nbsp;</td>
                                       </tr>
                                       <tr>
                                          <td>
                                             <table class="mobile-table" width="100%" align="center" border="0"
                                                cellspacing="0" cellpadding="0">
                                                <tbody>
                                                   <tr>
                                                      <td bgcolor="#ffffff" align="left" valign="top" width="2%" style="color: #69d6b5;font-size: 16px;line-height: 16px;padding: 2px 0 0 0;">&#8226;</td>
                                                     
                                                      <td class="f_14 black f_normal" align="left" valign="top"
                                                         style=" font-weight: 400; color: #2B2E34; font-family: Arial, sans-serif; font-size: 14px; line-height: 16px;padding:0 0 0 5px; ">
                                                         <span class="f_bold" style="font-weight: 700">Hepatic
                                                            Impairment:&nbsp;</span>Avoid use of ORSERDU in patients
                                                         with severe hepatic impairment (Child-Pugh C). Reduce the dose
                                                         of ORSERDU in patients with moderate hepatic impairment
                                                         (Child-Pugh B).
                                                      </td>
                                                   </tr>
                                                </tbody>
                                             </table>
                                          </td>
                                       </tr>
                                       <tr>
                                          <td width="100%" height="10"
                                             style=" font-size: 0px; line-height: 10px; mso-line-height-rule: exactly; ">
                                             &nbsp;</td>
                                       </tr>
                                       <tr>
                                          <td class="f_14 black f_normal" align="left" valign="top"
                                             style=" font-weight: 400; color: #2B2E34; font-family: Arial, sans-serif; font-size: 14px; line-height: 18px;  ">
                                             The safety and effectiveness of ORSERDU in pediatric patients have not been
                                             established. </td>
                                       </tr>
                                       <tr>
                                          <td width="100%" height="15"
                                             style=" font-size: 0px; line-height: 15px; mso-line-height-rule: exactly; ">
                                             &nbsp;</td>
                                       </tr>
                                       <tr>
                                          <td class="f_14 black f_normal" align="left" valign="top"
                                             style=" font-weight: 400; color: #2B2E34; font-family: Arial, sans-serif; font-size: 14px; line-height: 18px;">
                                             ORSERDU is available as 345 mg tablets and 86 mg tablets. </td>
                                       </tr>
                </tbody>
               </table>
            </td>
          </tr>
          </tbody>
          </table>
          `;
    }

    case "bullet-list": {
      const display = (component.displayType ||
        "all") as EmailComponent["displayType"];
      const { classAttr, innerStyle } = getDisplayAttributes(display);

      const bulletStyle = `
       color: ${component.markerColor || "#000000"};
       font-size: ${component.discSize || "16px"};
       line-height: ${component.lineHeight || "18px"};
      ${innerStyle ? innerStyle : ""}
      background-color: ${component.backgroundColor}
      `.trim();

      const itemStyle = `
        color: ${component.color || "#000000"};
        font-size: ${component.fontSize || "16px"};
        font-weight: ${component.fontWeight || "normal"};
        text-align: ${component.textAlign || "left"};
        line-height: ${component.lineHeight || "18px"};
        padding-left: 5px;
        font-family: Arial, sans-serif;
        background-color : ${component.backgroundColor || "#ffffff"}
      `.trim();

      const listItemsHTML = (component.listItems || [])
        .map(
          (item) => `
        <tr >
          <td bgcolor="${component.backgroundColor || "#ffffff"}" align="left" valign="top" width="2%" style="${bulletStyle}">&bull;</td>
          
          <td bgcolor="${component.backgroundColor || "#ffffff"}" align="left" valign="middle" style="${itemStyle}">
            ${item}
          </td>
        </tr>
        <tr><td bgcolor="${component.backgroundColor || "#ffffff"}" height="${component.spaceBetweenItems?.slice(0, 3) || 5}" style=" font-size: 0px; line-height: ${component.spaceBetweenItems || 5}px; mso-line-height-rule: exactly;background-color:${component.backgroundColor || "#ffffff"} ">&nbsp; </td></tr>
      `,
        )
        .join("");

      return `
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      bgcolor="${component.backgroundColor || "#ffffff"}"
      style="background-color:${component.backgroundColor || "#ffffff"};${innerStyle ? innerStyle : ""}"
      ${display && display === "mobile-only" ? 'class="mbl-show-table"' : display && display === "desktop-only" ? 'class="desk-show-table"' : ""}
    >
      <tbody>
        <tr>
          <td bgcolor="${component.backgroundColor || "#ffffff"}" ${display && display === "mobile-only" ? 'class="mbl-show-cell"' : display && display === "desktop-only" ? 'class="desk-show-cell"' : ""} style="padding: ${component.padding || "0 20px 0 20px"}; background-color: ${component.backgroundColor || "transparent"};${innerStyle ? innerStyle : ""}">
            <table bgcolor="${component.backgroundColor || "#ffffff"}" style="background-color:${component.backgroundColor || "#ffffff"};${innerStyle ? innerStyle : ""}" ${display && display === "mobile-only" ? 'class="mbl-show-table"' : display && display === "desktop-only" ? 'class="desk-show-table"' : ""} cellpadding="0" cellspacing="0" border="0" width="100%" >
              <tbody>
                ${listItemsHTML}
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  `;
    }

    case "header-image": {
      const display = (component.displayType ||
        "all") as EmailComponent["displayType"];
      const { classAttr, innerStyle } = getDisplayAttributes(display);
      return `
      <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
        ${innerStyle ? `style="${innerStyle}"` : ""}
     ${display && display === "mobile-only" ? 'class="mbl-show-table"' : display && display === "desktop-only" ? 'class="desk-show-table"' : ""}
    >
      <tbody>
        <tr>
          <td 
         ${display && display === "mobile-only" ? 'class="mbl-show-cell"' : display && display === "desktop-only" ? 'class="desk-show-cell"' : ""}
          align="center"  ${innerStyle ? `style="${innerStyle}"` : ""} style="padding: ${component.padding || "0"}; mso-line-height-rule: exactly;">
            <img
              width="${(component.width || "600").toString().replace("px", "")}"
              src="${component.src || "/header-placeholder.png"}"
              alt="${component.imageAlt || "Header Image"}"
              border="0"
              style="
                width: ${component.width || "600px"};
                height: ${component.height || "auto"};
                display: block;
                max-width: 100%;
                "
            />
          </td>
        </tr>
      </tbody>
    </table>
      `;
    }
    case "chevron-divider": {
      const display = (component.displayType ||
        "all") as EmailComponent["displayType"];
      const { classAttr, innerStyle } = getDisplayAttributes(display);
      return `
      <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
        ${innerStyle ? `style="${innerStyle}"` : ""}
     ${display && display === "mobile-only" ? 'class="mbl-show-table"' : display && display === "desktop-only" ? 'class="desk-show-table"' : ""}
    >
      <tbody>
        <tr>
          <td 
         ${display && display === "mobile-only" ? 'class="mbl-show-cell"' : display && display === "desktop-only" ? 'class="desk-show-cell"' : ""}
          align="center"  ${innerStyle ? `style="${innerStyle}"` : ""} style="padding: ${component.padding || "0"}; mso-line-height-rule: exactly;">
            <img
              width="${(component.width || "600").toString().replace("px", "")}"
              src="${component.src || "/header-placeholder.png"}"
              alt="${component.imageAlt || "Header Image"}"
              border="0"
              style="
                width: ${component.width || "600px"};
                height: ${component.height || "auto"};
                display: block;
                max-width: 100%;
                "
            />
          </td>
        </tr>
      </tbody>
    </table>
      `;
    }
    case "Salutation": {
      const display = (component.displayType ||
        "all") as EmailComponent["displayType"];
      const { classAttr, innerStyle } = getDisplayAttributes(display);

      const itemStyle = `
        color: ${component.color || "#000000"};
        font-size: ${component.fontSize || "14px"};
        font-weight: ${component.fontWeight || "normal"};
        text-align: ${component.textAlign || "left"};
        line-height: ${component.lineHeight || "16px"};
        font-family: Arial, sans-serif;
        
      `.trim();
      return `
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          align="center"
           ${innerStyle ? `style="${innerStyle}"` : ""}
        ${display === "mobile-only" ? 'class="mbl-show-table"' : display === "desktop-only" ? 'class="desk-show-table"' : ""}
        >
          <tbody>
            <tr>
              <td width="${component.width}" ${display === "mobile-only" ? 'class="mbl-show-cell"' : display === "desktop-only" ? 'class="desk-show-cell"' : ""} align='${
                component.textAlign || "center"
              }' style="padding: ${component.padding || "0 16px 16px 16px"}; ${itemStyle}">
                 ${component.content || ""}
              </td>
            </tr>
          </tbody>
        </table>
      `;
    }
    case "footer-tokens": {
      const display = (component.displayType ||
        "all") as EmailComponent["displayType"];
      const { classAttr, innerStyle } = getDisplayAttributes(display);

      const itemStyle = `
        color: ${component.color || "#000000"};
        font-size: ${component.fontSize || "16px"};
        font-weight: ${component.fontWeight || "normal"};
        text-align: ${component.textAlign || "left"};
        line-height: ${component.lineHeight || "18px"};
        font-family: Arial, sans-serif;
        
      `.trim();
      return `
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          align="center"
           ${innerStyle ? `style="${innerStyle}"` : ""}
        ${display === "mobile-only" ? 'class="mbl-show-table"' : display === "desktop-only" ? 'class="desk-show-table"' : ""}
        >
          <tbody>
            <tr>
              <td  ${display === "mobile-only" ? 'class="mbl-show-cell"' : display === "desktop-only" ? 'class="desk-show-cell"' : ""} align='${
                component.textAlign || "center"
              }' style="padding: ${component.padding || "0 20px 20px 20px"}; ${itemStyle}">
                 ${component.footerTokens?.regards || ""}
              </td>
            </tr>
            <tr>
              <td ${display === "mobile-only" ? 'class="mbl-show-cell"' : display === "desktop-only" ? 'class="desk-show-cell"' : ""} align='${
                component.textAlign || "center"
              }' style="padding: ${component.padding || "0 20px 20px 20px"}; ${itemStyle}">
                 ${component.footerTokens?.userName || ""}
              </td>
            </tr>
            <tr>
              <td  ${display === "mobile-only" ? 'class="mbl-show-cell"' : display === "desktop-only" ? 'class="desk-show-cell"' : ""} align='${
                component.textAlign || "center"
              }' style="padding: ${component.padding || "0 20px 20px 20px"}; ${itemStyle}">
                 ${component.footerTokens?.company || ""}
              </td>
            </tr>
            <tr>
              <td  ${display === "mobile-only" ? 'class="mbl-show-cell"' : display === "desktop-only" ? 'class="desk-show-cell"' : ""} align='${
                component.textAlign || "center"
              }' style="padding: ${component.padding || "0 20px 20px 20px"}; ${itemStyle}">
                 ${component.footerTokens?.userEmailAddress || ""}
              </td>
            </tr>
            <tr>
              <td  ${display === "mobile-only" ? 'class="mbl-show-cell"' : display === "desktop-only" ? 'class="desk-show-cell"' : ""} align='${
                component.textAlign || "center"
              }' style="padding: ${component.padding || "0 20px 20px 20px"}; ${itemStyle}">
                 ${component.footerTokens?.userPhone || ""}
              </td>
            </tr>
          </tbody>
        </table>
      `;
    }

    case "orsedu-footer": {
      const display = (component.displayType ||
        "all") as EmailComponent["displayType"];
      const { classAttr, innerStyle } = getDisplayAttributes(display);

      const itemStyle = `
        color: ${component.color || "#000000"};
        font-size: ${component.fontSize || "12px"};
        font-weight: ${component.fontWeight || "normal"};
        text-align: ${component.textAlign || "left"};
        line-height: ${component.lineHeight || "14px"};
        font-family: Arial, sans-serif;
        
      `.trim();
      return `
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          align="center"
          bgcolor="#F1F1F1"
           ${innerStyle ? `style="${innerStyle}"` : ""}
        ${display === "mobile-only" ? 'class="mbl-show-table"' : display === "desktop-only" ? 'class="desk-show-table"' : ""}
        >
          <tbody>
          <tr>
            <td width="100%" height="20" style=" font-size: 0px; line-height: 20px; mso-line-height-rule: exactly; ">&nbsp; </td>
        </tr>
            <tr>
          <td 
         ${display && display === "mobile-only" ? 'class="mbl-show-cell"' : display && display === "desktop-only" ? 'class="desk-show-cell"' : ""}
          align="left"  
          style="padding: ${component.padding || "0 0 0 17px"}; ${innerStyle || ""}; mso-line-height-rule: exactly;" 
          width="${(component.width || "200").toString().replace("px", "")}">
            <img
              width="${(component.width || "200").toString().replace("px", "")}"
              src="${component.src || "/header-placeholder.png"}"
              alt="${component.imageAlt || "Header Image"}"
              border="0"
              style="
                width: ${component.width || "200px"};
                height: ${component.height || "auto"};
                display: block;
                max-width: 100%;
                "
            />
          </td>
        </tr>
        <tr>
            <td width="100%" height="15" style=" font-size: 0px; line-height: 15px; mso-line-height-rule: exactly; ">&nbsp; </td>
        </tr>
            <tr>
              <td  ${display === "mobile-only" ? 'class="mbl-show-cell"' : display === "desktop-only" ? 'class="desk-show-cell"' : ""} align='${
                component.textAlign || "center"
              }' style="padding: ${component.padding || "0 20px 8px 20px"}; ${itemStyle}">
                 ${component.footerText?.reg || ""}
              </td>
            </tr>
            <tr>
              <td  ${display === "mobile-only" ? 'class="mbl-show-cell"' : display === "desktop-only" ? 'class="desk-show-cell"' : ""} align='${
                component.textAlign || "center"
              }' style="padding: ${component.padding || "0 20px 2px 20px"}; ${itemStyle}">
                 ${component.footerText?.year || ""}
              </td>
            </tr>
             <tr>
              <td  ${display === "mobile-only" ? 'class="mbl-show-cell"' : display === "desktop-only" ? 'class="desk-show-cell"' : ""} align='${
                component.textAlign || "center"
              }' style="padding: ${component.padding || "0 20px 2px 20px"}; ${itemStyle}">
                 750&nbsp;Lex<span style="display:inline-block;width:0;height:0;overflow:hidden;">&nbsp;</span>ington&nbsp;Ave<span
                style="display:inline-block;width:0;height:0;overflow:hidden;">&nbsp;</span>nue,&nbsp;4<span
                style="display:inline-block;width:0;height:0;overflow:hidden;">&nbsp;</span>th&nbsp;Floor,&nbsp;New&nbsp;York,&nbsp;NY&nbsp;10022.
              </td>
            </tr>
            <tr>
              <td  ${display === "mobile-only" ? 'class="mbl-show-cell"' : display === "desktop-only" ? 'class="desk-show-cell"' : ""} align='${
                component.textAlign || "center"
              }' style="padding: ${component.padding || "0 20px 0px 20px"}; ${itemStyle}">
                 ${component.footerText?.rights || ""} ${component.footerText?.jobcode || ""}
              </td>
            </tr>
             <tr>
                <td width="100%" height="20" style=" font-size: 0px; line-height: 20px; mso-line-height-rule: exactly; ">&nbsp; </td>
            </tr>
          </tbody>
        </table>
      `;
    }
    case "footer-with-Preferences": {
      const footerDisplay = (component.displayType ||
        "all") as EmailComponent["displayType"];
      const { classAttr, innerStyle } = getDisplayAttributes(footerDisplay);
      const linksHTML = (component.links || [])
        .map(
          (link, index) => `
      <a target="_blank" href="${link.href || "#links"}" style="color: ${index === component!.links.length - 1 ? "#FF66CC" : component.color || "#0563C1"}; font-size: ${component.fontSize || "12px"}; font-family: Arial, sans-serif; text-decoration: underline;${innerStyle ? " " + innerStyle : ""}">${(link.text || "Link").trim()}</a>${index === 1 || index === 3 ? "<br class='mobile' style='display: none;'/>" : ""}${index === 1 || index === 3 ? "<br class='mobile' style='display: none;'/>" : ""}${
        index < component.links!.length - 1
          ? index == 1
            ? `<span class='desktop' style="color:#000000; font-size:12px;">&nbsp;&nbsp;|&nbsp;</span>`
            : index === component.links!.length - 2
              ? `<span class="desktop" style="color:#FF66CC; font-size:12px;">&nbsp;&nbsp;|&nbsp;</span><span class="mobile" style="color:#FF66CC; font-size:12px; display:none; mso-hide:all;">|&nbsp;</span>`
              : `<span style="color:#000000; font-size:12px;">&nbsp;&nbsp;|&nbsp;</span>`
          : ""
      }`,
        )
        .join("");

      return `
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      bgcolor="${component.backgroundColor || "#ffffff"}"
      ${innerStyle ? `style="${innerStyle}"` : ""}
      ${footerDisplay && footerDisplay === "mobile-only" ? 'class="mbl-show-table"' : footerDisplay && footerDisplay === "desktop-only" ? 'class="desk-show-table"' : ""}
    >
      <tbody>
        <tr>
          <td bgcolor="${component.backgroundColor || "#ffffff"}" ${footerDisplay && footerDisplay === "mobile-only" ? 'class="mbl-show-cell"' : footerDisplay && footerDisplay === "desktop-only" ? 'class="desk-show-cell"' : ""} style="padding: ${component.padding || "20px 20px 20px 20px"}; text-align: ${component.textAlign || "left"}; background-color: ${component.backgroundColor || "#ffffff"};${innerStyle ? " " + innerStyle : ""}">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td align="${component.textAlign || "left"}" style="color: #FF66CC; font-size: ${component.fontSize || "12px"}; line-height: ${component.lineHeight || "12px"};">
                  ${linksHTML}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  `.trim();
    }
    case "elzonris-divider": {
      const display = (component.displayType ||
        "all") as EmailComponent["displayType"];
      const { classAttr, innerStyle } = getDisplayAttributes(display);
      return `
      <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      bgcolor="#ffffff"
        ${innerStyle ? `style="${innerStyle}"` : ""}
     ${display && display === "mobile-only" ? 'class="mbl-show-table"' : display && display === "desktop-only" ? 'class="desk-show-table"' : ""}
    > 
      <tbody>
        <tr>
          <td bgcolor="#ffffff" ${display && display === "mobile-only" ? 'class="mbl-show-cell"' : display && display === "desktop-only" ? 'class="desk-show-cell"' : ""}  align="center"   style="padding: ${component.padding || "0 20px 10px 20px"}; ${innerStyle ? innerStyle : ""}; mso-line-height-rule: exactly;">
           <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td width="100%" align="center" valign="top" style="height : 5px; ">
                   <img width="100%" height="2" src="${component.src || "/elzonris-divider.png"}" alt="${component.alt || "Divider Image"}" style="display:block; height:2px;"/>
              </tr>
              <tr>
                <td align="center" valign="center" style="color: ${component.color || "#646464"}; font-size: ${component.fontSize || "15px"}; font-family: Arial, sans-serif; font-weight: ${component.fontWeight || "bold"};padding: 10px 0 10px 0; ">
                  VISIT <a href="${component.href}" target="_blank" style="color:#F15625;text-decoration:none">ELZONRIS.COM/HCP</a><br class="mobile" style="display:none;"/> FOR MORE INFORMATION.
                </td>
              </tr>
              <tr>
                <td width="100%" align="center" valign="bottom" style="height : 5px; ">
                  <img width="100%" height="2" src="${component.src || "/elzonris-divider.png"}" alt="${component.alt || "Divider Image"}" style="display:block; height:2px;"/>
              </tr>
           </table>
          </td>
        </tr>
      </tbody>
      </table>`;
    }
   
    case "image-with-link": {
      const display = (component.displayType ||
        "all") as EmailComponent["displayType"];
      const { classAttr, innerStyle } = getDisplayAttributes(display);

      const imgStyle = `
      
        height: ${component.height || "auto"};
       
        max-width:${component.maxWidth || "100%"};
       
      `.trim();

      return `
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          align="center"
           ${innerStyle ? `style="${innerStyle}"` : ""}
        ${display === "mobile-only" ? 'class="mbl-show-table"' : display === "desktop-only" ? 'class="desk-show-table"' : ""}
        >
          <tbody>
            <tr>
              <td width="${(component.width || "100%").toString().replace("px", "")}" ${display === "mobile-only" ? 'class="mbl-show-cell"' : display === "desktop-only" ? 'class="desk-show-cell"' : ""} align='${
                component.textAlign || "center"
              }' style="padding: ${component.padding || "0 0 0 0"}; mso-line-height-rule: exactly;">
                <a href="${component.href || "#"}" target="_blank" style="text-decoration: none;">
                 <img 
                    width="${(component.width || "100%").toString().replace("px", "")}"
                    src="${component.src || ""}" 
                    alt="${component.alt || "Image"}"
                    border="0"
                    style="${imgStyle} display: block;"
                  />
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      `;
    }
    case "ferring-footer": {
      const display = (component.displayType ||
        "all") as EmailComponent["displayType"];
      const { classAttr, innerStyle } = getDisplayAttributes(display);

      const socialMediaLinksHtml = (component.socialMediaLinks || [])
        .map(
          (link) => `
          <td bgcolor="#0083BF" style="padding: 0 10px 0 10px;">
            <a style="cursor: pointer; text-decoration: none;"
                href="${link.href}" target="_blank">
                <img width="33" src="${link.iconSrc}" alt="${link.altText}">
            </a>
          </td>
        `,
        )
        .join("");

      const mobileSocialMediaLinksHtml = (component.socialMediaLinks || [])
        .map(
          (link, index) => `
          <td bgcolor="#0083BF" ${index === 1 ? 'style="padding: 0 10px 0 10px;"' : ""}>
            <a style="cursor: pointer; text-decoration: none;"
                href="${link.href}" target="_blank">
                <img width="33" src="${link.iconSrc}" alt="${link.altText}">
            </a>
          </td>
        `,
        )
        .join("");

      const footerLinksHtml = (component.links || [])
        .map(
          (link, index) =>
            `
          <tr bgcolor="#0083BF">
              <td style="text-align: right;font-size: 10px;line-height: 12px;color: #ffffff;${index !== 0 ? "padding: 2px 0 0 0;" : ""}" bgcolor="#0083BF">
                  <a href="${link.href}" style="text-decoration: underline;color: #ffffff;">
                      ${link.text}
                  </a>
              </td>
          </tr>
      `,
        )
        .join("");

      const mobileFooterLinksHtml = (component.links || [])
        .map(
          (link, index) =>
            `
          <tr bgcolor="#0083BF">
              <td align="center" style="text-align: center;font-size: 10px;line-height: 12px;color: #ffffff;padding: 10px 0  10px 0; " bgcolor="#0083BF">
                  <a href="${link.href}" style="text-decoration: underline;color: #ffffff;">
                      ${link.text}
                  </a>
              </td>
          </tr>
      `,
        )
        .join("");

      return `
        <table 
        width="100%" 
        align="center" 
        bgcolor="#FFFFFF" 
        border="0" 
        cellspacing="0" 
        cellpadding="0"
       
        >
            <tr>
                <td width="100%" style="padding: 20px 0 0px 0;">
                    <table class="desk-show-table" bgcolor="#0083BF" width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr bgcolor="#0083BF">
                            <td bgcolor="#0083BF">
                                <table width="100%" bgcolor="#0083BF">
                                    <td bgcolor="#0083BF" align="left" width="50%" style="padding: 30px 0 20px 30px;">
                                        <img src="${component.logo?.logoSrc}" width="112" alt="${component.logo?.altTex}" >
                                    </td>
        
                                    <td valign="top" align="right" bgcolor="#0083BF" width="50%" style="padding: 30px 20px 20px 0;">
                                        <table bgcolor="#0083BF">
                                            <tr bgcolor="#0083BF">
                                                ${socialMediaLinksHtml}
                                            </tr>
                                        </table>
                                    </td>
                                </table>
                            </td>
                        </tr>
                        <tr bgcolor="#0083BF">
                          <td style="color: #ffffff;font-size: 10px;line-height: 12px;padding: 0 0 10px 30px;" bgcolor="#0083BF">
                              Ferring Pharmaceuticals,<br/><span style="color:#FF00C7">${component.address}</span><br />&zwj;${component.jobCode}&zwj;
                          </td>
                        </tr>
                        <tr bgcolor="#0083BF">
                            <td width="100%" bgcolor="#0083BF">
                                <table width="100%" bgcolor="#0083BF">
                                    <tr bgcolor="#0083BF">
                                        <td valign="top" width="70%" align="left" style="padding: 0 0 30px 30px;" bgcolor="#0083BF">
                                            <table bgcolor="#0083BF">
                                               
                                                <tr bgcolor="#0083BF"> 
                                                    <td
                                                        style="color: #ffffff;font-size: 10px;line-height: 12px;" bgcolor="#0083BF">
                                                        &#169; 2026 Ferring<br />
                                                        FERRING and the Ferring Pharmaceuticals logo are trademarks of the
                                                        Ferring.<br />
                                                        For healthcare professionals only.<br/>
                                                        This material is intended for medical and/or commercial use in<br/>
                                                        accordance with local laws and regulations.
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                        <td width="30%" valign="top" align="right" style="padding: 0 30px 30px 0;" bgcolor="#0083BF">
                                            <table align="right" valign="top" bgcolor="#0083BF">
                                               ${footerLinksHtml}
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                  </table>
                  <!--[if !mso]><!-->
                    <table class="mbl-show-table" bgcolor="#0083BF" width="100%" border="0" cellspacing="0" cellpadding="0" style="display:none;">
                        <tr bgcolor="#0083BF" align="center">
                          <td bgcolor="#0083BF" align="center" width="100%" style="padding: 20px;">
                            <table align="center" bgcolor="#0083BF">
                              <tr bgcolor="#0083BF" align="center">
                                <td bgcolor="#0083BF" style="padding: 10px 0px 20px 0px;">
                                  <img src="${component.logo?.logoSrc}" width="112" alt="${component.logo?.altTex}" >
                                </td>
                              </tr>
                              <tr bgcolor="#0083BF" align="center">
                                <td bgcolor="#0083BF" style="padding: 0px 0px 10px 0px;">
                                  <table bgcolor="#0083BF">
                                    <tr bgcolor="#0083BF">
                                        ${mobileSocialMediaLinksHtml}
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                              ${mobileFooterLinksHtml}
                              <tr bgcolor="#0083BF" align="center">
                                <td bgcolor="#0083BF" style="color: #ffffff;font-size: 10px;line-height: 12px;padding: 10px 0 0 0;" bgcolor="#0083BF">
                                  Ferring Pharmaceuticals,<br/><span style="color:#FF00C7">${component.address}</span>
                                 </td>
                              </tr>
                              <tr bgcolor="#0083BF" align="center">
                                <td bgcolor="#0083BF" style="color: #ffffff;font-size: 10px;line-height: 12px;padding: 10px 0 0px 0;" bgcolor="#0083BF">
                                    ${component.jobCode}
                                </td>
                              </tr>
                              <tr bgcolor="#0083BF" align="center">
                                <td bgcolor="#0083BF" style="color: #ffffff;font-size: 10px;line-height: 12px;" bgcolor="#0083BF">
                                    &#169; 2026 Ferring
                                </td>
                              </tr> 
                              <tr bgcolor="#0083BF" align="center">
                                <td bgcolor="#0083BF" style="color: #ffffff;font-size: 10px;line-height: 12px;" bgcolor="#0083BF">
                                    FERRING and the Ferring Pharmaceuticals logo are<br/>trademarks of the Ferring.
                                </td>
                              </tr> 
                              <tr bgcolor="#0083BF" align="center">
                                <td bgcolor="#0083BF" style="color: #ffffff;font-size: 10px;line-height: 12px;" bgcolor="#0083BF">
                                    For healthcare professionals only.
                                </td>
                              </tr> 
                              <tr bgcolor="#0083BF" align="center">
                                <td bgcolor="#0083BF" style="color: #ffffff;font-size: 10px;line-height: 12px;padding:0 0 10px 0" bgcolor="#0083BF">
                                    This material is intended for medical and/or commercial use in<br/>accordance with local laws and regulations.
                                </td>
                              </tr> 
                            </table> 
                          </td>
                        </tr>
                    </table>
                  <!--[endif]-->
                </td>
            </tr>
        </table>
      `;
    }
    case "elzonris-isi":
      return `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
        <tbody>
          <tr>
            <td style="padding: ${component.padding || "0 20px 0 20px"}; font-family: ${component.fontFamily || "Arial, sans-serif"};">
              <div style="font-family: ${component.fontFamily || "Arial, sans-serif"};">
                ${component.html || ""}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      `;

    case "elzonris-references": {
      return `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tbody><tr>
          <td style="padding: ${component.padding || "0 20px 10px 20px"};">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td align="left" valign="middle" style="color:#646464; font-family:Arial,sans-serif; font-weight:400; font-size:12px; line-height:14px;">
                  <strong>References:&nbsp;</strong>${component.references || ""}
                </td>
              </tr>
            </table>
          </td>
        </tr></tbody>
      </table>
      `.trim();
    }

    case "elzonris-abbreviations": {
      return `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tbody><tr>
          <td style="padding: ${component.padding || "0 20px 10px 20px"};">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td align="left" valign="middle" style="color:#646464; font-family:Arial,sans-serif; font-weight:400; font-size:12px; line-height:14px;">
                  <b>Abbreviations:</b> ${component.abbreviations || ""}
                </td>
              </tr>
            </table>
          </td>
        </tr></tbody>
      </table>
      `.trim();
    }

    case "elzonris-ref-abbr": {
      return `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tbody>
          <tr>
            <td style="padding: ${component.padding || "0 20px 10px 20px"};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                ${component.references ? `
                <tr>
                  <td align="left" valign="middle" style="color:#646464; font-family:Arial,sans-serif; font-weight:400; font-size:12px; line-height:14px;">
                    <strong>References:&nbsp;</strong>${component.references}
                  </td>
                </tr>` : ""}
                ${component.abbreviations ? `
                <tr>
                  <td height="6" style="font-size:0; line-height:6px; mso-line-height-rule:exactly;">&nbsp;</td>
                </tr>
                <tr>
                  <td align="left" valign="middle" style="color:#646464; font-family:Arial,sans-serif; font-weight:400; font-size:12px; line-height:14px;">
                    <b>Abbreviations:</b> ${component.abbreviations}
                  </td>
                </tr>` : ""}
              </table>
            </td>
          </tr>
        </tbody>
      </table>
      `.trim();
    }

    case "elzonris-yellow-cta": {
      const ctaDisplay = (component.displayType || "all") as EmailComponent["displayType"];
      const { innerStyle: ctaInnerStyle } = getDisplayAttributes(ctaDisplay);
      const ctaWidth = component.width || "300px";
      const ctaBg = component.backgroundColor || "#f55a1f";
      const ctaColor = component.color || "#ffffff";
      return `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" ${ctaDisplay === "mobile-only" ? 'class="mbl-show-table"' : ctaDisplay === "desktop-only" ? 'class="desk-show-table"' : ""} ${ctaInnerStyle ? `style="${ctaInnerStyle}"` : ""}>
        <tbody>
          <tr>
            <td align="center" style="padding: ${component.padding || "0"};">
              <table role="presentation" width="${ctaWidth.replace("px","")}" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td bgcolor="${ctaBg}" data-ogsc="${ctaBg}" class="elzonris-cta-bg" style="
                    background-color: ${ctaBg} !important;
                    ${component.height ? `height: ${component.height};` : "padding: 18px 0;"}
                    padding-left: 30px;
                    padding-right: 30px;
                    width: ${ctaWidth};
                  ">
                    <a href="${component.href || "#"}" target="_blank" style="text-decoration: none; display: block; width: ${ctaWidth};">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td data-ogsc="${ctaColor}" class="elzonris-cta-text" style="
                            color: ${ctaColor} !important;
                            font-family: Arial, Helvetica, sans-serif;
                            font-size: ${component.fontSize || "28px"};
                            font-weight: ${component.fontWeight || "bold"};
                            line-height: 1.2;
                          ">${component.text || "Know more about durable responses with ELZONRIS"}</td>
                          <td width="40" align="right" data-ogsc="${ctaColor}" class="elzonris-cta-text" style="
                            color: ${ctaColor} !important;
                            font-family: Arial, Helvetica, sans-serif;
                            font-size: 34px;
                            font-weight: bold;
                            white-space: nowrap;
                          ">&#8250;</td>
                        </tr>
                      </table>
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
      `;
    }

    default:
      return "";
  }
}

export function generateEmailHTML(
  components: EmailComponent[],
  preHeaderText?: string,
): string {
  const componentHTML = components
    .map((component) => generateComponentHTML(component))
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
          <!--Set the initial scale of the email.-->
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <!--Force Outlook clients to render with a better MS engine.-->
          <meta http-equiv="X-UA-Compatible" content="IE=Edge">
          <!--Help prevent blue links and autolinking-->
          <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
          <!--prevent Apple from reformatting and zooming messages.-->
          <meta name="x-apple-disable-message-reformatting">

          <!--target dark mode-->
          <meta name="color-scheme" content="light">
          <meta name="supported-color-schemes" content="light">

    <title>Email Template</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:AllowPNG/>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->

    <!--to support dark mode meta tags-->
    <style type="text/css">
          :root {
              color-scheme: light dark;
              supported-color-schemes: light dark;
          }
    </style>
    <style>
        /* Reset styles */
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
           
            border: 0;
            outline: none;
            text-decoration: none;
            height: auto;
            line-height: 100%;
            text-decoration: none;
        }

         .desk-show-table {
            display: table !important;
        }

        .desk-show-tr {
            display: table-row !important;
        }

        .desk-show-cell {
            display: table-cell !important;
        }


        .mbl-show-table {
            display: none !important;
        }

        .mbl-show-tr {
            display: none !important;
        }

        .mbl-show-cell {
            display: none !important;
        }
       

        sup {
            line-height: 0;
            font-size: 60%;
            mso-ansi-font-size: 95%;
        }

        a:link.no-underline {
            text-decoration: none !important;
        }

       
        sup {
            line-height: 0;
        }
        
        /* Client-specific styles */
        .ReadMsgBody { width: 100%; }
        .ExternalClass { width: 100%; }
        .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {
            line-height: 100%;
        }

        a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: none !important;
            font-size: inherit !important;
            font-family: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
        }

        .mobile {
          display: none !important;
        }

        .desktop {
          display: inline-block !important;
        }

        @media (prefers-color-scheme: dark) {
      .dark-img {
        display: block !important;
        width: auto !important;
        overflow: visible !important;
        float: none !important;
        max-height: inherit !important;
        max-width: inherit !important;
        line-height: auto !important;
        margin-top: 0 !important;
        visibility: inherit !important;
      }
 
      .light-img {
        display: none !important;
      }
   .darkmode {
            background-color: #ffffff !important;
            background-image: linear-gradient(#ffffff, #ffffff) !important;
         }
 
               .dm_text {
            color: #000000 !important;
         }
 
      .linkLightBlue {
        color: #00acdf !important;
      }
 
      #initial-table {
        background-color: #eee !important;
      }
 
      .dark_td {
        background-color: #545252 !important;
      }
 
 
           /* Force white bg on all content tables */
         .darkmode, .darkmode td, .darkmode table {
            background-color: #ffffff !important;
            background-image: linear-gradient(#ffffff, #ffffff) !important;
         }
 
         /* Dark body text */
         .dm-text {
            color: #000000 !important;
         }
 
         /* Green headings */
         .dm-green {
            color: #006937 !important;
         }
 
         /* Navy text */
         .dm-navy {
            color: #183559 !important;
         }
 
         /* Blue links */
         .dm-link, .dm-link a {
            color: #0563C1 !important;
         }
 
         /* Footer grey bg */
         .dm-footer {
            background-color: #F1F1F1 !important;
         }

         /* Elzonris CTA - keep brand colors in dark mode */
         .elzonris-cta-bg {
            background-color: #f55a1f !important;
         }
         .elzonris-cta-text {
            color: #ffffff !important;
         }
    }

        @media only screen and (max-width: 480px) {

            .mobile {
                display: inline-block !important;
              }

              .desktop {
                display: none !important;
              }

                .desk-show-table {
                display: none !important;
            }

            .desk-show-tr {
                display: none!important;
            }

            .desk-show-cell {
                display: none !important;
            }
          
             .mbl-show-table {
                display: table !important;
            }

            .mbl-show-tr {
                display: table-row !important;
            }

            .mbl-show-cell {
                display: table-cell !important;
            }
           
       

            .mbl-text-center {
                text-align: center !important;
            }

             .footer-link-col {
                display: block !important;
                width: 95% !important;
                text-align: center !important;
              }

               .mbl-pL0 {
              padding-left: 0 !important;
            }

            .mbl-pR0 {
              padding-right: 0 !important;
            }

            .mbl-pT10 {
              padding-top : 10px !important;
            }

            .brand-logo-col {
              display: block !important;
              width: 100% !important;
              text-align: center !important;
              padding: 8px 0 !important;
            }

            .brand-logo-col img {
              margin: 0 auto !important;
            }

        }
        
        /* Mobile styles */
        @media only screen and (max-width: 600px) {

            .email-container {
                width: 100% !important;
                max-width: 100% !important;
            }

            .w90p {
              width: 90% !important;
            }

            .w95p {
              width: 95% !important;
            }

            .w100p {
              display: block !important;
              width: 100% !important;
              max-width: 100% !important;
            }

           

            .mbl-center{
              text-align : center !important;
            }
        }
    </style>
</head>
<body style=" margin: 0 !important; padding: 0 !important; font-family: Arial, sans-serif; " topmargin="0"
   leftmargin="0" marginheight="0" marginwidth="0">
    <div
        style=" display: none !important; mso-hide: all; font-size: 1px; color: #fefefe; line-height: 1px; font-family: Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; ">
        ${preHeaderText ? preHeaderText : "&nbsp;"}&nbsp; </div>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f4f4;">
        <tr>
            <td align="center" style="background-color: #eeeeee" bgcolor="#EEEEEE">
                <table class="email-container" cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; max-width: 600px;">
                <tr>
                    <td>
                      ${componentHTML}
                    </td>
                </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `.trim();
}
