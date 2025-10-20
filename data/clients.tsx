
// ---- Task Level ----
interface Task {
  task_id: string;
  task_owner: string;
  template_id: string;
  template_name: string;
  resources: string[];
  createdOn: string;
  dueDtae: string;
  priority: string;
}

// ---- Type Level (Rte, Sfmc, promotional, nonpromotional) ----
// Each type can either hold tasks (Rte, Sfmc) or be empty arrays (promotional, nonpromotional)
interface RteType {
  Rte: { tasks: Task[] }[];
}

interface SfmcType {
  Sfmc: { tasks: Task[] }[];
}

interface PromotionalType {
  promotional: any[]; // later replace with actual structure if needed
}

interface NonPromotionalType {
  nonpromotional: any[];
}

type CategoryType = RteType | SfmcType | PromotionalType | NonPromotionalType;

// ---- Category Level (branded / unbranded) ----
interface Category {
  category: "branded" | "unbranded";
  sharedAssets: string[];
  types: CategoryType[];
}

// ---- Client Level ----
export interface Client {
  id: string;
  label: string;
  count: number;
  clientlogo: string;
  createddate: string;
  categories: Category[];
} 
export const clients : Client[] = [
    { id: "elzonris", label: "Elzonris", count: 0 , clientlogo:"./images/elxonris.png" , createddate:"15-05-2000", categories : [
        {category : "branded",
        sharedAssets :[],
        types:[
            {Rte : [
                {tasks : [
                    {
                        task_id:"01",
                        task_owner:"karishma",
                        template_id:"",
                        template_name:"",
                        resources:[],
                        createdOn:"",
                        dueDtae:"",
                        priority:"",
                    },
                    {
                        task_id:"02",
                        task_owner:"karishma",
                        template_id:"",
                        template_name:"",
                        resources:[],
                        createdOn:"",
                        dueDtae:"",
                        priority:"",
                    },
                ]}
            ]},
             {Sfmc:[
                {tasks : [
                    {
                        task_id:"03",
                        task_owner:"karishma",
                        template_id:"",
                        template_name:"",
                        resources:[],
                        createdOn:"",
                        dueDtae:"",
                        priority:"",
                    },
                    {
                        task_id:"04",
                        task_owner:"karishma",
                        template_id:"",
                        template_name:"",
                        resources:[],
                        createdOn:"",
                        dueDtae:"",
                        priority:"",
                    },
                ]}
             ]},
             {promotional:[]},
             {nonpromotional:[]}
            
        ]
        },
        {category : "unbranded",
        sharedAssets :[],
        types:[
            {Rte : []},
             {Sfmc:[]},
             {promotional:[]},
             {nonpromotional:[]}
            
        ]
        }
    ]  },
    { id: "orserdu", label: "Orserdu", count: 0 , clientlogo:"./images/elxonris.png" , createddate:"15-05-2000", categories : [
        {category : "branded",
        sharedAssets :[],
        types:[
            {Rte : []},
             {Sfmc:[]},
             {promotional:[]},
             {nonpromotional:[]}
            
        ]
        },
        {category : "unbranded",
        sharedAssets :[],
        types:[
            {Rte : []},
             {Sfmc:[]},
             {promotional:[]},
             {nonpromotional:[]}
            
        ]
        }
    ]  },
    { id: "stemline", label: "Stemline", count: 0 , clientlogo:"./images/elxonris.png" , createddate:"15-05-2000", categories : [
        {category : "branded",
        sharedAssets :[],
        types:[
            {Rte : []},
             {Sfmc:[]},
             {promotional:[]},
             {nonpromotional:[]}
            
        ]
        },
        {category : "unbranded",
        sharedAssets :[],
        types:[
            {Rte : []},
             {Sfmc:[]},
             {promotional:[]},
             {nonpromotional:[]}
            
        ]
        }
    ]  },
    { id: "lilly", label: "Lilly", count: 0 , clientlogo:"./images/elxonris.png" , createddate:"15-05-2000", categories : [
        {category : "branded",
        sharedAssets :[],
        types:[
            {Rte : []},
             {Sfmc:[]},
             {promotional:[]},
             {nonpromotional:[]}
            
        ]
        },
        {category : "unbranded",
        sharedAssets :[],
        types:[
            {Rte : []},
             {Sfmc:[]},
             {promotional:[]},
             {nonpromotional:[]}
            
        ]
        }
    ]  },
    { id: "allergan", label: "Allergan", count: 0 , clientlogo:"./images/elxonris.png" , createddate:"15-05-2000", categories : [
        {category : "branded",
        sharedAssets :[],
        types:[
            {Rte : []},
             {Sfmc:[]},
             {promotional:[]},
             {nonpromotional:[]}
            
        ]
        },
        {category : "unbranded",
        sharedAssets :[],
        types:[
            {Rte : []},
             {Sfmc:[]},
             {promotional:[]},
             {nonpromotional:[]}
            
        ]
        }
    ]  },
    { id: "novartis", label: "Novartis", count: 0 , clientlogo:"./images/elxonris.png" , createddate:"15-05-2000", categories : [
        {category : "branded",
        sharedAssets :[],
        types:[
            {Rte : []},
             {Sfmc:[]},
             {promotional:[]},
             {nonpromotional:[]}
            
        ]
        },
        {category : "unbranded",
        sharedAssets :[],
        types:[
            {Rte : []},
             {Sfmc:[]},
             {promotional:[]},
             {nonpromotional:[]}
            
        ]
        }
    ]  },
    { id: "ompharma", label: "Om Pharma", count: 0 , clientlogo:"./images/elxonris.png" , createddate:"15-05-2000", categories : [
        {category : "branded",
        sharedAssets :[],
        types:[
            {Rte : []},
             {Sfmc:[]},
             {promotional:[]},
             {nonpromotional:[]}
            
        ]
        },
        {category : "unbranded",
        sharedAssets :[],
        types:[
            {Rte : []},
             {Sfmc:[]},
             {promotional:[]},
             {nonpromotional:[]}
            
        ]
        }
    ]  },
  ]