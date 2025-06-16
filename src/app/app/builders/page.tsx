'use client'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {DataTable} from "@/components/custom/dataTable";
import {ColumnDef} from "@tanstack/react-table";
import {builder} from "@/types/api";
import {useEffect, useState} from "react";
import {useSearchParams} from "next/navigation";
import {getCookie} from "cookies-next";
import {Toaster} from "@/components/ui/sonner";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {Play, Plus} from "lucide-react";
import Link from "next/link";
import {Badge} from "@/components/ui/badge";
import {dbBuilder} from "@/types/db";
import {
    Dialog, DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";

function RunBuilder({ builder }: { builder: dbBuilder }) {
    const [finished, setFinished] = useState(false);
    const [runId, setRunId] = useState<number | null>(null);
    const [open, setOpen] = useState(false);
    // This calls the provided webhook URL to start the builder
    async function startBuilder(){
        const response = await fetch(builder.builder.webhookurl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${getCookie('iglu-session')}`,
            }
        })
        if(!response.ok){
            toast.error("Error starting builder. Please try again later.");
            return;
        }
        if(response.status === 208){
            toast.warning('Builder is already running. Please wait for it to finish before starting a new run. (or set parallelBuilds to true)');
            return
        }
        const run = await response.json();
        console.log(run)
        const listenURL = run.listenURL
        const runId = run.runID;
        setRunId(runId);
        setFinished(true)
    }

    useEffect(()=>{
        if(!open) {
            setFinished(false)
            setRunId(null);
            return
        }
        startBuilder();
    }, [open])
    return (
        <Dialog onOpenChange={()=>{setOpen(!open)}}>
            <DialogTrigger asChild>
                <Button><Play /></Button>
            </DialogTrigger>
            <DialogContent className="w-full">
                <DialogHeader>
                    <DialogTitle>Starting Builder "{builder.builder.name}"</DialogTitle>
                    <DialogDescription>
                        {
                            finished ? (
                                "Your builder has been started successfully. You can now view the run details."
                            ): (
                               "Starting your builder. This may take some time."
                            )
                        }
                    </DialogDescription>
                </DialogHeader>
                {
                    finished === true ? (
                        <div className="grid grid-cols-2 w-full gap-4">
                            <DialogClose asChild>
                                <Button variant="outline" className="w-full">Go back</Button>
                            </DialogClose>
                            <a href={`/app/builders/run/${runId}`} className="w-full">
                                <Button className="w-full">Go to run</Button>
                            </a>
                        </div>
                    ) : (
                        <DialogClose className="w-full" asChild>
                            <Button variant="outline" className="w-full">Go back</Button>
                        </DialogClose>
                    )
                }
            </DialogContent>
        </Dialog>
    )
}

const columns:ColumnDef<builder> = [
    {
        accessorKey: "id",
        id: "id",
        header: "ID",
    },
    {
        accessorKey: "builder.name",
        header: "Name",
    },
    {
        accessorKey: "builder.description",
        header: "Description",
    },
    {
        accessorKey: "lastrun",
        header: "Last Run",
        cell: ({row})=>{
            const colorMap = {
                "no runs yet": "bg-gray-200 text-gray-800",
                queued: "bg-gray-300 text-gray-800",
                running: "bg-blue-300 text-blue-800",
                success: "bg-green-300 text-green-800",
                failed: "bg-red-300 text-red-800",
                cancelled: "bg-yellow-300 text-yellow-800",
                unknown: "bg-gray-300 text-gray-800"
            }
            const status = row.original.lastrun?.status || "No runs yet";
            const color = colorMap[status.toLowerCase()] || "bg-gray-300 text-gray-800";
            return(
                <Badge className={color}>
                    {status}
                </Badge>
            )
        }
    },
    {
        accessorKey: "builder.id",
        header: "Actions",
        cell: ({row}) => (
            <div className="flex gap-2">
                <RunBuilder builder={row.original} />
                <button className="btn btn-primary" onClick={() => alert(`Edit builder ${row.original.builder.id}`)}>Edit</button>
                <button className="btn btn-secondary" onClick={() => alert(`Delete builder ${row.original.builder.id}`)}>Delete</button>
            </div>
        )
    }
]
export default function Builder(){
    const searchParams = useSearchParams()
    const [builders, setBuilders] = useState<builder[]>([]);
    async function fetchBuilders() {
        if(!searchParams.has('cache') || searchParams.get('cache') === "all"){
            //Fetch every cache this user has access too and redirect him to the first one
            console.log('Fetching user data to get caches...')
            const userData = await fetch(`/api/v1/user`, {
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${getCookie('iglu-session')}`
                }
            })
            if(!userData.ok){
                toast.error("Error fetching user data. Please try again later.")
                return
            }
            const user = await userData.json()
            if(user.caches.length === 0){
                toast.error("You don't have any caches. Please create one first.")
                return
            }
            window.location.href = `/app/builders?cache=${user.caches[0].id}`;
        }

        //Fetch the builders for the current cache
        const cacheId = searchParams.get('cache');
        if(!cacheId){
            toast.error("No cache selected. Please select a cache to view builders.");
            return;
        }
        console.log(`Fetching builders for cache ${cacheId}...`);
        const caches = await fetch(`/api/v1/builder?cacheID=${cacheId}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${getCookie('iglu-session')}`
            }
        })
        if(!caches.ok){
            toast.error("Error fetching builders. Please try again later.");
            return;
        }
        const data = await caches.json();
        setBuilders(data);
        console.log(data)
    }
    useEffect(() => {
        fetchBuilders()
    }, []);

    //Check if the cache param changes
    useEffect(() => {
        fetchBuilders()
    }, [searchParams]);
    return (
            <Card>
                <CardHeader>
                    <CardTitle>
                        <h1>
                            Builder Management
                        </h1>
                    </CardTitle>
                    <CardDescription>
                        <div className="grid grid-cols-4">
                            <div className="col-span-3 items-center flex">
                                This section allows you to create, edit, and manage your builders.
                            </div>
                            <Link href={"/app/builders/create"}>
                                <Button>
                                    <Plus />
                                    Create New Builder
                                </Button>
                            </Link>
                        </div>
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <DataTable columns={columns} data={builders} baseLink={`${process.env.NEXT_PUBLIC_URL}/app/builders`} keyToAppendToLink={"builder"}/>
                </CardContent>
                <Toaster />
            </Card>
    );
}