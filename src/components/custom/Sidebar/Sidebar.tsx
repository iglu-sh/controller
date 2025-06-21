'use client'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
} from "@/components/ui/sidebar"
import Image from "next/image";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {BarChart, BarChart3, BarChartIcon, Database, HardDrive, Home, Package, Pen, Pencil} from "lucide-react";
import CacheDropdown from "@/components/custom/Sidebar/CacheDropdown";
import type {Session} from "next-auth";
import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import GearIcon from "next/dist/client/components/react-dev-overlay/ui/icons/gear-icon";
import {useSession} from "next-auth/react";
import {useEffect} from "react";
import {useSearchParams} from "next/navigation";
import {api} from "@/trpc/react";
import {toast} from "sonner";
export default function AppSidebar(){
    // We can be sure that the Session is available here because we check for this in the parent component before rendering this component.
    const session = useSession()
    const params = useSearchParams()
    const cache = api.cache.byUser.useQuery()
    const cacheID = params.get("cacheID")

    // Fetch all the caches this user has access to
    // This will be used to populate the CacheDropdown component
    useEffect(() => {
        // Check if the cache ID is empty and, if so, set the first cache as the default cache
        if((!params || !params.has("cacheID")) && cache.data && cache.data[0]){
            window.location.href = `${window.location}?cacheID=${cache.data[0].id}`;
        }
    }, [params]);
    return(
        <Sidebar>
            <SidebarHeader className="flex flex-col gap-4">
                <div className="flex flex-row items-center gap-2">
                    <Image src={"/logo.jpeg"} alt={"Iglu Logo"} width={48} height={48} className="rounded-md" />
                    <h1 className="text-2xl font-bold">Iglu</h1>
                </div>
                {
                    cache && cache.data ? (
                        <CacheDropdown caches={cache.data} />
                    ) : (
                        <div>
                            Loading Caches...
                        </div>
                    )
                }
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <Link href={`/app?cacheID=${cacheID}`} className="w-full font-bold text-lg">
                        <Button variant="ghost" className="w-full justify-start">
                            <Home />
                            Overview
                        </Button>
                    </Link>
                    <Link href={`/app/packages?cacheID=${cacheID}`} className="w-full font-bold text-lg">
                        <Button variant="ghost" className="w-full justify-start">
                            <Package />
                            Packages
                        </Button>
                    </Link>
                    <Link href={`/app/builders?cacheID=${cacheID}`} className="w-full font-bold text-lg">
                        <Button variant="ghost" className="w-full justify-start">
                            <Pencil />
                            Builders
                        </Button>
                    </Link>
                    <Link href={`/app/performance?cacheID=${cacheID}`} className="w-full font-bold text-lg">
                        <Button variant="ghost" className="w-full justify-start">
                            <BarChart3 />
                            Performance
                        </Button>
                    </Link>
                    <Link href={`/app/storage?cacheID=${cacheID}`} className="w-full font-bold text-lg">
                        <Button variant="ghost" className="w-full justify-start">
                            <HardDrive />
                            Storage
                        </Button>
                    </Link>
                    <Link href={`/app/admin?cacheID=${cacheID}`} className="w-full font-bold text-lg">
                        <Button variant="ghost" className="w-full justify-start">
                            <GearIcon />
                            Admin Center
                        </Button>
                    </Link>
                    <Link href={`/app/settings?cacheID=${cacheID}`} className="w-full font-bold text-lg">
                        <Button variant="ghost" className="w-full justify-start">
                            <GearIcon />
                            Cache Settings
                        </Button>
                    </Link>
                </SidebarGroup>
            </SidebarContent>
            {
                session && session.data ? (
                    <SidebarFooter className="w-full p-0">
                        <Link href={`/app/user?cacheID=${cacheID}`} className="w-full flex flex-col gap-2 h-full">
                            <Button variant="ghost" className="
                        w-full h-full justify-start">
                            <Avatar>
                                <AvatarFallback style={{backgroundColor: session.data.user.session_user.avatar_color}}>
                                    {session.data.user.session_user.username.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-1 w-full items-start">
                                <h3 className="font-bold">
                                    {session.data.user.session_user.username || "User"}
                                </h3>
                                <div className="text-muted-foreground text-xs">
                                    {session.data.user.session_user.email}
                                </div>
                            </div>
                            </Button>
                        </Link>
                    </SidebarFooter>
                ) : null
            }
        </Sidebar>
    )
}
