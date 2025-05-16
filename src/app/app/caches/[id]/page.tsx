'use client';
import {Button} from "@/components/ui/button";
import {cacheInfoObject, cacheRequestLog} from "@/types/api";
import {useEffect, useState} from "react";
import {getCookie} from "cookies-next";
import {Toaster} from "@/components/ui/sonner";
import {toast} from 'sonner'
import {useParams} from "next/navigation";
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
    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">This is the Cache Page</h1>
            <p>This is a description</p>
            <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col gap-4 border-accent border-2 rounded-md p-4 col-span-2">
                    <h1>{cacheData ? cacheData.cache.name : null}</h1>
                    <p>This cache seems to be working perfectly</p>
                </div>
                <div className="flex flex-col gap-4 border-accent border-2 rounded-md p-4 col-span-2">
                    <p>There are currently</p>
                    <h1>{cacheData ? parseInt(cacheData.storage) / 10000000000 : null} GB</h1>
                    <p>in your Cache</p>
                </div>
            </div>
            <Toaster />
        </div>
    )
}