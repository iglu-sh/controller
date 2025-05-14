'use client'
import Image from "next/image";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import "./home.css"
import {RefObject, useRef } from "react";
export default function Home() {
    const inputRef:RefObject<null | HTMLInputElement> = useRef(null);
    const handleLogin = () => {
        if(!inputRef.current) return;
        const apiKey = inputRef.current.value;
    }
    return (
        <div className="Home">
            <div>
                <h1>Enter API key to continue</h1>
                <div style={{display: "flex", flexDirection: "row"}}>
                    <Input ref={inputRef}/>
                    <Button variant="outline" style={{marginLeft:"10px"}}>Login</Button>
                </div>
            </div>
        </div>
    );
}
