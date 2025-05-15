import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {cache} from "@/types/api";
import {JSX} from "react";
import {Button} from "@/components/ui/button";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table"
import {DataTable} from "@/components/custom/dataTable";
import {Toaster} from "@/components/ui/sonner";
import { toast } from 'sonner'
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"
import {Check, CircleAlert, Copy} from "lucide-react";
import Link from "next/link";

const columns: ColumnDef<Cache>[] = [
    {
        header: "",
        id: "selection",
        cell: ()=>{
            return(
                <input type="checkbox" />
            )
        }
    },
    {
        "header": "Status",
        "accessorKey": "problems",
        cell: ({row})=>{
            const problems = row.getValue("problems")
            //@ts-ignore
            if(problems.length === 0){
                return (
                    <div className="text-green-500"><Check></Check></div>
                )
            }
            else{
                return(
                    <HoverCard>
                        <HoverCardTrigger className="text-orange-400"><CircleAlert></CircleAlert></HoverCardTrigger>
                        <HoverCardContent>
                            <div className="flex flex-col gap-2">
                                {
                                    // @ts-ignore
                                    problems.map((problem, index) => {
                                        return (
                                            <div key={index} className="flex flex-col">
                                                <h3 className="text-lg font-bold">{problem.heading}</h3>
                                                <small>{problem.description}</small>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        </HoverCardContent>
                    </HoverCard>
                )
            }
        }
    },
    {
        accessorKey: "id",
        header: "ID",
    },
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "preferredcompressionmethod",
        header: "Compression Method",
    },
    {
        accessorKey: "publicsigningkeys",
        header: "Public Signing Key",
        size: 100,
        cell: ({row})=>{
            const keys = row.getValue("publicsigningkeys")
            //Cut the keys to 20 characters
            return (
                <div style={{display: "flex", flexDirection:"row"}}>{keys.slice(0, 20)}...
                    <Copy
                    style={{marginLeft: "10px"}}
                    onClick={()=>{
                        navigator.clipboard.writeText(`${row.getValue("name")}:${keys}`)
                            .then(()=>{
                                toast.success("Copied to clipboard")
                            })
                    }}
                    /></div>
            )
        }
    },
    {
        header: "Actions",
        accessorKey: "uri",
        cell: ({row})=>{
            return (
                <div className="flex flex-row gap-2">
                    <Button variant="outline" onClick={()=>{
                        navigator.clipboard
                            .writeText(`${row.getValue("uri")}/${row.getValue("name")}`)
                            .then(()=>{
                                toast.success("Copied to clipboard")
                            })
                    }}>Copy URL</Button>
                    <Link href={`/app/caches/${row.getValue("id")}`}>
                        <Button variant="outline">
                            Edit
                        </Button>
                    </Link>
                    <Button variant="destructive">Delete</Button>
                </div>
            )
        }
    }

]

export default function CacheTable({ caches }: { caches: Array<cache> }): JSX.Element {
    /*
    * DISCLAIMER:
    * I have no Idea how caches is an Array here, but apparently it is so we need to use [0] as the accessor
    * */

    return(
        <div className="container mx-auto py-10">
            <DataTable columns={columns} data={caches[0]} />
            <Toaster />
        </div>
    )
}