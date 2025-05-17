'use client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import './form.css'
import {Label} from "@radix-ui/react-label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {useEffect, useRef, useState} from "react";
import { getCookie } from "cookies-next";
import {Toaster} from "@/components/ui/sonner";
import {toast} from "sonner";
export function CreationForm(){
    const [compression, setCompression] = useState("xz")
    const [availablePublicKeys, setAvailablePublicKeys] = useState<string[]>([])
    const [selectedPublicKey, setSelectedPublicKey] = useState<string>("_")
    //Fetch initial props
    useEffect(()=>{
        const apiKey = getCookie("iglu-session")
        if(!apiKey){
            window.location.href = "/"
        }
        async function wrap(){
            const headers = new Headers()
            headers.append("Authorization", `Bearer ${apiKey}`)
            const requestOptions = {
                method: 'GET',
                headers: headers,
                redirect: 'follow'
            }
            await fetch(`${process.env.NEXT_PUBLIC_URL}/api/v1/publickeys`, requestOptions)
                .then(response => response.json())
                .then(result => {
                    if(!result || !result.keys){
                        toast.error("Failed to fetch public keys")
                        return
                    }
                    setAvailablePublicKeys(result.keys)
                })
                .catch(error => toast.error("Error fetching public keys: " + error));
        }
        wrap()
    }, [])

    //Handle form submission
    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        //Get all the values and validate them
        const name = (document.getElementById("name") as HTMLInputElement).value
        if(!name || name === "create" || name.includes(" ")){
            toast.error("Cache name must be unique, not contain spaces and not be 'create'")
            return
        }

        const priority = (document.getElementById("priority") as HTMLInputElement).value
        if(!priority || priority === "" || isNaN(parseInt(priority)) || parseInt(priority) < 0){
            toast.error("Priority must be a number and positive")
            return
        }
        let isPublic = (document.getElementById("isPublic") as HTMLInputElement).checked
        if(isPublic === undefined){
            isPublic = true
        }
        isPublic ? isPublic = true : isPublic = false
        if(compression !== "XZ" && compression !== "ZSTD"){
            toast.error("Compression must be either XZ or ZSTD")
            return
        }
        let githubUsername = (document.getElementById("githubUsername") as HTMLInputElement).value
        if(!githubUsername){
            //As the github username is not required, this is recoverable but we should make sure it is not 'undefined'
           githubUsername = "";
        }

        const apiKey = getCookie("iglu-session")
        if(!apiKey){
            window.location.href = "/"
        }

        const headers = new Headers()
        headers.append("Authorization", `Bearer ${apiKey}`)
        headers.append("Content-Type", "application/json")
        const requestOptions = {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                name: name,
                githubUsername: githubUsername,
                isPublic: isPublic,
                priority: parseInt(priority),
                enableBuilder: false,
                compression: compression,
                publicSigningKey: selectedPublicKey == '_' ? '' : selectedPublicKey
            }),
            redirect: 'follow'
        }
        await fetch(`${process.env.NEXT_PUBLIC_URL}/api/v1/caches`, requestOptions).then((response) => {
            if(response.status === 201){
                toast.success("Cache created successfully")
                window.location.href = "/app/caches"
            }
            else if(response.status === 409){
                toast.error("A Cache with that name already exists")
            }
            else{
                toast.error("Cache creation failed (status code: " + response.status + "). Please try again.")
            }
        })
    }

    function handleCompressionChange(value) {
        setCompression(value)
    }

    function handlePublicKeyChange(value) {
        console.log(value)
        setSelectedPublicKey(value)
    }
    return(
        <form className="form" onSubmit={handleSubmit}>
            <div className="form-group">
                <div className="form-group-div align-right">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Label htmlFor="name">Name</Label>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Cache name must be unique and not contain spaces</p>
                                <p>Cache name cannot be "create"</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <Input id="name" placeholder="Name" required />
            </div>
            <div className="form-group">
                <Label htmlFor="githubUsername">GitHub Username</Label>
                <Input id="githubUsername" placeholder="GitHub Username" />
            </div>
            <div className="form-group">
                <div className="form-group-div align-right">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Label htmlFor="name">Make Cache Public?</Label>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Don't know how this shit works, will implement later</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <div className="form-group-div">
                    <Checkbox id="isPublic" defaultChecked={true} disabled={true}/>
                </div>
            </div>
            <div className="form-group">
                <Label htmlFor="xz-select">Compression</Label>
                <div className="form-group-div">
                    <Select id="compression" required onValueChange={handleCompressionChange} >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Compression"  defaultValue={"XZ"}/>
                        </SelectTrigger>
                        <SelectContent >
                            <SelectItem value="ZSTD">ZSTD</SelectItem>
                            <SelectItem value="XZ">XZ</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="form-group">
                <Label htmlFor="priority">Priority</Label>
                <Input id="priority" type="number" min={0} defaultValue={40} ></Input>
            </div>
            <div className="form-group">
                <Label htmlFor="enable-builder">Enable Builder (Not Implemented Yet)</Label>
                <div className="form-group-div">
                    <Checkbox id="enable-builder" defaultChecked={false} disabled={true}/>
                </div>
            </div>
            <div className="form-group">
                <Label htmlFor="signingKey">Public Signing Key from Cache</Label>
                <div className="form-group-div">
                    <Select id="signing-key" onValueChange={handlePublicKeyChange} >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Add your own later"  defaultValue={""}/>
                        </SelectTrigger>
                        <SelectContent >
                            {
                                availablePublicKeys ? availablePublicKeys.map((key, index) => {
                                    return (
                                        <SelectItem key={index} value={key.key}>Cache: {key.name}</SelectItem>
                                    )
                                }) : null
                            }
                            <SelectItem value="_">Add your own later</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="form-group-submit">
                <Button variant="default" type="submit">Create</Button>
            </div>
            <Toaster />
        </form>
    )
}