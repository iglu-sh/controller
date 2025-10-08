'use client'
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {useSearchParams} from "next/navigation";
import {BuilderOverview} from "@/app/app/builders/components/builder";

export default function Builders(){
    // Get the current cacheID from the query params
    const searchParams = useSearchParams()
    if(process.env.NEXT_PUBLIC_DISABLE_BUILDER === "true"){
        // If the builder is disabled, redirect to the home page
        document.location.href = "/";
    }
    const cacheID = searchParams.get("cacheID");
    return(
        <div className="flex flex-col w-full gap-4">
            <div className="flex flex-row items-center justify-between">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold">
                        Builders
                    </h1>
                    <div className="text-muted-foreground text-sm">
                        Build and manage Nix packages with ease
                    </div>
                </div>
                <Link href={`/app/builders/create?cacheID=${cacheID ?? ''}`} className="flex items-center">
                    <Button>Create new Builder</Button>
                </Link>
            </div>
            {
                cacheID ?
                    <div className="flex flex-col gap-2">
                        <Tabs defaultValue="builder" className="w-full">
                            <TabsList className="w-full">
                                <TabsTrigger value="builder">Builder</TabsTrigger>
                                <TabsTrigger value="queue">Queue</TabsTrigger>
                                <TabsTrigger value="nodes">Nodes</TabsTrigger>
                            </TabsList>
                            <TabsContent value="builder"><BuilderOverview cacheID={parseInt(cacheID)} /></TabsContent>

                            <TabsContent value="queue">Change your password here.</TabsContent>
                            <TabsContent value="nodes">Change your password here.</TabsContent>
                        </Tabs>
                    </div>
                    : <div className="flex flex-col gap-2">Loading</div>
            }
        </div>
    )
}