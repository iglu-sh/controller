'use client'
import {use, useEffect} from "react";
import {api} from "@/trpc/react";
import {useRouter} from "next/navigation";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import Link from "next/link";
import Log from "@/components/custom/builder/run/log";

export default function RunPage({params}: {params: Promise<{ runID: string }>}){
    const runDetails = api.builder.getRunDetails.useQuery({runID: use(params).runID}, {retry: false})
    const {runID} = use(params)
    const router = useRouter()
    useEffect(() => {
        if(runDetails.isError){
            router.push("/404")
        }
    }, [runDetails.isError]);
    useEffect(() => {
        console.log(runDetails.data)
    }, [runDetails.data]);
    if(!runDetails.data){
        return (
            <div>
                Loading...
            </div>
        )
    }
    return <div  className="flex flex-col gap-1 w-full">
        <h1 className="text-3xl font-bold">Run Details</h1>
        <div className="text-xs text-muted-foreground">
            Run Details for run: {runID}
        </div>
        <div className="grid grid-cols-2 gap-2">
            <Card>
                <CardHeader>
                    <CardTitle>
                        Running On
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <h3 className="text-xl font-bold">
                        {
                            runDetails.data.builder_run.node_info.node_name
                        }
                    </h3>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>
                        State
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <h3 className="text-xl font-bold">
                        {
                            runDetails.data.builder_run.run.status
                        }
                    </h3>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>
                        Started at
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <h3 className="text-xl font-bold">
                        {
                            new Date(runDetails.data.builder_run.run.started_at ?? Date.now()).toDateString()
                        }
                    </h3>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>
                        Config
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <h3 className="text-xl font-bold">
                        <Link href={`/app/builders/details/${runDetails.data.builder.id}`}
                            className="text-primary"
                        >
                            {
                                runDetails.data.builder.name
                            }
                        </Link>
                    </h3>
                </CardContent>
            </Card>
            <div className="col-span-2 h-full overflow-y-auto">
                <Log />
            </div>
        </div>
    </div>
}