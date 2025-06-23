import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Key, Package, SearchIcon, Server, Unlock} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import Link from "next/link";
import {auth} from "@/server/auth";
import {redirect} from "next/navigation";
import {Avatar} from "@/components/ui/avatar";
import {api} from "@/trpc/server";
import type {xTheEverythingType} from "@/types/db";
import ClaimableCache from "@/components/custom/oob/claimable/claimableCache";
import Heading from "@/components/custom/oob/heading";
export default async function OOB(){
    const session = await auth()
    if(!session || !session.user || !session.user.session_user.is_admin){
        // If the user is not authenticated, redirect to the login page
        return redirect('/');
    }
    const everything = await api.admin.getCachesPropagated().catch((e)=>{
        console.error("Error fetching caches:", e);
        return [] as xTheEverythingType[];
    })

    return(
        <div className="m-7 flex flex-col gap-4">
            <div className="flex flex-row justify-between">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold">Welcome to Iglu!</h1>
                    <div className="text-sm text-muted-foreground">
                        Let's get you setup with your caches. This will only take a few minutes.
                    </div>
                </div>
                <div className="flex flex-row gap-2 justify-center items-center">
                    <Avatar style={{backgroundColor: session.user.session_user.avatar_color}}
                        className="flex justify-center items-center"
                    >{session.user.session_user.username[0]}</Avatar>
                    <span className="ml-1">{session.user.session_user.username}</span>
                </div>
            </div>
            <Heading caches={everything} />
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold">Claim existing Caches</h2>
                <div className="text-sm text-muted-foreground">
                    Iglu has found some caches that you have created or that were created automatically for you. You can claim them here to manage them through the Controller. <br/>
                    If you do not claim them, they will not be managed by this Controller and you will need to manage them through th CLI or other means.
                </div>
            </div>
            <Card>
                <CardContent className="flex flex-row justify-between items-center">
                    <div className="w-1/3 flex flex-row gap-1">
                        <Input placeholder="Search for caches..."></Input>
                        <Button variant="outline">
                            <SearchIcon />
                        </Button>
                    </div>
                    <div className="flex flex-row gap-1">
                        <Button>Create User</Button>
                        <Link href="https://docs.iglu.sh/docs/Components/Iglu%20Controller">
                            <Button variant="secondary">Documentation</Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
            {
                everything.map((cache, index)=>{
                    return(
                        <ClaimableCache cache={cache} key={index} />
                    )
                })
            }
            <div className="flex flex-row justify-end">
                <Button>Confirm</Button>
            </div>
        </div>
    )
}