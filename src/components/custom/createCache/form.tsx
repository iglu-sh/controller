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
import {useRef, useState} from "react";
import { getCookie } from "cookies-next";

export function CreationForm(){
    const name = useRef(null)
    const githubUsername = useRef(null)
    const isPublic = useRef(null)
    const priority = useRef(null)
    const enableBuilder = useRef(null)
    const [compression, setCompression] = useState("xz")
    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const name = (document.getElementById("name") as HTMLInputElement).value
        if(!name || name === "create" || name.includes(" ")){
            alert("Cache name must be unique, not contain spaces and not be 'create'")
            return
        }

        const priority = (document.getElementById("priority") as HTMLInputElement).value
        if(!priority || priority === "" || isNaN(parseInt(priority)) || parseInt(priority) < 0){
            alert("Priority must be a number and positive")
            return
        }
        let isPublic = (document.getElementById("isPublic") as HTMLInputElement).checked
        isPublic ? isPublic = true : isPublic = false

        if(compression !== "xz" && compression !== "zstd"){
            alert("Compression must be either XZ or ZSTD")
            return
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
                githubUsername: githubUsername.current.value,
                isPublic: isPublic,
                priority: parseInt(priority),
                enableBuilder: enableBuilder.current.checked,
                compression: compression
            }),
            redirect: 'follow'
        }

        await fetch(`${NEXT_PUBLIC_URL}/api/v1/caches/create`, requestOptions).then((response) => {
            if(response.status === 201){
                alert("Cache created successfully")
                window.location.href = "/caches"
            }
        })
    }

    function handleCompressionChange(value) {
        setCompression(value)
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
                <Input id="name" ref={name} placeholder="Name" required />
            </div>
            <div className="form-group">
                <Label htmlFor="githubUsername">GitHub Username</Label>
                <Input id="githubUsername" ref={githubUsername} placeholder="GitHub Username" />
            </div>
            <div className="form-group">
                <Label htmlFor="isPublic">Make Cache Public?</Label>
                <div className="form-group-div">
                    <Checkbox id="isPublic" ref={isPublic} defaultChecked={true} disabled={true}/>
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
                            <SelectItem value="zstd">ZSTD</SelectItem>
                            <SelectItem value="xz">XZ</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="form-group">
                <Label htmlFor="priority">Priority</Label>
                <Input id="priority" type="number" min={0} defaultValue={40} ref={priority}></Input>
            </div>
            <div className="form-group">
                <Label htmlFor="enable-builder">Enable Builder (Not Implemented Yet)</Label>
                <div className="form-group-div">
                    <Checkbox id="enable-builder" defaultChecked={false} disabled={true}/>
                </div>
            </div>
            <div className="form-group-submit">
                <Button variant="default" type="submit">Create</Button>
            </div>
        </form>
    )
}