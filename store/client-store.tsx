import {create} from 'zustand'
import {devtools , persist} from 'zustand/middleware'
import {Client} from '../data/clients'


// ---- Store ----
interface ClientStore {
  clientsFolders: Client[];
  getClients: () => string[];
  getTypes: () => string[];
}


const clients : Client[] = [
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

export const useClientStore = create<ClientStore>()(
  devtools((set, get) => ({
    clientsFolders: clients,
    getClients: () => get().clientsFolders.map((client) => client.label),

    // getTypes: (clientId: string) => {
    //   const client = get().clientsFolders.find((c) => c.id === clientId);
    //   if (!client) return [];
    //   return client.categories.flatMap((cat) => cat.types.map((t) => t.name));
    // },

    // createTask: (
    //   clientId: string,
    //   categoryName: "branded" | "unbranded",
    //   typeName: string,
    //   task: Task
    // ) =>
    //   set((state) => {
    //     return {
    //       clientsFolders: state.clientsFolders.map((client) => {
    //         if (client.id !== clientId) return client;

    //         return {
    //           ...client,
    //           categories: client.categories.map((cat) => {
    //             if (cat.category !== categoryName) return cat;

    //             return {
    //               ...cat,
    //               types: cat.types.map((t) => {
    //                 if (t.name !== typeName) return t;
    //                 return {
    //                   ...t,
    //                   tasks: [...t.tasks, task],
    //                 };
    //               }),
    //             };
    //           }),
    //         };
    //       }),
    //     };
    //   }),

    // getTaskList: (resourceName: string) => {
    //   const allTasks: Task[] = [];
    //   get().clientsFolders.forEach((client) => {
    //     client.categories.forEach((cat) => {
    //       cat.types.forEach((t) => {
    //         t.tasks.forEach((task) => {
    //           if (task.resources.includes(resourceName)) {
    //             allTasks.push(task);
    //           }
    //         });
    //       });
    //     });
    //   });
    //   return allTasks;
    // },
  }))
);
