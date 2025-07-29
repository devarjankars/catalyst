import { ImageIcon, Square, Minus, Type, Layout, LayoutIcon } from "lucide-react"

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
 
]
