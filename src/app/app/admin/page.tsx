'use client'
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import CachesTab from "@/app/app/admin/Components/cachesTab";
import {api} from "@/trpc/react";
import {LoaderCircle} from "lucide-react";
import UsersTab from "@/app/app/admin/Components/usersTab";

export default function AdminPage(){
    const everything = api.admin.getCachesPropagated.useQuery()
    const users = api.admin.getAllUsers.useQuery()
    return(
        <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold">Admin Page</h1>
                <span>Change specific settings of your cache</span>
            </div>
            <div className="grid grid-cols-2 gap-4">

            </div>
            <Tabs defaultValue="caches" className="w-full">
                <TabsList className="w-full">
                    <TabsTrigger value="caches">Caches</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="builders">Builders</TabsTrigger>
                    <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                    <TabsTrigger value="services">Services</TabsTrigger>
                </TabsList>
                <TabsContent value="caches">{everything.data ? <CachesTab everything={everything.data} /> : <LoaderCircle className="animate-spin" />}</TabsContent>
                <TabsContent value="users">{users.data ? <UsersTab users={users.data} /> : <LoaderCircle className="animate-spin" />}</TabsContent>
            </Tabs>
        </div>
    )
}