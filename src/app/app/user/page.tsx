import {auth} from "@/server/auth";
import Link from "next/link";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";


export default async function User(){
  const session = await auth()
  const userData = session?.user.session_user
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
      <div>
        <Card>
          <table className="m-auto table">
            <tbody>
              <tr>
                <th className="text-xl text-left pr-10">Username:</th>
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
      </div>
    </div>
  )
}
