import {auth} from "@/server/auth";
import Link from "next/link";


export default async function User(){
  const session = await auth()
  const userData = session?.user.session_user
  return(
    <div className="w-full items-center">
      <h1 className="text-3xl font-bold">
        Profile
      </h1>


      <table className="m-auto mt-20">
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
    </div>
  )
}
