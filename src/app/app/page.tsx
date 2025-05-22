'use client'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import React, {useEffect, useState} from "react";
import {cache, cacheInfoObject, userInfoObject} from "@/types/api";
import {getCookie} from "cookies-next";
import {Toaster} from "@/components/ui/sonner";
import {toast} from 'sonner'
import Link from "next/link";
import {Button} from "@/components/ui/button";
import CacheOverviewTable from "@/components/custom/dashboard/cacheOverviewTable";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import { ArrowDown, ArrowUp, Clock, Download, HardDrive, Package } from "lucide-react"
import {CacheActivityChart} from "@/components/custom/dashboard/cache-activity-chart";
import CacheOverview from "@/components/custom/dashboard/cacheOverviewCards";
import {useSearchParams} from "next/navigation";
export default function Home(){
    const searchParams = useSearchParams()
    //I know that this is duplicate code, but I cannot pass the caches object from the parent layout to this one
    const [caches, setCaches] = React.useState<userInfoObject | null>(null);
    const [currentCache, setCurrentCache] = React.useState<cache | "all">("all");
    useEffect(()=>{
        const apiKey = getCookie("iglu-session");
        if(!apiKey){
            window.location.href = "/"
        }

        async function fetchUserData(){
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/v1/user`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                }
            });
            if(!response.ok){
                window.location.href = "/"
            }
            const data = await response.json();
            console.log(data)
            setCaches(data);
            //Get the ?cache= from the url
            const urlParams = new URLSearchParams(window.location.search);
            const cacheParam = urlParams.get("cache");
            console.log("Cache parameter: %s", urlParams.get("cache"), cacheParam);
            if(!cacheParam || cacheParam === "all") {
                setCurrentCache("all")
            }
            else {
                const cache = data.caches.filter((item)=> item.id == cacheParam);
                if(cache[0]) {
                    setCurrentCache(cache[0]);
                } else {
                    setCurrentCache("all");
                }
            }
        }
        fetchUserData()


    }, [])
    useEffect(()=>{
        console.log(currentCache)
    }, [currentCache])

    useEffect(() => {
        if(!caches) return;

        //Listen to SearchParams changes (this is needed because a switch in the sidebar will change the url but not re-call the useEffect)
        //Get the ?cache= from the url
        const urlParams = new URLSearchParams(window.location.search);
        const cacheParam = urlParams.get("cache");
        console.log(urlParams.get("cache"), cacheParam);
        if(!cacheParam || cacheParam === "all") {
            setCurrentCache("all")
        }
        else {
            const cache = caches.caches.filter((item)=> item.id == cacheParam);
            if(cache[0]) {
                setCurrentCache(cache[0]);
            } else {
                setCurrentCache("all");
            }
        }
    }, [searchParams]);
    return(
        <div className="flex flex-col gap-6">
            <h1>
                Dashboard
            </h1>
            <div>
                Hey there 👋, welcome back! You are currently seeing data for
                {
                    currentCache === "all" ?
                        <span style={{color: "var(--color-orange-400"}}> all the caches you have access too</span> :
                        <span style={{color: "var(--color-green-400"}}> cache "{currentCache.name}"</span>
                }
            </div>
            <CacheOverview />
        </div>
    )
}