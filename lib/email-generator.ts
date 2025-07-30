import type { EmailComponent } from "@/types/email-builder";
import { getDisplayAttributes } from "./style-generator";

function generateComponentHTML(component: EmailComponent): string {
  switch (component.type) {
    case "section":
  const childrenHTML = (component.children || [])
    .map((child) => generateComponentHTML(child))
    .join("");

  const display = (component.displayType || "all") as EmailComponent["displayType"];
  const { classAttr,  innerStyle } = getDisplayAttributes(display);
  

  const getColumnStyles = (child: EmailComponent) => {
    if (!child.isColumn) return "";

    const alignment = child.columnAlignment || "left";
    const verticalAlignment = child.columnVerticalAlignment || "top";
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
      ${classAttr}
      bgcolor="${component.backgroundColor || "#ffffff"}"
      style="background-color: ${component.backgroundColor || "#ffffff"};${innerStyle}"
    >
      <tr>
        <td ${classAttr} style="padding: ${component.padding || "20px"};${innerStyle}">
          <table
            cellpadding="0"
            cellspacing="0"
            border="0"
            width="100%"
            ${classAttr}
            style="
              background-color: ${component.backgroundColor || "#ffffff"};
              border-radius: ${component.borderRadius || "0px"};
              max-width: ${component.maxWidth || "600px"};
              margin: ${component.margin || "0 auto"};
              ${component.isColumn ? getColumnStyles(component) : ""}
              ${innerStyle}
            "
          >
            ${
              component.direction === "row"
                ? `
              <tr>
                ${(component.children || [])
                  .map(
                    (child, index) => `
                    <td
                      
                      valign="${
                        child.columnVerticalAlignment || "top"
                      }"
                      align="${child.columnAlignment || "left"}"
                      width="${
                        child.columnWidth === "auto"
                          ? `${100 / (component.children?.length || 1)}%`
                          : child.columnWidth ||
                            `${100 / (component.children?.length || 1)}%`
                      }"
                      style="
                        vertical-align: ${
                          child.columnVerticalAlignment || "top"
                        };
                        text-align: ${child.columnAlignment || "left"};
                        padding: ${child.padding || "15px"};
                        background-color: ${
                          child.backgroundColor || "transparent"
                        };
                        border-radius: ${child.borderRadius || "0px"};
                        ${
                          index <
                          (component.children?.length || 1) - 1
                            ? "padding-right: 10px;"
                            : ""
                        }
                        min-height: ${child.columnMinHeight || "120px"};
                       
                      "
                    >
                      ${generateComponentHTML(child)}
                    </td>
                  `
                  )
                  .join("")}
              </tr>
            `
                : `
              <tr>
                <td >
                  ${childrenHTML}
                </td>
              </tr>
            `
            }
          </table>
        </td>
      </tr>
    </table>
  `;


    case "text": {
      const display = (component.displayType ||
        "all") as EmailComponent["displayType"];

      const { classAttr, innerStyle } =
        getDisplayAttributes(display);

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
          ${classAttr}
          ${innerStyle ? `style="${innerStyle}"` : ""}
        >
          <tbody>
            <tr>
              <td style="padding: ${component.padding || "16px"}; background-color:${component.backgroundColor || 'transparent'};" >
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
      const { classAttr, innerStyle } =
        getDisplayAttributes(display);

      const imgStyle = `
        width: ${component.width || "100%"};
        height: ${component.height || "auto"};
        display: block;
        max-width: 100%;
        ${innerStyle}
      `.trim();

      return `
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          ${classAttr}
          ${innerStyle ? `style="${innerStyle}"` : ""}
        >
          <tbody>
            <tr>
              <td style="padding: ${component.padding || "16px"};${innerStyle}">
                <img 
                  src="${component.src || ""}" 
                  alt="${component.alt || "Image"}"
                  style="${imgStyle}"
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
      const { classAttr, tableStyle, innerStyle } =
        getDisplayAttributes(display);

      const linkStyle = `
        color: ${component.color || "#ffffff"};
        text-decoration: none;
        font-family: Arial, sans-serif;
        font-weight: bold;
        display: inline-block;
        ${innerStyle}
      `.trim();

      return `
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          ${classAttr}
          ${tableStyle}
        >
          <tbody>
            <tr>
              <td style="padding: ${component.padding || "16px"}; text-align: ${
            component.textAlign || "center"
          };">
                <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                  <tr>
                    <td style="
                      background-color: ${component.backgroundColor || "#007bff"};
                      border-radius: ${component.borderRadius || "4px"};
                      padding: ${component.buttonPadding || "12px 24px"};
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
      const { classAttr, tableStyle, innerStyle } =
        getDisplayAttributes(display);

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
      ${classAttr}
      ${tableStyle}
    >
      <tbody>
        <tr>
          <td style="padding: ${component.padding || "16px"};" >
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
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
