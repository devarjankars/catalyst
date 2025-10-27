import { Layout, Columns, LayoutGrid } from "lucide-react"

export const sectionTemplates = [
  {
    type: "section",
    label: "1 Column Section",
    icon: Layout,
    defaultProps: {
      children: [],
      backgroundColor: "#ffffff",
      padding: "20px",
      borderRadius: "0px",
      direction: "column",
      maxWidth: "100%",
      columns: 1,
    },
  },
  {
    type: "section",
    label: "2 Column Section",
    icon: Columns,
    defaultProps: {
      children: [
        {
          id: "col1",
          type: "section",
          backgroundColor: "#ffffff",
          padding: "15px",
          borderRadius: "4px",
          children: [],
          direction: "column",
          isColumn: true,
        },
        {
          id: "col2",
          type: "section",
          backgroundColor: "#ffffff",
          padding: "15px",
          borderRadius: "4px",
          children: [],
          direction: "column",
          isColumn: true,
        },
      ],
      backgroundColor: "#ffffff",
      padding: "20px",
      borderRadius: "0px",
      direction: "row",
      maxWidth: "100%",
      columns: 2,
      columnsType : "equal",
      gap : "5%"
    },
  },
  {
    type: "section",
    label: "3 Column Section",
    icon: Columns,
    defaultProps: {
      children: [
        {
          id: "col1",
          type: "section",
          backgroundColor: "#f8f9fa",
          padding: "15px",
          borderRadius: "4px",
          children: [],
          direction: "column",
          isColumn: true,
        },
        {
          id: "col2",
          type: "section",
          backgroundColor: "#f8f9fa",
          padding: "15px",
          borderRadius: "4px",
          children: [],
          direction: "column",
          isColumn: true,
        },
        {
          id: "col3",
          type: "section",
          backgroundColor: "#f8f9fa",
          padding: "15px",
          borderRadius: "4px",
          children: [],
          direction: "column",
          isColumn: true
        },
      ],
      backgroundColor: "#ffffff",
      padding: "20px",
      borderRadius: "0px",
      direction: "row",
      maxWidth: "100%",
      columns: 3,
      columnType : "equal",
      gap : "5%"
    },
  },
  
]
