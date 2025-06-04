import {cacheInfoObject} from "@/types/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import './usageSuggestion.css'
import {Copy, Terminal} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function CommandUsage({data}:{data:cacheInfoObject}) {
    return(
        <div>
            <h2>Commands</h2>
            <p>
                Run these Commands to get started with your cache
            </p>
            <div className="codeBlock rounded-md border-accent border-2">
                <div>
                    nix build your-derivation --option substituters "{data.cache.uri}/{data.cache.name}" --option trusted-public-keys "{data.cache.name}:{data.cache.publicsigningkeys && data.cache.publicsigningkeys.length != 0 ? data.cache.publicsigningkeys : <span style={{color:"var(--chart-3)"}}>your-signing-key</span>}"
                </div>
                <Copy className="copyBtn"/>
            </div>
            <Alert style={{marginTop:"20px"}}>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Heads up!</AlertTitle>
                <AlertDescription>
                    Note that these commands aren't meant to be used on a regular basis, you should add these options to your configuration.nix or flake.nix files
                </AlertDescription>
            </Alert>

        </div>
    )
}

export function FlakesUsage({data}:{data:cacheInfoObject}) {
    return(
        <div>
            <h2>Flakes</h2>
            <p>
                Run these Commands to get started with your cache
            </p>
            <div className="codeBlock rounded-md border-accent border-2 overflow-x-scroll">
                <pre>
{
`nixConfig = {
    substituters = [
        "https://${data.cache.uri}/${data.cache.name}" //Your cache uri
        "https://cache.nixos.org" //NixOS cache, optional but recommended
    ];
    trusted-public-keys = [
        "${data.cache.name}:${data.cache.publicsigningkeys && data.cache.publicsigningkeys.length != 0 ? data.cache.publicsigningkeys : <span style={{color:"var(--chart-3)"}}>your-signing-key</span>}" //Your cache signing key
        "cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY=" //NixOS cache signing key, optional but recommended
    ];
}        
`
}
                </pre>
            </div>
        </div>
    )
}
export function ConfigUsage({data}:{data:cacheInfoObject}) {
    return(
        <div>
            <h2>Flakes</h2>
            <p>
                Run these Commands to get started with your cache
            </p>
            <div className="codeBlock rounded-md border-accent border-2 overflow-x-scroll">
                <pre>
{
    `Error 501: Not Implemented`
}
                </pre>
            </div>
        </div>
    )
}
export default function UsageSuggestion({data}:{data:cacheInfoObject}) {
    return(
        <div className="flex flex-col gap-4 border-accent border-2 rounded-md p-4 col-span-4">
            <h1>
                Usage
            </h1>
            <p>
                You can get started by either using the commands or modifying your configuration file.
            </p>
            <Separator />

            <Tabs defaultValue="commands" className="w-full">
                <TabsList>
                    <TabsTrigger value="commands">Commands</TabsTrigger>
                    <TabsTrigger value="flakes">Flakes</TabsTrigger>
                    <TabsTrigger value="config">Configuration.nix</TabsTrigger>
                </TabsList>
                <TabsContent value="commands"><CommandUsage data={data} /></TabsContent>
                <TabsContent value="flakes"><FlakesUsage data={data} /></TabsContent>
                <TabsContent value="config"><ConfigUsage data={data} /></TabsContent>
            </Tabs>
        </div>
    )
}