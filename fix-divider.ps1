$file = 'd:\eB\email_builder2\lib\email-generator.ts'
$content = Get-Content $file -Raw -Encoding UTF8

$startMarker = '    case "elzonris-divider": {'
$endMarker = '    case "image-with-link": {'

$startIdx = $content.IndexOf($startMarker)
$endIdx = $content.IndexOf($endMarker)

$newCase = @'
    case "elzonris-divider": {
      const display = (component.displayType || "all") as EmailComponent["displayType"];
      return `
      <table class="mobile-table" width="100%" align="center" bgcolor="#FFFFFF" border="0" cellspacing="0" cellpadding="0">
        <tbody><tr>
          <td class="horizontal-width-15" width="30" height="1" style="font-size:0px; line-height:1px; mso-line-height-rule:exactly;"></td>
          <td>
            <table width="100%" align="center" border="0" cellspacing="0" cellpadding="0">
              <tbody>
                <tr>
                  <td width="100%" height="20" style="font-size:0px; line-height:20px; mso-line-height-rule:exactly;">&nbsp;</td>
                </tr>
                <tr>
                  <td align="center" valign="top" style="display:block; line-height:0px; margin:0px;"><img class="fluidImage" src="${component.src || "./img/footer-line.png"}" alt="" width="540" height="" border="0" style="display:block; padding:0; color:#000000; font-family:Arial,sans-serif; font-size:16px;"></td>
                </tr>
                <tr>
                  <td width="100%" height="10" style="font-size:0px; line-height:10px; mso-line-height-rule:exactly;">&nbsp;</td>
                </tr>
                <tr>
                  <td align="center" style="text-decoration:none; color:${component.color || "#4e5156"}; font-size:${component.fontSize || "14px"}; line-height:16px; margin:0; font-weight:${component.fontWeight || "600"};">
                    VISIT <a href="${component.href || "https://elzonris.com/HCP/"}" target="_blank" style="text-decoration:none; color:#f15625; font-size:${component.fontSize || "14px"}; line-height:16px; margin:0;">ELZONRIS.COM/HCP</a>&nbsp;<br class="mbDisp" style="display:none;">FOR MORE INFORMATION.
                  </td>
                </tr>
                <tr>
                  <td width="100%" height="10" style="font-size:0px; line-height:10px; mso-line-height-rule:exactly;">&nbsp;</td>
                </tr>
                <tr>
                  <td align="center" valign="top" style="display:block; line-height:0px; margin:0px;"><img class="fluidImage" src="${component.src || "./img/footer-line.png"}" alt="" width="540" height="" border="0" style="display:block; padding:0; color:#000000; font-family:Arial,sans-serif; font-size:16px;"></td>
                </tr>
              </tbody>
            </table>
          </td>
          <td class="horizontal-width-15" width="30" height="1" style="font-size:0px; line-height:1px; mso-line-height-rule:exactly;"></td>
        </tr></tbody>
      </table>
      `.trim();
    }
    case "image-with-link": {
'@

$before = $content.Substring(0, $startIdx)
$after = $content.Substring($endIdx + $endMarker.Length)

$newContent = $before + $newCase + $after

[System.IO.File]::WriteAllText($file, $newContent, [System.Text.Encoding]::UTF8)
Write-Host "Done"
