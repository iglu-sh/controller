'use client'
import {api} from "@/trpc/react";
import {useParams} from "next/navigation";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {CircleAlert, CircleCheck, Clock, Copy, CopyIcon, Table} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Label} from "@/components/ui/label";
import {Badge} from "@/components/ui/badge";

export default function BuilderDetailsPage(){
    const params = useParams()
    const builderID = params.builderID
    if(!builderID || isNaN(parseInt(builderID.toString()))){
        return <div>Invalid Builder ID</div>
    }
    const builder = api.builder.getBuilderById.useQuery({id: parseInt(builderID.toString())})
    const runs = api.builder.getRunsForBuilder.useQuery({id: parseInt(builderID.toString())})
    if(builder.isLoading || !builder.data || runs.isLoading || !runs.data){
        return <div>Loading...</div>
    }
    return(
        <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-row justify-between items-center w-full">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold">Builder Details Page</h1>
                    <p>Overview for Builder {builder.data.builder.name}</p>
                </div>
                <div className="flex flex-row gap-2">
                    <Button>Edit Builder</Button>
                    <Button variant="secondary">Trigger Build</Button>
                    <Button variant="destructive">Delete Builder</Button>
                </div>
            </div>
            <div className="grid grid-cols-4 w-full gap-4">
                <Card className="w-full">
                    <CardHeader className="flex justify-between items-center flex-row w-full">
                        <h2>Runs</h2>
                        <Table />
                    </CardHeader>
                    <CardContent>
                        <div className="font-bold text-xl">
                            {runs.data.totalRuns}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Runs</div>
                    </CardContent>
                </Card>
                <Card className="w-full">
                    <CardHeader className="flex justify-between items-center flex-row w-full">
                        <h2>Last Run</h2>
                        <Clock />
                    </CardHeader>
                    <CardContent>
                        <div className="font-bold text-xl">
                            {runs.data.runDetails[0]?.builder_run.run.duration ?? "N/A"}
                        </div>
                        <div className="text-sm text-muted-foreground">Last run Duration</div>
                    </CardContent>
                </Card>
                <Card className="w-full">
                    <CardHeader className="flex justify-between items-center flex-row w-full">
                        <h2>Success</h2>
                        <CircleCheck />
                    </CardHeader>
                    <CardContent>
                        <div className="font-bold text-xl">
                            {runs.data.runStates.success}
                        </div>
                        <div className="text-sm text-muted-foreground">Successfully build jobs</div>
                    </CardContent>
                </Card>
                <Card className="w-full">
                    <CardHeader className="flex justify-between items-center flex-row w-full">
                        <h2>Unsuccessfull</h2>
                        <CircleAlert />
                    </CardHeader>
                    <CardContent>
                        <div className="font-bold text-xl">
                            {runs.data.runStates.failed + runs.data.runStates.canceled}
                        </div>
                        <div className="text-sm text-muted-foreground">Runs with errors</div>
                    </CardContent>
                </Card>
            </div>
            <div className="w-full grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">
                            General Configuration
                        </CardTitle>
                        <CardDescription>
                            Overview of the general builder configuration
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                        <div className="flex flex-row gap-2 justify-between items-center">
                            <Label>Builder Name</Label>
                            <Badge className="font-bold" variant="secondary">{builder.data.builder.name}</Badge>
                        </div>
                        <div className="flex flex-row gap-2 justify-between items-center">
                            <Label>Arch</Label>
                            <Badge className="font-bold" variant="secondary">{builder.data.builder.arch}</Badge>
                        </div>
                        <div className="flex flex-row gap-2 justify-between items-center">
                            <Label>Trigger Type</Label>
                            <Badge className="font-bold" variant="secondary">{builder.data.builder.trigger}</Badge>
                        </div>
                        <div className="flex flex-row gap-2 justify-between items-center">
                            <Label>Webhook URL</Label>
                            {/*Show the webhook url but only the first 20 chars*/}
                            <Button variant="ghost" onClick={(e)=>{
                                void navigator.clipboard.writeText(builder.data!.builder.webhookurl)
                            }} className="p-0">
                                <Badge className="font-bold" variant="secondary">{builder.data.builder.webhookurl.slice(0, 30)}...</Badge>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}