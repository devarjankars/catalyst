import type { EmailComponent } from "@/types/email-builder";
import { getDisplayAttributes } from "./style-generator";
import { generateColumnHtml } from "./column-html-generator";

function generateComponentHTML(component: EmailComponent): string {
  switch (component.type) {
    case "section":
      const childrenHTML = (component.children || [])
        .map((child) => generateComponentHTML(child))
        .join("");

      const display = (component.displayType ||
        "all") as EmailComponent["displayType"];
      const { classAttr, innerStyle } = getDisplayAttributes(display);

      const getColumnStyles = (child: EmailComponent) => {
        if (!child.isColumn) return "";

        const alignment = child.columnAlignment || "left";
        const verticalAlignment = child.columnVerticalAlignment || "center";
        const width =
          child.columnWidth === "auto" ? undefined : child.columnWidth;

        return `
      text-align: ${alignment};
      vertical-align: ${
        verticalAlignment === "top"
          ? "top"
          : verticalAlignment === "middle"
          ? "middle"
          : "bottom"
      };
      ${width ? `width: ${width};` : ""}
      min-height: ${child.columnMinHeight || "120px"};
    `;
      };

      return `
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      align="center"
      ${classAttr ? classAttr : ""}
      
     ${innerStyle ? ` ${innerStyle}` : ""}"
    >
      <tr>
        <td ${classAttr ? classAttr : ""} style="padding: ${
        component.padding || "20px"
      };${innerStyle ? ` ${innerStyle}` : ""}">
          <table
            cellpadding="0"
            cellspacing="0"
            border="0"
            width="100%"
            align="center"
            ${classAttr ? classAttr : ""}
            style="
              
              border-radius: ${component.borderRadius || "0px"};
              max-width: ${component.maxWidth || "600px"};
              margin: ${component.margin || "0 auto"};
              ${component.isColumn ? getColumnStyles(component) : ""}
              ${innerStyle ? ` ${innerStyle}` : ""}
            "
          >
            ${
              component.columns && component.columns > 1 ? 
              generateColumnHtml({component,generateComponentHTML}) :

              generateColumnHtml({component,generateComponentHTML,childHtml:childrenHTML})
            }
          </table>
        </td>
      </tr>
    </table>
  `.trim();

    case "text": {
      const display = (component.displayType ||
        "all") as EmailComponent["displayType"];

      const { classAttr, innerStyle } = getDisplayAttributes(display);

      const divStyle = `
        font-size: ${component.fontSize || "16px"};
        color: ${component.color || "#000000"};
        text-align: ${component.textAlign || "left"};
        font-weight: ${component.fontWeight || "normal"};
        font-family: Arial, sans-serif;
        line-height: 1.5;
        background-color: ${component.backgroundColor || "transparent"};
      `.trim();

      return `
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          ${classAttr ? classAttr : ""}
          ${innerStyle ? `style="${innerStyle}"` : ""}
        >
          <tbody>
            <tr>
              <td style="padding: ${
                component.padding || "16px"
              }; background-color:${
        component.backgroundColor || "transparent"
      };" >
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
        display: block;
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
         ${classAttr ? classAttr : ""}
          ${innerStyle ? `style="${innerStyle}"` : ""}
        >
          <tbody>
            <tr>
              <td width=${component.width} ${classAttr ? classAttr : ""} align='${
        component.textAlign || "center"
      }' style="padding: ${component.padding || "16px"};${innerStyle}">
                <table ${classAttr ? classAttr : ""} cellpadding="0" width="100%" align="center" valign="center" cellspacing="0" border="0" role="presentation" ${innerStyle ? `style="${innerStyle}"` : ""}>
                  <tr>
                    <td align='${
                      component.textAlign || "center"
                    }' ${classAttr ? classAttr : ""} ${innerStyle ? `style="${innerStyle}"` : ""}>
                        <img 
                          width="${component.width || "100%"}"
                          src="${component.src || ""}" 
                          alt="${component.alt || "Image"}"
                          style="${imgStyle}"
                        />
                    </td>
                  </tr>
                </table>
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
        ${innerStyle}
      `.trim();

      return `
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          ${classAttr ? classAttr : ""}
          ${innerStyle ? `style="${innerStyle}"` : ""}
        >
          <tbody>
            <tr>
              <td style="padding: ${component.padding || "16px"}; text-align: ${
        component.textAlign || "center"
      };">
                <table ${classAttr ? classAttr : ""} cellpadding="0" cellspacing="0" border="0" ${innerStyle ? `style="${innerStyle}"` : ""}>
                  <tr>
                    <td ${classAttr ? classAttr : ""} style="
                      background-color: ${
                        component.backgroundColor || "#007bff"
                      };
                      border-radius: ${component.borderRadius || "4px"};
                      padding: ${component.buttonPadding || "12px 24px"};
                      ${innerStyle ? ` ${innerStyle}` : ""}
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
    height: ${component.height || "1px"};
    background-color: ${component.backgroundColor || "#e0e0e0"};
    margin: ${component.margin || "20px 0"};
    ${innerStyle}
  `.trim();

      return `
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      ${classAttr ? classAttr : ""}
      ${innerStyle ? `style="${innerStyle}"` : ""}
    >
      <tbody>
        <tr>
          <td ${classAttr ? classAttr : ""} style="padding: ${component.padding || "16px"};${innerStyle ? ` ${innerStyle}` : ""}" >
            <table ${classAttr ? classAttr : ""} cellpadding="0" cellspacing="0" border="0" width="100%" ${innerStyle ? `style="${innerStyle}"` : ""}>
              <tr>
                <td style="${dividerStyle}"></td>
              </tr>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  `;
    }
    case "custom":
      return `${component.html}`;

    case "cta-button": {
      const ctaDisplay = (component.displayType ||
        "all") as EmailComponent["displayType"];
      const { classAttr, innerStyle } = getDisplayAttributes(ctaDisplay);

      const ctaStyle = `
    display: inline-block;
    padding: ${component.buttonPadding || "12px 24px"};
    text-decoration: none;
    ${innerStyle}
  `.trim();

      return `
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      align="center"
      ${classAttr ? classAttr : ""}
      ${innerStyle ? `style="${innerStyle}"` : ""}
    >
      <tbody>
        <tr>
          <td ${classAttr ? classAttr : ""} align="center" style="text-align:center;padding: ${
        component.padding || "16px;"
      };${innerStyle}">
            <table ${classAttr ? classAttr : ""} align="center" cellpadding="0" cellspacing="0" border="0" width="100%" ${innerStyle ? `style="${innerStyle}"` : ""}>
              <tr>
                <td ${classAttr ? classAttr : ""} align="center" ${innerStyle ? `style="${innerStyle}"` : ""} >
                      <a href="${
                        component.href || "#"
                      }" style="${ctaStyle}" target="_blank">
                        <img
                          src="${component.imageSrc || "/cta-placeholder.png"}"
                          alt="${component.imageAlt || "CTA Image"}"
                          style="
                            width: ${component.width || "470px"};
                            height: ${component.height || "auto"};
                            display: block;
                            max-width: 100%;
                            margin: 0 auto;
                            border: 0;
                            ${innerStyle ? ` ${innerStyle}` : ""}
                          "
                        />
                      </a>
                </td>
              </tr>
            </table
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
      <a href="${link.href || "#"}" style="color: ${
            component.color || "#0000EE"
          }; text-decoration: underline; font-size: ${
            component.fontSize || "14px"
          }; margin-right: 10px;">
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
    `
        )
        .join("");
      return `
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
     ${classAttr ? classAttr : ""}
      ${innerStyle ? `style="${innerStyle}"` : ""}
    >
      <tbody>
        <tr>
          <td ${classAttr ? classAttr : ""} style="padding: ${component.padding || "16px"}; text-align: ${
        component.textAlign || "left"
      }; background-color: ${component.backgroundColor || "#fffff"};${innerStyle ? ` ${innerStyle}` : ""}">
            <div style="color: ${component.color || "#000000"}; font-size: ${
        component.fontSize || "14px"
      }; line-height: 1.5;${innerStyle ? ` ${innerStyle}` : ""}">
              ${linksHTML}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  `;
    }

    case "isi": {
      return `
       <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
       <tbody>
          <tr>
            <td style="padding: 20px;">
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
                                                      <td class="yellow" valign="top" width="7" v_align="top"
                                                         symbol="&amp;bull;" style="color: #6BCDB2">•</td>
                                                      <td width="3" height="1"
                                                         style=" font-size: 0px; line-height: 1px; mso-line-height-rule: exactly; ">
                                                         &nbsp; </td>
                                                      <td class="f_14 black f_normal" align="left" valign="top"
                                                         style=" font-weight: 400; color: #2B2E34; font-family: Arial, sans-serif; font-size: 14px; line-height: 18px; ">
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
                                                      <td class="yellow" valign="top" width="7" v_align="top"
                                                         symbol="&amp;bull;" style="color: #6BCDB2">•</td>
                                                      <td width="3" height="1"
                                                         style=" font-size: 0px; line-height: 1px; mso-line-height-rule: exactly; ">
                                                         &nbsp; </td>
                                                      <td class="f_14 black f_normal" align="left" valign="top"
                                                         style=" font-weight: 400; color: #2B2E34; font-family: Arial, sans-serif; font-size: 14px; line-height: 18px; ">
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
                                                      <td class="yellow" valign="top" width="7" v_align="top"
                                                         symbol="&amp;bull;" style="color: #6BCDB2">•</td>
                                                      <td width="3" height="1"
                                                         style=" font-size: 0px; line-height: 1px; mso-line-height-rule: exactly; ">
                                                         &nbsp; </td>
                                                      <td class="f_14 black f_normal" align="left" valign="top"
                                                         style=" font-weight: 400; color: #2B2E34; font-family: Arial, sans-serif; font-size: 14px; line-height: 18px; ">
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
                                                      <td class="yellow" valign="top" width="7" v_align="top"
                                                         symbol="&amp;bull;" style="color: #6BCDB2">•</td>
                                                      <td width="3" height="1"
                                                         style=" font-size: 0px; line-height: 1px; mso-line-height-rule: exactly; ">
                                                         &nbsp; </td>
                                                      <td class="f_14 black f_normal" align="left" valign="top"
                                                         style=" font-weight: 400; color: #2B2E34; font-family: Arial, sans-serif; font-size: 14px; line-height: 18px; ">
                                                         <span class="f_bold" style="font-weight: 700">The most common
                                                            adverse reactions&nbsp;</span>(≥10%), including laboratory
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
                                                      <td class="yellow" valign="top" width="7" v_align="middle"
                                                         symbol="&amp;bull;" style="color: #6BCDB2">•</td>
                                                      <td width="3" height="1"
                                                         style=" font-size: 0px; line-height: 1px; mso-line-height-rule: exactly; ">
                                                         &nbsp; </td>
                                                      <td class="f_14 black f_normal" align="left" valign="top"
                                                         style=" font-weight: 400; color: #2B2E34; font-family: Arial, sans-serif; font-size: 14px; line-height: 18px; ">
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
                                                      <td class="yellow" valign="top" width="7" v_align="middle"
                                                         symbol="&amp;bull;" style="color: #6BCDB2">•</td>
                                                      <td width="3" height="1"
                                                         style=" font-size: 0px; line-height: 1px; mso-line-height-rule: exactly; ">
                                                         &nbsp; </td>
                                                      <td class="f_14 black f_normal" align="left" valign="top"
                                                         style=" font-weight: 400; color: #2B2E34; font-family: Arial, sans-serif; font-size: 14px; line-height: 18px; ">
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
                                                      <td class="yellow" valign="top" width="7" v_align="middle"
                                                         symbol="&amp;bull;" style="color: #6BCDB2">•</td>
                                                      <td width="3" height="1"
                                                         style=" font-size: 0px; line-height: 1px; mso-line-height-rule: exactly; ">
                                                         &nbsp; </td>
                                                      <td class="f_14 black f_normal" align="left" valign="top"
                                                         style=" font-weight: 400; color: #2B2E34; font-family: Arial, sans-serif; font-size: 14px; line-height: 16px; ">
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
       padding-bottom: 3px
       ${innerStyle}
      `.trim();

      const itemStyle = `
        color: ${component.color || "#000000"};
        font-size: ${component.fontSize || "16px"};
        font-weight: ${component.fontWeight || "normal"};
        text-align: ${component.textAlign || "left"};
        line-height: ${component.lineHeight || "18px"};
        padding-left: 5px;
        font-family: Arial, sans-serif;
        ${innerStyle}
      `.trim();
      
      const listItemsHTML = (component.listItems || [])
        .map(
          (item) => `
        <tr >
          <td  align="left" valign="top" width="2%" style="${bulletStyle}">&bullet;</td>
          
          <td align="left" valign="middle" style="${itemStyle}">
            ${item}
          </td>
        </tr>
        <tr><td  height=${component.spaceBetweenItems?.slice(0,3)} style=" font-size: 0px; line-height: ${component.spaceBetweenItems}; mso-line-height-rule: exactly; ">&nbsp; </td></tr>
      `
        )
        .join("");

      return `
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      ${classAttr ? classAttr : ""}
      ${innerStyle ? `style="${innerStyle}"` : ""}
    >
      <tbody>
        <tr>
          <td ${classAttr ? classAttr : ""} style="padding: ${component.padding || "16px"}; background-color: ${component.backgroundColor || "transparent"};${innerStyle ? ` ${innerStyle}` : ""}">
            <table ${classAttr ? classAttr : ""} cellpadding="0" cellspacing="0" border="0" width="100%" ${innerStyle ? `style="${innerStyle}"` : ""}>
              <tbody>
                ${listItemsHTML}
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  `;

      // <tr>
      //  <td class="bullet" align="left" valign="top" width="2%" style=" font-size: 15px; line-height: 16px; color: #5D5D5D; ">•</td>
      //  <td width="5" height="1" style=" font-size: 0px; line-height: 1px; mso-line-height-rule: exactly; ">&nbsp; </td>
      //  <td align="left" valign="middle" style=" color: #5D5D5D; font-family: Arial, sans-serif; font-weight: 400; font-size: 12px  line-height: 17px; ">
      // The median time to CR/CRc in the pivotal cohort was <b>57 days</b>&nbsp;(‍range, 14-107 days; n=13‍) and 43 days (‍range,    14-131 days; n=29‍) in all cohorts<sup>2-4</sup>
      // </td>
      // </tr>
    }

    case "header-image" : {
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
      ${classAttr ? classAttr : ""}
      ${innerStyle ? `style="${innerStyle}"` : ""}
    >
      <tbody>
        <tr>
          <td ${classAttr ? classAttr : ""} align="center" style="padding: ${component.padding || "0"};${innerStyle ? ` ${innerStyle}` : ""}">
            <img
              width="${component.width || "600px"}"
              src="${component.src || "/header-placeholder.png"}"
              alt="${component.imageAlt || "Header Image"}"
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
    default:
      return "";
  }
}

export function generateEmailHTML(components: EmailComponent[]): string {
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
          <meta name="color-scheme" content="light dark">
          <meta name="supported-color-schemes" content="light dark only">

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
            -ms-interpolation-mode: bicubic;
            border: 0;
            outline: none;
            text-decoration: none;
            height: auto;
            line-height: 100%;
            text-decoration: none;
        }
        
        /* Client-specific styles */
        .ReadMsgBody { width: 100%; }
        .ExternalClass { width: 100%; }
        .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {
            line-height: 100%;
        }

        .mobile {
          display: none !important;
        }

        .desktop {
          display: inline-block !important;
        }

        @media only screen and (max-width: 480px) {

            .mobile {
                display: block !important;
              }

              .desktop {
                display: none !important;
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

            .pL0 {
              padding-left: 0 !important;
            }

            .pR0 {
              padding-right: 0 !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f4f4;">
        <tr>
            <td align="center" >
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
