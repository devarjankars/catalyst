'use client'
import React from 'react'
import {useClientStore} from "@/store/client-store"
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Calendar, ChevronRight } from 'lucide-react';
import Link from "next/link"

export default function Projectfolders() {
    const {clientsFolders} = useClientStore(); 
  return (
    <div className=''>
    <h1 className='mb-3 font-bold'>Project Folders</h1>
     <div className="projects grid grid-cols-3 gap-4">
              {clientsFolders.map(client => 
              <Link className='inline-block rounded-2xl' key={client.id} href={`/dashboard/folders/${client.id}`}>
                  <Card className=" relative">
                  <CardContent className="flex items-center gap-3 py-3">
                    <div className="logo w-12 h-12 rounded-full shadow-md"><img className="w-full h-auto" src={client.clientlogo} alt="" /></div>
                    <div className="title font-bold">{client.label}</div>
                  </CardContent>
                  <CardFooter className="text-[#717182] text-xs flex gap-2 items-center py-3">
                   <Calendar className="w-3" /> Created {client.createddate}
                  </CardFooter>
                  <ChevronRight className="absolute h-[20px] top-[calc(50%-10px)] right-2 text-[#717182]" />
                  </Card>
              </Link> )}  
    </div>
    </div>
  )
}
