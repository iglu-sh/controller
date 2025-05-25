'use client'
import {useEffect, useState} from "react";
import {useSearchParams} from "next/navigation";
import {derivation} from "@/types/api";
import {getCookie} from "cookies-next";
import {ColumnDef} from "@tanstack/react-table";
import {DataTable} from "@/components/custom/dataTable";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Package} from "lucide-react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
const columns:ColumnDef<derivation> = [
    {
        header: "ID",
        accessorKey: "id",
    },
    {
        header: "Cache",
        accessorKey: "cache",
    },
    {
        header: "Name",
        accessorKey: "cderiver",
        cell:({row})=>{
            const cderiver = row.getValue("cderiver");
            let name = cderiver.split("-")
            name = name[name.length - 2];
            return (
                <Tooltip>
                    <TooltipTrigger>
                        {name}
                    </TooltipTrigger>
                    <TooltipContent>
                        <div className="flex flex-col gap-2">
                            <h3 className="text-lg font-bold">Full Name</h3>
                            {row.getValue("cstoresuffix")}
                        </div>
                    </TooltipContent>
                </Tooltip>
            )
        }
    },
    {
        header: "Version",
        accessorKey: "cstoresuffix",
        cell:({row})=>{
            const cderiver = row.getValue("cderiver");
            let version = cderiver.split("-")
            version = version[version.length - 1].replaceAll(".drv", "");
            return (
                <div>
                    {version}
                </div>
            )
        }
    },
    {
        header: "Cfilesize",
        accessorKey: "cfilesize",
        cell:({row})=>{
            const cfilesize = row.getValue("cfilesize");
            //Format the filesize in a human readable format (i.e MB)
            return (
                <div>
                    {cfilesize ? `${(Number(cfilesize) / 1024 / 1024).toFixed(2)} MB` : "N/A"}
                </div>
            )
        }
    },
    {
        header: "Last Accessed",
        accessorKey: "last_accessed",
        cell:({row})=>{
            const last_accessed = row.getValue("last_accessed");
            if(!last_accessed){
                return (
                    <div>
                        Never
                    </div>
                )
            }
            const date = new Date(last_accessed);
            return (
                <div>
                    {date.toLocaleDateString()} {date.toLocaleTimeString()}
                </div>
            )
        }
    },
    {
        header: "Added",
        accessorKey: "updatedat",
        cell:({row})=>{
            const updatedat = row.getValue("updatedat");
            const date = new Date(updatedat);
            return (
                <div>
                    {date.toLocaleDateString()}
                </div>
            )
        }
    },
    {
        header: "Hits",
        accessorKey: "hits",
        cell:({row})=>{
            const hits = row.getValue("hits");
            return (
                <div>
                    {hits}
                </div>
            )
        }
    },
    {
        header: "Compression",
        accessorKey: "compression",
        cell: ({row})=>{
            const compression = row.getValue("compression");
            return (
                <Badge className="text-green-500" variant="secondary">{compression}</Badge>
            )
        }
    },
    {
        header: "Actions",
        accessorKey: "actions",
        cell: ({row})=>{
            return (
                    <Button variant="destructive">Delete</Button>
            )
        }
    },
]


export default function Derivations(){
    const searchParams = useSearchParams()
    const [derivations, setDerivations] = useState<{hashes:Array<derivation>, totalCount:string}>({
        hashes: [],
        totalCount: "0"
    });
    const [page, setPage] = useState(0);
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(false);
    //Fetch the derivations for the selected cache
    async function fetchDerivations(id, offset){
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/v1/derivations?id=${id}&offset=${offset}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getCookie("iglu-session")}`
            }
        });
        if(!response.ok){
            console.error("Failed to fetch derivations");
            return;
        }
        const data = await response.json();
        setDerivations(data);
        setLoading(false);
        console.log(data);
    }
    useEffect(() => {
        //Make sure the search parameters are valid
        if(!searchParams.has('id') || isNaN(Number(searchParams.get('offset')))){
            console.error("Invalid search parameters");
            window.location.href= "/app/derivations?id=all&offset=0";
            return
        }
        const id = searchParams.get('id');
        if(!searchParams.has('offset') || isNaN(Number(searchParams.get('offset')))){
            console.error("Invalid search parameters");
            window.location.href= `/app/derivations?id=${id}&offset=0`;
            return
        }
        const offset = searchParams.get('offset');

        fetchDerivations(id, offset)
    }, []);

    useEffect(() => {

        //Make sure the search parameters are valid
        if(!searchParams.has('id') || isNaN(Number(searchParams.get('offset')))){
            console.error("Invalid search parameters");
            window.location.href= "/app/derivations?id=all&offset=0";
            return
        }
        const id = searchParams.get('id');
        if(!searchParams.has('offset') || isNaN(Number(searchParams.get('offset')))){
            console.error("Invalid search parameters");
            window.location.href= `/app/derivations?id=${id}&offset=0`;
            return
        }
        const offset = searchParams.get('offset');
        fetchDerivations(id, offset)
    }, [searchParams]);
    useEffect(()=>{
        const id = searchParams.get('id');
        fetchDerivations(id, offset)
    }, [page, offset]);

    useEffect(()=>{
       console.log("Loading state changed:", loading);
    }, [loading])
    return (
        <div className="flex flex-col gap-4">
            <Card className="flex flex-col gap-4">
                <CardHeader>
                    <CardTitle>
                        <h1>
                            Derivations
                        </h1>
                    </CardTitle>
                    <CardDescription>
                        This page lists all derivations in the selected cache. You can search for derivations by name or version.
                        <br />
                        Total Derivations: <strong>{derivations.totalCount}</strong>
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Input placeholder="Search derivations... "/>
                        </div>
                        <div />
                        <div className="flex flex-row justify-end items-center gap-2">
                            <Button><Package /> Add Package</Button>
                        </div>
                    </div>
                    <DataTable columns={columns} data={derivations.hashes} rowCount={parseInt(derivations.totalCount)} pageCount={
                        // Calculate the page count based on the total count and rows per page
                        Math.ceil(parseInt(derivations.totalCount) / 50)
                    } updatePage={(type: "first" | "backward" | "forward" | "last")=>{
                        setLoading(true)
                        let rowsPerPage = 50;
                        let offset = 0;
                        if(type === "first") {
                            offset = 0;
                        }
                        if(type === "backward") {
                            offset = page > 0 ? (page - 1) * rowsPerPage : 0;
                            setPage(page > 0 ? page - 1 : 0);
                        }
                        if(type === "forward") {
                            offset = (page + 1) * rowsPerPage;
                            setPage(page + 1);
                        }
                        if(type === "last") {
                            offset = Math.floor(parseInt(derivations.totalCount) / rowsPerPage) * rowsPerPage;
                            setPage(Math.floor(parseInt(derivations.totalCount) / rowsPerPage));
                        }
                        setOffset(offset);
                    }}
                               loading={loading}
                    />
                </CardContent>
            </Card>
        </div>
    );
}