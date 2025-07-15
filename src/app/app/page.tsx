import {auth} from "@/server/auth";
import {redirect} from "next/navigation";
import {api} from "@/trpc/server";

export default async function App(){

    const session = await auth();
    if(!session || !session.user){
        redirect("/")
    }
    void api.cache.byUser.prefetch()
    return(
        <div>
            <div className="flex flex-col">
                <h1 className="text-3xl font-bold">
                    Welcome to Better Controller
                </h1>
                <p className="mt-2">
                    This is the main application page.
                </p>
            </div>
        </div>
    )
}