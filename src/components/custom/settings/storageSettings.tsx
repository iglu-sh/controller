import {Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Switch} from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import {Alert, AlertTitle} from "@/components/ui/alert";
import {Package} from "lucide-react";
import type {cache} from "@/types/api";

export default function StorageSettings({cache, setCacheCallback}:{cache:cache, setCacheCallback:(cache:cache)=>void}){
    console.log(cache)
    return(
        <Card>
            <CardHeader>
                <CardTitle>Storage Settings</CardTitle>
                <CardDescription>Configure storage options for your cache</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="storage-location">Primary Storage Location</Label>
                    <Input
                        id="storage-location"
                        disabled
                        defaultValue={`BASE_PATH/${cache.name}`}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="max-storage">Maximum Storage Size (GB) (-1 for infinite)</Label>
                    <Input
                        id="max-storage"
                        type="number"
                        disabled
                        defaultValue={`unknown`}
                    />
                </div>
                <div className="space-y-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Label htmlFor="compression-level">Preferred Compression Algorithm</Label>
                            </TooltipTrigger>
                            <TooltipContent>
                                <h3>About compression Algorithms</h3>
                                <div>
                                    This setting allows you to choose the <strong>preferred</strong> algorithm for your cache. <br />
                                    The cache will report this to the Cachix client and the nix client, however both of them occasionally will use another compression algorithm if they think it is better for the current situation. <br />
                                    <strong>Note:</strong> If you want to force Cachix to use a specific algorithm while uploading, you can use the '-m' flag.
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <Select onValueChange={(value)=>{
                        const cacheCopy = {...cache};
                        cacheCopy.preferredcompressionmethod = value;
                        setCacheCallback(cacheCopy);
                    }}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder={cache.preferredcompressionmethod}></SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="XZ">XZ</SelectItem>
                            <SelectItem value="ZSTD">ZSTD</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center justify-between">
                    <Label htmlFor="enable-deduplication">Enable Deduplication (Not implemented)</Label>
                    <Switch
                        id="enable-deduplication"
                        disabled
                    />
                </div>
            </CardContent>
        </Card>
    )
}