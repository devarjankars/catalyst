import { de } from "date-fns/locale";
import {
  ImageIcon,
  Square,
  Minus,
  Type,
  Layout,
  LayoutIcon,
  RectangleHorizontal,
  PanelBottom,
  NotepadText,
  List,
  Wallpaper,
  SeparatorHorizontal,
  Code,
  AlignCenter,
} from "lucide-react";

export const componentTypes = [
  {
    type: "text",
    label: "Text",
    icon: Type,
    category : "basic",
    defaultProps: {
      content: "Your text here",
      fontSize: "16px",
      color: "#000000",
      textAlign: "left",
      fontWeight: "normal",
    },
  },
  {
    type: "image",
    label: "Image",
    category : "basic",
    icon: ImageIcon,
    defaultProps: {
      src: "/placeholder.svg?height=200&width=400&text=Image",
      alt: "Image",
      width: "100%",
      height: "auto",
    },
  },
  {
    type: "button",
    label: "Button",
    category : "basic",
    icon: Square,
    defaultProps: {
      text: "Button",
      href: "#",
      backgroundColor: "#0563C1",
      color: "#ffffff",
      borderRadius: "4px",
      buttonPadding: "12px 24px",
      textAlign: "center",
    },
  },
  {
    type: "section",
    label: "Section",
    category : "basic",
    icon: Layout,
    defaultProps: {
      children: [],
      backgroundColor: "#ffffff",
      padding: "0px 20px 0 20px",
      borderRadius: "0px",
      direction: "column",
      maxWidth: "100%",
    },
  },
  {
    type: "divider",
    label: "Divider",
    category : "basic",
    icon: Minus,
    defaultProps: {
      height: "1px",
      backgroundColor: "#e0e0e0",
      margin: "20px 0",
    },
  },
  {
    type: "cta-button",
    label: "CTA Button",
    category : "basic",
    icon: RectangleHorizontal,
    defaultProps: {
      href: "#",
      imageSrc: "/cta-placeholder.png",
      imageAlt: "CTA Image",
      width: "100%",
      height: "auto",
      maxWidth: "600px",
      padding: "20px",
    },
  },
  {
    type: "footer-links",
    label: "Footer Links",
    category : "custom",
    icon: PanelBottom,
    defaultProps: {
      links: [
        { text: "Privacy and Terms of Use ", href: "#" },
        { text: "CCPA Policy", href: "#" },
        { text: "Cookies Policy", href: "#" },
        { text: "Unsubscribe", href: "#" },
      ],
    },
    textAlign: "left",
    fontSize: "14px",
    color: "#0563C1",
  },

  {
    type: "isi",
    label: "ISI Block",
    category : "custom",
    icon: NotepadText,
    defaultProps: {
      importantSafetyInformation: {
        sections: [
          {
            title: "Warnings and Precautions",
            items: [
              {
                isBullet: true,
                content:
                  `<b>Dyslipidemia:</b> Hypercholesterolemia and hypertriglyceridemia occurred in patients taking ORSERDU at an incidence of 30% and 27%, respectively. The incidence of Grade 3 and 4 hypercholesterolemia and hypertriglyceridemia were 0.9% and 2.2%, respectively. Monitor lipid profile prior to starting and periodically while taking ORSERDU.`,
              },
              {
                isBullet: true,
                content:
                  `<b>Embryo-Fetal Toxicity:</b> Based on findings in animals and its mechanism of action, ORSERDU can cause fetal harm when administered to a pregnant woman. Advise pregnant women and females of reproductive potential of the potential risk to a fetus. Advise females of reproductive potential to use effective contraception during treatment with ORSERDU and for 1 week after the last dose. Advise male patients with female partners of reproductive potential to use effective contraception during treatment with ORSERDU and for 1 week after the last dose.`,
              },
            ],
          },
          {
            title: "Adverse Reactions",
            items: [
              {
                isBullet: true,
                content:
                  `<b>Serious adverse reactions</b> occurred in 12% of patients who received ORSERDU. Serious adverse reactions in >1% of patients who received ORSERDU were musculoskeletal pain (1.7%) and nausea (1.3%). Fatal adverse reactions occurred in 1.7% of patients who received ORSERDU, including cardiac arrest, septic shock, diverticulitis, and unknown cause (one patient each).`,
              },
              {
                isBullet: true,
                content:
                  `<b>The most common adverse reactions</b> (≥10%), including laboratory abnormalities, of ORSERDU were musculoskeletal pain (41%), nausea (35%), increased cholesterol (30%), increased AST (29%), increased triglycerides (27%), fatigue (26%), decreased hemoglobin (26%), vomiting (19%), increased ALT (17%), decreased sodium (16%), increased creatinine (16%), decreased appetite (15%), diarrhea (13%), headache (12%), constipation (12%), abdominal pain (11%), hot flush (11%), and dyspepsia (10%).`,
              },
            ],
          },
          {
            title: "Drug Interactions",
            items: [
              {
                isBullet: true,
                 
                content:
                  `<b>Concomitant use with CYP3A4 inducers and/or inhibitors:</b> Avoid concomitant use of strong or moderate CYP3A4 inhibitors with ORSERDU. Avoid concomitant use of strong or moderate CYP3A4 inducers with ORSERDU.`,
              },
            ],
          },
          {
            title: "Use in Specific Populations",
            items: [
              {
                isBullet: true,
                content:
                  `<b>Lactation:</b> Advise lactating women to not breastfeed during treatment with ORSERDU and for 1 week after the last dose.`,
              },
              {
                isBullet: true,
                content:
                  `<b>Hepatic Impairment:</b> Avoid use of ORSERDU in patients with severe hepatic impairment (Child-Pugh C). Reduce the dose of ORSERDU in patients with moderate hepatic impairment (Child-Pugh B).`,
              },
              
            ],
          },
          {
            title: null,
            items: [
              {
                isBullet: false,
                content:
                  "The safety and effectiveness of ORSERDU in pediatric patients have not been established.",
              },
              {
                isBullet: false,
                content:
                  "ORSERDU is available as 345 mg tablets and 86 mg tablets.",
              },
              {
                isBullet: false,
                content:
                  `<b style="color:#006937;display:block;font-size:16px;margin-bottom:5px;">INDICATION</b>ORSERDU (elacestrant) is indicated for the treatment of postmenopausal women or adult men with estrogen receptor (ER)-positive, human epidermal growth factor receptor 2 (HER2)-negative, <i>ESR1</i>-mutated advanced or metastatic breast cancer with disease progression following at least one line of endocrine therapy.`,
              },
            ],
          },
        ],
      }
    }
   
  },
  {
  type: "bullet-list",
  label: "Bullet Point",
  category : "basic",
  icon: List,
  defaultProps: {
    listItems: [`List Item`],   // array of strings
    fontSize: "12px",
  },
},
{
  type: "email-footer",
  label: "Orserdu Footer 5 Links",
  category: "custom",
  icon: PanelBottom,
  defaultProps: {
    links: [
      { text: "Privacy and Terms of Use", href: "#" },
      { text: "CCPA Policy", href: "#" },
      { text: "Cookies Policy", href: "#" },
      { text: "Unsubscribe", href: "#" },
      { text: "Email Preferences", href: "#", color: "#ff66cc" },
    ],
    fontSize: "12px",
    color: "#0563C1",
    backgroundColor: "#ffffff",
    padding: "10px 20px",
  },
},
{
  type: "footer-with-Preferences",
  label: "Orserdu Footer 4 Links",
  category: "custom",
  icon: PanelBottom,
  defaultProps: {
    links: [
      { text: "Privacy and Terms of Use", href: "#" },
      { text: "CCPA Policy", href: "#" },
      { text: "Cookies Policy", href: "#" },
      { text: "Unsubscribe", href: "#" },
    ],
    fontSize: "12px",
    color: "#0563C1",
    backgroundColor: "#ffffff",
    padding: "0 20px 10px 20px",
  },
},
{
  type: "header-image",
  label: "Header Image",
  category : "basic",
  icon : Wallpaper,
  defaultProps: {
    src: "/header-placeholder.png",
    imageAlt: "Header Image",
    width: "100%",
    height: "auto",
    maxWidth: "600px",
  }
},
{
  type: "chevron-divider",
  label: "Chevron Divider",
  category : "elzonris",
  icon : Wallpaper,
  defaultProps: {
    src: "/chevron.png",
    imageAlt: "divider Image",
    width: "100%",
    height: "auto",
    maxWidth: "600px",
  }
},
{
  type: "custom-text",
  label: "Custom Text (Token)",
  category: "basic",
  icon: NotepadText,
  defaultProps: {
    customTextOptions: [
      "I'm glad we could follow up on our last conversation.",
      "I have the information that you requested during our previous discussion.",
      "I am reaching out to share some information you may find helpful.",
    ],
    fontSize: "12px",
    color: "#5D5D5D",
    textAlign: "left",
    fontWeight: "normal",
    lineHeight: "14px",
    fontFamily: "Arial, sans-serif",
    padding: "0 20px 10px 20px",
    backgroundColor: "#ffffff",
  },
},
{
  type: "Salutation",
  label: "Salutation",
  category : "custom",
  icon : NotepadText,
  defaultProps: {
      content: "Dear {{customText[Dr.|Mr.|Mrs.|Ms.|Mx.]}} {{accFname}} {{accLname}},",
      fontSize: "12px",
      color: "#000000",
      textAlign: "left",
      fontWeight: "normal",
  },
  
},
{
  type: "footer-tokens",
  label: "Footer-Tokens",
  category : "custom",
  icon : NotepadText,
  defaultProps: {
      footerTokens: {
        regards : "{{customText[Regards,|Sincerely,|Thank you,|Best,]}}",
        userPhoto : "{{userPhoto}}",
        company : "An ORSERDU<sup>®</sup> Representative",
        userName : "{{userName}}",
        userEmailAddress : "{{userEmailAddress}}",
        userPhone : "{{User.Phone}}"
      },
      fontSize: "12px",
      color: "#000000",
      textAlign: "left",
      fontWeight: "normal",
      padding: "0 0 5px 20px",
  },
  
},
{
  type: "orsedu-footer",
  label: "Orsedu-Footer",
  category : "custom",
  icon : NotepadText,
  defaultProps: {
      footerText: {
        reg : "ORSERDU is a registered trademark of the Menarini Group.",
        year : "© 2026 Stemline Therapeutics, Inc., a Menarini Group Company.",
        address : "750​ Lex​ington​ Ave​nue,​ 4​th​ Floor,​ New​ York,​ NY​ 10022.",
        rights : "All rights reserved.",
        jobcode : "0X/2X MAT-US-ELA-00XXX",
      },
      fontSize: "12px",
      color: "#000000",
      textAlign: "left",
      fontWeight: "normal",
      src: "/menarini-stemline-logos.png",
      alt: "Menarini group logo and Stemline Logo",
      width: "250px",
      height: "auto",
  },
  
},

{
  type: "orserdu-emerald-stats",
  label: "EMERALD Stats",
  category: "custom",
  icon: NotepadText,
  defaultProps: {
    emeraldLeftIconSrc: "/2Xmpfs.png",
    emeraldLeftIconAlt: "Primary endpoint: mPFS results for ORSERDU (elacestrant) vs. fulvestrant or AI",
    emeraldLeftHeading: "Primary endpoint in EMERALD",
    emeraldLeftStat: `<b style="color:#006937;font-size:18px;">3.8 months</b>&nbsp;(95% CI: 2.2-7.3) for ORSERDU (n=115) vs. <b>1.9 months</b>&nbsp;(95% CI: 1.9-2.1) for fulvestrant or AI* (n=113).`,
    emeraldLeftHR: `HR=0.55 (95% CI: 0.39-0.77); <i>P</i>=0.0005<sup>1</sup>`,
    emeraldRightStatNumber: "8.6",
    emeraldRightStatLabel: "months\nmPFS",
    emeraldRightDesc: "Exploratory post hoc analysis: Patients with prior ET + CDK4/6i for ≥12 months",
    emeraldRightStat: "8.6 months (95% CI: 4.1-10.8) for ORSERDU (n=78) vs. 1.9 months (95% CI: 1.9-3.7) for fulvestrant or AI (n=81).",
    emeraldRightHR: `HR=0.41 (95% CI: 0.26-0.63)<sup>2</sup>`,
    padding: "0 20px 10px 20px",
  },
},

{
  type: "sisi",
  label: "SISI (Selected ISI)",
  category: "custom",
  icon: NotepadText,
  defaultProps: {
    html: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="background-color:#ffffff;">
<tbody>
<tr>
<td style="padding: 10px 20px 10px 20px; background-color:transparent;" bgcolor="transparent">
<div style="font-size: 14px; color: #006937; text-align: left; font-weight: normal; font-family: Arial, sans-serif; line-height: 16px; background-color: transparent;">
<b>SELECT IMPORTANT SAFETY INFORMATION</b>
</div>
</td>
</tr>
<tr>
<td bgcolor="#ffffff" style="padding: 0 20px 0 20px; background-color: transparent;">
<table bgcolor="#ffffff" style="background-color:#ffffff;" cellpadding="0" cellspacing="0" border="0" width="100%">
<tbody>
<tr>
<td bgcolor="#ffffff" align="left" valign="top" width="2%" style="color: #69d6b5; font-size: 16px; line-height: 16px; padding-bottom: 3px; background-color: #ffffff">
&#8226;</td>
<td bgcolor="#ffffff" align="left" valign="middle" style="color: #000000; font-size: 14px; font-weight: normal; text-align: left; line-height: 16px; padding-left: 5px; font-family: Arial, sans-serif; background-color : #ffffff">
<b>The labeling for ORSERDU contains warnings and precautions</b> for dyslipidemia and embryo-fetal toxicity.
</td>
</tr>
<tr>
<td bgcolor="#ffffff" height="5px" style=" font-size: 0px; line-height: 5px; mso-line-height-rule: exactly;background-color:#ffffff ">
&nbsp; </td>
</tr>
<tr>
<td bgcolor="#ffffff" align="left" valign="top" width="2%" style="color: #69d6b5; font-size: 16px; line-height: 16px; padding-bottom: 3px; background-color: #ffffff">
&#8226;</td>
<td bgcolor="#ffffff" align="left" valign="middle" style="color: #000000; font-size: 14px; font-weight: normal; text-align: left; line-height: 16px; padding-left: 5px; font-family: Arial, sans-serif; background-color : #ffffff">
<b>The most common serious adverse reactions</b> in >1% of patients who received ORSERDU were musculoskeletal pain and nausea.
</td>
</tr>
<tr>
<td bgcolor="#ffffff" height="5px" style=" font-size: 0px; line-height: 5px; mso-line-height-rule: exactly;background-color:#ffffff ">
&nbsp; </td>
</tr>
<tr>
<td bgcolor="#ffffff" align="left" valign="top" width="2%" style="color: #69d6b5; font-size: 16px; line-height: 16px; padding-bottom: 3px; background-color: #ffffff">
&#8226;</td>
<td bgcolor="#ffffff" align="left" valign="middle" style="color: #000000; font-size: 14px; font-weight: normal; text-align: left; line-height: 16px; padding-left: 5px; font-family: Arial, sans-serif; background-color : #ffffff">
<b>The most common adverse reactions,</b> including laboratory abnormalities, in &ge;10% of patients who received ORSERDU were musculoskeletal pain (41%), nausea (35%), increased cholesterol (30%), increased AST (29%), increased triglycerides (27%), fatigue (26%), decreased hemoglobin (26%), vomiting (19%), increased ALT (17%), decreased sodium (16%), increased creatinine (16%), decreased appetite (15%), diarrhea (13%), headache (12%), constipation (12%), abdominal pain (11%), hot flush (11%), and dyspepsia (10%).
</td>
</tr>
<tr>
<td bgcolor="#ffffff" height="5px" style=" font-size: 0px; line-height: 5px; mso-line-height-rule: exactly;background-color:#ffffff ">
&nbsp; </td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table>`,
  },
},
{
  type: "orserdu-image-text-block",
  label: "image+text block",
  category: "custom",
  icon: NotepadText,
  defaultProps: {
    imageTextImageSrc: "/MOAofORSERDU.png",
    imageTextImageAlt: "ORSERDU image",
    imageTextImageWidth: 167,
    imageTextText1: "<i>ESR1</i> mutations alter the binding pocket, leading to constitutively active estrogen receptors<sup>7</sup>",
    textAlign: "left",
    imageTextVerticalAlign: "top",
    padding: "0 20px 10px 20px",
  },
},
  {
    type: "orserdu-abbreviations",
    label: "Abbreviations",
    category: "custom",
    icon: NotepadText,
    defaultProps: {
      abbreviations: "aBC, advanced breast cancer; AI, aromatase inhibitor; ALT, alanine aminotransferase; AST, aspartate aminotransferase; BIRC, blinded imaging review committee; CDK4/6i, cyclin-dependent kinase 4/6 inhibitor; CI, confidence interval; ER+, estrogen receptor-positive; <i>ESR1</i>, estrogen receptor 1; <i>ESR1</i>m, estrogen receptor 1 mutation; ET, endocrine therapy; HER2-, human epidermal growth factor receptor 2-negative; HR, hazard ratio; mBC, metastatic breast cancer; mPFS, median progression-free survival; PFS, progression-free survival; RWE, real-world evidence.",
      padding: "0 20px 10px 20px",
      fontSize: "12px",
      color: "#646464",
      fontWeight: "normal",
      lineHeight: "14px",
    },
  },
  {
    type: "orserdu-references",
    label: "References",
    category: "custom",
    icon: NotepadText,
    defaultProps: {
      references: "1. Pemmaraju N, et al. <i>N Engl J Med.</i> 2019;380(17):1628-1637.",
      padding: "0 20px 10px 20px",
      fontSize: "12px",
      color: "#646464",
      fontWeight: "normal",
      lineHeight: "14px",
    },
  },
  {
    type: "orserdu-view-in-browser",
    label: "View in Browser",
    category: "custom",
    icon: AlignCenter,
    defaultProps: {
      href: "#",
      color: "#2360d9",
      fontSize: "12px",
      lineHeight: "16px",
      textAlign: "center",
      padding: "10px 20px",
      backgroundColor: "transparent",
    },
  },


  {
    type: "elzonris-pi",
    label: "Elzonris PI",
    category: "elzonris",
    icon: NotepadText,
    defaultProps: {
      piHref: "http://pi.elzonris.com/",
      isiHref: "https://www.elzonris.com/hcp/#isi",
      fontSize: "12px",
      color: "#000000",
      linkColor: "#009877",

    },
  },
  {
    type: "elzonris-brand-logo",
    label: "Brand Logo",
    category: "elzonris",
    icon: ImageIcon,
    defaultProps: {
      logoA: {
        altText: "Menarini Group Logo and Stemline Logo",
        href: "#",
        imgSrc: "/footer-logo-a.png",
      },
      logoB: {
        altText: "ELZONRIS Logo",
        href: "#",
        imgSrc: "/footer-logo-b.png",
      },
    },
  },
  {
    type: "footer-link-3",
    label: "Elzonris Footer 3 Links",
    category: "elzonris",
    icon: PanelBottom,
    defaultProps: {
      links: [
        { text: "Privacy and Terms of Use", href: "#" },
        { text: "CCPA Policy", href: "#" },
        { text: "Cookies Policy", href: "#" },
      ],
      textAlign: "left",
      fontSize: "12px",
      color: "#009877",
    },
  },
   {
    type: "elzonris-divider",
    label: "Elzonris Divider",
    category : "elzonris",
    icon : SeparatorHorizontal,
    defaultProps: {
      src: "/footer-line.png",
      alt: "footer-line",
      href: "https://elzonris.com/HCP/",
    },
  },
  {
    type: "elzonris-view-in-browser",
    label: "View in Browser",
    category: "elzonris",
    icon: AlignCenter,
    defaultProps: {
      href: "#",
      color: "#2360d9",
      fontSize: "12px",
      lineHeight: "16px",
      textAlign: "center",
      padding: "10px 20px",
      backgroundColor: "transparent",
    },
  },
  {
    type: "elzonris-isi",
    label: "Elzonris ISI",
    category: "elzonris",
    icon: NotepadText,
    defaultProps: {
      html: ` <table width="100%" align="center" border="0" cellspacing="0" cellpadding="0">
            <tbody>
                <tr>
                    <td width="100%" height="15" style="font-size:0px;line-height:15px;mso-line-height-rule:exactly;">&nbsp;
                    </td>
                </tr>
                <tr>
                    <td align="left" valign="middle"
                        style="color:#009877;font-family:Arial,sans-serif;font-weight:600;font-size:14px;line-height:18px;">
                        INDICATION</td>
                </tr>
                <tr>
                    <td>
                        <table width="100%" align="center" border="0" cellspacing="0" cellpadding="0">
                            <tbody>
                                <tr>
                                    <td height="5" style="font-size:0px;line-height:5px;mso-line-height-rule:exactly;">&nbsp;
                                    </td>
                                </tr>
                                <tr>
                                    <td align="left" valign="top" width="2%"
                                        style="font-size:12px;line-height:16px;color:#4d4d4f;">•</td>
                                    <td width="5" style="font-size:0px;line-height:1px;mso-line-height-rule:exactly;">&nbsp;
                                    </td>
                                    <td align="left" valign="middle"
                                        style="color:#646464;font-family:Arial,sans-serif;font-weight:400;font-size:12px;line-height:14px;">
                                        ELZONRIS is a CD123-directed cytotoxin indicated for the treatment of blastic
                                        plasmacytoid dendritic cell neoplasm (BPDCN) in adults and in pediatric patients 2 years
                                        and older</td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td width="100%" height="15" style="font-size:0px;line-height:15px;mso-line-height-rule:exactly;">&nbsp;
                    </td>
                </tr>
                <tr>
                    <td align="left" valign="middle"
                        style="color:#009877;font-family:Arial,sans-serif;font-weight:600;font-size:14px;line-height:18px;">
                        IMPORTANT SAFETY INFORMATION</td>
                </tr>
                <tr>
                    <td align="left" valign="middle"
                        style="color:#000000;font-family:Arial,sans-serif;font-weight:400;font-size:14px;line-height:18px;">
                        <strong>Boxed WARNING: CAPILLARY LEAK SYNDROME</strong></td>
                </tr>
                <tr>
                    <td height="5" style="font-size:0px;line-height:5px;mso-line-height-rule:exactly;">&nbsp;</td>
                </tr>
                <tr>
                    <td>
                        <table width="100%" align="center" border="0" cellspacing="0" cellpadding="0">
                            <tbody>
                                <tr>
                                    <td align="left" valign="top" width="2%"
                                        style="font-size:12px;line-height:16px;color:#000000;">•</td>
                                    <td width="5" style="font-size:0px;line-height:1px;mso-line-height-rule:exactly;">&nbsp;
                                    </td>
                                    <td align="left" valign="middle"
                                        style="color:#000000;font-family:Arial,sans-serif;font-weight:400;font-size:12px;line-height:14px;">
                                        <strong>Capillary Leak Syndrome (CLS), which may be life-threatening or fatal, can occur
                                            in patients receiving ELZONRIS. Monitor for signs and symptoms of CLS and take
                                            actions as recommended.</strong></td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td width="100%" height="15" style="font-size:0px;line-height:15px;mso-line-height-rule:exactly;">&nbsp;
                    </td>
                </tr>
                <tr>
                    <td align="left" valign="middle"
                        style="color:#009877;font-family:Arial,sans-serif;font-weight:600;font-size:14px;line-height:18px;">
                        WARNINGS AND PRECAUTIONS</td>
                </tr>
                <tr>
                    <td height="5" style="font-size:0px;line-height:5px;mso-line-height-rule:exactly;">&nbsp;</td>
                </tr>
                <tr>
                    <td align="left" valign="middle"
                        style="color:#646464;font-family:Arial,sans-serif;font-weight:600;font-size:14px;line-height:18px;">
                        Capillary Leak Syndrome</td>
                </tr>
                <tr>
                    <td>
                        <table width="100%" align="center" border="0" cellspacing="0" cellpadding="0">
                            <tbody>
                                <tr>
                                    <td height="5" style="font-size:0px;line-height:5px;mso-line-height-rule:exactly;">&nbsp;
                                    </td>
                                </tr>
                                <tr>
                                    <td align="left" valign="top" width="2%"
                                        style="font-size:12px;line-height:16px;color:#4d4d4f;">•</td>
                                    <td width="5" style="font-size:0px;line-height:1px;mso-line-height-rule:exactly;">&nbsp;
                                    </td>
                                    <td align="left" valign="middle"
                                        style="color:#646464;font-family:Arial,sans-serif;font-weight:400;font-size:12px;line-height:14px;">
                                        Capillary leak syndrome (CLS), including life-threatening and fatal cases, has been
                                        reported among patients treated with ELZONRIS. In patients receiving ELZONRIS in
                                        clinical trials, the overall incidence of CLS was 53% (65/122), including Grade 1 or 2
                                        in 43% (52/122) of patients, Grade 3 in 7% (8/122) of patients, Grade 4 in 1% (1/122) of
                                        patients, and four fatalities (3%). The median time to onset was 4 days (range-1 to 46
                                        days), and all but 5 patients experienced an event in Cycle 1.</td>
                                </tr>
                                <tr>
                                    <td height="5" style="font-size:0px;line-height:5px;mso-line-height-rule:exactly;">&nbsp;
                                    </td>
                                </tr>
                                <tr>
                                    <td align="left" valign="top" width="2%"
                                        style="font-size:12px;line-height:16px;color:#4d4d4f;">•</td>
                                    <td width="5" style="font-size:0px;line-height:1px;mso-line-height-rule:exactly;">&nbsp;
                                    </td>
                                    <td align="left" valign="middle"
                                        style="color:#646464;font-family:Arial,sans-serif;font-weight:400;font-size:12px;line-height:14px;">
                                        Before initiating therapy with ELZONRIS, ensure that the patient has adequate cardiac
                                        function and serum albumin is greater than or equal to 3.2 g/dL. During treatment with
                                        ELZONRIS, monitor serum albumin levels prior to the initiation of each dose of ELZONRIS
                                        and as indicated clinically thereafter, and assess patients for other signs or symptoms
                                        of CLS, including weight gain, new onset or worsening edema, including pulmonary edema,
                                        hypotension or hemodynamic instability.</td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td width="100%" height="15" style="font-size:0px;line-height:15px;mso-line-height-rule:exactly;">&nbsp;
                    </td>
                </tr>
                <tr>
                    <td align="left" valign="middle"
                        style="color:#646464;font-family:Arial,sans-serif;font-weight:600;font-size:14px;line-height:18px;">
                        Hypersensitivity Reactions</td>
                </tr>
                <tr>
                    <td>
                        <table width="100%" align="center" border="0" cellspacing="0" cellpadding="0">
                            <tbody>
                                <tr>
                                    <td height="5" style="font-size:0px;line-height:5px;mso-line-height-rule:exactly;">&nbsp;
                                    </td>
                                </tr>
                                <tr>
                                    <td align="left" valign="top" width="2%"
                                        style="font-size:12px;line-height:16px;color:#4d4d4f;">•</td>
                                    <td width="5" style="font-size:0px;line-height:1px;mso-line-height-rule:exactly;">&nbsp;
                                    </td>
                                    <td align="left" valign="middle"
                                        style="color:#646464;font-family:Arial,sans-serif;font-weight:400;font-size:12px;line-height:14px;">
                                        ELZONRIS can cause severe hypersensitivity reactions. In patients receiving ELZONRIS in
                                        clinical trials, hypersensitivity reactions were reported in 43% (53/122) of patients
                                        treated with ELZONRIS and were Grade ≥ 3 in 7% (9/122). Manifestations of
                                        hypersensitivity reported in ≥ 5% of patients include rash, pruritus, and stomatitis.
                                        Monitor patients for hypersensitivity reactions during treatment with ELZONRIS.
                                        Interrupt ELZONRIS infusion and provide supportive care as needed if a hypersensitivity
                                        reaction should occur.</td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td width="100%" height="15" style="font-size:0px;line-height:15px;mso-line-height-rule:exactly;">&nbsp;
                    </td>
                </tr>
                <tr>
                    <td align="left" valign="middle"
                        style="color:#646464;font-family:Arial,sans-serif;font-weight:600;font-size:14px;line-height:18px;">
                        Hepatotoxicity</td>
                </tr>
                <tr>
                    <td>
                        <table width="100%" align="center" border="0" cellspacing="0" cellpadding="0">
                            <tbody>
                                <tr>
                                    <td height="5" style="font-size:0px;line-height:5px;mso-line-height-rule:exactly;">&nbsp;
                                    </td>
                                </tr>
                                <tr>
                                    <td align="left" valign="top" width="2%"
                                        style="font-size:12px;line-height:16px;color:#4d4d4f;">•</td>
                                    <td width="5" style="font-size:0px;line-height:1px;mso-line-height-rule:exactly;">&nbsp;
                                    </td>
                                    <td align="left" valign="middle"
                                        style="color:#646464;font-family:Arial,sans-serif;font-weight:400;font-size:12px;line-height:14px;">
                                        Treatment with ELZONRIS was associated with elevations in liver enzymes. In patients
                                        receiving ELZONRIS in clinical trials, elevations in ALT occurred in 79% (96/122) and
                                        elevations in AST occurred in 76% (93/122). Grade 3 ALT elevations were reported in 26%
                                        (32/122) of patients. Grade 3 AST elevations were reported in 30% (36/122) and Grade 4
                                        AST elevations were reported in 3% (4/122) of patients. Elevated liver enzymes occurred
                                        in the majority of patients in Cycle 1 and were reversible following dose interruption.
                                    </td>
                                </tr>
                                <tr>
                                    <td height="5" style="font-size:0px;line-height:5px;mso-line-height-rule:exactly;">&nbsp;
                                    </td>
                                </tr>
                                <tr>
                                    <td align="left" valign="top" width="2%"
                                        style="font-size:12px;line-height:16px;color:#4d4d4f;">•</td>
                                    <td width="5" style="font-size:0px;line-height:1px;mso-line-height-rule:exactly;">&nbsp;
                                    </td>
                                    <td align="left" valign="middle"
                                        style="color:#646464;font-family:Arial,sans-serif;font-weight:400;font-size:12px;line-height:14px;">
                                        Monitor alanine aminotransferase (ALT) and aspartate aminotransferase (AST) prior to
                                        each infusion with ELZONRIS. Withhold ELZONRIS temporarily if the transaminases rise to
                                        greater than 5 times the upper limit of normal and resume treatment upon normalization
                                        or when resolved.</td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td width="100%" height="15" style="font-size:0px;line-height:15px;mso-line-height-rule:exactly;">&nbsp;
                    </td>
                </tr>
                <tr>
                    <td align="left" valign="middle"
                        style="color:#009877;font-family:Arial,sans-serif;font-weight:600;font-size:14px;line-height:18px;">
                        ADVERSE REACTIONS:</td>
                </tr>
                <tr>
                    <td height="1" style="font-size:0px;line-height:1px;mso-line-height-rule:exactly;">&nbsp;</td>
                </tr>
                <tr>
                    <td align="left" valign="middle"
                        style="color:#646464;font-family:Arial,sans-serif;font-weight:400;font-size:12px;line-height:14px;">Most
                        common adverse reactions (incidence ≥ 30%) are capillary leak syndrome, nausea, fatigue, pyrexia,
                        peripheral edema, and weight increase. Most common laboratory abnormalities (incidence ≥ 50%) are
                        decreases in albumin, platelets, hemoglobin, calcium, and sodium, and increases in glucose, ALT and AST.
                    </td>
                </tr>
                <tr>
                    <td width="100%" height="15" style="font-size:0px;line-height:15px;mso-line-height-rule:exactly;">&nbsp;
                    </td>
                </tr>
                <tr>
                    <td align="left" valign="middle"
                        style="color:#646464;font-family:Arial,sans-serif;font-weight:400;font-size:12px;line-height:14px;">
                        <strong>Please see Full <a
                                href="https://rxmenarinistemline.com/ELZONRIS_US_Full_Prescribing_Information.pdf"
                                target="_blank" style="text-decoration:underline;color:#009877;line-height:18px;">Prescribing
                                Information</a>, including Boxed WARNING.</strong></td>
                </tr>
                <tr>
                    <td width="100%" height="15" style="font-size:0px;line-height:15px;mso-line-height-rule:exactly;">&nbsp;
                    </td>
                </tr>
                <tr>
                    <td align="left" valign="middle"
                        style="color:#646464;font-family:Arial,sans-serif;font-weight:400;font-size:12px;line-height:14px;">To
                        report SUSPECTED ADVERSE REACTIONS, contact Stemline Therapeutics, Inc. <br>at <span
                            style="color:#646464">1-877-332-7961</span> or contact the FDA at <span
                            style="color:#646464">1-800-FDA-1088</span> or <a
                            href="https://www.fda.gov/safety/medwatch-fda-safety-information-and-adverse-event-reporting-program"
                            target="_blank"
                            style="text-decoration:underline;color:#009877;line-height:18px;">www.fda.gov/medwatch</a>.</td>
                </tr>
                <tr>
                    <td width="100%" height="10" style="font-size:0px;line-height:10px;mso-line-height-rule:exactly;">&nbsp;
                    </td>
                </tr>
            </tbody>
        </table>`,
    },
  },
   {
    type: "image-with-link",
    label: "Image with Link",
    category : "basic",
    icon: ImageIcon,
    defaultProps: {
      src: "/placeholder.svg?height=200&width=400&text=Image",
      alt: "Image",
      width: "100%",
      href : "#", 
      height: "auto",
    },
  },

  {
    type: "ferring-footer",
    label: "Ferring Footer",
    category : "ferring",
    icon : PanelBottom,
    defaultProps: {
      links: [
        { text: "Privacy and Terms of Use ", href: "#" },
        { text: "CCPA Policy", href: "#" },
        { text: "Cookies Policy", href: "#" },
        { text: "Unsubscribe", href: "#" },
      ],
      logo : {
        altText : "Ferring Logo",
        href : '#',
        logoSrc : "https://firebasestorage.googleapis.com/v0/b/med-email-builder.firebasestorage.app/o/component-images%2Fferring_logo.png?alt=media&token=a9e00791-4a65-4356-aa6d-2c601d26118b"
      },
      socialMediaLinks : [
        { iconSrc: "https://firebasestorage.googleapis.com/v0/b/med-email-builder.firebasestorage.app/o/component-images%2Ffacebook_icon.png?alt=media&token=e6c1979a-8c6e-4c65-9515-ea1720228c5c", href: "#" , altText: "Facebook Icon"},
        { iconSrc: "https://firebasestorage.googleapis.com/v0/b/med-email-builder.firebasestorage.app/o/component-images%2Finstagram_icon.png?alt=media&token=4fbddb4b-d7ff-4830-b01d-0fc11eb76340", href: "#", altText: "Instagram Icon" },
        { iconSrc: "https://firebasestorage.googleapis.com/v0/b/med-email-builder.firebasestorage.app/o/component-images%2Flinkedin_icon.png?alt=media&token=ba56b0ea-bdc6-410e-bf6c-bbfcd581c731", href: "#", altText: "LinkedIn Icon" },
      ], 
      jobCode: "02/26 GL-RMMH-2600016",
      address: "[countries to add appropriate address]"
    },
  },
  {
    type : "raw-html",
    label : "HTML Block",
    category : "basic",
    icon : Code,
    defaultProps: {
      html: "<p>Enter your code in editor</p>",
    },
  },

  {
    type: "elzonris-references",
    label: "References",
    category: "elzonris",
    icon: NotepadText,
    defaultProps: {
      references: "1. Pemmaraju N, et al. <i>N Engl J Med.</i> 2019;380(17):1628-1637.",
      padding: "0 20px 10px 20px",
      fontSize: "12px",
      color: "#646464",
      fontWeight: "normal",
      lineHeight: "14px",
    },
  },
  {
    type: "elzonris-image-text-block",
    label: "image+text block",
    category: "elzonris",
    icon: NotepadText,
    defaultProps: {
      imageTextImageSrc: "",
      imageTextImageAlt: "Elzonris image",
      imageTextImageWidth: 167,
      imageTextText1: "First text block",
      textAlign: "left",
      imageTextVerticalAlign: "top",
      padding: "0 20px 10px 20px",
    },
  },
  {
    type: "elzonris-abbreviations",
    label: "Abbreviations",
    category: "elzonris",
    icon: NotepadText,
    defaultProps: {
      abbreviations: "aBC: advanced breast cancer; AI: aromatase inhibitor; ALT: alanine aminotransferase; AST: aspartate aminotransferase; BIRC: blinded imaging review committee; CDK4/6i: cyclin-dependent kinase 4/6 inhibitor; CI: confidence interval; ER+: estrogen receptor-positive; ESR1: estrogen receptor 1; ESR1m: estrogen receptor 1 mutation; ET: endocrine therapy; HER2-: human epidermal growth factor receptor 2-negative; HR: hazard ratio; mBC: metastatic breast cancer; mPFS: median progression-free survival; PFS: progression-free survival.",
      padding: "0 20px 10px 20px",
      fontSize: "12px",
      color: "#646464",
      fontWeight: "normal",
      lineHeight: "14px",
    },
  },

  {
    type: "tryvio-footer",
    label: "TRYVIO Footer",
    category: "idorsia",
    icon: PanelBottom,
    defaultProps: {
      tryvioFooterLogoSrc: `/logo.png`,
      tryvioFooterLogoHref: `https://www.tryviohcp.com/`,
      tryvioFooterLogoAlt: `Tryvio`,
      tryvioFooterEmailLine: `This email was sent to {{Account.PersonEmail}}`,
      tryvioFooterSentByLine: `This email was sent by: Idorsia Pharmaceuticals US Inc.`,
      tryvioFooterAddressLine: `One Radnor Corporate Center, Suite 101, Radnor, PA 19087`,
      tryvioFooterPrivacyText: `We respect your right to privacy - view our Privacy policy.`,
      tryvioFooterPrivacyHref: `https://www.idorsia.us/privacy-policy`,
      tryvioFooterUnsubscribeText: `Unsubscribe`,
      tryvioFooterUnsubscribeHref: `{{unsubscribe_product_link}}`,
      tryvioFooterLinkedinSrc: `/linkedin.png`,
      tryvioFooterLinkedinHref: `https://www.linkedin.com/company/tryvio-aprocitentan/`,
      tryvioFooterLinkedinAlt: `LinkedIn`,
      tryvioFooterCopyrightText: `©2026 Idorsia Pharmaceuticals, Ltd.`,
      tryvioFooterCopyrightHref: `https://www.idorsia.us/`,
      tryvioFooterJobCode: `US-AP-00162 04/26`,
      tryvioFooterIdorsiaLogoSrc: `/Idorsia.png`,
      tryvioFooterIdorsiaLogoHref: `https://www.idorsia.us/`,
      tryvioFooterIdorsiaLogoAlt: `Idorsia logo`,
    },
  },
  {
    type: "orserdu-isi-select",
    label: "ORSERDU ISI Select",
    category: "custom",
    icon: NotepadText,
    defaultProps: {
      // Heading
      heading: "SELECT IMPORTANT SAFETY INFORMATION",
      headingColor: "#006937",
      headingFontSize: "16px",
      headingPadding: "10px 20px 10px 20px",
      // Bullet items — each has boldText + normalText
      bulletItems: [
        {
          boldText: "The labeling for ORSERDU contains warnings and precautions",
          normalText: " for dyslipidemia and embryo-fetal toxicity.",
        },
        {
          boldText: "The most common serious adverse reactions",
          normalText: " in ≥1% of patients who received ORSERDU were musculoskeletal pain and nausea.",
        },
        {
          boldText: "The most common adverse reactions,",
          normalText: " including laboratory abnormalities, in ≥10% of patients who received ORSERDU were musculoskeletal pain, nausea, increased cholesterol, increased AST, increased triglycerides, fatigue, decreased hemoglobin, vomiting, increased ALT, decreased sodium, increased creatinine, decreased appetite, diarrhea, headache, constipation, abdominal pain, hot flush, and dyspepsia.",
        },
      ],
      bulletColor: "#69d6b5",
      textColor: "#000000",
      fontSize: "14px",
      lineHeight: "16px",
      backgroundColor: "#ffffff",
      // Footer line
      footerLine: "Please see additional Important Safety Information below.",
      footerPadding: "15px 20px 12px 20px",
      // Trial design paragraph (supports basic HTML: <b>, <i>, <sup>, <a>)
      trialDesignHtml: `<b>TRIAL DESIGN:</b> EMERALD was an open-label, global, phase 3 trial of postmenopausal women or men with confirmed ER+/HER2- advanced or metastatic breast cancer (N=478) who had progressed after 1-2 lines of ET, at least one in combination with a CDK4/6i, randomized (1:1) to receive ORSERDU or endocrine therapy (fulvestrant) or an aromatase inhibitor (anastrozole, letrozole, or exemestane). A major efficacy endpoint was PFS by BIRC in patients with <i>ESR1</i>m (n=228). An exploratory post hoc analysis evaluated efficacy and safety in patients with <i>ESR1</i>m treated with prior ET + CDK4/6i for ≥12 months (n=159).<sup>1,2</sup>`,
      trialDesignPadding: "0 20px 10px 20px",
      padding: "0",
    },
  },
];
