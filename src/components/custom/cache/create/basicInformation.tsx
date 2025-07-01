'use client'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {InfoIcon} from "lucide-react";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import type {cacheCreationObject} from "@/types/frontend";

export default function BasicInformation({cacheToCreate, setCacheToCreate}:{cacheToCreate:cacheCreationObject, setCacheToCreate:(cache:cacheCreationObject) => void}){
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
                    <Input value={cacheToCreate.name} onChange={(val)=>{
                        setCacheToCreate({
                            ...cacheToCreate,
                            name: val.target.value
                        });
                    }}/>
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="cacheName" className="font-semibold text-sm">Description</label>
                    <Textarea disabled={true}/>
                </div>
            </CardContent>
        </Card>
    )
}