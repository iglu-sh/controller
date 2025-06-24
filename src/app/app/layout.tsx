'use server'
import {SidebarProvider} from "@/components/ui/sidebar";
import AppSidebar from "@/components/custom/Sidebar/Sidebar";
import { auth } from "@/server/auth";
import {redirect} from "next/navigation";
import {api} from "@/trpc/server";
import {HydrateClient} from "@/trpc/server";
import {Toaster} from "@/components/ui/sonner";
import {SessionProvider} from "next-auth/react";
export default async function AppLayout({
                                       children,
}: Readonly<{ children: React.ReactNode }>) {
    // Ensure the user is authenticated before rendering the layout
    const session = await auth()
    if(!session){
        redirect("/")
    }
    const mustShowOOB = await api.user.mustShowOOB(session?.user.session_user.id)
    // Check if the user is an admin and if the user should be shown the onboarding flow
    if(session.user.session_user.show_oob && mustShowOOB){
        redirect("/oob")
    }
    // Prefetch all caches this user has access to
    void api.cache.byUser.prefetch()

    return(
        <HydrateClient>
            <SidebarProvider>
                <SessionProvider>
                    <AppSidebar />
                </SessionProvider>
                <main className="max-w-[800px] w-[800px] ml-auto mr-auto mt-10 max-h-screen flex justify-start items-start">
                    {children}
                </main>
                <Toaster richColors={true} />
            </SidebarProvider>
        </HydrateClient>
    )
}