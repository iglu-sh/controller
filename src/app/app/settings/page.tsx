'use client'
import Link from "next/link";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {AlertCircleIcon} from "lucide-react";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {Select, SelectContent, SelectItem, SelectTrigger} from "@/components/ui/select";
import type {ColumnDef} from "@tanstack/react-table";
import type {public_signing_keys} from "@/types/db";
import {DataTable} from "@/components/custom/DataTable";

const PSKColumns:ColumnDef<public_signing_keys>[] = [
    {
        accessorKey: "name",
        header: "Name",
        cell: (info)=> (info.getValue() as string).replaceAll("__[IGLU_BUILDER]", "")
    },
    {
        accessorKey: "description",
        header: "Description",
        cell: (info)=> (info.getValue() as string || "No description provided")
    },
    {
        accessorKey: "key",
        header: "Key",
    },
    {
        accessorKey: "id",
        header: "Actions"
    }
]
export default function Performance(){
  return(
    <div className="flex flex-col gap-4">
        <div className="flex flex-col">
            <h1 className="text-3xl font-bold">
            Settings
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
            Manage your cache here. If you want to create new one (for example if you want to have one cache for you and one cache for friends and family), you can create a new one <Link href="/app/caches/create" className="text-primary">here</Link>
            </p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>
                    General Settings
                </CardTitle>
                <CardDescription>
                    Configure general settings here
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="name">
                        Name
                    </Label>
                    <Input type="text" id="name"></Input>
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="name">
                        Endpoint
                    </Label>
                    <div className="p-2 font-mono bg-muted rounded text-sm flex text-center items-center">
                        http://localhost:3000/default
                    </div>
                </div>
                <div className="flex flex-row col-span-2">
                    <Alert variant="destructive">
                        <AlertCircleIcon />
                        <AlertTitle>
                            About changing the name
                        </AlertTitle>
                        <AlertDescription>
                            If you change this name, the endpoint will also change, meaning you will need to update any clients using this cache to use the new endpoint.
                        </AlertDescription>
                    </Alert>
                </div>
                <div className="flex flex-col gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Label htmlFor="name">
                                Preferred Compression Method
                            </Label>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div>
                                <div className="text-sm">
                                    About preferred compression methods:
                                </div>
                                <div>
                                    This is the compression method that the cache will tell the clients to use, however regardless of what is set here, a client can always elect to use a different compression method if it seems fit. <br />
                                    A mismatched compression method will still be accepted by the cache.
                                </div>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                    <Select>
                        <SelectTrigger>
                            Select Compression Method
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="xz">XZ</SelectItem>
                            <SelectItem value="zsdt">ZSDT</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="priority">
                        Priority
                    </Label>
                    <Input type="number" id="priority"></Input>
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="public_status">
                        Public?
                    </Label>
                    <Select disabled>
                        <SelectTrigger id="public_status">
                            Yes
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="no">No</SelectItem>
                            <SelectItem value="yes">Yes</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="github_username">
                        Github Username
                    </Label>
                    <Input type="text" id="github_username"></Input>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>
                    Authentication
                </CardTitle>
                <CardDescription>
                    Configure which Public Keys are allowed to upload packages to this cache. Every single PSK needs to be added in your config as a trusted signing key. Any PSK wit the prefix ""
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <h2 className="text-sm font-semibold">
                        API Keys Allowed to Upload
                    </h2>
                    <DataTable columns={PSKColumns} data={[]} pageIndex={0} pageSize={25} noPagination={false} />
                </div>
                <div className="flex flex-col gap-2">
                    <h2 className="text-sm font-semibold">
                        Public Signing Keys Allowed to Upload
                    </h2>
                    <DataTable columns={PSKColumns} data={[]} pageIndex={0} pageSize={25} noPagination={false} />
                </div>
            </CardContent>
        </Card>
    </div>
  )
}
