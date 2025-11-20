'use server'
import {SidebarProvider} from "@/components/ui/sidebar";
import AppSidebar from "@/components/custom/Sidebar/Sidebar";
import {auth, signOut} from "@/server/auth";
import {redirect} from "next/navigation";
import {api} from "@/trpc/server";
import {HydrateClient} from "@/trpc/server";
import {Toaster} from "@/components/ui/sonner";
import {SessionProvider} from "next-auth/react";
import {headers} from "next/headers";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

export default async function AppLayout({
                                       children,
}: Readonly<{ children: React.ReactNode }>) {
    // Ensure the user is authenticated before rendering the layout
    const session = await auth()
    if(!session){
        redirect("/")
    }
    const mustShowOOB = await api.user.mustShowOOB(session?.user.session_user.id)
    const user = await api.user.getUser().catch(async ()=>{
        // Redirect the user to the sign-in page if the user is not found
        redirect("/api/auth/signin")
    })
    if(!user){
        redirect("/")
    }
    // Check if the user is an admin and if the user should be shown the onboarding flow
    if(session.user.session_user.show_oob && user.show_oob){
        redirect("/oob")
    }
    if(session.user.session_user.must_change_password && user.must_change_password){
        redirect("/user/pw-reset")
    }
    // Prefetch all caches this user has access to
    void api.cache.byUser.prefetch()

    const h = await headers()
    const header_url = h.get('x-current-path')
    return(
        <HydrateClient>
            <SidebarProvider>
                <SessionProvider>
                    <AppSidebar />
                </SessionProvider>
                <main className="max-w-[800px] w-[800px] ml-auto mr-auto mt-10 max-h-screen flex justify-start items-start flex-col">
                    {
                        header_url ?
                            <Breadcrumb className="mb-1.5">
                                <BreadcrumbList className={"gap-0 sm:gap-1"}>
                                    {
                                        header_url.split("/").map((part:string, index:number, arr:string[])=>{
                                            const link = arr.slice(0, index + 1).join("/")
                                            if(index === 0){
                                                return null
                                            }
                                            return(
                                                <div key={index} className="flex flex-row justify-center align-center items-center">
                                                    {
                                                        index === 1 ? null : <BreadcrumbSeparator />
                                                    }
                                                    <BreadcrumbItem >
                                                        {
                                                            arr.length -1 === index ?
                                                                <span key={index} className="capitalize font-semibold text-primary">{part.replace(/-/g, " ")}</span>
                                                                :
                                                                <BreadcrumbLink href={link} className="capitalize" key={index}>{part.replace(/-/g, " ")}</BreadcrumbLink>
                                                        }
                                                    </BreadcrumbItem>
                                                </div>
                                            )
                                        })
                                    }
                                </BreadcrumbList>
                            </Breadcrumb> : null
                    }
                    {children}
                </main>
                <Toaster richColors={true} />
            </SidebarProvider>
        </HydrateClient>
    )
}