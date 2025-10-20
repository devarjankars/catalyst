'use client'
import React from 'react'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Ellipsis, Folder } from 'lucide-react'

const tasks = [
                    {
                        task_id:"01",
                        taskname:"MAT-US_ELA-930456",
                        task_owner:"karishma",
                        template_id:"123456",
                        template_name:"MAT-US_ELA-930456",
                        resources:["Darshan","Kavya"],
                        createdOn:"10-02-2224",
                        dueDtae:"10-03-2224",
                        priority:"high",
                        type:"RTE",
                        status:"In progress"
                    },
                    {
                        task_id:"02",
                        taskname:"MAT-US_ELA-930457",
                        task_owner:"karishma",
                        template_id:"654321",
                        template_name:"MAT-US_ELA-930457",
                        resources:["Darshan","Kavya"],
                        createdOn:"15-02-2224",
                        dueDtae:"15-03-2224",
                        priority:"medium",
                        type:"RTE",
                        status:"In progress"
                    },
                ]
export default function Tasktable() {

  return (
    <div>
      <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="w-[260px]">Name</TableHead>
                <TableHead>Assigned to</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="">Status</TableHead>
                <TableHead>Prioroty</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="w-[70px]">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.task_id}>
                <TableCell className="flex gap-5 items-center">
                    <Folder />
                    <p>{task.taskname}</p>
                </TableCell>
                <TableCell>
                    <div className="names">
                        {task.resources.map((name => <p key={name}>{name}</p>))}
                    </div>
                </TableCell>
                <TableCell>{task.type}</TableCell>
                <TableCell>
                    <p>{task.status}</p>
                </TableCell>
                <TableCell>{task.priority}</TableCell>
                <TableCell>{task.dueDtae}</TableCell>
                <TableCell className='text-center'>
                    <Popover>
                    <PopoverTrigger><Ellipsis /></PopoverTrigger>
                    <PopoverContent className='w-max p-2'>
                        <div className='p-1'>Edit Details</div>
                        <div className='p-1'>Edit User</div>
                        <div className='p-1 border-t mt-2'>Move to Trash</div>
                    </PopoverContent>
                    </Popover>
                </TableCell>
                </TableRow>
              ))}
                {/* <TableRow>
                <TableCell className="flex gap-5 items-center">
                    <Folder />
                    <p>MAT-US_ELA-930456</p>
                </TableCell>
                <TableCell>
                    <div className="names">
                        <p>Drashan</p>
                    </div>
                </TableCell>
                <TableCell>RTE</TableCell>
                <TableCell>
                    <p>In progress</p>
                </TableCell>
                <TableCell>High</TableCell>
                <TableCell>Sep 20</TableCell>
                <TableCell className='text-center'>
                    <Popover>
                    <PopoverTrigger><Ellipsis /></PopoverTrigger>
                    <PopoverContent className='w-max p-2'>
                        <div className='p-1'>Edit Details</div>
                        <div className='p-1'>Edit User</div>
                        <div className='p-1 border-t mt-2'>Move to Trash</div>
                    </PopoverContent>
                    </Popover>
                </TableCell>
                </TableRow> */}
            </TableBody>
        </Table>
    </div>
  )
}
