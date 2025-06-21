'use client'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {InfoIcon} from "lucide-react";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";

export default function BasicInformation(){
    return(
        <Card>
            <CardHeader>
                <CardTitle className="flex flex-row items-center gap-2">
                    <InfoIcon />
                    <h2 className="text-2xl font-bold flex flex-row items-center gap-2">
                        Basic Information
                    </h2>
                </CardTitle>
                <CardDescription>
                    Cache name, description, and environment
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <label htmlFor="cacheName" className="font-semibold text-sm">Cache Name *</label>
                    <Input />
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="cacheName" className="font-semibold text-sm">Description</label>
                    <Textarea />
                </div>
            </CardContent>
        </Card>
    )
}