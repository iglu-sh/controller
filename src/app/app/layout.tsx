'use client'
import React, {useEffect} from "react";
import './layout.css'
import Navbar from "@/components/custom/navbar";
import {getCookie} from "cookies-next";

export default function CacheOverviewPageLayout(
    {children}: Readonly<{
        children: React.ReactNode;
    }>) {
    useEffect(()=>{
        const apiKey = getCookie("iglu-session");
        if(!apiKey){
            window.location.href = "/"
        }
    })
    return (
        <div>
            <Navbar />
            <div style={{marginLeft: "auto", marginRight: "auto", maxWidth: "900px"}}>
                {children}
            </div>
        </div>
    )
}