import {builderFrontendPackage} from "@/types/db";
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {badgeColors} from "@/lib/colors";
import {useEffect, useState} from "react";
import {DataTable} from "@/components/custom/dataTable";
import {ColumnDef} from "@tanstack/react-table";
import {builder} from "@/types/api";

const columns:ColumnDef<builder> = [
    {
        accessorKey: "id",
        header: "ID",
    },
    {
        accessorKey: "url",
        header: "URL",
    },
    {
        accessorKey: "public_key",
        header: "Public Key",
    }
]

export default function Overview({builder}:{builder:builderFrontendPackage}){
    const [lastBuild, setLastBuild] = useState<string | null>(null);
    useEffect(() => {
        if(!builder.runs || builder.runs.length === 0){
            setLastBuild("Never");
            return;
        }
        let seconds = (new Date(Date.now())- new Date(builder.runs[0].started_at)) / 1000;
        let returnValue = seconds
        let returnString = "seconds"
        let minutes = Math.floor(seconds / 60);
        let hours = Math.floor(minutes / 60);
        let days = Math.floor(hours / 24);

        // If we have a run that is above 120 seconds old we should try to use minutes
        if(returnValue > 120){
            returnValue = minutes
            returnString = "minutes"
        }
        if(returnValue > 120){
            returnValue = hours
            returnString = "hours"
        }
        if(returnValue > 24){
            returnValue = days
            returnString = "days"
        }
        setLastBuild(`${returnValue} ${returnString} ago`);
    }, []);
    return(
        <div className="grid grid-cols-2 gap-4">
            <Card>
                <CardContent className="flex flex-col gap-2">
                    <h2>Build Details</h2>
                    <div className="flex flex-col gap-2">
                        <div className="text-sm font-semibold">
                            Build Command
                        </div>
                        <div className="font-mono border p-2 rounded-md bg-muted overflow-auto">
                            {builder.buildoptions.command}
                        </div>
                        <div className="text-sm font-semibold">
                           Status
                        </div>
                        <Badge className={badgeColors[builder.runs && builder.runs[0] ? builder.runs[0].status.toLowerCase() : "unknown"]}>
                            {builder.runs && builder.runs[0] ? builder.runs[0].status : "UNKNOWN"}
                        </Badge>
                        <div className="text-sm font-semibold">
                            Last Build
                        </div>
                        {
                            builder.runs && builder.runs[0] ? (
                                <div className="border p-2 rounded-md bg-muted">
                                    {lastBuild}
                                </div>
                            ) : "Never"
                        }
                        <div className="text-sm font-semibold">
                            Trigger Method
                        </div>
                        <div className="border p-2 rounded-md bg-muted">
                            {builder.builder.trigger}
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="flex flex-col gap-2 h-full">
                    <h2>Repository Details</h2>
                    {
                        builder.git.noclone ? (
                            <div className="flex flex-col gap-2 text-center h-full text-blue-500 items-center justify-center">
                                This builder does not clone a git repository, it is configured to use the repository in the build command.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                <div className="text-sm font-semibold col-span-2">
                                    Git Repository
                                </div>
                                <div className="col-span-2 font-mono border p-2 rounded-md bg-muted overflow-auto">
                                    {builder.git.repository}
                                </div>
                                <div className="text-sm col-span-2 font-semibold">
                                   Branch
                                </div>
                                <div className="font-mono col-span-2 border p-2 rounded-md bg-muted overflow-auto">
                                    {builder.git.branch}
                                </div>
                                <div className="text-sm col-span-2 font-semibold">
                                    Authentication
                                </div>
                                {
                                    !builder.git.requiresauth ? (
                                        <div className="col-span-2">
                                            <Badge className="bg-green-300 text-green-800">Public Repository</Badge>
                                        </div>
                                    ) : (
                                        <div className="col-span-2">
                                            <Badge className="bg-red-300 text-red-800">Configured Authentication</Badge>
                                        </div>
                                    )
                                }
                            </div>
                        )
                    }
                </CardContent>
            </Card>
            <Card className="col-span-2">
                <CardContent className="flex flex-col gap-2">
                    <h2>Cache Configuration</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <div className="text-sm font-semibold">
                                Cache Name
                            </div>
                            <div className="font-mono border p-2 rounded-md bg-muted overflow-auto">
                                {builder.cache.name}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="text-sm font-semibold">
                                Build Output Dir
                            </div>
                            <div className="font-mono border p-2 rounded-md bg-muted overflow-auto">
                                {builder.cachix.buildoutputdir}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="text-sm font-semibold">
                                Auto Push
                            </div>
                            <div className="font-mono border p-2 rounded-md bg-muted overflow-auto">
                                {builder.cachix.push ? "Enabled" : "Disabled"}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card className="col-span-2">
                <CardContent className="flex flex-col gap-4">
                    <h2>Build Options</h2>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                Cores
                            </div>
                            <div className="text-end">
                                {builder.buildoptions.cores}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                Parallel Building
                            </div>
                            <div className="text-end">
                                {builder.buildoptions.parallelbuilds ? "Enabled" : "Disabled"}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                Max Jobs
                            </div>
                            <div className="text-end">
                                {builder.buildoptions.maxjobs}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                Keep Going
                            </div>
                            <div className="text-end">
                                {builder.buildoptions.keep_going ? "Enabled" : "Disabled"}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                Extra Args
                            </div>
                            <div className="text-end">
                                {builder.buildoptions.extraargs || "None"}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card className="col-span-2">
                <CardHeader>
                   <h2>
                       Substituters
                   </h2>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                    <DataTable columns={columns} data={builder.buildoptions.substituters.split(" ").map((value:string, index:number)=>{
                        return {
                            id: index,
                            url: value,
                            public_key: builder.buildoptions.trustedpublickeys.split(" ")[index] || "No Public Key"
                        }
                    })} />
                </CardContent>
            </Card>
        </div>
    )
}