'use client'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {ArrowLeft, Copy, Save} from "lucide-react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import General from "@/components/custom/builder/create/general";
import Options from "@/components/custom/builder/create/options";
import Cachix from "@/components/custom/builder/create/cachix";
import {useEffect, useState} from "react";
import {BuilderCreationRequest} from "@/types/frontend";
import {Toaster} from "@/components/ui/sonner";
import {toast} from "sonner";
import {getCookie} from "cookies-next";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {builderDatabaseRepresenation} from "@/types/api";

async function createBuilderRequest(data: BuilderCreationRequest, cache?:string, setBuilder: (builder: builderDatabaseRepresenation) => void) {
    // This function would typically make an API call to create the builder

    // Verify that the data is valid
    if (!data.name || data.name == ""){
        toast.error("Builder name is required.");
        return
    }

    // Verify that if the git URL is provided, a branch is also provided
    if (data.git.url && !data.git.branch) {
        toast.error("If a git URL is provided, a branch must also be specified.");
        return;
    }

    // Verify that if authentication is required, both username and token are provided
    if (data.git.requiresAuth && (!data.git.username || !data.git.token)) {
        toast.error("If Git authentication is required, both username and token must be provided.");
        return;
    }

    // Verify that the build command is provided
    if (!data.build.command || data.build.command === "") {
        toast.error("You should really enter a build command. Otherwise this configuration would not be very useful.");
        return;
    }

    // Verify that the build command includes `nix build` or `nix-build`
    if(!data.build.command.startsWith('nix build') && !data.build.command.startsWith('nix-build')) {
        toast.error("The build command should start with `nix build` or `nix-build`.");
        return;
    }

    // Verify that if a cron schedule is provided, it is valid
    if(data.build.buildTrigger === "cron" && ((!data.build.cron || data.build.cron === "" || !/^\d+ \d+ \* \* \*$/.test(data.build.cron)))) {
        toast.error("If the build trigger is set to cron, a valid cron schedule must be provided.");
        return;
    }

    // Verify that a target cache is provided
    if (!cache || cache === "") {
        toast.error("You must select a target cache on the Cachix Tab (even if you've selected to not Auto Push).");
        return;
    }

    // Verify that if the Cachix mode is set to 'manual', a Cachix public signing key and API key are provided
    if (data.cachix.mode === "manual" && (!data.cachix.cachixPublicSigningKey || !data.cachix.cachixSigningKey || data.cachix.cachixPublicSigningKey === "" || data.cachix.cachixSigningKey === "")) {
        toast.error("If the Cachix Configuration mode is set to manual, both Cachix public signing key and API key must be provided.");
        return;
    }

    // Check if Max Jobs is a positive integer at least 1 and max 128
    if (data.build.maxJobs < 1 || data.build.maxJobs > 128) {
        toast.error("Max Jobs must be a positive integer between 1 and 128.");
        return;
    }

    // Check if Cores is a positive integer at least 1 and max 128
    if (data.build.cores < 1 || data.build.cores > 128) {
        toast.error("Cores must be a positive integer between 1 and 128.");
        return;
    }

    // Check if at least one substituter is provided
    if (!data.build.substituters || data.build.substituters.length === 0) {
        toast.error("At least one substituter must be provided.");
        return;
    }

    // If everything passes we can send the creation request
    console.log("Sending builder creation request to the server...");
    const response = await fetch(`/api/v1/builder?cacheID=${cache}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "authorization": `Bearer ${getCookie("iglu-session")}`
        },
        body: JSON.stringify({
            ...data,
            cachix: {
                ...data.cachix,
            },
            targetCache: cache
        })
    })
    const returnedJson = await response.json().catch((e)=>{
        return(
            {
                ok: false,
            }
        )
    })
    if(!response.ok || response.status !== 200) {
        toast.error(`Failed to create builder, status: ${response.status}`);
        return;
    }
    toast.success("Builder configuration created successfully!");

    setBuilder(returnedJson.message as builderDatabaseRepresenation);
}

export default function CreateBuilderPage() {
    const [data, setData] = useState<BuilderCreationRequest>({
        name: "",
        description: "",
        git: {
            noClone: true,
            requiresAuth: false,
            url: "",
            branch: "",
            username: "",
            token: ""
        },
        build: {
            command: "",
            buildTrigger: "manual",
            cron: "",
            outputDir: "./result",
            allowUnfree: false,
            parallelBuilds: false,
            sandboxed: false,
            maxJobs: 4,
            cores: 2,
            substituters: [
                {
                    url: "https://cache.nixos.org",
                    signingKeys: ["cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY="]
                }
            ]
        },
        cachix: {
            mode: "auto",
            cachixPublicSigningKey: undefined,
            cachixSigningKey: undefined,
            push: true
        }
    })
    const [targetCache, setTargetCache] = useState<string>("");
    useEffect(()=>{
        console.log(data)
    }, [data])

    const [builder, setBuilder] = useState<builderDatabaseRepresenation | null>(null);
    const [openDialog, setOpenDialog] = useState<boolean>(false);

    return (
        <div>
            <div className="mb-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/app">Home</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/app/builders">Builder</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Create</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex flex-row items-center gap-2">
                        <h1>Create New Configuration</h1>
                    </CardTitle>
                    <CardDescription>
                        Configure a new Nix build configuration
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList>
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="cachix">Cachix</TabsTrigger>
                            <TabsTrigger value="options">Build Options</TabsTrigger>
                        </TabsList>
                        <TabsContent value="general"><General data={data} setData={(data)=>setData(data)}/></TabsContent>
                        <TabsContent value="cachix"><Cachix data={data} setData={(data)=>setData(data)} setTargetCache={(cache:string)=>setTargetCache(cache)}/></TabsContent>
                        <TabsContent value="options"><Options data={data} setData={(data)=>setData(data)}/></TabsContent>
                    </Tabs>
                    <div className="flex flex-row justify-between mt-4">
                        <Button variant="outline">
                            Cancel
                        </Button>
                        <Button onClick={(e)=>{
                            createBuilderRequest(data, targetCache,
                                (builder: builderDatabaseRepresenation) => {
                                    setBuilder(builder);
                                    setOpenDialog(true);
                                }
                            )
                        }}>
                            <Save />
                            Save Configuration
                        </Button>
                    </div>
                    <Toaster />
                    <Dialog open={openDialog}>
                        <DialogContent>
                            <DialogTitle className="flex flex-col space-y-2">
                                <DialogHeader>
                                    Builder Created Successfully!
                                </DialogHeader>
                                <DialogDescription>
                                    {
                                        builder? (
                                            `Your Builder with ID: ${builder.id} has been created successfully. \n 
                                            You can now use it to build your Nix configurations.`
                                        ) : (
                                            `Something has gone terribly wrong. Your builder was probably not created. Please try again or file an issue.`
                                        )
                                    }
                                </DialogDescription>
                            </DialogTitle>
                            <div className="flex flex-col space-y-2 w-full overflow-auto">
                                <h3>
                                    Webhook URL for triggering builds
                                </h3>
                                <div className="text-muted-foreground text-sm">
                                    This is your webhook url for triggering a build. You can use this URL to trigger builds from external services or scripts.
                                    <br />
                                    A Request has to be of type POST and should include an Authorization header with a Bearer token (format: <span className="font-mono">Bearer your-cool-token</span>). Your Bearer token is just any API Token that is allowed to push to the cache you selected.
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                    <div className="font-mono border p-2 rounded-md bg-muted overflow-auto">
                                        {
                                            `
                                        ${process.env.NEXT_PUBLIC_URL}${builder?.webhookURL}
                                        `
                                        }
                                    </div>
                                    <Button variant="ghost"
                                        onClick={(e)=>{
                                            navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_URL}${builder?.webhookURL}`);
                                            toast.success("Webhook URL copied to clipboard!");
                                        }}
                                    >
                                        <Copy />
                                    </Button>
                                </div>
                                <div className="flex flex-row items-center justify-between">
                                    <a href={`${process.env.NEXT_PUBLIC_URL}/app/builders/create`}>
                                        <Button variant="secondary">
                                            Create another Builder
                                        </Button>
                                    </a>
                                    <a href={`${process.env.NEXT_PUBLIC_URL}/app/builders/${builder?.id}`}>
                                        <Button>
                                            Go to new Builder
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>
        </div>
    );
}