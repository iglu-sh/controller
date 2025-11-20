import {auth} from "@/server/auth";
import { Database, Hammer, User } from "lucide-react";
import Link from "next/link";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {api} from "@/trpc/server";


export default async function UserPage(){
  const session = await auth()
  const userData = session?.user.session_user

  const cache = await api.cache.byUser()
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
      </div>
      <div className="grid grid-cols-1 gap-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex flex-row items-center gap-2">
              <User/>
              Account
            </CardTitle>
          </CardHeader>
          <table className="m-auto table border-spacing-2 border-separate">
            <tbody>
              <tr>
                <th className="text-xl text-left">Username:</th>
                <td className="text-xl">{userData?.username}</td>
              </tr>
              <tr>
                <th className="text-xl text-left">Email:</th>
                <td className="text-xl">{userData?.email}</td>
              </tr>
              <tr>
                <th className="text-xl text-left">Adminuser:</th>
                <td className="text-xl"><input type="checkbox" name="" id="" checked={userData?.is_admin} readOnly inputMode="none"/></td>
              </tr>
              <tr>
                <th className="text-xl text-left">Password:</th>
                <td className="text-xl"><Link href="/user/pw-reset" className="text-(--primary)">reset</Link></td>
              </tr>
            </tbody>
          </table>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex flex-row items-center gap-2">
              <Database/>
              Caches
            </CardTitle>
            <CardContent className="grid grid-cols-2 gap-2">

            {cache.map(c => {
              return (
                <Card key={c.id} className="bg-(--secondary)/25">
                  <CardHeader>
                    <CardTitle className="text-bold text-xl">{c.uri}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <table className="m-auto table border-spacing-2 border-separate">
                      <tbody>
                        <tr>
                          <th className="text-m text-left">Name:</th>
                          <td className="text-m">{c.name}</td>
                        </tr>
                        <tr>
                          <th className="text-m text-left">ID:</th>
                          <td className="text-m">{c.id}</td>
                        </tr>
                        <tr>
                          <th className="text-m text-left">Public:</th>
                          <td className="text-m"><input type="checkbox" name="" id="" checked={c.ispublic} readOnly inputMode="none"/></td>
                        </tr>
                        <tr>
                          <th className="text-m text-left">Permission:</th>
                          <td className="text-m">{c.permission ? c.permission : "NONE"}</td>
                        </tr>
                        <tr>
                          <th className="text-m text-left">Compression:</th>
                          <td className="text-m">{c.preferredcompressionmethod}</td>
                        </tr>
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )
            })}
            </CardContent>

          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex flex-row items-center gap-2">
              <Hammer/>
              Builders 
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
