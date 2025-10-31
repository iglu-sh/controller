import type {ColumnDef} from "@tanstack/react-table";
import {type builder, type combinedBuilder, type dbQueueEntry} from "@iglu-sh/types/core/db";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {useSearchParams} from "next/navigation";
import {toast} from "sonner";
import type {queueEntry} from "@iglu-sh/types/scheduler";

export const columns:ColumnDef<builder>[] = [
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "arch",
        header: "Arch",
    },
    {
        accessorKey: "description",
        header: "Description",
    },
    {
        accessorKey: "id",
        header: "Actions",
        cell: ({row}) => {
            const searchParams = useSearchParams()
            const cacheID = searchParams.get('cacheID')
            async function triggerBuild(){
                toast.info(`Triggering build for builder ${row.original.name}`)
                await fetch(row.original.webhookurl, {
                    method: 'GET',
                })
                    .then((res)=>{
                        if(!res.ok){
                            toast.error(`Failed to trigger build: ${res.statusText}`)
                        }
                        toast.success(`Build triggered successfully, refer to the queue for more info`)
                    })
                    .catch((err)=>{
                        toast.error(`Failed to trigger build: ${err.message}`)
                    })
            }
            return <div>
                <Button variant="default" id={`trigger-btn-${row.original.id}`}
                    onClick={()=>{triggerBuild()}}
                >Trigger Build</Button>
                <Link href={`/app/builders/edit/${row.original.id}?cacheID=${cacheID}`}><Button variant="secondary" id={`edit-btn-${row.original.id}`} className="ml-2">Details</Button></Link>
                <Button variant="destructive" id={`delete-btn-${row.original.id}`} className="ml-2">Delete</Button>
            </div>
        }
    }
]


export const queueColumns:ColumnDef<dbQueueEntry>[] = [
    {
        accessorKey: "builder_run.id",
        header: "ID",
    },
    {
        accessorKey: "builder_run.status",
        header: "Status"
    },
    {
        accessorKey: "builder.name",
        header: "Builder Name",
        cell: ({row}) =>{
            return(
                <Link href={`/app/builders/${row.original.builder.id}`}>
                    {row.original.builder.name}
                </Link>
            )
        }
    },
    {
        accessorKey: "builder.id",
        header: "Actions",
        cell: ({row}) => {
            return(
                <div className="flex flex-row gap-2">
                    <Link href={`/app/builders/runs/${row.original.builder_run.id}/details`}>
                        <Button variant="default">View Run</Button>
                    </Link>
                    <Link href={`/app/builders/runs/${row.original.builder_run.id}/logs`}>
                        <Button variant="secondary">See Logs</Button>
                    </Link>
                </div>
            )
        }
    }
    ]