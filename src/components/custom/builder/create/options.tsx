'use client'
import {Label} from "@/components/ui/label";
import {Switch} from "@/components/ui/switch";
import {Input} from "@/components/ui/input";
import {ColumnDef} from "@tanstack/react-table";
import {builder, cache} from "@/types/api";
import {Button} from "@/components/ui/button";
import {DataTable} from "@/components/custom/dataTable";
import {useEffect, useRef, useState} from "react";
import {Terminal, Trash, Trash2, TrashIcon} from "lucide-react";
import {
    Dialog, DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {DialogBody} from "next/dist/client/components/react-dev-overlay/ui/components/dialog";
import {getCookie} from "cookies-next";
import {toast} from "sonner";
import {BuilderCreationRequest} from "@/types/frontend";
import {Toaster} from "@/components/ui/sonner";
type substituter = {
    "id":number,
    "url":string,
    "publickey":string,
}

export function UseExistingCache({substituters, setSubstituters, caches}:{substituters:substituter[], setSubstituters:(substituters: substituter[]) => void, caches:cache[]}){
    const columns:ColumnDef<substituter> = [
        {
            accessorKey: "name",
            header: "Name",
        },
        {
            accessorKey: "uri",
            header: "URL",
            cell: ({row})=>{
                return(
                    <div>
                        {`${row.original.uri}/${row.original.name}`}
                    </div>
                )
            }
        },
        {
            accessorKey: "id",
            header: "Actions",
            cell: ({row})=>{
                return(
                    <DialogClose asChild onClick={()=>{
                        // Add the substituter to the list
                        let newSubstituter:substituter = {
                            id: substituters.length + 1,
                            url: `${row.getValue("uri")}/${row.getValue("name")}`,
                            publickey: row.original.publicsigningkeys.map((key)=>{return key.key}).join(" ") || ""
                        }
                        setSubstituters([...substituters, newSubstituter]);
                    }}>
                        <Button variant="secondary">
                            Use this Cache
                        </Button>
                    </DialogClose>
                )
            }
        }
    ]
    return(
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="secondary" className="w-full">
                    Auto-Configure one of your caches
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>
                    Select a Cache
                </DialogTitle>
                <DialogDescription>
                    Select one of your existing caches to auto-configure the substituter.
                </DialogDescription>
                <DialogBody>
                    <DataTable columns={columns} data={caches} />
                </DialogBody>
            </DialogContent>
        </Dialog>
    )
}

export default function Options({data, setData}:{data:BuilderCreationRequest, setData:(data: BuilderCreationRequest) => void}){
    const [substituters, setSubstituters] = useState<substituter[]>(data.build.substituters.map((substituter:{url:string, signingKeys:Array<string>}, index)=>{
        return(
            {
                id: index + 1,
                url: substituter.url,
                publickey: substituter.signingKeys.join(" ") || ""
            } as substituter
        )
    }));
    // @ts-ignore
    const columns:ColumnDef<substituter> = [
        {
            accessorKey: "url",
            header: "URL",
        },
        {
            accessorKey: "publickey",
            header: "Public Key",
            cell: ({row})=>{
                let publicKey = row.original.publickey;
                // If the public key is too long, truncate it
                if(publicKey.length > 65){
                   publicKey = publicKey.slice(0, 65) + "...";
                }
                return publicKey
            }
        },
        {
            accessorKey: "id",
            header: "Actions",
            cell: (row)=>{
                return(
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button disabled={row.getValue("id") === 1}>
                                <Trash2 />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    You sure?
                                </DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete this substituter? You can re-add them via the form.
                                </DialogDescription>
                                <DialogBody>
                                    <DialogClose className="w-full" asChild>
                                        <div className="grid grid-cols-2 gap-4 w-full justify-between">
                                            <Button>
                                                Cancel
                                            </Button>
                                            <Button variant="destructive" onClick={()=>{
                                                let substituterIndex = substituters.findIndex((substituter) => substituter.id === row.getValue("id"));
                                                if(substituterIndex === -1){
                                                    toast.error("Substituter not found");
                                                    return;
                                                }

                                                //Remove the substituter from the list
                                                setSubstituters(substituters.filter((_, index) => index !== substituterIndex));
                                            }}>
                                                <TrashIcon className="mr-2" />
                                                Delete
                                            </Button>
                                        </div>
                                    </DialogClose>
                                </DialogBody>
                            </DialogHeader>
                        </DialogContent>
                    </Dialog>
                )
            }
        }
    ]

    const [caches, setCaches] = useState<cache[]>([])

    const substituterUrlRef = useRef(null)
    const substituterPublicKeyRef = useRef(null)

    useEffect(()=>{
        // Fetch all the caches for this user
        fetch(`${process.env.NEXT_PUBLIC_URL}/api/v1/caches`, {
            headers: {
                "authorization": `Bearer ${getCookie("iglu-session")}`,
            }
        })
            .then((res) => {
                if(!res.ok){
                    throw new Error("Failed to fetch caches");
                }
                return res.json();
            })
            .then((data) => {
                if(!data.caches || data.caches.length === 0){
                    throw new Error("No caches found");
                }
                console.log(data)
                setCaches(data.caches);
            })
            .catch((error) => {
                console.error("Error fetching caches:", error);
                toast.error("Error fetching caches");
            });
    }, [])

    function addSubstituter(){
        if(!substituterUrlRef.current || !substituterPublicKeyRef.current){
            toast.error("Please fill in both URL and Public Key");
            return;
        }
        let url = substituterUrlRef.current.value;
        let publicKey = substituterPublicKeyRef.current.value;
        if(!url || !publicKey){
            toast.error("Please fill in both URL and Public Key");
            return;
        }

        if(!url.startsWith("http://") && !url.startsWith("https://")){
            toast.error("URL must start with http:// or https://");
            return;
        }

        if(publicKey.length < 10){
            toast.error("Public Key is too short");
            return;
        }
        let newSubstituter:substituter = {
            id: substituters.length + 1,
            url: url,
            publickey: publicKey
        };
        setSubstituters([...substituters, newSubstituter]);
    }

    useEffect(()=>{
        setData(
            {
                ...data,
                build: {
                    ...data.build,
                    substituters: substituters.map((substituter) => ({
                        url: substituter.url,
                        signingKeys: [substituter.publickey]
                    }))
                }
            }
        )
    }, [substituters])
    return(
        <div className="flex flex-col gap-4 w-full">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-3">
                <div className="flex flex-row justify-between">
                    <label>
                        Allow Unfree
                    </label>
                    <Switch onCheckedChange={()=>{
                        setData({
                            ...data,
                            build:{
                                ...data.build,
                                allowUnfree: !data.build.allowUnfree
                            }
                        })
                    }}
                    defaultChecked={data.build.allowUnfree}
                    />
                </div>
                <div className="flex flex-row justify-between">
                    <label>
                        Parallel Building
                    </label>
                    <Switch onCheckedChange={()=>{
                        setData({
                            ...data,
                            build:{
                                ...data.build,
                                parallelBuilds: !data.build.parallelBuilds
                            }
                        })
                    }}
                    defaultChecked={data.build.parallelBuilds}
                    />
                </div>
                <div className="flex flex-row justify-between">
                    <label>
                        Sandboxed
                    </label>
                    <Switch onCheckedChange={()=>{
                        setData({
                            ...data,
                            build:{
                                ...data.build,
                                sandboxed: !data.build.sandboxed
                            }
                        })
                    }}
                    defaultChecked={data.build.sandboxed}
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-8">
                <div className="flex-col flex space-y-2">
                    <label>
                        Max Jobs
                    </label>
                    <Input max={128} type="number" onChange={(e)=>{
                        setData({
                            ...data,
                            build:{
                                ...data.build,
                                maxJobs: e.target.value as unknown as number
                            }
                        })
                    }}
                    value={data.build.maxJobs}
                    />
                </div>
                <div className="flex-col flex space-y-2">
                    <label>
                        Cores
                    </label>
                    <Input type="number" max={128} onChange={(e)=>{
                        setData({
                            ...data,
                            build:{
                                ...data.build,
                                cores: e.target.value as unknown as number
                            }
                        })
                    }}
                    value={data.build.cores}
                    />
                </div>
            </div>
            <div className="flex flex-col space-y-2">
                <label>
                    Substituters
                </label>
                <div className="flex flex-col gap-2">
                    <Input type="text" placeholder="e.g https://cache.nixos.org" ref={substituterUrlRef}></Input>
                    <Input type="text" placeholder="Public Key" ref={substituterPublicKeyRef}></Input>
                    <div className="grid grid-cols-2 gap-2 w-full">
                        <Button onClick={addSubstituter}>Add Substituter</Button>
                        <UseExistingCache substituters={substituters} setSubstituters={(substituters)=>setSubstituters(substituters)} caches={caches} />
                    </div>
                </div>
                <div className="text-muted-foreground text-sm">
                    Add multiple caches with the same URL to add multiple public keys.
                </div>
                <DataTable columns={columns} data={substituters} />
                <div className="text-muted-foreground text-sm">
                    Builds will always run with the default Nix cache (https://cache.nixos.org) unless you specify a different one here. Builds may not run without a substituter due to resource constraints.
                </div>
            </div>
        </div>
    )
}