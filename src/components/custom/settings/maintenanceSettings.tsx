import {cache, userInfoObject} from "@/types/api";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Label} from "@/components/ui/label";
import {Switch} from "@/components/ui/switch";
import {Input} from "@/components/ui/input";
import {Slider} from "@/components/ui/slider";
import {useState} from "react";
import {Button} from "@/components/ui/button";

export default function MaintenanceSettings({cache, userInfoObj}:{cache:cache, userInfoObj:userInfoObject}){
    const [gcThreshold, setGcThreshold] = useState<number>(85);
    const [enableAutoGC, setEnableAutoGC] = useState<boolean>(false);
    return(
        <Card>
            <CardHeader>
                <CardTitle>
                    Maintenance Settings
                </CardTitle>
                <CardDescription>
                    Configure some Maintenance Settings for the cache.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <Label>Enable Automatic Garbage Collection</Label>
                    <div className="items-end justify-end flex">
                        <Switch disabled checked={enableAutoGC} onCheckedChange={() => setEnableAutoGC(!enableAutoGC)}/>
                    </div>
                </div>
                {
                    enableAutoGC ?  (
                       <div className="flex flex-col gap-4">
                           <div className="flex flex-col space-y-2">
                               <Label>
                                   Garbage Collection Schedule (cron fromat)
                               </Label>
                               <Input />
                               <div className="text-sm text-muted-foreground">
                                   Current: Never
                               </div>
                           </div>
                           <div className="flex flex-col space-y-2">
                               <Label>
                                   Package Retention Period (in days)
                               </Label>
                               <Input type="number" defaultValue={cache.retention_period} />
                           </div>
                           <div className="flex flex-col space-y-2">
                               <Label>
                                   Minimum Free Space (in GB)
                               </Label>
                               <Input type="number" defaultValue={cache.min_free_space} />
                           </div>
                           <div className="flex flex-col space-y-2">
                               <Label>
                                   GC Threshold (% disk usage)
                               </Label>
                               <Slider defaultValue={[85]} max={100} step={1}
                                       value={[gcThreshold]}
                                       onValueChange={(value) => {setGcThreshold(value)}}
                               />
                               <div className="grid grid-cols-5">
                                   <div className="text-sm text-muted-foreground col-span-4">
                                       Garbage collection will run automatically when disk usage exceeds this threshold
                                   </div>
                                   <div className="text-sm text-muted-foreground text-right">Current: {gcThreshold}%</div>
                               </div>
                           </div>
                           <Button>Run Garbage Collection Now</Button>
                       </div>
                    ) : null
                }
            </CardContent>
        </Card>
    )
}