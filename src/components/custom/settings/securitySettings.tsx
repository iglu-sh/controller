import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {cache, userInfoObject} from "@/types/api";
import {DataTable} from "@/components/custom/dataTable";
import {useEffect, useState} from "react";
import {deleteCookie, getCookie} from "cookies-next";
import {Button} from "@/components/ui/button";
import {Cross, Pencil, X} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Checkbox} from "@/components/ui/checkbox";
import CreateNewKey from "@/components/custom/settings/security/createNewKey";
import DeleteDialogue from "@/components/custom/settings/security/deleteDialogue";


export default function SecuritySettings({cache, userInfoObj}: {cache: cache | null, userInfoObj:userInfoObject | null}) {
    const [keys, setKeys] = useState([]);

    //This state stores the keys for everything that this key can access
    const [keysForEverything, setKeysForEverything] = useState([]);
    const keysColumns = [
        {
            accessorKey: "id",
            header: "ID",
            //@ts-ignore
            cell: ({row}) => {
                return (
                    <div className="flex items-center space-x-2">
                        <span>{row.getValue("id")}</span>
                    </div>
                );
            }
        },
        {
            accessorKey: "name",
            header: "Name",
            //@ts-ignore
            cell: ({row}) => {
                return (
                    <div className="flex items-center space-x-2">
                        <span>{row.getValue("name")}</span>
                    </div>
                );
            }
        },
        {
            accessorKey: "description",
            header: "Description",
            //@ts-ignore
            cell: ({row}) => {
                return (
                    <div className="flex items-center space-x-2">
                        <span>{row.getValue("description")}</span>
                    </div>
                );
            }
        },
        {
            accessorKey: "created_at",
            header: "Created At",
            //@ts-ignore
            cell: ({row}) => {
                return (
                    <div className="flex items-center space-x-2">
                        <span>{row.getValue("created_at")}</span>
                    </div>
                );
            }
        },
        {
            accessorKey: "",
            header: "Actions",
            //@ts-ignore
            cell: ({row}) => {
                return (
                    <div className="flex items-center space-x-2">
                        <Button variant="outline"><Pencil /></Button>
                        <DeleteDialogue keys={keys} keyID={row.getValue("id")} cacheID={cache.id.toString()} deletedKeyCallback={()=>deletedKeyCallback()}/>
                    </div>
                );
            }
        }
    ]

    //Fetch the keys for the cache
    async function fetchKeys() {
        if(!cache) return;
        const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/v1/user/keys?cache=${cache.id}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${getCookie("iglu-session")}`
            }
        });
        const data = await response.json();
        if(response.status === 200){
            setKeys(data);
        } else {
            console.error(data.error);
        }
    }
    async function deletedKeyCallback(){
        //Check if this key is still authenticated
        const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/v1/caches/${cache.id}`, {
            method: "GET",
            headers: {
                "authorization": `Bearer ${getCookie("iglu-session")}`
            }
        })
        if(!response.ok){
            //Delete the cookie and redirect to login page
            deleteCookie("iglu-session");
            window.location.href = "/";
            return
        }
        //Refetch the keys
        fetchKeys()
    }
    useEffect(() => {
        fetchKeys()
    }, []);
    useEffect(() => {
        fetchKeys()
    }, [cache]);
    return(
        <Card>
            <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Configure basic cache settings</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-4">
                    Configured API Keys
                    <DataTable columns={keysColumns} data={keys ? keys : []} />
                    <div className="flex flex-col gap-4 align-end justify-end items-end">
                        <CreateNewKey userInfoObj={userInfoObj} cache={cache} refreshKeys={()=>fetchKeys()}/>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}