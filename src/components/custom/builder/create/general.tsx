'use client'
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Switch} from "@/components/ui/switch";
import {useEffect, useState} from "react";
import {Separator} from "@/components/ui/separator";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {Save} from "lucide-react";
import {BuilderCreationRequest} from "@/types/frontend";

export default function General({data, setData}:{data:BuilderCreationRequest, setData:(data: BuilderCreationRequest) => void}) {
    const [requiresAuth, setRequiresAuth] = useState(false);
    const [buildOption, setBuildOption] = useState('manual');
    return(
        <div className="flex flex-col gap-4 w-full mt-3">
            <div className="flex flex-col space-y-2 w-full">
                <label className="">Configuration Name</label>
                <Input type="text" placeholder="Enter configuration name" onChange={(e)=>{
                    setData({
                        ...data,
                        name: e.target.value
                    })
                }}
                value={data.name || ""} required
                ></Input>
            </div>
            <div className="flex flex-col space-y-2 w-full">
                <label className="">Description</label>
                <Textarea placeholder="Enter configuration description" onChange={(e)=>{
                    setData({
                        ...data,
                        description: e.target.value
                    })
                }}
                value={data.description || ""} required
                />
            </div>
            <div className="flex flex-col space-y-2 w-full">
                <label>Git Repository URL</label>
                <Input type="url" placeholder="Enter configuration Git repository URL"
                    onChange={(e)=>{
                        const val = e.target.value;
                        let noClone = false;
                        if(val === "" || !val.startsWith("http") || !val.startsWith("https") || !val){
                            noClone = true;
                        }
                        setData({
                            ...data,
                            git: {
                                ...data.git,
                                url: e.target.value,
                                noClone: noClone,
                            }
                        })
                    }}
                       value={data.git.url || ""}
                />
                <div className="text-muted-foreground text-sm">
                    You may also not provide git settings and use a nix command in the format of: nix build github:repo_name/flake_name#my-derivation
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2 w-full">
                    <label>Branch</label>
                    <Input type="text" placeholder="Enter branch name" onChange={(e)=>{
                        let val = e.target.value;

                        // If noClone is set to false and there is no value, set it to "main"
                        if(!data.git.noClone && val === "") {
                            val = "main";
                        }
                        setData({
                            ...data,
                            git: {
                                ...data.git,
                                branch: val
                            }
                        })
                    }}
                    value={data.git.branch || ""}
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 space-y-2 w-full">
                <label>Repository requires authentication</label>
                <div className="flex items-center justify-end">
                    <Switch onCheckedChange={()=>{
                        setRequiresAuth(!requiresAuth)
                        setData({
                            ...data,
                            git: {
                                ...data.git,
                                requiresAuth: !data.git.requiresAuth
                            }
                        })
                    }}
                    defaultChecked={data.git.requiresAuth}
                    />
                </div>
                {
                    data.git.requiresAuth ? (
                        <div className="grid grid-cols-2 gap-4 w-full col-span-2">
                            <div className="flex flex-col space-y-2">
                                <label>
                                    Username
                                </label>
                                <Input type="text" placeholder="Enter username" required
                                    onChange={(e)=>{
                                        setData({
                                            ...data,
                                            git: {
                                                ...data.git,
                                                username: e.target.value
                                            }
                                        })
                                    }}
                                    value={data.git.username || ""}
                                />
                            </div>
                            <div className="flex flex-col space-y-2">
                                <label>
                                    Password / Token
                                </label>
                                <Input type="password" placeholder="Enter password" required
                                    onChange={(e)=>{
                                        setData({
                                            ...data,
                                            git: {
                                                ...data.git,
                                                token: e.target.value
                                            }
                                        })
                                    }}
                                    value={data.git.token || ""}
                                />
                            </div>
                            <div className="text-muted-foreground text-sm col-span-2">
                                For Github/Gitlab, you have to use a personal access token with the 'repo' scope instead of a password.
                                Currently there is no support for ssh keys.
                            </div>
                        </div>
                    ) : null
                }
            </div>
            <div className="text-muted-foreground text-sm">
                Git command to be run: git clone <span className="text-primary">{
                    data.git.noClone ? "[repository URL]" : `${data.git.url}`
            }</span> --branch <span className="text-primary">{
                data.git.noClone && data.git.branch ? "[branch name]" : `${data.git.branch || "main"}`
            }</span>
            </div>
            <Separator />
            <div className="flex flex-col space-y-2">
                <label>
                    Build Command
                </label>
                <Input type="text" placeholder="eg. nix-build default.nix or nix build .#my-derivation"
                    onChange={(e)=>{
                        setData({
                            ...data,
                            build: {
                                ...data.build,
                                command: e.target.value
                            }
                        })
                    }}
                    value={data.build.command || ""}
                />
            </div>
            <div className="flex flex-col space-y-2">
                <label>
                    Build Trigger
                </label>
                <Select defaultValue={data.build.buildTrigger} onValueChange={(value)=> {
                    setData({
                        ...data,
                        build: {
                            ...data.build,
                            buildTrigger: value as "manual" | "webhook" | "cron",
                        }
                    })
                    setBuildOption(value)
                }}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select configuration type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="cron">Cron</SelectItem>
                        <SelectItem value="webhook">Webhook</SelectItem>
                    </SelectContent>
                </Select>
                {
                     data.build.buildTrigger === "cron" ? (
                        <div className="flex flex-col space-y-2">
                            <Input type="text" placeholder="Cron" required
                                onChange={(e)=>{
                                    let val = e.target.value;
                                    setData({
                                        ...data,
                                        build: {
                                            ...data.build,
                                            buildTrigger: "cron",
                                            cron: val
                                        }
                                    })
                                }}
                                value={data.build.cron || ""}
                            />
                            <div className="text-muted-foreground text-sm col-span-2">
                                Cron expression to run the build. For example, <strong>0 0 * * *</strong> will run the build every day at midnight.
                            </div>
                        </div>
                    ) : null
                }
                {
                    data.build.buildTrigger === "webhook" ? (
                        <div className="text-muted-foreground text-sm col-span-2">
                            This will generate a webhook URL that you can use to trigger the build. You can use this URL in your Git repository settings to trigger the build on push events.
                        </div>
                    ) : null
                }
                {
                    data.build.buildTrigger === "manual" ? (
                        <div className="text-muted-foreground text-sm col-span-2">
                            With this option you'll only be able to run the build manually from the UI.
                        </div>
                    ) : null
                }
            </div>
        </div>
    )
}