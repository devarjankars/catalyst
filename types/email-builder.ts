export interface EmailComponent {
  id: string
  type: "text" | "image" | "button" | "divider" | "section" | "custom"

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

 
  

  // Divider properties (backgroundColor already defined above)
}
