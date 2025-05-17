'use client'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import {useEffect, useState} from "react";
import {cacheInfoObject, userInfoObject} from "@/types/api";
import {getCookie} from "cookies-next";
import {Toaster} from "@/components/ui/sonner";
import {toast} from 'sonner'
import Link from "next/link";
import {Button} from "@/components/ui/button";
import CacheOverviewTable from "@/components/custom/dashboard/cacheOverviewTable";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import { ArrowDown, ArrowUp, Clock, Download, HardDrive, Package } from "lucide-react"
import {CacheActivityChart} from "@/components/custom/dashboard/cache-activity-chart";

export default function Home(){
    return(
        <div>
            <h1>
                Dashboard
            </h1>
            Seems like this is the Dashboard!
        </div>
    )
}