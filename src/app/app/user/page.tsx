'use client'
import { Dot, User } from "lucide-react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {api} from "@/trpc/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import EditUser from "@/components/custom/user/edit";
import {SessionProvider, useSession} from "next-auth/react";

export default function UserPageSessionWrapper(){
    return(
        <SessionProvider>
            <UserPage />
        </SessionProvider>
    )
}
export function UserPage(){
    const session = useSession()
    const sessionData = session.data ? session.data.user.session_user : null
  const caches_api = api.cache.byUser.useQuery()
    const caches = caches_api.data
  const keys_api = api.user.getApiKeys.useQuery()
    const keys = keys_api.data

  const {data} = api.user.getUserWithKeysAndCaches.useQuery()

  return(
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-row justify-betweeni items-center w-full">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold">
            Profile
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your profile information
          </p>
        </div>
        <div className="flex flex-row gap-2">
            {
                data?.[0] ? <EditUser userData={data[0]} /> : <></>
            }
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex flex-row items-center gap-2">
              <User/>
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-[min-content_1fr] gap-10">
            <Avatar className="w-30 h-30">
                <AvatarFallback style={{backgroundColor: session.data ? session.data.user.session_user.avatar_color : "#000000", color: "white"}} >
                    {session.data ? session.data.user.session_user.username : "U"}
                </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-xl font-bold">
                {sessionData?.username}
              </div>
              <br/>
            <div className="w-full flex flex-row">
                {sessionData?.email}
                <Dot/>
                <Badge variant={sessionData?.is_admin ? "default" : "secondary"}>{sessionData?.is_admin ? "Admin" : "Inuit"}</Badge>
                <Dot/>
                Ownes {caches?.length} {caches?.length != 1 ? "Caches" : "Cache"}
                <Dot/>
                Ownes {keys?.length} {keys?.length != 1 ? "Keys" : "Key"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
