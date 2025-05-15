'use client'
import Image from "next/image";
import { setCookie } from 'cookies-next/client';
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import "./home.css"
import {RefObject, useRef } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {Radio_Canada} from "next/dist/compiled/@next/font/dist/google";
export default function Home() {
    const inputRef:RefObject<null | HTMLInputElement> = useRef(null);
    const keepLoggedInRef:RefObject<null | HTMLInputElement> = useRef(null);
    const handleLogin = async () => {
        if(!inputRef.current || !inputRef.current.value){
            toast("Please enter a valid API key")
            return
        }
        const apiKey = inputRef.current.value;
        const keepLoggedIn = keepLoggedInRef.current?.checked;
        const headers = new Headers()
        headers.append("Authorization", `Bearer ${apiKey}`)
        const requestOptions = {
            method: 'GET',
            headers: headers,
            redirect: 'follow'
        }
        // @ts-ignore
        await fetch(`${process.env.NEXT_PUBLIC_URL}/api/v1/caches`, requestOptions)
            .then(response => {
                if(response.status === 200){
                    const cookieOptions = {
                        maxAge: keepLoggedIn ? 60 * 60 * 24 * 7 : 0, // 7 days or session
                    }
                    setCookie('iglu-session', apiKey, cookieOptions)
                    window.location.href = "/app/caches"

                }
                else{
                    toast("Invalid API key")
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }
    return (
        <div className="Home">
            <div>
                <h1>Enter API key to continue</h1>
                <div style={{display: "flex", flexDirection: "row"}}>
                    <Input ref={inputRef}/>
                    <Button variant="outline" style={{marginLeft:"10px"}} onClick={handleLogin}>Login</Button>
                </div>
                <div style={{display: "flex", flexDirection: "row"}}>
                    <input type="checkbox" ref={keepLoggedInRef} name="keepLoggedIn" id="keepLoggedIn"/>
                    <label htmlFor="keepLoggedIn">Keep me logged in for 7 days</label>
                </div>
            </div>
            <Toaster/>
        </div>
    );
}
