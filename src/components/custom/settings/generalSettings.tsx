import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import type {cache} from "@/types/api";
import {useState} from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {BadgeAlert, Terminal} from "lucide-react";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";


export default function GeneralSettings({cache, setCacheCallback}: {cache:cache, setCacheCallback: (cache:cache)=>void}){
    const [cacheName, setCacheName] = useState(cache && cache.name ? cache.name : "");
    const [cacheInputInvalid, setCacheInputInvalid] = useState(false);
    const [priorityInputInvalid, setPriorityInputInvalid] = useState(false);
    const initialCacheName = cache && cache.name ? cache.name : "";
    return(
        <Card>
            <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure basic cache settings</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className="space-y-2">
                    <Label htmlFor="cache-name">Cache Name</Label>
                    <Input id="cache-name" placeholder="Cache Name" defaultValue={cacheName} onChange={(e)=>{
                        const cacheCopy = {...cache};

                        if(e.target.value.includes(" ")
                            || e.target.value === "create"
                            || e.target.value.includes("/")
                            || e.target.value === ""
                            || e.target.value === undefined
                            || e.target.value.includes(".")
                        ) {
                            setCacheInputInvalid(true)
                        }
                        else{
                            setCacheInputInvalid(false);
                        }
                        cacheCopy.name = e.target.value;
                        setCacheCallback(cacheCopy);
                    }}
                    aria-invalid={cacheInputInvalid}
                    />
                    {
                        cacheName != initialCacheName ?
                            <Alert className="text-orange-400">
                                <BadgeAlert className="h-4 w-4" />
                                <AlertTitle>Careful!</AlertTitle>
                                <AlertDescription>
                                    Changing the cache name will also change the cache URL and storage path. <br />
                                    Make sure to update your configuration files and scripts accordingly. Also: This will wipe the currently stored hashes and files in the cache. <br />
                                </AlertDescription>
                            </Alert>
                         : null
                    }
                </div>
                <div className="flex flex-col space-y-2">
                    <Tooltip>
                        <TooltipTrigger>
                            <Label>
                                Priority
                            </Label>
                        </TooltipTrigger>
                        <TooltipContent>
                            <h3>About Cache Priority</h3>
                            <div>
                                This setting allows you to choose the <strong>priority</strong> of your cache. <br />
                                The priority is used to determine the order in which a nix client will use configured substituters. <br />
                                A lower number means a higher priority. <br />
                                For example: The cache.nixos.org cache has the priority of 40. If you set your cache to 39, it will be used before the cache.nixos.org cache is hit. <br />
                            </div>
                        </TooltipContent>
                    </Tooltip>
                    <Input id="priority" defaultValue={cache.priority.toString()} type="number" min={0} max={1000} step={1} placeholder="Cache Priority"
                        onChange={(e)=>{
                            const cacheCopy = {...cache};
                            if(e.target.value == "" || !e.target.value.match(/^[0-9]*$/)){
                                setPriorityInputInvalid(true);
                            }
                            else{
                                setPriorityInputInvalid(false);
                            }
                            cacheCopy.priority = parseInt(e.target.value);
                            setCacheCallback(cacheCopy);
                        }}
                        aria-invalid={priorityInputInvalid}
                    ></Input>
                </div>
                <div className="flex flex-col space-y-2">
                    <Label>Github Username <span className="text-sm text-muted-foreground">(optional)</span></Label>
                    <Input defaultValue={cache.githubusername} onChange={(e)=>{
                        const cacheCopy = {...cache};
                        cacheCopy.githubusername = e.target.value;
                        setCacheCallback(cacheCopy);
                    }}/>
                </div>
                <div className="flex flex-col space-y-2">
                    <Label>Cache URL</Label>
                     <Input defaultValue={`${cache.uri}/${cache.name}`} disabled>

                     </Input>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="log-level">Log Level (not implemented)</Label>
                    <Select >
                        <SelectTrigger id="log-level">
                            <SelectValue placeholder="Select log level" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="debug">Debug</SelectItem>
                            <SelectItem value="info">Info</SelectItem>
                            <SelectItem value="warn">Warning</SelectItem>
                            <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    )
}