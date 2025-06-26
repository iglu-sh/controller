'use client'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {Progress} from "@/components/ui/progress";
import {ChevronLeft, ChevronRight} from "lucide-react";
import BasicInformation from "@/components/custom/cache/create/basicInformation";
import {Button} from "@/components/ui/button";
import {useState} from "react";
import Steps from "@/components/custom/cache/create/steps";
import Infrastructure from "@/components/custom/cache/create/infrastructure";
import NetworkSecurity from "@/components/custom/cache/create/NetworkSecurity";
import StorageBackup from "@/components/custom/cache/create/storageBackup";
import Monitoring from "@/components/custom/cache/create/monitoring";
import ReviewDeploy from "@/components/custom/cache/create/reviewDeploy";
import type {cache} from "@/types/db";
import type {cacheCreationObject} from "@/types/frontend";

export default function CreateCachePage(){
    const [step, setStep] = useState(1)
    const [cacheToCreate, setCacheToCreate] = useState<cacheCreationObject>({
        name: "",
        githubusername: "",
        ispublic: true,
        permission: "",
        preferredcompressionmethod: "zstd",
        uri: process.env.NEXT_PUBLIC_CACHE_URL!,
        priority: 40,
        id: -1,
        selectedApiKeys: [],
        collectMetrics: false,
        retentionDays: 30,
    })
    const screens = [
        <BasicInformation key={1}/>,
        <Infrastructure key={2}/>,
        <NetworkSecurity key={3}/>,
        <StorageBackup key={4}/>,
        <Monitoring cacheToCreate={cacheToCreate} setCacheToCreate={(data:cacheCreationObject)=>{setCacheToCreate(data)}} key={5}/>,
        <ReviewDeploy cacheToCreate={cacheToCreate} selectedApiKeys={[]} key={6} />
    ]
    return(
        <div className="flex flex-col gap-2 w-full">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold">
                    Create New Cache
                </h1>
                <p className="text-muted-foreground">
                    Set up a new Nix cache with custom configuration
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Step {step} out of 6</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <Progress value={100/6 * step} />
                    <Steps step={step} />
                </CardContent>
            </Card>
            {
                screens[step - 1] ? screens[step - 1] : <div className="text-muted-foreground">Loading...</div>
            }
            <div className="flex flex-row justify-between items-center">
                <Button variant="secondary" disabled={step === 1} onClick={()=>{setStep(step-1)}}><ChevronLeft />Previous</Button>
                <Button onClick={()=>{setStep(step+1)}} disabled={step === 6}>Next<ChevronRight /></Button>
            </div>
        </div>
    )
}