'use client'

import {useClientStore} from "@/store/client-store"
import { notFound } from "next/navigation";
import { Calendar, ChevronRight, Folder } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import AssetDialog from "@/components/asset-dialog";


export default function ClientFoldersPage({
  params,
}: {
  params: { clientId: string };
}) {
    const clientsFolders = useClientStore((state) => state.clientsFolders);  
    
  const client = clientsFolders.find((c) => c.id === params.clientId);


  const [openAssetDialog, setOpenAssetDialog] = useState(false);


  const handleCloseAssetDialog = () => {
    setOpenAssetDialog(false);
  }

  if (!client) return notFound();

  return (
    <>
    <div>
      <h1 className="text-xl font-bold mb-4">{client.label}</h1>
      <div className="categories w-full flex gap-6" onClick={()=>setOpenAssetDialog(true)}>
        <Card className="w-1/3 relative">
          <CardContent className="flex items-center gap-3 py-3">
            <div className="logo w-12 h-auto">
              <Folder />
            </div>
            <div className="title font-bold">Assets</div>
          </CardContent>
          <CardFooter className="text-[#717182] text-xs flex gap-2 items-center py-3">
            <Calendar className="w-3" /> Created 15-5-2000
          </CardFooter>
          <ChevronRight className="absolute h-[20px] top-[calc(50%-10px)] right-2 text-[#717182]" />
        </Card>
      </div>
      <h1 className="text-xl font-bold mt-6 mb-4">Emailers</h1>
      <div className="tabs">
        <ul className="flex flex-wrap text-sm font-medium text-center text-[#434343] dark:text-gray-400">
          <li className="me-2">
            <Button
              className="inline-block px-4 min-w-36 py-3 rounded-full bg-white text-[#434343] hover:font-semibold hover:bg-[#BC2030] hover:text-white dark:hover:bg-gray-800 dark:hover:text-white active"
              aria-current="page"
            >
              All
            </Button>
          </li>
          <li className="me-2">
            <Button className="inline-block px-4 min-w-36 py-3 rounded-full bg-white text-[#434343] hover:font-semibold hover:bg-[#BC2030] hover:text-white dark:hover:bg-gray-800 dark:hover:text-white">
              RTE
            </Button>
          </li>
          <li className="me-2">
            <Button className="inline-block px-4 min-w-36 py-3 rounded-full bg-white text-[#434343] hover:font-semibold hover:bg-[#BC2030] hover:text-white dark:hover:bg-gray-800 dark:hover:text-white">
              SFMC
            </Button>
          </li>
          <li className="me-2">
            <Button className="inline-block px-4 min-w-36 py-3 rounded-full bg-white text-[#434343] hover:font-semibold hover:bg-[#BC2030] hover:text-white dark:hover:bg-gray-800 dark:hover:text-white">
              Promotional
            </Button>
          </li>
          <li>
            <Button className="inline-block px-4 min-w-36 py-3 rounded-full bg-white text-[#434343] hover:font-semibold hover:bg-[#BC2030] hover:text-white dark:hover:bg-gray-800 dark:hover:text-white">
              Non Promotional
            </Button>
          </li>
        </ul>
      </div>
    </div>
    { openAssetDialog && <AssetDialog open={openAssetDialog} onCLose={handleCloseAssetDialog} clientId={client.id} />}
    </>
  );
}
