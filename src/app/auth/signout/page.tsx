'use client'
import {signOut} from "next-auth/react";
import {useEffect, useState} from "react";
import Link from "next/link";
import {Button} from "@/components/ui/button";

export default function SignOutPage(){
    useEffect(() => {
        if(window){
            void signOut({redirect: false})
        }
    }, []);
    return(
        <div className="flex items-center justify-center h-screen w-full">
            <div className="w-full max-w-md px-4 text-center flex flex-col gap-2">
                <h1 className="text-2xl font-bold">Sign Out</h1>
                <p>You have been signed out successfully.</p>
                <div>
                    <Link href="/auth/signin"><Button>Go back to Login</Button></Link>
                </div>
            </div>
        </div>
    )
}