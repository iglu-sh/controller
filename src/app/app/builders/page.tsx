'use client'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {DataTable} from "@/components/custom/dataTable";
import {ColumnDef} from "@tanstack/react-table";
import {builder} from "@/types/api";
import {useEffect} from "react";
import {useSearchParams} from "next/navigation";
import {getCookie} from "cookies-next";
import {Toaster} from "@/components/ui/sonner";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {Plus} from "lucide-react";

const columns:ColumnDef<builder> = [
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "description",
        header: "Description",
    },
    {
        accessorKey: "id",
        header: "Actions",
        cell: ({row}) => (
            <div className="flex gap-2">
                <button className="btn btn-primary" onClick={() => alert(`Edit builder ${row.original.id}`)}>Edit</button>
                <button className="btn btn-secondary" onClick={() => alert(`Delete builder ${row.original.id}`)}>Delete</button>
            </div>
        )
    }
]
export default function Builder(){
    const searchParams = useSearchParams()
    async function fetchBuilders() {
        if(!searchParams.has('cache') || searchParams.get('cache') === "all"){
            //Fetch every cache this user has access too and redirect him to the first one
            const userData = await fetch(`/api/v1/user`, {
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${getCookie('iglu-session')}`
                }
            })
            if(!userData.ok){
                toast.error("Error fetching user data. Please try again later.")
                return
            }
            const user = await userData.json()
            if(user.caches.length === 0){
                toast.error("You don't have any caches. Please create one first.")
                return
            }
            window.location.href = `/app/builders?cache=${user.caches[0].id}`;
            return
        }

        //Fetch the builders for the current cache
    }
    useEffect(() => {
        fetchBuilders()
    }, []);

    //Check if the cache param changes
    useEffect(() => {
        fetchBuilders()
    }, [searchParams]);
    return (
            <Card>
                <CardHeader>
                    <CardTitle>
                        <h1>
                            Builder Management
                        </h1>
                    </CardTitle>
                    <CardDescription>
                        <div className="grid grid-cols-4">
                            <div className="col-span-3 items-center flex">
                                This section allows you to create, edit, and manage your builders.
                            </div>
                            <Button>
                                <Plus />
                                Create New Builder
                            </Button>
                        </div>
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <DataTable columns={columns} data={[]} />
                </CardContent>
                <Toaster />
            </Card>
    );
}