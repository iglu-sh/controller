'use client'
import {ChevronDown, Plus} from "lucide-react";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {usePathname, useSearchParams} from "next/navigation";
import {useEffect} from "react";

export default function CacheDropdown({caches}: {caches: {id:string, name:string, description:string}[]}){
    // Use tRPC to fetch the caches for this user
    const params = useSearchParams()
    const cacheID = params.get("cacheID")!;
    const pathname = usePathname()
    useEffect(() => {
        if(!caches.find((cache) => cache.id === cacheID && window)){
            // Redirect to the first cache if the cacheID is not valid
            if(!caches[0]){
                return
            }
            window.location.href = `${pathname}?cacheID=${caches[0].id}`;
        }
    }, []);
    if(!caches){
        return <div>
            Loading Caches...
        </div>
    }
    if(!caches.find((cache) => cache.id === cacheID)){
        if(!caches || caches.length === 0 || !caches[0]){
            return <div>No Caches found!</div>
        }
        return <div>
            Loading Caches...
        </div>
    }
   return(
       <div className="flex flex-row items-center gap-2">
           <DropdownMenu>
               <DropdownMenuTrigger className="w-full" asChild>
                   <Button variant="ghost" className="flex flex-row items-start p-2 h-full w-full">
                   <div className="flex flex-row items-center p-2 w-full">
                       <div className="flex flex-col gap-1 w-full items-start">
                           <strong>
                               {caches.find((cache)=> cache.id === cacheID)?.name ?? "Select Cache"}
                           </strong>
                           <div className="text-muted-foreground text-sm">
                               {caches.find((cache)=> cache.id === cacheID)?.description ?? "Select a cache to manage"}
                           </div>
                       </div>
                       <ChevronDown />
                   </div>
                   </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="start" className="w-[205px]">
                       {
                           caches.map((cache, index)=>{

                               return(
                                   <DropdownMenuItem className="flex flex-col gap-1 items-start" key={index}>
                                       <Link href={`${pathname}?cacheID=${cache.id}`} key={cache.id} className="w-full">
                                           <strong>
                                               {cache.name}
                                           </strong>
                                           <div className="text-muted-foreground text-sm">
                                               {cache.description}
                                           </div>
                                       </Link>
                                   </DropdownMenuItem>
                               )
                           })
                       }
                   <DropdownMenuItem>
                       <Link href={`/app/caches/create?cacheID=${cacheID}`} className="flex flex-row items-center gap-2 w-full">
                           <Plus />
                           Create New Cache
                       </Link>
                   </DropdownMenuItem>
               </DropdownMenuContent>
           </DropdownMenu>
       </div>
   )
}