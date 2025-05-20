'use client'
import React, {useEffect} from "react";
import './layout.css'
import Navbar from "@/components/custom/navbar";
import {getCookie} from "cookies-next";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup, SidebarGroupAction, SidebarGroupLabel,
    SidebarHeader,
    SidebarMenuButton,
    SidebarProvider,
    SidebarTrigger
} from "@/components/ui/sidebar";
import {
    BarChartIcon,
    ChartScatterIcon,
    ChevronDown,
    Database, Dot, Globe,
    HardDriveIcon,
    HomeIcon,
    Package,
    Plus,
    SettingsIcon
} from "lucide-react";
import Image from "next/image";
import {Button} from "@/components/ui/button";
import GearIcon from "next/dist/client/components/react-dev-overlay/ui/icons/gear-icon";
import { DropdownMenu, DropdownMenuContent,  DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import {cacheInfoObject, userInfoObject} from "@/types/api";
import {useSearchParams} from "next/navigation";
import {Card, CardHeader} from "@/components/ui/card";

export default function CacheOverviewPageLayout(
    {children}: Readonly<{
        children: React.ReactNode;
    }>) {
    const [caches, setCaches] = React.useState<userInfoObject | null>(null);
    const [id, setId] = React.useState<string>("all");
    const searchParams = useSearchParams()
    const [page, setPage] = React.useState<string>("/app");
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
            //Get the current cache
            const id = searchParams.get("cache");
            if (id) {
                setId(id);
            } else {
                setId("all");
            }

            //Get the current page
            const url = window.location.pathname;
            setPage(url);
        }
        fetchUserData()
    }, [])

    useEffect(() => {
        const id = searchParams.get("cache");
        if (id) {
            setId(id);
        } else {
            setId("all");
        }
        //Get the current page
        const url = window.location.pathname;
        setPage(url);
    }, [searchParams]);

    //<Navbar />
    return (
        <SidebarProvider className="flex flex-row">
            <Sidebar>
                <SidebarHeader>
                    <div className="flex flex-row gap-4 mt-2.5 mr-1.5">
                        <Image src="/logo.jpeg" width={35} height={35} alt={"logo-alt"} className="rounded-md"/>
                        <h2>
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                Iglu Cache
                            </span>
                        </h2>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarGroup>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton className="flex flex-row">
                                    {id === "all" ? <div className="flex flex-row items-center"><Globe className="mr-2 h-4 w-4"/>All Caches</div> :
                                        <div className="flex flex-row items-center"><HardDriveIcon className="mr-2 h-4 w-4" />{caches ? caches.caches?.filter((cache)=>cache.id.toString() == id)[0].name : null}</div>}
                                    <ChevronDown className="ml-auto" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-full">
                                <Link href={`${process.env.NEXT_PUBLIC_URL}${page}?cache=all`}>
                                        <DropdownMenuItem>
                                            <Globe className="mr-2 h-4 w-4"/>
                                            <span style={{background:"linear-gradient(90deg, orange, purple)", backgroundClip:"text", color:"transparent"}}>All Caches</span>
                                        </DropdownMenuItem>
                                </Link>
                                {
                                    caches && caches.caches ? caches.caches.map((cache)=>{
                                        return(
                                            <Link href={`${process.env.NEXT_PUBLIC_URL}${page}?cache=${cache.id}`} key={cache.name}>
                                                <DropdownMenuItem>
                                                    <HardDriveIcon className="mr-2 h-4 w-4" />
                                                    {cache.name}
                                                </DropdownMenuItem>
                                            </Link>
                                        )
                                    }) : null
                                }
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarGroup>
                    <SidebarGroup className="flex flex-col gap-2">
                        <SidebarGroupLabel>Caches</SidebarGroupLabel>
                        <SidebarGroupAction title="Add Cache">
                            <Link href={"/app/caches/create"}>
                                <Plus /><span className="sr-only">Add Cache</span>
                            </Link>
                        </SidebarGroupAction>
                        <Link href={`/app?cache=${id}`} className="w-full">
                            <Button variant="ghost" className="flex items-center justify-start pl-5 w-full">
                                <HomeIcon className="mr-2 h-4 w-4" />
                                Dashboard
                            </Button>
                        </Link>
                        <Link href={`/app/derivations?cache=${id}`}>
                            <Button variant="ghost" className="flex items-center justify-start pl-5 w-full">
                                <Package className="mr-2 h-4 w-4" />
                                Stored Paths
                            </Button>
                        </Link>
                        <Link href={`/app/caches?cache=${id}`}>
                            <Button variant="ghost" className="flex items-center justify-start pl-5 w-full">
                                <Database className="mr-2 h-4 w-4" />
                                Caches
                            </Button>
                        </Link>
                        <Link href={`app/performance?cache=${id}`}>
                            <Button variant="ghost" className="flex items-center justify-start pl-5 w-full">
                                <BarChartIcon className="mr-2 h-4 w-4" />
                                Performance
                            </Button>
                        </Link>
                        <Link href={`/app/settings?cache=${id}`}>
                            <Button variant="ghost" className="flex items-center justify-start pl-5 w-full">
                                <GearIcon/>
                                Settings
                            </Button>
                        </Link>
                    </SidebarGroup>
                </SidebarContent>
            </Sidebar>
            <div style={{width: "100%"}}>
                <div className="flex flex-row gap-4 bg-accent w-full items-center justify-start">
                    <div className="flex flex-row gap-4 ml-2 items-center">
                        <SidebarTrigger />
                        <h3>
                                Controller
                        </h3>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Dot className="text-green-500" size={48}/>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <h3>
                                        All Good!
                                    </h3>
                                    Your Cache-Setup seems to be running fine!
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div className="flex flex-row gap-4 items-end justify-end w-full">
                        <Navbar />
                    </div>
                </div>
                <div style={{marginLeft: "auto", marginRight: "auto", maxWidth: "900px", marginTop: "20px"}}>
                    {children}
                </div>
            </div>
        </SidebarProvider>
    )
}