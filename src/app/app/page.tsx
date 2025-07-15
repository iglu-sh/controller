'use client'
import {auth} from "@/server/auth";
import {redirect} from "next/navigation";
import {useEffect} from "react";
import {api} from "@/trpc/react";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {RefreshCcw} from "lucide-react";
import {Card, CardContent, CardHeader} from "@/components/ui/card";

export default function App(){
    // Fetch the selected cache
    const cache = api.cache.getOverview.useQuery({
        cacheID: 1 // This should be replaced with the actual cache ID you want to fetch
    }).data
    return(
        <div className="w-full flex flex-col gap-4">
            <div className="flex flex-row justify-between items-center w-full">
                <div className="flex flex-col">
                    <h1 className="text-3xl font-bold">
                        {cache ? `Cache Overview for ${cache.info.name}` : "Loading Cache Overview..."}
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {
                            cache ? `${cache.info.uri} • Total Packages: ${cache.packages.total}, Storage Used: ${cache.packages.storage_used} bytes` : "Loading cache details..."
                        }
                    </p>
                </div>
                <div className="flex flex-row gap-2">
                    <Badge className="border-green-500 bg-transparent rounded-full">
                        Healthy
                    </Badge>
                    <Button onClick={()=>{window.location.reload()}}>
                        <RefreshCcw />
                        Refresh
                    </Button>
                </div>
            </div>
            <div className="grid grid-cols-2">
                <Card>
                    <CardContent>
                        <CardHeader>
                            Total Packages
                        </CardHeader>
                        <h1>
                            {cache ? cache.packages.total : "Loading..."}
                        </h1>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}