'use client';
import {Button} from "@/components/ui/button";
import {cacheInfoObject, cacheRequestLog} from "@/types/api";
import {useEffect, useState} from "react";
import {getCookie} from "cookies-next";
import {Toaster} from "@/components/ui/sonner";
import {toast} from 'sonner'
import {useParams} from "next/navigation";
import TrafficChart from "@/components/custom/cacheOverview/trafficChart";
import UsageSuggestion from "@/components/custom/cacheOverview/usageSuggestion";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Link from "next/link";
import Status from "@/components/custom/cacheOverview/status";

export default function CacheDetails() {
    const {id} = useParams()
    const [cacheData, setCacheData] = useState<cacheInfoObject | null>(null)
    useEffect(() => {
        // Fetch the cache data from the API
        const apiKey = getCookie('iglu-session')
        if(!apiKey){
            console.error("No API key found")
            window.location.href = "/"
        }

        //Get the cache data
        async function wrap(){
            const requestOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                }
            }
            await fetch(`${process.env.NEXT_PUBLIC_URL}/api/v1/caches/${id}`, requestOptions)
                .then(response => response.json())
                .then(data => setCacheData(data))
                .catch(err => toast.error("Error fetching cache data, please retry later."))
        }
        wrap()
    }, []);

    if(!cacheData){
        return(
            <div>
                Now Loading...
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/app">Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/app/caches">Caches</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{cacheData ? cacheData.cache.name : <div>Loading...</div>}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-4">
                    <h1 className="text-2xl font-bold">{cacheData?.cache.name}</h1>
                    <p>This cache is reachable on url <span className="text-green-600">{cacheData ? `${cacheData.cache.uri}/${cacheData.cache.name}` : null}</span></p>
                </div>
                <div className="flex end-0">
                    <Link href={`/app/caches/${id}/settings`}>
                        <Button variant="secondary">Settings</Button>
                    </Link>
                </div>
            </div>
            <div className="grid grid-cols-4 gap-4 w-full">
                {cacheData ? <Status cacheData={cacheData}/> : <div>Loading...</div> }
                <div className="flex flex-col gap-4 border-accent border-2 rounded-md p-4">
                    <p>There are currently</p>
                    <h1>{cacheData && parseInt(cacheData.storage.storageUsed) ? (parseInt(cacheData.storage.storageUsed) / 10000000000).toFixed(5) : 0 } GB</h1>
                    <p>in your Cache</p>
                </div>
                <div className="flex flex-col gap-4 border-accent border-2 rounded-md p-4">
                    <p>You have cached</p>
                    <h1>{cacheData ? cacheData.storage.storeHashes : 0 } Hashes</h1>
                    <Button onClick={()=>{window.location.href = `/app/caches/${id}/hashes`}}>Explore them all</Button>
                </div>
                {
                    cacheData && cacheData.request.length != 0 && cacheData.request.length != 0 ? <TrafficChart data={cacheData} /> : <div className="flex flex-col gap-4 border-accent border-2 rounded-md p-4 col-span-4"><h1>No Stats yet</h1><p>Push some stuff to your Cache to see stats</p></div>
                }
                {
                    cacheData ? <UsageSuggestion data={cacheData} /> : null
                }
            </div>
            <Toaster />
        </div>
    )
}