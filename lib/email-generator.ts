import type { EmailComponent } from "@/types/email-builder"

function generateComponentHTML(component: EmailComponent): string {
  switch (component.type) {
    case "section":
      const childrenHTML = (component.children || []).map((child) => generateComponentHTML(child)).join("")

      // Column-specific styles
      const getColumnStyles = (child: EmailComponent) => {
        if (!child.isColumn) return ""

        const alignment = child.columnAlignment || "left"
        const verticalAlignment = child.columnVerticalAlignment || "top"
        const width = child.columnWidth === "auto" ? undefined : child.columnWidth

        return `
          text-align: ${alignment};
          vertical-align: ${verticalAlignment === "top" ? "top" : verticalAlignment === "middle" ? "middle" : "bottom"};
          ${width ? `width: ${width};` : ""}
          min-height: ${child.columnMinHeight || "120px"};
        `
      }

      return `
    <tr>
      <td style="padding: ${component.padding || "20px"};">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="
          background-color: ${component.backgroundColor || "#ffffff"};
          border-radius: ${component.borderRadius || "0px"};
          max-width: ${component.maxWidth || "100%"};
          margin: ${component.margin || "0"};
          ${component.isColumn ? getColumnStyles(component) : ""}
        ">
          ${
            component.direction === "row"
              ? `
            <tr>
              ${(component.children || [])
                .map(
                  (child, index) => `
                <td style="
                  vertical-align: ${child.columnVerticalAlignment === "middle" ? "middle" : child.columnVerticalAlignment === "bottom" ? "bottom" : "top"};
                  text-align: ${child.columnAlignment || "left"};
                  width: ${child.columnWidth === "auto" ? `${100 / (component.children?.length || 1)}%` : child.columnWidth || `${100 / (component.children?.length || 1)}%`};
                  ${index < (component.children?.length || 1) - 1 ? "padding-right: 10px;" : ""}
                  min-height: ${child.columnMinHeight || "120px"};
                  background-color: ${child.backgroundColor || "transparent"};
                  border-radius: ${child.borderRadius || "0px"};
                  padding: ${child.padding || "15px"};
                ">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    ${generateComponentHTML(child)}
                  </table>
                </td>
              `,
                )
                .join("")}
            </tr>
          `
              : childrenHTML
          }
        </table>
      </td>
    </tr>
  `

    case "text":
      return `
        <tr>
          <td style="padding: ${component.padding || "16px"};">
            <div style="
              font-size: ${component.fontSize || "16px"};
              color: ${component.color || "#000000"};
              text-align: ${component.textAlign || "left"};
              font-weight: ${component.fontWeight || "normal"};
              font-family: Arial, sans-serif;
              line-height: 1.5;
            ">
              ${component.content || ""}
            </div>
          </td>
        </tr>
      `

    case "image":
      return `
        <tr>
          <td style="padding: ${component.padding || "16px"};">
            <img 
              src="${component.src || ""}" 
              alt="${component.alt || "Image"}"
              style="
                width: ${component.width || "100%"};
                height: ${component.height || "auto"};
                display: block;
                max-width: 100%;
              "
            />
          </td>
        </tr>
      `

    case "button":
      return `
        <tr>
          <td style="padding: ${component.padding || "16px"}; text-align: ${component.textAlign || "center"};">
            <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
              <tr>
                <td style="
                  background-color: ${component.backgroundColor || "#007bff"};
                  border-radius: ${component.borderRadius || "4px"};
                  padding: ${component.buttonPadding || "12px 24px"};
                ">
                  <a href="${component.href || "#"}" style="
                    color: ${component.color || "#ffffff"};
                    text-decoration: none;
                    font-family: Arial, sans-serif;
                    font-weight: bold;
                    display: inline-block;
                  ">
                    ${component.text || "Button"}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `

    case "divider":
      return `
        <tr>
          <td style="padding: ${component.padding || "16px"};">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="
                  height: ${component.height || "1px"};
                  background-color: ${component.backgroundColor || "#e0e0e0"};
                  margin: ${component.margin || "20px 0"};
                "></td>
              </tr>
            </table>
          </td>
        </tr>
      `
      case "custom" : 
          return `${component.html}`

    default:
      return ""
  }
}

export function generateEmailHTML(components: EmailComponent[]): string {
  const componentHTML = components.map((component) => generateComponentHTML(component)).join("")

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Email Template</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
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
        }
        
        /* Client-specific styles */
        .ReadMsgBody { width: 100%; }
        .ExternalClass { width: 100%; }
        .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {
            line-height: 100%;
        }
        
        /* Mobile styles */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                max-width: 100% !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f4f4;">
        <tr>
            <td align="center" >
                <table class="email-container" cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; max-width: 600px;">
                    ${componentHTML}
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `.trim()
}
