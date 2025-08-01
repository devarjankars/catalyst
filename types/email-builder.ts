export interface EmailComponent {
  id: string
  type: "text" | "image" | "button" | "divider" | "section" | "custom" | "cta-button" | "footer-links" | "isi"

  // Custom component properties
  isCustom?: boolean
  name?: string
  html?:string

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

  // Image properties
  src?: string
  alt?: string
  width?: string
  height?: string
  dataPlaceholder?: string

  // Button properties
  text?: string
  href?: string
  buttonPadding?: string

  //cta-button properties
  imageSrc?: string
  imageAlt?: string

 //footer-links properties
  links?: { text: string; href: string }[]

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
  

  // Divider properties (backgroundColor already defined above)
}
