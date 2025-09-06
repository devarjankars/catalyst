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
} from "lucide-react";

export const componentTypes = [
  {
    type: "text",
    label: "Text",
    icon: Type,
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
    icon: Square,
    defaultProps: {
      text: "Button",
      href: "#",
      backgroundColor: "#007bff",
      color: "#ffffff",
      borderRadius: "4px",
      buttonPadding: "12px 24px",
      textAlign: "center",
    },
  },
  {
    type: "section",
    label: "Section",
    icon: Layout,
    defaultProps: {
      children: [],
      backgroundColor: "#ffffff",
      padding: "20px",
      borderRadius: "0px",
      direction: "column",
      maxWidth: "100%",
    },
  },
  {
    type: "divider",
    label: "Divider",
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
    icon: PanelBottom,
    defaultProps: {
      links: [
        { text: "Privacy and Term of Use ", href: "#" },
        { text: "CCPA Policy", href: "#" },
        { text: "Cookies Policy", href: "#" },
        { text: "Unsubscribe", href: "#" },
      ],
    },
    textAlign: "left",
    fontSize: "14px",
    coolr: "#007bff",
  },
  {
    type: "isi",
    label: "Isi Block",
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
                  "Dyslipidemia Hypercholesterolemia and hypertriglyceridemia occurred in patients taking ORSERDU at an incidence of 30% and 27%, respectively. The incidence of Grade 3 and 4 hypercholesterolemia and hypertriglyceridemia were 0.9% and 2.2%, respectively. Monitor lipid profile prior to starting and periodically while taking ORSERDU.",
              },
              {
                isBullet: true,
                content:
                  "Embryo-Fetal Toxicity Based on findings in animals and its mechanism of action, ORSERDU can cause fetal harm when administered to a pregnant woman. Advise pregnant women and females of reproductive potential of the potential risk to a fetus. Advise females of reproductive potential to use effective contraception during treatment with ORSERDU and for 1 week after the last dose. Advise male patients with female partners of reproductive potential to use effective contraception during treatment with ORSERDU and for 1 week after the last dose.",
              },
            ],
          },
          {
            title: "Adverse Reactions",
            items: [
              {
                isBullet: true,
                content:
                  "Serious adverse reactions occurred in 12% of patients who received ORSERDU. Serious adverse reactions in >1% of patients who received ORSERDU were musculoskeletal pain (1.7%) and nausea (1.3%). Fatal adverse reactions occurred in 1.7% of patients who received ORSERDU, including cardiac arrest, septic shock, diverticulitis, and unknown cause (one patient each).",
              },
              {
                isBullet: true,
                content:
                  "The most common adverse reactions (≥10%), including laboratory abnormalities, of ORSERDU were musculoskeletal pain (41%), nausea (35%), increased cholesterol (30%), increased AST (29%), increased triglycerides (27%), fatigue (26%), decreased hemoglobin (26%), vomiting (19%), increased ALT (17%), decreased sodium (16%), increased creatinine (16%), decreased appetite (15%), diarrhea (13%), headache (12%), constipation (12%), abdominal pain (11%), hot flush (11%), and dyspepsia (10%).",
              },
            ],
          },
          {
            title: "Drug Interactions",
            items: [
              {
                isBullet: true,
                 
                content:
                  "Concomitant use with CYP3A4 inducers and/or inhibitors Avoid concomitant use of strong or moderate CYP3A4 inhibitors with ORSERDU. Avoid concomitant use of strong or moderate CYP3A4 inducers with ORSERDU.",
              },
            ],
          },
          {
            title: "Use in Specific Populations",
            items: [
              {
                isBullet: true,
                content:
                  "Lactation Advise lactating women to not breastfeed during treatment with ORSERDU and for 1 week after the last dose.",
              },
              {
                isBullet: true,
                content:
                  "Hepatic Impairmen Avoid use of ORSERDU in patients with severe hepatic impairment (Child-Pugh C). Reduce the dose of ORSERDU in patients with moderate hepatic impairment (Child-Pugh B).",
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
            ],
          },
        ],
      }
    }
   
  },
  {
  type: "bullet-list",
  label: "Bullet Point",
  icon: List,
  defaultProps: {
    listItems: [`List Item`],   // array of strings
  },
}

];
