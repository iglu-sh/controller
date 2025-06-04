'use client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {Button} from "@/components/ui/button";
import {SaveIcon} from "lucide-react";
import GeneralSettings from "@/components/custom/settings/generalSettings";
import StorageSettings from "@/components/custom/settings/storageSettings";
import SecuritySettings from "@/components/custom/settings/securitySettings";
import {useEffect, useState} from "react";
import {cache, userInfoObject} from "@/types/api";
import {useSearchParams} from "next/navigation";
import {getCookie} from "cookies-next";
import MaintenanceSettings from "@/components/custom/settings/maintenanceSettings";
import SaveDialogue from "@/components/custom/settings/saveDialogue";

export default function Settings(){
    const [userData, setUserData] = useState<userInfoObject | null>(null);
    const [currentCache, setCurrentCache] = useState<cache | null>();
    const [originalCurrentCache, setOriginalCurrentCache] = useState<cache | null>();
    const [id, setId] = useState<string>("all");
    const searchParams = useSearchParams()
    async function wrap(){
        const apiKey = getCookie("iglu-session");
        if(!apiKey){
            //window.location.href = "/"
        }
        const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/v1/user`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            }
        });
        if(!response.ok){
            //window.location.href = "/"
        }
        const data = await response.json();
        setUserData(data);
        //Get the current cache
        const id = searchParams.get("cache");
        setId(id);
        if (id) {
            const cache = data.caches.filter((item)=> item.id == id);
            if(cache[0]) {
                setCurrentCache(cache[0]);
                setOriginalCurrentCache(cache[0]);
            } else {
                setCurrentCache(null);
            }
        } else {
            setCurrentCache(null);
        }
    }
    useEffect(() => {
        wrap()
    }, []);

    useEffect(() => {
        const id = searchParams.get("cache");
        console.log('Search params updated', id)
        if (id) {
            setId(id);
            wrap()
        } else {
            setId("all");
        }
    }, [searchParams]);
    return(
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
                <h1>
                    Settings
                </h1>
                <div className="flex w-full items-end justify-end">
                    {
                        currentCache && originalCurrentCache ?
                            <SaveDialogue oldCache={originalCurrentCache} newCache={currentCache} />
                            : null
                    }
                </div>
                <div className="flex flex-col gap-4">
                    {
                        id && id !== "all" ? <div>You are editing Settings for Cache {currentCache ? currentCache.name : null}</div> : <div>You are editing Settings for all caches</div>
                    }
                </div>
            </div>
            {
                currentCache && id !== "all" ?
                    <Tabs defaultValue="general" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="storage">Storage</TabsTrigger>
                            <TabsTrigger value="network">Network</TabsTrigger>
                            <TabsTrigger value="security">Security</TabsTrigger>
                            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                        </TabsList>
                        <TabsContent value="general"><GeneralSettings cache={currentCache} setCacheCallback={(cache:cache)=>setCurrentCache(cache)}/></TabsContent>
                        <TabsContent value="storage"><StorageSettings cache={currentCache} setCacheCallback={(cache:cache)=>setCurrentCache(cache)} /></TabsContent>
                        <TabsContent value="network">Nothing here yet :D</TabsContent>
                        <TabsContent value="security"><SecuritySettings userInfoObj={userData ? userData : null} cache={currentCache ? currentCache : null}/></TabsContent>
                        <TabsContent value="maintenance"><MaintenanceSettings cache={currentCache} userInfoObj={userData} /></TabsContent>
                    </Tabs> : <div>Settings for the Server aren't implemented yet! Choose a chache on the left side to edit settings for a specific cache!</div>
            }
        </div>
    )
}