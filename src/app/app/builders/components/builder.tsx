'use client'
import {api} from "@/trpc/react";
import {useEffect} from "react";

export function BuilderOverview({cacheID}:{cacheID:number}){
    // Fetch all builders for the current user
    const builder = api.builder.getAllBuilders.useQuery({cache: cacheID});
    useEffect(() => {
        console.log(builder)
    }, [builder]);
    return (
        <div>
            BUILDERS
            {
                JSON.stringify(builder.data, null, 2)
            }
        </div>
    )
}