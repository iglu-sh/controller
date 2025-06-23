import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {HardDrive} from "lucide-react";
import {Switch} from "@/components/ui/switch";
import {Input} from "@/components/ui/input";

export default function StorageBackup(){
    return(
        <Card>
            <CardHeader>
                <CardTitle className="flex flex-row items-center gap-2">
                    <HardDrive />
                    <h2 className="text-2xl font-bold flex flex-row items-center gap-2">
                        Basic Information
                    </h2>
                </CardTitle>
                <CardDescription>
                    Storage configuration and backup policies
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className="flex flex-row justify-between items-center">
                    <div className="flex flex-col">
                        <strong>
                            Enable Deduplication
                        </strong>
                        <div className="text-sm text-muted-foreground">
                            Reduce storage usage by eliminating duplicate data.
                        </div>
                    </div>
                    <Switch defaultChecked={false} disabled />
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex flex-col">
                        <strong>
                            Retention Policy (days)
                        </strong>
                        <div className="text-sm text-muted-foreground">
                            Packages older than this will be automatically deleted.
                        </div>
                    </div>
                    <Input type="text" />
                </div>
            </CardContent>

        </Card>
    )
}