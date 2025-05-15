'use client'
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import CacheTable from "@/components/custom/cacheTable";
import {useEffect, useState} from "react";
import {getCookie} from "cookies-next";
import Link from "next/link";
import './page.css'
export default function CacheOverviewPage(){
    const [caches, setCaches] = useState([]);
    useEffect(()=>{
        const apiKey = getCookie("iglu-session");
        if(!apiKey){
            window.location.href = "/"
        }
        const headers = new Headers()
        headers.append("Authorization", `Bearer ${apiKey}`)
        const requestOptions = {
            method: 'GET',
            headers: headers,
            redirect: 'follow'
        }
        // @ts-ignore
        fetch(`${process.env.NEXT_PUBLIC_URL}/api/v1/caches`, requestOptions)
            .then(response => response.json())
            .then(result => {
                //Check if the caches are all configured correctly and add problems to the problems array
                let toPush = []
                console.log(result.caches[0])
                for(let cache of result.caches){
                    cache["problems"] = []

                    //Rules for the cache to be in an invalid state
                    if(cache.publicsigningkeys === ""){
                        cache.problems.push({
                            "heading" : "No Signing Keys Configured",
                            "description" : "There are no public signing keys configured on this cache. Add one by running cachix generate-keypair <your-cache-name>."
                        })
                    }
                    toPush.push(cache)
                }
                // @ts-ignore
                setCaches(toPush)
            })
            .catch(error => console.log('error', error));
    }, [])

    return (
        <div>
            <h1>
                Caches
            </h1>
            <div>
                Here are all the caches configured on the Server <span className="emphasizedText">{process.env.NEXT_PUBLIC_CACHE_URL}</span>.
            </div>
            <div>
                {
                    //@ts-ignore
                    caches.length === 0 ? <div>Loading Caches...</div> : <CacheTable caches={[caches]} />
                }
            </div>
        </div>
    )
}