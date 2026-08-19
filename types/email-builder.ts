export interface EmailComponent {
  id: string
  type: "text" | "image" | "button" | "divider" | "section" | "custom" | "cta-button" | "footer-links" | "footer-links(3)" | "isi" | "bullet-list" | "header-image" | "Salutation" | "footer-tokens" | "orsedu-footer" | "chevron-divider" | "footer-link-2" | "image-with-link" | "ferring-footer" | "raw-html" | "elzonris-isi" | "footer-link-3" | "footer-with-Preferences" | "elzonris-divider" | "elzonris-brand-logo" | "elzonris-pi" | "elzonris-ref-abbr" | "elzonris-references" | "elzonris-abbreviations" | "elzonris-view-in-browser" | "email-footer" | "custom-text" | "tryvio-footer" | "orserdu-emerald-stats"

  category: "basic" | "custom" | "ferring" | "user-created" | "idorsia"

  // Custom component properties
  isCustom?: boolean
  name?: string
  html?: string

  // Common properties
  padding?: string
  displayType?: "all" | "mobile-only" | "desktop-only"


  // Section properties
  children?: EmailComponent[] | null
  backgroundColor?: string
  borderRadius?: string
  margin?: string
  maxWidth?: string
  direction?: "row" | "column"
  columns?: number
  isColumn?: boolean
  isHero?: boolean
  columnsType?: "equal" | "custom"
  gap?: string

  // Column-specific properties
  columnAlignment?: "left" | "center" | "right"
  columnVerticalAlignment?: "top" | "middle" | "bottom"
  columnWidth?: string
  columnMinHeight?: string

  // Text properties
  content?: string
  fontSize?: string
  color?: string
  textAlign?: "left" | "center" | "right"
  fontWeight?: "normal" | "bold" | "lighter"
  lineHeight?: string
  fontFamily?: string

  // Image properties
  src?: string
  alt?: string
  width?: string
  height?: string
  dataPlaceholder?: string

  // Button properties
  text?: string
  href?: string
  linkTitle?: string
  buttonPadding?: string

  //cta-button properties
  imageSrc?: string
  imageAlt?: string

  //elzonris-pi properties
  piHref?: string
  isiHref?: string
  piTitle?: string
  isiTitle?: string
  linkColor?: string

  //footer-links properties
  links?: { text: string; href: string; title?: string; color?: string }[]
  logoA: { altTex: string, href: string, imgSrc: string }
  logoB: { altTex: string, href: string, imgSrc: string }
  jobCode?: string
  socialMediaLinks?: { altText: string; href: string, iconSrc: string }[]
  logo?: { altTex: string, href: string, logoSrc: string }
  address?: string

  //isi properties
  importantSafetyInformation?: {
    sections: {
      title: string
      items: {
        isBullet: boolean
        content: string
      }[]
    }[]
  }

  // bullet-list properties
  markerColor?: string
  discSize?: string
  listItems?: string[]
  spaceBetweenItems?: string

  // footer tokens properties
  footerTokens?: {
    regards?: string
    userPhoto?: string
    userName?: string
    userEmailAddress?: string
    userPhone?: string
    company?: string
  }

  footerText?: {
    reg?: string
    year?: string
    address?: string
    rights?: string
    jobcode?: string
  },

  // custom-text (Veeva token) properties
  customTextOptions?: string[]   // array of option strings that go inside {{customText[opt1|opt2|...]}}

  // elzonris references / abbreviations properties
  references?: string
  abbreviations?: string

  // tryvio-footer properties
  tryvioFooterLogoSrc?: string
  tryvioFooterLogoHref?: string
  tryvioFooterLogoAlt?: string
  tryvioFooterEmailLine?: string
  tryvioFooterSentByLine?: string
  tryvioFooterAddressLine?: string
  tryvioFooterPrivacyText?: string
  tryvioFooterPrivacyHref?: string
  tryvioFooterUnsubscribeText?: string
  tryvioFooterUnsubscribeHref?: string
  tryvioFooterLinkedinSrc?: string
  tryvioFooterLinkedinHref?: string
  tryvioFooterLinkedinAlt?: string
  tryvioFooterCopyrightText?: string
  tryvioFooterCopyrightHref?: string
  tryvioFooterJobCode?: string
  tryvioFooterIdorsiaLogoSrc?: string
  tryvioFooterIdorsiaLogoHref?: string
  tryvioFooterIdorsiaLogoAlt?: string

  // orserdu-emerald-stats properties
  emeraldLeftIconSrc?: string
  emeraldLeftIconAlt?: string
  emeraldLeftHeading?: string
  emeraldLeftStat?: string
  emeraldLeftHR?: string
  emeraldRightStatNumber?: string
  emeraldRightStatLabel?: string
  emeraldRightDesc?: string
  emeraldRightStat?: string
  emeraldRightHR?: string
}
