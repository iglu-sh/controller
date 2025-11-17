import {api} from "@/trpc/react";
import {useEffect} from "react";

export default function Log({buildID}: {buildID: string}){
    const subscription = api.builder.getLog.useSubscription({"jobID": 1, "cacheID": 1})
    useEffect(()=>{
        console.log(subscription.data)
    }, [subscription])
    return(
        <div className="flex flex-col">
            <div className="flex flex-row gap-2 p-2 bg-card border font-bold" style={{
                borderTopLeftRadius: "var(--radius-lg)",
                borderTopRightRadius: "var(--radius-lg)",
                borderWidth: "1px"
            }}>
                <div>
                    Build Log
                </div>
                <div className="ml-auto">
                    (latest 100 lines)
                </div>
            </div>
            <div className="flex flex-col gap-1 p-2 bg-card border border-t-0 font-mono h-96 overflow-y-scroll text-xs">
                Hier könnte ihr Log stehen
            </div>
        </div>
    )
}