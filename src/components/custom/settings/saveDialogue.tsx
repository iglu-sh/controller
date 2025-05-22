'use client'

import type {cache} from "@/types/api";
import {Button} from "@/components/ui/button";
import {ArrowRight, SaveIcon} from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {useEffect, useState} from "react";
import {toast} from "sonner";
import {getCookie} from "cookies-next";
import {Toaster} from "@/components/ui/sonner";



export default function SaveDialogue({oldCache, newCache}:{oldCache:cache | undefined, newCache:cache | undefined}){
    if(!oldCache || !newCache){
        return null
    }
    const [configIsValid, setConfigIsValid] = useState(false);
    const [invalidKeys, setInvalidKeys] = useState<string[]>([]);
    useEffect(() => {
        //Check all the cache keys and if they are valid
        //Namecheck
        if(newCache.name === ""
            || newCache.name === undefined
            || newCache.name === "create"
            || newCache.name.includes(" ")
            || newCache.name.includes("/")
            || newCache.name.includes(".")
        ){
            setConfigIsValid(false);
            if(!invalidKeys.includes("name")){
                setInvalidKeys([...invalidKeys, "name"]);
            }
        }
        else{
            if(invalidKeys.includes("name")){
                setInvalidKeys(invalidKeys.filter(key => key !== "name"));
            }
        }
        //ID sanity check
        if(newCache.id !== oldCache.id){
            setConfigIsValid(false);
            if(!invalidKeys.includes("id")){
                setInvalidKeys([...invalidKeys, "id"]);
            }
            toast.error("ID cannot be changed");
        }
        else{
            if(invalidKeys.includes("id")){
                setInvalidKeys(invalidKeys.filter(key => key !== "id"));
            }
        }

        //Check compression
        if(newCache.preferredcompressionmethod != "ZSTD" && newCache.preferredcompressionmethod != "XZ"){
            setConfigIsValid(false);
            if(!invalidKeys.includes("compression")){
                setInvalidKeys([...invalidKeys, "compression"]);
            }
        }
        else{
            if(invalidKeys.includes("compression")){
                setInvalidKeys(invalidKeys.filter(key => key !== "compression"));
            }
        }

        //Check if the githubsername is valid
        if(newCache.githubusername.includes(" ") || newCache.githubusername === undefined){
            setConfigIsValid(false);
            if(!invalidKeys.includes("githubusername")){
                setInvalidKeys([...invalidKeys, "githubusername"]);
            }
        }
        else{
            if(invalidKeys.includes("githubusername")){
                setInvalidKeys(invalidKeys.filter(key => key !== "githubusername"));
            }
        }
    }, [newCache]);

    useEffect(() => {
        if(invalidKeys.length > 0){
            setConfigIsValid(false);
        }
        else{
            setConfigIsValid(true);
        }
    }, [invalidKeys]);

    async function commitSave(){
        //Check if the cache is valid
        if(!configIsValid){
            toast.error("Cache is not valid");
            return;
        }
        //Check if the cache is valid
        if(!oldCache || !newCache){
            toast.error("Cache is not valid");
            return;
        }
        const response = await fetch(`/api/v1/caches/${oldCache.id}`, {
            method: "PATCH",
            body: JSON.stringify(newCache),
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getCookie("iglu-session")}`,
            }
        });
        const data = await response.json();
        if(response.status === 200){
            toast.success("Cache updated successfully");
            //Reload the page
            window.location.reload();
        }
        else if(response.status === 409){
            toast.error("Cache with that name already exists!")
        }
        else{
            toast.error(data.error);
        }

    }
    return(
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button>
                    <SaveIcon />
                    Save Changes
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Change Settings?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently alter these settings:
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="w-full">
                    {
                        Object.keys(newCache).map(key=>{
                            //@ts-ignore
                            if(newCache[key] !== oldCache[key]){
                                return (
                                    <div key={key} id={key} className={`flex flex-row items-center w-full ${invalidKeys.includes(key) ? "text-red-500" : "text-green-500"}`}>
                                        <div>
                                            <strong>{key}</strong>: {oldCache[key]}
                                        </div>
                                         <ArrowRight size={20} />
                                        <div>
                                            {newCache[key]}
                                        </div>
                                    </div>
                                )
                            }
                        })
                    }
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>

                    <AlertDialogAction disabled={invalidKeys.length > 0} onClick={()=>commitSave()}>Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
            <Toaster />
        </AlertDialog>


    )
}