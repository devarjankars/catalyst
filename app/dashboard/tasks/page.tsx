'use client'
import React, { useState } from 'react'
import {useClientStore} from "@/store/client-store"
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Calendar, ChevronRight } from 'lucide-react';
import Link from "next/link"
import Tasktable from '@/components/task-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from '@/components/ui/label';
import dummyTasks from '@/data/dummy-tasks.json';

export default function Mytasks() {
    const [selectedCategory, setCategory] = useState("all");
    const [selectedClient, setClient] = useState("all");
    const [selectedType, setType] = useState("all");
    const {clientsFolders} = useClientStore(); 
    



  return (
     <div className="">
        <div className="filters flex justify-between p-4 border-y border-gray-200 mb-4">
            <div className="brandFilter flex gap-2 items-center">
                <Label>Brand/Client</Label>
                <Select value={selectedClient} onValueChange={(value) => setClient(value)}>
                <SelectTrigger className="w-[180px] rounded-full">
                    <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Stemline">Stemline</SelectItem>
                    <SelectItem value="Ompharma">Ompharma</SelectItem>
                </SelectContent>
                </Select>
            </div>
            <div className="flex gap-4">
                <div className="flex gap-2 items-center">
                    <Label>Category</Label>
                <Select value={selectedCategory} onValueChange={(value) => setCategory(value)}>
                <SelectTrigger className="w-[180px] rounded-full">
                    <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="rte">Branded</SelectItem>
                    <SelectItem value="smpc">Unbranded</SelectItem>
                </SelectContent>
                </Select>
                </div>
                 <div className="flex gap-2 items-center">
                <Label>Type</Label>
                <Select value={selectedType} onValueChange={(value) => setType(value)}>
                <SelectTrigger className="w-[180px] rounded-full">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="rte">Rte</SelectItem>
                    <SelectItem value="smpc">Smpc</SelectItem>
                    <SelectItem value="promotional">Promotional</SelectItem>
                </SelectContent>
                </Select>
            </div>
            </div>
           
        </div>
        <Tasktable tasks={dummyTasks.tasks}/>
    </div>
  )
}
