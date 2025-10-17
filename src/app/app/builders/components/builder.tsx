'use client'
import {api} from "@/trpc/react";
import {useEffect} from "react";
import {DataTable} from "@/components/custom/DataTable";
import {columns} from "@/app/app/builders/components/columns";
import type {builder as builderType} from "@iglu-sh/types/core/db";
export function BuilderOverview({cacheID}:{cacheID:number}){
    // Fetch all builders for the current user
    const builder = api.builder.getAllBuilders.useQuery({cache: cacheID});
    useEffect(() => {
        if(builder.data){
            console.log(builder.data)
        }
        else{
            console.log("No data")
        }
    }, [builder]);
    return (
        <div>
            {
                builder.isLoading || !builder.data ? (<div>Loading...</div>) : (
                    <DataTable columns={columns} data={builder.data as builderType[]} />
                )
            }
        </div>
    )
}