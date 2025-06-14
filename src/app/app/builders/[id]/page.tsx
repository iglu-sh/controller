'use client'

import {useParams, useSearchParams} from "next/navigation";
import {useEffect, useState} from "react";
import {builderFrontendPackage} from "@/types/db";
import {getCookie} from "cookies-next";
import {Toaster} from "@/components/ui/sonner";
import {toast} from "sonner";
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {LeftArrow} from "next/dist/client/components/react-dev-overlay/ui/icons/left-arrow";
import {ArrowLeft, ClipboardEdit, Edit, Play} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import Overview from "@/components/custom/builder/overview/overview";
import History from "@/components/custom/builder/overview/history";

async function getBuilderConfiguration(id:string, apiKey:string):Promise<builderFrontendPackage> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/v1/builder/info/${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
    });

    console.log(response)
    if (!response.ok) {
        throw new Error('Failed to fetch builder configuration');
    }
    return response.json();
}

export default function BuilderPage(){
    const { id } = useParams();
    const params = useSearchParams()
    const [builderConfig, setBuilderConfig] = useState<builderFrontendPackage | null>(null);
    useEffect(() => {
        const apiKey = getCookie('iglu-session');
        if(!apiKey){
            window.location.href = "/"
            return
        }

        // Fetch the builder configuration
        getBuilderConfiguration(id as string, apiKey as string)
            .then((config) => {
                console.log(config)
                setBuilderConfig(config);
            })
            .catch((error)=>{
                console.error("Error fetching builder configuration:", error);
                toast.error("Failed to fetch builder configuration. Please try again later.");
            })
    }, []);
    return(
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2 items-center">
                <div className="flex flex-row items-center gap-4">
                    <a href={`/app/builders?cache=${params.get('cache') || builderConfig?.cache.id}`}>
                        <Button variant="ghost">
                            <ArrowLeft />
                        </Button>
                    </a>
                    <div className="flex flex-col gap-2">
                        <h1 className="text-2xl font-bold">
                            {builderConfig ? (builderConfig.builder.name) : "Loading..."}
                        </h1>
                        <div className="text-muted-foreground text-md">
                            {builderConfig ? (builderConfig.builder.description) : "Loading..."}
                        </div>
                    </div>
                </div>
                {
                    builderConfig ? (
                    <div className="flex flex-row gap-4 items-end justify-end">
                        <a href={`${process.env.NEXT_PUBLIC_URL}/app/builders/edit/${id}`}>
                            <Button variant="ghost">
                                <Edit />
                                Edit Builder
                            </Button>
                        </a>
                            <Button onClick={(e)=>{
                                fetch(`${process.env.NEXT_PUBLIC_URL}${builderConfig.builder.webhookurl}`,
                                    {headers: {'Authorization': `Bearer ${getCookie('iglu-session')}`}, method: 'POST'}
                                )
                                    .then((response) => {
                                        if (!response.ok) {
                                            throw new Error('Failed to trigger build');
                                        }
                                        toast.success("Build triggered successfully!");
                                    })
                                    .catch((error) => {
                                        console.error("Error triggering build:", error);
                                        toast.error("Failed to trigger build. Please try again later.");
                                    });
                            }}>
                                <Play />
                                Run Build
                            </Button>
                    </div>
                    ) : "Loading actions..."
                }
            </div>

            {builderConfig ?
                (
                    <Tabs defaultValue="overview">
                        <TabsList >
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="runs">Runs</TabsTrigger>
                        </TabsList>
                        <TabsContent value="overview">
                            <Overview builder={builderConfig} />
                        </TabsContent>
                        <TabsContent value="runs">
                            <History builder={builderConfig} />
                        </TabsContent>
                    </Tabs>
                ) : "Loading..."
            }
            <Toaster />
        </div>
    )
}