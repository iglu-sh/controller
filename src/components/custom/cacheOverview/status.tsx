import {cacheInfoObject, problem} from "@/types/api";
import {useEffect, useState} from "react";

export default function({cacheData}:{cacheData:cacheInfoObject}){
    const [problems, setProblems] = useState<problem[]>([])
    useEffect(()=>{
        if(!cacheData.cache.publicsigningkeys|| cacheData.cache.publicsigningkeys.length === 0){
            problems.push({
                heading:"Public signing key not set",
                description: "You need to set a public signing key to use this cache. You can do this by going to the settings page and setting a public signing key, or setting one through Cachix",
            })
        }
    }, [])

    return(
        <div className="flex flex-col gap-4 border-accent border-2 rounded-md p-4 col-span-2">
            <h1>{problems.length == 0 ? <span className="text-green-500">Working</span> : <span className="text-orange-400">Has Errors!</span>}</h1>
            {
                problems.length == 0 ? <p>Your cache is working correctly</p> : <p>{problems[0].description}</p>
            }
        </div>
    )
}