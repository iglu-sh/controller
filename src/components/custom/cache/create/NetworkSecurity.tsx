import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Network} from "lucide-react";
import {Switch} from "@/components/ui/switch";
import {Textarea} from "@/components/ui/textarea";
import {api} from "@/trpc/react"
import type {cacheCreationObject} from "@/types/frontend";
import {useEffect} from "react";
import type {ColumnDef} from "@tanstack/react-table";
import type {apiKeyWithCache} from "@/types/db";
import {DataTable} from "@/components/custom/DataTable";
import {columns} from "@/components/custom/oob/claimable/apiKeys";
import {Checkbox} from "@/components/ui/checkbox";

export default function NetworkSecurity({cacheToCreate, setCacheToCreate}:{cacheToCreate:cacheCreationObject, setCacheToCreate:(cache:cacheCreationObject) => void}){
    const availableApiKeys = api.user.getApiKeys.useQuery()
    useEffect(()=>{
        console.log("Available API Keys: ", availableApiKeys.data)
    }, [availableApiKeys.data])
    const columns:ColumnDef<apiKeyWithCache>[] = [
        {
            accessorKey: "key.name",
            header: "API Key"
        },
        {
            accessorKey: "caches",
            header: "Associated Caches",
            cell: ({row})=>{
                const caches = row.original.caches.map(cache => cache.name).join(", ");
                return <span className="text-sm text-muted-foreground">{caches || "None"}</span>;
            }
        },
        {
            accessorKey: "key.id",
            header: "Actions",
            cell: ({row})=>{
                return (<Checkbox onCheckedChange={()=>{
                    // Toggle the selection of the API key
                    const selectedApiKeys = [...cacheToCreate.selectedApiKeys];
                    if(selectedApiKeys.filter((k)=>k.id === row.original.key.id).length > 0){
                        // Remove the key if it's already selected
                        setCacheToCreate({
                            ...cacheToCreate,
                            selectedApiKeys: selectedApiKeys.filter((k)=>k.id !== row.original.key.id)
                        });
                    }
                    else{
                        // Add the key if it's not selected
                        setCacheToCreate({
                            ...cacheToCreate,
                            selectedApiKeys: [...selectedApiKeys, row.original.key]
                        });
                    }
                }}
                checked={cacheToCreate.selectedApiKeys.filter((k)=>k.id === row.original.key.id).length > 0}
                                  disabled={false}
                ></Checkbox>)
            }
        }
    ]

    return(
        <Card>
            <CardHeader>
                <CardTitle className="flex flex-row items-center gap-2">
                    <Network />
                    <h2 className="text-2xl font-bold flex flex-row items-center gap-2">
                        Network & Security
                    </h2>
                </CardTitle>
                <CardDescription>
                    SSL and access controls
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                    <label>URL</label>
                    <div className="text-sm text-muted-foreground font-mono p-1 bg-muted rounded overflow-scroll">
                        {`${process.env.NEXT_PUBLIC_CACHE_URL}/${cacheToCreate.name}`}
                    </div>
                </div>
                <div className="col-span-2 flex flex-row justify-between">
                    <div className="flex flex-col">
                        <strong>Enable SSL/TLS</strong>
                        <div className="text-muted-foreground text-sm">
                            Secure connections with HTTPS
                        </div>
                    </div>
                    <Switch disabled />
                </div>
                <div className="col-span-2 flex flex-col gap-2">
                    <strong>Allowed API Keys</strong>
                    <div className="text-sm text-muted-foreground">
                        Select which API keys can access this cache. If none are selected, you will not be able to push to this cache until you create or add one.
                    </div>
                    <DataTable columns={columns} data={availableApiKeys.data ?? []} />
                </div>
                <div className="col-span-2 flex flex-col gap-2">
                    <strong>Allowed IP Ranges (optional)</strong>
                    <Textarea placeholder="10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, etc." disabled={true} />
                    <div className="text-sm text-muted-foreground">
                        Leave empty to allow all IPs, Use CIDR notation for IP ranges and separate them with commas.
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}