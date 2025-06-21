'use client'
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {Progress} from "@/components/ui/progress";
import {ChevronLeft, ChevronRight, CircleCheck, Server} from "lucide-react";
import BasicInformation from "@/components/custom/cache/create/basicInformation";
import {Button} from "@/components/ui/button";
import {useState} from "react";
import Steps from "@/components/custom/cache/create/steps";
import Infrastructure from "@/components/custom/cache/create/infrastructure";
import NetworkSecurity from "@/components/custom/cache/create/NetworkSecurity";

export default function CreateCachePage(){
    const [step, setStep] = useState(1)
    const screens = [
        <BasicInformation />,
        <Infrastructure />,
        <NetworkSecurity />
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
                    <CardTitle>Step {step} out of 7</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <Progress value={100/7 * step} />
                    <Steps step={step} />
                </CardContent>
            </Card>
            {
                screens[step - 1] ? screens[step - 1] : <div className="text-muted-foreground">Loading...</div>
            }
            <div className="flex flex-row justify-between items-center">
                <Button variant="secondary" disabled={step === 1} onClick={()=>{setStep(step-1)}}><ChevronLeft />Previous</Button>
                <Button onClick={()=>{setStep(step+1)}} disabled={step === 7}>Previous<ChevronRight /></Button>
            </div>
        </div>
    )
}