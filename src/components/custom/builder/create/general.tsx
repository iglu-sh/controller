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

export default function General(){
    const [requiresAuth, setRequiresAuth] = useState(false);
    return(
        <div className="flex flex-col gap-4 w-full mt-3">
            <div className="flex flex-col space-y-2 w-full">
                <label className="">Configuration Name</label>
                <Input type="text" placeholder="Enter configuration name"></Input>
            </div>
            <div className="flex flex-col space-y-2 w-full">
                <label className="">Description</label>
                <Textarea placeholder="Enter configuration description" />
            </div>
            <div className="flex flex-col space-y-2 w-full">
                <label>Git Repository URL</label>
                <Input type="url" placeholder="Enter configuration Git repository URL" />
                <div className="text-muted-foreground text-sm">
                    You may also not provide git settings and use a nix command in the format of: nix build github:repo_name/flake_name#my-derivation
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2 w-full">
                    <label>Branch</label>
                    <Input type="text" placeholder="Enter branch name" />
                </div>
                <div className="flex flex-col space-y-2 w-full">
                   <label>Config Type</label>
                    <Select required>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select configuration type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="nix">configuration.nix</SelectItem>
                            <SelectItem value="flake">flake.nix</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-2 space-y-2 w-full">
                <label>Repository requires authentication</label>
                <div className="flex items-center justify-end">
                    <Switch onCheckedChange={()=>setRequiresAuth(!requiresAuth)}/>
                </div>
                {
                    requiresAuth ? (
                        <div className="grid grid-cols-2 gap-4 w-full col-span-2">
                            <div className="flex flex-col space-y-2">
                                <label>
                                    Username
                                </label>
                                <Input type="text" placeholder="Enter username" required />
                            </div>
                            <div className="flex flex-col space-y-2">
                                <label>
                                    Password / Token
                                </label>
                                <Input type="password" placeholder="Enter password" required />
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
                Git command to be run: git clone <span className="text-primary">[repository URL]</span> --branch <span className="text-primary">[branch]</span>
            </div>
            <Separator />
            <div className="flex flex-col space-y-2">
                <label>
                    Build Command
                </label>
                <Input type="text" placeholder="eg. nix-build default.nix or nix build .#my-derivation"/>
            </div>
            <div className="flex flex-col space-y-2">
                <label>
                    Output Directory
                </label>
                <Input type="text" placeholder="eg. result or ./result" defaultValue="./result" />
                <div className="text-muted-foreground text-sm">
                    You'll have to change this setting <strong>only</strong> if you are using a custom build command that changes the output location of your build. This is important for cachix to push to the cache
                </div>
            </div>
        </div>
    )
}