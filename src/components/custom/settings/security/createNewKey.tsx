import {
    Dialog, DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Copy, Pencil, Terminal} from "lucide-react";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Checkbox} from "@/components/ui/checkbox";
import {userInfoObject, cache} from "@/types/api";
import {useEffect, useState} from "react";
import {getCookie} from "cookies-next";
import {DataTable} from "@/components/custom/dataTable";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {Toaster} from "@/components/ui/sonner";
import {toast} from "sonner";
/*
* This file is a mess. It needs to be reworked to be more readable and maintainable but for now here's what it contains:
* - The Dialog box to create a new key
* - The Dialog box to use an existing key
* */
export function UseExistingKey({userInfoObj, cache, closeParentDialog}: {userInfoObj: userInfoObject | null, cache: cache | null, closeParentDialog: () => void}) {
    const [keys, setKeys] = useState([]);
    useEffect(() => {
        async function fetchKeys() {
            if(!cache) return;
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/v1/user/keys?cache=all&excluded=${cache.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getCookie('iglu-session')}`
                }
            });
            const data = await response.json();
            setKeys(data);
        }
        fetchKeys()
    }, []);

    async function updateKeys(){
        if(!cache) return;
        let enabledKeys = []
        for(let i = 0; i < keys.length; i++){
            const checkbox = document.getElementById(`key:${keys[i].id}`) as HTMLInputElement;

            if(checkbox.ariaChecked && checkbox.ariaChecked == "true"){
                enabledKeys.push(keys[i].id);
            }
        }

        if(enabledKeys.length === 0){
            toast.error("Please select at least one key");
            return;
        }
        //Make the request to update the keys
        const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/v1/user/keys`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getCookie('iglu-session')}`
            },
            body: JSON.stringify({
                cache_id: cache.id,
                keys: enabledKeys
            })
        });

        if(!response.ok){
            const data = await response.json();
            toast.error(data.error);
            closeParentDialog()
            return;
        }
        else{
            const data = await response.json();
            toast.success("Keys updated successfully");
            closeParentDialog()
        }
    }

    const columns = [
        {
            accessorKey: "",
            header: "Select",
            //@ts-ignore
            cell: ({row}) => {
                const id = row.getValue("id");
                return (
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            defaultChecked={row.getValue("cache_id") == cache?.id}
                            id={`key:${row.getValue("id")}`}
                        />
                    </div>
                );
            }
        },
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
            accessorKey: "cache_id",
            header: "Cache",
            //@ts-ignore
            cell: ({row}) => {
                const cache_id = row.getValue("cache_id");
                const cache = userInfoObj?.caches.find((cache) => cache.id === cache_id);
                return (
                    <div className="flex items-center space-x-2">
                        <span>{cache ? cache.name : "N/A"}</span>
                    </div>
                );
            }

        }
    ]
    return(
        <Dialog>
            <DialogTrigger>
                <Button variant="outline" className="w-full">
                    <Copy />
                    Use Existing Key
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Use Existing Key</DialogTitle>
                    <DialogDescription>
                        Select keys from the list below to use for this cache. You may select multiple keys. If you do not see any keys, please create a new key.
                    </DialogDescription>
                </DialogHeader>
                <DataTable columns={columns} data={keys ? keys: []} />
                {
                    keys && keys.length === 0 ? <Alert>
                            <Terminal className="h-4 w-4" />
                            <AlertTitle>No other keys found!</AlertTitle>
                            <AlertDescription>
                                No other keys could be found that can be used for this cache. Please create a new key.
                            </AlertDescription>
                        </Alert>
                        : null
                }
                <DialogClose>
                    <Button variant="outline"
                            className="w-full"
                            disabled={!(keys && keys.length > 0)}
                            onClick={()=>updateKeys()}
                    >


                        <Copy />
                        Use Keys
                    </Button>
                </DialogClose>
            </DialogContent>
        </Dialog>
    )
}
export function DisplayNewKey({newKey}:{newKey:string}){
    return(
        <div className="flex flex-col gap-4">
            <div className="w-full flex flex-row items-center align-center content-center justify-center bg-accent rounded-md p-4  border-2">
                {newKey}
                <Button variant="ghost" onClick={()=>{
                    navigator.clipboard.writeText(newKey);
                    toast.success("Copied!");
                }}>
                    <Copy />
                </Button>
            </div>
            <div className=" flex-row items-center align-center content-center justify-center rounded-md p-4  border-2">
               <h3 className="text-red-600">CAREFUL!</h3>
                <p>This is the last time you'll see this key. If you loose this key, we cannot show it again!</p>
            </div>
            <DialogClose>
                <Button variant="outline" className="w-full">
                    Close
                </Button>
            </DialogClose>
        </div>
    )
}
export default function CreateNewKey({userInfoObj, cache, refreshKeys}: {userInfoObj: userInfoObject | null, cache: cache | null, refreshKeys: () => void}) {
    const [newKey, setNewKey] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [enabledCaches, setEnabledCaches] = useState<number[]>([]);
    async function createKey(){
        const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/v1/user/keys`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getCookie('iglu-session')}`
            },
            body: JSON.stringify({
                name: document.getElementById("key_name")?.value,
                description: document.getElementById("key_description") ? document.getElementById("key_description")?.value : " ",
                cache_id: enabledCaches
            })
        });
        if(!response.ok){
            const data = await response.json();
            return;
        }

        const data = await response.json();
        setNewKey(data.key);
    }

    useEffect(() => {
        if(open){
            //Shred the key if the dialog was opened
            setNewKey(null);
        }
        if(!open && newKey){
            console.log("Dialog closed");
            //Refresh the keys if the dialog was closed
            refreshKeys();
        }

        if(!cache) return;
        setEnabledCaches([cache?.id]);
    }, [open]);

    function handleToggleCheckboxes(id:number, event){

        //Check if this ID is already in the array
        const index = enabledCaches.indexOf(id);
        if(index === -1){
            //If it is not in the array, add it
            setEnabledCaches([...enabledCaches, id]);
        }
        else{
            //If it is in the array, remove it
            enabledCaches.splice(index, 1);
            setEnabledCaches([...enabledCaches]);
        }
    }

    function handleCloseDialog(){
        console.log("Closing dialog");
        refreshKeys();
        setOpen(false);
        setNewKey(null);
    }
   return(
       <Dialog open={open} onOpenChange={()=>{setOpen(!open)}}>
           <DialogTrigger>
               <Button>
                   <Pencil />
                   Create New Key
               </Button>
           </DialogTrigger>
           <DialogContent>
               <DialogHeader>
                   <DialogTitle>{
                       newKey ? "Key Created!" : "Create New Key"
                   }</DialogTitle>
                   <DialogDescription>
                       {
                           newKey ? "Your new key has been created. You can use this key to access your cache." :
                               `
                                    Use the form below to create a new key for the cache. This key will be used to authenticate requests to the cache and will allow the key holder to modify information in the cache. You may re-use a key from another cache.
                               `
                       }
                   </DialogDescription>
               </DialogHeader>
               {
                   newKey ? <DisplayNewKey newKey={newKey} /> : <div className="flex flex-col gap-4">

                       <div className="flex flex-col gap-4">
                           <div className="gap-4 flex flex-col">
                               <Label>Name</Label>
                               <Input id="key_name" placeholder="Enter a name for your Key."></Input>
                           </div>
                           <div className="gap-4 flex flex-col">
                               <Label>Description</Label>
                               <Textarea id="key_description" placeholder="Enter a description for your Key."></Textarea>
                           </div>
                           <div className="flex flex-col gap-4">
                               <Label>Access</Label>
                               {
                                   userInfoObj?.caches.map((cacheInner)=>{
                                       return(
                                           <div className="flex flex-row gap-2 align-center items-center" key={cacheInner.id}>
                                               <Checkbox id={`cache:${cacheInner.id}`}
                                                         defaultChecked={cacheInner.id == cache.id}
                                                         onClick={(event)=>{
                                                    handleToggleCheckboxes(cacheInner.id, event)
                                               }}/>
                                               <Label htmlFor={`cache:${cacheInner.id}`}>Cache <span className="text-green-500">{cacheInner.name}</span></Label>
                                           </div>
                                       )
                                   })
                               }
                           </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4 w-full">
                           <UseExistingKey userInfoObj={userInfoObj} cache={cache} closeParentDialog={()=>handleCloseDialog()} />
                           <Button onClick={createKey}>
                               <Pencil />
                               Create Key
                           </Button>
                       </div>
                   </div>
               }
           </DialogContent>
           <Toaster />
       </Dialog>
   )
}